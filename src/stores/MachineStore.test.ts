import { configureStore } from '@reduxjs/toolkit';
import { reducer, machineActions } from './MachineStore';
import { MachineOverview } from '@/types/Machine';

describe('MachineStore - cập nhật delta trạng thái và chế độ dập', () => {
    const createTestStore = (initialMachines: MachineOverview[] = []) => {
        return configureStore({
            reducer: {
                machine: reducer,
            },
            preloadedState: {
                machine: {
                    machines: initialMachines,
                    spacesTree: [],
                    selectedSpaceId: undefined,
                    selectedTimePeriod: null,
                    searchText: '',
                    isFetching: false,
                    isLoadingFactories: false,
                    isModalOpen: false,
                    selectedMachine: null,
                    stats: {
                        totalRun: 0,
                        totalIdle: 0,
                        totalError: 0,
                        totalOffline: 0,
                    },
                    error: null,
                },
            },
        });
    };

    const sampleMachine: MachineOverview = {
        machineId: 'm-001',
        machineName: 'CNC Mill 01',
        machineCode: 'CNC-01',
        status: 'running',
        currentStatus: 'RUNTIME',
        currentEnergyConsumption: 0,
        logs: [],
        totalProductions: 10,
        mode: 'SINGLE',
    };

    it('chỉ cập nhật chế độ dập khi frame chỉ có mode', () => {
        const store = createTestStore([sampleMachine]);

        store.dispatch(machineActions.updateMachineStatus('m-001', null, null, 'AUTOMATIC'));

        const updated = store.getState().machine.machines[0];
        expect(updated.mode).toBe('AUTOMATIC');
        expect(updated.currentStatus).toBe('RUNTIME');
        expect(updated.status).toBe('running');
    });

    it('giữ nguyên chế độ dập khi frame đổi trạng thái gửi mode là null', () => {
        const store = createTestStore([sampleMachine]);

        store.dispatch(machineActions.updateMachineStatus('m-001', 'ERROR', 15, null));

        const updated = store.getState().machine.machines[0];
        expect(updated.currentStatus).toBe('ERROR');
        expect(updated.status).toBe('error');
        expect(updated.productionCounter).toBe(15);
        expect(updated.mode).toBe('SINGLE');
    });

    it('cập nhật cả trạng thái và chế độ dập khi frame có cả hai', () => {
        const store = createTestStore([sampleMachine]);

        store.dispatch(machineActions.updateMachineStatus('m-001', 'IDLE', null, 'AUTOMATIC'));

        const updated = store.getState().machine.machines[0];
        expect(updated.currentStatus).toBe('IDLE');
        expect(updated.status).toBe('idle');
        expect(updated.mode).toBe('AUTOMATIC');
    });
});
