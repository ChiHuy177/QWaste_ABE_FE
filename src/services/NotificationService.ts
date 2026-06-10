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

const resolveNotificationText = (
    value: string | undefined,
    key: string | undefined,
    args: unknown[] | undefined,
    fallback = ''
) => {
    const trimmedValue = value?.trim();
    if (trimmedValue) return trimmedValue;
    if (!key) return fallback;

    const translated = i18n.t(key, { defaultValue: fallback });
    return formatKeyArgs(String(translated), args);
};

const normalizeNotification = (item: NotificationApiItem): Notification => {
    const titleKey = item.titleKey ?? item.title_key;
    const titleArgs = item.titleArgs ?? item.title_args;
    const contentKey = item.contentKey ?? item.content_key;
    const contentArgs = item.contentArgs ?? item.content_args;
    const content = item.content ?? item.message ?? item.body ?? item.description;

    return {
        notificationId: item.notificationId ?? item.id ?? Date.now(),
        title: resolveNotificationText(
            item.title,
            titleKey,
            titleArgs,
            String(i18n.t('notifications.title', { defaultValue: 'Notification' }))
        ),
        content: resolveNotificationText(content, contentKey, contentArgs),
        isRead: item.isRead ?? item.is_read ?? item.read ?? false,
        createdAt: item.createdAt ?? item.created_at ?? item.timestamp ?? new Date().toISOString(),
        payload: item.payload ?? {},
    };
};

const normalizeNotificationResponse = (
    response: NotificationApiResponse | undefined
): NotificationResponse => ({
    notifications: (response?.notifications ?? []).map(normalizeNotification),
    lastCreatedAt: response?.lastCreatedAt ?? response?.last_created_at ?? '',
    lastNotificationId: response?.lastNotificationId ?? response?.last_notification_id ?? 0,
    hasNext: response?.hasNext ?? response?.has_next ?? false,
});

export class NotificationService {
    static async getNotifications(
        limit = 10,
        lastCreatedAt = '',
        lastId = 0
    ): Promise<NotificationResponse> {
        let url = `${ENDPOINTS.NOTIFICATIONS.BASE}?limit=${limit}`;

        if (lastCreatedAt) {
            url += `&lastCreatedAt=${lastCreatedAt}`;
        }

        if (lastId > 0) {
            url += `&lastId=${lastId}`;
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
