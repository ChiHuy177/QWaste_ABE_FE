'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Grid, Typography } from 'antd';
import { ArrowRightOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, TrendingUp } from 'lucide-react';

const { Title, Paragraph } = Typography;

export default function CTASection() {
    const { t } = useTranslation();
    const router = useRouter();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.2 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            style={{
                padding: isDesktop ? '96px 48px' : '64px 20px',
                background: 'linear-gradient(135deg, #074695 0%, #0a5bb5 50%, #1a75d2 100%)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated grid background */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    animation: 'ctaGridMove 20s linear infinite',
                    opacity: 0.5,
                }}
            />

            {/* Decorative circles */}
            <div
                style={{
                    position: 'absolute',
                    top: '-30%',
                    left: '-10%',
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    animation: 'ctaFloat 15s ease-in-out infinite',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-5%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    animation: 'ctaFloat 12s ease-in-out infinite reverse',
                }}
            />

            {/* Floating particles */}
            {visible && Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
                        height: i % 3 === 0 ? 4 : i % 2 === 0 ? 3 : 2,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `ctaParticleFloat ${10 + Math.random() * 10}s ease-in-out ${Math.random() * 5}s infinite`,
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Floating icons */}
            {visible && [
                { Icon: Sparkles, top: '15%', left: '10%', delay: '0s', size: 32 },
                { Icon: Zap, top: '70%', left: '15%', delay: '1s', size: 28 },
                { Icon: TrendingUp, top: '25%', right: '12%', delay: '0.5s', size: 30 },
                { Icon: Sparkles, top: '65%', right: '10%', delay: '1.5s', size: 26 },
            ].map(({ Icon, ...style }, idx) => (
                <div
                    key={idx}
                    style={{
                        position: 'absolute',
                        ...style,
                        opacity: 0.15,
                        animation: `ctaIconFloat 8s ease-in-out ${style.delay} infinite`,
                        pointerEvents: 'none',
                    }}
                >
                    <Icon size={style.size} color="#fff" />
                </div>
            ))}

            <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 16px',
                        borderRadius: 20,
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        marginBottom: 20,
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
                            backgroundColor: '#3D8A6B',
                            animation: 'pulse 2s ease-in-out infinite',
                        }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Ready to Transform
                    </span>
                </div>

                <Title
                    level={2}
                    style={{
                        color: '#fff',
                        fontSize: isDesktop ? 48 : 32,
                        fontWeight: 800,
                        marginBottom: 20,
                        letterSpacing: -0.5,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
                        transition: 'all 0.6s ease 0.1s',
                    }}
                >
                    {t('landing.cta.title')}
                </Title>
                <Paragraph
                    style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: isDesktop ? 18 : 15,
                        lineHeight: 1.7,
                        marginBottom: 40,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
                        transition: 'all 0.6s ease 0.2s',
                    }}
                >
                    {t('landing.cta.subtitle')}
                </Paragraph>
                <div
                    style={{
                        display: 'flex',
                        gap: 16,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
                        transition: 'all 0.6s ease 0.3s',
                    }}
                >
                    <Button
                        size="large"
                        icon={<ArrowRightOutlined />}
                        onClick={() => router.push('/register')}
                        className="cta-primary-button"
                        style={{
                            height: 52,
                            paddingInline: 36,
                            fontSize: 16,
                            fontWeight: 600,
                            backgroundColor: '#fff',
                            color: '#074695',
                            border: 'none',
                            borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}
                    >
                        {t('landing.cta.primary')}
                    </Button>
                    <Button
                        size="large"
                        icon={<PhoneOutlined />}
                        className="cta-secondary-button"
                        style={{
                            height: 52,
                            paddingInline: 36,
                            fontSize: 16,
                            fontWeight: 600,
                            backgroundColor: 'transparent',
                            color: '#fff',
                            border: '2px solid rgba(255,255,255,0.5)',
                            borderRadius: 12,
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        {t('landing.cta.secondary')}
                    </Button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes ctaGridMove {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50px); }
                }
                @keyframes ctaFloat {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, 30px); }
                }
                @keyframes ctaParticleFloat {
                    0%, 100% { transform: translate(0, 0); opacity: 0.4; }
                    25% { transform: translate(20px, -30px); opacity: 0.8; }
                    50% { transform: translate(-15px, -60px); opacity: 0.4; }
                    75% { transform: translate(10px, -30px); opacity: 0.8; }
                }
                @keyframes ctaIconFloat {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-15px) rotate(5deg); }
                    50% { transform: translateY(-30px) rotate(-5deg); }
                    75% { transform: translateY(-15px) rotate(3deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                .cta-primary-button:hover {
                    transform: translateY(-3px) scale(1.02) !important;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.2) !important;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                }

                .cta-secondary-button:hover {
                    background-color: rgba(255,255,255,0.1) !important;
                    border-color: rgba(255,255,255,0.8) !important;
                    transform: translateY(-3px) scale(1.02) !important;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                }
            `}</style>
        </section>
    );
}
