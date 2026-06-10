'use client';

import { useEffect, useRef, useState } from 'react';
import { Grid, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { Cable, Eye, Brain, TrendingUp, ArrowRight } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const steps = [
    { key: 'connect', Icon: Cable, color: '#074695' },
    { key: 'monitor', Icon: Eye, color: '#3D8A6B' },
    { key: 'optimize', Icon: Brain, color: '#C4883A' },
    { key: 'scale', Icon: TrendingUp, color: '#7C3AED' },
];

export default function HowItWorksSection() {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

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

    // Auto-cycle through steps
    useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [visible]);

    return (
        <section
            id="how-it-works"
            ref={sectionRef}
            style={{
                padding: isDesktop ? '120px 48px' : '80px 20px',
                backgroundColor: 'var(--card)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0)',
                    backgroundSize: '40px 40px',
                    opacity: 0.3,
                }}
            />

            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: isDesktop ? 80 : 50 }}>
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
                            Simple Process
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
                        {t('landing.howItWorks.title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: isDesktop ? 17 : 15,
                            color: 'var(--muted-foreground)',
                        }}
                    >
                        {t('landing.howItWorks.subtitle')}
                    </Paragraph>
                </div>

                {/* Steps */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : '1fr',
                        gap: isDesktop ? 0 : 40,
                        position: 'relative',
                    }}
                >
                        {steps.map(({ key, Icon, color }, i) => {
                        const isActive = i === activeStep;
                        const isPast = i < activeStep;

                        return (
                            <div
                                key={key}
                                onClick={() => setActiveStep(i)}
                                style={{
                                    textAlign: 'center',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'translateY(0)' : 'translateY(30px)',
                                    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s`,
                                }}
                            >
                                {/* Step number badge */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: -8,
                                        right: '35%',
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        backgroundColor: isActive || isPast ? color : 'var(--muted)',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '3px solid var(--card)',
                                        transition: 'all 0.3s ease',
                                        zIndex: 2,
                                    }}
                                >
                                    {i + 1}
                                </div>

                                {/* Icon container */}
                                <div
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 24,
                                        backgroundColor: isActive ? `${color}14` : 'var(--background)',
                                        border: `2px solid ${isActive || isPast ? color : 'var(--border)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        position: 'relative',
                                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                >
                                    <Icon
                                        size={36}
                                        color={isActive || isPast ? color : 'var(--muted-foreground)'}
                                        style={{
                                            transition: 'all 0.3s ease',
                                        }}
                                    />

                                    {/* Pulsing ring */}
                                    {isActive && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: -4,
                                                borderRadius: 26,
                                                border: `2px solid ${color}40`,
                                                animation: 'stepPulse 2s ease-out infinite',
                                            }}
                                        />
                                    )}

                                    {/* Animated particles */}
                                    {isActive &&
                                        Array.from({ length: 4 }).map((_, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    position: 'absolute',
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: '50%',
                                                    backgroundColor: color,
                                                    opacity: 0,
                                                    animation: `particleBurst 1.5s ease-out ${idx * 0.2}s infinite`,
                                                    transform: `rotate(${idx * 90}deg) translateX(50px)`,
                                                }}
                                            />
                                        ))}
                                </div>

                                <Text
                                    strong
                                    style={{
                                        display: 'block',
                                        fontSize: 20,
                                        marginBottom: 10,
                                        color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                                        transition: 'color 0.3s ease',
                                    }}
                                >
                                    {t(`landing.howItWorks.${key}.title`)}
                                </Text>
                                <Paragraph
                                    style={{
                                        fontSize: 14,
                                        color: 'var(--muted-foreground)',
                                        marginBottom: 0,
                                        lineHeight: 1.6,
                                        maxWidth: 220,
                                        margin: '0 auto',
                                        opacity: isActive ? 1 : 0.6,
                                        transition: 'opacity 0.3s ease',
                                    }}
                                >
                                    {t(`landing.howItWorks.${key}.description`)}
                                </Paragraph>

                                {/* Arrow - desktop only */}
                                {isDesktop && i < steps.length - 1 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 50,
                                            right: -20,
                                            opacity: isPast ? 1 : 0.3,
                                            transition: 'opacity 0.3s ease',
                                        }}
                                    >
                                        <ArrowRight size={20} color={isPast ? color : 'var(--muted-foreground)'} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step indicator dots - mobile */}
                {!isDesktop && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 8,
                            marginTop: 40,
                        }}
                    >
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveStep(i)}
                                style={{
                                    width: i === activeStep ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: i === activeStep ? 'var(--primary)' : 'var(--border)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes stepPulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                @keyframes particleBurst {
                    0% { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(0); }
                    50% { opacity: 1; }
                    100% { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(50px); }
                }
            `}</style>
        </section>
    );
}
