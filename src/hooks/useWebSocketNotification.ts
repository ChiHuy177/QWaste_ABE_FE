import { useEffect } from 'react';
import { useAppDispatch } from '@/stores/hook';
import { notificationActions } from '@/stores/NotificationStore';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

export function useWebSocketNotification() {
    const { isConnected } = useWebSocketContext();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!isConnected) return;

        dispatch(notificationActions.connectWebSocket());
        dispatch(notificationActions.fetchUnreadCount());

        return () => {
            dispatch(notificationActions.disconnectWebSocket());
            dispatch(notificationActions.resetNotificationState());
        };
    }, [isConnected, dispatch]);
}
