import { useEffect } from 'react';
import { USE_MOCK_NOTIFICATIONS } from '@/mockData/notifications';
import { useAppDispatch } from '@/stores/hook';
import { notificationActions } from '@/stores/NotificationStore';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

export function useWebSocketNotification() {
    const { isConnected } = useWebSocketContext();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (USE_MOCK_NOTIFICATIONS) {
            dispatch(notificationActions.resetNotificationState());
            return;
        }

        if (!isConnected) return;

        dispatch(notificationActions.connectWebSocket() as any);
        dispatch(notificationActions.fetchUnreadCount() as any);

        return () => {
            dispatch(notificationActions.disconnectWebSocket() as any);
            dispatch(notificationActions.resetNotificationState());
        };
    }, [isConnected, dispatch]);
}
