'use client';

import { useState, useEffect } from 'react';
import { Modal, Alert, Button, Input, Space, Typography } from 'antd';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [success] = useState(true);
    const [error] = useState(false);
    const [isLoading] = useState(false);
    // const { isLoading } = useAuth();

    // Use the unified password reset hook
    // const {
    //     initiateReset,
    //     isLoadingForgot: isLoading,
    //     errorForgot: error,
    //     successForgot: success,
    //     clearMessages
    // } = usePasswordReset();

    const handleSubmit = async (_e: React.FormEvent) => {
        // e.preventDefault();
        // const result = await initiateReset(email);
        // if (result.success) {
        //     setEmail('');
        // }
    };

    const handleClose = () => {
        setEmail('');
        onClose();
    };

    useEffect(() => {
        if (success && isOpen) {
            const timer = setTimeout(handleClose, 6000);
            return () => clearTimeout(timer);
        }
    }, [success, isOpen]);

    return (
        <Modal
            open={isOpen}
            onCancel={handleClose}
            footer={null}
            width={480}
            destroyOnHidden
            title={
                <Space orientation="vertical" size={2} style={{ marginBottom: 4 }}>
                    <Typography.Text strong style={{ fontSize: 20 }}>
                        {t('forgotPassword.title')}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                        {t('forgotPassword.subtitle')}
                    </Typography.Text>
                </Space>
            }
        >
            {success && (
                <Alert
                    type="success"
                    showIcon
                    title={t('forgotPassword.messages.success.title')}
                    description={t('forgotPassword.messages.instructions.checkInbox')}
                    style={{ marginBottom: 20 }}
                />
            )}

            <form onSubmit={handleSubmit}>
                <Space orientation="vertical" size={20} style={{ width: '100%' }}>
                    <div>
                        <label
                            htmlFor="modal-email"
                            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
                        >
                            {t('forgotPassword.form.fields.email')}
                        </label>
                        <Input
                            id="modal-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading || !!success}
                            placeholder={t('forgotPassword.form.placeholders.email')}
                            suffix={<Mail size={16} style={{ color: '#9ca3af' }} />}
                            required
                            size="large"
                        />
                    </div>

                    {error && (
                        <Alert
                            type="error"
                            showIcon
                            title={t('forgotPassword.messages.error.title')}
                            description={t('forgotPassword.messages.instructions.contactSupport')}
                        />
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button block onClick={handleClose} disabled={isLoading} size="large">
                            {success
                                ? t('forgotPassword.form.buttons.close')
                                : t('forgotPassword.form.buttons.cancel')}
                        </Button>
                        <Button
                            block
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            disabled={isLoading || !!success}
                            size="large"
                        >
                            {success
                                ? t('forgotPassword.form.buttons.emailSent')
                                : isLoading
                                    ? t('forgotPassword.form.buttons.sending')
                                    : t('forgotPassword.form.buttons.sendResetLink')}
                        </Button>
                    </div>
                </Space>
            </form>

            <div
                style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center',
                }}
            >
                <Button
                    type="link"
                    onClick={handleClose}
                    disabled={isLoading}
                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                >
                    {t('forgotPassword.form.buttons.backToLogin')}
                </Button>
            </div>
        </Modal>
    );
}
