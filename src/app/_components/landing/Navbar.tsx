'use client';

import { useState } from 'react';
import { Button, Drawer, Grid, Space } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';
import LanguageSwitcher from '@/components/shared/header/LanguageSwitcher';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useScrollSpy } from './useScrollSpy';

const NAV_SECTIONS = ['features', 'how-it-works', 'pricing', 'faq'];

export default function Navbar() {
    const { t } = useTranslation();
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const screens = Grid.useBreakpoint();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const activeId = useScrollSpy(NAV_SECTIONS, 80);

    const isDesktop = !!screens.lg;

    const navLinks = [
        { id: 'features', label: t('landing.nav.features') },
        { id: 'how-it-works', label: t('landing.nav.howItWorks') },
        { id: 'pricing', label: t('landing.nav.pricing') },
        { id: 'faq', label: t('landing.nav.faq') },
    ];

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setDrawerOpen(false);
    };

    const logoSrc = resolvedTheme === 'dark' ? '/qwaste-w.png' : '/qwaste.png';

    return (
        <>
            <header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isDesktop ? '0 48px' : '0 16px',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
            >
                {/* Logo */}
                <div
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <Image
                        src={logoSrc}
                        alt="Qwaste"
                        width={120}
                        height={36}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>

                {/* Desktop nav links */}
                {isDesktop && (
                    <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
                                onClick={() => scrollTo(link.id)}
                                style={{
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: activeId === link.id
                                        ? 'var(--primary)'
                                        : 'var(--foreground)',
                                    borderBottom: activeId === link.id
                                        ? '2px solid var(--primary)'
                                        : '2px solid transparent',
                                    paddingBottom: 4,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                )}

                {/* Right side: theme, lang, auth buttons */}
                <Space size={isDesktop ? 12 : 8}>
                    <ThemeToggle />
                    <LanguageSwitcher />
                    {isDesktop ? (
                        <>
                            <Button type="text" onClick={() => router.push('/login')}>
                                {t('landing.nav.login')}
                            </Button>
                            <Button type="primary" onClick={() => router.push('/register')}>
                                {t('landing.nav.getStarted')}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            onClick={() => setDrawerOpen(true)}
                        />
                    )}
                </Space>
            </header>

            {/* Mobile drawer */}
            <Drawer
                title={null}
                placement="right"
                width={280}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                closable={false}
                extra={
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={() => setDrawerOpen(false)}
                    />
                }
                styles={{ body: { padding: '24px 16px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {navLinks.map((link) => (
                        <Button
                            key={link.id}
                            type="text"
                            block
                            onClick={() => scrollTo(link.id)}
                            style={{
                                textAlign: 'left',
                                fontWeight: activeId === link.id ? 600 : 400,
                                color: activeId === link.id
                                    ? 'var(--primary)'
                                    : undefined,
                            }}
                        >
                            {link.label}
                        </Button>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />
                    <Button block onClick={() => { router.push('/login'); setDrawerOpen(false); }}>
                        {t('landing.nav.login')}
                    </Button>
                    <Button
                        type="primary"
                        block
                        onClick={() => { router.push('/register'); setDrawerOpen(false); }}
                    >
                        {t('landing.nav.getStarted')}
                    </Button>
                </div>
            </Drawer>
        </>
    );
}
