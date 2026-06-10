'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Carousel, Grid, Typography, Avatar, theme } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import { StarFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Quote } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;
const { useToken } = theme;

const TESTIMONIAL_COUNT = 3;
const COLORS = ['#074695', '#3D8A6B', '#C4883A'];

export default function TestimonialsSection() {
    const { t } = useTranslation();
    const { token } = useToken();
    const screens = Grid.useBreakpoint();
    const isDesktop = !!screens.lg;
    const sectionRef = useRef<HTMLElement>(null);
    const carouselRef = useRef<CarouselRef>(null);
    const [visible, setVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

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

    return (
        <section
            ref={sectionRef}
            style={{
                padding: isDesktop ? '96px 48px' : '64px 20px',
                backgroundColor: 'var(--background)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Floating particles */}
            {visible && Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: i % 2 === 0 ? 4 : 6,
                        height: i % 2 === 0 ? 4 : 6,
                        borderRadius: '50%',
                        backgroundColor: COLORS[i % COLORS.length],
                        opacity: 0.15,
                        top: `${10 + i * 12}%`,
                        left: i % 2 === 0 ? `${5 + i * 10}%` : `${85 - i * 8}%`,
                        animation: `floatParticle ${8 + i * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                    }}
                />
            ))}

            <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
                {/* Floating quote marks */}
                <div
                    style={{
                        position: 'absolute',
                        top: -40,
                        left: isDesktop ? -60 : -20,
                        opacity: 0.08,
                        transform: 'rotate(-15deg)',
                        zIndex: 0,
                    }}
                >
                    <Quote size={isDesktop ? 120 : 80} color="var(--primary)" />
                </div>
                <div
                    style={{
                        position: 'absolute',
                        bottom: -40,
                        right: isDesktop ? -60 : -20,
                        opacity: 0.08,
                        transform: 'rotate(15deg) scaleX(-1)',
                        zIndex: 0,
                    }}
                >
                    <Quote size={isDesktop ? 120 : 80} color="var(--primary)" />
                </div>

                <Title
                    level={2}
                    style={{
                        textAlign: 'center',
                        fontSize: isDesktop ? 36 : 26,
                        fontWeight: 700,
                        marginBottom: isDesktop ? 56 : 36,
                        color: token.colorPrimary,
                        position: 'relative',
                        zIndex: 1,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
                        transition: 'all 0.6s ease',
                    }}
                >
                    {t('landing.testimonials.title')}
                </Title>

                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
                    }}
                >
                    <Carousel
                        ref={carouselRef}
                        autoplay
                        autoplaySpeed={5000}
                        dots
                        dotPosition="bottom"
                        beforeChange={(_, next) => setCurrentSlide(next)}
                        effect="fade"
                    >
                        {Array.from({ length: TESTIMONIAL_COUNT }).map((_, i) => {
                            const isActive = i === currentSlide;
                            return (
                                <div key={i}>
                                    <Card
                                        style={{
                                            maxWidth: 680,
                                            margin: '0 auto',
                                            borderRadius: 20,
                                            border: '2px solid var(--border)',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            background: 'var(--card)',
                                            boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.04)',
                                            transform: isActive ? 'scale(1)' : 'scale(0.98)',
                                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        }}
                                        styles={{ body: { padding: isDesktop ? 48 : 24, position: 'relative', zIndex: 1 } }}
                                    >
                                        {/* Gradient overlay */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}06 0%, transparent 50%)`,
                                                opacity: isActive ? 1 : 0,
                                                transition: 'opacity 0.5s ease',
                                                pointerEvents: 'none',
                                            }}
                                        />

                                        {/* Stars */}
                                        <div style={{ marginBottom: 20 }}>
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <StarFilled
                                                    key={s}
                                                    style={{
                                                        color: '#faad14',
                                                        fontSize: 20,
                                                        marginRight: 6,
                                                        opacity: isActive ? 1 : 0,
                                                        transform: isActive ? 'scale(1) rotate(0)' : 'scale(0) rotate(-180deg)',
                                                        transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${s * 0.1}s`,
                                                        display: 'inline-block',
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <Paragraph
                                            style={{
                                                fontSize: isDesktop ? 18 : 15,
                                                lineHeight: 1.8,
                                                color: 'var(--foreground)',
                                                fontStyle: 'italic',
                                                marginBottom: 32,
                                                fontWeight: 500,
                                                opacity: isActive ? 1 : 0,
                                                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                                                transition: 'all 0.6s ease 0.3s',
                                            }}
                                        >
                                            &ldquo;{t(`landing.testimonials.items.${i}.quote`)}&rdquo;
                                        </Paragraph>

                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 16,
                                                opacity: isActive ? 1 : 0,
                                                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                                                transition: 'all 0.6s ease 0.5s',
                                            }}
                                        >
                                            <Avatar
                                                size={52}
                                                style={{
                                                    backgroundColor: COLORS[i % COLORS.length],
                                                    fontWeight: 700,
                                                    fontSize: 20,
                                                    border: `3px solid ${COLORS[i % COLORS.length]}20`,
                                                    boxShadow: `0 4px 12px ${COLORS[i % COLORS.length]}30`,
                                                }}
                                            >
                                                {t(`landing.testimonials.items.${i}.name`).charAt(0)}
                                            </Avatar>
                                            <div style={{ textAlign: 'left' }}>
                                                <Text strong style={{ display: 'block', color: 'var(--foreground)', fontSize: 16 }}>
                                                    {t(`landing.testimonials.items.${i}.name`)}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                                                    {t(`landing.testimonials.items.${i}.role`)} — {t(`landing.testimonials.items.${i}.company`)}
                                                </Text>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </Carousel>
                </div>
            </div>

            <style jsx global>{`
                @keyframes floatParticle {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-20px) translateX(10px); }
                    50% { transform: translateY(-40px) translateX(-10px); }
                    75% { transform: translateY(-20px) translateX(10px); }
                }
            `}</style>
        </section>
    );
}
