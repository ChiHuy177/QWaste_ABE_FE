'use client';

import { useState, useEffect, useMemo, JSX, useCallback } from 'react';
import {
    UserOutlined,
    SafetyOutlined,
    BgColorsOutlined,
    SettingOutlined,
    ReloadOutlined,
    SolutionOutlined,
} from '@ant-design/icons';
import { Tabs, Card, Button, Skeleton, Alert, Space, theme } from 'antd';
import type { GlobalToken } from 'antd/es/theme/interface';
import { useTheme } from '@/hooks/useTheme';
import { SecuritySettings } from './SecuritySettings';
import { PreferenceSettings } from './PreferenceSettings';
import { UserProfile, UserSettings } from '@/types/User';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ProfileSetting } from './ProfileSetting';

const DEFAULT_TAB = 'profile';

interface SettingsPageProps {
    userProfile: UserProfile | null;
    userSettings: UserSettings | null;
    isLoading?: boolean;
    error?: string | null;
    onProfileUpdate: (
        updates: Partial<UserProfile>
    ) => Promise<{ success: boolean; error?: string }>;
    onSettingsUpdate: (
        updates: Partial<UserSettings>
    ) => Promise<{ success: boolean; error?: string }>;
    onRequestOTP: (currentPassword: string) => Promise<{ success: boolean; error?: string }>;
    onVerifyOTP: (
        otpCode: string,
        newPassword: string,
        confirmPassword: string
    ) => Promise<{ success: boolean; error?: string }>;
    onRetryLoad?: () => void;
    className?: string;
}

interface LoadingState {
    initial: boolean;
    refreshing: boolean;
    saving: boolean;
}

interface SettingsState {
    loading: LoadingState;
    error: string | null;
    hasUnsavedChanges: boolean;
}

interface LoadingSkeletonProps {
    bgColorLayout: string;
}

const LoadingSkeleton = ({ bgColorLayout }: LoadingSkeletonProps): JSX.Element => (
    <div style={{ minHeight: '100vh', background: bgColorLayout }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 4 }} />
            </Space>
        </div>
    </div>
);

interface ErrorStateProps {
    error: string | null;
    onRetryLoad?: () => void;
    retryLoadSettings: () => void;
    isRefreshing: boolean;
    token: GlobalToken;
    t: TFunction;
}

