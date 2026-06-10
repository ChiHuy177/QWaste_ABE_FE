'use client';

import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import {
    Button,
    DatePicker,
    Divider,
    Grid,
    Popover,
    Radio,
    Select,
    Space,
    Spin,
    Tooltip,
    Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import FactoryStatsCards from './_components/FactoryStatsCards';
import SpaceOverviewGrid from './_components/SpaceOverviewGrid';
import ErrorAnalyticsModal from './_components/ErrorAnalyticsModal';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { factoryOverviewActions } from '@/stores';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { LineChartOutlined, SearchOutlined } from '@ant-design/icons';
import {
    collectAllMachines,
    computeStatsFromMachines,
    buildMachinePathMap,
    updateMachineInTree,
} from '@/utils/spaceStatsUtils';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { IndustryFilter } from '@/types/IndustryFilter';
import { SpaceOverview } from '@/types/Space';
import { MachineWithStatusLogsSummary } from '@/types/Machine';
import {
    DemoFactoryOverviewService,
    USE_MOCK_FACTORY_OVERVIEW,
} from '@/mockData/admin/factory';

type TimeFilterMode = 'PRESET' | 'CUSTOM_RANGE';

function buildSpaceToMachinesMap(
    space: SpaceOverview
): Map<number, MachineWithStatusLogsSummary[]> {
    const map = new Map<number, MachineWithStatusLogsSummary[]>();

    function traverse(s: SpaceOverview) {
        if (s.machineChildren.length > 0) {
            map.set(s.spaceId, s.machineChildren);
        }
        s.children.forEach(traverse);
    }

    traverse(space);
    return map;
}

const FactoryOverviewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);
    const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('PRESET');
    const [expandedSpaces, setExpandedSpaces] = useState<Set<number>>(new Set());
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const dispatch = useAppDispatch();
    const { wsService, isConnected: wsConnected } = useWebSocketContext();

    const {
        selectedStartDate,
        selectedEndDate,
        selectedTimePeriod,
        selectedSpaceId,
        spaces,
        spaceData,
        isLoading,
        isLoadingSpaces,
    } = useAppSelector((state) => state.factoryOverview) as IFactoryOverviewStoreState;

    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
    const [draftTimeFilterMode, setDraftTimeFilterMode] = useState<TimeFilterMode>(timeFilterMode);
    const [draftTimePeriod, setDraftTimePeriod] = useState<number | null>(selectedTimePeriod);
    const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs(selectedStartDate),
        dayjs(selectedEndDate),
    ]);

    type MachinePathEntry = { path: number[]; machineIndex: number };
    const machinePathMapRef = useRef<Map<string, MachinePathEntry>>(new Map());
    const spaceToMachinesMapRef = useRef<Map<number, MachineWithStatusLogsSummary[]>>(new Map());
    const activeSubscriptionsRef = useRef<Map<string, () => void>>(new Map());
    const pendingUpdates = useRef<
        Map<string, { newStatus: string; runtimeUpdate?: { status: string; duration: number } }>
    >(new Map());
    const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
    const firstUpdateTimeRef = useRef<number | null>(null);
    const MAX_BATCH_DELAY = 200;

    usePageTitle(t('factoryOverview.title'));

    useEffect(() => {
        if (!spaceData) return;
        machinePathMapRef.current = buildMachinePathMap(spaceData);
        spaceToMachinesMapRef.current = buildSpaceToMachinesMap(spaceData);
    }, [spaceData]);

    useEffect(() => {
        dispatch(factoryOverviewActions.fetchSpaces());
    }, [dispatch]);

    useEffect(() => {
        const fetchIndustryFilters = async () => {
            try {
                const filters = USE_MOCK_FACTORY_OVERVIEW
                    ? await DemoFactoryOverviewService.getIndustryFilters()
                    : await IndustryFilterService.getAllIndustryFilters();
                setIndustryFilters(filters);

                if (filters.length > 0 && !selectedTimePeriod && timeFilterMode === 'PRESET') {
                    dispatch(
                        factoryOverviewActions.setSelectedTimePeriod(filters[0].filterId as any)
                    );
                }
            } catch (error) {
                console.error('Failed to fetch industry filters:', error);
            }
        };
        fetchIndustryFilters();
    }, [dispatch, selectedTimePeriod, timeFilterMode]);

    const isCustomRangeMode = timeFilterMode === 'CUSTOM_RANGE';
    const isDateRange = isCustomRangeMode;

    const applyBatchedUpdates = useCallback(() => {
        if (pendingUpdates.current.size === 0) return;

        dispatch((dispatch, getState) => {
            let currentData = getState().factoryOverview.spaceData;
            if (!currentData) return;

            let isDataModified = false;

            pendingUpdates.current.forEach((update, machineId) => {
                const entry = machinePathMapRef.current.get(machineId);
                if (!entry) return;

                const { path, machineIndex } = entry;

                currentData = updateMachineInTree(currentData!, path, machineIndex, (machine) => {
                    const updatedMachine = {
                        ...machine,
                        currentStatus: update.newStatus as typeof machine.currentStatus,
                    };

                    if (update.runtimeUpdate) {
                        const runtime = (machine.runtimeByStatus ?? {}) as Record<string, number>;
                        const currentRuntime = runtime[update.runtimeUpdate.status] || 0;
                        const newRuntime = currentRuntime + update.runtimeUpdate.duration;

                        updatedMachine.runtimeByStatus = {
                            ...runtime,
                            [update.runtimeUpdate.status]: newRuntime,
                        } as typeof machine.runtimeByStatus;
                    }

                    return updatedMachine;
                });

                isDataModified = true;
            });

            pendingUpdates.current.clear();
            firstUpdateTimeRef.current = null;

            if (isDataModified && currentData) {
                dispatch(factoryOverviewActions.updateSpaceData(currentData));
            }
        });
    }, [dispatch]);

    const scheduleMachineUpdate = useCallback(
        (
            machineId: string,
            newStatus: string,
            runtimeUpdate?: {
                status: string;
                duration: number;
            }
        ) => {
            pendingUpdates.current.set(machineId, { newStatus, runtimeUpdate });

            if (!firstUpdateTimeRef.current) {
                firstUpdateTimeRef.current = Date.now();
            }

            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }

            const elapsed = Date.now() - firstUpdateTimeRef.current;
            const remainingTime = Math.max(0, MAX_BATCH_DELAY - elapsed);

            if (remainingTime === 0) {
                applyBatchedUpdates();
                firstUpdateTimeRef.current = null;
                return;
            }

            const delay = Math.min(50, remainingTime);

            updateTimerRef.current = setTimeout(() => {
                applyBatchedUpdates();
                firstUpdateTimeRef.current = null;
            }, delay);
        },
        [applyBatchedUpdates]
    );

    const handleToggleSpace = useCallback((spaceId: number) => {
        setExpandedSpaces((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(spaceId)) {
                newSet.delete(spaceId);
            } else {
                newSet.add(spaceId);
            }
            return newSet;
        });
    }, []);

    // Subscribe to machines only in expanded spaces (incremental)
    useEffect(() => {
        if (!wsConnected || !spaceData) {
            // Cleanup all subscriptions if disconnected or no data
            activeSubscriptionsRef.current.forEach((unsub) => unsub());
            activeSubscriptionsRef.current.clear();
            return;
        }

        // Calculate needed machines based on expanded spaces
        const neededMachines = new Set<string>();
        expandedSpaces.forEach((spaceId) => {
            const machines = spaceToMachinesMapRef.current.get(spaceId);
            if (!machines) return;
            machines.forEach((machine) => neededMachines.add(machine.machineId));
        });

        // Unsubscribe from machines no longer needed
        activeSubscriptionsRef.current.forEach((unsub, machineId) => {
            if (!neededMachines.has(machineId)) {
                unsub();
                activeSubscriptionsRef.current.delete(machineId);
            }
        });

        // Subscribe to new machines
        neededMachines.forEach((machineId) => {
            if (activeSubscriptionsRef.current.has(machineId)) return; // Already subscribed

            const statusTopic = `/topic/machines/status/${machineId}`;

            const unsubscribe = wsService.subscribe<{
                type: string;
                payload: {
                    machineId: string;
                    data: {
                        previousLog: {
                            startTime: string;
                            endTime: string;
                            logStatus:
                            | 'RUNTIME'
                            | 'IDLE'
                            | 'ERROR'
                            | 'COMPLETE'
                            | 'OFFLINE'
                            | 'UNKNOWN';
                        };
                        newStatus:
                        | 'RUNTIME'
                        | 'IDLE'
                        | 'ERROR'
                        | 'COMPLETE'
                        | 'OFFLINE'
                        | 'UNKNOWN';
                        productionCounter: number;
                    };
                };
            }>(statusTopic, (message) => {
                if (message.type !== 'DATA') {
                    return;
                }

                const { machineId, data } = message.payload;
                const { newStatus, previousLog } = data;

                if (!machineId || !newStatus) {
                    return;
                }

                if (!previousLog) {
                    scheduleMachineUpdate(machineId, newStatus);
                    return;
                }

                if (!previousLog.startTime || !previousLog.endTime || !previousLog.logStatus) {
                    scheduleMachineUpdate(machineId, newStatus);
                    return;
                }

                const validStatuses = [
                    'RUNTIME',
                    'IDLE',
                    'ERROR',
                    'COMPLETE',
                    'OFFLINE',
                    'UNKNOWN',
                ];
                if (!validStatuses.includes(previousLog.logStatus)) {
                    scheduleMachineUpdate(machineId, newStatus);
                    return;
                }

                const startTime = dayjs(previousLog.startTime);
                const endTime = dayjs(previousLog.endTime);

                if (!startTime.isValid() || !endTime.isValid()) {
                    scheduleMachineUpdate(machineId, newStatus);
                    return;
                }

                const duration = endTime.diff(startTime, 'second');

                if (duration < 0 || duration > 86400 || duration === 0) {
                    scheduleMachineUpdate(machineId, newStatus);
                    return;
                }

                scheduleMachineUpdate(machineId, newStatus, {
                    status: previousLog.logStatus,
                    duration,
                });
            });

            activeSubscriptionsRef.current.set(machineId, unsubscribe);
        });
    }, [wsConnected, expandedSpaces, scheduleMachineUpdate, wsService]);

    // Cleanup all subscriptions on unmount
    useEffect(() => {
        return () => {
            activeSubscriptionsRef.current.forEach((unsub) => unsub());
            activeSubscriptionsRef.current.clear();
        };
    }, []);

    const timePeriodOptions = useMemo((): {
        label: string;
        value: number;
        disabled?: boolean;
    }[] => {
        const currentLang = i18n.language;

        return industryFilters.map((filter: IndustryFilter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
        }));
    }, [industryFilters, i18n.language]);

    const shiftFilterOptions = useMemo((): { label: string; value: number | null }[] => {
        const currentLang = i18n.language;
        return [
            { label: t('common.all'), value: null },
            ...industryFilters
                .filter((filter) => filter.category === 'SHIFT')
                .map((filter) => ({
                    label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
                    value: filter.filterId,
                })),
        ];
    }, [industryFilters, i18n.language, t]);

    const hasInitialFetch = useRef(false);

    useEffect(() => {
        if (
            selectedSpaceId &&
            !hasInitialFetch.current &&
            industryFilters.length > 0
        ) {
            if (timeFilterMode === 'PRESET') {
                if (!selectedTimePeriod) return;
                hasInitialFetch.current = true;
                dispatch(
                    factoryOverviewActions.fetchSpaceOverview(
                        selectedSpaceId,
                        selectedTimePeriod as number
                    )
                );
                return;
            }

            hasInitialFetch.current = true;
            dispatch(
                factoryOverviewActions.fetchSpaceOverviewByDateRange(
                    selectedSpaceId,
                    selectedStartDate,
                    selectedEndDate,
                    selectedTimePeriod ?? undefined
                )
            );
        }
    }, [
        selectedSpaceId,
        dispatch,
        timeFilterMode,
        selectedTimePeriod,
        selectedStartDate,
        selectedEndDate,
        industryFilters.length,
    ]);

    const spaceOptions = useMemo(
        () =>
            spaces.map((space) => ({
                label: space.spaceName,
                value: space.spaceId,
            })),
        [spaces]
    );

    const syncDraftTimeFilter = useCallback(() => {
        setDraftTimeFilterMode(timeFilterMode);
        setDraftTimePeriod(selectedTimePeriod);
        setDraftDateRange([dayjs(selectedStartDate), dayjs(selectedEndDate)]);
    }, [selectedEndDate, selectedStartDate, selectedTimePeriod, timeFilterMode]);

    const handleTimeFilterOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                syncDraftTimeFilter();
            }
            setIsTimeFilterOpen(open);
        },
        [syncDraftTimeFilter]
    );

    const handleApplyTimeFilter = useCallback(() => {
        setTimeFilterMode(draftTimeFilterMode);
        dispatch(factoryOverviewActions.setSelectedTimePeriod(draftTimePeriod));
        dispatch(
            factoryOverviewActions.setSelectedDateRange({
                startDate: draftDateRange[0].format('YYYY-MM-DD'),
                endDate: draftDateRange[1].format('YYYY-MM-DD'),
            })
        );
        setIsTimeFilterOpen(false);
    }, [dispatch, draftDateRange, draftTimeFilterMode, draftTimePeriod]);

    const handleSpaceChange = useCallback(
        (value: number) => {
            dispatch(factoryOverviewActions.setSelectedSpaceId(value));
        },
        [dispatch]
    );

    const handleSearch = useCallback(() => {
        if (!selectedSpaceId) return;

        if (timeFilterMode === 'PRESET') {
            if (!selectedTimePeriod) return;
            dispatch(
                factoryOverviewActions.fetchSpaceOverview(selectedSpaceId, selectedTimePeriod)
            );
            return;
        }

        dispatch(
            factoryOverviewActions.fetchSpaceOverviewByDateRange(
                selectedSpaceId,
                selectedStartDate,
                selectedEndDate,
                selectedTimePeriod ?? undefined
            )
        );
    }, [
        dispatch,
        selectedSpaceId,
        timeFilterMode,
        selectedTimePeriod,
        selectedStartDate,
        selectedEndDate,
    ]);

    const activeTimePeriodLabel = useMemo(() => {
        const selectedFilterLabel =
            timePeriodOptions.find((tp) => tp.value === selectedTimePeriod)?.label ??
            shiftFilterOptions.find((tp) => tp.value === selectedTimePeriod)?.label;

        if (timeFilterMode === 'PRESET') {
            return selectedFilterLabel;
        }

        const dateLabel = `${dayjs(selectedStartDate).format('DD/MM/YYYY')} - ${dayjs(
            selectedEndDate
        ).format('DD/MM/YYYY')}`;

        if (!selectedFilterLabel || selectedTimePeriod == null) {
            return dateLabel;
        }

        return `${dateLabel} / ${selectedFilterLabel}`;
    }, [
        selectedEndDate,
        selectedStartDate,
        selectedTimePeriod,
        shiftFilterOptions,
        timeFilterMode,
        timePeriodOptions,
    ]);

    const timeFilterPopoverContent = useMemo(() => {
        const selectedQuickValue =
            draftTimeFilterMode === 'PRESET' && draftTimePeriod != null
                ? `preset-${draftTimePeriod}`
                : 'custom-range';

        return (
            <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 360, maxWidth: 360 }}>
                <Typography.Text strong>
                    {i18n.language === 'vi' ? 'Thời gian' : 'Time Filter'}
                </Typography.Text>

                <Divider style={{ margin: '12px 0' }} />

                <Radio.Group
                    value={selectedQuickValue}
                    onChange={(event) => {
                        const value = event.target.value as string;
                        if (value === 'custom-range') {
                            setDraftTimeFilterMode('CUSTOM_RANGE');
                            const currentFilter = industryFilters.find(
                                (filter) => filter.filterId === draftTimePeriod
                            );
                            if (currentFilter?.category !== 'SHIFT') {
                                setDraftTimePeriod(null);
                            }
                            return;
                        }

                        setDraftTimeFilterMode('PRESET');
                        setDraftTimePeriod(Number(value.replace('preset-', '')));
                    }}
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Typography.Text type="secondary">
                            {i18n.language === 'vi' ? 'Chọn nhanh' : 'Quick Select'}
                        </Typography.Text>
                        <div
                            style={{
                                maxHeight: isMobile ? 160 : 220,
                                overflowY: 'auto',
                                paddingRight: 4,
                            }}
                        >
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                {timePeriodOptions.map((option) => (
                                    <Radio key={option.value} value={`preset-${option.value}`}>
                                        <Typography.Text
                                            ellipsis
                                            style={{
                                                maxWidth: isMobile ? 'calc(100vw - 110px)' : 285,
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            {option.label}
                                        </Typography.Text>
                                    </Radio>
                                ))}
                            </Space>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <Radio value="custom-range">
                            {i18n.language === 'vi' ? 'Khoảng ngày' : 'Custom Date Range'}
                        </Radio>
                    </Space>
                </Radio.Group>

                <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
                    <DatePicker.RangePicker
                        value={draftDateRange}
                        onChange={(dates) => {
                            if (dates?.[0] && dates?.[1]) {
                                setDraftDateRange([dates[0], dates[1]]);
                                setDraftTimeFilterMode('CUSTOM_RANGE');
                            }
                        }}
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: 8 }}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                        disabled={draftTimeFilterMode !== 'CUSTOM_RANGE'}
                    />

                    <Select
                        value={draftTimePeriod}
                        onChange={(value) => {
                            setDraftTimePeriod(value);
                            setDraftTimeFilterMode('CUSTOM_RANGE');
                        }}
                        options={shiftFilterOptions}
                        style={{ width: '100%' }}
                        disabled={draftTimeFilterMode !== 'CUSTOM_RANGE'}
                    />
                </Space>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                        onClick={() => {
                            syncDraftTimeFilter();
                            setIsTimeFilterOpen(false);
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button type="primary" onClick={handleApplyTimeFilter}>
                        {i18n.language === 'vi' ? 'Áp dụng' : 'Apply'}
                    </Button>
                </div>
            </div>
        );
    }, [
        draftDateRange,
        draftTimeFilterMode,
        draftTimePeriod,
        handleApplyTimeFilter,
        i18n.language,
        industryFilters,
        isMobile,
        shiftFilterOptions,
        syncDraftTimeFilter,
        t,
        timePeriodOptions,
    ]);

    const headerActions = useMemo(
        () => (
            <div
                style={{
                    display: 'flex',
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: isMobile ? 8 : 12,
                    flexWrap: 'wrap',
                    width: isMobile ? '100%' : 'auto',
                }}
            >
                <Popover
                    open={isTimeFilterOpen}
                    onOpenChange={handleTimeFilterOpenChange}
                    trigger="click"
                    placement={isMobile ? 'bottomLeft' : 'bottomRight'}
                    content={timeFilterPopoverContent}
                >
                    <Tooltip title={activeTimePeriodLabel}>
                        <Button
                            style={{
                                borderRadius: 8,
                                width: isMobile ? '100%' : 220,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: 4,
                            }}
                        >
                            <span style={{ flexShrink: 0 }}>
                                {i18n.language === 'vi' ? 'Thời gian' : 'Time'}:
                            </span>
                            <Typography.Text
                                ellipsis
                                style={{
                                    maxWidth: isMobile ? 'calc(100% - 76px)' : 135,
                                    color: 'inherit',
                                    lineHeight: 'inherit',
                                }}
                            >
                                {activeTimePeriodLabel ?? t('common.filter')}
                            </Typography.Text>
                        </Button>
                    </Tooltip>
                </Popover>

                <Select
                    placeholder="Select Space"
                    value={selectedSpaceId}
                    onChange={handleSpaceChange}
                    style={{ width: isMobile ? '100%' : 180 }}
                    loading={isLoadingSpaces}
                    disabled={spaces.length === 0}
                    options={spaceOptions}
                />

                <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    loading={isLoading}
                    style={{
                        borderRadius: 8,
                        flex: isMobile ? '1 1 0' : undefined,
                        minWidth: isMobile ? 0 : undefined,
                    }}
                >
                    {t('common.search')}
                </Button>

                <Button
                    onClick={() => setIsErrorModalOpen(true)}
                    icon={<LineChartOutlined />}
                    style={{
                        borderRadius: 8,
                        flex: isMobile ? '1 1 0' : undefined,
                        minWidth: isMobile ? 0 : undefined,
                    }}
                >
                    {t('factoryOverview.table.title.timeAnalytics')}
                </Button>
            </div>
        ),
        [
            activeTimePeriodLabel,
            handleSearch,
            handleSpaceChange,
            handleTimeFilterOpenChange,
            i18n.language,
            isLoading,
            isLoadingSpaces,
            isTimeFilterOpen,
            isMobile,
            selectedSpaceId,
            spaceOptions,
            spaces.length,
            t,
            timeFilterPopoverContent,
        ]
    );

    const factoryStats = useMemo(() => {
        if (!spaceData) {
            return {
                energyConsumption: 0,
                totalRunTime: 0,
                totalStopTime: 0,
                totalErrorTime: 0,
            };
        }

        const stats = computeStatsFromMachines(collectAllMachines(spaceData));

        return {
            energyConsumption: stats.energyKwh,
            totalRunTime: stats.runtimeSeconds / 3600,
            totalStopTime: stats.idleSeconds / 3600,
            totalErrorTime: stats.errorSeconds / 3600,
        };
    }, [spaceData]);

    const isInitialLoading = isLoadingSpaces || !spaceData;

    return (
        <>
            <ResponsivePageHeader title={t('factoryOverview.title')} rightContent={headerActions} />

            {isInitialLoading ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12 }}>
                        <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
                    </div>
                </div>
            ) : (
                <>
                    <FactoryStatsCards
                        energyConsumption={factoryStats.energyConsumption}
                        totalRunTime={factoryStats.totalRunTime}
                        totalStopTime={factoryStats.totalStopTime}
                        totalErrorTime={factoryStats.totalErrorTime}
                    />

                    <SpaceOverviewGrid
                        spaceData={spaceData}
                        expandedSpaces={expandedSpaces}
                        onToggle={handleToggleSpace}
                        filterInfo={{
                            factoryName: spaces.find((s) => s.spaceId === selectedSpaceId)
                                ?.spaceName,
                            timePeriod: activeTimePeriodLabel,
                            timePeriodValue: selectedTimePeriod?.toString() ?? undefined,
                        }}
                    />
                </>
            )}

            <ErrorAnalyticsModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                spaceId={selectedSpaceId}
                filterId={selectedTimePeriod as number | null}
                startDate={selectedStartDate}
                endDate={selectedEndDate}
                isDateRange={isDateRange}
            />
        </>
    );
};

export default FactoryOverviewPage;
