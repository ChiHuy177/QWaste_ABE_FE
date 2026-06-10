'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Layout, Grid, theme, Card } from 'antd';
import LoginForm from './LoginForm';
import LanguageSwitcher from '@/components/shared/header/LanguageSwitcher';
import { useBrandingConfig } from '@/configs/brandingConfig';

const { Content } = Layout;
const { useBreakpoint } = Grid;

const LogoSection = React.memo(({ isLargeScreen }: { isLargeScreen: boolean }) => {
    const screens = useBreakpoint();
    const { config } = useBrandingConfig();
    const { token } = theme.useToken();

    const logoSize = useMemo(() => {
        if (screens.md) {
            return { width: 220, height: 78 };
        }
        return { width: 170, height: 60 };
    }, [screens.md]);

    // Mobile: Logo với glassmorphism effect
    if (!isLargeScreen) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // Glassmorphism - frosted glass effect
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)', // Safari support
                    borderRadius: token.borderRadiusLG,
                    padding: '20px 24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
            >
                <Image
                    src={config.logo.auth}
                    alt={config.appName}
                    width={logoSize.width}
                    height={logoSize.height}
                    style={{
                        objectFit: 'contain',
                        userSelect: 'none',
                    }}
                    priority
                />
            </div>
        );
    }

    // Desktop: Logo không cần container
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Image
                src={config.logo.auth}
                alt={config.appName}
                width={logoSize.width}
                height={logoSize.height}
                style={{
                    objectFit: 'contain',
                    userSelect: 'none',
                }}
                priority
            />
        </div>
    );
});
LogoSection.displayName = 'LogoSection';

const PoweredBySection = React.memo(() => {
    const { config } = useBrandingConfig();

    if (!config.logo.poweredBy) return null;

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 12,
            }}
        >
            <Image
                src={config.logo.poweredBy}
                alt={`Powered by ${config.companyName}`}
                width={130}
                height={32}
                style={{
                    objectFit: 'contain',
                }}
            />
        </div>
    );
});
PoweredBySection.displayName = 'PoweredBySection';

const LoginLayout = React.memo(() => {
    const screens = useBreakpoint();
    const { token } = theme.useToken();

    const isLargeScreen = !!screens.lg;

    const containerPadding = useMemo(() => {
        if (screens.xl) return '48px 150px';
        if (screens.lg) return '40px 60px';
        if (screens.sm) return 32;
        return 24;
    }, [screens.xl, screens.lg, screens.sm]);

    return (
        <Layout
            style={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#fff',
            }}
        >
            {/* SVG Background - 3/4 left */}
            {isLargeScreen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        bottom: 0,
                        zIndex: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Image
                        src="/img/auth/bg_Qwaste_v2.png"
                        alt="Background"
                        fill
                        sizes="75vw"
                        style={{
                            objectFit: 'cover',
                        }}
                        priority
                    />
                </div>
            )}

            {/* Mobile: Simple gradient background */}
            {!isLargeScreen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 200,
                        background:
                            'linear-gradient(135deg, #0a1628 0%, #0d47a1 50%, #1565c0 100%)',
                        zIndex: 1,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -40,
                            left: 0,
                            right: 0,
                            height: 80,
                            background: '#fff',
                            borderRadius: '50% 50% 0 0',
                        }}
                    />
                </div>
            )}

            {/* Right Panel - Login Form */}
            <Content
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isLargeScreen ? 'flex-end' : 'center',
                    padding: containerPadding,
                    minHeight: '100vh',
                    zIndex: 3,
                }}
            >
                {/* Language Switcher */}
                <div
                    style={{
                        position: 'absolute',
                        top: screens.sm ? 24 : 16,
                        right: screens.sm ? 24 : 16,
                        zIndex: 10,
                    }}
                >
                    <LanguageSwitcher />
                </div>

                {/* Main Content Container - positioned in the white curved area */}
                <div
                    style={{
                        width: '25%',
                        minWidth: 320,
                        maxWidth: 420,
                        marginRight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 28,
                    }}
                >
                    {/* Logo */}
                    <LogoSection isLargeScreen={isLargeScreen} />

                    {/* Login Form Card */}
                    <Card
                        style={{
                            borderRadius: token.borderRadiusLG,
                            boxShadow: isLargeScreen
                                ? '0 8px 32px rgba(0, 0, 0, 0.08)'
                                : '0 4px 16px rgba(0, 0, 0, 0.08)',
                            border: `1px solid ${token.colorBorderSecondary}`,
                            backgroundColor: '#fff',
                        }}
                        styles={{
                            body: {
                                padding: screens.sm ? 32 : 24,
                            },
                        }}
                    >
                        <LoginForm />
                    </Card>

                    {/* Powered By */}
                    <PoweredBySection />
                </div>
            </Content>
        </Layout>
    );
});

LoginLayout.displayName = 'LoginLayout';

export default LoginLayout;
