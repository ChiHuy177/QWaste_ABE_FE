import * as machineStore from './MachineStore';
import * as userSettingsStore from './UserSettingsStore';
import * as notificationStore from './NotificationStore';
import * as factoryOverviewStore from './FactoryOverviewStore';
import * as drawingCodeStore from './DrawingCodeStore';
import * as orderStore from './OrderStore';

export interface AppState {
    machine: machineStore.IMachineStoreState;
    userSettings: userSettingsStore.IUserSettingsStoreState;
    notification: notificationStore.INotificationStoreState;
    factoryOverview: factoryOverviewStore.IFactoryOverviewStoreState;
    drawingCode: drawingCodeStore.IDrawingCodeStoreState;
    order: orderStore.IOrderStoreState;
}

export const reducers: any = {
    machine: machineStore.reducer,
    userSettings: userSettingsStore.reducer,
    notification: notificationStore.reducer,
    factoryOverview: factoryOverviewStore.reducer,
    drawingCode: drawingCodeStore.reducer,
    order: orderStore.reducer,
};

export { machineActions } from './MachineStore';
export { userSettingsActions } from './UserSettingsStore';
export { notificationActions } from './NotificationStore';
export { factoryOverviewActions } from './FactoryOverviewStore';
export { drawingCodeActions } from './DrawingCodeStore';
export { orderActions } from './OrderStore';
