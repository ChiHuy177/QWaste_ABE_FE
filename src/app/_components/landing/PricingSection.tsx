'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Grid, Row, Typography, theme } from 'antd';
import { CheckCircleFilled, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const plans = [
    { key: 'basic', featured: false, featureCount: 4, color: '#074695' },
    { key: 'pro', featured: true, featureCount: 6, color: '#3D8A6B' },
    { key: 'enterprise', featured: false, featureCount: 6, color: '#C4883A' },
];

interface PricingCardProps {
    plan: typeof plans[0];
    index: number;
    isVisible: boolean;
}

function PricingCard({ plan, index, isVisible }: PricingCardProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
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

    const rotateX = isHovered && isDesktop ? (mousePos.y - 0.5) * -10 : 0;
    const rotateY = isHovered && isDesktop ? (mousePos.x - 0.5) * 10 : 0;

    const card = (
        <div
            ref={cardRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
            style={{
                height: '100%',
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                    ? `translateY(0) ${plan.featured ? 'scale(1.03)' : 'scale(1)'}`
                    : 'translateY(30px) scale(0.97)',
                transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s`,
                perspective: 1000,
            }}
        >
            <Card
                style={{
                    height: '100%',
                    borderRadius: 20,
                    border: plan.featured
                        ? `2px solid ${plan.color}`
                        : `1px solid var(--border)`,
                    boxShadow: plan.featured
                        ? isHovered
                            ? `0 20px 60px ${plan.color}30`
                            : `0 12px 40px ${plan.color}20`
                        : isHovered
                        ? '0 12px 30px rgba(0,0,0,0.08)'
                        : '0 4px 12px rgba(0,0,0,0.04)',
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'translateZ(10px)' : 'translateZ(0)'}`,
                    transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'var(--card)',
                }}
                styles={{ body: { padding: isDesktop ? 32 : 24, position: 'relative', zIndex: 1 } }}
            >
                {/* Gradient overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(135deg, ${plan.color}${plan.featured ? '10' : '06'} 0%, transparent 60%)`,
                        opacity: isHovered ? 1 : plan.featured ? 0.7 : 0,
                        transition: 'opacity 0.4s ease',
                        pointerEvents: 'none',
                    }}
                />

                {/* Dot pattern */}
                {isHovered && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `radial-gradient(circle, ${plan.color}12 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                            opacity: 1,
                            transition: 'opacity 0.4s ease',
                            pointerEvents: 'none',
                        }}
                    />
                )}

                <div style={{ textAlign: 'center', position: 'relative' }}>
                    {/* Featured badge */}
                    {plan.featured && (
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 20,
                                background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}CC 100%)`,
                                marginBottom: 16,
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            <Sparkles size={14} color="#fff" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t('landing.pricing.popular')}
                            </span>
                        </div>
                    )}

                    <Text
                        strong
                        style={{
                            fontSize: 24,
                            display: 'block',
                            marginBottom: 8,
                            color: 'var(--foreground)',
                            fontWeight: 700,
                        }}
                    >
                        {t(`landing.pricing.${plan.key}.name`)}
                    </Text>
                    <Paragraph style={{ color: 'var(--muted-foreground)', fontSize: 14, marginBottom: 20, minHeight: 40 }}>
                        {t(`landing.pricing.${plan.key}.description`)}
                    </Paragraph>
                    <div style={{ marginBottom: 28 }}>
                        <span
                            style={{
                                fontSize: 48,
                                fontWeight: 800,
                                background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}80 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                display: 'inline-block',
                            }}
                        >
                            {t(`landing.pricing.${plan.key}.price`)}
                        </span>
                    </div>
                </div>

                <div style={{ marginBottom: 28, position: 'relative' }}>
                    {Array.from({ length: plan.featureCount }).map((_, fi) => (
                        <div
                            key={fi}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                padding: '10px 0',
                                borderBottom: fi < plan.featureCount - 1 ? '1px solid var(--border)' : undefined,
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                                transition: `all 0.4s ease ${(index + fi) * 0.05}s`,
                            }}
                        >
                            <CheckCircleFilled
                                style={{
                                    color: plan.color,
                                    fontSize: 18,
                                    flexShrink: 0,
                                    marginTop: 2,
                                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'transform 0.3s ease',
                                }}
                            />
                            <Text style={{ fontSize: 14, color: 'var(--foreground)', lineHeight: 1.6, flex: 1 }}>
                                {t(`landing.pricing.${plan.key}.features.${fi}`)}
                            </Text>
                        </div>
                    ))}
                </div>

                <Button
                    type={plan.featured ? 'primary' : 'default'}
                    block
                    size="large"
                    icon={<ArrowRightOutlined />}
                    onClick={() => router.push('/register')}
                    style={{
                        height: 48,
                        fontWeight: 600,
                        borderRadius: 12,
                        fontSize: 15,
                        backgroundColor: plan.featured ? plan.color : undefined,
                        borderColor: plan.featured ? plan.color : undefined,
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: isHovered ? `0 8px 20px ${plan.color}30` : 'none',
                        transition: 'all 0.3s ease',
                    }}
                >
                    {t(`landing.pricing.${plan.key}.cta`)}
                </Button>

                {/* Shine effect */}
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
            </Card>
        </div>
    );

    if (plan.featured) {
        return card;
    }
    return card;
}

export default function PricingSection() {
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
            id="pricing"
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
                    left: '-10%',
                    width: 500,
                    height: 500,
                    background: 'radial-gradient(circle, var(--primary)04 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-10%',
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, var(--primary)03 0%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
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
                            Flexible Plans
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
                        {t('landing.pricing.title')}
                    </Title>
                    <Paragraph
                        style={{
                            fontSize: isDesktop ? 17 : 15,
                            color: 'var(--muted-foreground)',
                            maxWidth: 600,
                            margin: '0 auto',
                        }}
                    >
                        {t('landing.pricing.subtitle')}
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]} align="stretch">
                    {plans.map((plan, i) => (
                        <Col xs={24} lg={8} key={plan.key}>
                            <PricingCard plan={plan} index={i} isVisible={visible} />
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}
