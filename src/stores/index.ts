import * as machineStore from './MachineStore';
import * as userSettingsStore from './UserSettingsStore';
import * as notificationStore from './NotificationStore';
import * as factoryOverviewStore from './FactoryOverviewStore';

export interface AppState {
    machine: machineStore.IMachineStoreState;
    userSettings: userSettingsStore.IUserSettingsStoreState;
    notification: notificationStore.INotificationStoreState;
    factoryOverview: factoryOverviewStore.IFactoryOverviewStoreState;
}

export const reducers: any = {
    machine: machineStore.reducer,
    userSettings: userSettingsStore.reducer,
    notification: notificationStore.reducer,
    factoryOverview: factoryOverviewStore.reducer,
};

export { machineActions } from './MachineStore';
export { userSettingsActions } from './UserSettingsStore';
export { notificationActions } from './NotificationStore';
export { factoryOverviewActions } from './FactoryOverviewStore';
