'use client';
import { theme } from 'antd';
import { useEffect, useState } from 'react';
import { Layout, Button, Space, Divider, Grid, Skeleton } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { Clock } from './Clock';
import { NotificationDropdown } from '../notification';
import { useWebSocketNotification } from '@/hooks/useWebSocketNotification';
import Image from 'next/image';
import { useBrandingConfig } from '@/configs/brandingConfig';

const { Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

// LogoEIU.png is 3750x1307 (~2.87:1); keep that ratio inside the 64px header.
const EIU_LOGO_WIDTH = 115;
const EIU_LOGO_HEIGHT = 40;

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    useWebSocketNotification();

    const { user: authUser, isLoading } = useAuth();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [greeting, setGreeting] = useState('');
    const screens = useBreakpoint();
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { config } = useBrandingConfig();

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

    const showGreeting = screens.md;

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
                            orientation="vertical"
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

                {screens.md && config.logo.logoEIU && (
                    <>
                        <Divider orientation="vertical" style={{ height: 32, margin: '0 4px' }} />
                        <Image
                            src={config.logo.logoEIU}
                            alt={config.companyName}
                            width={EIU_LOGO_WIDTH}
                            height={EIU_LOGO_HEIGHT}
                            draggable={false}
                            style={{
                                objectFit: 'contain',
                                flexShrink: 0,
                                userSelect: 'none',
                            }}
                        />
                    </>
                )}
            </Space>
        </AntHeader>
    );
}
