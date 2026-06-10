'use client';

import { useCallback, useState } from 'react';
import { Button, Input, Card, Alert, Space, theme, Progress, Steps } from 'antd';
import { toast } from 'sonner';
import {
    KeyOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    SafetyOutlined,
    MailOutlined,
    ArrowLeftOutlined,
    SendOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SecuritySettingsProps {
    onRequestOTP: (currentPassword: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    onVerifyOTP: (
        otpCode: string,
        newPassword: string,
        confirmPassword: string
    ) => Promise<{
        success: boolean;
        error?: string;
    }>;
}

type ViewStep = 'password' | 'otp';

const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

    return Math.min(strength, 100);
};

export function SecuritySettings({ onRequestOTP, onVerifyOTP }: SecuritySettingsProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const [currentStep, setCurrentStep] = useState<ViewStep>('password');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const passwordStrength = calculatePasswordStrength(newPassword);
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

    const getStrengthColor = useCallback(() => {
        if (passwordStrength >= 80) return token.colorSuccess;
        if (passwordStrength >= 60) return token.colorWarning;
        return token.colorError;
    }, [passwordStrength, token]);

    const getStrengthText = useCallback(() => {
        if (passwordStrength >= 80) return t('securitySettings.passwordStrength.levels.strong');
        if (passwordStrength >= 60) return t('securitySettings.passwordStrength.levels.good');
        if (passwordStrength >= 40) return t('securitySettings.passwordStrength.levels.fair');
        if (passwordStrength >= 20) return t('securitySettings.passwordStrength.levels.weak');
        return t('securitySettings.passwordStrength.levels.veryWeak');
    }, [passwordStrength, t]);

    const handleRequestOTP = async () => {
        if (!currentPassword.trim()) {
            setError(t('securitySettings.validation.currentRequired'));
            return;
        }

        if (!newPassword.trim()) {
            setError(t('securitySettings.validation.newRequired'));
            return;
        }

        if (newPassword.length < 8) {
            setError(t('securitySettings.validation.passwordTooShort', { minLength: 8 }));
            return;
        }

        if (!confirmPassword.trim()) {
            setError(t('securitySettings.validation.confirmRequired'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('securitySettings.validation.passwordsNoMatch'));
            return;
        }

        setIsLoading(true);
        setError(undefined);

        try {
            const result = await onRequestOTP(currentPassword);

            if (result.success) {
                toast.success(t('securitySettings.verification.codeSent'));
                setCurrentStep('otp');
            } else {
                setError(result.error || t('securitySettings.messages.changeFailed'));
            }
        } catch (err) {
            setError(t('securitySettings.messages.changeError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) {
            setError(t('securitySettings.verification.codeInvalid'));
            return;
        }

        setIsLoading(true);
        setError(undefined);

        try {
            const result = await onVerifyOTP(otpCode, newPassword, confirmPassword);

            if (result.success) {
                toast.success(t('securitySettings.messages.changeSuccess'));
                handleReset();
            } else {
                setError(result.error || t('securitySettings.verification.verificationFailed'));
            }
        } catch (err) {
            setError(t('securitySettings.messages.changeError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setCurrentStep('password');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setError(undefined);
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const handleBack = () => {
        setCurrentStep('password');
        setOtpCode('');
        setError(undefined);
    };

    if (currentStep === 'otp') {
        return (
            <Card
                title={
                    <Space>
                        <MailOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                        <span>{t('securitySettings.verification.title')}</span>
                    </Space>
                }
                extra={
                    <Button type="text" onClick={handleBack}>
                        <ArrowLeftOutlined />
                        {t('securitySettings.verification.back')}
                    </Button>
                }
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Steps Indicator */}
                    <Steps
                        current={1}
                        items={[
                            {
                                title: t('securitySettings.steps.enterPassword'),
                                icon: <KeyOutlined />,
                            },
                            {
                                title: t('securitySettings.steps.verify'),
                                icon: <MailOutlined />,
                            },
                            {
                                title: t('securitySettings.steps.complete'),
                                icon: <CheckCircleOutlined />,
                            },
                        ]}
                    />

                    <Alert
                        message={t('securitySettings.verification.description')}
                        type="info"
                        showIcon
                    />

                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <label style={{ fontSize: 14, fontWeight: 500 }}>
                            {t('securitySettings.verification.otpLabel')}
                        </label>
                        <Input
                            value={otpCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 6) {
                                    setOtpCode(value);
                                    setError(undefined);
                                }
                            }}
                            maxLength={6}
                            size="large"
                            status={error ? 'error' : ''}
                            placeholder="000000"
                            style={{
                                fontSize: 24,
                                letterSpacing: 12,
                                textAlign: 'center',
                                fontWeight: 600,
                            }}
                        />
                        {error && <Alert message={error} type="error" showIcon />}
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorTextTertiary,
                                textAlign: 'center',
                            }}
                        >
                            {t('securitySettings.verification.hint')}
                        </div>
                    </Space>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleVerifyOTP}
                        loading={isLoading}
                        disabled={otpCode.length !== 6}
                        block
                    >
                        <CheckCircleOutlined />
                        {t('securitySettings.actions.verify')}
                    </Button>
                </Space>
            </Card>
        );
    }

    return (
        <Card
            title={
                <Space>
                    <SafetyOutlined style={{ fontSize: 20 }} />
                    <span>{t('securitySettings.title')}</span>
                </Space>
            }
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Steps Indicator */}
                <Steps
                    current={0}
                    items={[
                        {
                            title: t('securitySettings.steps.enterPassword'),
                            icon: <KeyOutlined />,
                        },
                        {
                            title: t('securitySettings.steps.verify'),
                            icon: <MailOutlined />,
                        },
                        {
                            title: t('securitySettings.steps.complete'),
                            icon: <CheckCircleOutlined />,
                        },
                    ]}
                />

                <Alert message={t('securitySettings.description')} type="info" showIcon />

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <label style={{ fontSize: 14, fontWeight: 500 }}>
                        {t('securitySettings.fields.currentPassword')}
                    </label>
                    <Input.Password
                        value={currentPassword}
                        onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setError(undefined);
                        }}
                        size="large"
                        status={error ? 'error' : ''}
                        placeholder={t('securitySettings.placeholders.enterPassword')}
                        visibilityToggle={{
                            visible: showCurrentPassword,
                            onVisibleChange: setShowCurrentPassword,
                        }}
                        iconRender={(visible) =>
                            visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                        }
                    />
                </Space>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <label style={{ fontSize: 14, fontWeight: 500 }}>
                        {t('securitySettings.fields.newPassword')}
                    </label>
                    <Input.Password
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setError(undefined);
                        }}
                        size="large"
                        status={error ? 'error' : ''}
                        placeholder={t('securitySettings.placeholders.newPassword')}
                        visibilityToggle={{
                            visible: showNewPassword,
                            onVisibleChange: setShowNewPassword,
                        }}
                        iconRender={(visible) =>
                            visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                        }
                    />

                    {newPassword && (
                        <div style={{ marginTop: 8 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 4,
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                <span>{t('securitySettings.passwordStrength.title')}</span>
                                <span style={{ color: getStrengthColor(), fontWeight: 500 }}>
                                    {getStrengthText()}
                                </span>
                            </div>
                            <Progress
                                percent={passwordStrength}
                                strokeColor={getStrengthColor()}
                                showInfo={false}
                                size="small"
                            />
                        </div>
                    )}
                </Space>

                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <label style={{ fontSize: 14, fontWeight: 500 }}>
                        {t('securitySettings.fields.confirmPassword')}
                    </label>
                    <Input.Password
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError(undefined);
                        }}
                        size="large"
                        status={error ? 'error' : ''}
                        placeholder={t('securitySettings.placeholders.confirmPassword')}
                        visibilityToggle={{
                            visible: showConfirmPassword,
                            onVisibleChange: setShowConfirmPassword,
                        }}
                        iconRender={(visible) =>
                            visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                        }
                        suffix={
                            confirmPassword.length > 0 ? (
                                passwordsMatch ? (
                                    <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                                ) : (
                                    <CloseCircleOutlined style={{ color: token.colorError }} />
                                )
                            ) : null
                        }
                    />
                </Space>

                {error && <Alert message={error} type="error" showIcon />}

                <Button
                    type="primary"
                    size="large"
                    onClick={handleRequestOTP}
                    loading={isLoading}
                    disabled={
                        !currentPassword.trim() ||
                        !newPassword.trim() ||
                        !confirmPassword.trim() ||
                        !passwordsMatch
                    }
                    block
                >
                    <SendOutlined />
                    {t('securitySettings.actions.requestOTP')}
                </Button>
            </Space>
        </Card>
    );
}
