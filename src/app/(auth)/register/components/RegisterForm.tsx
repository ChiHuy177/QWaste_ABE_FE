'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Form,
    Input,
    Button,
    Alert,
    Typography,
    theme,
    Progress,
    Space,
    Steps,
    Radio,
    Select,
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    MailOutlined,
    CheckCircleOutlined,
    LoadingOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    PhoneOutlined,
    IdcardOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AuthService } from '@/services/AuthService';
import { SpaceService } from '@/services/SpaceService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RegisterFormData } from '@/types/Register';
import { getDefaultRoute } from '@/configs/permissions/routeAccess';
import { defineAbilityFor } from '@/configs/permissions/defineAbility';
import { AccountRole } from '@/types/User';

const { Text, Title } = Typography;
const { TextArea } = Input;

const VALIDATION_CONFIG = Object.freeze({
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_PASSWORD_LENGTH: 6,
    PHONE_REGEX: /^0\d{9}$/,
    USERCODE_LENGTH: 7,
});

type FormStep = 'account' | 'personal' | 'otp';

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

const PasswordStrengthIndicator = React.memo(
    ({ password, token, t }: { password: string; token: any; t: (key: string) => string }) => {
        const strength = calculatePasswordStrength(password);

        const color = useMemo(() => {
            if (strength >= 80) return token.colorSuccess;
            if (strength >= 60) return token.colorWarning;
            return token.colorError;
        }, [strength, token]);

        const text = useMemo(() => {
            if (strength >= 80) return t('securitySettings.passwordStrength.levels.strong');
            if (strength >= 60) return t('securitySettings.passwordStrength.levels.good');
            if (strength >= 40) return t('securitySettings.passwordStrength.levels.fair');
            if (strength >= 20) return t('securitySettings.passwordStrength.levels.weak');
            return t('securitySettings.passwordStrength.levels.veryWeak');
        }, [strength, t]);

        if (!password) return null;

        return (
            <div style={{ marginTop: 8 }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: 12,
                    }}
                >
                    <span>{t('securitySettings.passwordStrength.title')}</span>
                    <span style={{ color, fontWeight: 500 }}>{text}</span>
                </div>
                <Progress percent={strength} strokeColor={color} showInfo={false} size="small" />
            </div>
        );
    }
);

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

