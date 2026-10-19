import { SpaceService } from '@/services';
import { SpacePickingWithChildren, SpaceOverview } from '@/types/Space';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from './configureStore';
import dayjs from 'dayjs';

export interface IFactoryOverviewStoreState {
    selectedStartDate: string;
    selectedEndDate: string;
    selectedTimePeriod: number | null;
    selectedShiftFilterId: number | null;
    selectedSpaceId: number | null;
    spaces: SpacePickingWithChildren[];
    spaceData: SpaceOverview | null;
    isLoading: boolean;
    isLoadingSpaces: boolean;
    error: string | null;
}

const initialState: IFactoryOverviewStoreState = {
    selectedStartDate: dayjs().format('YYYY-MM-DD'),
    selectedEndDate: dayjs().format('YYYY-MM-DD'),
    selectedTimePeriod: null,
    selectedShiftFilterId: null,
    selectedSpaceId: null,
    spaces: [],
    spaceData: null,
    isLoading: false,
    isLoadingSpaces: false,
    error: null,
};

const slice = createSlice({
    name: 'factoryOverview',
    initialState,
    reducers: {
        setSelectedDateRange: (
            state,
            action: PayloadAction<{ startDate: string; endDate: string }>
        ) => {
            state.selectedStartDate = action.payload.startDate;
            state.selectedEndDate = action.payload.endDate;
        },

        setSelectedTimePeriod: (state, action: PayloadAction<number | null>) => {
            state.selectedTimePeriod = action.payload;
        },

        setSelectedShiftFilterId: (state, action: PayloadAction<number | null>) => {
            state.selectedShiftFilterId = action.payload;
        },

        setSelectedSpaceId: (state, action: PayloadAction<number | null>) => {
            state.selectedSpaceId = action.payload;
        },

        setSpaces: (state, action: PayloadAction<SpacePickingWithChildren[]>) => {
            state.spaces = action.payload;
            if (action.payload.length > 0 && !state.selectedSpaceId) {
                state.selectedSpaceId = action.payload[0].spaceId;
            }
        },

        setSpaceData: (state, action: PayloadAction<SpaceOverview | null>) => {
            state.spaceData = action.payload;
        },

        updateSpaceData: (state, action: PayloadAction<SpaceOverview>) => {
            state.spaceData = action.payload;
        },

        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setIsLoadingSpaces: (state, action: PayloadAction<boolean>) => {
            state.isLoadingSpaces = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        resetFactoryOverview: () => initialState,
    },
});

export const { reducer } = slice;

export const factoryOverviewActions = {
    fetchSpaces: () => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setIsLoadingSpaces(true));
        dispatch(slice.actions.setError(null));

        try {
            const data = await SpaceService.getSpacesByLevelWithChildren(1);
            dispatch(slice.actions.setSpaces(data));
            return { success: true, data };
        } catch (error) {
            console.error('[Factory Overview Store] Error fetching spaces:', error);
            dispatch(slice.actions.setError('Failed to fetch spaces'));
            return { success: false, error: 'Failed to fetch spaces' };
        } finally {
            dispatch(slice.actions.setIsLoadingSpaces(false));
        }
    },

    fetchSpaceOverview:
        (spaceId: number, filterId: number, shiftFilterId?: number) =>
        async (dispatch: AppDispatch) => {
            dispatch(slice.actions.setIsLoading(true));
            dispatch(slice.actions.setError(null));

            try {
                const overview = await SpaceService.getSpaceOverview(
                    spaceId,
                    filterId,
                    shiftFilterId
                );
                dispatch(slice.actions.setSpaceData(overview));
                return { success: true, data: overview };
            } catch (error) {
                console.error('[Factory Overview Store] Error fetching space overview:', error);
                dispatch(slice.actions.setError('Failed to fetch space overview'));
                dispatch(slice.actions.setSpaceData(null));
                return { success: false, error: 'Failed to fetch space overview' };
            } finally {
                dispatch(slice.actions.setIsLoading(false));
            }
        },

    fetchSpaceOverviewByDateRange:
        (spaceId: number, startDate: string, endDate: string, filterId?: number) =>
        async (dispatch: AppDispatch) => {
            dispatch(slice.actions.setIsLoading(true));
            dispatch(slice.actions.setError(null));

            try {
                const overview = await SpaceService.getSpaceOverviewByDateRange(
                    spaceId,
                    startDate,
                    endDate,
                    filterId
                );
                dispatch(slice.actions.setSpaceData(overview));
                return { success: true, data: overview };
            } catch (error) {
                console.error(
                    '[Factory Overview Store] Error fetching space overview by date range:',
                    error
                );
                dispatch(slice.actions.setError('Failed to fetch space overview'));
                dispatch(slice.actions.setSpaceData(null));
                return { success: false, error: 'Failed to fetch space overview' };
            } finally {
                dispatch(slice.actions.setIsLoading(false));
            }
        },

    search: () => async (dispatch: AppDispatch, getState: () => RootState) => {
        const { selectedSpaceId, selectedStartDate, selectedEndDate, selectedTimePeriod } =
            getState().factoryOverview;

        if (!selectedSpaceId) {
            console.warn('[Factory Overview Store] No space selected');
            return { success: false, error: 'No space selected' };
        }

        if (!selectedTimePeriod) {
            console.warn('[Factory Overview Store] No filter selected');
            return { success: false, error: 'No filter selected' };
        }

        const isDateRange = selectedStartDate !== selectedEndDate;

        if (!isDateRange) {
            return dispatch(
                factoryOverviewActions.fetchSpaceOverview(
                    selectedSpaceId,
                    selectedTimePeriod as number
                )
            );
        }

        return dispatch(
            factoryOverviewActions.fetchSpaceOverviewByDateRange(
                selectedSpaceId,
                selectedStartDate,
                selectedEndDate,
                selectedTimePeriod as number
            )
        );
    },

    setSelectedDateRange: slice.actions.setSelectedDateRange,
    setSelectedTimePeriod: slice.actions.setSelectedTimePeriod,
    setSelectedShiftFilterId: slice.actions.setSelectedShiftFilterId,
    setSelectedSpaceId: slice.actions.setSelectedSpaceId,
    setSpaceData: slice.actions.setSpaceData,
    updateSpaceData: slice.actions.updateSpaceData,
    setIsLoading: slice.actions.setIsLoading,
    setError: slice.actions.setError,
    resetFactoryOverview: slice.actions.resetFactoryOverview,
};
