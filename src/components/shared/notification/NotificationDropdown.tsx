'use client';

import { useState, useEffect, useRef } from 'react';
import { Dropdown, Badge, Button, theme, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import NotificationList from './NotificationList';
import { NotificationService } from '@/services/NotificationService';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/stores/hook';
import { notificationActions } from '@/stores/NotificationStore';

const { Text } = Typography;

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const notificationListRef = useRef<{ markAllAsReadLocal: () => void } | null>(null);

    const dispatch = useAppDispatch();
    const unreadCount = useAppSelector((state) => state.notification.unreadCount);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        dispatch(notificationActions.fetchUnreadCount());
        const interval = setInterval(() => {
            dispatch(notificationActions.fetchUnreadCount());
        }, 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    const handleMarkAllAsRead = async () => {
        try {
            await NotificationService.markAsRead([], true);
            dispatch(notificationActions.setUnreadCount(0));

            // Update local state in NotificationList
            if (notificationListRef.current) {
                notificationListRef.current.markAllAsReadLocal();
            }

            setOpen(false);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleOpenChange = (visible: boolean) => {
        setOpen(visible);
        if (visible) {
            dispatch(notificationActions.fetchUnreadCount());
        }
    };

    const dropdownContent = (
        <div
            style={{
                width: isMobile ? 'calc(100vw - 32px)' : 420,
                maxWidth: isMobile ? 'calc(100vw - 32px)' : 420,
                backgroundColor: token.colorBgElevated,
                borderRadius: token.borderRadiusLG,
                boxShadow:
                    '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    background: `linear-gradient(135deg, ${token.colorPrimary}08 0%, ${token.colorPrimary}03 100%)`,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BellOutlined
                        style={{ fontSize: isMobile ? 16 : 18, color: token.colorPrimary }}
                    />
                    <Text strong style={{ fontSize: isMobile ? 14 : 16, color: token.colorText }}>
                        {t('notifications.title', 'Thông báo')}
                    </Text>
                    {unreadCount > 0 && (
                        <div
                            style={{
                                backgroundColor: token.colorError,
                                color: '#fff',
                                fontSize: isMobile ? 11 : 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 10,
                                minWidth: 20,
                                textAlign: 'center',
                            }}
                        >
                            {unreadCount}
                        </div>
                    )}
                </div>

                {unreadCount > 0 && (
                    <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={handleMarkAllAsRead}
                        style={{
                            fontSize: isMobile ? 11 : 12,
                            color: token.colorPrimary,
                            fontWeight: 500,
                        }}
                    >
                        {isMobile
                            ? t('notifications.markAll', 'Đọc hết')
                            : t('notifications.markAllAsRead', 'Đánh dấu đã đọc')}
                    </Button>
                )}
            </div>

            {/* Notification List */}
            <NotificationList
                ref={notificationListRef}
                onNotificationClick={(notification) => {
                    console.log('Notification clicked:', notification);
                    dispatch(notificationActions.fetchUnreadCount());
                }}
            />
        </div>
    );

    return (
        <Dropdown
            open={open}
            onOpenChange={handleOpenChange}
            popupRender={() => dropdownContent}
            trigger={['click']}
            placement={isMobile ? 'bottom' : 'bottomRight'}
            align={isMobile ? { offset: [0, 8] } : undefined}
        >
            <Badge
                count={unreadCount}
                offset={[-5, 5]}
                size="small"
                styles={{
                    indicator: {
                        boxShadow: '0 0 0 1px #fff',
                    },
                }}
            >
                <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 18 }} />}
                    style={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
            </Badge>
        </Dropdown>
    );
}
