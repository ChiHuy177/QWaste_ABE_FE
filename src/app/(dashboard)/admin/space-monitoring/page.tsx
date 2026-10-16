'use client';

// TEMP DISABLED: factory list grid — performance issue (parallel API calls per factory)
// To re-enable: remove the redirect block and restore the commented JSX below
// Related: enhance/fe-space-monitoring branch

import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { Button, Grid, Select, Skeleton, Spin, Tooltip, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FactoryStatsCards, SpaceOverviewGrid } from '@/features/dashboard/space-monitoring';
import TimeFilterPopover, {
    type PeriodFilterMode,
    type TimeFilterApplyPayload,
} from '@/components/shared/filters/TimeFilterPopover';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { factoryOverviewActions } from '@/stores';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import {
    collectAllMachines,
    computeStatsFromMachines,
    buildMachinePathMap,
    updateMachineInTree,
} from '@/utils/spaceStatsUtils';
import { ExcelExportService } from '@/services/ExcelExportService';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { IndustryFilter } from '@/types/IndustryFilter';
import { SpaceOverview } from '@/types/Space';
import { MachineWithStatusLogsSummary } from '@/types/Machine';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
function collectDescendantIds(space: SpaceOverview): number[] {
    const ids: number[] = [];
    space.children.forEach((child) => {
        ids.push(child.spaceId);
        ids.push(...collectDescendantIds(child));
    });
    return ids;
}

function findSpaceById(space: SpaceOverview, targetId: number): SpaceOverview | null {
    if (space.spaceId === targetId) return space;
    for (const child of space.children) {
        const found = findSpaceById(child, targetId);
        if (found) return found;
    }
    return null;
}

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

const SpaceMonitoringPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);
    const [timeFilterMode, setTimeFilterMode] = useState<PeriodFilterMode>('PRESET');
    const [expandedSpaces, setExpandedSpaces] = useState<Set<number>>(new Set());
    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const { wsService, isConnected: wsConnected } = useWebSocketContext();

    const {
        selectedStartDate,
        selectedEndDate,
        selectedTimePeriod,
        selectedShiftFilterId,
        selectedSpaceId,
        spaces,
        spaceData,
        isLoading,
        isLoadingSpaces,
    } = useAppSelector((state) => state.factoryOverview) as IFactoryOverviewStoreState;

    const [isExporting, setIsExporting] = useState(false);

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

    usePageTitle(t('permissionSubjects.space_monitoring'));

    const isShiftActive = useCallback((filter: IndustryFilter): boolean => {
        if (filter.category !== 'SHIFT') return false;

        const now = dayjs();
        const currentTime = now.format('HH:mm:ss');

        if (!filter.crossesMidnight) {
            // Normal shift: 06:00→14:00
            return currentTime >= filter.startTime && currentTime < filter.endTime;
        } else {
            // Overnight shift: 22:00→06:00
            return currentTime >= filter.startTime || currentTime < filter.endTime;
        }
    }, []);

    useEffect(() => {
        if (!spaceData) return;
        machinePathMapRef.current = buildMachinePathMap(spaceData);
        spaceToMachinesMapRef.current = buildSpaceToMachinesMap(spaceData);
    }, [spaceData]);

    useEffect(() => {
        dispatch(factoryOverviewActions.fetchSpaces());
    }, [dispatch]);

    useEffect(() => {
        const paramValue = searchParams.get('factoryId');
        if (!paramValue) {
            if (selectedFactoryId !== null) {
                setSelectedFactoryId(null);
            }
            return;
        }

        const parsedId = Number(paramValue);
        if (Number.isNaN(parsedId)) return;

        if (parsedId !== selectedFactoryId) {
            setSelectedFactoryId(parsedId);
            setHasSearched(false);
            setExpandedSpaces(new Set());
            dispatch(factoryOverviewActions.setSelectedSpaceId(parsedId));
            dispatch(factoryOverviewActions.setSpaceData(null));
        }
    }, [dispatch, searchParams, selectedFactoryId]);

    useEffect(() => {
        const fetchIndustryFilters = async () => {
            try {
                const filters = await IndustryFilterService.getIndustryFiltersForPicking();
                setIndustryFilters(filters);
            } catch (error) {
                console.error('Failed to fetch industry filters:', error);
            }
        };
        fetchIndustryFilters();
    }, [dispatch]);

    // Default filter on mount: TODAY and ALL shifts
    useEffect(() => {
        if (selectedTimePeriod || timeFilterMode !== 'PRESET' || industryFilters.length === 0)
            return;

        const todayPeriod =
            industryFilters.find((f) => f.category === 'PERIOD' && f.periodCode === 'TODAY') ||
            industryFilters.find((f) => f.category === 'PERIOD') ||
            industryFilters[0];

        if (todayPeriod) {
            dispatch(factoryOverviewActions.setSelectedTimePeriod(todayPeriod.filterId));
        }
        dispatch(factoryOverviewActions.setSelectedShiftFilterId(null));
    }, [industryFilters, selectedTimePeriod, timeFilterMode, dispatch]);

    const isCustomRangeMode = timeFilterMode !== 'PRESET';
    const isDateRange = isCustomRangeMode;

    const activeFactoryId = selectedFactoryId ?? selectedSpaceId;

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

    const handleToggleSpace = useCallback((spaceId: number, spaceNode?: SpaceOverview) => {
        setExpandedSpaces((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(spaceId)) {
                newSet.delete(spaceId);
                if (spaceNode) {
                    collectDescendantIds(spaceNode).forEach((id) => newSet.delete(id));
                }
            } else {
                newSet.add(spaceId);
            }
            return newSet;
        });
    }, []);

    // const handleFactorySelect = useCallback(
    //     (factoryId: number) => {
    //         setSelectedFactoryId(factoryId);
    //         setExpandedSpaces(new Set());
    //         dispatch(factoryOverviewActions.setSelectedSpaceId(factoryId));
    //         router.push(`/admin/space-monitoring?factoryId=${factoryId}`);
    //     },
    //     [dispatch, router]
    // );

    // const handleBackToFactories = useCallback(() => {
    //     setSelectedFactoryId(null);
    //     setExpandedSpaces(new Set());
    //     router.push('/admin/space-monitoring');
    // }, [router]);

    // Subscribe to machines only in expanded spaces (incremental)
    useEffect(() => {
        if (!wsConnected || !spaceData) {
            // Cleanup all subscriptions if disconnected or no data
            activeSubscriptionsRef.current.forEach((unsub) => unsub());
            activeSubscriptionsRef.current.clear();
            return;
        }

        // Calculate needed machines based on expanded spaces.
        // When a zone is expanded we also subscribe to machines in its child lines
        // so they receive live status updates even though lines aren't individually expanded.
        const neededMachines = new Set<string>();
        expandedSpaces.forEach((spaceId) => {
            const zone = findSpaceById(spaceData, spaceId);
            if (!zone) return;
            collectAllMachines(zone).forEach((machine) => neededMachines.add(machine.machineId));
        });

        // Add standalone machines (always visible, always subscribed)
        spaceData.machineChildren.forEach((machine) => {
            neededMachines.add(machine.machineId);
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
    }, [wsConnected, spaceData, expandedSpaces, scheduleMachineUpdate, wsService]);

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
        category: IndustryFilter['category'];
        sortOrder?: number;
        disabled?: boolean;
    }[] => {
        const currentLang = i18n.language;

        return [...industryFilters]
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((filter: IndustryFilter) => ({
                label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
                value: filter.filterId,
                category: filter.category,
                sortOrder: filter.sortOrder,
            }));
    }, [industryFilters, i18n.language]);

    const groupedTimePeriodOptions = useMemo(
        () => ({
            SHIFT: timePeriodOptions.filter(
                (option) => option.category === 'SHIFT' || option.category === 'OT'
            ),
            PERIOD: timePeriodOptions.filter((option) => option.category === 'PERIOD'),
        }),
        [timePeriodOptions]
    );

    // Data fetching is triggered only by the Search button (handleSearch).
    // No auto-fire on mount, factory change, or filter change.
    const handleExportExcel = useCallback(async () => {
        if (!activeFactoryId) return;

        setIsExporting(true);
        try {
            const { blob, fileName } = isCustomRangeMode
                ? await ExcelExportService.getMachineStatusLogReportByDateRange(
                      activeFactoryId,
                      selectedStartDate,
                      selectedEndDate,
                      selectedTimePeriod
                  )
                : await ExcelExportService.getMachineStatusLogReportByFilter(
                      activeFactoryId,
                      selectedTimePeriod!,
                      selectedShiftFilterId
                  );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download =
                fileName ??
                `machine_status_log_report_${activeFactoryId}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('[Factory Overview] Excel export failed:', error);
            toast.error(t('errors.download'));
        } finally {
            setIsExporting(false);
        }
    }, [
        activeFactoryId,
        isCustomRangeMode,
        selectedStartDate,
        selectedEndDate,
        selectedTimePeriod,
        selectedShiftFilterId,
        t,
    ]);

    const handleApplyTimeFilter = useCallback(
        (payload: TimeFilterApplyPayload) => {
            const { mode, primaryFilterId, secondaryShiftId, startDate, endDate } = payload;

            setTimeFilterMode(mode);
            dispatch(factoryOverviewActions.setSelectedTimePeriod(primaryFilterId));
            dispatch(factoryOverviewActions.setSelectedShiftFilterId(secondaryShiftId));
            dispatch(
                factoryOverviewActions.setSelectedDateRange({
                    startDate,
                    endDate,
                })
            );

            if (!activeFactoryId) return;
            setHasSearched(true);

            if (mode === 'PRESET' && primaryFilterId !== null) {
                dispatch(
                    factoryOverviewActions.fetchSpaceOverview(
                        activeFactoryId,
                        primaryFilterId,
                        secondaryShiftId ?? undefined
                    )
                );
            } else {
                dispatch(
                    factoryOverviewActions.fetchSpaceOverviewByDateRange(
                        activeFactoryId,
                        startDate,
                        endDate,
                        primaryFilterId ?? undefined
                    )
                );
            }
        },
        [dispatch, activeFactoryId]
    );

    useEffect(() => {
        if (!activeFactoryId || hasSearched) return;
        if (!isDateRange && !selectedTimePeriod) return;
        const paramValue = searchParams.get('factoryId');
        if (paramValue && Number(paramValue) !== selectedFactoryId) return;
        setHasSearched(true);
        if (!isDateRange) {
            dispatch(
                factoryOverviewActions.fetchSpaceOverview(
                    activeFactoryId,
                    selectedTimePeriod!,
                    selectedShiftFilterId ?? undefined
                )
            );
        } else {
            dispatch(
                factoryOverviewActions.fetchSpaceOverviewByDateRange(
                    activeFactoryId,
                    selectedStartDate,
                    selectedEndDate,
                    selectedTimePeriod ?? undefined
                )
            );
        }
    }, [
        activeFactoryId,
        selectedFactoryId,
        searchParams,
        selectedTimePeriod,
        selectedShiftFilterId,
        hasSearched,
        isDateRange,
        selectedStartDate,
        selectedEndDate,
        dispatch,
    ]);

    const handleSearch = useCallback(() => {
        if (!activeFactoryId) return;
        if (timeFilterMode === 'PRESET' && !selectedTimePeriod) return;

        setHasSearched(true);

        if (timeFilterMode === 'PRESET') {
            dispatch(
                factoryOverviewActions.fetchSpaceOverview(
                    activeFactoryId,
                    selectedTimePeriod!,
                    selectedShiftFilterId ?? undefined
                )
            );
        } else {
            dispatch(
                factoryOverviewActions.fetchSpaceOverviewByDateRange(
                    activeFactoryId,
                    selectedStartDate,
                    selectedEndDate,
                    selectedTimePeriod ?? undefined
                )
            );
        }
    }, [
        activeFactoryId,
        dispatch,
        timeFilterMode,
        selectedTimePeriod,
        selectedShiftFilterId,
        selectedStartDate,
        selectedEndDate,
    ]);

    const currentPeriodId = useMemo(() => {
        if (timeFilterMode !== 'PRESET') return null;
        const primary = industryFilters.find((f) => f.filterId === selectedTimePeriod);
        return primary?.category === 'PERIOD' ? selectedTimePeriod : null;
    }, [timeFilterMode, industryFilters, selectedTimePeriod]);

    const currentShiftId = useMemo(() => {
        if (timeFilterMode === 'PRESET') {
            const primary = industryFilters.find((f) => f.filterId === selectedTimePeriod);
            return primary?.category === 'PERIOD' ? selectedShiftFilterId : selectedTimePeriod;
        }
        return selectedTimePeriod;
    }, [timeFilterMode, industryFilters, selectedTimePeriod, selectedShiftFilterId]);

    // Only feeds the SpaceOverviewGrid caption now — the popover's own trigger button
    // computes this label internally from the same currentMode/currentPeriodId/
    // currentShiftId props (see TimeFilterPopover.tsx).
    const activeTimePeriodLabel = useMemo(() => {
        const currentLang = i18n.language;
        const shiftFilter =
            currentShiftId != null
                ? industryFilters.find((f) => f.filterId === currentShiftId)
                : null;
        const shiftLabel = shiftFilter
            ? currentLang === 'vi'
                ? shiftFilter.displayNameVi
                : shiftFilter.displayNameEn
            : null;

        if (timeFilterMode === 'WEEK') {
            const startStr = dayjs(selectedStartDate).format('DD/MM');
            const endStr = dayjs(selectedEndDate).format('DD/MM');
            const weekNum = dayjs(selectedStartDate).isoWeek();
            const yearStr = dayjs(selectedStartDate).format('YYYY');
            const label = `${t('spaceMonitoring.timeFilter.weekLabel', { week: weekNum, year: yearStr })} (${startStr} → ${endStr})`;
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'MONTH') {
            const label = t('spaceMonitoring.timeFilter.monthLabel', {
                month: dayjs(selectedStartDate).format('MM'),
                year: dayjs(selectedStartDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'QUARTER') {
            const quarterNum = dayjs(selectedStartDate).quarter();
            const label = t('spaceMonitoring.timeFilter.quarterLabel', {
                quarter: quarterNum,
                year: dayjs(selectedStartDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'YEAR') {
            const label = t('spaceMonitoring.timeFilter.yearLabel', {
                year: dayjs(selectedStartDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'CUSTOM_RANGE') {
            const dateLabel = `${dayjs(selectedStartDate).format('DD/MM')} → ${dayjs(selectedEndDate).format('DD/MM')}`;
            return shiftLabel ? `${dateLabel} • ${shiftLabel}` : dateLabel;
        }

        const period = industryFilters.find((f) => f.filterId === currentPeriodId);
        const periodLabel = period
            ? currentLang === 'vi'
                ? period.displayNameVi
                : period.displayNameEn
            : null;

        if (!periodLabel) return shiftLabel;
        return shiftLabel ? `${periodLabel} • ${shiftLabel}` : periodLabel;
    }, [
        currentPeriodId,
        currentShiftId,
        industryFilters,
        timeFilterMode,
        selectedStartDate,
        selectedEndDate,
        i18n.language,
        t,
    ]);

    const headerActions = useMemo(
        () =>
            isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    {selectedFactoryId !== null &&
                        (isLoadingSpaces ? (
                            <Skeleton.Input active block style={{ height: 32 }} />
                        ) : (
                            <Select
                                value={selectedFactoryId}
                                onChange={(id: number) =>
                                    router.replace('/admin/space-monitoring?factoryId=' + id)
                                }
                                options={spaces.map((f) => ({
                                    label: `${f.spaceCode} — ${f.spaceName}`,
                                    value: f.spaceId,
                                }))}
                                style={{ width: '100%' }}
                                showSearch={{
                                    filterOption: (input, option) =>
                                        ((option?.label as string) ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase()),
                                }}
                            />
                        ))}

                    <TimeFilterPopover
                        currentMode={timeFilterMode}
                        currentPeriodId={currentPeriodId}
                        currentShiftId={currentShiftId}
                        currentStartDate={selectedStartDate}
                        currentEndDate={selectedEndDate}
                        groupedOptions={groupedTimePeriodOptions}
                        industryFilters={industryFilters}
                        isShiftActive={isShiftActive}
                        onApply={handleApplyTimeFilter}
                        placement="bottomLeft"
                    />

                    <Button
                        block
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleSearch}
                        loading={isLoading}
                        style={{ borderRadius: 8 }}
                    >
                        {t('spaceMonitoring.timeFilter.refreshData')}
                    </Button>

                    <Button
                        block
                        type="primary"
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                        loading={isExporting}
                        disabled={
                            !activeFactoryId || (!isCustomRangeMode && selectedTimePeriod === null)
                        }
                        style={{ borderRadius: 8 }}
                    >
                        {t('common.exportExcel')}
                    </Button>
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    {selectedFactoryId !== null &&
                        (isLoadingSpaces ? (
                            <Skeleton.Input active style={{ width: 220, height: 32 }} />
                        ) : (
                            <Select
                                value={selectedFactoryId}
                                onChange={(id: number) =>
                                    router.replace('/admin/space-monitoring?factoryId=' + id)
                                }
                                options={spaces.map((f) => ({
                                    label: `${f.spaceCode} — ${f.spaceName}`,
                                    value: f.spaceId,
                                }))}
                                style={{ width: 220 }}
                                showSearch={{
                                    filterOption: (input, option) =>
                                        ((option?.label as string) ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase()),
                                }}
                            />
                        ))}

                    <TimeFilterPopover
                        currentMode={timeFilterMode}
                        currentPeriodId={currentPeriodId}
                        currentShiftId={currentShiftId}
                        currentStartDate={selectedStartDate}
                        currentEndDate={selectedEndDate}
                        groupedOptions={groupedTimePeriodOptions}
                        industryFilters={industryFilters}
                        isShiftActive={isShiftActive}
                        onApply={handleApplyTimeFilter}
                        placement="bottomRight"
                    />

                    <Tooltip title={t('spaceMonitoring.timeFilter.refreshData')}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleSearch}
                            loading={isLoading}
                            style={{
                                borderRadius: 8,
                            }}
                            type="primary"
                        />
                    </Tooltip>

                    <Button
                        type="primary"
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                        loading={isExporting}
                        disabled={
                            !activeFactoryId || (!isCustomRangeMode && selectedTimePeriod === null)
                        }
                        style={{ borderRadius: 8 }}
                    >
                        {t('common.exportExcel')}
                    </Button>
                </div>
            ),
        [
            selectedFactoryId,
            isLoadingSpaces,
            spaces,
            isLoading,
            handleSearch,
            handleExportExcel,
            isExporting,
            activeFactoryId,
            isCustomRangeMode,
            selectedTimePeriod,
            router,
            t,
            timeFilterMode,
            currentPeriodId,
            currentShiftId,
            selectedStartDate,
            selectedEndDate,
            groupedTimePeriodOptions,
            industryFilters,
            isShiftActive,
            handleApplyTimeFilter,
            isMobile,
            i18n.language,
        ]
    );

    const gridFilterInfo = useMemo(
        () => ({
            factoryName: spaces.find((s) => s.spaceId === activeFactoryId)?.spaceName,
            timePeriod: activeTimePeriodLabel ?? undefined,
            timePeriodValue: selectedTimePeriod?.toString() ?? undefined,
        }),
        [spaces, activeFactoryId, activeTimePeriodLabel, selectedTimePeriod]
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

    const showFactoryCards = selectedFactoryId === null;
    const isZoneViewLoading = !showFactoryCards && hasSearched && isLoading;

    useEffect(() => {
        if (!showFactoryCards || isLoadingSpaces || spaces.length === 0) return;
        if (searchParams.get('factoryId')) return;
        router.replace('/admin/space-monitoring?factoryId=' + spaces[0].spaceId);
    }, [showFactoryCards, isLoadingSpaces, spaces, router, searchParams]);

    return (
        <>
            <ResponsivePageHeader
                title={t('permissionSubjects.space_monitoring')}
                rightContent={headerActions}
            />

            {showFactoryCards ? (
                isLoadingSpaces ? (
                    <div style={{ padding: '80px 0', textAlign: 'center' }}>
                        <Spin size="large" />
                    </div>
                ) : spaces.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', color: '#999' }}>
                        No factories found.
                    </div>
                ) : null
            ) : !hasSearched ? (
                <div style={{ padding: '80px 0', textAlign: 'center', color: '#999' }}>
                    <Typography.Text type="secondary">
                        {t(
                            'factoryOverview.emptyState',
                            'Select filters and click Search to load data'
                        )}
                    </Typography.Text>
                </div>
            ) : isZoneViewLoading ? (
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
                        filterInfo={gridFilterInfo}
                    />
                </>
            )}
        </>
    );
};

export default SpaceMonitoringPage;
