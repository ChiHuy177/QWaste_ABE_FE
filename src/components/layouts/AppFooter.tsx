'use client';

import React from 'react';
import Image from 'next/image';
import { Layout, theme } from 'antd';
import { useTheme } from '@/hooks/useTheme';
import { useBrandingConfig } from '@/configs/brandingConfig';

const { Footer: AntFooter } = Layout;

// power_by.svg is 137.99 x 38.98; keep that ratio so the wordmark never squashes.
const LOGO_WIDTH = 142;
const LOGO_HEIGHT = 40;

export function AppFooter() {
    const { token } = theme.useToken();
    const { resolvedTheme } = useTheme();
    const { config } = useBrandingConfig();

    const isDark = resolvedTheme === 'dark';
    // Same pair the auth pages use, so dashboard and login show one mark.
    const logoSrc = (isDark && config.logo.poweredByDark) || config.logo.poweredBy;
    if (!logoSrc) return null;

    return (
        <AntFooter
            suppressHydrationWarning
            style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                backgroundColor: token.colorBgContainer,
                borderTop: isDark ? '1px solid #424242' : '1px solid #f0f0f0',
                lineHeight: 'normal',
            }}
        >
            <Image
                src={logoSrc}
                alt={`Powered by ${config.companyName}`}
                width={LOGO_WIDTH}
                height={LOGO_HEIGHT}
                style={{
                    objectFit: 'contain',
                    userSelect: 'none',
                }}
            />
        </AntFooter>
    );
}

export default AppFooter;
