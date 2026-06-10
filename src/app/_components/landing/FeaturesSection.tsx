'use client';

import { useEffect, useRef, useState } from 'react';
import { Grid, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    Monitor,
    ClipboardList,
    ShieldCheck,
    Zap,
    Users,
    Lock,
    Brain,
    BarChart3,
} from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const features = [
    { key: 'machineMonitoring', Icon: Monitor, color: '#074695', gradient: 'linear-gradient(135deg, #074695 0%, #0a5bb5 100%)' },
    { key: 'productionManagement', Icon: ClipboardList, color: '#3D8A6B', gradient: 'linear-gradient(135deg, #3D8A6B 0%, #5BA37E 100%)' },
    { key: 'qualityControl', Icon: ShieldCheck, color: '#C4883A', gradient: 'linear-gradient(135deg, #C4883A 0%, #D4A04A 100%)' },
    { key: 'energyMonitoring', Icon: Zap, color: '#C75454', gradient: 'linear-gradient(135deg, #C75454 0%, #D76A6A 100%)' },
    { key: 'staffManagement', Icon: Users, color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)' },
    { key: 'accessControl', Icon: Lock, color: '#0891B2', gradient: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)' },
    { key: 'aiOptimization', Icon: Brain, color: '#DB2777', gradient: 'linear-gradient(135deg, #DB2777 0%, #F472B6 100%)' },
    { key: 'analytics', Icon: BarChart3, color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)' },
];

interface FeatureCardProps {
    feature: typeof features[0];
    index: number;
    isVisible: boolean;
}

const FeatureCard = ({ feature, index, isVisible }: FeatureCardProps) => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        });
    };

    const { Icon, color, gradient } = feature;
    const rotateX = isHovered ? (mousePos.y - 0.5) * -15 : 0;
    const rotateY = isHovered ? (mousePos.x - 0.5) * 15 : 0;

    return (
        <div
            ref={cardRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s`,
                perspective: 1000,
            }}
        >
            <div
                style={{
                    height: '100%',
                    padding: 28,
                    borderRadius: 20,
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'translateZ(10px)' : 'translateZ(0)'}`,
                    transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                    boxShadow: isHovered
                        ? '0 20px 40px rgba(0,0,0,0.12)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                }}
            >
                {/* Animated gradient overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: gradient,
                        opacity: isHovered ? 0.06 : 0,
                        transition: 'opacity 0.4s ease',
                        pointerEvents: 'none',
                    }}
                />

                {/* Dot pattern */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(circle, ${color}10 1px, transparent 1px)`,
                        backgroundSize: '16px 16px',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.4s ease',
                        pointerEvents: 'none',
                    }}
                />

                {/* Icon container */}
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        position: 'relative',
                        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <Icon size={28} color="#fff" />

                    {/* Pulsing ring */}
                    {isHovered && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: -4,
                                borderRadius: 18,
                                border: `2px solid ${color}40`,
                                animation: 'featurePulse 1.5s ease-out infinite',
                            }}
                        />
                    )}
                </div>

                <Text
                    strong
                    style={{
                        display: 'block',
                        fontSize: 18,
                        marginBottom: 10,
                        color: 'var(--foreground)',
                        position: 'relative',
                    }}
                >
                    {t(`landing.features.${feature.key}.title`)}
                </Text>
                <Paragraph
                    style={{
                        fontSize: 14,
                        color: 'var(--muted-foreground)',
                        marginBottom: 0,
                        lineHeight: 1.6,
                        position: 'relative',
                    }}
                >
                    {t(`landing.features.${feature.key}.description`)}
                </Paragraph>

                {/* Shine effect on hover */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: isHovered ? '100%' : '-100%',
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        transform: 'skewX(-20deg)',
                        transition: 'left 0.6s ease',
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </div>
    );
};

export default function FeaturesSection() {
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
            id="features"
            ref={sectionRef}
            style={{
                padding: isDesktop ? '96px 48px' : '64px 20px',
                backgroundColor: 'var(--background)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '5%',
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, var(--primary)04 0%, transparent 70%)',
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
                            Platform Capabilities
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
                        {t('landing.features.title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: isDesktop ? 17 : 15,
                            color: 'var(--muted-foreground)',
                            maxWidth: 600,
                            margin: '0 auto',
                        }}
                    >
                        {t('landing.features.subtitle')}
                    </Paragraph>
                </div>

                {/* Feature cards grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : screens.sm ? 'repeat(2, 1fr)' : '1fr',
                        gap: 24,
                    }}
                >
                    {features.map((feature, i) => (
                        <FeatureCard key={feature.key} feature={feature} index={i} isVisible={visible} />
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes featurePulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.3); opacity: 0; }
                }
            `}</style>
        </section>
    );
}
