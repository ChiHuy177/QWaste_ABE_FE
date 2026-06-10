'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Modal,
    Typography,
    message,
    Table,
    Tabs,
    Tag,
    Select,
    Button,
    theme,
    Skeleton,
    Grid,
} from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
    RuntimeAnalyticsChart,
    SimpleLineChart,
    MachineDetailAreaChart,
    QuickSelectFilter,
    formatHours,
    parseChartData,
    ParsedChartData,
} from '@/components/shared/AnalyticsCharts';
import { SpaceService } from '@/services/SpaceService';
import { MachineStatusSummaryItem, MachineErrorDetailItem } from '@/types/Monitoring';
import { chartColors } from '@/configs/antdTheme';
import { SearchInput } from '@/components/shared/SearchInput/SearchInput';
import { useAppSelector } from '@/stores/hook';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { collectAllMachines } from '@/utils/spaceStatsUtils';
import {
    DemoFactoryOverviewService,
    USE_MOCK_FACTORY_OVERVIEW,
} from '@/mockData/admin/factory';

const { Title, Text } = Typography;

interface ErrorMetricItem {
    id: string;
    name: string;
    value: number;
}

interface ErrorAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    spaceId: number | null;
    filterId: number | null;
    startDate: string;
    endDate: string;
    isDateRange: boolean;
}

const getMachineAverageMetrics = (
    chartData: ParsedChartData,
    allowedIds: Set<string>
): ErrorMetricItem[] =>
    chartData.machines
        .filter((machine) => allowedIds.has(machine.id))
        .map((machine) => {
            let total = 0;
            let count = 0;

            chartData.data.forEach((point) => {
                const value = Number(point[machine.id]);
                if (Number.isFinite(value)) {
                    total += value;
                    count += 1;
                }
            });

            return {
                id: machine.id,
                name: machine.name,
                value: count > 0 ? total / count : machine.totalValue,
            };
        })
        .filter((machine) => machine.value > 0);

