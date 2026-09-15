'use client';

import React, { useEffect } from 'react';
import {
    Badge,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    theme,
} from 'antd';
import {
    ClockCircleOutlined,
    EnvironmentOutlined,
    SyncOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CreateErrorIncidentDto, ErrorIncident } from '@/types/ErrorManagement';

const { TextArea } = Input;
const { Text } = Typography;

interface CreateOrEditErrorModalProps {
    open: boolean;
    incident: ErrorIncident | null;
    onCancel: () => void;
    onSubmit: (values: CreateErrorIncidentDto) => Promise<void>;
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
    const [form] = Form.useForm();

    const watchedStatus = Form.useWatch('status', form);
    const watchedEndTime = Form.useWatch('endTime', form);

    const isResolved = watchedStatus === 'resolved' || watchedStatus === 'closed';

    useEffect(() => {
        if (open) {
            if (incident) {
                form.setFieldsValue({
                    cause: incident.cause || '',
                    resolution: incident.resolution || '',
                    status: incident.status,
                    endTime: incident.endTime ? dayjs(incident.endTime) : null,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    cause: '',
                    resolution: '',
                    status: 'open',
                    endTime: null,
                });
            }
        }
    }, [open, incident, form]);

    // When status changes to resolved/closed, auto-populate endTime if empty
    useEffect(() => {
        if (open && isResolved) {
            const currentEndTime = form.getFieldValue('endTime');
            if (!currentEndTime) {
                form.setFieldValue('endTime', dayjs());
            }
        }
    }, [open, isResolved, form]);

    // Live calculation of duration from Start Time to End Time
    const calculatedDurationText = React.useMemo(() => {
        if (!isResolved || !watchedEndTime || !incident?.startTime) return null;
        const start = dayjs(incident.startTime);
        const end = dayjs(watchedEndTime);
        if (!start.isValid() || !end.isValid()) return null;
        const diffMinutes = Math.max(0, end.diff(start, 'minute'));
        const h = Math.floor(diffMinutes / 60);
        const m = diffMinutes % 60;
        if (h === 0) return `${m}m`;
        return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    }, [isResolved, watchedEndTime, incident?.startTime]);

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();

            let formattedEndTime: string | null = null;
            if (values.endTime) {
                formattedEndTime = dayjs.isDayjs(values.endTime)
                    ? values.endTime.format('YYYY-MM-DD HH:mm:ss')
                    : values.endTime;
            } else if (values.status === 'resolved' || values.status === 'closed') {
                formattedEndTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            }

            let durationMinutes = incident?.durationMinutes || 0;
            if (formattedEndTime && incident?.startTime) {
                const diff = dayjs(formattedEndTime).diff(dayjs(incident.startTime), 'minute');
                durationMinutes = Math.max(0, diff);
            }

            const payload: CreateErrorIncidentDto = {
                machineId: incident?.machineId || 101,
                machineName: incident?.machineName || 'Thiết bị xưởng',
                machineCode: incident?.machineCode || 'MC-GEN',
                lineName: incident?.lineName || 'Chuyền sản xuất',
                zoneName: incident?.zoneName || 'Khu vực xưởng',
                category: incident?.category || 'mechanical',
                severity: incident?.severity || 'medium',
                status: values.status || incident?.status || 'open',
                startTime: incident?.startTime || dayjs().format('YYYY-MM-DD HH:mm:ss'),
                endTime: formattedEndTime,
                durationMinutes,
                cause: values.cause,
                resolution: values.resolution || '',
                notes: incident?.notes || '',
            };

