'use client';

import { ErrorAnalyticsModal } from './_components/ErrorAnalyticsModal';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Col, Row, Spin } from 'antd';
import { toast } from 'sonner';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { factoryOverviewActions } from '@/stores';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
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
import { KpiSummaryData } from '@/configs/mockData/productionOverviewMockData';

import { ProductionOverviewHeader, TimeFilterMode } from './_components/ProductionOverviewHeader';
import { KpiCardsSection } from './_components/KpiCardsSection';
import { MachineOeeChartCard } from './_components/MachineOeeChartCard';
import { MachinePlanVsActualChartCard } from './_components/MachinePlanVsActualChartCard';
import { ProductPlanVsActualChartCard } from './_components/ProductPlanVsActualChartCard';
import { MachineDetailView, MachineListItem } from './_components/MachineDetailView';

const ProductionOverviewPage: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    usePageTitle(t('permissionSubjects.production_overview'));

    const { spaces, isLoadingSpaces } = useAppSelector(
        (state) => state.factoryOverview
    ) as IFactoryOverviewStoreState;

    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);

    // Time filter states
    const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('PRESET');
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
                if (filters.length > 0 && selectedTimePeriod === null) {
                    const defaultPeriod = filters.find(
                        (f) => f.category === 'PERIOD' && f.periodCode === 'THIS_WEEK'
                    );
                    setSelectedTimePeriod(
                        defaultPeriod ? defaultPeriod.filterId : filters[0].filterId
                    );
                }
            } catch (err) {
                console.error('Failed to load industry filters:', err);
            }
        };
        fetchFilters();
    }, []);

    // Active period filter object lookup
    const activeFilterObj = useMemo(() => {
        if (timeFilterMode === 'CUSTOM_RANGE') return null;
        return industryFilters.find((f) => f.filterId === selectedTimePeriod);
    }, [timeFilterMode, industryFilters, selectedTimePeriod]);

    // Subtitle label for current filter
    const activeFilterLabel = useMemo(() => {
        if (timeFilterMode === 'CUSTOM_RANGE') {
            return `${dayjs(startDate).format('DD/MM/YYYY')} – ${dayjs(endDate).format('DD/MM/YYYY')}`;
        }
        return (
            activeFilterObj?.displayNameVi ||
            activeFilterObj?.displayNameEn ||
            activeFilterObj?.periodCode ||
            ''
        );
    }, [timeFilterMode, startDate, endDate, activeFilterObj]);

    // Request Key guard to prevent duplicate API calls
    const lastFetchedParamsRef = useRef<string>('');

    // Fetch live Dashboard KPI Widgets & Charts data
    const fetchDashboardData = useCallback(
        async (force = false) => {
            if (!selectedFactoryId) return;
            if (timeFilterMode === 'PRESET' && !selectedTimePeriod) return;

            const requestKey = `${selectedFactoryId}_${timeFilterMode}_${selectedTimePeriod}_${selectedShiftFilterId}_${startDate}_${endDate}`;
            if (!force && lastFetchedParamsRef.current === requestKey) {
                return;
            }
            lastFetchedParamsRef.current = requestKey;

            setIsLoadingData(true);
            try {
                const isShift = activeFilterObj?.category === 'SHIFT';

                const [kpiResult, chartsResult] = await Promise.allSettled([
                    DashboardService.getOverviewKpis({
                        spaceId: selectedFactoryId,
                        mode: timeFilterMode,
                        filterId: selectedTimePeriod,
                        shiftFilterId: selectedShiftFilterId,
                        isShiftFilter: isShift,
                        startDate,
                        endDate,
                    }),
                    DashboardService.getDashboardCharts({
                        spaceId: selectedFactoryId,
                        mode: timeFilterMode,
                        filterId: selectedTimePeriod,
                        shiftFilterId: selectedShiftFilterId,
                        isShiftFilter: isShift,
                        startDate,
                        endDate,
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
                            unit: 'sp/h',
                        },
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
            activeFilterObj,
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
            (selectedTimePeriod || timeFilterMode === 'CUSTOM_RANGE')
        ) {
            fetchDashboardData();
        }
    }, [
        fetchDashboardData,
        selectedMachineCode,
        selectedFactoryId,
        selectedTimePeriod,
        timeFilterMode,
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
                unit: 'sp/h',
            },
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

                if (timeFilterMode === 'CUSTOM_RANGE' && startDate && endDate) {
                    const shiftFilter = isShift
                        ? (selectedTimePeriod ?? undefined)
                        : (selectedShiftFilterId ?? undefined);

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
                const kpiPromise = DashboardService.getSingleMachineOverviewKpis({
                    machineId: resolvedMachineId,
                    mode: timeFilterMode,
                    filterId: selectedTimePeriod,
                    shiftFilterId: selectedShiftFilterId,
                    isShiftFilter: isShift,
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

    const handleApplyTimeFilter = (params: {
        mode: TimeFilterMode;
        periodId: number | null;
        shiftId: number | null;
        dateRange: [Dayjs, Dayjs] | null;
    }) => {
        setTimeFilterMode(params.mode);
        setSelectedTimePeriod(params.periodId);
        setSelectedShiftFilterId(params.shiftId);
        if (params.dateRange) {
            setStartDate(params.dateRange[0].format('YYYY-MM-DD'));
            setEndDate(params.dateRange[1].format('YYYY-MM-DD'));
        }
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            toast.info(t('productionOverview.actions.preparingReport'));
            setTimeout(() => {
                setIsExporting(false);
                toast.success(t('productionOverview.actions.exportSuccess'));
            }, 800);
        } catch (_error) {
            setIsExporting(false);
            toast.error(t('productionOverview.actions.exportError'));
        }
    };

    const headerActions = useMemo(
        () => (
            <ProductionOverviewHeader
                spaces={spaces}
                selectedFactoryId={selectedFactoryId}
                onFactoryChange={(id) => {
                    setSelectedFactoryId(id);
                }}
                industryFilters={industryFilters}
                selectedTimePeriod={selectedTimePeriod}
                selectedShiftFilterId={selectedShiftFilterId}
                timeFilterMode={timeFilterMode}
                startDate={startDate}
                endDate={endDate}
                onApplyTimeFilter={handleApplyTimeFilter}
                onRefresh={handleRefresh}
                onExportExcel={handleExportExcel}
                isLoading={isLoadingSpaces || isLoadingData}
                isExporting={isExporting}
            />
        ),
        [
            spaces,
            selectedFactoryId,
            industryFilters,
            selectedTimePeriod,
            selectedShiftFilterId,
            timeFilterMode,
            startDate,
            endDate,
            isLoadingSpaces,
            isLoadingData,
            isExporting,
            handleRefresh,
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
                        machineName={
                            singleMachinePerformance?.machineName ||
                            machineProductionSeries?.machineName ||
                            singleMachineKpis?.efficiency?.machineName ||
                            singleMachineKpis?.capacity?.machineName ||
                            selectedMachineCode
                        }
                        machineList={availableMachineList}
                        productionSeries={machineProductionSeries}
                        performanceSeries={singleMachinePerformance}
                        singleMachineKpis={singleMachineKpis}
                        isLoadingSeries={isLoadingMachineSeries}
                        isLoadingPerformance={isLoadingMachinePerformance}
                        isLoadingKpis={isLoadingMachineKpis}
                        subtitle={activeFilterLabel}
                        onSelectMachine={handleSelectMachine}
                        onBack={() => {
                            setSelectedMachineCode(null);
                            setSelectedMachineId(null);
                            setMachineProductionSeries(null);
                            setSingleMachinePerformance(null);
                            setSingleMachineKpis(null);
                        }}
                        onDowntimeClick={() => setIsErrorModalOpen(true)}
                    />
                ) : (
                    /* Plant Overview View */
                    <>
                        {/* 1. Top KPI Summary Cards (Plant-wide with live API data) */}
                        <KpiCardsSection
                            data={currentKpiData}
                            onDowntimeClick={() => setIsErrorModalOpen(true)}
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
                onClose={() => setIsErrorModalOpen(false)}
                spaceId={selectedFactoryId}
                filterId={selectedTimePeriod}
                startDate={startDate}
                endDate={endDate}
                isDateRange={timeFilterMode === 'CUSTOM_RANGE'}
                restrictToMachineIds={selectedMachineCode ? [selectedMachineCode] : undefined}
            />
        </div>
    );
};

export default ProductionOverviewPage;
