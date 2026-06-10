'use client';

import { useState } from 'react';
import { Grid, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { Factory, ClipboardList, Clock, TrendingDown } from 'lucide-react';
import { useCountUp } from './useCountUp';

const { Title } = Typography;
const { useToken } = theme;

const metrics = [
    { key: 'factories', target: 50, suffix: '+', Icon: Factory, color: '#074695' },
    { key: 'tasks', target: 10000, suffix: '+', Icon: ClipboardList, color: '#3D8A6B' },
    { key: 'uptime', target: 99.9, suffix: '%', decimal: true, Icon: Clock, color: '#C4883A' },
    { key: 'wasteReduction', target: 35, suffix: '%', Icon: TrendingDown, color: '#7C3AED' },
];

function MetricCard({
    metricKey,
    target,
    suffix,
    decimal,
    Icon,
    color,
    index,
}: {
    metricKey: string;
    target: number;
    suffix: string;
    decimal?: boolean;
    Icon: React.ElementType;
    color: string;
    index: number;
}) {
    const { t } = useTranslation();
    const { token } = useToken();
    const { ref, value, isVisible } = useCountUp(decimal ? Math.round(target * 10) : target, 2000);
    const [isHovered, setIsHovered] = useState(false);

    const displayValue = decimal ? (value / 10).toFixed(1) : value.toLocaleString();
    const progress = value / (decimal ? Math.round(target * 10) : target);

    return (
        <div
            ref={ref}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                textAlign: 'center',
                padding: 32,
                position: 'relative',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
            }}
        >
            {/* Circular progress indicator */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                {/* Background circle */}
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="4"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 35}`}
                        strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress)}`}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 0.5s ease',
                            filter: isHovered ? `drop-shadow(0 0 8px ${color}60)` : 'none',
                        }}
                    />
                </svg>

                {/* Icon container */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            backgroundColor: isHovered ? `${color}20` : `${color}14`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    >
                        <Icon size={28} color={color} style={{ transition: 'all 0.3s ease' }} />

                        {/* Pulsing rings */}
                        {isHovered && (
                            <>
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: -4,
                                        borderRadius: '50%',
                                        border: `2px solid ${color}40`,
                                        animation: 'metricPulse 1.5s ease-out infinite',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: -4,
                                        borderRadius: '50%',
                                        border: `2px solid ${color}30`,
                                        animation: 'metricPulse 1.5s ease-out 0.5s infinite',
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div
                style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: token.colorPrimary,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.1,
                    marginBottom: 12,
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {displayValue}
                <span
                    style={{
                        fontSize: 32,
                        background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 800,
                    }}
                >
                    {suffix}
                </span>
            </div>
            <div
                style={{
                    fontSize: 14,
                    color: 'var(--muted-foreground)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}
            >
                {t(`landing.metrics.${metricKey}`)}
            </div>

            {/* Hover shine effect */}
            {isHovered && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at center, ${color}08 0%, transparent 70%)`,
                        pointerEvents: 'none',
                        animation: 'metricShine 1.5s ease infinite',
                    }}
                />
            )}
        </div>
    );
}

export default function MetricsSection() {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;

    return (
        <section
            style={{
                padding: isDesktop ? '80px 48px' : '56px 20px',
                backgroundColor: 'var(--card)',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
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
                    width: '80%',
                    height: '80%',
                    background: 'radial-gradient(circle, var(--primary)03 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
                <Title
                    level={3}
                    style={{
                        textAlign: 'center',
                        fontSize: isDesktop ? 28 : 22,
                        fontWeight: 700,
                        marginBottom: isDesktop ? 48 : 32,
                        color: token.colorPrimary,
                    }}
                >
                    {t('landing.metrics.title')}
                </Title>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop
                            ? 'repeat(4, 1fr)'
                            : screens.sm ? 'repeat(2, 1fr)' : '1fr',
                        gap: isDesktop ? 24 : 16,
                    }}
                >
                    {metrics.map((m, i) => (
                        <MetricCard
                            key={m.key}
                            metricKey={m.key}
                            target={m.target}
                            suffix={m.suffix}
                            decimal={m.decimal}
                            Icon={m.Icon}
                            color={m.color}
                            index={i}
                        />
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes metricPulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                @keyframes metricShine {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </section>
    );
}
