'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { Col, Row, Spin } from 'antd';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionOverviewActions } from '@/stores';
import { IndustryFilter } from '@/types/IndustryFilter';
import { KpiSummaryData } from '@/types/ProductionOverview';
import { type TimeFilterApplyPayload } from '@/components/shared/filters/TimeFilterPopover';
import {
    ProductionOverviewHeader,
    KpiCardsSection,
    MachineOeeChartCard,
    MachinePlanVsActualChartCard,
    ProductPlanVsActualChartCard,
    MachineDetailView,
    ErrorAnalyticsModal,
    type MachineListItem,
} from '@/features/dashboard/production-overview';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

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

    // Redux State from ProductionOverviewStore
    const {
        selectedFactoryId,
        spaces,
        isLoadingSpaces,
        industryFilters,
        timeFilterMode,
        selectedTimePeriod,
        selectedShiftFilterId,
        selectedStartDate: startDate,
        selectedEndDate: endDate,
        isLoadingData,
        liveKpiData,
        liveChartsData,
        selectedMachineCode,
        selectedMachineId,
        machineProductionSeries,
        singleMachinePerformance,
        singleMachineKpis,
        isLoadingMachineSeries,
        isLoadingMachinePerformance,
        isLoadingMachineKpis,
        isErrorModalOpen,
        isExporting,
    } = useAppSelector((state) => state.productionOverview);

    // Initial data fetch on mount: spaces & industry filters
    useEffect(() => {
        dispatch(productionOverviewActions.fetchSpaces());
        dispatch(productionOverviewActions.fetchIndustryFilters());
    }, [dispatch]);

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
            SHIFT: timePeriodOptions.filter(
                (option) => option.category === 'SHIFT' || option.category === 'OT'
            ),
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

    // Subtitle label for current filter
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

    // Fetch dashboard KPIs and charts when on Plant Overview screen
    useEffect(() => {
        if (
            !selectedMachineCode &&
            selectedFactoryId &&
            (selectedTimePeriod || isCustomRangeMode)
        ) {
            dispatch(productionOverviewActions.fetchDashboardData());
        }
    }, [
        dispatch,
        selectedMachineCode,
        selectedFactoryId,
        selectedTimePeriod,
        isCustomRangeMode,
        selectedShiftFilterId,
        startDate,
        endDate,
    ]);

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
        if (!resolvedMachineId) return;

        dispatch(productionOverviewActions.fetchMachineDetailData(resolvedMachineId));
    }, [
        dispatch,
        resolvedMachineId,
        timeFilterMode,
        selectedTimePeriod,
        selectedShiftFilterId,
        startDate,
        endDate,
    ]);

    // Enriched KPI Data with localized labels
    const currentKpiData = useMemo<KpiSummaryData>(() => {
        if (liveKpiData) {
            const oeeVal = liveKpiData.oee.current;
            const statusTag =
                oeeVal >= 85
                    ? t('productionOverview.kpi.targetMet', 'Đạt mục tiêu (≥85%)')
                    : oeeVal >= 70
                      ? t('productionOverview.kpi.improveArea', 'Vùng cải thiện (70–84%)')
                      : t('productionOverview.kpi.needImprove', 'Cần cải thiện (<70%)');

            return {
                ...liveKpiData,
                oee: {
                    ...liveKpiData.oee,
                    statusTag,
                },
                yieldRate: {
                    ...liveKpiData.yieldRate,
                    targetText: t('productionOverview.kpi.vsPlan'),
                },
                actualProduction: {
                    ...liveKpiData.actualProduction,
                    unit: t('productionOverview.machineDetail.pcs', 'sp'),
                },
            };
        }

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

    const handleSelectMachine = useCallback(
        (machineCode: string, machineId?: string) => {
            dispatch(
                productionOverviewActions.setSelectedMachine({
                    machineCode,
                    machineId: machineId ?? null,
                })
            );
        },
        [dispatch]
    );

    const handleFactoryChange = useCallback(
        (id: number) => {
            dispatch(productionOverviewActions.setSelectedFactoryId(id));
            dispatch(productionOverviewActions.fetchDashboardData(true, { factoryId: id }));
        },
        [dispatch]
    );

    const handleBackToOverview = useCallback(() => {
        dispatch(productionOverviewActions.backToOverview());
    }, [dispatch]);

    const handleOpenErrorModal = useCallback(() => {
        dispatch(productionOverviewActions.setIsErrorModalOpen(true));
    }, [dispatch]);

    const handleCloseErrorModal = useCallback(() => {
        dispatch(productionOverviewActions.setIsErrorModalOpen(false));
    }, [dispatch]);

    const handleRefresh = useCallback(() => {
        dispatch(productionOverviewActions.search());
        toast.success(t('productionOverview.actions.refreshSuccess'));
    }, [dispatch, t]);

    const handleApplyTimeFilter = useCallback(
        (payload: TimeFilterApplyPayload) => {
            dispatch(productionOverviewActions.applyTimeFilter(payload));
            if (selectedMachineCode) {
                if (resolvedMachineId) {
                    dispatch(productionOverviewActions.fetchMachineDetailData(resolvedMachineId));
                }
            } else if (selectedFactoryId) {
                dispatch(
                    productionOverviewActions.fetchDashboardData(true, {
                        factoryId: selectedFactoryId,
                        mode: payload.mode,
                        periodId: payload.primaryFilterId,
                        shiftId: payload.secondaryShiftId,
                        startDate: payload.startDate,
                        endDate: payload.endDate,
                    })
                );
            }
        },
        [dispatch, selectedMachineCode, resolvedMachineId, selectedFactoryId]
    );

    const selectedMachineName = useMemo(() => {
        return (
            singleMachinePerformance?.machineName ||
            machineProductionSeries?.machineName ||
            singleMachineKpis?.efficiency?.machineName ||
            singleMachineKpis?.capacity?.machineName ||
            availableMachineList.find((m) => m.machineCode === selectedMachineCode)?.machineName ||
            selectedMachineCode
        );
    }, [
        singleMachinePerformance?.machineName,
        machineProductionSeries?.machineName,
        singleMachineKpis?.efficiency?.machineName,
        singleMachineKpis?.capacity?.machineName,
        availableMachineList,
        selectedMachineCode,
    ]);

    const handleExportExcel = useCallback(async () => {
        toast.info(t('common.featureUnderDevelopment', 'Tính năng đang được phát triển'));
    }, [t]);

    const restrictMachineIds = useMemo(() => {
        if (!selectedMachineCode) return undefined;
        const ids = [selectedMachineCode];
        if (resolvedMachineId && resolvedMachineId !== selectedMachineCode) {
            ids.push(resolvedMachineId);
        }
        return ids;
    }, [selectedMachineCode, resolvedMachineId]);

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
                spaces={spaces}
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
