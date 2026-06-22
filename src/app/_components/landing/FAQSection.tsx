'use client';

import { useEffect, useRef, useState } from 'react';
import { Collapse, Grid, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Plus, Minus } from 'lucide-react';

const { Title } = Typography;
const { useToken } = theme;

const FAQ_COUNT = 6;

export default function FAQSection() {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    const [activeKeys, setActiveKeys] = useState<string[]>([]);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const items = Array.from({ length: FAQ_COUNT }).map((_, i) => {
        const isActive = activeKeys.includes(String(i));
        return {
            key: String(i),
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: isActive ? 'var(--primary)' : 'var(--background)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                        }}
                    >
                        {isActive ? (
                            <Minus size={18} color="#fff" />
                        ) : (
                            <Plus size={18} color="var(--muted-foreground)" />
                        )}
                    </div>
                    <span
                        style={{
                            fontWeight: 600,
                            fontSize: 16,
                            color: isActive ? 'var(--foreground)' : 'var(--foreground)',
                            transition: 'color 0.3s ease',
                        }}
                    >
                        {t(`landing.faq.items.${i}.question`)}
                    </span>
                </div>
            ),
            children: (
                <div
                    style={{
                        paddingLeft: 48,
                        paddingRight: 12,
                        paddingBottom: 8,
                    }}
                >
                    <p
                        style={{
                            color: 'var(--muted-foreground)',
                            lineHeight: 1.8,
                            margin: 0,
                            fontSize: 15,
                        }}
                    >
                        {t(`landing.faq.items.${i}.answer`)}
                    </p>
                </div>
            ),
        };
    });

    return (
        <section
            id="faq"
            ref={sectionRef}
            style={{
                padding: isDesktop ? '96px 48px' : '64px 20px',
                backgroundColor: 'var(--card)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '-5%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, var(--primary)04 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Floating question marks */}
            {visible && [
                { top: '15%', left: '8%', size: 40, delay: '0s' },
                { top: '60%', left: '5%', size: 30, delay: '1s' },
                { top: '30%', right: '10%', size: 35, delay: '0.5s' },
                { top: '75%', right: '8%', size: 28, delay: '1.5s' },
            ].map((pos, idx) => (
                <div
                    key={idx}
                    style={{
                        position: 'absolute',
                        ...pos,
                        opacity: 0.06,
                        animation: `floatQuestion 6s ease-in-out ${pos.delay} infinite`,
                        pointerEvents: 'none',
                    }}
                >
                    <HelpCircle size={pos.size} color="var(--primary)" />
                </div>
            ))}

            <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: isDesktop ? 56 : 36 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 16px',
                            borderRadius: 20,
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            marginBottom: 16,
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(-20px)',
                            transition: 'all 0.6s ease',
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
                            Frequently Asked
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
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(-20px)',
                            transition: 'all 0.6s ease 0.1s',
                        }}
                    >
                        {t('landing.faq.title')}
                    </Title>
                </div>

                <div
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                    }}
                >
                    <Collapse
                        accordion
                        items={items}
                        expandIconPlacement="end"
                        onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                        }}
                        expandIcon={() => null}
                        size="large"
                        className="faq-collapse"
                    />
                </div>
            </div>

            <style jsx global>{`
                @keyframes floatQuestion {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-15px) rotate(5deg); }
                    50% { transform: translateY(-30px) rotate(-5deg); }
                    75% { transform: translateY(-15px) rotate(3deg); }
                }

                .faq-collapse .ant-collapse-item {
                    border: 1px solid var(--border) !important;
                    border-radius: 16px !important;
                    margin-bottom: 16px !important;
                    background: var(--background) !important;
                    overflow: hidden !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                .faq-collapse .ant-collapse-item:hover {
                    border-color: var(--primary) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
                    transform: translateY(-2px);
                }

                .faq-collapse .ant-collapse-item-active {
                    border-color: var(--primary) !important;
                    box-shadow: 0 8px 24px rgba(7, 70, 149, 0.12) !important;
                }

                .faq-collapse .ant-collapse-header {
                    padding: 20px 24px !important;
                    align-items: center !important;
                }

                .faq-collapse .ant-collapse-content {
                    border-top: none !important;
                    background: transparent !important;
                }

                .faq-collapse .ant-collapse-content-box {
                    padding: 0 24px 20px 24px !important;
                }
            `}</style>
        </section>
    );
}
