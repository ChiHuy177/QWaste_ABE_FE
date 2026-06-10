'use client';

import { useEffect, useRef, useState } from 'react';
import { Grid, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Monitor, Activity, Zap, TrendingUp, AlertCircle } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

export default function DashboardPreviewSection() {
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    const [tick, setTick] = useState(0);

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

    // Animate data changes
    useEffect(() => {
        if (!visible) return;
        const interval = setInterval(() => setTick((t) => t + 1), 2000);
        return () => clearInterval(interval);
    }, [visible]);

    // Generate random chart bars
    const chartBars = Array.from({ length: 24 }, (_, i) => ({
        height: 30 + Math.random() * 60,
        active: i === (tick % 24),
    }));

    // Animated metrics
    const metrics = [
        {
            Icon: Monitor,
            label: 'Machines Running',
            value: 24 + (tick % 4),
            total: 28,
            color: '#3D8A6B',
            trend: '+2',
        },
        {
            Icon: Activity,
            label: 'Efficiency',
            value: (93 + (tick % 5)).toFixed(1),
            unit: '%',
            color: '#074695',
            trend: '+1.2%',
        },
        {
            Icon: Zap,
            label: 'Power Usage',
            value: (1240 + tick * 3).toLocaleString(),
            unit: 'kWh',
            color: '#C4883A',
            trend: 'Live',
        },
    ];

    // Machine status grid
    const machineGrid = Array.from({ length: 12 }, (_, i) => ({
        id: `M${String(i + 1).padStart(2, '0')}`,
        status: i % 4 === (tick % 4) ? 'active' : i % 5 === 0 ? 'idle' : 'running',
    }));

    return (
        <section
            id="preview"
            ref={sectionRef}
            style={{
                padding: isDesktop ? '120px 48px' : '80px 20px',
                backgroundColor: '#074695',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    animation: 'gridMove 20s linear infinite',
                }}
            />

            <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: isDesktop ? 64 : 40 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 16px',
                            borderRadius: 20,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            marginBottom: 20,
                            backdropFilter: 'blur(10px)',
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
                            Live Production Dashboard
                        </span>
                    </div>

                    <Title
                        level={2}
                        style={{
                            fontSize: isDesktop ? 42 : 28,
                            fontWeight: 800,
                            marginBottom: 16,
                            color: '#fff',
                            letterSpacing: -0.5,
                        }}
                    >
                        {t('landing.preview.title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: isDesktop ? 17 : 15,
                            color: 'rgba(255,255,255,0.75)',
                            maxWidth: 600,
                            margin: '0 auto',
                        }}
                    >
                        {t('landing.preview.subtitle')}
                    </Paragraph>
                </div>

                {/* Dashboard mockup */}
                <div
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
                        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {/* Main dashboard container */}
                    <div
                        style={{
                            borderRadius: 24,
                            border: '1px solid rgba(255,255,255,0.15)',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(20px)',
                            overflow: 'hidden',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
                        }}
                    >
                        {/* Window controls */}
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57', opacity: 0.6 }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#febc2e', opacity: 0.6 }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28c840', opacity: 0.6 }} />
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.6)',
                                }}
                            >
                                app.qwaste.io/dashboard
                            </div>
                        </div>

                        {/* Dashboard content */}
                        <div style={{ padding: isDesktop ? 32 : 20 }}>
                            {/* Top metrics row */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr',
                                    gap: 16,
                                    marginBottom: 24,
                                }}
                            >
                                {metrics.map(({ Icon, label, value, unit, total, color, trend }) => (
                                    <div
                                        key={label}
                                        style={{
                                            padding: 20,
                                            borderRadius: 16,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    backgroundColor: `${color}20`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon size={20} color={color} />
                                            </div>
                                            <div
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 12,
                                                    backgroundColor: 'rgba(61, 138, 107, 0.2)',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: '#3D8A6B',
                                                }}
                                            >
                                                {trend}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                                            {value}
                                            {unit}
                                            {total && <span style={{ fontSize: 16, opacity: 0.5 }}>/{total}</span>}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart area */}
                            <div
                                style={{
                                    height: isDesktop ? 200 : 140,
                                    borderRadius: 16,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: 20,
                                    marginBottom: 20,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                                        Production Output (24h)
                                    </Text>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#3D8A6B' }} />
                                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Active</Text>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: isDesktop ? 8 : 4, height: isDesktop ? 120 : 80 }}>
                                    {chartBars.map((bar, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: `${bar.height}%`,
                                                borderRadius: 4,
                                                backgroundColor: bar.active ? '#3D8A6B' : 'rgba(255,255,255,0.15)',
                                                transition: 'all 0.5s ease',
                                                transform: bar.active ? 'translateY(-4px)' : 'translateY(0)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Machine status grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
                                {machineGrid.map((machine) => (
                                    <div
                                        key={machine.id}
                                        style={{
                                            padding: 12,
                                            borderRadius: 10,
                                            background: 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${
                                                machine.status === 'active'
                                                    ? '#3D8A6B40'
                                                    : machine.status === 'running'
                                                    ? 'rgba(255,255,255,0.08)'
                                                    : 'rgba(255,255,255,0.04)'
                                            }`,
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                                            {machine.id}
                                        </div>
                                        <div
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                backgroundColor:
                                                    machine.status === 'active'
                                                        ? '#3D8A6B'
                                                        : machine.status === 'running'
                                                        ? '#074695'
                                                        : '#6B6B6B',
                                                animation: machine.status === 'active' ? 'pulse 1s ease-in-out infinite' : undefined,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes gridMove {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(40px); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </section>
    );
}