            await onSubmit(payload);
        } catch (_err) {
            // Form validation error
        }
    };

    return (
        <Modal
            open={open}
            title={
                <div style={{ paddingBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: token.colorTextHeading }}>
                        {t('errorManagement.modal.editTitle')}
                    </div>
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 12.5,
                            fontWeight: 400,
                            display: 'block',
                            marginTop: 3,
                            lineHeight: 1.4,
                        }}
                    >
                        {t('errorManagement.modal.editSubtitle')}
                    </Text>
                </div>
            }
            onCancel={onCancel}
            onOk={handleFormSubmit}
            confirmLoading={loading}
            width={640}
            destroyOnHidden
            okText={t('errorManagement.modal.submit')}
            cancelText={t('errorManagement.modal.cancel')}
            style={{ top: 30 }}
        >
            {/* Auto-Captured Telemetry Header Card */}
            {incident && (
                <div
                    style={{
                        marginTop: 16,
                        marginBottom: 20,
                        padding: '14px 16px',
                        background: token.colorFillQuaternary,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderLeft: `4px solid ${token.colorPrimary}`,
                        borderRadius: token.borderRadiusLG,
                    }}
                >
                    {/* Top Header Row: Code, Machine Name, Source Tag */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            paddingBottom: 10,
                            marginBottom: 10,
                            borderBottom: `1px dashed ${token.colorBorderSecondary}`,
                        }}
                    >
                        <Space size={8} wrap>
                            <Tag
                                color="blue"
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: token.borderRadiusSM,
                                    margin: 0,
                                }}
                            >
                                {incident.code}
                            </Tag>
                            <Text strong style={{ fontSize: 14.5, color: token.colorTextHeading }}>
                                {incident.machineName}
                            </Text>
                            <Tag
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    margin: 0,
                                    borderRadius: token.borderRadiusSM,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {incident.machineCode}
                            </Tag>
                        </Space>

                        <Tag
                            icon={<ToolOutlined style={{ fontSize: 11 }} />}
                            color="cyan"
                            style={{
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 500,
                                padding: '2px 10px',
                                margin: 0,
                            }}
                        >
                            {t('errorManagement.modal.autoCaptured')}
                        </Tag>
                    </div>

                    {/* Metadata Grid with distinct Labels and Values */}
                    <Row gutter={[20, 10]}>
                        <Col xs={24} sm={12}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: '0.4px',
                                        textTransform: 'uppercase',
                                        color: token.colorTextSecondary,
                                    }}
                                >
                                    {t('errorManagement.modal.location')}
                                </span>
                                <Space size={6} align="center">
                                    <EnvironmentOutlined
                                        style={{ color: token.colorPrimary, fontSize: 13 }}
                                    />
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 13,
                                            color: token.colorText,
                                        }}
                                    >
                                        {incident.lineName} • {incident.zoneName}
                                    </Text>
                                </Space>
                            </div>
                        </Col>

                        <Col xs={24} sm={12}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: '0.4px',
                                        textTransform: 'uppercase',
                                        color: token.colorTextSecondary,
                                    }}
                                >
                                    {t('errorManagement.modal.startTime')}
                                </span>
                                <Space size={6} align="center">
                                    <ClockCircleOutlined
                                        style={{ color: token.colorWarning, fontSize: 13 }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontFamily: 'monospace',
                                            fontWeight: 600,
                                            color: token.colorText,
                                        }}
                                    >
                                        {incident.startTime}
                                    </span>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            {/* Section Header for Editable Content */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                }}
            >
                <Text
                    strong
                    style={{
                        fontSize: 12,
                        color: token.colorPrimary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}
                >
                    {t('errorManagement.modal.updateSection')}
                </Text>
                <div style={{ flex: 1, height: 1, background: token.colorBorderSecondary }} />
            </div>

            {/* Editable Form for Cause and Resolution */}
            <Form form={form} layout="vertical" requiredMark={false}>
                <Form.Item
                    name="cause"
                    label={
                        <Text strong style={{ fontSize: 13 }}>
                            {t('errorManagement.modal.cause')}{' '}
                            <span style={{ color: token.colorError }}>*</span>
                        </Text>
                    }
                    rules={[{ required: true, message: t('errorManagement.modal.causeRequired') }]}
                >
                    <TextArea
                        rows={3}
                        placeholder={t('errorManagement.modal.causePlaceholder')}
                        style={{ borderRadius: token.borderRadius }}
                    />
                </Form.Item>

                <Form.Item
                    name="resolution"
                    label={
                        <Text strong style={{ fontSize: 13 }}>
                            {t('errorManagement.modal.resolution')}{' '}
                            {isResolved && <span style={{ color: token.colorError }}>*</span>}
                        </Text>
                    }
                    rules={[
                        {
                            required: isResolved,
                            message: t('errorManagement.modal.resolutionRequired'),
                        },
                    ]}
                >
                    <TextArea
                        rows={3}
                        placeholder={t('errorManagement.modal.resolutionPlaceholder')}
                        style={{ borderRadius: token.borderRadius }}
                    />
                </Form.Item>

                <Row gutter={16}>
                    <Col xs={24} sm={isResolved ? 12 : 24}>
                        <Form.Item
                            name="status"
                            label={
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('errorManagement.modal.status')}{' '}
                                    <span style={{ color: token.colorError }}>*</span>
                                </Text>
                            }
                            rules={[{ required: true }]}
                        >
                            <Select
                                style={{ borderRadius: token.borderRadius }}
                                options={[
                                    {
                                        value: 'open',
                                        label: (
                                            <Space size={6}>
                                                <Badge status="error" />
                                                <span>{t('errorManagement.statuses.open')}</span>
                                            </Space>
                                        ),
                                    },
                                    {
                                        value: 'in_progress',
                                        label: (
                                            <Space size={6}>
                                                <SyncOutlined
                                                    spin
                                                    style={{ color: token.colorWarning }}
                                                />
                                                <span>
                                                    {t('errorManagement.statuses.in_progress')}
                                                </span>
                                            </Space>
                                        ),
                                    },
                                    {
                                        value: 'resolved',
                                        label: (
                                            <Space size={6}>
                                                <Badge status="success" />
                                                <span>
                                                    {t('errorManagement.statuses.resolved')}
                                                </span>
                                            </Space>
                                        ),
                                    },
                                    {
                                        value: 'closed',
                                        label: (
                                            <Space size={6}>
                                                <Badge status="default" />
                                                <span>{t('errorManagement.statuses.closed')}</span>
                                            </Space>
                                        ),
                                    },
                                ]}
                            />
                        </Form.Item>
                    </Col>

                    {isResolved && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="endTime"
                                label={
                                    <Text strong style={{ fontSize: 13 }}>
                                        {t('errorManagement.modal.endTime')}{' '}
                                        <span style={{ color: token.colorError }}>*</span>
                                    </Text>
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: t('errorManagement.modal.endTimeRequired'),
                                    },
                                ]}
                            >
                                <DatePicker
                                    showTime
                                    format="YYYY-MM-DD HH:mm:ss"
                                    style={{ width: '100%', borderRadius: token.borderRadius }}
                                />
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                {isResolved && calculatedDurationText && (
                    <div
                        style={{
                            marginBottom: 16,
                            padding: '10px 14px',
                            background: token.colorFillAlter,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: token.borderRadiusSM,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Space size={6}>
                            <ClockCircleOutlined style={{ color: token.colorPrimary }} />
                            <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                                {t('errorManagement.modal.durationCalculated')}:
                            </Text>
                        </Space>
                        <Tag
                            color="processing"
                            style={{
                                margin: 0,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: 12.5,
                                padding: '2px 8px',
                            }}
                        >
                            {calculatedDurationText}
                        </Tag>
                    </div>
                )}
            </Form>
        </Modal>
    );
};