const ErrorAnalyticsModal: React.FC<ErrorAnalyticsModalProps> = ({
    isOpen,
    onClose,
    spaceId,
    filterId,
    startDate,
    endDate,
    isDateRange,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const isXs = screens.xs === true;

    const [loading, setLoading] = useState(false);
    const [mtbfData, setMtbfData] = useState<ParsedChartData>({ data: [], machines: [] });
    const [mttrData, setMttrData] = useState<ParsedChartData>({ data: [], machines: [] });
    const [filterMode, setFilterMode] = useState<'CUSTOM' | 'TOP_10_HIGH' | 'TOP_10_LOW'>('CUSTOM');
    const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
    const [hoveredMachineId, setHoveredMachineId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentSortedData, setCurrentSortedData] = useState<MachineStatusSummaryItem[] | null>(
        null
    );
    const [summaryData, setSummaryData] = useState<MachineStatusSummaryItem[]>([]);
    const [selectedRow, setSelectedRow] = useState<MachineStatusSummaryItem | null>(null);
    const [searchText, setSearchText] = useState('');
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | 'all' | null>('all');
    const [errorDetails, setErrorDetails] = useState<MachineErrorDetailItem[]>([]);
    const [loadingErrorDetails, setLoadingErrorDetails] = useState(false);

    const { spaceData } = useAppSelector(
        (state) => state.factoryOverview
    ) as IFactoryOverviewStoreState;

    const workshopOptions = useMemo(() => {
        if (!spaceData || !spaceData.children) return [];
        return [
            { label: t('common.all'), value: 'all' },
            ...spaceData.children.map((child) => ({
                label: child.spaceName,
                value: child.spaceId,
            })),
        ];
    }, [spaceData, t]);

    const machineWorkshopMap = useMemo(() => {
        const map = new Map<string, number>();
        if (!spaceData) return map;
        spaceData.children.forEach((workshop) => {
            const machines = collectAllMachines(workshop);
            machines.forEach((m) => map.set(m.machineId, workshop.spaceId));
        });
        return map;
    }, [spaceData]);

    const filteredSummaryData = useMemo(() => {
        let result = summaryData;

        if (selectedWorkshopId !== null && selectedWorkshopId !== 'all') {
            result = result.filter(
                (item) => machineWorkshopMap.get(item.machineId) === selectedWorkshopId
            );
        }

        if (searchText.trim() !== '') {
            const lowerSearch = searchText.toLowerCase();
            result = result.filter((item) => item.machineName.toLowerCase().includes(lowerSearch));
        }

        return result;
    }, [summaryData, searchText, selectedWorkshopId, machineWorkshopMap]);

    const filteredMachineIds = useMemo(
        () => new Set(filteredSummaryData.map((item) => item.machineId)),
        [filteredSummaryData]
    );

    const runtimeOptions = useMemo(
        () =>
            filteredSummaryData.map((item) => ({ label: item.machineName, value: item.machineId })),
        [filteredSummaryData]
    );
    const allRuntimeIds = useMemo(
        () => filteredSummaryData.map((item) => item.machineId),
        [filteredSummaryData]
    );

    const { top10HighRuntimeIds, top10LowRuntimeIds, top10HighErrorIds, top10LowErrorIds } =
        useMemo(() => {
            const sortedByRuntime = [...filteredSummaryData].sort(
                (a, b) => b.totalRuntimeHours - a.totalRuntimeHours
            );
            const sortedByError = [...filteredSummaryData].sort(
                (a, b) => b.totalErrorHours - a.totalErrorHours
            );

            return {
                top10HighRuntimeIds: sortedByRuntime.slice(0, 10).map((m) => m.machineId),
                top10LowRuntimeIds: [...sortedByRuntime]
                    .reverse()
                    .slice(0, 10)
                    .map((m) => m.machineId),
                top10HighErrorIds: sortedByError.slice(0, 10).map((m) => m.machineId),
                top10LowErrorIds: [...sortedByError]
                    .reverse()
                    .slice(0, 10)
                    .map((m) => m.machineId),
            };
        }, [filteredSummaryData]);

    const handleFilterChange = useCallback(
        (newIds: string[], tabType: 'runtime' | 'error') => {
            const isTop10High =
                tabType === 'runtime'
                    ? newIds.length > 0 &&
                    newIds.length === top10HighRuntimeIds.length &&
                    top10HighRuntimeIds.every((id) => newIds.includes(id))
                    : newIds.length > 0 &&
                    newIds.length === top10HighErrorIds.length &&
                    top10HighErrorIds.every((id) => newIds.includes(id));

            const isTop10Low =
                tabType === 'runtime'
                    ? newIds.length > 0 &&
                    newIds.length === top10LowRuntimeIds.length &&
                    top10LowRuntimeIds.every((id) => newIds.includes(id))
                    : newIds.length > 0 &&
                    newIds.length === top10LowErrorIds.length &&
                    top10LowErrorIds.every((id) => newIds.includes(id));

            if (isTop10High) {
                setFilterMode('TOP_10_HIGH');
            } else if (isTop10Low) {
                setFilterMode('TOP_10_LOW');
            } else {
                setFilterMode('CUSTOM');
                setCustomSelectedIds(newIds);
            }
        },
        [top10HighRuntimeIds, top10LowRuntimeIds, top10HighErrorIds, top10LowErrorIds]
    );

    const effectiveRuntimeIds = useMemo(() => {
        let ids = customSelectedIds;
        if (filterMode === 'TOP_10_HIGH') ids = top10HighRuntimeIds;
        if (filterMode === 'TOP_10_LOW') ids = top10LowRuntimeIds;
        return ids.filter((id) => filteredMachineIds.has(id));
    }, [
        filterMode,
        customSelectedIds,
        top10HighRuntimeIds,
        top10LowRuntimeIds,
        filteredMachineIds,
    ]);

    const effectiveErrorIds = useMemo(() => {
        let ids = customSelectedIds;
        if (filterMode === 'TOP_10_HIGH') ids = top10HighErrorIds;
        if (filterMode === 'TOP_10_LOW') ids = top10LowErrorIds;
        return ids.filter((id) => filteredMachineIds.has(id));
    }, [filterMode, customSelectedIds, top10HighErrorIds, top10LowErrorIds, filteredMachineIds]);

    useEffect(() => {
        if (!isOpen || !spaceId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let mtbfRes, mttrRes, summaryRes;

                if (isDateRange) {
                    [mtbfRes, mttrRes, summaryRes] = await Promise.all([
                        USE_MOCK_FACTORY_OVERVIEW
                            ? DemoFactoryOverviewService.getMtbf()
                            : SpaceService.getMtbfByDateRange(startDate, endDate, spaceId),
                        USE_MOCK_FACTORY_OVERVIEW
                            ? DemoFactoryOverviewService.getMttr()
                            : SpaceService.getMttrByDateRange(startDate, endDate, spaceId),
                        USE_MOCK_FACTORY_OVERVIEW
                            ? DemoFactoryOverviewService.getMachineStatusSummary()
                            : SpaceService.getMachineStatusSummaryByDateRange(
                                startDate,
                                endDate,
                                spaceId,
                                filterId ?? undefined
                            ),
                    ]);
                } else {
                    if (!filterId) throw new Error('Filter ID is required');
                    [mtbfRes, mttrRes, summaryRes] = await Promise.all([
                        USE_MOCK_FACTORY_OVERVIEW
                            ? DemoFactoryOverviewService.getMtbf()
                            : SpaceService.getMtbfByFilter(filterId, spaceId),
                        USE_MOCK_FACTORY_OVERVIEW
                            ? DemoFactoryOverviewService.getMttr()
                            : SpaceService.getMttrByFilter(filterId, spaceId),
                        USE_MOCK_FACTORY_OVERVIEW
                            ? DemoFactoryOverviewService.getMachineStatusSummary()
                            : SpaceService.getMachineStatusSummaryByFilter(filterId, spaceId),
                    ]);
                }

                const parsedMtbf = parseChartData(mtbfRes);
                const parsedMttr = parseChartData(mttrRes);
                setMtbfData(parsedMtbf);
                setMttrData(parsedMttr);

                const primaryMachines =
                    parsedMtbf.machines.length > 0 ? parsedMtbf.machines : parsedMttr.machines;
                const items: MachineStatusSummaryItem[] = Array.isArray(summaryRes?.data)
                    ? summaryRes.data
                    : [];
                setSummaryData(items);

                const allInitialIds = new Set([
                    ...primaryMachines.map((m) => m.id),
                    ...items.map((i) => i.machineId),
                ]);
                setCustomSelectedIds(Array.from(allInitialIds));
                setFilterMode('CUSTOM');
            } catch (error) {
                console.error('Failed to fetch analytics data', error);
                message.error('Không tải được dữ liệu phân tích');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, spaceId, filterId, startDate, endDate, isDateRange]);

    useEffect(() => {
        if (!selectedRow) {
            setErrorDetails([]);
            return;
        }

        const fetchErrorDetails = async () => {
            setLoadingErrorDetails(true);
            try {
                let res;
                if (isDateRange) {
                    res = USE_MOCK_FACTORY_OVERVIEW
                        ? await DemoFactoryOverviewService.getErrorDetail(selectedRow.machineId)
                        : await SpaceService.getErrorDetailByDateRange(
                            startDate,
                            endDate,
                            selectedRow.machineId,
                            filterId ?? undefined
                        );
                } else {
                    if (!filterId) throw new Error('Filter ID is required');
                    res = USE_MOCK_FACTORY_OVERVIEW
                        ? await DemoFactoryOverviewService.getErrorDetail(selectedRow.machineId)
                        : await SpaceService.getErrorDetailByFilter(
                            filterId,
                            selectedRow.machineId
                        );
                }
                const items = Array.isArray(res?.errors) ? res.errors : [];
                setErrorDetails(items);
            } catch (error) {
                console.error('Failed to fetch error details', error);
                message.error('Không tải được chi tiết lỗi');
            } finally {
                setLoadingErrorDetails(false);
            }
        };

        fetchErrorDetails();
    }, [selectedRow, filterId, startDate, endDate, isDateRange]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedRow(null);
            setSearchText('');
            setSelectedWorkshopId('all');
        }
    }, [isOpen]);

    useEffect(() => {
        setCurrentPage(1);
        setCurrentSortedData(null);
    }, [filteredSummaryData]);

    const handleBarClick = useCallback(
        (machineId: string) => {
            setHoveredMachineId(machineId);

            const dataToSearch = currentSortedData || filteredSummaryData;
            const index = dataToSearch.findIndex((item) => item.machineId === machineId);

            if (index !== -1) {
                const targetPage = Math.floor(index / 12) + 1;
                setCurrentPage(targetPage);
            }

            setTimeout(() => {
                const row = document.querySelector(`tr[data-row-key="${machineId}"]`);
                if (row) {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

            setTimeout(() => {
                setHoveredMachineId((prev) => (prev === machineId ? null : prev));
            }, 3000);
        },
        [filteredSummaryData, currentSortedData]
    );

    const errorColumns: ColumnsType<MachineErrorDetailItem> = useMemo(
        () => [
            {
                title: t('factoryOverview.table.header.start'),
                dataIndex: 'startTime',
                key: 'startTime',
                width: 140,
                sorter: (a, b) =>
                    new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime(),
                render: (v) => (v ? new Date(v).toLocaleString() : '—'),
            },
            {
                title: t('factoryOverview.table.header.end'),
                dataIndex: 'endTime',
                key: 'endTime',
                width: 140,
                sorter: (a, b) =>
                    new Date(a.endTime || 0).getTime() - new Date(b.endTime || 0).getTime(),
                render: (v) => (v ? new Date(v).toLocaleString() : '—'),
            },
            {
                title: t('factoryOverview.table.header.duration'),
                dataIndex: 'durationHours',
                key: 'durationHours',
                align: 'right',
                width: 100,
                sorter: (a, b) => (Number(a.durationHours) || 0) - (Number(b.durationHours) || 0),
                render: (v) => (v != null ? formatHours(Number(v)) : '—'),
            },
        ],
        [t]
    );

    const tableColumns: ColumnsType<MachineStatusSummaryItem> = useMemo(
        () => [
            {
                title: t('factoryOverview.table.header.machineName'),
                dataIndex: 'machineName',
                key: 'machineName',
                width: 140,
                ellipsis: true,
                render: (v: string) => <Text strong>{v}</Text>,
            },
            {
                title: t('factoryOverview.table.header.runTime'),
                dataIndex: 'totalRuntimeHours',
                key: 'totalRuntimeHours',
                align: 'right' as const,
                sorter: (a, b) => (a.totalRuntimeHours || 0) - (b.totalRuntimeHours || 0),
                render: (v: number, row: MachineStatusSummaryItem) => {
                    const total =
                        row.totalRuntimeHours +
                        row.totalIdleHours +
                        row.totalErrorHours +
                        row.totalOfflineHours;
                    const pct = total > 0 ? Math.round((row.totalRuntimeHours / total) * 100) : 0;
                    return (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 2,
                            }}
                        >
                            <Text>{formatHours(v)}</Text>
                            <Tag
                                color={pct >= 90 ? 'success' : pct >= 75 ? 'warning' : 'error'}
                                style={{ margin: 0, fontSize: 11 }}
                            >
                                {pct}%
                            </Tag>
                        </div>
                    );
                },
            },
            {
                title: t('factoryOverview.table.header.stopTime'),
                dataIndex: 'totalIdleHours',
                key: 'totalIdleHours',
                align: 'right' as const,
                sorter: (a, b) => (a.totalIdleHours || 0) - (b.totalIdleHours || 0),
                render: (v: number) => <Text type="secondary">{formatHours(v)}</Text>,
            },
            {
                title: t('factoryOverview.table.header.errorTime'),
                dataIndex: 'totalErrorHours',
                key: 'totalErrorHours',
                align: 'right' as const,
                sorter: (a, b) => (a.totalErrorHours || 0) - (b.totalErrorHours || 0),
                render: (v: number) => <Text type="danger">{formatHours(v)}</Text>,
            },
            {
                title: t('factoryOverview.table.header.offlineTime'),
                dataIndex: 'totalOfflineHours',
                key: 'totalOfflineHours',
                align: 'right' as const,
                sorter: (a, b) => (a.totalOfflineHours || 0) - (b.totalOfflineHours || 0),
                render: (v: number) => (
                    <Text style={{ color: token.colorTextQuaternary }}>{formatHours(v)}</Text>
                ),
            },
        ],
        [token, t]
    );

    const rightTabItems = useMemo(() => {
        return [
            {
                key: 'runtime',
                label: t('factoryOverview.tabs.runtimeAnalytics'),
                children: (
                    <div
                        style={{
                            paddingTop: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            height: isMobile ? 400 : 'calc(95vh - 195px)',
                            gap: 8,
                            overflow: 'hidden',
                        }}
                    >
                        {!selectedRow && runtimeOptions.length > 0 && (
                            <QuickSelectFilter
                                allIds={allRuntimeIds}
                                selectedIds={effectiveRuntimeIds}
                                onChange={(ids) => handleFilterChange(ids, 'runtime')}
                                options={runtimeOptions}
                                top10HighIds={top10HighRuntimeIds}
                                top10LowIds={top10LowRuntimeIds}
                                placeholder={t('factoryOverview.filter.selectMachines')}
                            />
                        )}
                        {selectedRow ? (
                            <MachineDetailAreaChart
                                selectedRow={selectedRow}
                                filterId={filterId}
                                startDate={startDate}
                                endDate={endDate}
                                isDateRange={isDateRange}
                            />
                        ) : (
                            <RuntimeAnalyticsChart
                                summaryData={filteredSummaryData}
                                selectedIds={effectiveRuntimeIds}
                                onBarClick={handleBarClick}
                            />
                        )}
                    </div>
                ),
            },
            {
                key: 'error',
                label: t('factoryOverview.tabs.errorAnalytics'),
                children: (() => {
                    const activeMachinesForError = selectedRow
                        ? [selectedRow.machineId]
                        : effectiveErrorIds;
                    const activeMachineSet = new Set(activeMachinesForError);
                    const mttrRanking = getMachineAverageMetrics(mttrData, activeMachineSet)
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5);
                    const mtbfRanking = getMachineAverageMetrics(mtbfData, activeMachineSet)
                        .sort((a, b) => a.value - b.value)
                        .slice(0, 5);
                    const worstMttr = mttrRanking[0];
                    const worstMtbf = mtbfRanking[0];
                    const trendMachineIds =
                        selectedRow || activeMachinesForError.length <= 5
                            ? activeMachinesForError
                            : Array.from(
                                new Set([
                                    ...mttrRanking.slice(0, 3).map((machine) => machine.id),
                                    ...mtbfRanking.slice(0, 3).map((machine) => machine.id),
                                ])
                            ).slice(0, 5);

                    const sharedMachines = (
                        mttrData.machines.length > 0 ? mttrData.machines : mtbfData.machines
                    ).filter((m) => trendMachineIds.includes(m.id));
                    const maxMttrValue = Math.max(...mttrRanking.map((machine) => machine.value), 1);
                    const maxMtbfValue = Math.max(...mtbfRanking.map((machine) => machine.value), 1);
                    const selectedMttrMetric = selectedRow
                        ? getMachineAverageMetrics(mttrData, activeMachineSet)[0]
                        : undefined;
                    const selectedMtbfMetric = selectedRow
                        ? getMachineAverageMetrics(mtbfData, activeMachineSet)[0]
                        : undefined;

                    return (
                        <div
                            style={{
                                paddingTop: 8,
                                display: 'flex',
                                flexDirection: 'column' as const,
                                height: isMobile ? 650 : 'calc(95vh - 195px)',
                                gap: 8,
                                overflow: 'hidden',
                            }}
                        >
                            {!selectedRow && runtimeOptions.length > 0 && (
                                <QuickSelectFilter
                                    allIds={allRuntimeIds}
                                    selectedIds={effectiveErrorIds}
                                    onChange={(ids) => handleFilterChange(ids, 'error')}
                                    options={runtimeOptions}
                                    top10HighIds={top10HighErrorIds}
                                    top10LowIds={top10LowErrorIds}
                                    placeholder={t('factoryOverview.filter.selectMachines')}
                                />
                            )}

                            {selectedRow ? (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: isXs ? '1fr 1fr' : 'repeat(4, 1fr)',
                                        gap: 8,
                                        flexShrink: 0,
                                    }}
                                >
                                    {[
                                        {
                                            label: t('factoryOverview.errorAnalytics.avgMttr'),
                                            value: selectedMttrMetric
                                                ? formatHours(selectedMttrMetric.value)
                                                : '-',
                                            color: token.colorError,
                                            bg: token.colorErrorBg,
                                        },
                                        {
                                            label: t('factoryOverview.errorAnalytics.avgMtbf'),
                                            value: selectedMtbfMetric
                                                ? formatHours(selectedMtbfMetric.value)
                                                : '-',
                                            color: token.colorWarning,
                                            bg: token.colorWarningBg,
                                        },
                                        {
                                            label: t('factoryOverview.stats.totalErrorTime'),
                                            value: formatHours(selectedRow.totalErrorHours),
                                            color: token.colorError,
                                            bg: token.colorErrorBg,
                                        },
                                        {
                                            label: t('factoryOverview.errorAnalytics.errorEvents'),
                                            value: errorDetails.length.toString(),
                                            color: token.colorText,
                                            bg: token.colorFillAlter,
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: token.borderRadiusLG,
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                                background: item.bg || token.colorFillAlter,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Text
                                                ellipsis
                                                style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    color: token.colorTextSecondary,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                            <Text strong style={{ color: item.color, fontSize: 16 }}>
                                                {item.value}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                            gap: 8,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {[
                                            {
                                                label: t('factoryOverview.errorAnalytics.worstMttr'),
                                                value: worstMttr ? formatHours(worstMttr.value) : '-',
                                                machineName: worstMttr?.name ?? t('common.noData'),
                                                color: token.colorError,
                                                bg: token.colorErrorBg,
                                            },
                                            {
                                                label: t('factoryOverview.errorAnalytics.worstMtbf'),
                                                value: worstMtbf ? formatHours(worstMtbf.value) : '-',
                                                machineName: worstMtbf?.name ?? t('common.noData'),
                                                color: token.colorWarning,
                                                bg: token.colorWarningBg,
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: token.borderRadiusLG,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                    background: item.bg || token.colorFillAlter,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        display: 'block',
                                                        fontSize: 12,
                                                        color: token.colorTextSecondary,
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    {item.label}
                                                </Text>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        gap: 12,
                                                        alignItems: 'baseline',
                                                    }}
                                                >
                                                    <Text strong ellipsis style={{ minWidth: 0 }}>
                                                        {item.machineName}
                                                    </Text>
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: item.color,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {item.value}
                                                    </Text>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                            gap: 8,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {[
                                            {
                                                title: t('factoryOverview.errorAnalytics.mttrRanking'),
                                                subtitle: t(
                                                    'factoryOverview.errorAnalytics.higherIsWorse'
                                                ),
                                                rows: mttrRanking,
                                                maxValue: maxMttrValue,
                                                color: token.colorError,
                                            },
                                            {
                                                title: t('factoryOverview.errorAnalytics.mtbfRanking'),
                                                subtitle: t(
                                                    'factoryOverview.errorAnalytics.lowerIsWorse'
                                                ),
                                                rows: mtbfRanking,
                                                maxValue: maxMtbfValue,
                                                color: token.colorWarning,
                                            },
                                        ].map((group) => (
                                            <div
                                                key={group.title}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: token.borderRadiusLG,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                    background: token.colorBgContainer,
                                                    minWidth: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        gap: 8,
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    <Text strong>{group.title}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {group.subtitle}
                                                    </Text>
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 7,
                                                    }}
                                                >
                                                    {group.rows.length === 0 ? (
                                                        <Text type="secondary">
                                                            {t('common.noData')}
                                                        </Text>
                                                    ) : (
                                                        group.rows.map((machine) => (
                                                            <button
                                                                key={machine.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleFilterChange(
                                                                        [machine.id],
                                                                        'error'
                                                                    )
                                                                }
                                                                style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns:
                                                                        '96px 1fr auto',
                                                                    gap: 8,
                                                                    alignItems: 'center',
                                                                    border: 0,
                                                                    padding: 0,
                                                                    background: 'transparent',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left',
                                                                }}
                                                            >
                                                                <Text
                                                                    ellipsis
                                                                    style={{ fontSize: 12 }}
                                                                >
                                                                    {machine.name}
                                                                </Text>
                                                                <div
                                                                    style={{
                                                                        height: 8,
                                                                        borderRadius: 4,
                                                                        background:
                                                                            token.colorFillSecondary,
                                                                        overflow: 'hidden',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width: `${Math.max(
                                                                                (machine.value /
                                                                                    group.maxValue) *
                                                                                100,
                                                                                4
                                                                            )}%`,
                                                                            height: '100%',
                                                                            borderRadius: 4,
                                                                            background: group.color,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <Text style={{ fontSize: 12 }}>
                                                                    {formatHours(machine.value)}
                                                                </Text>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column' as const,
                                    minHeight: 0,
                                    gap: 8,
                                }}
                            >
                                <SimpleLineChart
                                    chartData={mttrData}
                                    selectedMachines={trendMachineIds}
                                    title={t('factoryOverview.chartDescriptions.mttr')}
                                    useFlex
                                    showLegend={false}
                                />
                                <SimpleLineChart
                                    chartData={mtbfData}
                                    selectedMachines={trendMachineIds}
                                    title={t('factoryOverview.chartDescriptions.mtbf')}
                                    useFlex
                                    showLegend={false}
                                />
                            </div>

                            {/* Shared legend */}
                            {sharedMachines.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '4px 14px',
                                        paddingTop: 4,
                                        flexShrink: 0,
                                    }}
                                >
                                    {sharedMachines.map((machine, index) => (
                                        <div
                                            key={machine.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 20,
                                                    height: 2,
                                                    borderRadius: 1,
                                                    backgroundColor:
                                                        chartColors[index % chartColors.length],
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span style={{ fontSize: 11 }}>{machine.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })(),
            },
        ];
    }, [
        mttrData,
        mtbfData,
        runtimeOptions,
        allRuntimeIds,
        t,
        effectiveRuntimeIds,
        effectiveErrorIds,
        filteredSummaryData,
        selectedRow,
        isMobile,
        filterId,
        startDate,
        endDate,
        isDateRange,
        top10HighRuntimeIds,
        top10LowRuntimeIds,
        top10HighErrorIds,
        top10LowErrorIds,
        handleFilterChange,
        handleBarClick,
    ]);

    return (
        <Modal
            title={
                <Title level={4} style={{ margin: 0 }}>
                    {t('factoryOverview.table.title.timeAnalytics')}
                </Title>
            }
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ top: isMobile ? 0 : 20, paddingBottom: 0 }}
            styles={{
                body: {
                    height: isMobile ? 'auto' : 'calc(95vh - 110px)',
                    overflow: isMobile ? 'auto' : 'hidden',
                    padding: isMobile ? '12px' : '12px 24px 16px',
                },
            }}
            destroyOnHidden
            centered={false}
        >
            <style>
                {`
                .highlighted-row > td {
                    background-color: ${token.colorPrimaryBgHover} !important;
                    transition: background-color 0.3s ease;
                }
                `}
            </style>
            {loading ? (
                <div
                    style={{
                        height: isMobile ? 'auto' : '100%',
                        display: isMobile ? 'flex' : 'grid',
                        flexDirection: isMobile ? 'column' : 'row',
                        gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
                        gap: 24,
                        paddingTop: 24,
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Skeleton.Input active block size="large" style={{ height: 40 }} />
                        <Skeleton active paragraph={{ rows: 12 }} />
                    </div>
                    <div
                        style={{
                            paddingLeft: isMobile ? 0 : 24,
                            borderLeft: isMobile
                                ? 'none'
                                : `1px solid ${token.colorBorderSecondary}`,
                            borderTop: isMobile
                                ? `1px solid ${token.colorBorderSecondary}`
                                : 'none',
                            paddingTop: isMobile ? 24 : 0,
                        }}
                    >
                        <Skeleton active paragraph={{ rows: 14 }} />
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        display: isMobile ? 'flex' : 'grid',
                        flexDirection: isMobile ? 'column' : 'row',
                        gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
                        gap: 24,
                        height: isMobile ? 'auto' : '100%',
                        paddingTop: 4,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            height: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        {selectedRow ? (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        flexShrink: 0,
                                        paddingBottom: 4,
                                    }}
                                >
                                    <Button
                                        type="default"
                                        size="small"
                                        onClick={() => setSelectedRow(null)}
                                        style={{ borderRadius: token.borderRadius }}
                                    >
                                        <LeftOutlined />
                                        {t('common.back')}
                                    </Button>
                                    <Text strong style={{ fontSize: 15 }}>
                                        {selectedRow.machineName}
                                    </Text>
                                </div>

                                {/* Summary cards */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: isXs ? '1fr' : 'repeat(2, 1fr)',
                                        gap: 12,
                                        flexShrink: 0,
                                    }}
                                >
                                    {[
                                        {
                                            label: t('factoryOverview.stats.totalRunTime'),
                                            value: formatHours(selectedRow.totalRuntimeHours),
                                            color: token.colorSuccess,
                                            bg: token.colorSuccessBg || 'rgba(61, 138, 107, 0.08)',
                                            borderColor:
                                                token.colorSuccessBorder ||
                                                'rgba(61, 138, 107, 0.2)',
                                        },
                                        {
                                            label: t('factoryOverview.stats.totalStopTime'),
                                            value: formatHours(selectedRow.totalIdleHours),
                                            color: token.colorWarning,
                                            bg: token.colorWarningBg || 'rgba(196, 136, 58, 0.08)',
                                            borderColor:
                                                token.colorWarningBorder ||
                                                'rgba(196, 136, 58, 0.2)',
                                        },
                                        {
                                            label: t('factoryOverview.stats.totalErrorTime'),
                                            value: formatHours(selectedRow.totalErrorHours),
                                            color: token.colorError,
                                            bg: token.colorErrorBg || 'rgba(199, 84, 84, 0.08)',
                                            borderColor:
                                                token.colorErrorBorder || 'rgba(199, 84, 84, 0.2)',
                                        },
                                        {
                                            label: t('factoryOverview.stats.totalOfflineTime'),
                                            value: formatHours(selectedRow.totalOfflineHours),
                                            color: token.colorTextSecondary,
                                            bg: token.colorFillAlter,
                                            borderColor: token.colorBorderSecondary,
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: token.borderRadiusLG,
                                                border: `1px solid ${item.borderColor}`,
                                                background: item.bg,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: item.color,
                                                    fontWeight: 500,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                            <Text
                                                strong
                                                style={{ fontSize: 20, color: item.color }}
                                            >
                                                {item.value}
                                            </Text>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusLG,
                                        overflow: 'auto',
                                        minHeight: 0,
                                        background: token.colorBgContainer,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                            background: token.colorFillAlter,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Text
                                            strong
                                            style={{ fontSize: 15, color: token.colorPrimary }}
                                        >
                                            {t('factoryOverview.table.title.errorHistory')}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 14 }}>
                                            {t('factoryOverview.table.subtitle.errorDetails')}
                                        </Text>
                                    </div>
                                    <Table<MachineErrorDetailItem>
                                        loading={loadingErrorDetails}
                                        columns={errorColumns}
                                        dataSource={errorDetails}
                                        rowKey={(record, index) =>
                                            record.id?.toString() || index?.toString() || ''
                                        }
                                        pagination={{
                                            pageSize: 12,
                                            size: 'small',
                                            showSizeChanger: false,
                                            style: {
                                                textAlign: 'center',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                width: '100%',
                                                padding: '8px 0',
                                            },
                                        }}
                                        size="small"
                                        scroll={
                                            isMobile
                                                ? { x: 'max-content' }
                                                : { y: 'calc(95vh - 530px)', x: 'max-content' }
                                        }
                                        style={{ height: isMobile ? 'auto' : '100%', margin: 0 }}
                                        locale={{
                                            emptyText: t('factoryOverview.table.noErrorData'),
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    style={{
                                        flexShrink: 0,
                                        display: 'flex',
                                        gap: 8,
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text
                                        strong
                                        style={{ fontSize: 16, color: token.colorPrimary }}
                                    >
                                        {spaceData?.spaceName}
                                    </Text>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {workshopOptions.length > 0 && (
                                            <Select
                                                placeholder={t('factoryOverview.filter.chooseZone')}
                                                value={selectedWorkshopId}
                                                onChange={setSelectedWorkshopId}
                                                options={workshopOptions}
                                                allowClear
                                                style={{ width: 220 }}
                                            />
                                        )}
                                        <SearchInput
                                            value={searchText}
                                            onChange={setSearchText}
                                            placeholder={t('factoryOverview.filter.searchMachines')}
                                            width={220}
                                            debounceMs={200}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                                    <Table<MachineStatusSummaryItem>
                                        columns={tableColumns}
                                        dataSource={filteredSummaryData}
                                        rowKey="machineId"
                                        rowClassName={(record) =>
                                            record.machineId === hoveredMachineId
                                                ? 'highlighted-row'
                                                : ''
                                        }
                                        onChange={(pagination, filters, sorter, extra) => {
                                            setCurrentPage(pagination.current || 1);
                                            setCurrentSortedData(
                                                extra.currentDataSource as MachineStatusSummaryItem[]
                                            );
                                        }}
                                        pagination={{
                                            current: currentPage,
                                            pageSize: 12,
                                            size: 'small',
                                            showSizeChanger: false,
                                            style: {
                                                textAlign: 'center',
                                                marginTop: 8,
                                                display: 'flex',
                                                justifyContent: 'center',
                                            },
                                        }}
                                        size="small"
                                        scroll={
                                            isMobile
                                                ? { x: 'max-content' }
                                                : { y: 'calc(95vh - 380px)', x: 'max-content' }
                                        }
                                        style={{ height: isMobile ? 'auto' : '100%' }}
                                        locale={{ emptyText: t('common.noData') }}
                                        onRow={(row) => ({
                                            onClick: () => setSelectedRow(row),
                                            style: { cursor: 'pointer' },
                                        })}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div
                        style={{
                            borderLeft: isMobile
                                ? 'none'
                                : `1px solid ${token.colorBorderSecondary}`,
                            borderTop: isMobile
                                ? `1px solid ${token.colorBorderSecondary}`
                                : 'none',
                            paddingLeft: isMobile ? 0 : 24,
                            paddingTop: isMobile ? 24 : 0,
                            display: 'flex',
                            flexDirection: 'column',
                            height: isMobile ? 'auto' : '100%',
                            overflow: isMobile ? 'visible' : 'hidden',
                        }}
                    >
                        <Tabs
                            items={rightTabItems}
                            defaultActiveKey="runtime"
                            size="small"
                            style={{ flex: 1, minHeight: 0 }}
                            tabBarStyle={{ flexShrink: 0, marginBottom: 8 }}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ErrorAnalyticsModal;
