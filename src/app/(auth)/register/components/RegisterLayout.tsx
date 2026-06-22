'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Layout, Grid, theme, Card, ConfigProvider } from 'antd';
import { lightTheme } from '@/configs/antdTheme';
import RegisterForm from './RegisterForm';
import LanguageSwitcher from '@/components/shared/header/LanguageSwitcher';

const { Content } = Layout;
const { useBreakpoint } = Grid;

const IMAGE_CONFIG = Object.freeze({
    logo: {
        src: '/img/LogoIIC.svg',
        alt: 'IDEA Logo',
        priority: true,
    },
    poweredBy: {
        src: '/img/auth/power_by.svg',
        alt: 'Powered by IIC 4.0',
    },
    background: {
        src: '/img/auth/bg_Qwaste_v2.png',
        alt: 'QWaste Background',
    },
});

const LogoSection = React.memo(({ isLargeScreen }: { isLargeScreen: boolean }) => {
    const screens = useBreakpoint();
    const logoConfig = IMAGE_CONFIG.logo;
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
                    src={logoConfig.src}
                    alt={logoConfig.alt}
                    width={logoSize.width}
                    height={logoSize.height}
                    style={{
                        objectFit: 'contain',
                        userSelect: 'none',
                    }}
                    priority={logoConfig.priority}
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
                src={logoConfig.src}
                alt={logoConfig.alt}
                width={logoSize.width}
                height={logoSize.height}
                style={{
                    objectFit: 'contain',
                    userSelect: 'none',
                }}
                priority={logoConfig.priority}
            />
        </div>
    );
});

LogoSection.displayName = 'LogoSection';

const PoweredBySection = React.memo(() => {
    const poweredByConfig = IMAGE_CONFIG.poweredBy;

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
                src={poweredByConfig.src}
                alt={poweredByConfig.alt}
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

const RegisterLayout = React.memo(() => {
    const screens = useBreakpoint();

    const isLargeScreen = !!screens.lg;

    const containerPadding = useMemo(() => {
        if (screens.xl) return '48px 150px';
        if (screens.lg) return '40px 60px';
        if (screens.sm) return 32;
        return 24;
    }, [screens.xl, screens.lg, screens.sm]);

    return (
        <ConfigProvider theme={{ ...lightTheme, algorithm: theme.defaultAlgorithm }}>
        <Layout
            style={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#fff',
            }}
        >
            {/* SVG Background - Fixed position, full viewport */}
            {isLargeScreen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100vh',
                        zIndex: 1,
                        overflow: 'hidden',
                    }}
                >
                    <Image
                        src={IMAGE_CONFIG.background.src}
                        alt={IMAGE_CONFIG.background.alt}
                        fill
                        sizes="75vw"
                        style={{
                            objectFit: 'cover',
                        }}
                        priority
                    />

                    {/* Gradient fade - smooth transition to white */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 150,
                            height: '100%',
                            background: 'linear-gradient(to right, transparent 0%, #fff 100%)',
                            zIndex: 2,
                            pointerEvents: 'none',
                        }}
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

            {/* Right Panel - Register Form */}
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

                {/* Main Content Container */}
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

                    {/* Register Form Card */}
                    <Card
                        style={{
                            borderRadius: 12,
                            boxShadow: isLargeScreen
                                ? '0 8px 32px rgba(0, 0, 0, 0.1)'
                                : '0 4px 16px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #f0f0f0',
                            backgroundColor: '#fff',
                            maxHeight: 'calc(100vh - 360px)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        styles={{
                            body: {
                                padding: screens.sm ? 28 : 20,
                                overflow: 'auto',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#d9d9d9 transparent',
                            },
                        }}
                    >
                        <RegisterForm />
                    </Card>

                    {/* Powered By */}
                    <PoweredBySection />
                </div>
            </Content>
        </Layout>
        </ConfigProvider>
    );
});

RegisterLayout.displayName = 'RegisterLayout';

export default RegisterLayout;
