import { SpaceService, IndustryFilterService, DashboardService } from '@/services';
import { SpacePickingWithChildren } from '@/types/Space';
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
import {
    PeriodFilterMode,
    TimeFilterApplyPayload,
} from '@/components/shared/filters/TimeFilterPopover';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from './configureStore';
import dayjs from 'dayjs';

export interface IProductionOverviewStoreState {
    // Factory and Space Selection
    selectedFactoryId: number | null;
    spaces: SpacePickingWithChildren[];
    isLoadingSpaces: boolean;

    // Filters
    industryFilters: IndustryFilter[];
    isLoadingFilters: boolean;
    timeFilterMode: PeriodFilterMode;
    selectedTimePeriod: number | null;
    selectedShiftFilterId: number | null;
    selectedStartDate: string;
    selectedEndDate: string;

    // Dashboard Overview Data
    isLoadingData: boolean;
    liveKpiData: KpiSummaryData | null;
    liveChartsData: {
        machineEfficiency: DashboardMachineEfficiencyResponse[] | null;
        machineProduction: DashboardMachineProductionResponse[] | null;
        itemProduction: DashboardItemProductionResponse[] | null;
    };

    // Single Machine Detail / Drilldown View
    selectedMachineCode: string | null;
    selectedMachineId: string | null;
    machineProductionSeries: DashboardMachineProductionSeriesResponse | null;
    singleMachinePerformance: SingleMachinePerformanceResponse | null;
    singleMachineKpis: SingleMachineKpiSummaryState | null;
    isLoadingMachineSeries: boolean;
    isLoadingMachinePerformance: boolean;
    isLoadingMachineKpis: boolean;

    // UI Dialogs & General States
    isErrorModalOpen: boolean;
    isExporting: boolean;
    error: string | null;
}

const initialState: IProductionOverviewStoreState = {
    selectedFactoryId: null,
    spaces: [],
    isLoadingSpaces: false,

    industryFilters: [],
    isLoadingFilters: false,
    timeFilterMode: 'PRESET',
    selectedTimePeriod: null,
    selectedShiftFilterId: null,
    selectedStartDate: dayjs().format('YYYY-MM-DD'),
    selectedEndDate: dayjs().format('YYYY-MM-DD'),

    isLoadingData: false,
    liveKpiData: null,
    liveChartsData: {
        machineEfficiency: null,
        machineProduction: null,
        itemProduction: null,
    },

    selectedMachineCode: null,
    selectedMachineId: null,
    machineProductionSeries: null,
    singleMachinePerformance: null,
    singleMachineKpis: null,
    isLoadingMachineSeries: false,
    isLoadingMachinePerformance: false,
    isLoadingMachineKpis: false,

    isErrorModalOpen: false,
    isExporting: false,
    error: null,
};

