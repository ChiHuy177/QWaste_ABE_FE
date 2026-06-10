'use client';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useEffect } from 'react';

const HistoryPage = () => {
    const { t } = useTranslation();
    usePageTitle(t('pageTitle.history'));

    useEffect(() => {});

    return <div>History Page</div>;
};

export default HistoryPage;
