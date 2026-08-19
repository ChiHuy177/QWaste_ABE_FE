'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    getProductionOverviewData,
    getMachineDetail,
    FilterContextParams,
    KpiSummaryData,
} from '@/configs/mockData/productionOverviewMockData';

import { ProductionOverviewHeader, TimeFilterMode } from './_components/ProductionOverviewHeader';
import { KpiCardsSection } from './_components/KpiCardsSection';
import { MachineOeeChartCard } from './_components/MachineOeeChartCard';
import { MachinePlanVsActualChartCard } from './_components/MachinePlanVsActualChartCard';
import { ProductPlanVsActualChartCard } from './_components/ProductPlanVsActualChartCard';
import { MachineDetailView } from './_components/MachineDetailView';

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

    // Selected machine state for drilldown
    const [selectedMachineCode, setSelectedMachineCode] = useState<string | null>(null);

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

    // Fetch industry filters
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
    }, [selectedTimePeriod]);

    // Active period filter object lookup
    const activeFilterObj = useMemo(() => {
        if (timeFilterMode === 'CUSTOM_RANGE') return null;
        return industryFilters.find((f) => f.filterId === selectedTimePeriod);
    }, [timeFilterMode, industryFilters, selectedTimePeriod]);

    // Filter context params object
    const filterContext = useMemo<FilterContextParams>(
        () => ({
            mode: timeFilterMode,
            periodId: selectedTimePeriod,
            periodCode: activeFilterObj?.periodCode ?? null,
            displayNameVi: activeFilterObj?.displayNameVi ?? null,
            displayNameEn: activeFilterObj?.displayNameEn ?? null,
            category: activeFilterObj?.category ?? null,
            shiftId: selectedShiftFilterId,
            startDate,
            endDate,
        }),
        [
            timeFilterMode,
            selectedTimePeriod,
            activeFilterObj,
            selectedShiftFilterId,
            startDate,
            endDate,
        ]
    );

    // Fetch live Dashboard KPI Widgets data (Efficiency, Downtime, Production)
    const fetchDashboardKpis = useCallback(async () => {
        if (!selectedFactoryId) return;
        if (timeFilterMode === 'PRESET' && !selectedTimePeriod) return;

        setIsLoadingData(true);
        try {
            const isShift = activeFilterObj?.category === 'SHIFT';
            const kpiResult = await DashboardService.getOverviewKpis({
                spaceId: selectedFactoryId,
                mode: timeFilterMode,
                filterId: selectedTimePeriod,
                shiftFilterId: selectedShiftFilterId,
                isShiftFilter: isShift,
                startDate,
                endDate,
            });

            // Map API response to KpiSummaryData dynamically from API result
            if (kpiResult.efficiency || kpiResult.downtime || kpiResult.production) {
                const totalEff = kpiResult.efficiency?.totalEfficiencyPercentage ?? null;
                const effDelta = kpiResult.efficiency?.efficiencyDeltaPercentage ?? null;
                const totalDowntimeSec = kpiResult.downtime?.totalDowntimeSeconds ?? 0;
                const downtimeMins = Math.round(totalDowntimeSec / 60);
                const actualQty = kpiResult.production?.actualQuantity ?? 0;
                const plannedQty = kpiResult.production?.plannedQuantity ?? 0;
                const prodRatio = kpiResult.production?.productionRatioPercentage ?? null;

                const oeeVal = totalEff != null ? Number(totalEff.toFixed(1)) : 0;
                const yieldVal = prodRatio != null ? Number(prodRatio.toFixed(1)) : 0;

                const statusTag =
                    oeeVal >= 85
                        ? t('productionOverview.kpi.targetMet', 'Đạt mục tiêu (≥85%)')
                        : oeeVal >= 70
                          ? t('productionOverview.kpi.improveArea', 'Vùng cải thiện (70–84%)')
                          : t('productionOverview.kpi.needImprove', 'Cần cải thiện (<70%)');

                setLiveKpiData({
                    oee: {
                        current: oeeVal,
                        target: 85.0,
                        yesterdayDiff: effDelta != null ? Number(effDelta.toFixed(1)) : 0,
                        statusTag,
                    },
                    downtimeMinutes: {
                        current: downtimeMins,
                        overTargetMinutes: 0,
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
        } catch (error) {
            console.warn('Dashboard KPI API fallback to mock data:', error);
            setLiveKpiData(null);
        } finally {
            setIsLoadingData(false);
        }
    }, [
        selectedFactoryId,
        timeFilterMode,
        selectedTimePeriod,
        selectedShiftFilterId,
        activeFilterObj,
        startDate,
        endDate,
        t,
    ]);

    // Fetch dashboard KPIs on filter change
    useEffect(() => {
        if (selectedFactoryId && (selectedTimePeriod || timeFilterMode === 'CUSTOM_RANGE')) {
            fetchDashboardKpis();
        }
    }, [fetchDashboardKpis, selectedFactoryId, selectedTimePeriod, timeFilterMode]);

    // Dynamic Overview Data based on active filter
    const overviewData = useMemo(() => getProductionOverviewData(filterContext), [filterContext]);

    // Merged KPI data prioritizing live API data over mock
    const currentKpiData = useMemo<KpiSummaryData>(() => {
        return liveKpiData ?? overviewData.kpi;
    }, [liveKpiData, overviewData.kpi]);

    // Dynamic Active Machine Detail Data based on active filter
    const activeMachineDetail = useMemo(() => {
        if (!selectedMachineCode) return null;
        return getMachineDetail(selectedMachineCode, filterContext);
    }, [selectedMachineCode, filterContext]);

    // Refresh action
    const handleRefresh = useCallback(() => {
        fetchDashboardKpis();
        toast.success(t('productionOverview.actions.refreshSuccess'));
    }, [fetchDashboardKpis, t]);

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
                title={
                    selectedMachineCode
                        ? `${t('permissionSubjects.production_overview')} — ${selectedMachineCode}`
                        : t('permissionSubjects.production_overview')
                }
                rightContent={headerActions}
            />

            <Spin spinning={isLoadingData}>
                {selectedMachineCode && activeMachineDetail ? (
                    /* Machine Detail View */
                    <MachineDetailView
                        machineDetail={activeMachineDetail}
                        machineList={overviewData.machineOeeList}
                        onSelectMachine={(machineCode) => setSelectedMachineCode(machineCode)}
                        onBack={() => setSelectedMachineCode(null)}
                    />
                ) : (
                    /* Plant Overview View */
                    <>
                        {/* 1. Top KPI Summary Cards (Plant-wide with live API data) */}
                        <KpiCardsSection data={currentKpiData} />

                        {/* 2. Middle Row: Machine Efficiency (50%) & Machine Plan vs Actual (50%) */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={12}>
                                <MachineOeeChartCard
                                    data={overviewData.machineOeeList}
                                    onSelectMachine={(machineCode) =>
                                        setSelectedMachineCode(machineCode)
                                    }
                                />
                            </Col>
                            <Col xs={24} lg={12}>
                                <MachinePlanVsActualChartCard
                                    data={overviewData.machineOutputList}
                                />
                            </Col>
                        </Row>

                        {/* 3. Bottom Row: Product Plan vs Actual (100% Full Width) */}
                        <Row>
                            <Col span={24}>
                                <ProductPlanVsActualChartCard
                                    data={overviewData.productOutputList}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </Spin>
        </div>
    );
};

export default ProductionOverviewPage;
