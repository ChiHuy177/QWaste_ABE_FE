export interface Notification {
    notificationId: number;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    payload: Record<string, any>;
}

export interface NotificationApiItem {
    notificationId?: number;
    id?: number;
    title?: string;
    titleKey?: string;
    title_key?: string;
    titleArgs?: unknown[];
    title_args?: unknown[];
    content?: string;
    contentKey?: string;
    content_key?: string;
    contentArgs?: unknown[];
    content_args?: unknown[];
    message?: string;
    body?: string;
    description?: string;
    isRead?: boolean;
    is_read?: boolean;
    read?: boolean;
    createdAt?: string;
    created_at?: string;
    timestamp?: string;
    payload?: Record<string, any>;
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
    last_created_at?: string;
    lastNotificationId?: number;
    last_notification_id?: number;
    hasNext?: boolean;
    has_next?: boolean;
}
