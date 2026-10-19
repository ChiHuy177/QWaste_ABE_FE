import { configureStore } from '@reduxjs/toolkit';
import { reducers } from '.';

export const store = configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'machine/setMachines',
                    'machine/updateMachine',
                    'factoryOverview/setSpaceData',
                    'factoryOverview/updateSpaceData',
                    'productionOverview/setLiveKpiData',
                    'productionOverview/setLiveChartsData',
                ],
                ignoredPaths: [
                    'machine.machines',
                    'machine.selectedMachine.lastStatusUpdate',
                    'factoryOverview.spaceData',
                    'productionOverview.liveChartsData',
                ],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
