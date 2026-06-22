'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select, Card, Space, Row, Col, Tag, Spin, theme, Image } from 'antd';
import { toast } from 'sonner';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    SaveOutlined,
    LoadingOutlined,
    IdcardOutlined,
} from '@ant-design/icons';
import { UserProfile, UserSettings, ValidationErrors } from '@/types/User';
import { useTranslation } from 'react-i18next';
import { AvatarUpload } from './AvatarUpload';
import { useUploadThing } from '@/utils/uploadthing';

const COUNTRY_CODES = [
    { code: '+1', country: 'US/CA', label: '+1 (US/Canada)' },
    { code: '+44', country: 'GB', label: '+44 (UK)' },
    { code: '+65', country: 'SG', label: '+65 (Singapore)' },
    { code: '+86', country: 'CN', label: '+86 (China)' },
    { code: '+84', country: 'VN', label: '+84 (Vietnam)' },
    { code: '+852', country: 'HK', label: '+852 (Hong Kong)' },
    { code: '+853', country: 'MO', label: '+853 (Macau)' },
    { code: '+886', country: 'TW', label: '+886 (Taiwan)' },
    { code: '+82', country: 'KR', label: '+82 (South Korea)' },
    { code: '+81', country: 'JP', label: '+81 (Japan)' },
    { code: '+60', country: 'MY', label: '+60 (Malaysia)' },
    { code: '+66', country: 'TH', label: '+66 (Thailand)' },
    { code: '+62', country: 'ID', label: '+62 (Indonesia)' },
    { code: '+63', country: 'PH', label: '+63 (Philippines)' },
    { code: '+91', country: 'IN', label: '+91 (India)' },
    { code: '+61', country: 'AU', label: '+61 (Australia)' },
    { code: '+64', country: 'NZ', label: '+64 (New Zealand)' },
    { code: '+33', country: 'FR', label: '+33 (France)' },
    { code: '+49', country: 'DE', label: '+49 (Germany)' },
    { code: '+39', country: 'IT', label: '+39 (Italy)' },
    { code: '+34', country: 'ES', label: '+34 (Spain)' },
    { code: '+31', country: 'NL', label: '+31 (Netherlands)' },
    { code: '+41', country: 'CH', label: '+41 (Switzerland)' },
    { code: '+46', country: 'SE', label: '+46 (Sweden)' },
    { code: '+47', country: 'NO', label: '+47 (Norway)' },
    { code: '+45', country: 'DK', label: '+45 (Denmark)' },
    { code: '+358', country: 'FI', label: '+358 (Finland)' },
] as const;

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

interface FormState {
    fullName: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    avatarUrl: string;
    language: 'en' | 'vi';
}

const validatePhoneNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\s/g, '');
    return /^\d+$/.test(cleanNumber) && cleanNumber.length >= 6 && cleanNumber.length <= 15;
};

const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
};

const parsePhoneNumber = (fullPhoneNumber: string): { countryCode: string; number: string } => {
    if (!fullPhoneNumber) {
        return { countryCode: '+84', number: '' };
    }

    for (const country of COUNTRY_CODES) {
        if (fullPhoneNumber.startsWith(country.code)) {
            return {
                countryCode: country.code,
                number: fullPhoneNumber.substring(country.code.length),
            };
        }
    }

    return { countryCode: '+84', number: fullPhoneNumber };
};

