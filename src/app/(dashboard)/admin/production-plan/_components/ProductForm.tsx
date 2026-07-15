'use client';

import { Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, theme } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SelectOptionVM } from './types';

interface ProductFormProps {
    form: FormInstance;
    mode: 'create' | 'edit';
    machineOptions: SelectOptionVM[];
    moldOptions: SelectOptionVM[];
    /** Mã khuôn hiện tại của plan (edit) — hiển thị placeholder khi không đổi khuôn. */
    currentMoldCode?: string | null;
}

const filterOption = (input: string, option?: { label?: string }) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

export default function ProductForm({
    form: _form,
    mode,
    machineOptions,
    moldOptions,
    currentMoldCode,
}: ProductFormProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const isCreate = mode === 'create';

    return (
        <>
            <Divider
                orientation="horizontal"
                style={{ marginTop: 8 }}
                styles={{ content: { margin: 0 } }}
            >
                <span style={{ fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>
                    {t('productionPlan.form.sections.productInfo')}
                </span>
            </Divider>

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="code"
                        label={t('productionPlan.form.fields.code.label')}
                        rules={[
                            {
                                required: true,
                                message: t('productionPlan.form.fields.code.required'),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t('productionPlan.form.fields.code.placeholder')}
                            maxLength={100}
                            disabled={mode === 'edit'}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                    <Form.Item
                        name="name"
                        label={t('productionPlan.form.fields.name.label')}
                        rules={[
                            {
                                required: true,
                                message: t('productionPlan.form.fields.name.required'),
                            },
                        ]}
                    >
                        <Input
                            placeholder={t('productionPlan.form.fields.name.placeholder')}
                            maxLength={255}
                        />
                    </Form.Item>
                </Col>
                {isCreate && (
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="machineId"
                            label={t('productionPlan.form.fields.machine.label')}
                            rules={[
                                {
                                    required: true,
                                    message: t('productionPlan.form.fields.machine.required'),
                                },
                            ]}
                        >
                            <Select
                                showSearch={{ filterOption: filterOption }}
                                placeholder={t('productionPlan.form.fields.machine.placeholder')}
                                options={machineOptions}
                            />
                        </Form.Item>
                    </Col>
                )}
                <Col xs={24} md={8}>
                    <Form.Item
                        name="moldId"
                        label={t('productionPlan.form.fields.mold.label')}
                        rules={
                            isCreate
                                ? [
                                    {
                                        required: true,
                                        message: t('productionPlan.form.fields.mold.required'),
                                    },
                                ]
                                : undefined
                        }
                    >
                        <Select
                            showSearch={{ filterOption: filterOption }}
                            allowClear={!isCreate}
                            placeholder={
                                !isCreate && currentMoldCode
                                    ? t('productionPlan.form.fields.mold.keepCurrent', {
                                        mold: currentMoldCode,
                                    })
                                    : t('productionPlan.form.fields.mold.placeholder')
                            }
                            options={moldOptions}
                        />
                    </Form.Item>
                </Col>
                {isCreate && (
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="plannedDate"
                            label={t('productionPlan.form.fields.plannedDate.label')}
                            rules={[
                                {
                                    required: true,
                                    message: t('productionPlan.form.fields.plannedDate.required'),
                                },
                            ]}
                        >
                            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                )}
                <Col xs={24} md={8}>
                    <Form.Item
                        name="plannedQuantity"
                        label={t('productionPlan.form.fields.plannedQuantity.label')}
                        rules={[
                            {
                                required: true,
                                message: t('productionPlan.form.fields.plannedQuantity.required'),
                            },
                        ]}
                    >
                        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col xs={24}>
                    <Form.Item name="note" label={t('productionPlan.form.fields.note.label')}>
                        <Input.TextArea
                            rows={2}
                            maxLength={2000}
                            placeholder={t('productionPlan.form.fields.note.placeholder')}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
}
