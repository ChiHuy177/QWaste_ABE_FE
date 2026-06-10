'use client';

import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

const { Title } = Typography;

const logos = [
    { src: '/img/LogoIIC.svg', alt: 'IIC 4.0', width: 120, height: 40 },
    { src: '/img/LogoEIU.png', alt: 'EIU', width: 120, height: 40 },
    { src: '/img/LogoIDea.svg', alt: 'IDea', width: 120, height: 40 },
    { src: '/iic4.0.svg', alt: 'IIC', width: 120, height: 40 },
];

// Repeat enough times to fill viewport + seamless loop
const repeatedLogos = [...logos, ...logos, ...logos, ...logos, ...logos];

export default function TrustedBySection() {
    const { t } = useTranslation();

    // Width of one set: 4 logos * (120px + 80px gap) = ~800px
    // We need 2 full sets for seamless scroll, so animate by 1 set width
    const singleSetWidth = logos.length * (120 + 80);

    return (
        <section
            style={{
                padding: '48px 0',
                backgroundColor: 'var(--background)',
                overflow: 'hidden',
            }}
        >
            <Title
                level={5}
                style={{
                    textAlign: 'center',
                    color: 'var(--muted-foreground)',
                    fontWeight: 500,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    fontSize: 13,
                    marginBottom: 32,
                }}
            >
                {t('landing.trustedBy.title')}
            </Title>

            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    overflow: 'hidden',
                    maskImage:
                        'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                    WebkitMaskImage:
                        'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 80,
                        alignItems: 'center',
                        width: 'max-content',
                        animation: `logoScroll 20s linear infinite`,
                    }}
                >
                    {repeatedLogos.map((logo, i) => (
                        <div
                            key={i}
                            style={{
                                flexShrink: 0,
                                opacity: 0.5,
                                filter: 'grayscale(100%)',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.filter = 'grayscale(0%)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.5';
                                e.currentTarget.style.filter = 'grayscale(100%)';
                            }}
                        >
                            <Image
                                src={logo.src}
                                alt={logo.alt}
                                width={logo.width}
                                height={logo.height}
                                style={{ objectFit: 'contain', height: 40, width: 'auto' }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes logoScroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-${singleSetWidth}px);
                    }
                }
            `}</style>
        </section>
    );
}
