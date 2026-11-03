'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Dropdown, Skeleton } from 'antd';
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { AuthStore } from '@/stores/AuthStore';

// 250px sider minus the wrapper, button and avatar boxes leaves ~160px for the text.
const TEXT_MAX_WIDTH = 160;
const ROW_HEIGHT = 48;

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

export function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
    const user = AuthStore.getUsername();
    const { logout, user: authUser, isLoading } = useAuth();
    const { resolvedTheme } = useTheme();
    const router = useRouter();

    const isDark = resolvedTheme === 'dark';
    const borderColor = isDark ? '#424242' : '#f0f0f0';
    const secondaryColor = isDark ? 'rgba(255,255,255,0.65)' : '#666';

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'user-info',
            label: (
                <div style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {authUser?.fullname || 'User 1'}
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: isDark ? 'rgba(255,255,255,0.45)' : '#666',
                            marginTop: 4,
                        }}
                    >
                        {authUser?.email || 'user@example.com'}
                    </div>
                </div>
            ),
            disabled: true,
        },
        { type: 'divider' },
        {
            key: 'settings',
            label: 'Settings',
            icon: <SettingOutlined />,
            onClick: () => router.push('/admin/setting'),
        },
        { type: 'divider' },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: logout,
            danger: true,
        },
    ];

    const wrapperStyle: React.CSSProperties = {
        flexShrink: 0,
        borderTop: `1px solid ${borderColor}`,
        padding: collapsed ? 8 : '8px 12px',
    };

    const rowLayout: React.CSSProperties = {
        height: ROW_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 8,
    };

    if (isLoading) {
        return (
            <div style={wrapperStyle} suppressHydrationWarning>
                <div style={rowLayout}>
                    <Skeleton.Avatar active size={32} />
                    {!collapsed && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                minWidth: 0,
                            }}
                        >
                            <Skeleton.Input
                                active
                                size="small"
                                style={{ width: 130, height: 14 }}
                            />
                            <Skeleton.Input
                                active
                                size="small"
                                style={{ width: 110, height: 12 }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const avatar = !authUser?.preferences?.avatarUrl ? (
        <Avatar
            size={32}
            style={{
                backgroundColor: '#1677ff',
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
            }}
        >
            {getInitials(user || 'User 1')}
        </Avatar>
    ) : (
        <Avatar size={32} src={authUser.preferences.avatarUrl} />
    );

    const ellipsis: React.CSSProperties = {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: TEXT_MAX_WIDTH,
    };

    return (
        <div style={wrapperStyle} suppressHydrationWarning>
            {/* Anchored at the sider's bottom, so the menu opens upward. */}
            <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
                <Button
                    type="text"
                    style={{ ...rowLayout, width: '100%', padding: collapsed ? 0 : '0 8px' }}
                >
                    {avatar}
                    {!collapsed && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    lineHeight: 1.2,
                                    ...ellipsis,
                                }}
                            >
                                {authUser?.fullname || 'User 1'}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: secondaryColor,
                                    lineHeight: 1.2,
                                    ...ellipsis,
                                }}
                            >
                                {authUser?.email || 'user@example.com'}
                            </div>
                        </div>
                    )}
                </Button>
            </Dropdown>
        </div>
    );
}

export default SidebarUserMenu;
