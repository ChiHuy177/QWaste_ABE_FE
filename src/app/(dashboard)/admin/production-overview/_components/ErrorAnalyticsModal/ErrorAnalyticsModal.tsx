'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, Typography, Table, Tag, Select, Button, theme, Skeleton, Grid } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
    RuntimeAnalyticsChart,
    MachineDetailAreaChart,
    QuickSelectFilter,
    formatHours,
} from './AnalyticsCharts';
import { SpaceService } from '@/services/SpaceService';
import { MachineStatusSummaryItem, MachineErrorDetailItem } from '@/types/Monitoring';
import { SearchInput } from '@/components/shared/SearchInput/SearchInput';
import { useAppSelector } from '@/stores/hook';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { collectAllMachines } from '@/utils/spaceStatsUtils';
import {
    MOCK_MACHINE_STATUS_SUMMARY,
    MOCK_WORKSHOPS,
    getMockMachineErrorDetails,
} from './mockErrorAnalyticsData';

const { Title, Text } = Typography;

interface ErrorAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    spaceId: number | null;
    filterId: number | null;
    startDate: string;
    endDate: string;
    isDateRange: boolean;
    restrictToMachineIds?: string[];
}

const ErrorAnalyticsModal: React.FC<ErrorAnalyticsModalProps> = React.memo(
    ({
        isOpen,
        onClose,
        spaceId,
        filterId,
        startDate,
        endDate,
        isDateRange,
        restrictToMachineIds,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();
        const screens = Grid.useBreakpoint();
        const isMobile = screens.md === false;
        const isXs = screens.xs === true;

        const [loading, setLoading] = useState(false);
        const [filterMode, setFilterMode] = useState<'CUSTOM' | 'TOP_10_HIGH' | 'TOP_10_LOW'>(
            'CUSTOM'
        );
        const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
        const [hoveredMachineId, setHoveredMachineId] = useState<string | null>(null);
        const [currentPage, setCurrentPage] = useState(1);
        const [currentSortedData, setCurrentSortedData] = useState<
            MachineStatusSummaryItem[] | null
        >(null);

        const [summaryData, setSummaryData] = useState<MachineStatusSummaryItem[]>([]);
        const [selectedRow, setSelectedRow] = useState<MachineStatusSummaryItem | null>(null);
        const [searchText, setSearchText] = useState('');
        const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | 'all' | null>('all');
        const [errorDetails, setErrorDetails] = useState<MachineErrorDetailItem[]>([]);
        const [loadingErrorDetails, setLoadingErrorDetails] = useState(false);

        const reduxState = useAppSelector((state) => state.factoryOverview) as
            IFactoryOverviewStoreState | undefined;

        // Use Redux spaceData or fallback to custom mock data if not loaded in store
        const spaceData = useMemo(() => {
            return reduxState?.spaceData || null;
        }, [reduxState]);

        const workshopOptions = useMemo(() => {
            if (spaceData?.children && spaceData.children.length > 0) {
                return [
                    { label: t('common.all') || 'Tất cả', value: 'all' as const },
                    ...spaceData.children.map((child: any) => ({
                        label: child.spaceName,
                        value: child.spaceId,
                    })),
                ];
            }
            return [
                { label: t('common.all') || 'Tất cả', value: 'all' as const },
                ...MOCK_WORKSHOPS.map((ws) => ({
                    label: ws.spaceName,
                    value: ws.spaceId,
                })),
            ];
        }, [spaceData, t]);

        const machineWorkshopMap = useMemo(() => {
            const map = new Map<string, number>();
            if (spaceData?.children && spaceData.children.length > 0) {
                spaceData.children.forEach((workshop: any) => {
                    const machines = collectAllMachines(workshop);
                    machines.forEach((m) => map.set(m.machineId, workshop.spaceId));
                });
                return map;
            }
            MOCK_WORKSHOPS.forEach((ws) => {
                ws.machineIds.forEach((mId) => map.set(mId, ws.spaceId));
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
                result = result.filter((item) =>
                    item.machineName.toLowerCase().includes(lowerSearch)
                );
            }

            return result;
        }, [summaryData, searchText, selectedWorkshopId, machineWorkshopMap]);

        const filteredMachineIds = useMemo(
            () => new Set(filteredSummaryData.map((item) => item.machineId)),
            [filteredSummaryData]
        );

        const runtimeOptions = useMemo(
            () =>
                filteredSummaryData.map((item) => ({
                    label: item.machineName,
                    value: item.machineId,
                })),
            [filteredSummaryData]
        );
        const allRuntimeIds = useMemo(
            () => filteredSummaryData.map((item) => item.machineId),
            [filteredSummaryData]
        );

        const { top10HighRuntimeIds, top10LowRuntimeIds } = useMemo(() => {
            const totalCount = filteredSummaryData.length;
            const limitCount = totalCount <= 10 ? 3 : totalCount <= 20 ? 5 : 10;

            const sortedByRuntime = [...filteredSummaryData].sort(
                (a, b) => b.totalRuntimeHours - a.totalRuntimeHours
            );

            return {
                top10HighRuntimeIds: sortedByRuntime
                    .slice(0, limitCount)
                    .map((m: any) => m.machineId),
                top10LowRuntimeIds: [...sortedByRuntime]
                    .reverse()
                    .slice(0, limitCount)
                    .map((m: any) => m.machineId),
            };
        }, [filteredSummaryData]);

        const handleFilterChange = useCallback(
            (newIds: string[]) => {
                const isTop10High =
                    newIds.length > 0 &&
                    newIds.length === top10HighRuntimeIds.length &&
                    top10HighRuntimeIds.every((id) => newIds.includes(id));

                const isTop10Low =
                    newIds.length > 0 &&
                    newIds.length === top10LowRuntimeIds.length &&
                    top10LowRuntimeIds.every((id) => newIds.includes(id));

                if (isTop10High) {
                    setFilterMode('TOP_10_HIGH');
                } else if (isTop10Low) {
                    setFilterMode('TOP_10_LOW');
                } else {
                    setFilterMode('CUSTOM');
                    setCustomSelectedIds(newIds);
                }
            },
            [top10HighRuntimeIds, top10LowRuntimeIds]
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

        const restrictKey = restrictToMachineIds?.join(',');

        useEffect(() => {
            if (!isOpen) return;

            const fetchData = async () => {
                setLoading(true);
                try {
                    let summaryRes: any;

                    if (isDateRange) {
                        summaryRes = await (
                            SpaceService as any
                        ).getMachineStatusSummaryByDateRange?.(
                            startDate,
                            endDate,
                            spaceId ?? 1,
                            filterId ?? undefined
                        );
                    } else {
                        summaryRes = await (SpaceService as any).getMachineStatusSummaryByFilter?.(
                            filterId ?? 1,
                            spaceId ?? 1
                        );
                    }

                    let items: MachineStatusSummaryItem[] = Array.isArray(summaryRes?.data)
                        ? summaryRes.data
                        : Array.isArray(summaryRes)
                          ? summaryRes
                          : [];

                    if (items.length === 0) {
                        items = [...MOCK_MACHINE_STATUS_SUMMARY];
                    }

                    if (restrictToMachineIds && restrictToMachineIds.length > 0) {
                        items = items.filter((i) => restrictToMachineIds.includes(i.machineId));
                    }

                    setSummaryData(items);

                    const allInitialIds = new Set(items.map((i) => i.machineId));
                    setCustomSelectedIds(Array.from(allInitialIds));
                    setFilterMode('CUSTOM');
                } catch (error) {
                    console.warn(
                        'Backend machine status summary not available yet, using mock data:',
                        error
                    );
                    let mockItems = [...MOCK_MACHINE_STATUS_SUMMARY];
                    if (restrictToMachineIds && restrictToMachineIds.length > 0) {
                        mockItems = mockItems.filter((i) =>
                            restrictToMachineIds.includes(i.machineId)
                        );
                    }
                    setSummaryData(mockItems);
                    setCustomSelectedIds(mockItems.map((i) => i.machineId));
                    setFilterMode('CUSTOM');
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [isOpen, spaceId, filterId, startDate, endDate, isDateRange, restrictKey]);

        useEffect(() => {
            if (!selectedRow) {
                setErrorDetails([]);
                return;
            }

            const fetchErrorDetails = async () => {
                setLoadingErrorDetails(true);
                try {
                    let res: any;
                    if (isDateRange) {
                        res = await (SpaceService as any).getErrorDetailByDateRange?.(
                            startDate,
                            endDate,
                            selectedRow.machineId,
                            filterId ?? undefined
                        );
                    } else if (filterId) {
                        res = await (SpaceService as any).getErrorDetailByFilter?.(
                            filterId,
                            selectedRow.machineId
                        );
                    }
                    const items = Array.isArray(res?.errors)
                        ? res.errors
                        : Array.isArray(res?.errors?.content)
                          ? res.errors.content
                          : [];
                    if (items.length > 0) {
                        setErrorDetails(items);
                    } else {
                        setErrorDetails(getMockMachineErrorDetails(selectedRow.machineId));
                    }
                } catch (_error) {
                    setErrorDetails(getMockMachineErrorDetails(selectedRow.machineId));
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
                    title: t('factoryOverview.table.header.start') || 'Bắt đầu',
                    dataIndex: 'startTime',
                    key: 'startTime',
                    width: 140,
                    sorter: (a, b) =>
                        new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime(),
                    render: (v) => (v ? new Date(v).toLocaleString() : '—'),
                },
                {
                    title: t('factoryOverview.table.header.end') || 'Kết thúc',
                    dataIndex: 'endTime',
                    key: 'endTime',
                    width: 140,
                    sorter: (a, b) =>
                        new Date(a.endTime || 0).getTime() - new Date(b.endTime || 0).getTime(),
                    render: (v) => (v ? new Date(v).toLocaleString() : '—'),
                },
                {
                    title: t('factoryOverview.table.header.duration') || 'Thời lượng',
                    dataIndex: 'durationHours',
                    key: 'durationHours',
                    align: 'right',
                    width: 100,
                    sorter: (a, b) =>
                        (Number(a.durationHours) || 0) - (Number(b.durationHours) || 0),
                    render: (v) => (v != null ? formatHours(Number(v)) : '—'),
                },
            ],
            [t]
        );

        const tableColumns: ColumnsType<MachineStatusSummaryItem> = useMemo(
            () => [
                {
                    title: t('factoryOverview.table.header.machineName') || 'Thiết bị',
                    dataIndex: 'machineName',
                    key: 'machineName',
                    width: 140,
                    ellipsis: true,
                    render: (v: string) => <Text strong>{v}</Text>,
                },
                {
                    title: t('factoryOverview.table.header.runTime') || 'Thời gian chạy',
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
                        const pct =
                            total > 0 ? Math.round((row.totalRuntimeHours / total) * 100) : 0;
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
                    title: t('factoryOverview.table.header.stopTime') || 'Thời gian dừng',
                    dataIndex: 'totalIdleHours',
                    key: 'totalIdleHours',
                    align: 'right' as const,
                    sorter: (a, b) => (a.totalIdleHours || 0) - (b.totalIdleHours || 0),
                    render: (v: number) => <Text type="secondary">{formatHours(v)}</Text>,
                },
                {
                    title: t('factoryOverview.table.header.errorTime') || 'Thời gian lỗi',
                    dataIndex: 'totalErrorHours',
                    key: 'totalErrorHours',
                    align: 'right' as const,
                    sorter: (a, b) => (a.totalErrorHours || 0) - (b.totalErrorHours || 0),
                    render: (v: number) => <Text type="danger">{formatHours(v)}</Text>,
                },
                {
                    title: t('factoryOverview.table.header.offlineTime') || 'Ngoại tuyến',
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

        return (
            <Modal
                title={
                    <Title level={4} style={{ margin: 0 }}>
                        {t('factoryOverview.table.title.timeAnalytics') ||
                            'Phân tích thời gian hoạt động'}
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
                .full-height-table {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .full-height-table .ant-spin-nested-loading,
                .full-height-table .ant-spin-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                }
                .full-height-table .ant-table {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                .full-height-table .ant-table-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                .full-height-table .ant-table-body {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto !important;
                }
                .full-height-table .ant-table-pagination.ant-pagination {
                    margin: 8px 0 0 0 !important;
                    padding: 4px 0;
                    flex-shrink: 0;
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
                                            {t('common.back') || 'Quay lại'}
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
                                                label:
                                                    t('factoryOverview.stats.totalRunTime') ||
                                                    'Tổng thời gian chạy',
                                                value: formatHours(selectedRow.totalRuntimeHours),
                                                color: token.colorSuccess,
                                                bg:
                                                    token.colorSuccessBg ||
                                                    'rgba(61, 138, 107, 0.08)',
                                                borderColor:
                                                    token.colorSuccessBorder ||
                                                    'rgba(61, 138, 107, 0.2)',
                                            },
                                            {
                                                label:
                                                    t('factoryOverview.stats.totalStopTime') ||
                                                    'Tổng thời gian dừng',
                                                value: formatHours(selectedRow.totalIdleHours),
                                                color: token.colorWarning,
                                                bg:
                                                    token.colorWarningBg ||
                                                    'rgba(196, 136, 58, 0.08)',
                                                borderColor:
                                                    token.colorWarningBorder ||
                                                    'rgba(196, 136, 58, 0.2)',
                                            },
                                            {
                                                label:
                                                    t('factoryOverview.stats.totalErrorTime') ||
                                                    'Tổng thời gian lỗi',
                                                value: formatHours(selectedRow.totalErrorHours),
                                                color: token.colorError,
                                                bg: token.colorErrorBg || 'rgba(199, 84, 84, 0.08)',
                                                borderColor:
                                                    token.colorErrorBorder ||
                                                    'rgba(199, 84, 84, 0.2)',
                                            },
                                            {
                                                label:
                                                    t('factoryOverview.stats.totalOfflineTime') ||
                                                    'Tổng thời gian ngoại tuyến',
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
                                                {t('factoryOverview.table.title.errorHistory') ||
                                                    'Lịch sử lỗi'}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 14 }}>
                                                {t('factoryOverview.table.subtitle.errorDetails') ||
                                                    'Chi tiết các sự cố lỗi'}
                                            </Text>
                                        </div>
                                        <Table<MachineErrorDetailItem>
                                            className="full-height-table"
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
                                                    : { y: 'calc(95vh - 360px)', x: 'max-content' }
                                            }
                                            style={{
                                                height: isMobile ? 'auto' : '100%',
                                                margin: 0,
                                            }}
                                            locale={{
                                                emptyText:
                                                    t('factoryOverview.table.noErrorData') ||
                                                    'Không ghi nhận sự cố lỗi',
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
                                                    placeholder={
                                                        t('factoryOverview.filter.chooseZone') ||
                                                        'Chọn phân xưởng'
                                                    }
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
                                                placeholder={
                                                    t('factoryOverview.filter.searchMachines') ||
                                                    'Tìm thiết bị...'
                                                }
                                                width={220}
                                                debounceMs={200}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            minHeight: 0,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Table<MachineStatusSummaryItem>
                                            className="full-height-table"
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
                                                    : { y: 'calc(95vh - 200px)', x: 'max-content' }
                                            }
                                            style={{ height: isMobile ? 'auto' : '100%' }}
                                            locale={{
                                                emptyText: t('common.noData') || 'Không có dữ liệu',
                                            }}
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
                            <div style={{ marginBottom: 12, flexShrink: 0 }}>
                                <Text strong style={{ fontSize: 16 }}>
                                    {t('factoryOverview.tabs.runtimeAnalytics') ||
                                        'Phân tích thời gian chạy'}
                                </Text>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1,
                                    minHeight: 0,
                                    height: isMobile ? 400 : 'calc(95vh - 200px)',
                                    gap: 8,
                                    overflow: 'hidden',
                                }}
                            >
                                {!selectedRow && runtimeOptions.length > 0 && (
                                    <QuickSelectFilter
                                        allIds={allRuntimeIds}
                                        selectedIds={effectiveRuntimeIds}
                                        onChange={handleFilterChange}
                                        options={runtimeOptions}
                                        top10HighIds={top10HighRuntimeIds}
                                        top10LowIds={top10LowRuntimeIds}
                                        placeholder={
                                            t('factoryOverview.filter.selectMachines') ||
                                            'Chọn thiết bị...'
                                        }
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
                        </div>
                    </div>
                )}
            </Modal>
        );
    }
);

ErrorAnalyticsModal.displayName = 'ErrorAnalyticsModal';

export default ErrorAnalyticsModal;
