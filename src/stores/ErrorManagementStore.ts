import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from './configureStore';
import {
    MachineIncidentFilterParams,
    MachineIncidentItem,
    MachineIncidentListResponse,
    MachineIncidentStatus,
} from '@/types/MachineIncident';
import { IndustryFilter } from '@/types/IndustryFilter';
import {
    PeriodFilterMode,
    TimeFilterApplyPayload,
} from '@/components/shared/filters/TimeFilterPopover';
import { MachineIncidentService } from '@/services/MachineIncidentService';
import { IndustryFilterService } from '@/services/IndustryFilterService';

const DEFAULT_PAGE_SIZE = 10;

export interface IErrorManagementStoreState {
    // Search & Status filters
    searchTerm: string;
    statusFilter: MachineIncidentStatus | undefined;

    // Time filters (matching ProductionOverview pattern)
    timeFilterMode: PeriodFilterMode | null;
    selectedTimePeriod: number | null;
    selectedShiftFilterId: number | null;
    selectedStartDate: string | null;
    selectedEndDate: string | null;

    // Pagination
    page: number;
    pageSize: number;

    // Metadata
    industryFilters: IndustryFilter[];
    isLoadingFilters: boolean;

    // Incidents data
    incidents: MachineIncidentItem[];
    totalElements: number;
    totalIncidents: number;
    activeIncidents: number;
    isLoadingData: boolean;
    error: string | null;
}

const initialState: IErrorManagementStoreState = {
    searchTerm: '',
    statusFilter: undefined,

    timeFilterMode: null,
    selectedTimePeriod: null,
    selectedShiftFilterId: null,
    selectedStartDate: null,
    selectedEndDate: null,

    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,

    industryFilters: [],
    isLoadingFilters: false,

    incidents: [],
    totalElements: 0,
    totalIncidents: 0,
    activeIncidents: 0,
    isLoadingData: false,
    error: null,
};

const slice = createSlice({
    name: 'errorManagement',
    initialState,
    reducers: {
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
            state.page = 0;
        },

        setStatusFilter: (state, action: PayloadAction<MachineIncidentStatus | undefined>) => {
            state.statusFilter = action.payload;
            state.page = 0;
        },

        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
        },

        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
            state.page = 0;
        },

        setPagination: (state, action: PayloadAction<{ page: number; pageSize?: number }>) => {
            state.page = action.payload.page;
            if (action.payload.pageSize) {
                state.pageSize = action.payload.pageSize;
            }
        },

        setIndustryFilters: (state, action: PayloadAction<IndustryFilter[]>) => {
            state.industryFilters = [...action.payload].sort(
                (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
            );
        },

        setIsLoadingFilters: (state, action: PayloadAction<boolean>) => {
            state.isLoadingFilters = action.payload;
        },

        setIsLoadingData: (state, action: PayloadAction<boolean>) => {
            state.isLoadingData = action.payload;
        },

        setIncidentResponse: (state, action: PayloadAction<MachineIncidentListResponse>) => {
            state.incidents = action.payload.page?.content || [];
            state.totalElements = action.payload.page?.totalElements || 0;
            state.totalIncidents = action.payload.totalIncidents ?? 0;
            state.activeIncidents = action.payload.activeIncidents ?? 0;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        applyTimeFilter: (state, action: PayloadAction<TimeFilterApplyPayload>) => {
            const { mode, primaryFilterId, secondaryShiftId, startDate, endDate } = action.payload;
            state.timeFilterMode = mode;
            state.selectedTimePeriod = primaryFilterId;
            state.selectedShiftFilterId = secondaryShiftId;
            state.selectedStartDate = startDate;
            state.selectedEndDate = endDate;
            state.page = 0;
        },

        resetTimeFilter: (state) => {
            state.timeFilterMode = null;
            state.selectedTimePeriod = null;
            state.selectedShiftFilterId = null;
            state.selectedStartDate = null;
            state.selectedEndDate = null;
            state.page = 0;
        },
    },
});

