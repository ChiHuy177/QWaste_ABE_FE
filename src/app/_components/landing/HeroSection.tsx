'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Grid, Typography } from 'antd';
import { ArrowRightOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Factory, Cpu, Activity, Zap } from 'lucide-react';

const { Title, Paragraph } = Typography;

// Animated factory elements
const FactoryVisualization = () => {
    const [animState, setAnimState] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimState((prev) => (prev + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: 400,
                perspective: 1200,
            }}
        >
            {/* Main factory building - isometric */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '30%',
                    transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Floor */}
                <div
                    style={{
                        width: 280,
                        height: 280,
                        background:
                            'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                        border: '2px solid rgba(255,255,255,0.15)',
                        borderRadius: 16,
                        position: 'relative',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {/* Grid lines */}
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={`h-${i}`}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: `${(i + 1) * 20}%`,
                                height: 1,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                            }}
                        />
                    ))}
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={`v-${i}`}
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${(i + 1) * 20}%`,
                                width: 1,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                            }}
                        />
                    ))}

                    {/* Machines/Units */}
                    {[
                        { x: 20, y: 20, active: animState === 0 },
                        { x: 55, y: 20, active: animState === 1 },
                        { x: 20, y: 55, active: animState === 2 },
                        { x: 55, y: 55, active: animState === 3 },
                    ].map(({ x, y, active }, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                left: `${x}%`,
                                top: `${y}%`,
                                width: 50,
                                height: 50,
                                backgroundColor: active
                                    ? 'rgba(61, 138, 107, 0.3)'
                                    : 'rgba(255,255,255,0.08)',
                                border: `2px solid ${active ? '#3D8A6B' : 'rgba(255,255,255,0.15)'}`,
                                borderRadius: 8,
                                transition: 'all 0.5s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: active ? 'machinePulse 1s ease infinite' : undefined,
                            }}
                        >
                            <Cpu size={20} color={active ? '#3D8A6B' : 'rgba(255,255,255,0.4)'} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating data points */}
            {[
                { Icon: Factory, x: '15%', y: '25%', delay: '0s', color: '#3D8A6B' },
                { Icon: Activity, x: '80%', y: '35%', delay: '0.5s', color: '#074695' },
                { Icon: Zap, x: '25%', y: '70%', delay: '1s', color: '#C4883A' },
            ].map(({ Icon, x, y, delay, color }, idx) => (
                <div
                    key={idx}
                    style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        animation: `floatData 3s ease-in-out ${delay} infinite`,
                    }}
                >
                    <div
                        style={{
                            padding: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            border: `1px solid ${color}40`,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Icon size={18} color={color} />
                    </div>
                </div>
            ))}

            {/* Connection lines */}
            <svg
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                width="100%"
                height="100%"
            >
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(61, 138, 107, 0)" />
                        <stop offset="50%" stopColor="rgba(61, 138, 107, 0.4)" />
                        <stop offset="100%" stopColor="rgba(61, 138, 107, 0)" />
                    </linearGradient>
                </defs>
                <line
                    x1="15%"
                    y1="30%"
                    x2="50%"
                    y2="45%"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="10"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </line>
                <line
                    x1="80%"
                    y1="40%"
                    x2="50%"
                    y2="45%"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-10"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </line>
            </svg>
        </div>
    );
};

export default function HeroSection() {
    const { t } = useTranslation();
    const router = useRouter();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isDesktop) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const rect = heroRef.current.getBoundingClientRect();
            setMousePos({
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isDesktop]);

    return (
        <section
            ref={heroRef}
            id="hero"
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor: '#074695',
                padding: isDesktop ? '120px 48px 80px' : '100px 20px 60px',
            }}
        >
            {/* Animated background particles */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    animation: 'backgroundMove 20s linear infinite',
                }}
            />

            {/* Parallax geometric shapes */}
            <div
                style={{
                    position: 'absolute',
                    top: '15%',
                    right: '10%',
                    width: 180,
                    height: 180,
                    border: '2px solid rgba(255,255,255,0.05)',
                    borderRadius: 20,
                    transform: `rotate(${15 + mousePos.x * 10}deg) translateZ(0)`,
                    transition: 'transform 0.3s ease-out',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '8%',
                    width: 120,
                    height: 120,
                    border: '2px solid rgba(255,255,255,0.04)',
                    borderRadius: 16,
                    transform: `rotate(${-20 + mousePos.x * -8}deg) translateZ(0)`,
                    transition: 'transform 0.3s ease-out',
                    pointerEvents: 'none',
                }}
            />

            {/* Main content */}
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
                    gap: isDesktop ? 80 : 0,
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Left: Content */}
                <div
                    style={{
                        transform: isDesktop ? `translateX(${mousePos.x * -15}px)` : undefined,
                        transition: 'transform 0.3s ease-out',
                    }}
                >
                    <Title
                        level={1}
                        style={{
                            color: '#fff',
                            fontSize: isDesktop ? 56 : 36,
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: 24,
                            animation: 'slideInFromLeft 0.8s ease-out 0.1s both',
                            letterSpacing: -1,
                        }}
                    >
                        {t('landing.hero.title')}
                    </Title>

                    <Paragraph
                        style={{
                            color: 'rgba(255,255,255,0.75)',
                            fontSize: isDesktop ? 18 : 16,
                            lineHeight: 1.7,
                            marginBottom: 40,
                            animation: 'slideInFromLeft 0.8s ease-out 0.2s both',
                        }}
                    >
                        {t('landing.hero.subtitle')}
                    </Paragraph>

                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            flexWrap: 'wrap',
                            animation: 'slideInFromLeft 0.8s ease-out 0.3s both',
                        }}
                    >
                        <Button
                            type="primary"
                            size="large"
                            icon={<ArrowRightOutlined />}
                            onClick={() => router.push('/register')}
                            className="hero-cta-primary"
                            style={{
                                height: 52,
                                paddingInline: 32,
                                fontSize: 16,
                                fontWeight: 600,
                                backgroundColor: '#fff',
                                color: '#074695',
                                border: 'none',
                                borderRadius: 12,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            }}
                        >
                            {t('landing.hero.cta')}
                        </Button>
                        <Button
                            size="large"
                            icon={<PlayCircleOutlined />}
                            onClick={() =>
                                document
                                    .getElementById('preview')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="hero-cta-secondary"
                            style={{
                                height: 52,
                                paddingInline: 32,
                                fontSize: 16,
                                fontWeight: 600,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: 12,
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            {t('landing.hero.ctaSecondary')}
                        </Button>
                    </div>
                </div>

                {/* Right: Animated factory visualization - desktop only */}
                {isDesktop && (
                    <div
                        style={{
                            transform: `translateX(${mousePos.x * 20}px) translateY(${mousePos.y * 20}px)`,
                            transition: 'transform 0.3s ease-out',
                            animation: 'slideInFromRight 1s ease-out 0.4s both',
                        }}
                    >
                        <FactoryVisualization />
                    </div>
                )}
            </div>

            {/* Scroll indicator */}
            <div
                onClick={() =>
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }
                style={{
                    position: 'absolute',
                    bottom: 40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    zIndex: 2,
                    animation: 'fadeIn 1s ease-out 1.5s both',
                }}
            >
                <span
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                    }}
                >
                    Scroll to explore
                </span>
                {/* Animated mouse */}
                <div
                    style={{
                        width: 24,
                        height: 36,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderRadius: 12,
                        position: 'relative',
                        animation: 'bounceDown 2s ease-in-out infinite',
                    }}
                >
                    <div
                        style={{
                            width: 4,
                            height: 8,
                            backgroundColor: 'rgba(255,255,255,0.6)',
                            borderRadius: 2,
                            position: 'absolute',
                            top: 6,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            animation: 'scrollWheel 2s ease-in-out infinite',
                        }}
                    />
                </div>
                {/* Arrow */}
                <div
                    style={{
                        width: 1,
                        height: 20,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '6px solid rgba(255,255,255,0.4)',
                        }}
                    />
                </div>
            </div>

            {/* Global animations */}
            <style jsx global>{`
                @keyframes machinePulse {
                    0%,
                    100% {
                        box-shadow: 0 0 0 0 rgba(61, 138, 107, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(61, 138, 107, 0);
                    }
                }
                @keyframes floatData {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-15px);
                    }
                }
                @keyframes backgroundMove {
                    0% {
                        background-position: 0 0;
                    }
                    100% {
                        background-position: 48px 48px;
                    }
                }
                @keyframes pulse {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.4;
                    }
                }
                @keyframes slideInFromLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .hero-cta-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
                }
                .hero-cta-secondary:hover {
                    background-color: rgba(255, 255, 255, 0.15) !important;
                    border-color: rgba(255, 255, 255, 0.5) !important;
                }
                @keyframes bounceDown {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(8px);
                    }
                }
                @keyframes scrollWheel {
                    0% {
                        opacity: 1;
                        top: 6px;
                    }
                    50% {
                        opacity: 0;
                        top: 16px;
                    }
                    100% {
                        opacity: 0;
                        top: 6px;
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
        </section>
    );
}
