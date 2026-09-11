import { ReducersMapObject } from '@reduxjs/toolkit';
import * as machineStore from './MachineStore';
import * as userSettingsStore from './UserSettingsStore';
import * as notificationStore from './NotificationStore';
import * as factoryOverviewStore from './FactoryOverviewStore';
import * as productionPlanStore from './ProductionPlanStore';
import * as productionPlanMonitorStore from './ProductionPlanMonitorStore';

export interface AppState {
    machine: machineStore.IMachineStoreState;
    userSettings: userSettingsStore.IUserSettingsStoreState;
    notification: notificationStore.INotificationStoreState;
    factoryOverview: factoryOverviewStore.IFactoryOverviewStoreState;
    productionPlan: productionPlanStore.IProductionPlanStoreState;
    productionPlanMonitor: productionPlanMonitorStore.IProductionPlanMonitorStoreState;
}

export const reducers: ReducersMapObject<AppState> = {
    machine: machineStore.reducer,
    userSettings: userSettingsStore.reducer,
    notification: notificationStore.reducer,
    factoryOverview: factoryOverviewStore.reducer,
    productionPlan: productionPlanStore.reducer,
    productionPlanMonitor: productionPlanMonitorStore.reducer,
};

export { machineActions } from './MachineStore';
export { userSettingsActions } from './UserSettingsStore';
export { notificationActions } from './NotificationStore';
export { factoryOverviewActions } from './FactoryOverviewStore';
export { productionPlanActions } from './ProductionPlanStore';
export { productionPlanMonitorActions } from './ProductionPlanMonitorStore';
