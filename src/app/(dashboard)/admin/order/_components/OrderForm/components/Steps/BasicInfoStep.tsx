'use client';

import React from 'react';
import {
    Form,
    Input,
    Select,
    DatePicker,
    InputNumber,
    Row,
    Col,
    Space,
    Divider,
    Typography,
    Collapse,
    theme,
} from 'antd';
import { CalendarOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { OrderResponse } from '@/types/Order';

import { OrderOverviewStats } from '../OrderOverviewStats';
import {
    createOrderCodeRules,
    createOrderNameRules,
    createCustomerNameRules,
    createCustomerPhoneRules,
    createCustomerNoteRules,
    createExpectedEndDateRules,
    createOrderPriorityRules,
} from '../../utils/validators';
import { PRIORITY_OPTIONS } from '../../constants';
import { formatCurrency, parseCurrency } from '../../utils/formatters';
import { OrderAttachmentsUploader } from '../OrderAttachmentUploader';

const { Text } = Typography;
const { useToken } = theme;

interface BasicInfoStepProps {
    isEditMode?: boolean;
    currentOrder?: OrderResponse | null;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
    isEditMode = false,
    currentOrder,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* OVERVIEW STATISTICS (EDIT MODE) */}
            {isEditMode && currentOrder && <OrderOverviewStats currentOrder={currentOrder} />}

            {/* THÔNG TIN ĐƠN HÀNG — orderCode + orderName + orderPriority */}
            <div>
                <Divider orientation="left" orientationMargin={0}>
                    <Text strong style={{ fontSize: 15 }}>
                        {t('orderManagement.form.sections.orderInfo')}
                    </Text>
                </Divider>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="orderCode"
                            label={<Text strong>{t('orderManagement.form.fields.orderCode')}</Text>}
                            rules={createOrderCodeRules(t)}
                        >
                            <Input
                                placeholder={t('orderManagement.form.placeholders.orderCode')}
                                maxLength={50}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="orderName"
                            label={<Text strong>{t('orderManagement.form.fields.orderName')}</Text>}
                            rules={createOrderNameRules(t)}
                        >
                            <Input
                                placeholder={t('orderManagement.form.placeholders.orderName')}
                                maxLength={200}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="orderPriority"
                            label={<Text strong>{t('orderManagement.form.fields.priority')}</Text>}
                            rules={createOrderPriorityRules(t)}
                        >
                            <Select
                                options={PRIORITY_OPTIONS.map((opt) => ({
                                    value: opt.value,
                                    label: t(opt.labelKey),
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            {/* THÔNG TIN KHÁCH HÀNG — required fields */}
            <div>
                <Divider orientation="left" orientationMargin={0}>
                    <Text strong style={{ fontSize: 15 }}>
                        {t('orderManagement.form.sections.customerInfo')}
                    </Text>
                </Divider>
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="customerName"
                            label={
                                <Text strong>
                                    {t('orderManagement.form.fields.customerName')}
                                </Text>
                            }
                            rules={createCustomerNameRules(t)}
                        >
                            <Input
                                placeholder={t('orderManagement.form.placeholders.customerName')}
                                maxLength={200}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            name="customerPhone"
                            label={
                                <Text strong>
                                    {t('orderManagement.form.fields.customerPhone')}
                                </Text>
                            }
                            normalize={(value) => value.replace(/\D/g, '')}
                            rules={createCustomerPhoneRules(t)}
                        >
                            <Input
                                placeholder={t('orderManagement.form.placeholders.customerPhone')}
                                maxLength={20}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item
                            name="customerNote"
                            label={
                                <Text strong>
                                    {t('orderManagement.form.fields.customerNote')}
                                </Text>
                            }
                            rules={createCustomerNoteRules(t)}
                        >
                            <Input.TextArea
                                placeholder={t('orderManagement.form.placeholders.customerNote')}
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                maxLength={2000}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            {/* THÔNG TIN THÊM — optional, collapsed by default */}
            <Collapse
                ghost
                defaultActiveKey={[]}
                style={{
                    border: `1px dashed ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG,
                    background: token.colorFillAlter,
                }}
                items={[
                    {
                        key: 'optional',
                        label: (
                            <Space size={6}>
                                <CalendarOutlined style={{ color: token.colorTextSecondary }} />
                                <PaperClipOutlined style={{ color: token.colorTextSecondary }} />
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {t('orderManagement.form.sections.additionalInfo')}
                                </Text>
                            </Space>
                        ),
                        children: (
                            <Row gutter={[16, 0]}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="expectedStartDate"
                                        label={
                                            <Text strong>
                                                {t('orderManagement.form.fields.expectedStartDate')}
                                            </Text>
                                        }
                                    >
                                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="expectedEndDate"
                                        label={
                                            <Text strong>
                                                {t('orderManagement.form.fields.expectedEndDate')}
                                            </Text>
                                        }
                                        dependencies={['expectedStartDate']}
                                        rules={createExpectedEndDateRules(t)}
                                    >
                                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                                    </Form.Item>
                                </Col>

                                {isEditMode && (
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="penaltyAmount"
                                            label={
                                                <Text strong>
                                                    {t('orderManagement.form.fields.penaltyAmount')}
                                                </Text>
                                            }
                                        >
                                            <InputNumber
                                                min={0}
                                                style={{ width: '100%' }}
                                                formatter={(value) => formatCurrency(value)}
                                                parser={(value) => parseCurrency(value) as any}
                                                placeholder={t(
                                                    'orderManagement.form.placeholders.penaltyAmount'
                                                )}
                                                maxLength={15}
                                            />
                                        </Form.Item>
                                    </Col>
                                )}

                                <Col xs={24}>
                                    <Form.Item
                                        name="attachments"
                                        label={
                                            <Text strong>
                                                {t('orderManagement.form.fields.attachments')}
                                            </Text>
                                        }
                                    >
                                        <OrderAttachmentsUploader />
                                    </Form.Item>
                                </Col>
                            </Row>
                        ),
                    },
                ]}
            />
        </Space>
    );
};
