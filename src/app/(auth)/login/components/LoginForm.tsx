'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Alert, Typography, theme } from 'antd';
import {
    UserOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    CheckCircleOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getDefaultRoute } from '@/configs/permissions/routeAccess';
import { defineAbilityFor } from '@/configs/permissions/defineAbility';
import { AccountRole } from '@/types/User';

const { Text } = Typography;

interface LoginFormData {
    email: string;
    password: string;
}

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

const INITIAL_FORM_DATA: LoginFormData = Object.freeze({
    email: '',
    password: '',
});

const VALIDATION_CONFIG = Object.freeze({
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_PASSWORD_LENGTH: 6,
    MAX_ATTEMPTS: 5,
    BLOCK_TIME_SECONDS: 300,
    WARNING_THRESHOLD: 6,
});

// Colors matching the QWaste brand theme
const BRAND_COLORS = Object.freeze({
    primary: '#0d47a1',
    primaryHover: '#1565c0',
    success: '#3D8A6B',
    inputBg: '#f8fafc',
    inputBorder: '#e2e8f0',
    inputFocusBorder: '#0d47a1',
    labelColor: '#475569',
    iconColor: '#94a3b8',
});

const validateUsername = (
    username: string,
    t: (key: string, options?: any) => string
): string | undefined => {
    if (!username) return t('common.form.validation.usernameRequired');
    if (username.length < VALIDATION_CONFIG.MIN_PASSWORD_LENGTH)
        return t('common.form.validation.usernameMinLength', {
            length: VALIDATION_CONFIG.MIN_PASSWORD_LENGTH,
        });
    return undefined;
};

const validatePassword = (
    password: string,
    t: (key: string, options?: any) => string
): string | undefined => {
    if (!password) return t('common.form.validation.passwordRequired');
    if (password.length < VALIDATION_CONFIG.MIN_PASSWORD_LENGTH) {
        return t('common.form.validation.passwordMinLength', {
            length: VALIDATION_CONFIG.MIN_PASSWORD_LENGTH,
        });
    }
    return undefined;
};

