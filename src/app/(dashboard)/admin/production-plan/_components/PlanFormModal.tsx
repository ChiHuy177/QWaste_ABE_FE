'use client';

import { useEffect } from 'react';
import { Col, Form, Input, InputNumber, Modal, Row } from 'antd';
import { WEEK_DAYS } from './dateUtils';
import { ProductionProduct, Schedule } from './types';

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
            schedule: values.schedule.map((quantity) => quantity ?? 0) as Schedule,
        });
    };

    return (
        <Modal
            title={mode === 'create' ? `Thêm kế hoạch - ${lineName}` : 'Sửa kế hoạch'}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            okText="Lưu"
            cancelText="Hủy"
            width={760}
            destroyOnHidden
        >
            <Form<PlanFormValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={handleFinish}
            >
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="code"
                            label="Mã Code"
                            rules={[{ required: true, message: 'Vui lòng nhập mã code' }]}
                        >
                            <Input placeholder="VD: P-1001" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={16}>
                        <Form.Item
                            name="name"
                            label="Tên hàng"
                            rules={[{ required: true, message: 'Vui lòng nhập tên hàng' }]}
                        >
                            <Input placeholder="Tên sản phẩm" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="machine"
                            label="Máy"
                            rules={[{ required: true, message: 'Vui lòng nhập máy' }]}
                        >
                            <Input placeholder="VD: CNC-01" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="mold"
                            label="Khuôn"
                            rules={[{ required: true, message: 'Vui lòng nhập mã khuôn' }]}
                        >
                            <Input placeholder="VD: M-12A" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="time"
                            label="Thời gian"
                            rules={[{ required: true, message: 'Vui lòng nhập thời gian' }]}
                        >
                            <Input placeholder="08:00 - 10:30" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="pcsMultiplier"
                            label="Cái / thùng"
                            rules={[{ required: true, message: 'Vui lòng nhập hệ số' }]}
                        >
                            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{ fontWeight: 600, marginBottom: 10 }}>Kế hoạch 7 ngày</div>
                <Row gutter={[12, 12]}>
                    {WEEK_DAYS.map((day, index) => (
                        <Col xs={12} sm={8} md={6} flex="1 1 96px" key={day}>
                            <Form.Item
                                name={['schedule', index]}
                                label={day}
                                rules={[{ required: true, message: 'Nhập số thùng' }]}
                            >
                                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    ))}
                </Row>
            </Form>
        </Modal>
    );
}
