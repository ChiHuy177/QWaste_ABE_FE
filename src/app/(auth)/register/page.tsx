'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import RegisterLayout from './components/RegisterLayout';
import { useEffect, useState } from 'react';
import { AuthStore } from '@/stores/AuthStore';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        setIsClient(true);
    }, []);

    usePageTitle(t('common.register'));

    // NOTE: Disabled redirect check to allow OTP verification flow
    // User will be auto-redirected after successful OTP verification in RegisterForm
    // useEffect(() => {
    //     if (AuthStore.isAuthenticated()) {
    //         router.replace('/admin/space-monitoring');
    //     }
    // }, [router]);

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

    return <RegisterLayout />;
}
