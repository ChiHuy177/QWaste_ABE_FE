import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import type {
    PlanModalState,
    PlanRowTarget,
    TransferMachineModalState,
    TransferScheduleModalState,
} from '@/app/(dashboard)/admin/production-plan/_components/types';

export type ProductionPlanActiveView = 'daily' | 'weekly' | 'matrix';

export interface IProductionPlanStoreState {
    activeView: ProductionPlanActiveView;
    /** yyyy-MM-dd — Dayjs không serializable, convert ở nơi đọc. */
    selectedDate: string;
    machineFilter: string;
    modalState: PlanModalState;
    deleteState: PlanRowTarget | null;
    transferMachineState: TransferMachineModalState;
    transferScheduleState: TransferScheduleModalState;
    importModalOpen: boolean;
    dirtyMachineIds: string[];
    navConfirmOpen: boolean;
}

const initialState: IProductionPlanStoreState = {
    activeView: 'daily',
    selectedDate: dayjs().format('YYYY-MM-DD'),
    machineFilter: '',
    modalState: { open: false },
    deleteState: null,
    transferMachineState: { open: false },
    transferScheduleState: { open: false },
    importModalOpen: false,
    dirtyMachineIds: [],
    navConfirmOpen: false,
};

const slice = createSlice({
    name: 'productionPlan',
    initialState,
    reducers: {
        setActiveView: (state, action: PayloadAction<ProductionPlanActiveView>) => {
            state.activeView = action.payload;
        },

        setSelectedDate: (state, action: PayloadAction<string>) => {
            state.selectedDate = action.payload;
        },

        setMachineFilter: (state, action: PayloadAction<string>) => {
            state.machineFilter = action.payload;
        },

        openCreateModal: (state) => {
            state.modalState = { open: true, mode: 'create' };
        },

        openEditModal: (
            state,
            action: PayloadAction<{ machineId: string; row: PlanRowTarget['row'] }>
        ) => {
            state.modalState = {
                open: true,
                mode: 'edit',
                machineId: action.payload.machineId,
                row: action.payload.row,
            };
        },

        closeModal: (state) => {
            state.modalState = { open: false };
        },

        setDeleteState: (state, action: PayloadAction<PlanRowTarget | null>) => {
            state.deleteState = action.payload;
        },

        setTransferMachineState: (state, action: PayloadAction<TransferMachineModalState>) => {
            state.transferMachineState = action.payload;
        },

        setTransferScheduleState: (state, action: PayloadAction<TransferScheduleModalState>) => {
            state.transferScheduleState = action.payload;
        },

        setImportModalOpen: (state, action: PayloadAction<boolean>) => {
            state.importModalOpen = action.payload;
        },

        markMachineDirty: (state, action: PayloadAction<string>) => {
            if (!state.dirtyMachineIds.includes(action.payload)) {
                state.dirtyMachineIds.push(action.payload);
            }
        },

        clearDirtyMachines: (state) => {
            state.dirtyMachineIds = [];
        },

        setNavConfirmOpen: (state, action: PayloadAction<boolean>) => {
            state.navConfirmOpen = action.payload;
        },

        resetProductionPlanUI: () => initialState,
    },
});

export const { reducer } = slice;

export const productionPlanActions = {
    setActiveView: slice.actions.setActiveView,
    setSelectedDate: slice.actions.setSelectedDate,
    setMachineFilter: slice.actions.setMachineFilter,
    openCreateModal: slice.actions.openCreateModal,
    openEditModal: slice.actions.openEditModal,
    closeModal: slice.actions.closeModal,
    setDeleteState: slice.actions.setDeleteState,
    setTransferMachineState: slice.actions.setTransferMachineState,
    setTransferScheduleState: slice.actions.setTransferScheduleState,
    setImportModalOpen: slice.actions.setImportModalOpen,
    markMachineDirty: slice.actions.markMachineDirty,
    clearDirtyMachines: slice.actions.clearDirtyMachines,
    setNavConfirmOpen: slice.actions.setNavConfirmOpen,
    resetProductionPlanUI: slice.actions.resetProductionPlanUI,
};
