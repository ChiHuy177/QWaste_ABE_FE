'use client';

import { useEffect, useRef, useState } from 'react';
import { Grid, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { X, Check, FileText, ClipboardPen, Calculator, AlertTriangle, Gauge, TrendingUp } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const traditionalItems = [
    { key: 'paperBased', Icon: FileText },
    { key: 'manualTracking', Icon: ClipboardPen },
    { key: 'spreadsheets', Icon: Calculator },
    { key: 'reactive', Icon: AlertTriangle },
];

const qwasteItems = [
    { key: 'realTimeData', Icon: Gauge },
    { key: 'automated', Icon: Check },
    { key: 'aiPowered', Icon: TrendingUp },
    { key: 'predictive', Icon: Check },
];

export default function ComparisonSection() {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="comparison"
            ref={sectionRef}
            style={{
                padding: isDesktop ? '96px 48px' : '64px 20px',
                backgroundColor: 'var(--muted)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 600,
                    height: 600,
                    background: 'radial-gradient(circle, var(--primary)03 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: isDesktop ? 64 : 40 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 16px',
                            borderRadius: 20,
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary)',
                            }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {t('landing.comparison.badge')}
                        </span>
                    </div>

                    <Title
                        level={2}
                        style={{
                            fontSize: isDesktop ? 42 : 28,
                            fontWeight: 800,
                            marginBottom: 16,
                            color: token.colorPrimary,
                            letterSpacing: -0.5,
                        }}
                    >
                        {t('landing.comparison.title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: isDesktop ? 17 : 15,
                            color: 'var(--muted-foreground)',
                            maxWidth: 600,
                            margin: '0 auto',
                        }}
                    >
                        {t('landing.comparison.subtitle')}
                    </Paragraph>
                </div>

                {/* Comparison Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                        gap: 24,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Traditional Management */}
                    <div
                        style={{
                            padding: 32,
                            borderRadius: 20,
                            backgroundColor: 'var(--card)',
                            border: '2px solid var(--border)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Gradient overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(199, 84, 84, 0.03) 0%, transparent 100%)',
                                pointerEvents: 'none',
                            }}
                        />

                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: '#C7545420',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20,
                                }}
                            >
                                <X size={24} color="#C75454" />
                            </div>

                            <Text
                                strong
                                style={{
                                    display: 'block',
                                    fontSize: 24,
                                    marginBottom: 8,
                                    color: 'var(--foreground)',
                                }}
                            >
                                {t('landing.comparison.traditional.title')}
                            </Text>
                            <Paragraph
                                style={{
                                    fontSize: 14,
                                    color: 'var(--muted-foreground)',
                                    marginBottom: 24,
                                }}
                            >
                                {t('landing.comparison.traditional.description')}
                            </Paragraph>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {traditionalItems.map((item, index) => {
                                    const { Icon } = item;
                                    return (
                                        <div
                                            key={item.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                                opacity: visible ? 1 : 0,
                                                transform: visible ? 'translateX(0)' : 'translateX(-20px)',
                                                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1 + 0.3}s`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    minWidth: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    backgroundColor: '#C7545415',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon size={16} color="#C75454" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 15, color: 'var(--foreground)', display: 'block', marginBottom: 4 }}>
                                                    {t(`landing.comparison.traditional.items.${item.key}.title`)}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                                                    {t(`landing.comparison.traditional.items.${item.key}.description`)}
                                                </Text>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Qwaste Smart Management */}
                    <div
                        style={{
                            padding: 32,
                            borderRadius: 20,
                            backgroundColor: 'var(--card)',
                            border: `2px solid ${token.colorPrimary}40`,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: `0 8px 32px ${token.colorPrimary}15`,
                        }}
                    >
                        {/* Gradient overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(135deg, ${token.colorPrimary}08 0%, transparent 100%)`,
                                pointerEvents: 'none',
                            }}
                        />

                        {/* "Recommended" badge */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                padding: '4px 12px',
                                borderRadius: 12,
                                backgroundColor: token.colorPrimary,
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#fff',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                            }}
                        >
                            {t('landing.comparison.qwaste.badge')}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimary}CC 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20,
                                }}
                            >
                                <Check size={24} color="#fff" />
                            </div>

                            <Text
                                strong
                                style={{
                                    display: 'block',
                                    fontSize: 24,
                                    marginBottom: 8,
                                    color: 'var(--foreground)',
                                }}
                            >
                                {t('landing.comparison.qwaste.title')}
                            </Text>
                            <Paragraph
                                style={{
                                    fontSize: 14,
                                    color: 'var(--muted-foreground)',
                                    marginBottom: 24,
                                }}
                            >
                                {t('landing.comparison.qwaste.description')}
                            </Paragraph>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {qwasteItems.map((item, index) => {
                                    const { Icon } = item;
                                    return (
                                        <div
                                            key={item.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 12,
                                                opacity: visible ? 1 : 0,
                                                transform: visible ? 'translateX(0)' : 'translateX(20px)',
                                                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1 + 0.3}s`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    minWidth: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    backgroundColor: `${token.colorPrimary}20`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon size={16} color={token.colorPrimary} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 15, color: 'var(--foreground)', display: 'block', marginBottom: 4 }}>
                                                    {t(`landing.comparison.qwaste.items.${item.key}.title`)}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                                                    {t(`landing.comparison.qwaste.items.${item.key}.description`)}
                                                </Text>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