const ErrorState = ({
    error,
    onRetryLoad,
    retryLoadSettings,
    isRefreshing,
    token,
    t,
}: ErrorStateProps): JSX.Element => (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        <div style={{ margin: '0 auto' }}>
            <Alert
                title={t('settingsPage.errors.settingsError')}
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Card>
                <div style={{ textAlign: 'center', padding: 32 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: token.colorError,
                            opacity: 0.1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}
                    >
                        <SettingOutlined style={{ fontSize: 32, color: token.colorError }} />
                    </div>
                    <h3
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 8,
                            color: token.colorText,
                        }}
                    >
                        {t('settingsPage.errors.settingsError')}
                    </h3>
                    <p style={{ color: token.colorTextSecondary, marginBottom: 24 }}>
                        {error}
                    </p>
                    {onRetryLoad && (
                        <Button
                            type="primary"
                            danger
                            onClick={retryLoadSettings}
                            loading={isRefreshing}
                        >
                            <ReloadOutlined />
                            {t('settingsPage.actions.retryLoading')}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    </div>
);

export function SettingsPage({
    userProfile,
    userSettings,
    isLoading = false,
    error: externalError = null,
    onProfileUpdate,
    onSettingsUpdate,
    onRequestOTP,
    onVerifyOTP,
    onRetryLoad,
    className,
}: SettingsPageProps): JSX.Element {
    const { setTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const { token } = theme.useToken();

    const SETTINGS_TABS = useMemo(
        () =>
            [
                {
                    key: 'profile',
                    label: t('settingsPage.tabs.profile.label'),
                    description: t('settingsPage.tabs.profile.description'),
                },
                {
                    key: 'security',
                    label: t('settingsPage.tabs.security.label'),
                    description: t('settingsPage.tabs.security.description'),
                },
                {
                    key: 'preferences',
                    label: t('settingsPage.tabs.preferences.label'),
                    description: t('settingsPage.tabs.preferences.description'),
                },
            ] as const,
        [t]
    );

    const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
    const [state, setState] = useState<SettingsState>({
        loading: {
            initial: isLoading,
            refreshing: false,
            saving: false,
        },
        error: externalError,
        hasUnsavedChanges: false,
    });

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            loading: {
                ...prev.loading,
                initial: isLoading,
            },
            error: externalError,
        }));
    }, [isLoading, externalError]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTab = sessionStorage.getItem('settings-active-tab');
            if (savedTab && SETTINGS_TABS.some((tab) => tab.key === savedTab)) {
                setActiveTab(savedTab);
            }
        }
    }, [SETTINGS_TABS]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('settings-active-tab', activeTab);
        }
    }, [activeTab]);

    const handleProfileUpdate = useCallback(
        async (
            updatedProfile: Partial<UserProfile>
        ): Promise<{ success: boolean; error?: string }> => {
            if (!userProfile) {
                return { success: false, error: t('settingsPage.errors.noAccount') };
            }

            try {
                setState((prev) => ({
                    ...prev,
                    hasUnsavedChanges: true,
                }));

                const result = await onProfileUpdate(updatedProfile);

                setState((prev) => ({
                    ...prev,
                    hasUnsavedChanges: false,
                }));

                return result;
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    hasUnsavedChanges: false,
                }));

                return { success: false, error: t('settingsPage.errors.updateFailed') };
            }
        },
        [userProfile, onProfileUpdate, t]
    );

    const handleSettingsUpdate = useCallback(
        async (
            updatedSettings: Partial<UserSettings>
        ): Promise<{ success: boolean; error?: string }> => {
            if (!userSettings) {
                return { success: false, error: t('settingsPage.errors.noSettings') };
            }

            try {
                setState((prev) => ({
                    ...prev,
                    hasUnsavedChanges: true,
                }));

                if (updatedSettings.theme) {
                    setTheme(updatedSettings.theme);
                }

                if (updatedSettings.language) {
                    const languageMap: Record<string, string> = {
                        en: 'en',
                        vn: 'vi',
                        ch: 'zh',
                    };

                    const i18nLanguage =
                        languageMap[updatedSettings.language] || updatedSettings.language;
                    i18n.changeLanguage(i18nLanguage);
                }

                const result = await onSettingsUpdate(updatedSettings);

                setState((prev) => ({
                    ...prev,
                    hasUnsavedChanges: false,
                }));

                return result;
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    hasUnsavedChanges: false,
                }));

                return {
                    success: false,
                    error: t('settingsPage.errors.settingsUpdateFailed'),
                };
            }
        },
        [userSettings, onSettingsUpdate, setTheme, i18n, t]
    );

    const retryLoadSettings = (): void => {
        setState((prev) => ({ ...prev, error: null }));
        if (onRetryLoad) {
            onRetryLoad();
        }
    };

    const tabItems = useMemo(
        () => [
            {
                key: 'profile',
                label: (
                    <span>
                        <UserOutlined />
                        <span style={{ marginLeft: 8 }}>
                            {t('settingsPage.tabs.profile.label')}
                        </span>
                    </span>
                ),
                children: (
                    <div style={{ padding: '24px 0' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <SolutionOutlined />
                                {t('settingsPage.sections.profileInformation.title')}
                            </h2>
                            <p style={{ fontSize: 14, color: token.colorTextSecondary }}>
                                {t('settingsPage.sections.profileInformation.description')}
                            </p>
                        </div>
                        {userProfile && userSettings && (
                            <ProfileSetting
                                profile={userProfile}
                                settings={userSettings}
                                onUpdateProfile={handleProfileUpdate}
                                onUpdateSettings={handleSettingsUpdate}
                            />
                        )}
                    </div>
                ),
            },
            {
                key: 'security',
                label: (
                    <span>
                        <SafetyOutlined />
                        <span style={{ marginLeft: 8 }}>
                            {t('settingsPage.tabs.security.label')}
                        </span>
                    </span>
                ),
                children: (
                    <div style={{ padding: '24px 0' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <SafetyOutlined />
                                {t('settingsPage.sections.loginSecurity.title')}
                            </h2>
                            <p style={{ fontSize: 14, color: token.colorTextSecondary }}>
                                {t('settingsPage.sections.loginSecurity.description')}
                            </p>
                        </div>
                        <SecuritySettings onRequestOTP={onRequestOTP} onVerifyOTP={onVerifyOTP} />
                    </div>
                ),
            },
            {
                key: 'preferences',
                label: (
                    <span>
                        <BgColorsOutlined />
                        <span style={{ marginLeft: 8 }}>
                            {t('settingsPage.tabs.preferences.label')}
                        </span>
                    </span>
                ),
                children: (
                    <div style={{ padding: '24px 0' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <BgColorsOutlined />
                                {t('settingsPage.sections.preference.title')}
                            </h2>
                            <p style={{ fontSize: 14, color: token.colorTextSecondary }}>
                                {t('settingsPage.sections.preference.description')}
                            </p>
                        </div>
                        {userSettings && (
                            <PreferenceSettings
                                settings={userSettings}
                                onUpdate={handleSettingsUpdate}
                            />
                        )}
                    </div>
                ),
            },
        ],
        [
            handleProfileUpdate,
            handleSettingsUpdate,
            onRequestOTP,
            onVerifyOTP,
            t,
            token.colorTextSecondary,
            userProfile,
            userSettings,
        ]
    );

    if (state.loading.initial || isLoading) {
        return <LoadingSkeleton bgColorLayout={token.colorBgLayout} />;
    }

    if (state.error || externalError) {
        return (
            <ErrorState
                error={state.error}
                onRetryLoad={onRetryLoad}
                retryLoadSettings={retryLoadSettings}
                isRefreshing={state.loading.refreshing}
                token={token}
                t={t}
            />
        );
    }

    return (
        <div style={{ minHeight: '100vh', width: '100%' }}>
            <div style={{ margin: '0 auto' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                    style={{
                        background: token.colorBgContainer,
                        borderRadius: token.borderRadius,
                        padding: '0 24px',
                    }}
                />
            </div>
        </div>
    );
}
