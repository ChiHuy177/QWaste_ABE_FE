// components/shared/ForbiddenContent.tsx
'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Typography, Button } from 'antd';
import {
    SettingOutlined,
    LockOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import './ForbiddenContent.css';

const { Title, Paragraph } = Typography;

export function ForbiddenContent() {
    const { t } = useTranslation();

    return (
        <div className="forbidden-container">
            {/* Blueprint Grid Background */}
            <div className="forbidden-blueprint-grid" />

            {/* Technical Lines SVG */}
            <svg className="forbidden-technical-lines" xmlns="http://www.w3.org/2000/svg">
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
            <main className="forbidden-main">
                {/* Icon Container */}
                <div className="forbidden-icon-container">
                    {/* Main large gear */}
                    <div className="forbidden-gear-main">
                        <SettingOutlined />
                    </div>

                    {/* Lock icon (center) */}
                    <div className="forbidden-lock-icon">
                        <LockOutlined />
                    </div>

                    {/* Secondary gear (bottom-left) */}
                    <div className="forbidden-gear-secondary">
                        <SettingOutlined />
                    </div>

                    {/* 403 Text */}
                    <h1 className="forbidden-403">403</h1>

                    {/* Technical Annotations (Orange) */}
                    <div className="forbidden-annotation forbidden-annotation-right">
                        <div className="forbidden-annotation-line" />
                        <span className="forbidden-annotation-text">Auth_Err_0x3</span>
                    </div>

                    <div className="forbidden-annotation forbidden-annotation-left">
                        <div className="forbidden-annotation-line" />
                        <span className="forbidden-annotation-text">Access_Denied</span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="forbidden-content">
                    <Title level={2} className="forbidden-title">
                        {t('forbidden.title')}
                    </Title>

                    <Paragraph className="forbidden-description">
                        {t('forbidden.description')}
                    </Paragraph>

                    {/* Buttons */}
                    <div className="forbidden-buttons">
                        <Link href="/">
                            <Button
                                type="primary"
                                size="large"
                                className="forbidden-btn-primary"
                                icon={<ArrowLeftOutlined />}
                            >
                                {t('forbidden.buttons.goToDashboard')}
                            </Button>
                        </Link>


                    </div>
                </div>
            </main>

            {/* Status Bar (Orange) */}
            <div className="forbidden-status-bar">
                <div className="forbidden-status-left">
                    <span className="forbidden-status-indicator">
                        <span className="forbidden-status-dot" />
                        SYSTEM_STATUS: ACCESS_DENIED
                    </span>
                    <span className="forbidden-status-separator">|</span>
                    <span className="forbidden-status-level">SEC_LEVEL: 4</span>
                </div>
                <div className="forbidden-status-right">
                    SECURE CONNECTION // FACTORY_NET_V2
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="forbidden-scanline" />
        </div>
    );
}
