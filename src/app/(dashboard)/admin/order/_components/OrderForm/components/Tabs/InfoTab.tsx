'use client';

import React from 'react';
import { Form, FormInstance, Button, Flex, theme } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { BasicInfoStep } from '../Steps/BasicInfoStep';
import { OrderResponse } from '@/types/Order';

const { useToken } = theme;

interface InfoTabProps {
    form: FormInstance;
    currentOrder: OrderResponse | null;
    isSubmitting: boolean;
    disabled?: boolean;
    onFinish: () => Promise<void>;
    onCancel: () => void;
    onValuesChange: () => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({
    form,
    currentOrder,
    isSubmitting,
    disabled = false,
    onFinish,
    onCancel,
    onValuesChange,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const handleFinishFailed = (error: any) => {
        const errorFields = error?.errorFields || [];
        if (errorFields.length > 0) {
            const firstErrorField = errorFields[0].name;
            form.scrollToField(firstErrorField, {
                behavior: 'smooth',
                block: 'center',
            });
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={handleFinishFailed}
            onValuesChange={onValuesChange}
            disabled={disabled}
            style={{ marginTop: 16 }}
        >
            <BasicInfoStep isEditMode={true} currentOrder={currentOrder} />

            <Flex
                justify="end"
                gap={12}
                style={{
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Button onClick={onCancel} disabled={false}>
                    {t('common.buttons.cancel')}
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={disabled}
                    icon={<SaveOutlined />}
                >
                    {t('orderManagement.form.buttons.submitUpdate')}
                </Button>
            </Flex>
        </Form>
    );
};
