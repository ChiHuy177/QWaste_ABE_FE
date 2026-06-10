'use client';

import { Notification } from '@/types/Notification';
import { theme, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead?: (id: number) => void;
    onClick?: (notification: Notification) => void;
}

export default function NotificationItem({
    notification,
    onMarkAsRead,
    onClick,
}: NotificationItemProps) {
    const { token } = theme.useToken();

    const handleClick = () => {
        if (!notification.isRead && onMarkAsRead) {
            onMarkAsRead(notification.notificationId);
        }
        if (onClick) {
            onClick(notification);
        }
    };


    return (
        <div
            onClick={handleClick}
            style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: notification.isRead
                    ? 'transparent'
                    : `${token.colorPrimary}08`,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = notification.isRead
                    ? token.colorBgTextHover
                    : `${token.colorPrimary}12`;
                e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.isRead
                    ? 'transparent'
                    : `${token.colorPrimary}08`;
                e.currentTarget.style.transform = 'translateX(0)';
            }}
        >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Unread Indicator */}
                {!notification.isRead && (
                    <div
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: token.colorPrimary,
                            marginTop: 6,
                            flexShrink: 0,
                            boxShadow: `0 0 0 3px ${token.colorPrimary}20`,
                        }}
                    />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title Row */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 8,
                            gap: 8,
                        }}
                    >
                        <Text
                            strong={!notification.isRead}
                            style={{
                                fontSize: 15,
                                fontWeight: notification.isRead ? 500 : 600,
                                color: notification.isRead ? token.colorText : token.colorTextHeading,
                                lineHeight: 1.5,
                                flex: 1,
                            }}
                        >
                            {notification.title}
                        </Text>

                        {notification.isRead && (
                            <CheckCircleOutlined
                                style={{
                                    fontSize: 16,
                                    color: token.colorSuccess,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                    </div>

                    {/* Content */}
                    <Text
                        style={{
                            fontSize: 13,
                            color: token.colorTextSecondary,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.6,
                            marginBottom: 10,
                        }}
                    >
                        {notification.content}
                    </Text>

                    {/* Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockCircleOutlined
                            style={{
                                fontSize: 12,
                                color: token.colorTextTertiary,
                            }}
                        />
                        <Text
                            style={{
                                fontSize: 12,
                                color: token.colorTextTertiary,
                                fontWeight: 500,
                            }}
                        >
                            {dayjs(notification.createdAt).fromNow()}
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
