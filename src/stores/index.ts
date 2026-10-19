import { ReducersMapObject } from '@reduxjs/toolkit';
import * as machineStore from './MachineStore';
import * as userSettingsStore from './UserSettingsStore';
import * as notificationStore from './NotificationStore';
import * as factoryOverviewStore from './FactoryOverviewStore';
import * as productionPlanStore from './ProductionPlanStore';
import * as productionPlanMonitorStore from './ProductionPlanMonitorStore';
import * as workCalendarStore from './WorkCalendarStore';
import * as productionOverviewStore from './ProductionOverviewStore';
import * as errorManagementStore from './ErrorManagementStore';

export interface AppState {
    machine: machineStore.IMachineStoreState;
    userSettings: userSettingsStore.IUserSettingsStoreState;
    notification: notificationStore.INotificationStoreState;
    factoryOverview: factoryOverviewStore.IFactoryOverviewStoreState;
    productionPlan: productionPlanStore.IProductionPlanStoreState;
    productionPlanMonitor: productionPlanMonitorStore.IProductionPlanMonitorStoreState;
    workCalendar: workCalendarStore.IWorkCalendarStoreState;
    productionOverview: productionOverviewStore.IProductionOverviewStoreState;
    errorManagement: errorManagementStore.IErrorManagementStoreState;
}

export const reducers: ReducersMapObject<AppState> = {
    machine: machineStore.reducer,
    userSettings: userSettingsStore.reducer,
    notification: notificationStore.reducer,
    factoryOverview: factoryOverviewStore.reducer,
    productionPlan: productionPlanStore.reducer,
    productionPlanMonitor: productionPlanMonitorStore.reducer,
    workCalendar: workCalendarStore.reducer,
    productionOverview: productionOverviewStore.reducer,
    errorManagement: errorManagementStore.reducer,
};

export { machineActions } from './MachineStore';
export { userSettingsActions } from './UserSettingsStore';
export { notificationActions } from './NotificationStore';
export { factoryOverviewActions } from './FactoryOverviewStore';
export { productionPlanActions } from './ProductionPlanStore';
export { productionPlanMonitorActions } from './ProductionPlanMonitorStore';
export { workCalendarActions } from './WorkCalendarStore';
export { productionOverviewActions } from './ProductionOverviewStore';
export { errorManagementActions } from './ErrorManagementStore';