const RegisterForm = React.memo(() => {
    const [form] = Form.useForm<RegisterFormData>();
    const [currentStep, setCurrentStep] = useState<FormStep>('account');
    const [otpCode, setOtpCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [spaces, setSpaces] = useState<Array<{ value: number; label: string }>>([]);
    const [loadingSpaces, setLoadingSpaces] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [emailForOtp, setEmailForOtp] = useState('');
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    const { t } = useTranslation();
    const { token } = theme.useToken();
    const router = useRouter();
    const { syncUser } = useAuth();

    // Fetch registration spaces on mount
    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                setLoadingSpaces(true);
                const response = await SpaceService.getRootSpacesForRegistration();
                const options = response.map((space) => ({
                    value: space.spaceId,
                    label: `${space.spaceCode} - ${space.spaceName}`,
                }));
                setSpaces(options);
            } catch (error) {
                console.error('[RegisterForm] Failed to fetch registration spaces:', error);
                toast.error(t('registerPage.messages.spaceLoadFailed'));
            } finally {
                setLoadingSpaces(false);
            }
        };
        fetchSpaces();
    }, [t]);

    // Handle continue from Step 1 to Step 2
    const handleContinueToPersonal = useCallback(async () => {
        try {
            await form.validateFields(['email', 'password', 'confirmPassword']);
            setCurrentStep('personal');
            setGeneralError(null);
        } catch {
            // Validation failed, errors will be shown by Form
        }
    }, [form]);

    const handleBackToAccount = useCallback(() => {
        setCurrentStep('account');
        setGeneralError(null);
    }, []);

    const handleRegister = useCallback(async () => {
        try {
            const values = await form.validateFields();

            setIsSubmitting(true);
            setGeneralError(null);

            const email = form.getFieldValue('email') as string;
            const password = form.getFieldValue('password') as string;
            const confirmPassword = form.getFieldValue('confirmPassword') as string;
            const username = email.split('@')[0];

            const result = await AuthService.register({
                ...values,
                email,
                password,
                confirmPassword,
                username,
                spaceId: values.spaceId!,
            });

            if (result.success) {
                toast.success(t('registerPage.messages.otpSent'));
                setEmailForOtp(email);
                setCurrentStep('otp');
            } else {
                setGeneralError(result.error || t('registerPage.messages.registerFailed'));
            }
        } catch (err: any) {
            if (err.errorFields) {
                return;
            }
            console.error(err);
            setGeneralError(err.response?.data?.message || t('registerPage.messages.serverError'));
        } finally {
            setIsSubmitting(false);
        }
    }, [form, t]);

    const handleVerifyOTP = useCallback(async () => {
        if (otpCode.length !== 6) {
            setGeneralError(t('registerPage.otp.invalidCode'));
            return;
        }

        setIsVerifying(true);
        setGeneralError(null);

        try {
            const result = await AuthService.verifyRegistration(emailForOtp, otpCode);
            await syncUser();
            toast.success(t('registerPage.messages.registerSuccess'));

            const userRoles = (result.user?.roles || []).map(
                (r: string) => r.toLowerCase() as AccountRole
            );
            const ability = defineAbilityFor(userRoles, result.user?.permissions);
            const route = getDefaultRoute(ability);
            router.replace(route);
        } catch (err: any) {
            setGeneralError(err.response?.data?.message || t('registerPage.messages.verifyFailed'));
        } finally {
            setIsVerifying(false);
        }
    }, [emailForOtp, otpCode, t, router, syncUser]);

    const handleBackFromOTP = useCallback(() => {
        setCurrentStep('personal');
        setOtpCode('');
        setGeneralError(null);
    }, []);

    const currentStepIndex = useMemo(() => {
        if (currentStep === 'account') return 0;
        if (currentStep === 'personal') return 1;
        return 2;
    }, [currentStep]);

    const renderStepper = useMemo(
        () => (
            <Steps
                current={currentStepIndex}
                size="small"
                responsive={false}
                items={[{ title: '' }, { title: '' }, { title: '' }]}
                style={{
                    marginBottom: 24,
                    maxWidth: '100%',
                    overflow: 'hidden',
                }}
            />
        ),
        [currentStepIndex]
    );

    // OTP Step
    if (currentStep === 'otp') {
        return (
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <Steps
                        current={currentStepIndex}
                        items={[{ title: '' }, { title: '' }, { title: '' }]}
                        style={{ marginBottom: 8 }}
                    />

                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: `0 4px 12px ${token.colorPrimary}40`,
                            }}
                        >
                            <MailOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>
                        <Title level={3} style={{ marginBottom: 8, marginTop: 0 }}>
                            {t('registerPage.otp.title')}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            {t('registerPage.otp.description')}
                        </Text>
                        <div style={{ marginTop: 8 }}>
                            <Text strong style={{ color: token.colorPrimary }}>
                                {emailForOtp}
                            </Text>
                        </div>
                    </div>

                    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                        <label
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                display: 'block',
                                textAlign: 'center',
                            }}
                        >
                            {t('registerPage.otp.label')}
                        </label>
                        <Input
                            value={otpCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 6) {
                                    setOtpCode(value);
                                    setGeneralError(null);
                                }
                            }}
                            maxLength={6}
                            size="large"
                            status={generalError ? 'error' : ''}
                            placeholder="000000"
                            style={{
                                fontSize: 32,
                                letterSpacing: 18,
                                textAlign: 'center',
                                fontWeight: 700,
                                padding: '16px 24px',
                                borderRadius: token.borderRadiusLG,
                            }}
                            disabled={isVerifying}
                            autoFocus
                        />
                        {generalError && <Alert title={generalError} type="error" showIcon />}
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorTextTertiary,
                                textAlign: 'center',
                            }}
                        >
                            <CheckCircleOutlined style={{ marginRight: 4 }} />
                            {t('registerPage.otp.hint')}
                        </div>
                    </Space>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleVerifyOTP}
                        loading={isVerifying}
                        disabled={otpCode.length !== 6 || isVerifying}
                        block
                        icon={isVerifying ? <LoadingOutlined /> : <CheckCircleOutlined />}
                        style={{ marginTop: 8 }}
                    >
                        {isVerifying
                            ? t('registerPage.buttons.verifying')
                            : t('registerPage.buttons.verify')}
                    </Button>

                    <Button
                        type="default"
                        size="large"
                        onClick={handleBackFromOTP}
                        disabled={isVerifying}
                        block
                        icon={<ArrowLeftOutlined />}
                    >
                        {t('registerPage.buttons.backToEdit')}
                    </Button>

                    {/* Resend OTP Link */}
                    <div style={{ textAlign: 'center', marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {t('registerPage.otp.codeSent')}{' '}
                        </Text>
                        <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, height: 'auto', fontSize: 13 }}
                            disabled={isVerifying}
                        >
                            {t('registerPage.otp.resend')}
                        </Button>
                    </div>
                </Space>
            </div>
        );
    }

    if (currentStep === 'account') {
        return (
            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                {renderStepper}

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                        {t('registerPage.steps.accountSecurity')}
                    </Title>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleContinueToPersonal}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                    }}
                >
                    <Form.Item
                        name="email"
                        label={<Text strong>{t('registerPage.fields.email')}</Text>}
                        rules={[
                            { required: true, message: t('registerPage.validation.emailRequired') },
                            {
                                pattern: VALIDATION_CONFIG.EMAIL_REGEX,
                                message: t('registerPage.validation.emailInvalid'),
                            },
                        ]}
                        style={{ marginBottom: 0 }}
                    >
                        <Input
                            size="large"
                            prefix={<MailOutlined style={{ color: token.colorTextTertiary }} />}
                            placeholder={t('registerPage.placeholders.email')}
                            autoComplete="email"
                        />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.email !== currentValues.email
                        }
                    >
                        {({ getFieldValue }) => {
                            const emailValue = getFieldValue('email');
                            const username = emailValue?.includes('@')
                                ? emailValue.split('@')[0]
                                : '';

                            if (!username) return null;

                            return (
                                <Form.Item
                                    label={<Text strong>{t('registerPage.fields.username')}</Text>}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input
                                        size="large"
                                        prefix={
                                            <UserOutlined
                                                style={{ color: token.colorTextTertiary }}
                                            />
                                        }
                                        value={username}
                                        disabled
                                        style={{ backgroundColor: token.colorBgContainerDisabled }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {t('registerPage.info.usernameGenerated')}
                                    </Text>
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<Text strong>{t('registerPage.fields.password')}</Text>}
                        rules={[
                            {
                                required: true,
                                message: t('registerPage.validation.passwordRequired'),
                            },
                            {
                                min: VALIDATION_CONFIG.MIN_PASSWORD_LENGTH,
                                message: t('registerPage.validation.passwordTooShort', {
                                    minLength: VALIDATION_CONFIG.MIN_PASSWORD_LENGTH,
                                }),
                            },
                        ]}
                        style={{ marginBottom: 0 }}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                            placeholder={t('registerPage.placeholders.password')}
                            autoComplete="new-password"
                            iconRender={(visible) =>
                                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                            }
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                        />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.password !== cur.password}>
                        {({ getFieldValue }) => (
                            <>
                                <PasswordStrengthIndicator
                                    password={getFieldValue('password') || ''}
                                    token={token}
                                    t={t}
                                />
                                {isPasswordFocused && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            padding: '10px 14px',
                                            fontSize: 12,
                                            color: '#4a5568',
                                            backgroundColor: '#e8f4f8',
                                            borderRadius: 6,
                                            border: '1px solid #b8dce8',
                                            transition: 'all 0.2s ease',
                                            lineHeight: '1.5',
                                        }}
                                    >
                                        <span style={{ fontSize: 12 }}>
                                            <strong>
                                                {t('registerPage.passwordRequirements.label')}
                                            </strong>
                                            <br />
                                            {t('registerPage.passwordRequirements.text')}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </Form.Item>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, cur) =>
                            prev.password !== cur.password ||
                            prev.confirmPassword !== cur.confirmPassword
                        }
                    >
                        {({ getFieldValue }) => {
                            const pwd = getFieldValue('password');
                            const confirmPwd = getFieldValue('confirmPassword');
                            const match = pwd && confirmPwd && pwd === confirmPwd;

                            return (
                                <Form.Item
                                    name="confirmPassword"
                                    label={
                                        <Text strong>
                                            {t('registerPage.fields.confirmPassword')}
                                        </Text>
                                    }
                                    dependencies={['password']}
                                    rules={[
                                        {
                                            required: true,
                                            message: t(
                                                'registerPage.validation.confirmPasswordRequired'
                                            ),
                                        },
                                        ({ getFieldValue: getVal }) => ({
                                            validator(_, value) {
                                                if (!value || getVal('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(
                                                    new Error(
                                                        t(
                                                            'registerPage.validation.passwordsDoNotMatch'
                                                        )
                                                    )
                                                );
                                            },
                                        }),
                                    ]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input.Password
                                        size="large"
                                        prefix={
                                            <LockOutlined
                                                style={{ color: token.colorTextTertiary }}
                                            />
                                        }
                                        placeholder={t('registerPage.placeholders.confirmPassword')}
                                        autoComplete="new-password"
                                        iconRender={(visible) =>
                                            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                                        }
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    {/* Continue Button */}
                    <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            icon={<ArrowRightOutlined />}
                            iconPlacement="end"
                        >
                            {t('registerPage.buttons.continue')}
                        </Button>
                    </Form.Item>

                    {/* Link to Login */}
                    <div style={{ textAlign: 'center', marginTop: 4 }}>
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push('/login', { scroll: false });
                            }}
                            style={{ padding: 0, height: 'auto', fontSize: 14 }}
                        >
                            {t('registerPage.buttons.goToLogin')}
                        </Button>
                    </div>
                </Form>
            </div>
        );
    }

    // Step 2: Personal Information
    return (
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
            {renderStepper}

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ marginBottom: 4 }}>
                    {t('registerPage.steps.personalDetails')}
                </Title>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleRegister}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                }}
            >
                {/* Full Name */}
                <Form.Item
                    name="fullname"
                    label={
                        <Text strong>
                            {t('registerPage.fields.fullName')} <Text type="danger">*</Text>
                        </Text>
                    }
                    rules={[
                        { required: true, message: t('registerPage.validation.fullNameRequired') },
                        {
                            whitespace: true,
                            message: t('registerPage.validation.fullNameRequired'),
                        },
                    ]}
                    style={{ marginBottom: 0 }}
                >
                    <Input
                        size="large"
                        prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
                        placeholder={t('registerPage.placeholders.fullName')}
                        disabled={isSubmitting}
                    />
                </Form.Item>

                {/* Employee Code */}
                <Form.Item
                    name="userCode"
                    label={
                        <Text strong>
                            {t('registerPage.fields.employeeCode')} <Text type="danger">*</Text>
                        </Text>
                    }
                    rules={[
                        {
                            required: true,
                            message: t('registerPage.validation.employeeCodeRequired'),
                        },
                        {
                            len: VALIDATION_CONFIG.USERCODE_LENGTH,
                            message: t('registerPage.validation.employeeCodeInvalid', {
                                requiredLength: VALIDATION_CONFIG.USERCODE_LENGTH,
                            }),
                        },
                    ]}
                    style={{ marginBottom: 0 }}
                >
                    <Input
                        size="large"
                        prefix={<IdcardOutlined style={{ color: token.colorTextTertiary }} />}
                        placeholder={t('registerPage.placeholders.employeeCode')}
                        disabled={isSubmitting}
                    />
                </Form.Item>

                {/* Phone Number */}
                <Form.Item
                    name="phoneNumber"
                    label={
                        <Text strong>
                            {t('registerPage.fields.phoneNumber')} <Text type="danger">*</Text>
                        </Text>
                    }
                    rules={[
                        {
                            required: true,
                            message: t('registerPage.validation.phoneNumberRequired'),
                        },
                        {
                            pattern: VALIDATION_CONFIG.PHONE_REGEX,
                            message: t('registerPage.validation.phoneNumberInvalid'),
                        },
                    ]}
                    getValueFromEvent={(e) => e.target.value.replace(/\D/g, '').slice(0, 10)}
                    style={{ marginBottom: 0 }}
                >
                    <Input
                        size="large"
                        prefix={<PhoneOutlined style={{ color: token.colorTextTertiary }} />}
                        placeholder={t('registerPage.placeholders.phoneNumber')}
                        disabled={isSubmitting}
                    />
                </Form.Item>

                {/* Gender */}
                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.gender !== cur.gender}>
                    {({ getFieldValue }) => {
                        const genderValue = getFieldValue('gender');
                        return (
                            <Form.Item
                                name="gender"
                                label={
                                    <Text strong>
                                        {t('registerPage.fields.gender')}{' '}
                                        <Text type="danger">*</Text>
                                    </Text>
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: t('registerPage.validation.genderRequired'),
                                    },
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <Radio.Group
                                    disabled={isSubmitting}
                                    size="large"
                                    style={{ width: '100%' }}
                                >
                                    <Radio.Button
                                        value="MALE"
                                        style={{
                                            width: '50%',
                                            textAlign: 'center',
                                            backgroundColor:
                                                genderValue === 'MALE'
                                                    ? token.colorPrimary
                                                    : undefined,
                                            color: genderValue === 'MALE' ? '#fff' : undefined,
                                            borderColor:
                                                genderValue === 'MALE'
                                                    ? token.colorPrimary
                                                    : undefined,
                                        }}
                                    >
                                        {t('registerPage.genderOptions.male')}
                                    </Radio.Button>
                                    <Radio.Button
                                        value="FEMALE"
                                        style={{
                                            width: '50%',
                                            textAlign: 'center',
                                            backgroundColor:
                                                genderValue === 'FEMALE'
                                                    ? token.colorPrimary
                                                    : undefined,
                                            color: genderValue === 'FEMALE' ? '#fff' : undefined,
                                            borderColor:
                                                genderValue === 'FEMALE'
                                                    ? token.colorPrimary
                                                    : undefined,
                                        }}
                                    >
                                        {t('registerPage.genderOptions.female')}
                                    </Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        );
                    }}
                </Form.Item>

                {/* Address */}
                <Form.Item
                    name="address"
                    label={
                        <Text strong>
                            {t('registerPage.fields.address')} <Text type="danger">*</Text>
                        </Text>
                    }
                    rules={[
                        { required: true, message: t('registerPage.validation.addressRequired') },
                        { whitespace: true, message: t('registerPage.validation.addressRequired') },
                    ]}
                    style={{ marginBottom: 0 }}
                >
                    <TextArea
                        rows={3}
                        placeholder={t('registerPage.placeholders.address')}
                        disabled={isSubmitting}
                    />
                </Form.Item>

                {/* Space Selection */}
                <Form.Item
                    name="spaceId"
                    label={
                        <Text strong>
                            {t('registerPage.fields.space')} <Text type="danger">*</Text>
                        </Text>
                    }
                    rules={[
                        { required: true, message: t('registerPage.validation.spaceRequired') },
                    ]}
                    style={{ marginBottom: 0 }}
                >
                    <Select
                        size="large"
                        placeholder={t('registerPage.placeholders.space')}
                        loading={loadingSpaces}
                        disabled={isSubmitting || loadingSpaces}
                        options={spaces}
                        showSearch={{ filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }}
                    />
                </Form.Item>

                {/* Error Message */}
                {generalError && <Alert title={generalError} type="error" showIcon />}

                {/* Action Buttons */}
                <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={isSubmitting}
                            icon={isSubmitting ? <LoadingOutlined /> : null}
                        >
                            {t('registerPage.buttons.register')}
                        </Button>

                        <Button
                            type="default"
                            size="large"
                            block
                            onClick={handleBackToAccount}
                            disabled={isSubmitting}
                            icon={<ArrowLeftOutlined />}
                        >
                            {t('registerPage.buttons.back')}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
});

RegisterForm.displayName = 'RegisterForm';

export default RegisterForm;
