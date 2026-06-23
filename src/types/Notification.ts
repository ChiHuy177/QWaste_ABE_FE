export interface Notification {
    notificationId: number;
    title: string;
    titleKey?: string;
    titleArgs?: unknown[];
    content: string;
    contentKey?: string;
    contentArgs?: unknown[];
    isRead: boolean;
    createdAt: string;
    payload: Record<string, any>;
}

export interface NotificationApiItem {
    notificationId: number;
    titleKey: string;
    titleArgs: unknown[];
    contentKey: string;
    contentArgs: unknown[];
    isRead: boolean;
    createdAt: string;
    payload: Record<string, any>;
}

export interface NotificationResponse {
    notifications: Notification[];
    lastCreatedAt: string;
    lastNotificationId: number;
    hasNext: boolean;
}

export interface NotificationApiResponse {
    notifications: NotificationApiItem[];
    lastCreatedAt?: string;
    lastNotificationId?: number;
    hasNext?: boolean;
}