const slice = createSlice({
    name: 'productionOverview',
    initialState,
    reducers: {
        setSelectedFactoryId: (state, action: PayloadAction<number | null>) => {
            state.selectedFactoryId = action.payload;
        },

        setSpaces: (state, action: PayloadAction<SpacePickingWithChildren[]>) => {
            state.spaces = action.payload;
            if (action.payload.length > 0 && state.selectedFactoryId === null) {
                state.selectedFactoryId = action.payload[0].spaceId;
            }
        },

        setIsLoadingSpaces: (state, action: PayloadAction<boolean>) => {
            state.isLoadingSpaces = action.payload;
        },

        setIndustryFilters: (state, action: PayloadAction<IndustryFilter[]>) => {
            const sorted = [...action.payload].sort(
                (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
            );
            state.industryFilters = sorted;
            if (sorted.length > 0 && state.selectedTimePeriod === null) {
                const todayFilter =
                    sorted.find(
                        (f) => f.category === 'PERIOD' && f.periodCode === 'TODAY'
                    ) ||
                    sorted.find((f) => f.category === 'PERIOD') ||
                    sorted[0];
                if (todayFilter) {
                    state.selectedTimePeriod = todayFilter.filterId;
                }
                state.selectedShiftFilterId = null;
            }
        },

        setIsLoadingFilters: (state, action: PayloadAction<boolean>) => {
            state.isLoadingFilters = action.payload;
        },

        setTimeFilterMode: (state, action: PayloadAction<PeriodFilterMode>) => {
            state.timeFilterMode = action.payload;
        },

        setSelectedTimePeriod: (state, action: PayloadAction<number | null>) => {
            state.selectedTimePeriod = action.payload;
        },

        setSelectedShiftFilterId: (state, action: PayloadAction<number | null>) => {
            state.selectedShiftFilterId = action.payload;
        },

        setSelectedDateRange: (
            state,
            action: PayloadAction<{ startDate: string; endDate: string }>
        ) => {
            state.selectedStartDate = action.payload.startDate;
            state.selectedEndDate = action.payload.endDate;
        },

        applyTimeFilter: (state, action: PayloadAction<TimeFilterApplyPayload>) => {
            const { mode, primaryFilterId, secondaryShiftId, startDate, endDate } = action.payload;
            state.timeFilterMode = mode;
            state.selectedTimePeriod = primaryFilterId;
            state.selectedShiftFilterId = secondaryShiftId;
            state.selectedStartDate = startDate;
            state.selectedEndDate = endDate;
        },

        setLiveKpiData: (state, action: PayloadAction<KpiSummaryData | null>) => {
            state.liveKpiData = action.payload;
        },

        setLiveChartsData: (
            state,
            action: PayloadAction<{
                machineEfficiency: DashboardMachineEfficiencyResponse[] | null;
                machineProduction: DashboardMachineProductionResponse[] | null;
                itemProduction: DashboardItemProductionResponse[] | null;
            }>
        ) => {
            state.liveChartsData = action.payload;
        },

        setIsLoadingData: (state, action: PayloadAction<boolean>) => {
            state.isLoadingData = action.payload;
        },

        setSelectedMachine: (
            state,
            action: PayloadAction<{ machineCode: string | null; machineId?: string | null }>
        ) => {
            state.selectedMachineCode = action.payload.machineCode;
            state.selectedMachineId = action.payload.machineId ?? null;
        },

        setMachineProductionSeries: (
            state,
            action: PayloadAction<DashboardMachineProductionSeriesResponse | null>
        ) => {
            state.machineProductionSeries = action.payload;
        },

        setSingleMachinePerformance: (
            state,
            action: PayloadAction<SingleMachinePerformanceResponse | null>
        ) => {
            state.singleMachinePerformance = action.payload;
        },

        setSingleMachineKpis: (
            state,
            action: PayloadAction<SingleMachineKpiSummaryState | null>
        ) => {
            state.singleMachineKpis = action.payload;
        },

        setIsLoadingMachineSeries: (state, action: PayloadAction<boolean>) => {
            state.isLoadingMachineSeries = action.payload;
        },

        setIsLoadingMachinePerformance: (state, action: PayloadAction<boolean>) => {
            state.isLoadingMachinePerformance = action.payload;
        },

        setIsLoadingMachineKpis: (state, action: PayloadAction<boolean>) => {
            state.isLoadingMachineKpis = action.payload;
        },

        setIsErrorModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isErrorModalOpen = action.payload;
        },

        setIsExporting: (state, action: PayloadAction<boolean>) => {
            state.isExporting = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        backToOverview: (state) => {
            state.selectedMachineCode = null;
            state.selectedMachineId = null;
            state.machineProductionSeries = null;
            state.singleMachinePerformance = null;
            state.singleMachineKpis = null;
            state.isLoadingMachineSeries = false;
            state.isLoadingMachinePerformance = false;
            state.isLoadingMachineKpis = false;
        },

        resetProductionOverview: () => initialState,
    },
});

export const { reducer } = slice;

export const productionOverviewActions = {
    fetchSpaces: () => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setIsLoadingSpaces(true));
        dispatch(slice.actions.setError(null));

        try {
            const data = await SpaceService.getSpacesByLevelWithChildren(1);
            dispatch(slice.actions.setSpaces(data));
            return { success: true, data };
        } catch (error) {
            console.error('[Production Overview Store] Error fetching spaces:', error);
            dispatch(slice.actions.setError('Failed to fetch spaces'));
            return { success: false, error: 'Failed to fetch spaces' };
        } finally {
            dispatch(slice.actions.setIsLoadingSpaces(false));
        }
    },

    fetchIndustryFilters: () => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setIsLoadingFilters(true));
        try {
            const filters = await IndustryFilterService.getIndustryFiltersForPicking();
            dispatch(slice.actions.setIndustryFilters(filters));
            return { success: true, data: filters };
        } catch (error) {
            console.error('[Production Overview Store] Error fetching industry filters:', error);
            return { success: false, error: 'Failed to fetch industry filters' };
        } finally {
            dispatch(slice.actions.setIsLoadingFilters(false));
        }
    },

    fetchDashboardData:
        (
            _force = false,
            overrideParams?: {
                factoryId?: number | null;
                mode?: PeriodFilterMode;
                periodId?: number | null;
                shiftId?: number | null;
                startDate?: string;
                endDate?: string;
            }
        ) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            const state = getState().productionOverview;
            const effectiveFactoryId =
                overrideParams?.factoryId !== undefined
                    ? overrideParams.factoryId
                    : state.selectedFactoryId;
            const effectiveMode = overrideParams?.mode ?? state.timeFilterMode;
            const effectivePeriodId =
                overrideParams?.periodId !== undefined
                    ? overrideParams.periodId
                    : state.selectedTimePeriod;
            const effectiveShiftId =
                overrideParams?.shiftId !== undefined
                    ? overrideParams.shiftId
                    : state.selectedShiftFilterId;
            const effectiveStartDate = overrideParams?.startDate ?? state.selectedStartDate;
            const effectiveEndDate = overrideParams?.endDate ?? state.selectedEndDate;

            const isCustom = effectiveMode !== 'PRESET';

            if (!effectiveFactoryId) return { success: false, error: 'No factory selected' };
            if (!isCustom && !effectivePeriodId)
                return { success: false, error: 'No period selected' };

            dispatch(slice.actions.setIsLoadingData(true));
            dispatch(slice.actions.setError(null));

            try {
                let effectiveFilterId: number | null = null;
                let effectiveShiftFilterId: number | null = null;
                let effectiveIsShift = false;

                if (isCustom) {
                    effectiveFilterId = effectivePeriodId ?? null;
                    effectiveShiftFilterId = null;
                    effectiveIsShift = !!effectivePeriodId;
                } else {
                    const filterObj = state.industryFilters.find(
                        (f) => f.filterId === effectivePeriodId
                    );
                    const isShift = filterObj?.category === 'SHIFT' || filterObj?.category === 'OT';
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
                    const actualCap =
                        runtimeHoursVal > 0 ? Math.round(actualQty / runtimeHoursVal) : 0;

                    const kpiData: KpiSummaryData = {
                        oee: {
                            current: oeeVal,
                            target: 85.0,
                            yesterdayDiff: effDelta != null ? Number(effDelta.toFixed(1)) : 0,
                            statusTag: '',
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
                            targetText: '',
                        },
                        actualProduction: {
                            current: actualQty,
                            target: plannedQty,
                            unit: 'sp',
                        },
                    };
                    dispatch(slice.actions.setLiveKpiData(kpiData));
                } else {
                    dispatch(slice.actions.setLiveKpiData(null));
                }

                if (
                    charts &&
                    (charts.machineEfficiency || charts.machineProduction || charts.itemProduction)
                ) {
                    dispatch(
                        slice.actions.setLiveChartsData({
                            machineEfficiency: charts.machineEfficiency,
                            machineProduction: charts.machineProduction,
                            itemProduction: charts.itemProduction,
                        })
                    );
                } else {
                    dispatch(
                        slice.actions.setLiveChartsData({
                            machineEfficiency: null,
                            machineProduction: null,
                            itemProduction: null,
                        })
                    );
                }

                return { success: true };
            } catch (err) {
                console.error('[Production Overview Store] Error fetching dashboard data:', err);
                dispatch(slice.actions.setError('Failed to fetch dashboard data'));
                dispatch(slice.actions.setLiveKpiData(null));
                dispatch(
                    slice.actions.setLiveChartsData({
                        machineEfficiency: null,
                        machineProduction: null,
                        itemProduction: null,
                    })
                );
                return { success: false, error: err };
            } finally {
                dispatch(slice.actions.setIsLoadingData(false));
            }
        },

    fetchMachineDetailData:
        (machineId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
            const state = getState().productionOverview;
            const isCustom = state.timeFilterMode !== 'PRESET';
            const filterObj = state.industryFilters.find(
                (f) => f.filterId === state.selectedTimePeriod
            );
            const isShift = filterObj?.category === 'SHIFT';

            dispatch(slice.actions.setIsLoadingMachineSeries(true));
            dispatch(slice.actions.setIsLoadingMachinePerformance(true));
            dispatch(slice.actions.setIsLoadingMachineKpis(true));

            try {
                let prodPromise: Promise<DashboardMachineProductionSeriesResponse>;
                let perfPromise: Promise<SingleMachinePerformanceResponse>;
                const apiMode: 'PRESET' | 'CUSTOM_RANGE' = isCustom ? 'CUSTOM_RANGE' : 'PRESET';

                if (isCustom && state.selectedStartDate && state.selectedEndDate) {
                    const shiftFilter = state.selectedTimePeriod ?? undefined;

                    prodPromise = DashboardService.getMachineProductionSeriesByDateRange({
                        machineId,
                        startDate: state.selectedStartDate,
                        endDate: state.selectedEndDate,
                        filterId: shiftFilter,
                    });
                    perfPromise = DashboardService.getSingleMachinePerformanceByDateRange({
                        machineId,
                        startDate: state.selectedStartDate,
                        endDate: state.selectedEndDate,
                        filterId: shiftFilter,
                    });
                } else if (state.selectedTimePeriod) {
                    prodPromise = DashboardService.getMachineProductionSeriesByFilter({
                        machineId,
                        filterId: state.selectedTimePeriod,
                        shiftFilterId: state.selectedShiftFilterId,
                    });
                    perfPromise = DashboardService.getSingleMachinePerformanceByFilter({
                        machineId,
                        filterId: state.selectedTimePeriod,
                        shiftFilterId: state.selectedShiftFilterId,
                    });
                } else {
                    return;
                }

                const effectiveFilterId = isCustom
                    ? (state.selectedTimePeriod ?? null)
                    : state.selectedTimePeriod;
                const effectiveShiftFilterId = isCustom ? null : state.selectedShiftFilterId;
                const effectiveIsShift = isCustom ? !!state.selectedTimePeriod : isShift;

                const kpiPromise = DashboardService.getSingleMachineOverviewKpis({
                    machineId,
                    mode: apiMode,
                    filterId: effectiveFilterId,
                    shiftFilterId: effectiveShiftFilterId,
                    isShiftFilter: effectiveIsShift,
                    startDate: state.selectedStartDate,
                    endDate: state.selectedEndDate,
                });

                const [prodRes, perfRes, kpiRes] = await Promise.allSettled([
                    prodPromise,
                    perfPromise,
                    kpiPromise,
                ]);

                dispatch(
                    slice.actions.setMachineProductionSeries(
                        prodRes.status === 'fulfilled' ? prodRes.value : null
                    )
                );
                dispatch(
                    slice.actions.setSingleMachinePerformance(
                        perfRes.status === 'fulfilled' ? perfRes.value : null
                    )
                );
                dispatch(
                    slice.actions.setSingleMachineKpis(
                        kpiRes.status === 'fulfilled' ? kpiRes.value : null
                    )
                );
            } catch (error) {
                console.error('[Production Overview Store] Error fetching machine detail:', error);
                dispatch(slice.actions.setMachineProductionSeries(null));
                dispatch(slice.actions.setSingleMachinePerformance(null));
                dispatch(slice.actions.setSingleMachineKpis(null));
            } finally {
                dispatch(slice.actions.setIsLoadingMachineSeries(false));
                dispatch(slice.actions.setIsLoadingMachinePerformance(false));
                dispatch(slice.actions.setIsLoadingMachineKpis(false));
            }
        },

    search: () => async (dispatch: AppDispatch, getState: () => RootState) => {
        const { selectedMachineId, selectedMachineCode } = getState().productionOverview;
        const targetMachine = selectedMachineId || selectedMachineCode;
        if (targetMachine) {
            return dispatch(productionOverviewActions.fetchMachineDetailData(targetMachine));
        }
        return dispatch(productionOverviewActions.fetchDashboardData(true));
    },

    // Reducer actions
    setSelectedFactoryId: slice.actions.setSelectedFactoryId,
    setSpaces: slice.actions.setSpaces,
    setIsLoadingSpaces: slice.actions.setIsLoadingSpaces,
    setIndustryFilters: slice.actions.setIndustryFilters,
    setIsLoadingFilters: slice.actions.setIsLoadingFilters,
    setTimeFilterMode: slice.actions.setTimeFilterMode,
    setSelectedTimePeriod: slice.actions.setSelectedTimePeriod,
    setSelectedShiftFilterId: slice.actions.setSelectedShiftFilterId,
    setSelectedDateRange: slice.actions.setSelectedDateRange,
    applyTimeFilter: slice.actions.applyTimeFilter,
    setLiveKpiData: slice.actions.setLiveKpiData,
    setLiveChartsData: slice.actions.setLiveChartsData,
    setIsLoadingData: slice.actions.setIsLoadingData,
    setSelectedMachine: slice.actions.setSelectedMachine,
    setMachineProductionSeries: slice.actions.setMachineProductionSeries,
    setSingleMachinePerformance: slice.actions.setSingleMachinePerformance,
    setSingleMachineKpis: slice.actions.setSingleMachineKpis,
    setIsLoadingMachineSeries: slice.actions.setIsLoadingMachineSeries,
    setIsLoadingMachinePerformance: slice.actions.setIsLoadingMachinePerformance,
    setIsLoadingMachineKpis: slice.actions.setIsLoadingMachineKpis,
    setIsErrorModalOpen: slice.actions.setIsErrorModalOpen,
    setIsExporting: slice.actions.setIsExporting,
    setError: slice.actions.setError,
    backToOverview: slice.actions.backToOverview,
    resetProductionOverview: slice.actions.resetProductionOverview,
};
