'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Layout, Menu, theme, Grid, Drawer } from 'antd';
import Image from 'next/image';
import { Header } from '../shared/header/Header';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { getMenuItems } from '@/configs/navigation/menuItems';
import { useError } from '@/contexts/ErrorContext';
import { useAbility } from '@/contexts/AbilityContext';
import { useBrandingConfig } from '@/configs/brandingConfig';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export function AppLayoutWithHeader({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const pathname = usePathname();
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isDark = resolvedTheme === 'dark';
    const { error403, clearError403 } = useError();
    const error403PathnameRef = React.useRef<string | null>(null);
    const { config } = useBrandingConfig();

    useEffect(() => {
        if (error403 && !error403PathnameRef.current) {
            error403PathnameRef.current = pathname;
        } else if (!error403) {
            error403PathnameRef.current = null;
        }
    }, [error403, pathname]);

    useEffect(() => {
        if (error403 && error403PathnameRef.current && pathname !== error403PathnameRef.current) {
            clearError403();
        }
    }, [pathname, error403, clearError403]);

    useEffect(() => {
        if (error403) {
            const prevTitle = document.title;
            document.title = t('forbidden403.title');
            return () => {
                document.title = prevTitle;
            };
        }
    }, [error403, t]);

    const {
        token: { borderRadiusLG, colorBgLayout },
    } = theme.useToken();

    const isMobile = !screens.xl;

    useEffect(() => {
        if (!isMobile) {
            setMobileDrawerOpen(false);

            if (!screens.lg) {
                setCollapsed(true);
            } else {
                setCollapsed(false);
            }
        }
    }, [screens.lg, screens.md, isMobile]);

    const ability = useAbility();
    const menuItems = getMenuItems(t, ability);

    const handleMenuClick = (e: { key: string }) => {
        if (isMobile) {
            setMobileDrawerOpen(false);
        } else if (!screens.lg) {
            setCollapsed(true);
        }
    };

    const handleToggleSidebar = () => {
        if (isMobile) {
            setMobileDrawerOpen(!mobileDrawerOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };

    const menuContent = (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 0',
                    borderBottom: isDark ? '1px solid #424242' : '1px solid #f0f0f0',
                    flexShrink: 0,
                }}
            >
                <Image
                    src={config.logo.main}
                    alt={config.appName}
                    width={collapsed && !isMobile ? 40 : 180}
                    height={collapsed && !isMobile ? 40 : 80}
                    fetchPriority="high"
                    priority={true}
                    style={{
                        transition: 'all 0.3s',
                        borderRadius: '5px',
                    }}
                />
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[pathname]}
                    defaultOpenKeys={['categories']}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{
                        padding: collapsed && !isMobile ? '0 8px' : '0',
                        border: 'none',
                    }}
                />
            </div>
        </div>
    );

    return (
        <Layout style={{ minHeight: '100vh' }} suppressHydrationWarning>
            <Sider
                suppressHydrationWarning
                width={250}
                trigger={null}
                collapsible
                collapsed={collapsed}
                theme="light"
                className="responsive-sider"
                style={{
                    borderRight: isDark ? '1px solid #424242' : '1px solid #f0f0f0',
                    height: '100vh',
                }}
            >
                {menuContent}
            </Sider>

            <Drawer
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                styles={{
                    body: { padding: 0 },
                }}
                size={300}
                closable={false}
            >
                {menuContent}
            </Drawer>

            <Layout
                suppressHydrationWarning
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <Header onToggleSidebar={handleToggleSidebar} />
                <Content
                    suppressHydrationWarning
                    style={{
                        flex: 1,
                        padding: isMobile ? 16 : 24,
                        minHeight: 0,
                        overflow: 'auto',
                        background: colorBgLayout,
                        borderRadius: borderRadiusLG,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {error403 ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '100%',
                            }}
                        >
                            <div
                                style={{
                                    textAlign: 'center',
                                    maxWidth: '500px',
                                    padding: '24px',
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: '32px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            backgroundColor: token.colorErrorBg,
                                            filter: 'blur(30px)',
                                            opacity: 0.3,
                                            animation:
                                                'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '96px',
                                            height: '96px',
                                            borderRadius: '50%',
                                            backgroundColor: token.colorErrorBg,
                                            border: `2px solid ${token.colorErrorBorder} `,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <svg
                                            width="48"
                                            height="48"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={token.colorError}
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <h1
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        marginBottom: '16px',
                                        color: token.colorText,
                                        letterSpacing: '-0.025em',
                                    }}
                                >
                                    {t('forbidden403.title')}
                                </h1>

                                <p
                                    style={{
                                        fontSize: '16px',
                                        color: token.colorTextSecondary,
                                        lineHeight: '1.6',
                                        margin: 0,
                                    }}
                                >
                                    {t('forbidden403.description')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </Content>
            </Layout>
        </Layout>
    );
}

export default AppLayoutWithHeader;
