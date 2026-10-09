'use client';

import { useEffect } from 'react';
import { Form, Modal, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Mold } from '@/types/Mold';
import type { PlanFormValues, SelectOptionVM } from './types';
import ProductForm from './ProductForm';

interface PlanFormModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    /** Giá trị khởi tạo — page build từ PlanRowVM (edit) hoặc default date (create). */
    initialValues?: Partial<PlanFormValues>;
    /** Mã khuôn hiện tại của plan (edit) — hiển thị khi không đổi khuôn. */
    currentMoldCode?: string | null;
    /** Danh sách khuôn đầy đủ — ProductForm dùng tra operationType để lọc máy tương thích. */
    molds: Mold[];
    moldOptions: SelectOptionVM[];
    submitting?: boolean;
    onCancel: () => void;
    onSubmit: (values: PlanFormValues) => void;
}

export default function PlanFormModal({
    open,
    mode,
    initialValues,
    currentMoldCode,
    molds,
    moldOptions,
    submitting,
    onCancel,
    onSubmit,
}: PlanFormModalProps) {
    const [form] = Form.useForm<PlanFormValues>();
    const { t } = useTranslation();

    useEffect(() => {
        if (!open) return;
        form.resetFields();
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [form, initialValues, open]);

    const handleFinish = (values: PlanFormValues) => {
        onSubmit({
            ...values,
            code: values.code.trim(),
            name: values.name.trim(),
            note: values.note?.trim() || undefined,
        });
    };

    const title = (
        <span>
            {mode === 'create'
                ? t('productionPlan.formModal.createTitle')
                : t('productionPlan.formModal.editTitle')}
            {mode === 'edit' && initialValues?.code && (
                <Tag color="processing" style={{ marginLeft: 8, fontWeight: 400, fontSize: 12 }}>
                    {initialValues.code}
                </Tag>
            )}
        </span>
    );

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            okText={mode === 'create' ? t('common.create') : t('common.save')}
            cancelText={t('common.cancel')}
            confirmLoading={submitting}
            destroyOnHidden
            width={720}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <ProductForm
                    form={form}
                    mode={mode}
                    molds={molds}
                    moldOptions={moldOptions}
                    currentMoldCode={currentMoldCode}
                />
            </Form>
        </Modal>
    );
}
