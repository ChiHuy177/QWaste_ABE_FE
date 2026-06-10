'use client';

import React from 'react';
import { Form, FormInstance, Button, Flex, theme } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DrawingConfigStep } from '../Steps/DrawingConfigStep';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { PlanTabTreeView } from './PlanTabTreeView';
import { fieldPathToNodeKey } from '../../utils/treeMappers';

const { useToken } = theme;

// Toggle between tree view and nested cards
const USE_TREE_VIEW = true;

interface PlanTabProps {
    form: FormInstance;
    drawingTemplates: DrawingCodePickingResponse[];
    operators: any[];
    isLoadingOperators: boolean;
    isSubmitting: boolean;
    disabled?: boolean;
    productionType: string;
    onFinish: () => Promise<void>;
    onCancel: () => void;
    onValuesChange: () => void;
    onQuickCreate: (drawingIndex: number) => void;
    focusNodeKey?: string | null;
    onFocusNodeHandled?: () => void;
    onValidationFocus?: (nodeKey: string) => void;
    validationVersion?: number;
    showTaskReviews?: boolean;
    rootError?: string | null;
}

export const PlanTab: React.FC<PlanTabProps> = ({
    form,
    drawingTemplates,
    operators,
    isLoadingOperators,
    isSubmitting,
    disabled = false,
    productionType,
    onFinish,
    onCancel,
    onValuesChange,
    onQuickCreate,
    focusNodeKey,
    onFocusNodeHandled,
    onValidationFocus,
    validationVersion,
    showTaskReviews = true,
    rootError,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const handleFinishFailed = (error: any) => {
        const errorFields = error?.errorFields || [];
        if (errorFields.length > 0) {
            const firstErrorField = errorFields[0].name;
            const focusNodeKey = fieldPathToNodeKey(firstErrorField);
            if (focusNodeKey) {
                onValidationFocus?.(focusNodeKey);
            }
            form.scrollToField(firstErrorField, {
                behavior: 'smooth',
                block: 'center',
            });
        }
    };

    // Use tree view if enabled
    if (USE_TREE_VIEW) {
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
                <PlanTabTreeView
                    form={form}
                    drawingTemplates={drawingTemplates}
                    operators={operators}
                    isLoadingOperators={isLoadingOperators}
                    productionType={productionType}
                    onQuickCreate={onQuickCreate}
                    focusNodeKey={focusNodeKey}
                    onFocusNodeHandled={onFocusNodeHandled}
                    validationVersion={validationVersion}
                    showTaskReviews={showTaskReviews}
                    rootError={rootError}
                />

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
    }

    // Fallback to nested cards view
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
            <DrawingConfigStep
                form={form}
                drawingTemplates={drawingTemplates}
                productionType={productionType}
                operators={operators}
                isLoadingOperators={isLoadingOperators}
                onQuickCreate={onQuickCreate}
            />

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
