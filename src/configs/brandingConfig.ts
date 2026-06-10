'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandingConfig } from '@/types/AppConfig';
import { BrandingService } from '@/services/BrandingService';

const DEFAULT_CONFIG: BrandingConfig = {
    appName: 'Qwaste',
    companyName: 'IIC 4.0',
    logo: {
        main: '/img/LogoIIC.svg',
        auth: '/img/LogoIIC.svg',
        favicon: '/favicon.ico',
        poweredBy: '/img/auth/power_by.svg',
    },
    colors: {
        primary: '#1890ff',
    },
    footer: {
        copyright: '2024 IIC 4.0. All rights reserved.',
        poweredBy: '/img/LogoEIU.png',
    },
};

let cachedConfig: BrandingConfig | null = null;

export function useBrandingConfig() {
    const [config, setConfig] = useState<BrandingConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadConfig = useCallback(async () => {
        // Return cached if available
        if (cachedConfig) {
            setConfig(cachedConfig);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const brandingConfig = await BrandingService.getBrandingConfig();
            cachedConfig = brandingConfig;
            setConfig(brandingConfig);
            setError(null);
        } catch (err) {
            const error = err as Error;
            console.warn('Failed to load branding config, using default. Error:', error.message);
            setError(error);
            setConfig(DEFAULT_CONFIG);
            cachedConfig = DEFAULT_CONFIG;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    return { config, loading, error };
}

export function getDefaultBrandingConfig(): BrandingConfig {
    return DEFAULT_CONFIG;
}
