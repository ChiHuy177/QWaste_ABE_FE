'use client';

import { useEffect, useRef, useState } from 'react';
import { Grid, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { Cpu, Factory, Database, Wifi, Cloud, Box, Boxes, Network } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const integrationCategories = [
    {
        key: 'cncMachines',
        Icon: Factory,
        color: '#074695',
        gradient: 'linear-gradient(135deg, #074695 0%, #0a5bb5 100%)',
        items: ['fanuc', 'siemens', 'haas', 'mazak'],
    },
    {
        key: 'erpSystems',
        Icon: Database,
        color: '#3D8A6B',
        gradient: 'linear-gradient(135deg, #3D8A6B 0%, #5BA37E 100%)',
        items: ['sap', 'oracle', 'microsoft', 'odoo'],
    },
    {
        key: 'iotDevices',
        Icon: Wifi,
        color: '#C4883A',
        gradient: 'linear-gradient(135deg, #C4883A 0%, #D4A04A 100%)',
        items: ['sensors', 'plc', 'scada', 'actuators'],
    },
    {
        key: 'cloudPlatforms',
        Icon: Cloud,
        color: '#7C3AED',
        gradient: 'linear-gradient(135deg, #7C3AED 0%, #9F67FF 100%)',
        items: ['aws', 'azure', 'gcp', 'alibaba'],
    },
];

interface IntegrationCardProps {
    category: typeof integrationCategories[0];
    index: number;
    isVisible: boolean;
}

const IntegrationCard = ({ category, index, isVisible }: IntegrationCardProps) => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const { Icon, color, gradient } = category;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
            }}
        >
            <div
                style={{
                    padding: 28,
                    borderRadius: 20,
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isHovered
                        ? `0 12px 32px ${color}20`
                        : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                }}
            >
                {/* Background gradient */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: gradient,
                        opacity: isHovered ? 0.05 : 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                    }}
                />

                {/* Icon container */}
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.3s ease',
                    }}
                >
                    <Icon size={32} color="#fff" />
                </div>

                <Text
                    strong
                    style={{
                        display: 'block',
                        fontSize: 20,
                        marginBottom: 12,
                        color: 'var(--foreground)',
                    }}
                >
                    {t(`landing.integrations.categories.${category.key}.title`)}
                </Text>

                <Paragraph
                    style={{
                        fontSize: 14,
                        color: 'var(--muted-foreground)',
                        marginBottom: 20,
                        lineHeight: 1.6,
                    }}
                >
                    {t(`landing.integrations.categories.${category.key}.description`)}
                </Paragraph>

                {/* Integration items */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    {category.items.map((item) => (
                        <div
                            key={item}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: `${color}10`,
                                fontSize: 12,
                                fontWeight: 500,
                                color: color,
                                border: `1px solid ${color}20`,
                            }}
                        >
                            {t(`landing.integrations.categories.${category.key}.items.${item}`)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function IntegrationsSection() {
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
            id="integrations"
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
                    top: '20%',
                    left: '10%',
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, var(--primary)04 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '10%',
                    width: 300,
                    height: 300,
                    background: 'radial-gradient(circle, #3D8A6B08 0%, transparent 70%)',
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
                            {t('landing.integrations.badge')}
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
                        {t('landing.integrations.title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: isDesktop ? 17 : 15,
                            color: 'var(--muted-foreground)',
                            maxWidth: 600,
                            margin: '0 auto',
                        }}
                    >
                        {t('landing.integrations.subtitle')}
                    </Paragraph>
                </div>

                {/* Integration categories grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                        gap: 24,
                        marginBottom: isDesktop ? 64 : 40,
                    }}
                >
                    {integrationCategories.map((category, i) => (
                        <IntegrationCard key={category.key} category={category} index={i} isVisible={visible} />
                    ))}
                </div>

                {/* Additional features */}
                <div
                    style={{
                        padding: isDesktop ? 40 : 28,
                        borderRadius: 20,
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        textAlign: 'center',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <Network size={24} color={token.colorPrimary} />
                        <Text
                            strong
                            style={{
                                fontSize: 20,
                                color: 'var(--foreground)',
                            }}
                        >
                            {t('landing.integrations.apiAccess.title')}
                        </Text>
                    </div>
                    <Paragraph
                        style={{
                            fontSize: 15,
                            color: 'var(--muted-foreground)',
                            maxWidth: 700,
                            margin: '0 auto 20px',
                        }}
                    >
                        {t('landing.integrations.apiAccess.description')}
                    </Paragraph>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 12,
                            justifyContent: 'center',
                        }}
                    >
                        {['restApi', 'webhooks', 'graphql', 'mqtt'].map((item) => (
                            <div
                                key={item}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    backgroundColor: `${token.colorPrimary}10`,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: token.colorPrimary,
                                    border: `1px solid ${token.colorPrimary}30`,
                                }}
                            >
                                {t(`landing.integrations.apiAccess.protocols.${item}`)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
