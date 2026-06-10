'use client';

import { useState } from 'react';
import { Grid, Typography, Divider } from 'antd';
import { GithubOutlined, LinkedinOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';

const { Text, Paragraph } = Typography;

const linkGroups = ['product', 'resources', 'company', 'legal'] as const;

const linkKeys: Record<string, string[]> = {
    product: ['features', 'pricing', 'demo', 'changelog'],
    resources: ['docs', 'api', 'guides', 'blog'],
    company: ['about', 'careers', 'contact', 'partners'],
    legal: ['privacy', 'terms', 'cookies'],
};

const socialIcons = [
    { Icon: GithubOutlined, color: '#24292e', hoverColor: '#4078c0' },
    { Icon: LinkedinOutlined, color: '#0077b5', hoverColor: '#006097' },
    { Icon: MailOutlined, color: '#ea4335', hoverColor: '#d93025' },
];

function SocialLinks() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div style={{ display: 'flex', gap: 12 }}>
            {socialIcons.map(({ Icon, color, hoverColor }, idx) => (
                <a
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: hoveredIndex === idx ? `${color}14` : 'var(--background)',
                        border: `1px solid ${hoveredIndex === idx ? color : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: hoveredIndex === idx ? color : 'var(--muted-foreground)',
                        cursor: 'pointer',
                        transform: hoveredIndex === idx ? 'translateY(-3px)' : 'translateY(0)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: hoveredIndex === idx ? `0 4px 12px ${color}20` : 'none',
                    }}
                >
                    <Icon style={{ fontSize: 18 }} />
                </a>
            ))}
        </div>
    );
}

function FooterLink({ group, linkKey }: { group: string; linkKey: string }) {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <a
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                fontSize: 14,
                color: isHovered ? 'var(--primary)' : 'var(--muted-foreground)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'inline-block',
                paddingLeft: isHovered ? 8 : 0,
            }}
        >
            {isHovered && (
                <span
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                    }}
                />
            )}
            {t(`landing.footer.${group}.${linkKey}`)}
        </a>
    );
}

export default function FooterSection() {
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const { resolvedTheme } = useTheme();
    const isDesktop = !!screens.lg;

    const logoSrc = resolvedTheme === 'dark' ? '/qwaste-w.png' : '/qwaste.png';

    return (
        <footer
            style={{
                padding: isDesktop ? '64px 48px 24px' : '48px 20px 20px',
                backgroundColor: 'var(--card)',
                borderTop: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle gradient decoration */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, var(--primary)40, transparent)',
                    pointerEvents: 'none',
                }}
            />
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Top: logo + link columns */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? '1.5fr repeat(4, 1fr)' : screens.sm ? 'repeat(2, 1fr)' : '1fr',
                        gap: isDesktop ? 48 : 32,
                        marginBottom: 48,
                    }}
                >
                    {/* Brand column */}
                    <div>
                        <Image
                            src={logoSrc}
                            alt="Qwaste"
                            width={120}
                            height={36}
                            style={{ objectFit: 'contain', marginBottom: 16 }}
                        />
                        <Paragraph
                            style={{
                                color: 'var(--muted-foreground)',
                                fontSize: 13,
                                lineHeight: 1.6,
                                maxWidth: 260,
                                marginBottom: 16,
                            }}
                        >
                            {t('landing.footer.description')}
                        </Paragraph>
                        <SocialLinks />
                    </div>

                    {/* Link columns */}
                    {linkGroups.map((group) => (
                        <div key={group}>
                            <Text
                                strong
                                style={{
                                    display: 'block',
                                    marginBottom: 16,
                                    fontSize: 14,
                                    color: 'var(--foreground)',
                                }}
                            >
                                {t(`landing.footer.${group}.title`)}
                            </Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {linkKeys[group].map((key) => (
                                    <FooterLink key={key} group={group} linkKey={key} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <Divider style={{ margin: 0, borderColor: 'var(--border)' }} />

                {/* Bottom bar */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 0',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <Text style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                        &copy; {new Date().getFullYear()} {t('landing.footer.copyright')}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                            {t('landing.footer.poweredBy')}
                        </Text>
                        <Image
                            src="/img/LogoIIC.svg"
                            alt="IIC 4.0"
                            width={48}
                            height={20}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}
