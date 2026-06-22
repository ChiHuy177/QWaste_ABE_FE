'use client';

// TEMP DISABLED: factory list grid — performance issue (parallel API calls per factory)
// To re-enable: remove the redirect block and restore the commented JSX below
// Related: enhance/fe-space-monitoring branch

import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import {
    Button,
    DatePicker,
    Divider,
    Grid,
    Popover,
    Radio,
    Select,
    Skeleton,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import FactoryStatsCards from './_components/FactoryStatsCards';
import SpaceOverviewGrid from './_components/SpaceOverviewGrid';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { factoryOverviewActions } from '@/stores';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { ArrowLeftOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
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

type TimeFilterMode = 'PRESET' | 'CUSTOM_RANGE';
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
    const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('PRESET');
    const [expandedSpaces, setExpandedSpaces] = useState<Set<number>>(new Set());
    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    // const [factoryCardsData, setFactoryCardsData] = useState<Record<number, SpaceOverview | null>>(
    //     {}
    // );
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
    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
    const [draftTimeFilterMode, setDraftTimeFilterMode] = useState<TimeFilterMode>(timeFilterMode);
    const [draftPeriodId, setDraftPeriodId] = useState<number | null>(null);
    const [draftShiftId, setDraftShiftId] = useState<number | null>(null);
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

    // Auto-select active shift on mount — Ca làm việc uses SHIFT as primary when no period chosen
    useEffect(() => {
        if (selectedTimePeriod || timeFilterMode !== 'PRESET' || industryFilters.length === 0)
            return;

        const activeShift = industryFilters.find(
            (filter) => filter.category === 'SHIFT' && isShiftActive(filter)
        );

        if (activeShift) {
            dispatch(factoryOverviewActions.setSelectedTimePeriod(activeShift.filterId));
        } else {
            dispatch(factoryOverviewActions.setSelectedTimePeriod(industryFilters[0].filterId));
        }
        dispatch(factoryOverviewActions.setSelectedShiftFilterId(null));
    }, [industryFilters, selectedTimePeriod, timeFilterMode, isShiftActive, dispatch]);

    const isCustomRangeMode = timeFilterMode === 'CUSTOM_RANGE';
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
        disabled?: boolean;
    }[] => {
        const currentLang = i18n.language;

        return industryFilters.map((filter: IndustryFilter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
            category: filter.category,
        }));
    }, [industryFilters, i18n.language]);

    const groupedTimePeriodOptions = useMemo(
        () => ({
            SHIFT: timePeriodOptions.filter((option) => option.category === 'SHIFT'),
            PERIOD: timePeriodOptions.filter((option) => option.category === 'PERIOD'),
        }),
        [timePeriodOptions]
    );


    // Data fetching is triggered only by the Search button (handleSearch).
    // No auto-fire on mount, factory change, or filter change.


    const syncDraftTimeFilter = useCallback(() => {
        setDraftTimeFilterMode(timeFilterMode);
        setDraftDateRange([dayjs(selectedStartDate), dayjs(selectedEndDate)]);

        if (timeFilterMode === 'PRESET') {
            const primaryFilter = industryFilters.find((f) => f.filterId === selectedTimePeriod);
            if (primaryFilter?.category === 'PERIOD') {
                setDraftPeriodId(selectedTimePeriod);
                setDraftShiftId(selectedShiftFilterId);
            } else {
                // SHIFT là primary (auto-select hoặc chỉ chọn Ca)
                setDraftPeriodId(null);
                setDraftShiftId(selectedTimePeriod);
            }
        } else {
            // CUSTOM_RANGE: shift lưu trong selectedTimePeriod (backward compat)
            setDraftPeriodId(null);
            setDraftShiftId(selectedTimePeriod);
        }
    }, [selectedEndDate, selectedStartDate, selectedTimePeriod, selectedShiftFilterId, timeFilterMode, industryFilters]);

    const handleTimeFilterOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                syncDraftTimeFilter();
            }
            setIsTimeFilterOpen(open);
        },
        [syncDraftTimeFilter]
    );

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
            message.error(t('errors.download'));
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

    const handleResetTimeFilter = useCallback(() => {
        const activeShift = industryFilters.find(
            (filter) => filter.category === 'SHIFT' && isShiftActive(filter)
        );

        setDraftTimeFilterMode('PRESET');
        setDraftPeriodId(null);
        setDraftShiftId(activeShift?.filterId ?? industryFilters[0]?.filterId ?? null);
        setDraftDateRange([dayjs(), dayjs()]);
    }, [industryFilters, isShiftActive]);

    const handleApplyTimeFilter = useCallback(() => {
        let primaryFilterId: number | null;
        let secondaryShiftId: number | null;

        if (draftTimeFilterMode === 'PRESET') {
            if (draftPeriodId !== null) {
                // Period selected → period là primary, Ca là secondary
                primaryFilterId = draftPeriodId;
                secondaryShiftId = draftShiftId;
            } else if (draftShiftId !== null) {
                // Chỉ Ca selected → Ca làm primary, không có secondary
                primaryFilterId = draftShiftId;
                secondaryShiftId = null;
            } else {
                return; // Không có gì được chọn
            }
        } else {
            // CUSTOM_RANGE: draftShiftId là Ca dropdown (backward compat với selectedTimePeriod)
            primaryFilterId = draftShiftId;
            secondaryShiftId = null;
        }

        setTimeFilterMode(draftTimeFilterMode);
        dispatch(factoryOverviewActions.setSelectedTimePeriod(primaryFilterId));
        dispatch(factoryOverviewActions.setSelectedShiftFilterId(secondaryShiftId));
        dispatch(
            factoryOverviewActions.setSelectedDateRange({
                startDate: draftDateRange[0].format('YYYY-MM-DD'),
                endDate: draftDateRange[1].format('YYYY-MM-DD'),
            })
        );
        setIsTimeFilterOpen(false);

        if (!activeFactoryId) return;
        setHasSearched(true);

        if (draftTimeFilterMode === 'PRESET' && primaryFilterId !== null) {
            dispatch(
                factoryOverviewActions.fetchSpaceOverview(
                    activeFactoryId,
                    primaryFilterId,
                    secondaryShiftId ?? undefined
                )
            );
        } else if (draftTimeFilterMode === 'CUSTOM_RANGE') {
            dispatch(
                factoryOverviewActions.fetchSpaceOverviewByDateRange(
                    activeFactoryId,
                    draftDateRange[0].format('YYYY-MM-DD'),
                    draftDateRange[1].format('YYYY-MM-DD'),
                    draftShiftId ?? undefined
                )
            );
        }
    }, [dispatch, draftDateRange, draftTimeFilterMode, draftPeriodId, draftShiftId, activeFactoryId]);


    useEffect(() => {
        if (!activeFactoryId || hasSearched) return;
        if (!isDateRange && !selectedTimePeriod) return;
        // When the URL carries a factoryId, wait until the param effect has
        // applied it — otherwise activeFactoryId still falls back to the stale
        // selectedSpaceId from the store and we'd fetch the wrong factory.
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
    }, [activeFactoryId, selectedFactoryId, searchParams, selectedTimePeriod, selectedShiftFilterId, hasSearched, isDateRange, selectedStartDate, selectedEndDate, dispatch]);

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

    const activeTimePeriodLabel = useMemo(() => {
        const currentLang = i18n.language;

        if (isCustomRangeMode) {
            const dateLabel = `${dayjs(selectedStartDate).format('DD/MM')} → ${dayjs(selectedEndDate).format('DD/MM')}`;
            if (selectedTimePeriod != null) {
                const shiftFilter = industryFilters.find((f) => f.filterId === selectedTimePeriod);
                const shiftLabel = shiftFilter
                    ? currentLang === 'vi'
                        ? shiftFilter.displayNameVi
                        : shiftFilter.displayNameEn
                    : null;
                if (shiftLabel) return `${dateLabel} • ${shiftLabel}`;
            }
            return dateLabel;
        }

        const primaryFilter = industryFilters.find((f) => f.filterId === selectedTimePeriod);
        const primaryLabel = primaryFilter
            ? currentLang === 'vi'
                ? primaryFilter.displayNameVi
                : primaryFilter.displayNameEn
            : null;

        if (!primaryLabel) return null;

        if (primaryFilter?.category === 'PERIOD' && selectedShiftFilterId != null) {
            const shiftFilter = industryFilters.find((f) => f.filterId === selectedShiftFilterId);
            const shiftLabel = shiftFilter
                ? currentLang === 'vi'
                    ? shiftFilter.displayNameVi
                    : shiftFilter.displayNameEn
                : null;
            return shiftLabel ? `${primaryLabel} • ${shiftLabel}` : primaryLabel;
        }

        return primaryLabel;
    }, [industryFilters, selectedTimePeriod, selectedShiftFilterId, isCustomRangeMode, selectedStartDate, selectedEndDate, i18n.language]);

    // TEMP DISABLED: factory list grid — do not fetch all-factory cards on load
    // Re-enable by restoring the loadFactoryCards useEffect when the factory cards grid is re-enabled

    const timeFilterPopoverContent = useMemo(() => {
        const isPreset = draftTimeFilterMode === 'PRESET';

        return (
            <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 360, maxWidth: 360 }}>
                <Typography.Text strong>
                    {i18n.language === 'vi' ? 'Thời gian' : 'Time Filter'}
                </Typography.Text>

                <Divider style={{ margin: '12px 0' }} />

                {/* Ca làm việc — independent selection, works in both modes */}
                {groupedTimePeriodOptions.SHIFT.length > 0 && (
                    <>
                        <Typography.Text
                            type="secondary"
                            style={{
                                display: 'block',
                                fontSize: 12,
                                fontWeight: 600,
                                marginBottom: 8,
                                textTransform: 'uppercase',
                            }}
                        >
                            {i18n.language === 'vi' ? 'Ca làm việc' : 'Shifts'}
                        </Typography.Text>
                        <Radio.Group
                            value={draftShiftId}
                            onChange={(e) => setDraftShiftId(e.target.value as number | null)}
                            style={{ width: '100%' }}
                        >
                            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                                <Radio value={null}>
                                    {i18n.language === 'vi' ? 'Tất cả' : 'All'}
                                </Radio>
                                {groupedTimePeriodOptions.SHIFT.map((option) => {
                                    const filter = industryFilters.find(
                                        (f) => f.filterId === option.value
                                    );
                                    const isActive = filter && isShiftActive(filter);

                                    return (
                                        <Radio key={option.value} value={option.value}>
                                            <Space size={4}>
                                                <Typography.Text
                                                    ellipsis
                                                    style={{
                                                        maxWidth: isMobile
                                                            ? 'calc(100vw - 150px)'
                                                            : 220,
                                                        verticalAlign: 'middle',
                                                    }}
                                                >
                                                    {option.label}
                                                </Typography.Text>
                                                {isActive && (
                                                    <Tag
                                                        color="green"
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 11,
                                                            lineHeight: '18px',
                                                            padding: '0 6px',
                                                        }}
                                                    >
                                                        {i18n.language === 'vi'
                                                            ? 'Đang hoạt động'
                                                            : 'Active'}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>

                        <Divider style={{ margin: '12px 0' }} />
                    </>
                )}

                {/* Khoảng thời gian (Periods) + Khoảng ngày toggle */}
                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                    {groupedTimePeriodOptions.PERIOD.length > 0 && (
                        <>
                            <Typography.Text type="secondary">
                                {i18n.language === 'vi' ? 'Chọn nhanh' : 'Quick Select'}
                            </Typography.Text>
                            <Radio.Group
                                value={isPreset ? draftPeriodId : null}
                                onChange={(e) => {
                                    setDraftPeriodId(e.target.value as number | null);
                                    setDraftTimeFilterMode('PRESET');
                                }}
                                style={{ width: '100%' }}
                            >
                                <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                                    {groupedTimePeriodOptions.PERIOD.map((option) => (
                                        <Radio key={option.value} value={option.value}>
                                            <Typography.Text
                                                ellipsis
                                                style={{
                                                    maxWidth: isMobile
                                                        ? 'calc(100vw - 120px)'
                                                        : 280,
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                {option.label}
                                            </Typography.Text>
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </>
                    )}

                    <Divider style={{ margin: '4px 0' }} />

                    <Radio
                        checked={draftTimeFilterMode === 'CUSTOM_RANGE'}
                        onChange={() => {
                            setDraftTimeFilterMode('CUSTOM_RANGE');
                            setDraftPeriodId(null);
                        }}
                    >
                        {i18n.language === 'vi' ? 'Khoảng ngày' : 'Custom Date Range'}
                    </Radio>
                </Space>

                <Space orientation="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
                    <DatePicker.RangePicker
                        value={draftDateRange}
                        onChange={(dates) => {
                            if (dates?.[0] && dates?.[1]) {
                                setDraftDateRange([dates[0], dates[1]]);
                                setDraftTimeFilterMode('CUSTOM_RANGE');
                                setDraftPeriodId(null);
                            }
                        }}
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: 8 }}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                        disabled={draftTimeFilterMode !== 'CUSTOM_RANGE'}
                    />
                </Space>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <Button onClick={handleResetTimeFilter}>{t('common.reset')}</Button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            onClick={() => {
                                syncDraftTimeFilter();
                                setIsTimeFilterOpen(false);
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleApplyTimeFilter}
                            disabled={
                                draftTimeFilterMode === 'PRESET' &&
                                draftPeriodId === null &&
                                draftShiftId === null
                            }
                        >
                            {i18n.language === 'vi' ? 'Áp dụng' : 'Apply'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }, [
        draftDateRange,
        draftTimeFilterMode,
        draftPeriodId,
        draftShiftId,
        handleApplyTimeFilter,
        handleResetTimeFilter,
        groupedTimePeriodOptions,
        i18n.language,
        industryFilters,
        isMobile,
        isShiftActive,
        syncDraftTimeFilter,
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
                                showSearch={{ filterOption: (input, option) => ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase()) }}
                            />
                        ))}

                    <Popover
                        open={isTimeFilterOpen}
                        onOpenChange={handleTimeFilterOpenChange}
                        trigger="click"
                        placement="bottomLeft"
                        content={timeFilterPopoverContent}
                    >
                        <Button
                            block
                            style={{
                                borderRadius: 8,
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
                                    maxWidth: 'calc(100% - 76px)',
                                    color: 'inherit',
                                    lineHeight: 'inherit',
                                }}
                            >
                                {activeTimePeriodLabel ?? t('common.filter')}
                            </Typography.Text>
                        </Button>
                    </Popover>

                    <Button
                        block
                        type='primary'
                        icon={<ReloadOutlined />}
                        onClick={handleSearch}
                        loading={isLoading}
                        style={{ borderRadius: 8 }}
                    >
                        {i18n.language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh data'}
                    </Button>

                    <Button
                        block
                        type='primary'
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
                    {selectedFactoryId !== null && (
                        isLoadingSpaces ? (
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
                                showSearch={{ filterOption: (input, option) => ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase()) }}
                            />
                        )
                    )}

                    <Popover
                        open={isTimeFilterOpen}
                        onOpenChange={handleTimeFilterOpenChange}
                        trigger="click"
                        placement="bottomRight"
                        content={timeFilterPopoverContent}
                    >
                        <Tooltip title={activeTimePeriodLabel}>
                            <Button
                                style={{
                                    borderRadius: 8,
                                    width: 220,
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
                                        maxWidth: 135,
                                        color: 'inherit',
                                        lineHeight: 'inherit',
                                    }}
                                >
                                    {activeTimePeriodLabel ?? t('common.filter')}
                                </Typography.Text>
                            </Button>
                        </Tooltip>
                    </Popover>

                    <Tooltip
                        title={i18n.language === 'vi' ? 'Làm mới dữ liệu' : 'Refresh data'}
                    >
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleSearch}
                            loading={isLoading}
                            style={{
                                borderRadius: 8,
                            }}
                            type='primary'
                        />
                    </Tooltip>

                    <Button
                        type='primary'
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
            timeFilterPopoverContent,
            isTimeFilterOpen,
            handleTimeFilterOpenChange,
            activeTimePeriodLabel,
            isMobile,
            i18n.language,
        ]
    );

    // const selectedFactoryName = useMemo(() => {
    //     if (!selectedFactoryId) return null;
    //     return spaces.find((space) => space.spaceId === selectedFactoryId)?.spaceName ?? null;
    // }, [selectedFactoryId, spaces]);

    // const breadcrumbItems = useMemo(() => {
    //     const base = [
    //         { title: <Link href="/">{t('common.home', 'Home')}</Link> },
    //         {
    //             title: (
    //                 <Link href="/admin/space-monitoring">
    //                     {t('permissionSubjects.space_monitoring')}
    //                 </Link>
    //             ),
    //         },
    //     ];
    //     if (!selectedFactoryName) return base;
    //     return [
    //         ...base,
    //         {
    //             title: <span>{selectedFactoryName}</span>,
    //         },
    //     ];
    // }, [selectedFactoryId, selectedFactoryName, t]);

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

    // const factoryGridStats = useMemo(() => {
    //     const allOverviews = Object.values(factoryCardsData).filter(Boolean) as SpaceOverview[];
    //     if (allOverviews.length === 0) {
    //         return { energyConsumption: 0, totalRunTime: 0, totalStopTime: 0, totalErrorTime: 0 };
    //     }
    //     const allMachines = allOverviews.flatMap(collectAllMachines);
    //     const stats = computeStatsFromMachines(allMachines);
    //     return {
    //         energyConsumption: stats.energyKwh,
    //         totalRunTime: stats.runtimeSeconds / 3600,
    //         totalStopTime: stats.idleSeconds / 3600,
    //         totalErrorTime: stats.errorSeconds / 3600,
    //     };
    // }, [factoryCardsData]);

    const showFactoryCards = selectedFactoryId === null;
    const isZoneViewLoading = !showFactoryCards && hasSearched && isLoading;

    // PART 1: redirect to first factory when spaces are loaded and no factory is selected.
    // Skip when the URL already carries a factoryId (e.g. arriving from floor-map) —
    // selectedFactoryId is still null on first render and the param effect hasn't
    // applied it yet, so replacing here would clobber the requested factory.
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

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: 12,
                    width: '100%',
                }}
            >
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/admin/floor-map/status')}
                    style={{
                        borderRadius: 8,
                        width: isMobile ? '100%' : undefined,
                    }}
                >
                    {t('common.back')} {t('floorMap.viewTitle')}
                </Button>
            </div>

            {/* <Breadcrumb
                items={breadcrumbItems}
                style={{ marginBottom: 16, color: 'inherit' }}
            /> */}

            {showFactoryCards ? (
                // PART 1: factory list disabled — show spinner while fetching, then redirect fires
                isLoadingSpaces ? (
                    <div style={{ padding: '80px 0', textAlign: 'center' }}>
                        <Spin size="large" />
                    </div>
                ) : spaces.length === 0 ? (
                    <div style={{ padding: '80px 0', textAlign: 'center', color: '#999' }}>
                        No factories found.
                    </div>
                ) : null /* redirect is in flight */
            ) : !hasSearched ? (
                // PART 2a: factory selected but Search not yet clicked — show placeholder
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
                // PART 2b: factory detail view — data loaded after Search click
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
                            factoryName: spaces.find((s) => s.spaceId === activeFactoryId)
                                ?.spaceName,
                            timePeriod: activeTimePeriodLabel ?? undefined,
                            timePeriodValue: selectedTimePeriod?.toString() ?? undefined,
                        }}
                    />
                </>
            )}

        </>
    );
};

