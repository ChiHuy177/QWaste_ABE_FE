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
    payload: Record<string, unknown>;
}

export interface NotificationApiItem {
    notificationId: number;
    titleKey: string;
    titleArgs: unknown[];
    contentKey: string;
    contentArgs: unknown[];
    isRead: boolean;
    createdAt: string;
    payload: Record<string, unknown>;
}

export interface NotificationResponse {
    notifications: Notification[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface NotificationApiResponse {
    items: NotificationApiItem[];
    nextCursor?: string | null;
    hasMore?: boolean;
}
