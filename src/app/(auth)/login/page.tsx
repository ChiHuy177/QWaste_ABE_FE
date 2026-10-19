'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginLayout } from '@/features/auth/login';
import { useEffect, useState } from 'react';
import { AuthStore } from '@/stores/AuthStore';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setIsClient(true);
        AuthStore.clear();
    }, []);

    usePageTitle(t('common.login'));

    useEffect(() => {
        if (searchParams.get('logout') === 'true') {
            AuthStore.clear();
            // Preserve returnUrl when clearing logout param
            const returnUrl = searchParams.get('returnUrl');
            const newUrl = returnUrl
                ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
                : '/login';
            router.replace(newUrl);
        }
    }, [searchParams, router]);

    if (!isClient) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            </div>
        );
    }

    return <LoginLayout />;
}