/*
 * TEMP DISABLED — original factory list return preserved below for restore.
 * To re-enable: remove the redirect useEffect above and swap this back in.
 *
 * return (
 *     <>
 *         <ResponsivePageHeader title={t('permissionSubjects.space_monitoring')} rightContent={headerActions} />
 *         <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16, color: 'inherit' }} />
 *
 *         {showFactoryCards ? (
 *             isLoadingSpaces ? (
 *                 <div style={{ padding: '80px 0', textAlign: 'center' }}>
 *                     <Spin size="large" description={t('common.loading')} />
 *                 </div>
 *             ) : (
 *                 <>
 *                     <FactoryStatsCards
 *                         energyConsumption={factoryGridStats.energyConsumption}
 *                         totalRunTime={factoryGridStats.totalRunTime}
 *                         totalStopTime={factoryGridStats.totalStopTime}
 *                         totalErrorTime={factoryGridStats.totalErrorTime}
 *                     />
 *                     <FactoryCardsGrid
 *                         factories={spaces}
 *                         overviewMap={factoryCardsData}
 *                         loading={isFactoryCardsLoading}
 *                         onSelect={handleFactorySelect}
 *                     />
 *                 </>
 *             )
 *         ) : isZoneViewLoading ? (
 *             <div style={{ padding: '80px 0', textAlign: 'center' }}>
 *                 <Spin size="large" description={t('common.loading')} />
 *             </div>
 *         ) : (
 *             <>
 *                 <Button
 *                     type="link"
 *                     icon={<LeftOutlined />}
 *                     onClick={handleBackToFactories}
 *                     style={{ padding: 0, marginBottom: 16 }}
 *                 >
 *                     {t('factoryOverview.allFactories', 'All factories')}
 *                 </Button>
 *                 <FactoryStatsCards
 *                     energyConsumption={factoryStats.energyConsumption}
 *                     totalRunTime={factoryStats.totalRunTime}
 *                     totalStopTime={factoryStats.totalStopTime}
 *                     totalErrorTime={factoryStats.totalErrorTime}
 *                 />
 *                 <SpaceOverviewGrid
 *                     spaceData={spaceData}
 *                     expandedSpaces={expandedSpaces}
 *                     onToggle={handleToggleSpace}
 *                     filterInfo={{
 *                         factoryName: spaces.find((s) => s.spaceId === activeFactoryId)?.spaceName,
 *                         timePeriod: timePeriodOptions.find((tp) => tp.value === selectedTimePeriod)?.label,
 *                         timePeriodValue: selectedTimePeriod?.toString() ?? undefined,
 *                     }}
 *                 />
 *             </>
 *         )}
 *     </>
 * );
 */

export default SpaceMonitoringPage;