export function AccountSettings({
    profile,
    settings,
    onUpdateProfile,
    onUpdateSettings,
}: AccountSettingsProps): React.JSX.Element {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { startUpload, isUploading: isUploadingToUT } = useUploadThing('imageUploader');

    const existingPhone = profile?.phoneNumber || '';
    const { countryCode: initialCountryCode, number: initialPhoneNumber } =
        parsePhoneNumber(existingPhone);

    const [formData, setFormData] = useState<FormState>({
        fullName: '',
        email: '',
        phoneCountryCode: initialCountryCode,
        phoneNumber: initialPhoneNumber,
        avatarUrl: '',
        language: 'en',
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        if (profile && settings) {
            const existingPhone = profile.phoneNumber || '';
            const { countryCode, number } = parsePhoneNumber(existingPhone);

            setFormData({
                fullName: profile.fullname || '',
                email: profile.email || '',
                phoneCountryCode: countryCode,
                phoneNumber: number,
                avatarUrl: profile.preferences.avatarUrl || '',
                language: settings.language || 'en',
            });
            setPreviewImage(profile.preferences.avatarUrl || '');
            setIsInitialLoading(false);
        }
    }, [profile, settings]);

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = t('accountSettings.validation.nameRequired');
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = t('accountSettings.validation.nameMinLength');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('accountSettings.validation.emailRequired');
        } else if (!validateEmail(formData.email)) {
            newErrors.email = t('accountSettings.validation.emailInvalid');
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = t('accountSettings.validation.phoneRequired');
        } else if (!validatePhoneNumber(formData.phoneNumber)) {
            newErrors.phoneNumber = t('accountSettings.validation.phoneInvalid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field: keyof FormState, value: string): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: '' }));
        }
    };

    const handlePhoneNumberChange = (value: string): void => {
        const cleanValue = value.replace(/\s/g, '');
        handleFieldChange('phoneNumber', cleanValue);
    };

    const handleAvatarFileSelect = useCallback((file: File | null) => {
        setSelectedAvatarFile(file);
    }, []);

    const handleAvatarPreview = useCallback((url: string) => {
        setPreviewOpen(true);
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent): Promise<void> => {
            event.preventDefault();

            if (!validateForm()) {
                toast.error(t('accountSettings.messages.fixErrors'));
                return;
            }

            setIsUpdating(true);

            try {
                let uploadedAvatarUrl = formData.avatarUrl;

                // Upload avatar if a new file was selected
                if (selectedAvatarFile) {
                    toast.info(t('avatarUpload.uploadingMessage') || 'Uploading avatar...');

                    try {
                        const uploadResult = await startUpload([selectedAvatarFile]);

                        if (!uploadResult || !uploadResult[0] || !uploadResult[0].url) {
                            throw new Error('Upload failed - no URL returned');
                        }

                        uploadedAvatarUrl = uploadResult[0].url;
                        setPreviewImage(uploadedAvatarUrl);
                        setSelectedAvatarFile(null); // Clear selected file after successful upload
                    } catch (uploadError) {
                        console.error('Avatar upload error:', uploadError);
                        toast.error(t('avatarUpload.uploadError') || 'Failed to upload avatar');
                        setIsUpdating(false);
                        return;
                    }
                }

                const fullPhoneNumber = formData.phoneCountryCode + formData.phoneNumber;

                const profileChanged =
                    formData.fullName !== (profile.fullname || '') ||
                    formData.email !== (profile.email || '') ||
                    fullPhoneNumber !== (profile.phoneNumber || '') ||
                    uploadedAvatarUrl !== (profile.preferences.avatarUrl || '');

                const settingsChanged = formData.language !== (settings.language || 'en');

                let profileResult = { success: true };
                let settingsResult = { success: true };

                if (profileChanged) {
                    profileResult = await onUpdateProfile({
                        fullname: formData.fullName.trim(),
                        email: formData.email.trim(),
                        phoneNumber: fullPhoneNumber,
                        preferences: {
                            ...profile.preferences,
                            avatarUrl: uploadedAvatarUrl,
                        },
                    });
                }

                if (settingsChanged) {
                    settingsResult = await onUpdateSettings({
                        language: formData.language,
                    });
                }

                if (profileResult.success && settingsResult.success) {
                    if (profileChanged || settingsChanged) {
                        toast.success(t('accountSettings.messages.updateSuccess'));
                        // Update formData with new avatar URL
                        setFormData((prev) => ({ ...prev, avatarUrl: uploadedAvatarUrl }));
                    } else {
                        toast.info(t('accountSettings.messages.noChanges'));
                    }
                } else {
                    const errorMessage = t('accountSettings.messages.updateError');
                    toast.error(errorMessage);
                }
            } catch (error) {
                toast.error(t('accountSettings.messages.unexpectedError'));
            } finally {
                setIsUpdating(false);
            }
        },
        [formData, profile, settings, selectedAvatarFile, onUpdateProfile, onUpdateSettings, t]
    );

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
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* Profile Header Card */}
            <Card
                style={{
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorder}`,
                    color: token.colorText,
                }}
            >
                <Row gutter={[32, 24]} align="middle">
                    {/* Avatar Section */}
                    <Col
                        xs={24}
                        sm={8}
                        md={6}
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <AvatarUpload
                            disableUpload
                            showCameraIcon={false}
                            helperText=""
                            currentUser={profile}
                            currentAvatarUrl={profile.preferences.avatarUrl}
                            onFileSelect={handleAvatarFileSelect}
                            previewUrl={previewImage}
                            onPreview={handleAvatarPreview}
                        />
                    </Col>

                    {/* Profile Info */}
                    <Col xs={24} sm={16} md={18}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 20,
                                height: '100%',
                                padding: '12px 0',
                            }}
                        >
                            {/* Name and Email */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}
                            >
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
                                    {profile?.fullname || 'User'}
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
                                        <span>{profile?.email}</span>
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

                            {/* Role Badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 12,
                                    paddingLeft: 2,
                                }}
                            >
                                {(Array.isArray(profile.roles)
                                    ? profile.roles
                                    : [profile.roles]
                                ).map((role) => {
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
                                                    const roleTranslationKey = `${role}`;

                                                    return (
                                                        (t as unknown as (key: string) => string)(
                                                            roleTranslationKey
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
                                })}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Hidden Image Preview */}
            <div style={{ display: 'none' }}>
                <Image.PreviewGroup
                    preview={{
                        open: previewOpen,
                        onOpenChange: (visible) => setPreviewOpen(visible),
                    }}
                >
                    <Image src={previewImage} alt="Avatar Preview" />
                </Image.PreviewGroup>
            </div>
        </Space>
    );
}
