'use client';
import { theme } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Button, Dropdown, Avatar, Space, Divider, Grid, Skeleton } from 'antd';
import { MenuOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { AuthStore } from '@/stores/AuthStore';
import { useTranslation } from 'react-i18next';
import { Clock } from './Clock';
import { NotificationDropdown } from '../notification';
import { useWebSocketNotification } from '@/hooks/useWebSocketNotification';
import Image from 'next/image';

const { Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    useWebSocketNotification();

    const user = AuthStore.getUsername();
    const { logout, user: authUser, isLoading } = useAuth();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [greeting, setGreeting] = useState('');
    const router = useRouter();
    const screens = useBreakpoint();
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
        setMounted(true);
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return t('header.greetings.morning');
            if (hour >= 12 && hour < 18) return t('header.greetings.afternoon');
            return t('header.greetings.evening');
        };
        setGreeting(getGreeting());
    }, [t]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

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

    const showGreeting = screens.md;
    const showUserName = screens.sm;

    return (
        <AntHeader
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                width: '100%',
                height: 64,
                padding: screens.xs ? '0 8px' : '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: token.colorBgContainer,
                borderBottom: isDark ? '1px solid #424242' : '1px solid #f0f0f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                lineHeight: 'normal',
            }}
        >
            <Space
                size={screens.xs ? 'small' : 'middle'}
                style={{
                    minWidth: 0,
                    flex: 1,
                    height: '100%',
                    overflow: 'hidden',
                }}
            >
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={onToggleSidebar}
                    style={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                    }}
                />

                <Image
                    src="/qwaste.png"
                    alt={t('sidebar.logo.alt')}
                    width={screens.md ? 150 : 100}
                    height={screens.md ? 60 : 60}
                    draggable={false}
                    style={{
                        transition: 'all 0.3s',
                        flexShrink: 0,
                        objectFit: 'contain',
                        borderRadius: '5px',
                    }}
                    onError={(e) => {
                        console.log('Logo failed to load:', e);
                        e.currentTarget.style.display = 'none';
                    }}
                />

                {/* {showDivider && (
                    <Divider
                        type="vertical"
                        style={{
                            height: 24,
                            margin: '0 8px',
                        }}
                    />
                )} */}

                {showGreeting && (
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        {isLoading || !mounted ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{ width: 120, height: 16 }}
                                />
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{ width: 160, height: 14 }}
                                />
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>
                                    {greeting}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: isDark ? 'rgba(255,255,255,0.65)' : '#666',
                                        marginTop: 2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t('header.greetings.welcome')},{' '}
                                    {authUser?.fullname?.split(' ').at(-1) || 'User'}
                                </div>
                            </>
                        )}
                    </div>
                )}
                {screens.md && (
                    <>
                        <Divider
                            type="vertical"
                            style={{
                                height: 32,
                                margin: '0 12px',
                            }}
                        />
                        <Clock />
                    </>
                )}
            </Space>

            <Space size={screens.xs ? 'small' : 'middle'}>
                <NotificationDropdown />
                <ThemeToggle />
                <LanguageSwitcher />

                {isLoading ? (
                    <div
                        style={{
                            height: 40,
                            padding: showUserName ? '0 12px' : '0 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: showUserName ? 8 : 0,
                            border: isDark ? '1px solid #424242' : '1px solid #f0f0f0',
                            borderRadius: 6,
                            flexShrink: 0,
                        }}
                    >
                        <Skeleton.Avatar active size={32} />
                        {showUserName && (
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
                                    style={{ width: screens.lg ? 120 : 80, height: 14 }}
                                />
                                <Skeleton.Input
                                    active
                                    size="small"
                                    style={{ width: screens.lg ? 100 : 60, height: 12 }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button
                            type="text"
                            style={{
                                height: 40,
                                padding: showUserName ? '0 12px' : '0 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: showUserName ? 8 : 0,
                                border: isDark ? '1px solid #424242' : '1px solid #f0f0f0',
                                flexShrink: 0,
                            }}
                        >
                            {!authUser?.preferences?.avatarUrl ? (
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
                            )}

                            {showUserName && (
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
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: screens.lg ? 120 : 80,
                                        }}
                                    >
                                        {authUser?.fullname || 'User 1'}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: isDark ? 'rgba(255,255,255,0.65)' : '#666',
                                            lineHeight: 1.2,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: screens.lg ? 120 : 80,
                                        }}
                                    >
                                        {authUser?.email || 'user@example.com'}
                                    </div>
                                </div>
                            )}
                        </Button>
                    </Dropdown>
                )}
            </Space>
        </AntHeader>
    );
}
