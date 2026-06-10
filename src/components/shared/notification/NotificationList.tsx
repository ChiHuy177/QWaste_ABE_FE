'use client';

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Notification } from '@/types/Notification';
import {
    DemoNotificationService,
    USE_MOCK_NOTIFICATIONS,
} from '@/mockData/notifications';
import { NotificationService } from '@/services/NotificationService';
import NotificationItem from './NotificationItem';
import { Spin, Empty, theme, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { InboxOutlined } from '@ant-design/icons';
import InfiniteScroll from 'react-infinite-scroll-component';

interface NotificationListProps {
    onNotificationClick?: (notification: Notification) => void;
}

const activeNotificationService = USE_MOCK_NOTIFICATIONS
    ? DemoNotificationService
    : NotificationService;

const mergeUniqueNotifications = (
    currentNotifications: Notification[],
    nextNotifications: Notification[]
) => {
    const notificationMap = new Map<number, Notification>();

    [...currentNotifications, ...nextNotifications].forEach((notification) => {
        notificationMap.set(notification.notificationId, notification);
    });

    return Array.from(notificationMap.values());
};

export interface NotificationListRef {
    markAllAsReadLocal: () => void;
}

const NotificationList = forwardRef<NotificationListRef, NotificationListProps>(
    ({ onNotificationClick }, ref) => {
        const [notifications, setNotifications] = useState<Notification[]>([]);
        const [hasMore, setHasMore] = useState(true);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [lastCreatedAt, setLastCreatedAt] = useState('');
        const [lastId, setLastId] = useState(0);
        const [isMobile, setIsMobile] = useState(false);
        const { token } = theme.useToken();
        const { t } = useTranslation();
        const isMountedRef = useRef(false);
        const isFetchingRef = useRef(false);

        // Expose method to parent component
        useImperativeHandle(ref, () => ({
            markAllAsReadLocal: () => {
                setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
            },
        }));

        useEffect(() => {
            const checkMobile = () => {
                setIsMobile(window.innerWidth < 768);
            };

            checkMobile();
            window.addEventListener('resize', checkMobile);
            return () => window.removeEventListener('resize', checkMobile);
        }, []);

        const fetchNotifications = useCallback(
            async (isInitial = false) => {
                if (isFetchingRef.current) {
                    return;
                }

                try {
                    isFetchingRef.current = true;
                    setLoading(true);
                    if (isInitial) {
                        setError(null);
                    }

                    const response = isInitial
                        ? await activeNotificationService.getNotifications()
                        : await activeNotificationService.getNotifications(
                              10,
                              lastCreatedAt,
                              lastId
                          );

                    if (isInitial) {
                        setNotifications(mergeUniqueNotifications([], response.notifications));
                    } else {
                        setNotifications((prev) =>
                            mergeUniqueNotifications(prev, response.notifications)
                        );
                    }

                    setHasMore(response.hasNext);
                    setLastCreatedAt(response.lastCreatedAt);
                    setLastId(response.lastNotificationId);
                    setError(null);
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                    if (isInitial) {
                        setError(
                            t('notifications.error', 'Không thể tải thông báo. Vui lòng thử lại.')
                        );
                    }
                } finally {
                    isFetchingRef.current = false;
                    setLoading(false);
                }
            },
            [lastCreatedAt, lastId, t]
        );

        useEffect(() => {
            if (!isMountedRef.current) {
                isMountedRef.current = true;
                fetchNotifications(true);
            }
        }, [fetchNotifications]);

        const handleMarkAsRead = useCallback(async (notificationId: number) => {
            try {
                await activeNotificationService.markAsRead([notificationId]);
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.notificationId === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }, []);

        const loadMore = () => {
            if (!loading && hasMore) {
                fetchNotifications(false);
            }
        };

        const handleRetry = () => {
            setNotifications([]);
            setLastCreatedAt('');
            setLastId(0);
            setHasMore(true);
            fetchNotifications(true);
        };

        if (notifications.length === 0 && loading && !error) {
            return (
                <div
                    style={{
                        padding: isMobile ? '40px 20px' : '60px 20px',
                        textAlign: 'center',
                        backgroundColor: token.colorBgContainer,
                    }}
                >
                    <Spin size="default" />
                </div>
            );
        }

        if (notifications.length === 0 && error) {
            return (
                <div
                    style={{
                        padding: isMobile ? '40px 20px' : '60px 20px',
                        textAlign: 'center',
                        backgroundColor: token.colorBgContainer,
                    }}
                >
                    <InboxOutlined
                        style={{
                            fontSize: isMobile ? 40 : 48,
                            color: token.colorError,
                            marginBottom: 16,
                        }}
                    />
                    <Empty
                        description={
                            <span
                                style={{
                                    color: token.colorTextSecondary,
                                    fontSize: isMobile ? 13 : 14,
                                }}
                            >
                                {error}
                            </span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        imageStyle={{ height: 0 }}
                    >
                        <Button
                            type="primary"
                            onClick={handleRetry}
                            loading={loading}
                            size={isMobile ? 'small' : 'middle'}
                        >
                            {t('notifications.retry', 'Thử lại')}
                        </Button>
                    </Empty>
                </div>
            );
        }

        if (notifications.length === 0) {
            return (
                <div
                    style={{
                        padding: isMobile ? '40px 20px' : '60px 20px',
                        textAlign: 'center',
                        backgroundColor: token.colorBgContainer,
                    }}
                >
                    <InboxOutlined
                        style={{
                            fontSize: isMobile ? 40 : 48,
                            color: token.colorTextTertiary,
                            marginBottom: 16,
                        }}
                    />
                    <Empty
                        description={
                            <span
                                style={{
                                    color: token.colorTextSecondary,
                                    fontSize: isMobile ? 13 : 14,
                                }}
                            >
                                {t('notifications.empty', 'Không có thông báo')}
                            </span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        imageStyle={{ height: 0 }}
                    />
                </div>
            );
        }

        return (
            <div
                id="notification-scroll-container"
                style={{
                    maxHeight: isMobile ? 360 : 480,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    backgroundColor: token.colorBgContainer,
                }}
            >
                <InfiniteScroll
                    dataLength={notifications.length}
                    next={loadMore}
                    hasMore={hasMore}
                    loader={
                        <div
                            style={{
                                textAlign: 'center',
                                padding: isMobile ? '16px' : '20px',
                                backgroundColor: token.colorBgContainer,
                            }}
                        >
                            <Spin size="small" />
                        </div>
                    }
                    scrollableTarget="notification-scroll-container"
                    endMessage={
                        notifications.length > 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: isMobile ? '16px' : '20px',
                                    color: token.colorTextTertiary,
                                    fontSize: isMobile ? 12 : 13,
                                    fontWeight: 500,
                                    backgroundColor: `${token.colorBgTextHover}50`,
                                    borderTop: `1px dashed ${token.colorBorder}`,
                                }}
                            >
                                {t('notifications.noMore', 'Đã hiển thị tất cả thông báo')}
                            </div>
                        )
                    }
                >
                    {notifications.map((notification) => (
                        <NotificationItem
                            key={notification.notificationId}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onClick={onNotificationClick}
                        />
                    ))}
                </InfiniteScroll>
            </div>
        );
    }
);

NotificationList.displayName = 'NotificationList';

export default NotificationList;
