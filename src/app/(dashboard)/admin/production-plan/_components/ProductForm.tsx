'use client';

import { Col, Divider, Form, Input, InputNumber, Row, theme } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import { getTodayScheduleIndex, WEEK_DAY_KEYS } from '../utils/dateUtils';

interface ProductFormProps {
    form: FormInstance;
    mode: 'create' | 'edit';
}

export default function ProductForm({ form, mode }: ProductFormProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const todayIndex = getTodayScheduleIndex();

    const scheduleValues: (number | undefined)[] = Form.useWatch('schedule', form) ?? [];
    const pcsMultiplier: number = Form.useWatch('pcsMultiplier', form) ?? 1;

    const totalCases = scheduleValues.reduce<number>((sum, q) => sum + (q ?? 0), 0);
    const totalPcs = totalCases * pcsMultiplier;

    return (
        <>
            <Divider orientation="horizontal" style={{ marginTop: 8 }} styles={{ content: { margin: 0 } }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>
                    {t('productionPlan.form.sections.productInfo')}
                </span>
            </Divider>

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="code"
                        label={t('productionPlan.form.fields.code.label')}
                        rules={[{ required: true, message: t('productionPlan.form.fields.code.required') }]}
                    >
                        <Input
                            placeholder={t('productionPlan.form.fields.code.placeholder')}
                            disabled={mode === 'edit'}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                    <Form.Item
                        name="name"
                        label={t('productionPlan.form.fields.name.label')}
                        rules={[{ required: true, message: t('productionPlan.form.fields.name.required') }]}
                    >
                        <Input placeholder={t('productionPlan.form.fields.name.placeholder')} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="machine"
                        label={t('productionPlan.form.fields.machine.label')}
                        rules={[{ required: true, message: t('productionPlan.form.fields.machine.required') }]}
                    >
                        <Input placeholder={t('productionPlan.form.fields.machine.placeholder')} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="mold"
                        label={t('productionPlan.form.fields.mold.label')}
                        rules={[{ required: true, message: t('productionPlan.form.fields.mold.required') }]}
                    >
                        <Input placeholder={t('productionPlan.form.fields.mold.placeholder')} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="time"
                        label={t('productionPlan.form.fields.time.label')}
                        rules={[{ required: true, message: t('productionPlan.form.fields.time.required') }]}
                    >
                        <Input placeholder={t('productionPlan.form.fields.time.placeholder')} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="pcsMultiplier"
                        label={t('productionPlan.form.fields.pcsMultiplier.label')}
                        rules={[{ required: true, message: t('productionPlan.form.fields.pcsMultiplier.required') }]}
                    >
                        <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Divider titlePlacement="left" styles={{ content: { margin: 0 } }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: token.colorTextSecondary }}>
                    {t('productionPlan.form.sections.schedule')}
                </span>
            </Divider>

            <Row gutter={[10, 8]}>
                {WEEK_DAY_KEYS.map((dayKey, index) => {
                    const isToday = index === todayIndex;
                    const day = t(`productionPlan.days.full.${dayKey}`);
                    return (
                        <Col key={day} flex="1 1 88px">
                            <div
                                style={{
                                    padding: '8px 8px 6px',
                                    borderRadius: 8,
                                    background: isToday ? token.colorPrimaryBg : token.colorFillAlter,
                                    border: `1px solid ${isToday ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: isToday ? 700 : 500,
                                        color: isToday ? token.colorPrimary : token.colorTextSecondary,
                                        textAlign: 'center',
                                        marginBottom: 2,
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {day}
                                    {isToday && (
                                        <span
                                            style={{
                                                display: 'block',
                                                fontSize: 10,
                                                color: token.colorPrimary,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {t('productionPlan.days.today')}
                                        </span>
                                    )}
                                </div>
                                <Form.Item
                                    name={['schedule', index]}
                                    rules={[{ required: true, message: '' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <InputNumber
                                        min={0}
                                        precision={0}
                                        style={{ width: '100%' }}
                                        variant={isToday ? 'filled' : 'outlined'}
                                    />
                                </Form.Item>
                            </div>
                        </Col>
                    );
                })}
            </Row>

            <div
                style={{
                    marginTop: 14,
                    padding: '12px 20px',
                    background: token.colorFillAlter,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    display: 'flex',
                    gap: 32,
                    alignItems: 'center',
                }}
            >
                <div>
                    <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 2 }}>
                        {t('productionPlan.form.summary.totalCasesWeek')}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: token.colorText, lineHeight: 1 }}>
                        {totalCases.toLocaleString('vi-VN')}
                    </div>
                </div>
                <div style={{ width: 1, height: 32, background: token.colorBorder }} />
                <div>
                    <div style={{ fontSize: 12, color: token.colorTextTertiary, marginBottom: 2 }}>
                        {t('productionPlan.form.summary.totalPcsWeek')}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: token.colorPrimary, lineHeight: 1 }}>
                        {totalPcs.toLocaleString('vi-VN')}
                    </div>
                </div>
            </div>
        </>
    );
}
