'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Radio, Select, Space, Spin } from 'antd';
import { toast } from 'sonner';
import {
    BgColorsOutlined,
    GlobalOutlined,
    BulbOutlined,
    MoonOutlined,
    DesktopOutlined,
    CheckOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { UserSettings, THEME_OPTIONS, LANGUAGE_OPTIONS } from '@/types/User';
import { useTheme } from '@/hooks/useTheme';

interface PreferenceSettingsProps {
    settings: UserSettings;
    onUpdate: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
}

export function PreferenceSettings({ settings, onUpdate }: PreferenceSettingsProps) {
    const { setTheme } = useTheme();
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        theme: settings.theme || 'system',
        language: settings.language || 'en',
    });

    const [updatingFields, setUpdatingFields] = useState<Set<string>>(new Set());

    const getThemeIcon = useCallback((themeValue: string) => {
        switch (themeValue) {
            case 'light':
                return <BulbOutlined />;
            case 'dark':
                return <MoonOutlined />;
            case 'system':
                return <DesktopOutlined />;
            default:
                return <DesktopOutlined />;
        }
    }, []);

    const isUpdating = (fieldName: string): boolean => {
        return updatingFields.has(fieldName);
    };

    const setFieldUpdating = (fieldName: string, updating: boolean): void => {
        setUpdatingFields((prev) => {
            const newSet = new Set(prev);
            if (updating) {
                newSet.add(fieldName);
            } else {
                newSet.delete(fieldName);
            }
            return newSet;
        });
    };

    const handleThemeChange = useCallback(
        async (newTheme: 'light' | 'dark' | 'system') => {
            const originalTheme = formData.theme;

            setTheme(newTheme);
            setFormData((prev) => ({ ...prev, theme: newTheme }));
            setFieldUpdating('theme', true);

            try {
                const result = await onUpdate({ theme: newTheme });

                if (result.success) {
                    const themeLabel = t(`preferenceSettings.appearance.themes.${newTheme}`);
                    toast.success(
                        t('preferenceSettings.messages.themeChanged').replace('{theme}', themeLabel)
                    );
                } else {
                    throw new Error(result.error || 'Update failed');
                }
            } catch (error: any) {
                setTheme(originalTheme);
                setFormData((prev) => ({ ...prev, theme: originalTheme }));
                toast.error(
                    error?.message || t('preferenceSettings.errors.updateFailed') || 'Update failed'
                );
            } finally {
                setFieldUpdating('theme', false);
            }
        },
        [formData.theme, setTheme, setFieldUpdating, onUpdate, t]
    );

    const handleLanguageChange = async (newLanguage: 'en' | 'vi') => {
        const originalLanguage = formData.language;

        setFormData((prev) => ({ ...prev, language: newLanguage }));
        setFieldUpdating('language', true);

        try {
            const result = await onUpdate({ language: newLanguage });

            if (result.success) {
                const languageLabel =
                    LANGUAGE_OPTIONS.find((opt) => opt.value === newLanguage)?.label || newLanguage;
                toast.success(
                    t('preferenceSettings.messages.languageChanged').replace(
                        '{language}',
                        languageLabel
                    )
                );
            } else {
                throw new Error(result.error || 'Update failed');
            }
        } catch (error: any) {
            setFormData((prev) => ({ ...prev, language: originalLanguage }));
            toast.error(
                error?.message || t('preferenceSettings.errors.updateFailed') || 'Update failed'
            );
        } finally {
            setFieldUpdating('language', false);
        }
    };

    // Sync with props when they change
    useEffect(() => {
        setFormData({
            theme: settings.theme || 'system',
            language: settings.language || 'en',
        });
    }, [settings.theme, settings.language]);

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* Theme Settings Card */}
            <Card
                title={
                    <Space>
                        <BgColorsOutlined />
                        <span>{t('preferenceSettings.appearance.title')}</span>
                        {isUpdating('theme') && (
                            <Spin indicator={<LoadingOutlined spin />} size="small" />
                        )}
                    </Space>
                }
            >
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                            {t('preferenceSettings.appearance.theme')}
                        </div>
                        <Radio.Group
                            value={formData.theme}
                            onChange={(e) => handleThemeChange(e.target.value)}
                            disabled={isUpdating('theme')}
                            style={{ width: '100%' }}
                        >
                            <Space orientation="vertical" style={{ width: '100%' }}>
                                {THEME_OPTIONS.map((option) => (
                                    <Radio.Button
                                        key={option.value}
                                        value={option.value}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            borderColor:
                                                formData.theme === option.value
                                                    ? 'var(--primary)'
                                                    : undefined,
                                            background:
                                                formData.theme === option.value
                                                    ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                                                    : undefined,
                                        }}
                                    >
                                        <Space>
                                            {getThemeIcon(option.value)}
                                            <span>
                                                {t(
                                                    `preferenceSettings.appearance.themes.${option.value}`
                                                )}
                                            </span>
                                            {formData.theme === option.value && (
                                                <CheckOutlined
                                                    style={{ color: 'var(--primary)' }}
                                                />
                                            )}
                                        </Space>
                                    </Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>
                    </div>
                </Space>
            </Card>

            {/* Language Settings Card */}
            <Card
                title={
                    <Space>
                        <GlobalOutlined />
                        <span>{t('preferenceSettings.language.title')}</span>
                        {isUpdating('language') && (
                            <Spin indicator={<LoadingOutlined spin />} size="small" />
                        )}
                    </Space>
                }
            >
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                            {t('preferenceSettings.language.displayLanguage')}
                        </div>
                        <Select
                            value={formData.language}
                            onChange={handleLanguageChange}
                            disabled={isUpdating('language')}
                            size="large"
                            style={{ width: '100%' }}
                            suffixIcon={
                                isUpdating('language') ? <LoadingOutlined spin /> : undefined
                            }
                        >
                            {LANGUAGE_OPTIONS.map((lang) => (
                                <Select.Option key={lang.value} value={lang.value}>
                                    <Space>
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: 'var(--muted-foreground)',
                                            }}
                                        >
                                            ({lang.nativeName})
                                        </span>
                                        {formData.language === lang.value && (
                                            <CheckOutlined style={{ color: 'var(--primary)' }} />
                                        )}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                </Space>
            </Card>
        </Space>
    );
}
