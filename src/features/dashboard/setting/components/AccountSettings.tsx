'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Spin, theme } from 'antd';
import { LoadingOutlined, UserOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { UserProfile, UserSettings } from '@/types/User';
import { useTranslation } from 'react-i18next';

const ROLE_CONFIG = {
    SUPER_ADMIN: {
        color: '#1677ff',
        background: '#e6f4ff',
        border: '#91caff',
    },
    ADMIN: {
        color: '#52c41a',
        background: '#f6ffed',
        border: '#b7eb8f',
    },
    CLIENT: {
        color: '#fa8c16',
        background: '#fff7e6',
        border: '#ffd591',
    },
    MAINTENANCE: {
        color: '#722ed1',
        background: '#f9f0ff',
        border: '#d3adf7',
    },
} as const;

interface AccountSettingsProps {
    profile: UserProfile;
    settings: UserSettings;
    onUpdateProfile: (
        updates: Partial<UserProfile>
    ) => Promise<{ success: boolean; error?: string }>;
    onUpdateSettings: (
        updates: Partial<UserSettings>
    ) => Promise<{ success: boolean; error?: string }>;
}

export function AccountSettings({ profile, settings }: AccountSettingsProps): React.JSX.Element {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        if (profile && settings) {
            setIsInitialLoading(false);
        }
    }, [profile, settings]);

    if (isInitialLoading || !profile || !settings) {
        return (
            <div style={{ textAlign: 'center', padding: 32 }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                <p style={{ marginTop: 16, color: token.colorTextSecondary }}>
                    {t('accountSettings.loading') || 'Loading account information...'}
                </p>
            </div>
        );
    }

    return (
        <Card
            style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                color: token.colorText,
            }}
        >
            <Row gutter={[32, 24]} align="middle">
                <Col xs={24}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            padding: '12px 0',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <h2
                                style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    margin: 0,
                                    color: token.colorText,
                                    lineHeight: 1.2,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {profile.fullname || 'User'}
                            </h2>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    paddingLeft: 2,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        fontSize: 14,
                                        color: token.colorText,
                                    }}
                                >
                                    <MailOutlined
                                        style={{ fontSize: 16, color: token.colorTextTertiary }}
                                    />
                                    <span>{profile.email}</span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        fontSize: 14,
                                        color: token.colorText,
                                    }}
                                >
                                    <IdcardOutlined
                                        style={{ fontSize: 16, color: token.colorTextTertiary }}
                                    />
                                    <span>Code: {profile.userCode}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingLeft: 2 }}>
                            {(Array.isArray(profile.roles) ? profile.roles : [profile.roles]).map(
                                (role) => {
                                    const roleKey = role as keyof typeof ROLE_CONFIG;
                                    const roleStyle = ROLE_CONFIG[roleKey] || {
                                        color: token.colorText,
                                        background: token.colorBgContainer,
                                        border: token.colorBorder,
                                    };

                                    return (
                                        <Tag
                                            key={role}
                                            icon={<UserOutlined />}
                                            style={{
                                                padding: '6px 18px',
                                                borderRadius: 8,
                                                fontSize: 14,
                                                fontWeight: 700,
                                                letterSpacing: 0.5,
                                                color: roleStyle.color,
                                                background: roleStyle.background,
                                                border: `1px solid ${roleStyle.border}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {(() => {
                                                try {
                                                    return (
                                                        (t as unknown as (key: string) => string)(
                                                            role
                                                        ) ||
                                                        role ||
                                                        t('accountSettings.accountInfo.unknown')
                                                    );
                                                } catch {
                                                    return (
                                                        role ||
                                                        t('accountSettings.accountInfo.unknown')
                                                    );
                                                }
                                            })()}
                                        </Tag>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </Col>
            </Row>
        </Card>
    );
}
