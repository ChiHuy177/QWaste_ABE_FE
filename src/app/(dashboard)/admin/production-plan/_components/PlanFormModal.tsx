'use client';

import { useEffect } from 'react';
import { Form, Modal, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ProductionProduct, Schedule } from './types';
import ProductForm from './ProductForm';

interface PlanFormModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialData?: ProductionProduct;
    lineName?: string;
    onCancel: () => void;
    onSubmit: (product: ProductionProduct) => void;
}

interface PlanFormValues {
    code: string;
    name: string;
    machine: string;
    mold: string;
    time: string;
    pcsMultiplier: number;
    schedule: number[];
}

const createEmptyValues = (): PlanFormValues => ({
    code: '',
    name: '',
    machine: '',
    mold: '',
    time: '',
    pcsMultiplier: 1,
    schedule: [0, 0, 0, 0, 0, 0, 0],
});

export default function PlanFormModal({
    open,
    mode,
    initialData,
    lineName,
    onCancel,
    onSubmit,
}: PlanFormModalProps) {
    const [form] = Form.useForm<PlanFormValues>();
    const { t } = useTranslation();

    useEffect(() => {
        if (!open) return;
        form.setFieldsValue(initialData ?? createEmptyValues());
    }, [form, initialData, open]);

    const handleFinish = (values: PlanFormValues) => {
        onSubmit({
            code: values.code.trim(),
            name: values.name.trim(),
            machine: values.machine.trim(),
            mold: values.mold.trim(),
            time: values.time.trim(),
            pcsMultiplier: values.pcsMultiplier,
            schedule: values.schedule.map((q) => q ?? 0) as Schedule,
        });
    };

    const title = (
        <span>
            {mode === 'create'
                ? t('productionPlan.formModal.createTitle')
                : t('productionPlan.formModal.editTitle')}
            {lineName && (
                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400, fontSize: 12 }}>
                    {lineName}
                </Tag>
            )}
            {mode === 'edit' && initialData?.code && (
                <Tag color="processing" style={{ marginLeft: 4, fontWeight: 400, fontSize: 12 }}>
                    {initialData.code}
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
            okText={t('common.save')}
            cancelText={t('common.cancel')}
            width={800}
            destroyOnHidden
        >
            <Form<PlanFormValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={handleFinish}
            >
                <ProductForm form={form} mode={mode} />
            </Form>
        </Modal>
    );
}
