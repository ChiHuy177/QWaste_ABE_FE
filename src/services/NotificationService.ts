import {
    Notification,
    NotificationApiItem,
    NotificationApiResponse,
    NotificationResponse,
} from '@/types/Notification';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import i18n from '../../i18n';

const formatKeyArgs = (template: string, args: unknown[] = []) =>
    template.replace(/\{(\d+)\}/g, (_, index: string) => String(args[Number(index)] ?? ''));

const normalizeNotification = (item: NotificationApiItem): Notification => ({
    notificationId: item.notificationId,
    title: formatKeyArgs(
        String(i18n.t(item.titleKey, { defaultValue: item.titleKey })),
        item.titleArgs
    ),
    titleKey: item.titleKey,
    titleArgs: item.titleArgs,
    content: formatKeyArgs(
        String(i18n.t(item.contentKey, { defaultValue: item.contentKey })),
        item.contentArgs
    ),
    contentKey: item.contentKey,
    contentArgs: item.contentArgs,
    isRead: item.isRead,
    createdAt: item.createdAt,
    payload: item.payload ?? {},
});

const normalizeNotificationResponse = (
    response: NotificationApiResponse | undefined
): NotificationResponse => ({
    notifications: (response?.items ?? []).map(normalizeNotification),
    nextCursor: response?.nextCursor ?? null,
    hasMore: response?.hasMore ?? false,
});

export class NotificationService {
    static async getNotifications(limit = 10, cursor?: string): Promise<NotificationResponse> {
        let url = `${ENDPOINTS.NOTIFICATIONS.BASE}?limit=${limit}`;

        if (cursor) {
            url += `&cursor=${encodeURIComponent(cursor)}`;
        }

        const response = await NetworkService.requestJson<NotificationApiResponse>({
            method: 'GET',
            url,
        });

        return normalizeNotificationResponse(response.result);
    }

    static async markAsRead(notificationIds: number[] = [], markAll = false): Promise<string> {
        const response = await NetworkService.requestJson<string>({
            method: 'PUT',
            url: ENDPOINTS.NOTIFICATIONS.READ,
            data: {
                notificationIds,
                markAll,
            },
        });

        return response.message as string;
    }

    static async getUnreadNotification() {
        const response = await NetworkService.requestJson<number>({
            method: 'GET',
            url: ENDPOINTS.NOTIFICATIONS.UNREAD,
        });

        return response.result as number;
    }
}