export const errorManagementActions = {
    ...slice.actions,

    /**
     * Fetch industry filters for Quick Select (PRESET) options and shift definitions
     */
    fetchIndustryFilters: () => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setIsLoadingFilters(true));
        try {
            const filters = await IndustryFilterService.getIndustryFiltersForPicking();
            dispatch(slice.actions.setIndustryFilters(filters));
            return { success: true, data: filters };
        } catch (error: any) {
            console.error('[ErrorManagementStore] Error fetching industry filters:', error);
            return { success: false, error: error?.message || 'Failed to fetch industry filters' };
        } finally {
            dispatch(slice.actions.setIsLoadingFilters(false));
        }
    },

    /**
     * Primary data fetch: reads current state from ErrorManagementStore
     * and queries MachineIncidentService.getIncidents passing filterId/shiftFilterId directly
     * exactly like ProductionOverviewStore
     */
    fetchIncidents: () => async (dispatch: AppDispatch, getState: () => RootState) => {
        const state = getState().errorManagement;
        dispatch(slice.actions.setIsLoadingData(true));
        dispatch(slice.actions.setError(null));

        try {
            const isCustom = state.timeFilterMode !== 'PRESET' && state.timeFilterMode !== null;

            let effectiveFilterId: number | undefined = undefined;
            let effectiveShiftFilterId: number | undefined = undefined;
            let effectiveStartDate: string | undefined = undefined;
            let effectiveEndDate: string | undefined = undefined;

            if (state.timeFilterMode === 'PRESET' && state.selectedTimePeriod !== null) {
                const filterObj = state.industryFilters.find(
                    (f) => f.filterId === state.selectedTimePeriod
                );
                const isShift = filterObj?.category === 'SHIFT' || filterObj?.category === 'OT';
                effectiveFilterId = state.selectedTimePeriod;
                effectiveShiftFilterId = isShift
                    ? undefined
                    : (state.selectedShiftFilterId ?? undefined);
            } else if (isCustom) {
                effectiveStartDate = state.selectedStartDate || undefined;
                effectiveEndDate = state.selectedEndDate || undefined;
                effectiveFilterId = state.selectedShiftFilterId ?? undefined;
            }

            const params: MachineIncidentFilterParams = {
                search: state.searchTerm || undefined,
                status: state.statusFilter || undefined,
                filterId: effectiveFilterId,
                shiftFilterId: effectiveShiftFilterId,
                startDate: effectiveStartDate,
                endDate: effectiveEndDate,
                page: state.page,
                size: state.pageSize,
                sort: 'startTime,DESC',
            };

            const response = await MachineIncidentService.getIncidents(params);
            dispatch(slice.actions.setIncidentResponse(response));
            return { success: true, data: response };
        } catch (error: any) {
            console.error('[ErrorManagementStore] Error fetching incidents:', error);
            const msg =
                error?.response?.data?.message || error?.message || 'Failed to fetch incidents';
            dispatch(slice.actions.setError(msg));
            return { success: false, error: msg };
        } finally {
            dispatch(slice.actions.setIsLoadingData(false));
        }
    },

    /**
     * Quick helpers that apply state changes and trigger an immediate fetch
     */
    applyTimeFilterAndFetch: (payload: TimeFilterApplyPayload) => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.applyTimeFilter(payload));
        return dispatch(errorManagementActions.fetchIncidents());
    },

    resetTimeFilterAndFetch: () => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.resetTimeFilter());
        return dispatch(errorManagementActions.fetchIncidents());
    },

    searchAndFetch: (term: string) => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setSearchTerm(term));
        return dispatch(errorManagementActions.fetchIncidents());
    },

    updateStatusFilterAndFetch:
        (status?: MachineIncidentStatus) => async (dispatch: AppDispatch) => {
            dispatch(slice.actions.setStatusFilter(status));
            return dispatch(errorManagementActions.fetchIncidents());
        },

    changePageAndFetch: (page: number, pageSize?: number) => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setPagination({ page, pageSize }));
        return dispatch(errorManagementActions.fetchIncidents());
    },

    refresh: () => async (dispatch: AppDispatch) => {
        return dispatch(errorManagementActions.fetchIncidents());
    },
};

export const reducer = slice.reducer;