const LoginForm = React.memo(() => {
    const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_DATA);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [error] = useState('');
    const { login, isAuthenticated, user } = useAuth();
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const router = useRouter();
    const searchParams = useSearchParams();

    const hasRedirected = useRef(false);
    const navigationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Get returnUrl from query params
    const returnUrl = searchParams.get('returnUrl');

    // Debug: Log returnUrl on mount
    useEffect(() => {
        console.log('[LOGIN FORM] Component mounted');
        console.log('[LOGIN FORM] returnUrl from searchParams:', returnUrl);
        console.log('[LOGIN FORM] Current URL:', window.location.href);
    }, [returnUrl]);

    const validationErrors = useMemo(() => {
        const errors: FormErrors = {};
        const usernameError = validateUsername(formData.email, t);
        if (usernameError) errors.email = usernameError;
        const passwordError = validatePassword(formData.password, t);
        if (passwordError) errors.password = passwordError;
        return errors;
    }, [formData.email, formData.password, t]);

    const navigateByAbility = useCallback(() => {
        try {
            // If returnUrl exists, redirect there instead of default route
            if (returnUrl) {
                // Validate returnUrl to prevent open redirect (must be relative path)
                const isValidReturnUrl = returnUrl.startsWith('/') && !returnUrl.startsWith('//');
                if (isValidReturnUrl) {
                    console.log('[LOGIN] Redirecting to saved returnUrl:', returnUrl);
                    router.replace(returnUrl);
                    return;
                } else {
                    console.warn('[LOGIN] Invalid returnUrl, using default route:', returnUrl);
                }
            }

            // Otherwise, use default route based on role
            const roles = (user?.roles || []).map((r) => r.toLowerCase() as AccountRole);
            const ability = defineAbilityFor(roles, user?.permissions);
            const route = getDefaultRoute(ability);

            console.log('[LOGIN] No returnUrl, using default route:', route);
            if (window.location.pathname !== route) {
                router.replace(route);
            }
        } catch (err) {
            console.error('[LOGIN] Navigation error:', err);
            router.replace('/login');
        }
    }, [router, user, returnUrl]);

    const handleInputChange = useCallback(
        (field: keyof LoginFormData, value: string) => {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));

            if (formErrors[field]) {
                setFormErrors((prev) => ({
                    ...prev,
                    [field]: undefined,
                }));
            }
        },
        [formErrors]
    );

    const validateForm = useCallback((): boolean => {
        setFormErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [validationErrors]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setFormErrors({});

        try {
            await login(formData.email, formData.password);
            setLoginSuccess(true);
            // Navigation will be handled by useEffect when user state updates
        } catch (_err: unknown) {
            console.log(_err);
            setFormErrors({
                general:
                    (_err as any).response?.data?.message ||
                    'Có lỗi từ server. Vui lòng thử lại sau.',
            });
            setLoginSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    }, [validateForm, formData, login]);

    useEffect(() => {
        if (isAuthenticated) {
            hasRedirected.current = true;

            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
            navigationTimeoutRef.current = setTimeout(() => {
                navigateByAbility();
            }, 100);
        }
    }, [isAuthenticated, navigateByAbility]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            style={{
                width: '100%',
                maxWidth: 400,
                margin: '0 auto',
            }}
        >
            <Form
                layout="vertical"
                onFinish={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                }}
            >
                {/* Email/Username Field */}
                <Form.Item
                    label={
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: BRAND_COLORS.labelColor,
                            }}
                        >
                            {t('common.account')}
                        </Text>
                    }
                    validateStatus={formErrors.email ? 'error' : ''}
                    help={formErrors.email}
                    style={{ marginBottom: 0 }}
                >
                    <Input
                        size="large"
                        prefix={
                            <UserOutlined
                                style={{
                                    color: BRAND_COLORS.iconColor,
                                    fontSize: 16,
                                }}
                            />
                        }
                        placeholder={t('common.placeholder.account')}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={isSubmitting || loginSuccess}
                        autoComplete="email"
                        style={{
                            height: 48,
                            borderRadius: 10,
                            backgroundColor: BRAND_COLORS.inputBg,
                            borderColor: BRAND_COLORS.inputBorder,
                        }}
                    />
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                    label={
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: BRAND_COLORS.labelColor,
                            }}
                        >
                            {t('common.password')}
                        </Text>
                    }
                    validateStatus={formErrors.password ? 'error' : ''}
                    help={formErrors.password}
                    style={{ marginBottom: 0 }}
                >
                    <Input.Password
                        size="large"
                        prefix={
                            <LockOutlined
                                style={{
                                    color: BRAND_COLORS.iconColor,
                                    fontSize: 16,
                                }}
                            />
                        }
                        placeholder={t('common.placeholder.password')}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        disabled={isSubmitting || loginSuccess}
                        autoComplete="current-password"
                        iconRender={(visible) =>
                            visible ? (
                                <EyeTwoTone style={{ color: BRAND_COLORS.iconColor }} />
                            ) : (
                                <EyeInvisibleOutlined style={{ color: BRAND_COLORS.iconColor }} />
                            )
                        }
                        style={{
                            height: 48,
                            borderRadius: 10,
                            backgroundColor: BRAND_COLORS.inputBg,
                            borderColor: BRAND_COLORS.inputBorder,
                        }}
                    />
                </Form.Item>

                {/* Success Message */}
                {loginSuccess && (
                    <Alert
                        message={t('common.loginSuccess')}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{
                            borderRadius: 10,
                        }}
                    />
                )}

                {/* Error Message */}
                {(formErrors.general || error) && !loginSuccess && (
                    <Alert
                        message={formErrors.general || error}
                        type="error"
                        showIcon
                        style={{
                            borderRadius: 10,
                        }}
                    />
                )}

                {/* Submit Button */}
                <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={isSubmitting}
                        disabled={loginSuccess}
                        icon={
                            loginSuccess ? (
                                <CheckCircleOutlined />
                            ) : isSubmitting ? (
                                <LoadingOutlined />
                            ) : null
                        }
                        style={{
                            height: 48,
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: 15,
                            backgroundColor: loginSuccess
                                ? BRAND_COLORS.success
                                : BRAND_COLORS.primary,
                            borderColor: loginSuccess ? BRAND_COLORS.success : BRAND_COLORS.primary,
                            boxShadow: loginSuccess ? 'none' : '0 4px 12px rgba(13, 71, 161, 0.3)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {loginSuccess
                            ? t('common.loginSuccess')
                            : isSubmitting
                              ? 'Signing in...'
                              : t('common.login')}
                    </Button>
                </Form.Item>

                {/* Link to Register */}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Button
                        type="link"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push('/register', { scroll: false });
                        }}
                        style={{
                            padding: 0,
                            height: 'auto',
                            fontSize: 14,
                            color: BRAND_COLORS.primary,
                        }}
                    >
                        {t('common.noAccount')}
                    </Button>
                </div>
            </Form>
        </div>
    );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;
