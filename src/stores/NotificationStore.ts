import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';
import { Notification } from '@/types/Notification';
import { NotificationService } from '@/services/NotificationService';
import { WebSocketService } from '@/services/WebSocketService';
import { WebSocketMessage } from '@/types/WebSocket';
import { toast } from 'sonner';
import i18n from '../../i18n';

export interface INotificationStoreState {
    unreadCount: number;
    isWebSocketConnected: boolean;
    notifications: Notification[];
    isFetching: boolean;
    error: string | null;
}

const initialState: INotificationStoreState = {
    unreadCount: 0,
    isWebSocketConnected: false,
    notifications: [],
    isFetching: false,
    error: null,
};

const TOAST_DEDUPE_COOLDOWN_MS = 8000;
const toastDedupeMap = new Map<string, number>();

const formatKeyArgs = (template: string, args: unknown[] = []) =>
    template.replace(/\{(\d+)\}/g, (_, index: string) => String(args[Number(index)] ?? ''));

const resolveNotificationText = (
    key: string | undefined,
    args: unknown[] | undefined,
    fallback: string
) => {
    if (!key) return fallback;

    const translated = i18n.t(key, { defaultValue: fallback });
    return formatKeyArgs(String(translated), args);
};

const buildNotificationFromMessage = (message: WebSocketMessage, fallbackTitle: string) => {
    const title = resolveNotificationText(
        message.titleKey,
        message.titleArgs,
        message.title?.trim() || fallbackTitle
    );
    const content = resolveNotificationText(
        message.contentKey,
        message.contentArgs,
        message.content?.trim() || ''
    );

    return {
        notificationId: Date.now(),
        title,
        content,
        isRead: false,
        createdAt: message.timestamp,
        payload: message.payload ?? {},
    } satisfies Notification;
};

const getToastDedupeKey = (message: WebSocketMessage) => {
    const payload = message.payload ?? {};
    const entityId =
        payload.machineId ??
        payload.orderId ??
        payload.taskId ??
        payload.notificationId ??
        payload.id ??
        '';
    const messageKey = message.contentKey ?? message.titleKey ?? message.title ?? message.content ?? '';

    return `${message.type}:${messageKey}:${String(entityId)}`;
};

const shouldShowToast = (message: WebSocketMessage) => {
    const key = getToastDedupeKey(message);
    const now = Date.now();
    const lastShownAt = toastDedupeMap.get(key);

    if (lastShownAt && now - lastShownAt < TOAST_DEDUPE_COOLDOWN_MS) {
        return false;
    }

    toastDedupeMap.set(key, now);
    return true;
};

const showNotificationToast = (notification: Notification, variant: 'info' | 'error') => {
    toast[variant](notification.title, {
        description: notification.content || undefined,
        duration: variant === 'error' ? 8000 : 5000,
        position: 'bottom-left',
    });
};

const slice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setUnreadCount: (state, action: PayloadAction<number>) => {
            state.unreadCount = action.payload;
        },

        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },

        decrementUnreadCount: (state) => {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
        },

        setWebSocketConnected: (state, action: PayloadAction<boolean>) => {
            state.isWebSocketConnected = action.payload;
        },

        setNotifications: (state, action: PayloadAction<Notification[]>) => {
            state.notifications = action.payload;
        },

        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications = [action.payload, ...state.notifications];
        },

        markNotificationAsRead: (state, action: PayloadAction<number>) => {
            const notification = state.notifications.find(
                (n) => n.notificationId === action.payload
            );
            if (notification) {
                notification.isRead = true;
            }
        },

        markAllNotificationsAsRead: (state) => {
            state.notifications = state.notifications.map((n) => ({
                ...n,
                isRead: true,
            }));
            state.unreadCount = 0;
        },

        setFetching: (state, action: PayloadAction<boolean>) => {
            state.isFetching = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isFetching = false;
        },

        resetNotificationState: () => initialState,
    },
});

export const { reducer } = slice;

