import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';
import { MachineOverview, MachineStats } from '@/types/Machine';
import { SpaceWithChildrenResponse } from '@/types/Space';
import { MachineService } from '@services/MachineService';
import { calculateMachineStats } from '@/utils/machineUtils';
import { SpaceService } from '@/services/SpaceService';
import { DemoMachineService, USE_MOCK_FACTORY_OVERVIEW } from '@/mockData/admin/factory';

export interface IMachineStoreState {
    // Loading states
    isFetching: boolean;
    isLoadingFactories: boolean;

    // Data
    machines: MachineOverview[];
    spacesTree: SpaceWithChildrenResponse[];

    // Filters
    selectedSpaceId: number | undefined;
    selectedTimePeriod: number | null;
    searchText: string;

    // Modal state
    selectedMachine: MachineOverview | null;
    isModalOpen: boolean;

    // Computed stats
    stats: MachineStats;

    // Error handling
    error: string | null;
}

const initialState: IMachineStoreState = {
    isFetching: false,
    isLoadingFactories: false,
    machines: [],
    spacesTree: [],
    selectedSpaceId: undefined,
    selectedTimePeriod: null,
    searchText: '',
    selectedMachine: null,
    isModalOpen: false,
    stats: {
        totalRun: 0,
        totalIdle: 0,
        totalError: 0,
        totalEmpty: 0,
    },
    error: null,
};

const slice = createSlice({
    name: 'machine',
    initialState,
    reducers: {
        // Loading states
        setFetching: (state, action: PayloadAction<boolean>) => {
            state.isFetching = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setLoadingFactories: (state, action: PayloadAction<boolean>) => {
            state.isLoadingFactories = action.payload;
        },

        setSpacesTree: (state, action: PayloadAction<SpaceWithChildrenResponse[]>) => {
            state.spacesTree = action.payload;
        },

        setSelectedSpaceId: (state, action: PayloadAction<number | undefined>) => {
            state.selectedSpaceId = action.payload;
        },

        // Set machines and recalculate stats
        setMachines: (state, action: PayloadAction<MachineOverview[]>) => {
            state.machines = action.payload;
            state.stats = calculateMachineStats(action.payload);
        },



        setSelectedTimePeriod: (state, action: PayloadAction<number | null>) => {
            state.selectedTimePeriod = action.payload;
        },

        setSearchText: (state, action: PayloadAction<string>) => {
            state.searchText = action.payload;
        },

        // Modal state
        setSelectedMachine: (state, action: PayloadAction<MachineOverview | null>) => {
            state.selectedMachine = action.payload;
        },

        setModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isModalOpen = action.payload;
            // Clear selected machine when closing modal
            if (!action.payload) {
                state.selectedMachine = null;
            }
        },

        // Error handling
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isFetching = false;
        },

        // Reset state
        resetMachineState: () => initialState,

        updateMachine: (
            state,
            action: PayloadAction<Partial<MachineOverview> & { machineId: string }>
        ) => {
            const index = state.machines.findIndex((m) => m.machineId === action.payload.machineId);

            if (index >= 0) {
                state.machines[index] = {
                    ...state.machines[index],
                    ...action.payload,
                };

                // Recalculate stats after update
                state.stats = calculateMachineStats(state.machines);

                // Update selected machine if it's the same one
                if (state.selectedMachine?.machineId === action.payload.machineId) {
                    state.selectedMachine = {
                        ...state.selectedMachine,
                        ...action.payload,
                    };
                }
            }
        },

        updateMachinesPower: (state, action: PayloadAction<Record<string, number>>) => {
            const powerData = action.payload;

            state.machines = state.machines.map((machine) => {
                const newPower = powerData[machine.machineId];
                if (newPower !== undefined) {
                    return {
                        ...machine,
                        currentEnergyConsumption: newPower,
                    };
                }
                return machine;
            });
        },

        setFullMachinesData: (state, action: PayloadAction<MachineOverview[]>) => {
            state.machines = action.payload;
            state.stats = calculateMachineStats(action.payload);
        },
    },
});

export const { reducer } = slice;

export const machineActions = {
    fetchFactories: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingFactories(true));

        try {
            const spacesTree = USE_MOCK_FACTORY_OVERVIEW
                ? await DemoMachineService.getSpacesTree()
                : await SpaceService.getAllSpacesTree();
            dispatch(slice.actions.setSpacesTree(spacesTree));
        } catch (error) {
            console.error('Error fetching spaces tree:', error);
            dispatch(slice.actions.setError('Failed to load spaces tree'));
        } finally {
            dispatch(slice.actions.setLoadingFactories(false));
        }
    },

    fetchMachines:
        (spaceId: number, filterId: number) =>
            async (dispatch: Dispatch) => {
                dispatch(slice.actions.setFetching(true));

                try {
                    const machines = USE_MOCK_FACTORY_OVERVIEW
                        ? await DemoMachineService.getMachinesWithLogs(spaceId)
                        : await MachineService.getMachinesWithLogs(spaceId, filterId);
                    dispatch(slice.actions.setMachines(machines));
                } catch (error) {
                    console.error('Error fetching machines:', error);
                    dispatch(slice.actions.setError('Failed to load machines'));
                } finally {
                    dispatch(slice.actions.setFetching(false));
                }
            },

    openMachineModal: (machine: MachineOverview) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedMachine(machine));
        dispatch(slice.actions.setModalOpen(true));
    },

    closeMachineModal: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setModalOpen(false));
    },

    setSelectedSpaceId: (spaceId: number | undefined) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedSpaceId(spaceId));
    },

    updateMachineStatus:
        (
            machineId: string,
            logStatus: MachineOverview['currentStatus'],
            productionCounter: number
        ) =>
            (dispatch: Dispatch) => {
                dispatch(
                    slice.actions.updateMachine({
                        machineId,
                        currentStatus: logStatus,
                        productionCounter,
                        lastStatusUpdate: new Date().toISOString(),
                    })
                );
            },

    updateMachinesPower: (powerData: Record<string, number>) => (dispatch: Dispatch) => {
        dispatch(slice.actions.updateMachinesPower(powerData));
    },

    setFullMachinesData: (machines: MachineOverview[]) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setFullMachinesData(machines));
    },

    setSpacesTree: slice.actions.setSpacesTree,
    setSelectedTimePeriod: slice.actions.setSelectedTimePeriod,
    setSearchText: slice.actions.setSearchText,
    setError: slice.actions.setError,
    resetMachineState: slice.actions.resetMachineState,
};
