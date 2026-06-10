import type { NotificationResponse } from '@/types/Notification';

export const USE_MOCK_NOTIFICATIONS = true;

const EMPTY_NOTIFICATION_RESPONSE: NotificationResponse = {
    notifications: [],
    lastCreatedAt: '',
    lastNotificationId: 0,
    hasNext: false,
};

export class DemoNotificationService {
    static async getNotifications(
        _limit = 10,
        _lastCreatedAt = '',
        _lastId = 0
    ): Promise<NotificationResponse> {
        return { ...EMPTY_NOTIFICATION_RESPONSE, notifications: [] };
    }

    static async markAsRead(_notificationIds: number[] = [], _markAll = false): Promise<string> {
        return 'Demo notifications marked as read';
    }

    static async getUnreadNotification(): Promise<number> {
        return 0;
    }
}
