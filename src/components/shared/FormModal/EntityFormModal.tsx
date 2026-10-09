'use client';

import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Button,
    Row,
    Col,
    Descriptions,
    Divider,
    Typography,
    Skeleton,
    Tabs,
    theme,
} from 'antd';
import { toast } from 'sonner';
import { EntityFormModalProps, FormFieldConfig } from './types';
import { renderField } from './fieldRenderers';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

/**
 * Generic form modal component that can be reused across all category modules
 * (Staff, Group, Zone, etc.)
 *
 * @example
 * ```tsx
 * <EntityFormModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleSubmit}
 *   mode="create"
 *   fields={groupFormFields}
 *   title={{ create: 'Add Group', edit: 'Edit Group' }}
 * />
 * ```
 */
export function EntityFormModal<TFormData extends Record<string, any>>({
    open,
    onOpenChange,
    onSubmit: handleFormSubmit,
    mode,
    initialData,
    fields,
    title,
    description,
    topContent,
    width = 450,
    buttonLabels,
    auditMetaData,
    t = (key: string) => key,
    loading = false,
    children,
    layout = 'default',
}: EntityFormModalProps<TFormData>) {
    const [form] = Form.useForm<TFormData>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = theme.useToken();
    const isEditMode = mode === 'edit';
    const useTabbedLayout = layout === 'tabs' && children;

    // Get current title and description based on mode
    const currentTitle = isEditMode ? title?.edit : title?.create;
    const currentDescription = isEditMode ? description?.edit : description?.create;

    // Default button labels
    const defaultButtonLabels = {
        cancel: t('common.cancel'),
        create: t('common.create'),
        edit: t('common.update'),
        saving: t('common.loading'),
    };
    const labels = { ...defaultButtonLabels, ...buttonLabels };

    const handleCancel = () => {
        onOpenChange(false);
        setTimeout(() => form.resetFields(), 300);
    };

    const onSubmit = async (values: TFormData) => {
        try {
            setIsSubmitting(true);
            await handleFormSubmit(values, mode);
            onOpenChange(false);
            setTimeout(() => form.resetFields(), 300);
        } catch (error: unknown) {
            if (!(error instanceof Error) || error.message !== 'CONFIRMATION_PENDING') {
                console.error('Error submitting form:', error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Initialize form with data when modal opens
     */
    useEffect(() => {
        if (open) {
            if (isEditMode && initialData) {
                form.setFieldsValue(initialData);
            } else {
                form.resetFields();
                // Set default values for create mode
                const defaultValues: Record<string, unknown> = {};
                fields.forEach((field) => {
                    if (field.defaultValue !== undefined) {
                        defaultValues[field.name] = field.defaultValue;
                    }
                });
                if (initialData) {
                    Object.assign(defaultValues, initialData);
                }
                if (Object.keys(defaultValues).length > 0) {
                    form.setFieldsValue(defaultValues as Partial<TFormData>);
                }
            }
        }
    }, [open, mode, initialData, form, isEditMode, fields]);

    /**
     * Check if field should be hidden
     */
    const isFieldHidden = (field: FormFieldConfig): boolean => {
        if (typeof field.hidden === 'function') {
            return field.hidden(mode);
        }
        return field.hidden || false;
    };

    /**
     * Check if field should be disabled
     */
    const isFieldDisabled = (field: FormFieldConfig): boolean => {
        if (typeof field.disabled === 'function') {
            return field.disabled(mode);
        }
        return field.disabled || false;
    };

    /**
     * Get validation rules for a field
     */
    const getFieldRules = (field: FormFieldConfig) => {
        const rules = field.rules || [];

        // Add required rule if specified
        if (field.required && !rules.some((rule) => 'required' in rule && rule.required)) {
            rules.unshift({
                required: true,
                message: `${field.label} is required`,
            });
        }

        return rules;
    };

    /**
     * Render a single form field
     */
    const renderFormField = (field: FormFieldConfig) => {
        if (isFieldHidden(field)) {
            return null;
        }

        const span = field.span || { xs: 24 };
        const staticDisabled = isFieldDisabled(field);

        // If field has dynamic disable logic, wrap with shouldUpdate
        if (field.disabledWhen && field.dependencies) {
            return (
                <Col key={field.name} {...span}>
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) =>
                            field.dependencies!.some((dep) => prev[dep] !== curr[dep])
                        }
                    >
                        {({ getFieldsValue }) => {
                            const values = getFieldsValue();
                            const dynamicDisabled = field.disabledWhen!(values);
                            const disabled = staticDisabled || dynamicDisabled;
                            return (
                                <Form.Item
                                    label={field.label}
                                    name={field.name}
                                    rules={getFieldRules(field)}
                                    extra={field.extra}
                                    {...(field.type === 'switch'
                                        ? { valuePropName: 'checked' }
                                        : {})}
                                >
                                    {renderField({ ...field, disabled })}
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                </Col>
            );
        }

        return (
            <Col key={field.name} {...span}>
                <Form.Item
                    label={field.label}
                    name={field.name}
                    rules={getFieldRules(field)}
                    extra={field.extra}
                    {...(field.render ? { help: '' } : {})}
                    {...(field.type === 'switch' ? { valuePropName: 'checked' } : {})}
                >
                    {renderField({ ...field, disabled: staticDisabled })}
                </Form.Item>
            </Col>
        );
    };

    return (
        <Modal
            title={currentTitle}
            open={open}
            onCancel={handleCancel}
            width={width}
            footer={null}
            destroyOnHidden
            mask={{ closable: !isSubmitting }}
        >
            {currentDescription && (
                <p style={{ color: token.colorTextSecondary, marginBottom: 24 }}>
                    {currentDescription}
                </p>
            )}
            {topContent && <div style={{ marginBottom: 18 }}>{topContent}</div>}

            {loading ? (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        {fields
                            .filter((field) => !isFieldHidden(field))
                            .map((field) => {
                                const span = field.span || { xs: 24 };
                                return (
                                    <Col key={field.name} {...span} style={{ marginBottom: 24 }}>
                                        <Skeleton.Input
                                            active
                                            size="small"
                                            style={{ width: 100, marginBottom: 8 }}
                                        />
                                        <Skeleton.Input active block style={{ height: 32 }} />
                                    </Col>
                                );
                            })}
                    </Row>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                            marginTop: 16,
                        }}
                    >
                        <Skeleton.Button active style={{ width: 80 }} />
                        <Skeleton.Button active style={{ width: 80 }} />
                    </div>
                </div>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onSubmit}
                    onFinishFailed={({ errorFields }) => {
                        if (errorFields.length > 0) {
                            const firstError = errorFields[0];
                            const fieldLabel =
                                fields.find((f) => f.name === firstError.name[0])?.label ||
                                firstError.name[0];
                            const errorMsg = firstError.errors[0];

                            toast.error(`${fieldLabel}: ${errorMsg}`);

                            if (errorFields.length > 1) {
                                console.log(
                                    'Additional validation errors:',
                                    errorFields.slice(1).map((e) => {
                                        const label =
                                            fields.find((f) => f.name === e.name[0])?.label ||
                                            e.name[0];
                                        return `${label}: ${e.errors[0]}`;
                                    })
                                );
                            }
                        }
                    }}
                    disabled={isSubmitting}
                    autoComplete="off"
                    scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
                >
                    {useTabbedLayout ? (
                        <Tabs
                            defaultActiveKey="details"
                            items={[
                                {
                                    key: 'details',
                                    label: isEditMode ? t('common.details') : t('common.create'),
                                    children: (
                                        <Row gutter={16}>
                                            {fields.map((field) => renderFormField(field))}
                                        </Row>
                                    ),
                                },

                                {
                                    key: 'shiftBreaks',
                                    label: t('industryFilterManagement.shiftBreaks.title'),
                                    children,
                                },
                            ]}
                        />
                    ) : (
                        <>
                            <Row gutter={16}>{fields.map((field) => renderFormField(field))}</Row>

                            {children}
                        </>
                    )}

                    {/* Audit Information - Only show in edit mode */}
                    {isEditMode && auditMetaData && (
                        <>
                            <Divider style={{ margin: '16px 0' }} />
                            <Title level={5} style={{ marginBottom: 12 }}>
                                {t('common.auditInfo.title')}
                            </Title>
                            <Descriptions
                                bordered
                                column={2}
                                size="small"
                                style={{ marginBottom: 16 }}
                            >
                                <Descriptions.Item label={t('common.auditInfo.createdAt')} span={2}>
                                    <Text type="secondary">
                                        {auditMetaData.createdAt
                                            ? dayjs(auditMetaData.createdAt).format(
                                                  'DD/MM/YYYY HH:mm:ss'
                                              )
                                            : '-'}
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={t('common.auditInfo.createdBy')} span={2}>
                                    <Text type="secondary">{auditMetaData.createdBy || '-'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={t('common.auditInfo.updatedAt')} span={2}>
                                    <Text type="secondary">
                                        {auditMetaData.updatedAt
                                            ? dayjs(auditMetaData.updatedAt).format(
                                                  'DD/MM/YYYY HH:mm:ss'
                                              )
                                            : '-'}
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={t('common.auditInfo.updatedBy')} span={2}>
                                    <Text type="secondary">{auditMetaData.updatedBy || '-'}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </>
                    )}

                    {/* Footer Buttons */}
                    <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={handleCancel} disabled={isSubmitting}>
                                {labels.cancel}
                            </Button>
                            <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                {isSubmitting
                                    ? labels.saving
                                    : isEditMode
                                      ? labels.edit
                                      : labels.create}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            )}
        </Modal>
    );
}
