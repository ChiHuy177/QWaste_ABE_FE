'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Flex, Form, Modal, Row, Space, Spin, Tag, Typography, theme } from 'antd';
import {
    EnvironmentOutlined,
    ToolOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    HourglassOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { MachineIncidentItem, MachineIncidentUpdateRequest } from '@/types/MachineIncident';
import { MachineIncidentService } from '@/services/MachineIncidentService';
import { renderField } from '@/components/shared/FormModal';
import { getErrorManagementFormFields } from './errorManagementFormConfig';

const { Text } = Typography;

interface CreateOrEditErrorModalProps {
    open: boolean;
    incident: MachineIncidentItem | null;
    onCancel: () => void;
    onSubmit: (values: MachineIncidentUpdateRequest) => Promise<void>;
    loading?: boolean;
}

export const CreateOrEditErrorModal: React.FC<CreateOrEditErrorModalProps> = ({
    open,
    incident,
    onCancel,
    onSubmit,
    loading = false,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [form] = Form.useForm<MachineIncidentUpdateRequest>();
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [detailData, setDetailData] = useState<MachineIncidentItem | null>(incident);

    const currentIncident = detailData || incident;
    const formFields = useMemo(() => getErrorManagementFormFields(t, 'edit'), [t]);

    useEffect(() => {
        if (open && incident?.machineIncidentId) {
            setDetailData(incident);
            let isMounted = true;
            const fetchDetail = async () => {
                try {
                    setFetchingDetail(true);
                    const data = await MachineIncidentService.getIncidentDetail(
                        incident.machineIncidentId
                    );
                    if (isMounted && data) {
                        setDetailData(data);
                        form.setFieldsValue({
                            rootCause: data.rootCause || '',
                            resolution: data.resolution || '',
                        });
                    }
                } catch (err) {
                    console.error('Failed to fetch incident detail for edit:', err);
                    if (isMounted) {
                        form.setFieldsValue({
                            rootCause: incident.rootCause || '',
                            resolution: incident.resolution || '',
                        });
                    }
                } finally {
                    if (isMounted) {
                        setFetchingDetail(false);
                    }
                }
            };
            fetchDetail();

            return () => {
                isMounted = false;
            };
        } else if (!open) {
            setDetailData(null);
            form.resetFields();
        }
    }, [open, incident, form]);

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        const d = dayjs(dateStr);
        return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : dateStr;
    };

    const formatDuration = (minutes?: number | null) => {
        if (minutes === null || minutes === undefined || minutes < 0) return '—';
        if (minutes === 0) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    };

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            await onSubmit({
                rootCause: values.rootCause.trim(),
                resolution: values.resolution?.trim() || undefined,
            });
        } catch (_err) {
            // Form validation error caught by AntD Form
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            onOk={handleFormSubmit}
            confirmLoading={loading}
            okButtonProps={{ disabled: fetchingDetail }}
            okText={t('errorManagement.modal.submit')}
            cancelText={t('errorManagement.modal.cancel')}
            width={680}
            destroyOnHidden
            title={
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        paddingBottom: 4,
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: token.borderRadiusLG,
                            background: token.colorPrimaryBg,
                            border: `1px solid ${token.colorPrimaryBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ToolOutlined
                            style={{
                                fontSize: 22,
                                color: token.colorPrimary,
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap={8} wrap="wrap">
                            <span
                                style={{
                                    fontSize: 17,
                                    fontWeight: 700,
                                    color: token.colorTextHeading,
                                    lineHeight: 1.3,
                                }}
                            >
                                {t('errorManagement.modal.editTitle')}
                            </span>
                            {currentIncident?.incidentCode && (
                                <Tag
                                    style={{
                                        margin: 0,
                                        fontFamily: 'monospace',
                                        fontWeight: 700,
                                        fontSize: 12.5,
                                        padding: '2px 8px',
                                        borderRadius: token.borderRadiusSM,
                                        background: token.colorPrimaryBg,
                                        color: token.colorPrimary,
                                        border: `1px solid ${token.colorPrimaryBorder}`,
                                    }}
                                >
                                    {currentIncident.incidentCode}
                                </Tag>
                            )}
                        </Flex>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12.5,
                                display: 'block',
                                marginTop: 3,
                                lineHeight: 1.4,
                            }}
                        >
                            {t('errorManagement.modal.editSubtitle')}
                        </Text>
                    </div>
                </div>
            }
        >
            <Spin spinning={fetchingDetail}>
                {/* Auto-Captured Incident Overview Hero Card */}
                {currentIncident && (
                    <Card
                        styles={{ body: { padding: '14px 18px' } }}
                        style={{
                            background: token.colorFillQuaternary,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderLeft: `4px solid ${token.colorPrimary}`,
                            borderRadius: token.borderRadiusLG,
                            marginTop: 16,
                            marginBottom: 20,
                        }}
                    >
                        {/* Machine & Location Top Header */}
                        <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={12}
                            style={{ marginBottom: 12 }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Flex align="center" gap={8} wrap="wrap">
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 14.5,
                                            color: token.colorTextHeading,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {currentIncident.machineName || '—'}
                                    </Text>
                                    {currentIncident.machineCode && (
                                        <Tag
                                            style={{
                                                margin: 0,
                                                fontFamily: 'monospace',
                                                fontSize: 11.5,
                                                borderRadius: token.borderRadiusSM,
                                            }}
                                        >
                                            {currentIncident.machineCode}
                                        </Tag>
                                    )}
                                </Flex>
                                <Space size={4} align="center" style={{ marginTop: 4 }}>
                                    <EnvironmentOutlined
                                        style={{
                                            color: token.colorTextSecondary,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12.5 }}>
                                        {currentIncident.location || '—'}
                                    </Text>
                                </Space>
                            </div>

                            <Flex align="center" gap={8}>
                                {currentIncident.status === 'RESOLVED' ? (
                                    <Tag
                                        color="success"
                                        style={{
                                            margin: 0,
                                            borderRadius: token.borderRadiusSM,
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                        }}
                                    >
                                        <CheckCircleOutlined style={{ marginRight: 4 }} />
                                        {t('errorManagement.table.resolvedBadge')}
                                    </Tag>
                                ) : (
                                    <Tag
                                        color="warning"
                                        style={{
                                            margin: 0,
                                            borderRadius: token.borderRadiusSM,
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                        }}
                                    >
                                        <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                                        {t('errorManagement.table.waitingUpdateBadge')}
                                    </Tag>
                                )}
                            </Flex>
                        </Flex>

                        {/* Timeline & Downtime Metrics Strip */}
                        <div
                            style={{
                                paddingTop: 10,
                                borderTop: `1px dashed ${token.colorBorderSecondary}`,
                            }}
                        >
                            <Row gutter={[16, 8]} align="middle">
                                <Col xs={24} sm={8}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11.5, display: 'block' }}
                                    >
                                        {t('errorManagement.table.columns.startTime')}:
                                    </Text>
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: 12,
                                            color: token.colorText,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {formatDateTime(currentIncident.startTime)}
                                    </span>
                                </Col>

                                <Col xs={24} sm={8}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11.5, display: 'block' }}
                                    >
                                        {t('errorManagement.table.columns.endTime')}:
                                    </Text>
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            fontSize: 12,
                                            color: token.colorText,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {formatDateTime(currentIncident.endTime)}
                                    </span>
                                </Col>

                                <Col xs={24} sm={8}>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 11.5, display: 'block' }}
                                    >
                                        {t('errorManagement.table.columns.duration')}:
                                    </Text>
                                    <Tag
                                        color={
                                            (currentIncident.durationMinutes ?? 0) > 60
                                                ? 'error'
                                                : (currentIncident.durationMinutes ?? 0) > 30
                                                  ? 'warning'
                                                  : 'default'
                                        }
                                        style={{
                                            margin: 0,
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            fontSize: 12,
                                            borderRadius: token.borderRadiusSM,
                                        }}
                                    >
                                        <HourglassOutlined style={{ marginRight: 4 }} />
                                        {formatDuration(currentIncident.durationMinutes)}
                                    </Tag>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                )}

                {/* Input Form for Root Cause and Resolution */}
                <Form form={form} layout="vertical">
                    <Row gutter={[16, 16]}>
                        {formFields.map((field) => {
                            const span = field.span || { xs: 24 };
                            return (
                                <Col key={field.name} {...span}>
                                    <Form.Item
                                        name={field.name}
                                        label={field.label}
                                        rules={field.rules}
                                        required={field.required}
                                    >
                                        {renderField({
                                            ...field,
                                            disabled: fetchingDetail || loading,
                                        })}
                                    </Form.Item>
                                </Col>
                            );
                        })}
                    </Row>
                </Form>
            </Spin>
        </Modal>
    );
};
