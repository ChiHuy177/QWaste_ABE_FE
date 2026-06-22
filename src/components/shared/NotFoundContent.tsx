'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Skeleton, Card } from 'antd';
import {
    SettingOutlined,
    WarningOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import './NotFoundContent.css';

const { Title, Paragraph } = Typography;

export function NotFoundContent() {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const getDashboardRoute = () => {
        if (!isAuthenticated || !user) {
            return '/login';
        }

        const firstRole = user.roles?.[0]?.toLowerCase();

        switch (firstRole) {
            case 'admin':
            case 'director':
            case 'client':
                return '/admin/space-monitoring';
            default:
                return '/';
        }
    };

    const getButtonText = () => {
        if (!isAuthenticated || !user) {
            return t('notFound.buttons.goToLogin');
        }

        const firstRole = user.roles?.[0]?.toLowerCase();

        switch (firstRole) {
            case 'admin':
                return t('notFound.buttons.goToAdminDashboard');
            case 'director':
            case 'client':
                return t('notFound.buttons.goToDashboard');
            default:
                return t('notFound.buttons.goToDashboard');
        }
    };

    // Show loading state while auth is being determined
    if (!isClient) {
        return (
            <div className="not-found-loading">
                <Card style={{ maxWidth: 400, width: '100%', margin: '0 16px' }}>
                    <Skeleton active avatar={{ size: 64, shape: 'square' }} paragraph={{ rows: 3 }} />
                </Card>
            </div>
        );
    }

    return (
        <div className="not-found-container">
            {/* Blueprint Grid Background */}
            <div className="blueprint-grid" />

            {/* Technical Lines SVG */}
            <svg className="technical-lines" style={{ color: '#94a3b8' }} xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M100,0 V200 H300"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                />
                <path
                    d="M0,500 H200 V700"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                />
                <circle
                    cx="85%"
                    cy="20%"
                    r="100"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="8 4"
                    strokeWidth="1"
                />
                <line
                    x1="85%" x2="85%" y1="10%" y2="30%"
                    stroke="currentColor"
                    strokeWidth="0.5"
                />
                <line
                    x1="75%" x2="95%" y1="20%" y2="20%"
                    stroke="currentColor"
                    strokeWidth="0.5"
                />
            </svg>

            {/* Main Content */}
            <main className="not-found-main">
                {/* Gear Animation Container */}
                <div className="gear-container">
                    {/* Main large gear */}
                    <div className="gear-main">
                        <SettingOutlined />
                    </div>

                    {/* Secondary gear (bottom-left) */}
                    <div className="gear-secondary">
                        <SettingOutlined />
                    </div>

                    {/* Alert gear (top-right) */}
                    <div className="gear-alert">
                        <WarningOutlined />
                    </div>

                    {/* 404 Text */}
                    <h1 className="not-found-404">404</h1>

                    {/* Technical Annotations */}
                    <div className="annotation annotation-right">
                        <div className="annotation-line" />
                        <span className="annotation-text">Sys_Err_0x4</span>
                    </div>

                    <div className="annotation annotation-left">
                        <div className="annotation-line" />
                        <span className="annotation-text">Gear_Assembly_Fail</span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="not-found-content">
                    <Title level={2} className="not-found-title">
                        {t('notFound.title')}
                    </Title>

                    <Paragraph className="not-found-description">
                        {t('notFound.description')}
                    </Paragraph>

                    {/* Buttons */}
                    <div className="not-found-buttons">
                        <Link href={getDashboardRoute()}>
                            <Button
                                type="primary"
                                size="large"
                                className="not-found-btn-primary"
                                icon={<ArrowLeftOutlined />}
                            >
                                {getButtonText()}
                            </Button>
                        </Link>


                    </div>
                </div>
            </main>

            {/* Status Bar */}
            <div className="status-bar">
                <div className="status-left">
                    <span className="status-indicator">
                        <span className="status-dot" />
                        SYSTEM_STATUS: ERROR
                    </span>
                    <span className="status-separator">|</span>
                    <span className="status-version">VERSION: 2.4.1.9</span>
                </div>
                <div className="status-right">
                    SECURE CONNECTION // FACTORY_NET_V2
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="scanline" />
        </div>
    );
}
