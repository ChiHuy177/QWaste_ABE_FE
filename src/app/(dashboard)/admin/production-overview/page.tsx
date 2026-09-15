'use client';

import { ErrorAnalyticsModal } from './_components/ErrorAnalyticsModal';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Col, Row, Spin } from 'antd';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { factoryOverviewActions } from '@/stores';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { DashboardService } from '@/services/DashboardService';
import { IndustryFilter } from '@/types/IndustryFilter';
import {
    DashboardMachineEfficiencyResponse,
    DashboardMachineProductionResponse,
    DashboardItemProductionResponse,
    DashboardMachineProductionSeriesResponse,
    SingleMachinePerformanceResponse,
    SingleMachineKpiSummaryState,
} from '@/types/Dashboard';
import { KpiSummaryData } from '@/types/ProductionOverview';
import { ExcelExportService } from '@/services/ExcelExportService';

import { ProductionOverviewHeader } from './_components/ProductionOverviewHeader';
import {
    PeriodFilterMode,
    TimeFilterApplyPayload,
} from '@/app/(dashboard)/admin/space-monitoring/_components/TimeFilterPopover';
import { KpiCardsSection } from './_components/KpiCardsSection';
import { MachineOeeChartCard } from './_components/MachineOeeChartCard';
import { MachinePlanVsActualChartCard } from './_components/MachinePlanVsActualChartCard';
import { ProductPlanVsActualChartCard } from './_components/ProductPlanVsActualChartCard';
import { MachineDetailView, MachineListItem } from './_components/MachineDetailView';

const isShiftActiveHelper = (filter: IndustryFilter): boolean => {
    if (filter.category !== 'SHIFT') return false;
    const currentTime = dayjs().format('HH:mm:ss');
    if (!filter.crossesMidnight) {
        return currentTime >= filter.startTime && currentTime < filter.endTime;
    }
    return currentTime >= filter.startTime || currentTime < filter.endTime;
};

const ProductionOverviewPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();
    usePageTitle(t('permissionSubjects.production_overview'));

    const spaces = useAppSelector((state) => state.factoryOverview.spaces);
    const isLoadingSpaces = useAppSelector((state) => state.factoryOverview.isLoadingSpaces);

    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);

    // Time filter states (synced with space-monitoring PeriodFilterMode)
    const [timeFilterMode, setTimeFilterMode] = useState<PeriodFilterMode>('PRESET');
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<number | null>(null);
    const [selectedShiftFilterId, setSelectedShiftFilterId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

    const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [liveKpiData, setLiveKpiData] = useState<KpiSummaryData | null>(null);
    const [liveChartsData, setLiveChartsData] = useState<{
        machineEfficiency: DashboardMachineEfficiencyResponse[] | null;
        machineProduction: DashboardMachineProductionResponse[] | null;
        itemProduction: DashboardItemProductionResponse[] | null;
    }>({
        machineEfficiency: null,
        machineProduction: null,
        itemProduction: null,
    });

    // Selected machine state for drilldown
    const [selectedMachineCode, setSelectedMachineCode] = useState<string | null>(null);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [machineProductionSeries, setMachineProductionSeries] =
        useState<DashboardMachineProductionSeriesResponse | null>(null);
    const [isLoadingMachineSeries, setIsLoadingMachineSeries] = useState<boolean>(false);
    const [singleMachinePerformance, setSingleMachinePerformance] =
        useState<SingleMachinePerformanceResponse | null>(null);
    const [isLoadingMachinePerformance, setIsLoadingMachinePerformance] = useState<boolean>(false);
    const [singleMachineKpis, setSingleMachineKpis] = useState<SingleMachineKpiSummaryState | null>(
        null
    );
    const [isLoadingMachineKpis, setIsLoadingMachineKpis] = useState<boolean>(false);
    const [machineRefreshTrigger, setMachineRefreshTrigger] = useState<number>(0);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    // Fetch spaces on mount
    useEffect(() => {
        dispatch(factoryOverviewActions.fetchSpaces());
    }, [dispatch]);

    // Select first factory by default
    useEffect(() => {
        if (spaces && spaces.length > 0 && selectedFactoryId === null) {
            setSelectedFactoryId(spaces[0].spaceId);
        }
    }, [spaces, selectedFactoryId]);

    // Fetch industry filters on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const filters = await IndustryFilterService.getIndustryFiltersForPicking();
                setIndustryFilters(filters);
                if (filters.length > 0) {
                    const dayShiftFilter =
                        filters.find(
                            (f) =>
                                f.category === 'SHIFT' &&
                                (f.displayNameVi?.toLowerCase().includes('ngày') ||
                                    f.displayNameEn?.toLowerCase().includes('day') ||
                                    f.shiftNumber === 1 ||
                                    f.displayNameVi?.toLowerCase().includes('ca 1') ||
                                    f.displayNameEn?.toLowerCase().includes('shift 1'))
                        ) ||
                        filters.find((f) => f.category === 'SHIFT' && isShiftActiveHelper(f)) ||
                        filters.find((f) => f.category === 'SHIFT');

                    if (dayShiftFilter) {
                        setSelectedTimePeriod(dayShiftFilter.filterId);
                        setSelectedShiftFilterId(null);
                    } else {
                        const defaultPeriod =
                            filters.find(
                                (f) => f.category === 'PERIOD' && f.periodCode === 'TODAY'
                            ) || filters[0];
                        setSelectedTimePeriod(defaultPeriod.filterId);
                    }
                }
            } catch (err) {
                console.error('Failed to load industry filters:', err);
            }
        };
        fetchFilters();
    }, []);

    const isCustomRangeMode = timeFilterMode !== 'PRESET';

    const isShiftActive = useCallback((filter: IndustryFilter): boolean => {
        return isShiftActiveHelper(filter);
    }, []);

    const timePeriodOptions = useMemo(() => {
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

    // Active period filter object lookup
    const activeFilterObj = useMemo(() => {
        if (timeFilterMode !== 'PRESET') return null;
        return industryFilters.find((f) => f.filterId === selectedTimePeriod);
    }, [timeFilterMode, industryFilters, selectedTimePeriod]);

    // Subtitle label for current filter (synced with space-monitoring)
    const activeFilterLabel = useMemo(() => {
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
            const startStr = dayjs(startDate).format('DD/MM');
            const endStr = dayjs(endDate).format('DD/MM');
            const weekNum = dayjs(startDate).isoWeek();
            const yearStr = dayjs(startDate).format('YYYY');
            const label = `${t('spaceMonitoring.timeFilter.weekLabel', { week: weekNum, year: yearStr })} (${startStr} → ${endStr})`;
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'MONTH') {
            const label = t('spaceMonitoring.timeFilter.monthLabel', {
                month: dayjs(startDate).format('MM'),
                year: dayjs(startDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'QUARTER') {
            const quarterNum = dayjs(startDate).quarter();
            const label = t('spaceMonitoring.timeFilter.quarterLabel', {
                quarter: quarterNum,
                year: dayjs(startDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'YEAR') {
            const label = t('spaceMonitoring.timeFilter.yearLabel', {
                year: dayjs(startDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (timeFilterMode === 'CUSTOM_RANGE') {
            const dateLabel = `${dayjs(startDate).format('DD/MM')} → ${dayjs(endDate).format('DD/MM')}`;
            return shiftLabel ? `${dateLabel} • ${shiftLabel}` : dateLabel;
        }

        const period = industryFilters.find((f) => f.filterId === currentPeriodId);
        const periodLabel = period
            ? currentLang === 'vi'
                ? period.displayNameVi
                : period.displayNameEn
            : null;

        if (!periodLabel) return shiftLabel ?? '';
        return shiftLabel ? `${periodLabel} • ${shiftLabel}` : periodLabel;
    }, [
        currentPeriodId,
        currentShiftId,
        industryFilters,
        timeFilterMode,
        startDate,
        endDate,
        i18n.language,
        t,
    ]);

    // Request Key guard to prevent duplicate API calls
    const lastFetchedParamsRef = useRef<string>('');

    // Fetch live Dashboard KPI Widgets & Charts data
    const fetchDashboardData = useCallback(
        async (
            force = false,
            overrideParams?: {
                factoryId?: number | null;
                mode?: PeriodFilterMode;
                periodId?: number | null;
                shiftId?: number | null;
                startDate?: string;
                endDate?: string;
            }
        ) => {
            const effectiveFactoryId =
                overrideParams?.factoryId !== undefined
                    ? overrideParams.factoryId
                    : selectedFactoryId;
            const effectiveMode = overrideParams?.mode ?? timeFilterMode;
            const effectivePeriodId =
                overrideParams?.periodId !== undefined
                    ? overrideParams.periodId
                    : selectedTimePeriod;
            const effectiveShiftId =
                overrideParams?.shiftId !== undefined
                    ? overrideParams.shiftId
                    : selectedShiftFilterId;
            const effectiveStartDate = overrideParams?.startDate ?? startDate;
            const effectiveEndDate = overrideParams?.endDate ?? endDate;

            const isCustom = effectiveMode !== 'PRESET';

            if (!effectiveFactoryId) return;
            if (!isCustom && !effectivePeriodId) return;

            const requestKey = `${effectiveFactoryId}_${effectiveMode}_${effectivePeriodId}_${effectiveShiftId}_${effectiveStartDate}_${effectiveEndDate}`;
            if (!force && lastFetchedParamsRef.current === requestKey) {
                return;
            }
            lastFetchedParamsRef.current = requestKey;

            setIsLoadingData(true);
            try {
                let effectiveFilterId: number | null = null;
                let effectiveShiftFilterId: number | null = null;
                let effectiveIsShift = false;

                if (isCustom) {
                    effectiveFilterId = effectivePeriodId ?? null;
                    effectiveShiftFilterId = null;
                    effectiveIsShift = !!effectivePeriodId;
                } else {
                    const filterObj = industryFilters.find((f) => f.filterId === effectivePeriodId);
                    const isShift = filterObj?.category === 'SHIFT';
                    effectiveFilterId = effectivePeriodId;
                    effectiveShiftFilterId = isShift ? null : effectiveShiftId;
                    effectiveIsShift = isShift;
                }

                const apiMode: 'PRESET' | 'CUSTOM_RANGE' = isCustom ? 'CUSTOM_RANGE' : 'PRESET';

                const [kpiResult, chartsResult] = await Promise.allSettled([
                    DashboardService.getOverviewKpis({
                        spaceId: effectiveFactoryId,
                        mode: apiMode,
                        filterId: effectiveFilterId,
                        shiftFilterId: effectiveShiftFilterId,
                        isShiftFilter: effectiveIsShift,
                        startDate: effectiveStartDate,
                        endDate: effectiveEndDate,
                    }),
                    DashboardService.getDashboardCharts({
                        spaceId: effectiveFactoryId,
                        mode: apiMode,
                        filterId: effectiveFilterId,
                        shiftFilterId: effectiveShiftFilterId,
                        isShiftFilter: effectiveIsShift,
                        startDate: effectiveStartDate,
                        endDate: effectiveEndDate,
                    }),
                ]);

                const kpis = kpiResult.status === 'fulfilled' ? kpiResult.value : null;
                const charts = chartsResult.status === 'fulfilled' ? chartsResult.value : null;

                // Map KPI API response to KpiSummaryData dynamically
                if (kpis && (kpis.efficiency || kpis.downtime || kpis.runtime || kpis.production)) {
                    const totalEff = kpis.efficiency?.totalEfficiencyPercentage ?? null;
                    const effDelta = kpis.efficiency?.efficiencyDeltaPercentage ?? null;
                    const totalDowntimeSec = kpis.downtime?.totalDowntimeSeconds ?? 0;
                    const downtimeHoursVal = Number((totalDowntimeSec / 3600).toFixed(1));
                    const downtimeMins = Math.round(totalDowntimeSec / 60);
                    const totalRuntimeSec = kpis.runtime?.totalRuntimeSeconds ?? 0;
                    const runtimeHoursVal = Number((totalRuntimeSec / 3600).toFixed(1));
                    const runtimeMins = Math.round(totalRuntimeSec / 60);
                    const actualQty = kpis.production?.actualQuantity ?? 0;
                    const plannedQty = kpis.production?.plannedQuantity ?? 0;
                    const prodRatio = kpis.production?.productionRatioPercentage ?? null;

                    const oeeVal = totalEff != null ? Number(totalEff.toFixed(1)) : 0;
                    const yieldVal = prodRatio != null ? Number(prodRatio.toFixed(1)) : 0;

                    const statusTag =
                        oeeVal >= 85
                            ? t('productionOverview.kpi.targetMet', 'Đạt mục tiêu (≥85%)')
                            : oeeVal >= 70
                              ? t('productionOverview.kpi.improveArea', 'Vùng cải thiện (70–84%)')
                              : t('productionOverview.kpi.needImprove', 'Cần cải thiện (<70%)');

                    const actualCap =
                        runtimeHoursVal > 0 ? Math.round(actualQty / runtimeHoursVal) : 0;

                    setLiveKpiData({
                        oee: {
                            current: oeeVal,
                            target: 85.0,
                            yesterdayDiff: effDelta != null ? Number(effDelta.toFixed(1)) : 0,
                            statusTag,
                        },
                        maxCapacity: {
                            current: 0,
                            unit: 'h',
                            seconds: 0,
                        },
                        maxCapacitySeconds: 0,
                        downtimeMinutes: {
                            current: downtimeMins,
                            overTargetMinutes: 0,
                        },
                        downtimeHours: {
                            current: downtimeHoursVal,
                            overTargetHours: 0,
                        },
                        runtimeSeconds: totalRuntimeSec,
                        runtimeMinutes: {
                            current: runtimeMins,
                        },
                        runtimeHours: {
                            current: runtimeHoursVal,
                        },
                        actualCapacity: {
                            current: actualCap,
                            unit: 'sp/h',
                            rateVsMax: 0,
                        },
                        yieldRate: {
                            current: yieldVal,
                            targetText: t('productionOverview.kpi.vsPlan'),
                        },
                        actualProduction: {
                            current: actualQty,
                            target: plannedQty,
                            unit: t('productionOverview.machineDetail.pcs', 'sp'),
                        },
                    });
                } else {
                    setLiveKpiData(null);
                }

                // Map Charts API responses
                if (
                    charts &&
                    (charts.machineEfficiency || charts.machineProduction || charts.itemProduction)
                ) {
                    setLiveChartsData({
                        machineEfficiency: charts.machineEfficiency,
                        machineProduction: charts.machineProduction,
                        itemProduction: charts.itemProduction,
                    });
                } else {
                    setLiveChartsData({
                        machineEfficiency: null,
                        machineProduction: null,
                        itemProduction: null,
                    });
                }
            } catch (_error) {
                setLiveKpiData(null);
                setLiveChartsData({
                    machineEfficiency: null,
                    machineProduction: null,
                    itemProduction: null,
                });
            } finally {
                setIsLoadingData(false);
            }
        },
        [
            selectedFactoryId,
            timeFilterMode,
            selectedTimePeriod,
            selectedShiftFilterId,
            industryFilters,
            startDate,
            endDate,
            t,
        ]
    );

    // Fetch dashboard KPIs and charts on filter change (only when on Plant Overview screen)
    useEffect(() => {
        if (
            !selectedMachineCode &&
            selectedFactoryId &&
            (selectedTimePeriod || isCustomRangeMode)
        ) {
            fetchDashboardData();
        }
    }, [
        fetchDashboardData,
        selectedMachineCode,
        selectedFactoryId,
        selectedTimePeriod,
        isCustomRangeMode,
        selectedShiftFilterId,
        startDate,
        endDate,
    ]);

    // Direct live KPI data or clean zero state (no fake mock fallback)
    const currentKpiData = useMemo<KpiSummaryData>(() => {
        if (liveKpiData) return liveKpiData;
        return {
            oee: {
                current: 0,
                target: 85.0,
                yesterdayDiff: 0,
                statusTag: t('productionOverview.kpi.needImprove', 'Cần cải thiện (<70%)'),
            },
            downtimeMinutes: {
                current: 0,
                overTargetMinutes: 0,
            },
            downtimeHours: {
                current: 0,
                overTargetHours: 0,
            },
            runtimeSeconds: 0,
            runtimeMinutes: {
                current: 0,
            },
            runtimeHours: {
                current: 0,
            },
            maxCapacity: {
                current: 0,
                unit: 'h',
                seconds: 0,
            },
            maxCapacitySeconds: 0,
            actualCapacity: {
                current: 0,
                unit: 'sp/h',
                rateVsMax: 0,
            },
            yieldRate: {
                current: 0,
                targetText: t('productionOverview.kpi.vsPlan'),
            },
            actualProduction: {
                current: 0,
                target: 0,
                unit: t('productionOverview.machineDetail.pcs', 'sp'),
            },
        };
    }, [liveKpiData, t]);

    // Direct live Chart data from API (displays Empty state when no data, never shows fake mock data)
    const currentMachineEfficiency = useMemo(() => {
        return liveChartsData.machineEfficiency ?? [];
    }, [liveChartsData.machineEfficiency]);

    const currentMachineProduction = useMemo(() => {
        return liveChartsData.machineProduction ?? [];
    }, [liveChartsData.machineProduction]);

    const currentProductProduction = useMemo(() => {
        return liveChartsData.itemProduction ?? [];
    }, [liveChartsData.itemProduction]);

    // Available machines list for fast switcher from live data
    const availableMachineList = useMemo<MachineListItem[]>(() => {
        const map = new Map<string, MachineListItem>();
        if (liveChartsData.machineEfficiency) {
            liveChartsData.machineEfficiency.forEach((m) => {
                const code = m.machineCode || m.machineName;
                if (code) {
                    map.set(code, {
                        machineId: m.machineId,
                        machineCode: code,
                        machineName: m.machineName,
                    });
                }
            });
        }
        if (liveChartsData.machineProduction) {
            liveChartsData.machineProduction.forEach((m) => {
                const code = m.machineCode || m.machineName;
                if (code && !map.has(code)) {
                    map.set(code, {
                        machineId: m.machineId,
                        machineCode: code,
                        machineName: m.machineName,
                    });
                }
            });
        }
        return Array.from(map.values());
    }, [liveChartsData]);

    // Handler when user selects a machine from any chart/table/switcher
    const handleSelectMachine = useCallback((machineCode: string, machineId?: string) => {
        setSelectedMachineCode(machineCode);
        if (machineId) {
            setSelectedMachineId(machineId);
        } else {
            setSelectedMachineId(null);
        }
    }, []);

    const handleFactoryChange = useCallback(
        (id: number) => {
            setSelectedFactoryId(id);
            fetchDashboardData(true, { factoryId: id });
        },
        [fetchDashboardData]
    );

    const handleBackToOverview = useCallback(() => {
        setSelectedMachineCode(null);
        setSelectedMachineId(null);
        setMachineProductionSeries(null);
        setSingleMachinePerformance(null);
        setSingleMachineKpis(null);
    }, []);

    const handleOpenErrorModal = useCallback(() => {
        setIsErrorModalOpen(true);
    }, []);

    const handleCloseErrorModal = useCallback(() => {
        setIsErrorModalOpen(false);
    }, []);

    // Resolve machineId from live datasets or selectedMachineId
    const resolvedMachineId = useMemo(() => {
        if (selectedMachineId) return selectedMachineId;
        if (!selectedMachineCode) return null;

        const inEff = liveChartsData.machineEfficiency?.find(
            (m) =>
                m.machineCode === selectedMachineCode ||
                m.machineName === selectedMachineCode ||
                m.machineId === selectedMachineCode
        );
        if (inEff?.machineId) return inEff.machineId;

        const inProd = liveChartsData.machineProduction?.find(
            (m) =>
                m.machineCode === selectedMachineCode ||
                m.machineName === selectedMachineCode ||
                m.machineId === selectedMachineCode
        );
        if (inProd?.machineId) return inProd.machineId;

        if (/^[0-9a-fA-F-]{36}$/.test(selectedMachineCode)) {
            return selectedMachineCode;
        }

        return null;
    }, [selectedMachineId, selectedMachineCode, liveChartsData]);

    // Fetch Machine Production Series and Single Machine Performance Report for selected machine
    useEffect(() => {
        if (!resolvedMachineId) {
            setMachineProductionSeries(null);
            setSingleMachinePerformance(null);
            setSingleMachineKpis(null);
            return;
        }

        let isMounted = true;
        const fetchMachineDetailData = async () => {
            setIsLoadingMachineSeries(true);
            setIsLoadingMachinePerformance(true);
            setIsLoadingMachineKpis(true);
            try {
                const isShift = activeFilterObj?.category === 'SHIFT';
                let prodPromise: Promise<DashboardMachineProductionSeriesResponse>;
                let perfPromise: Promise<SingleMachinePerformanceResponse>;
                const apiMode: 'PRESET' | 'CUSTOM_RANGE' = isCustomRangeMode
                    ? 'CUSTOM_RANGE'
                    : 'PRESET';

                if (isCustomRangeMode && startDate && endDate) {
                    const shiftFilter = currentShiftId ?? undefined;

                    prodPromise = DashboardService.getMachineProductionSeriesByDateRange({
                        machineId: resolvedMachineId,
                        startDate,
                        endDate,
                        filterId: shiftFilter,
                    });
                    perfPromise = DashboardService.getSingleMachinePerformanceByDateRange({
                        machineId: resolvedMachineId,
                        startDate,
                        endDate,
                        filterId: shiftFilter,
                    });
                } else if (selectedTimePeriod) {
                    prodPromise = DashboardService.getMachineProductionSeriesByFilter({
                        machineId: resolvedMachineId,
                        filterId: selectedTimePeriod,
                        shiftFilterId: selectedShiftFilterId,
                    });
                    perfPromise = DashboardService.getSingleMachinePerformanceByFilter({
                        machineId: resolvedMachineId,
                        filterId: selectedTimePeriod,
                        shiftFilterId: selectedShiftFilterId,
                    });
                } else {
                    return;
                }

                // Fetch Single Machine KPI Widgets (DASHBOARD_KPI_WIDGETS_SINGLE_MACHINE.md)
                const effectiveFilterId = isCustomRangeMode
                    ? (currentShiftId ?? null)
                    : selectedTimePeriod;
                const effectiveShiftFilterId = isCustomRangeMode ? null : selectedShiftFilterId;
                const effectiveIsShift = isCustomRangeMode ? !!currentShiftId : isShift;

                const kpiPromise = DashboardService.getSingleMachineOverviewKpis({
                    machineId: resolvedMachineId,
                    mode: apiMode,
                    filterId: effectiveFilterId,
                    shiftFilterId: effectiveShiftFilterId,
                    isShiftFilter: effectiveIsShift,
                    startDate,
                    endDate,
                });

                const [prodRes, perfRes, kpiRes] = await Promise.allSettled([
                    prodPromise,
                    perfPromise,
                    kpiPromise,
                ]);

                if (isMounted) {
                    if (prodRes.status === 'fulfilled') {
                        setMachineProductionSeries(prodRes.value);
                    } else {
                        console.error('Failed to fetch machine production series:', prodRes.reason);
                        setMachineProductionSeries(null);
                    }

                    if (perfRes.status === 'fulfilled') {
                        setSingleMachinePerformance(perfRes.value);
                    } else {
                        console.error(
                            'Failed to fetch single machine performance:',
                            perfRes.reason
                        );
                        setSingleMachinePerformance(null);
                    }

                    if (kpiRes.status === 'fulfilled') {
                        setSingleMachineKpis(kpiRes.value);
                    } else {
                        console.error('Failed to fetch single machine KPIs:', kpiRes.reason);
                        setSingleMachineKpis(null);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch machine detail data:', error);
                if (isMounted) {
                    setMachineProductionSeries(null);
                    setSingleMachinePerformance(null);
                    setSingleMachineKpis(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingMachineSeries(false);
                    setIsLoadingMachinePerformance(false);
                    setIsLoadingMachineKpis(false);
                }
            }
        };

        fetchMachineDetailData();

        return () => {
            isMounted = false;
        };
    }, [
        resolvedMachineId,
        timeFilterMode,
        isCustomRangeMode,
        selectedTimePeriod,
        selectedShiftFilterId,
        startDate,
        endDate,
        activeFilterObj,
        machineRefreshTrigger,
    ]);

    // Refresh action
    const handleRefresh = useCallback(() => {
        if (selectedMachineCode) {
            setMachineRefreshTrigger((prev) => prev + 1);
        } else {
            fetchDashboardData(true);
        }
        toast.success(t('productionOverview.actions.refreshSuccess'));
    }, [selectedMachineCode, fetchDashboardData, t]);

    const handleApplyTimeFilter = useCallback(
        (payload: TimeFilterApplyPayload) => {
            const {
                mode,
                primaryFilterId,
                secondaryShiftId,
                startDate: sDate,
                endDate: eDate,
            } = payload;
            setTimeFilterMode(mode);
            setSelectedTimePeriod(primaryFilterId);
            setSelectedShiftFilterId(secondaryShiftId);
            setStartDate(sDate);
            setEndDate(eDate);

            if (selectedMachineCode) {
                setMachineRefreshTrigger((prev) => prev + 1);
            } else if (selectedFactoryId) {
                fetchDashboardData(true, {
                    factoryId: selectedFactoryId,
                    mode,
                    periodId: primaryFilterId,
                    shiftId: secondaryShiftId,
                    startDate: sDate,
                    endDate: eDate,
                });
            }
        },
        [selectedMachineCode, selectedFactoryId, fetchDashboardData]
    );

    const handleExportExcel = useCallback(async () => {
        if (!selectedFactoryId) return;

        setIsExporting(true);
        try {
            const { blob, fileName } = isCustomRangeMode
                ? await ExcelExportService.getMachineStatusLogReportByDateRange(
                      selectedFactoryId,
                      startDate,
                      endDate,
                      currentShiftId ?? undefined
                  )
                : await ExcelExportService.getMachineStatusLogReportByFilter(
                      selectedFactoryId,
                      (currentPeriodId ?? currentShiftId)!,
                      currentPeriodId !== null ? currentShiftId : null
                  );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download =
                fileName ??
                `machine_status_log_report_${selectedFactoryId}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(
                t('productionOverview.actions.exportSuccess', 'Xuất báo cáo thành công!')
            );
        } catch (error) {
            console.error('[Production Overview] Excel export failed:', error);
            toast.error(t('common.error', 'Lỗi khi tải báo cáo'));
        } finally {
            setIsExporting(false);
        }
    }, [
        selectedFactoryId,
        isCustomRangeMode,
        startDate,
        endDate,
        currentPeriodId,
        currentShiftId,
        t,
    ]);

    const selectedMachineName = useMemo(() => {
        return (
            singleMachinePerformance?.machineName ||
            machineProductionSeries?.machineName ||
            singleMachineKpis?.efficiency?.machineName ||
            singleMachineKpis?.capacity?.machineName ||
            selectedMachineCode
        );
    }, [
        singleMachinePerformance?.machineName,
        machineProductionSeries?.machineName,
        singleMachineKpis?.efficiency?.machineName,
        singleMachineKpis?.capacity?.machineName,
        selectedMachineCode,
    ]);

    const restrictMachineIds = useMemo(
        () => (selectedMachineCode ? [selectedMachineCode] : undefined),
        [selectedMachineCode]
    );

    const headerActions = useMemo(
        () => (
            <ProductionOverviewHeader
                spaces={spaces}
                selectedFactoryId={selectedFactoryId}
                onFactoryChange={handleFactoryChange}
                industryFilters={industryFilters}
                currentMode={timeFilterMode}
                currentPeriodId={currentPeriodId}
                currentShiftId={currentShiftId}
                startDate={startDate}
                endDate={endDate}
                groupedOptions={groupedTimePeriodOptions}
                isShiftActive={isShiftActive}
                onApplyTimeFilter={handleApplyTimeFilter}
                onRefresh={handleRefresh}
                onExportExcel={handleExportExcel}
                isLoadingSpaces={isLoadingSpaces}
                isLoadingData={isLoadingData}
                isExporting={isExporting}
            />
        ),
        [
            spaces,
            selectedFactoryId,
            handleFactoryChange,
            industryFilters,
            timeFilterMode,
            currentPeriodId,
            currentShiftId,
            startDate,
            endDate,
            groupedTimePeriodOptions,
            isShiftActive,
            handleApplyTimeFilter,
            handleRefresh,
            handleExportExcel,
            isLoadingSpaces,
            isLoadingData,
            isExporting,
        ]
    );

    return (
        <div style={{ padding: '0 4px 24px 4px' }}>
            <ResponsivePageHeader
                title={t('permissionSubjects.production_overview')}
                rightContent={headerActions}
            />

            <Spin spinning={isLoadingData}>
                {selectedMachineCode ? (
                    /* Machine Detail View */
                    <MachineDetailView
                        machineCode={selectedMachineCode}
                        machineId={resolvedMachineId}
                        machineName={selectedMachineName}
                        machineList={availableMachineList}
                        productionSeries={machineProductionSeries}
                        performanceSeries={singleMachinePerformance}
                        singleMachineKpis={singleMachineKpis}
                        isLoadingSeries={isLoadingMachineSeries}
                        isLoadingPerformance={isLoadingMachinePerformance}
                        isLoadingKpis={isLoadingMachineKpis}
                        subtitle={activeFilterLabel}
                        onSelectMachine={handleSelectMachine}
                        onBack={handleBackToOverview}
                        onDowntimeClick={handleOpenErrorModal}
                    />
                ) : (
                    /* Plant Overview View */
                    <>
                        {/* 1. Top KPI Summary Cards (Plant-wide with live API data) */}
                        <KpiCardsSection
                            data={currentKpiData}
                            onDowntimeClick={handleOpenErrorModal}
                        />

                        {/* 2. Middle Row: Machine Efficiency (50%) & Machine Plan vs Actual (50%) */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={12}>
                                <MachineOeeChartCard
                                    data={currentMachineEfficiency}
                                    subtitle={activeFilterLabel}
                                    onSelectMachine={handleSelectMachine}
                                />
                            </Col>
                            <Col xs={24} lg={12}>
                                <MachinePlanVsActualChartCard
                                    data={currentMachineProduction}
                                    subtitle={activeFilterLabel}
                                    onSelectMachine={handleSelectMachine}
                                />
                            </Col>
                        </Row>

                        {/* 3. Bottom Row: Product Plan vs Actual (100% Full Width) */}
                        <Row>
                            <Col span={24}>
                                <ProductPlanVsActualChartCard
                                    data={currentProductProduction}
                                    subtitle={activeFilterLabel}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </Spin>
            <ErrorAnalyticsModal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                spaceId={selectedFactoryId}
                filterId={selectedTimePeriod}
                startDate={startDate}
                endDate={endDate}
                isDateRange={isCustomRangeMode}
                restrictToMachineIds={restrictMachineIds}
            />
        </div>
    );
};

export default ProductionOverviewPage;