export const notificationActions = {
    fetchUnreadCount: () => async (dispatch: Dispatch) => {
        try {
            const count = await NotificationService.getUnreadNotification();
            dispatch(slice.actions.setUnreadCount(count));
        } catch (error) {
            console.error('[NotificationStore] Failed to fetch unread count:', error);
            dispatch(slice.actions.setError('Failed to fetch unread count'));
        }
    },

    connectWebSocket: () => (dispatch: Dispatch) => {
        const wsService = WebSocketService.getInstance();

        if (!wsService.connected) {
            console.warn('[WebSocket-Notification] Not connected, cannot subscribe');
            return;
        }

        // Shared handler
        const handleMessage = (message: WebSocketMessage, source: string) => {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[WebSocket-Notification][${source}] Received:`, message.type, message);
            }

            switch (message.type) {
                case 'NOTIFICATION': {
                    const notification = buildNotificationFromMessage(message, 'Notification');
                    dispatch(slice.actions.addNotification(notification));
                    dispatch(slice.actions.incrementUnreadCount());
                    if (shouldShowToast(message)) {
                        showNotificationToast(notification, 'info');
                    }
                    break;
                }

                case 'ALERT': {
                    const notification = buildNotificationFromMessage(message, 'Alert');
                    dispatch(slice.actions.addNotification(notification));
                    dispatch(slice.actions.incrementUnreadCount());
                    if (shouldShowToast(message)) {
                        showNotificationToast(notification, 'error');
                        try {
                            new Audio('/sounds/notification.mp3').play().catch(() => { });
                        } catch { }
                    }
                    break;
                }

                case 'EVENT':
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                            new CustomEvent('wsEvent', {
                                detail: message.payload,
                            })
                        );
                    }
                    break;

                // DATA and COMMAND are handled by domain-specific hooks
                case 'DATA':
                case 'COMMAND':
                    break;

                default:
                    break;
            }
        };

        try {
            // Private queue: server gửi cho đúng user này (sendToUser)
            wsService.subscribe<WebSocketMessage>('/user/queue/messages', (message) =>
                handleMessage(message, 'private')
            );

            // Public topic: server broadcast đến tất cả user (broadcastToAll)
            wsService.subscribe<WebSocketMessage>('/topic/public', (message) =>
                handleMessage(message, 'public')
            );

            dispatch(slice.actions.setWebSocketConnected(true));
        } catch (error) {
            console.error('[WebSocket-Notification] Subscription failed:', error);
            dispatch(slice.actions.setError('Failed to connect to notifications'));
        }
    },

    disconnectWebSocket: () => (dispatch: Dispatch) => {
        console.log('[WebSocket-Notification] ===== DISCONNECTING =====');
        dispatch(slice.actions.setWebSocketConnected(false));
        dispatch(slice.actions.setUnreadCount(0));
        dispatch(slice.actions.setNotifications([]));
        console.log('[WebSocket-Notification] Disconnected and cleaned up');
    },

    markAsRead: (notificationId: number) => async (dispatch: Dispatch) => {
        try {
            await NotificationService.markAsRead([notificationId]);
            dispatch(slice.actions.markNotificationAsRead(notificationId));
            dispatch(slice.actions.decrementUnreadCount());
        } catch (error) {
            console.error('[NotificationStore] Failed to mark as read:', error);
            dispatch(slice.actions.setError('Failed to mark notification as read'));
        }
    },

    markAllAsRead: () => async (dispatch: Dispatch) => {
        try {
            await NotificationService.markAsRead([], true);
            dispatch(slice.actions.markAllNotificationsAsRead());
        } catch (error) {
            console.error('[NotificationStore] Failed to mark all as read:', error);
            dispatch(slice.actions.setError('Failed to mark all as read'));
        }
    },

    setUnreadCount: slice.actions.setUnreadCount,
    incrementUnreadCount: slice.actions.incrementUnreadCount,
    decrementUnreadCount: slice.actions.decrementUnreadCount,
    resetNotificationState: slice.actions.resetNotificationState,
};