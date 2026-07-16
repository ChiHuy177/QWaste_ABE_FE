import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    MONITOR_GROUP_ORDER,
    type MonitorGroupKey,
} from '@/app/(dashboard)/admin/production-plan/_utils/planMappers';

export interface IProductionPlanMonitorStoreState {
    searchText: string;
    selectedRowId: string | null;
    incidentRowId: string | null;
    activeKeys: MonitorGroupKey[];
}

const initialState: IProductionPlanMonitorStoreState = {
    searchText: '',
    selectedRowId: null,
    incidentRowId: null,
    activeKeys: [MONITOR_GROUP_ORDER[0]],
};

const slice = createSlice({
    name: 'productionPlanMonitor',
    initialState,
    reducers: {
        setSearchText: (state, action: PayloadAction<string>) => {
            state.searchText = action.payload;
        },

        selectRow: (state, action: PayloadAction<string | null>) => {
            state.selectedRowId = action.payload;
        },

        openIncidentModal: (state, action: PayloadAction<string>) => {
            state.incidentRowId = action.payload;
        },

        closeIncidentModal: (state) => {
            state.incidentRowId = null;
        },

        setActiveKeys: (state, action: PayloadAction<MonitorGroupKey[]>) => {
            state.activeKeys = action.payload;
        },

        resetProductionPlanMonitorUI: () => initialState,
    },
});

export const { reducer } = slice;

export const productionPlanMonitorActions = {
    setSearchText: slice.actions.setSearchText,
    selectRow: slice.actions.selectRow,
    openIncidentModal: slice.actions.openIncidentModal,
    closeIncidentModal: slice.actions.closeIncidentModal,
    setActiveKeys: slice.actions.setActiveKeys,
    resetProductionPlanMonitorUI: slice.actions.resetProductionPlanMonitorUI,
};
