'use client';

import React from 'react';
import {
    Button,
    Card,
    Col,
    Flex,
    Modal,
    Row,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
    theme,
} from 'antd';
import {
    ClockCircleOutlined,
    EditOutlined,
    EnvironmentOutlined,
    SyncOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    AuditOutlined,
    AlertOutlined,
    CloseOutlined,
    HourglassOutlined,
    CalendarOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { MachineIncidentItem } from '@/types/MachineIncident';
import { MachineIncidentService } from '@/services/MachineIncidentService';

const { Text, Paragraph } = Typography;

interface ErrorDetailModalProps {
    open: boolean;
    incident: MachineIncidentItem | null;
    onClose: () => void;
    onEdit: (incident: MachineIncidentItem) => void;
}

export const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({
    open,
    incident,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [fetchingDetail, setFetchingDetail] = React.useState(false);
    const [detailData, setDetailData] = React.useState<MachineIncidentItem | null>(incident);

    const currentIncident = detailData || incident;

    React.useEffect(() => {
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
                    }
                } catch (err) {
                    console.error('Failed to fetch incident detail:', err);
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
        }
    }, [open, incident]);

    if (!currentIncident) return null;

    const isOngoing = !currentIncident.endTime;

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        const d = dayjs(dateStr);
        return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : dateStr;
    };

    const formatDuration = (minutes?: number | null) => {
        if (minutes === null || minutes === undefined || minutes < 0) return '—';
        if (minutes === 0) return '0 phút';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m} phút`;
        return `${h} giờ ${m > 0 ? `${m} phút` : ''}`.trim();
    };

    const getDowntimeStyle = (minutes?: number | null) => {
        if (minutes === null || minutes === undefined || minutes < 0 || isOngoing) {
            return {
                main: token.colorError,
                bg: token.colorErrorBg,
                border: token.colorErrorBorder,
                text: token.colorErrorText,
            };
        }
        if (minutes > 60) {
            return {
                main: token.colorError,
                bg: token.colorErrorBg,
                border: token.colorErrorBorder,
                text: token.colorErrorText,
            };
        }
        if (minutes >= 30) {
            return {
                main: token.colorWarning,
                bg: token.colorWarningBg,
                border: token.colorWarningBorder,
                text: token.colorWarningText,
            };
        }
        return {
            main: token.colorInfo,
            bg: token.colorInfoBg,
            border: token.colorInfoBorder,
            text: token.colorInfoText,
        };
    };

    const renderStatusTag = () => {
        if (isOngoing) {
            return (
                <Tag
                    color="error"
                    style={{
                        borderRadius: token.borderRadiusSM,
                        fontWeight: 600,
                        padding: '2px 8px',
                        margin: 0,
                    }}
                >
                    <SyncOutlined spin style={{ marginRight: 4 }} />
                    {t('errorManagement.table.ongoingBadge')}
                </Tag>
            );
        }

        if (currentIncident?.status === 'IN_PROGRESS') {
            return (
                <Tag
                    color="warning"
                    style={{
                        borderRadius: token.borderRadiusSM,
                        fontWeight: 600,
                        padding: '2px 8px',
                        margin: 0,
                    }}
                >
                    <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                    {t('errorManagement.table.waitingUpdateBadge')}
                </Tag>
            );
        }

        return (
            <Tag
                color="success"
                style={{
                    borderRadius: token.borderRadiusSM,
                    fontWeight: 500,
                    padding: '2px 8px',
                    margin: 0,
                }}
            >
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                {t('errorManagement.table.resolvedBadge')}
            </Tag>
        );
    };

    const downtimeStyle = getDowntimeStyle(currentIncident.durationMinutes);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={720}
            destroyOnHidden
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 4 }}>
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: token.borderRadiusLG,
                            background: token.colorPrimaryBg,
                            border: `1px solid ${token.colorPrimaryBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ToolOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
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
                                {t('errorManagement.drawer.title')}
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
                        <Text type="secondary" style={{ fontSize: 12.5 }}>
                            {t('errorManagement.drawer.basicInfo')}
                        </Text>
                    </div>
                </div>
            }
            footer={
                <Flex justify="flex-end" gap={8}>
                    <Button onClick={onClose} icon={<CloseOutlined />}>
                        {t('common.close', { defaultValue: 'Đóng' })}
                    </Button>
                    {isOngoing ? (
                        <Tooltip title={t('errorManagement.table.cannotUpdateOngoing')}>
                            <span>
                                <Button type="primary" icon={<EditOutlined />} disabled>
                                    {t('errorManagement.table.edit')}
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => {
                                onClose();
                                if (currentIncident) onEdit(currentIncident);
                            }}
                        >
                            {t('errorManagement.table.edit')}
                        </Button>
                    )}
                </Flex>
            }
        >
            <Spin spinning={fetchingDetail}>
                {/* Header Machine & Location Card */}
                <Card
                    styles={{ body: { padding: '14px 18px' } }}
                    style={{
                        background: token.colorFillQuaternary,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderLeft: `4px solid ${token.colorPrimary}`,
                        borderRadius: token.borderRadiusLG,
                        marginTop: 16,
                        marginBottom: 18,
                    }}
                >
                    <Flex justify="space-between" align="flex-start" gap={12}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Flex align="center" gap={8} wrap="wrap">
                                <Text
                                    strong
                                    style={{
                                        fontSize: 15,
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
                                            fontSize: 12,
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

                        {renderStatusTag()}
                    </Flex>
                </Card>

                {/* Timing & Downtime Section */}
                <div style={{ marginBottom: 20 }}>
                    <Flex
                        align="center"
                        justify="space-between"
                        wrap="wrap"
                        gap={8}
                        style={{ marginBottom: 10 }}
                    >
                        <Text
                            strong
                            style={{
                                fontSize: 13.5,
                                color: token.colorTextHeading,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <ClockCircleOutlined
                                style={{ marginRight: 6, color: token.colorPrimary }}
                            />
                            {t('errorManagement.drawer.timeAndDuration')}
                        </Text>

                        <Space size={6} wrap>
                            <Tag
                                variant="filled"
                                style={{
                                    margin: 0,
                                    fontSize: 11.5,
                                    padding: '2px 8px',
                                    borderRadius: token.borderRadiusSM,
                                    background: token.colorFillSecondary,
                                    color: token.colorTextSecondary,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <ToolOutlined style={{ color: token.colorPrimary, fontSize: 12 }} />
                                <span>Tín hiệu MQTT từ máy</span>
                            </Tag>
                            {currentIncident.errorMessage && (
                                <Tag
                                    color="volcano"
                                    style={{
                                        margin: 0,
                                        fontSize: 11.5,
                                        borderRadius: token.borderRadiusSM,
                                    }}
                                >
                                    <AlertOutlined style={{ marginRight: 4 }} />
                                    {currentIncident.errorMessage}
                                </Tag>
                            )}
                        </Space>
                    </Flex>

                    <div
                        style={{
                            background: token.colorFillQuaternary,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: token.borderRadiusLG,
                            padding: '14px 16px',
                        }}
                    >
                        <Row gutter={[16, 12]} align="middle">
                            {/* Start Time Tile */}
                            <Col xs={24} sm={8}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: token.borderRadiusSM,
                                            background: token.colorInfoBg,
                                            border: `1px solid ${token.colorInfoBorder}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: token.colorInfo,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <ClockCircleOutlined style={{ fontSize: 16 }} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                display: 'block',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {t('errorManagement.table.columns.startTime')}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                fontFamily: 'monospace',
                                                color: token.colorTextHeading,
                                                display: 'block',
                                                marginTop: 3,
                                            }}
                                        >
                                            {formatDateTime(currentIncident.startTime)}
                                        </Text>
                                    </div>
                                </div>
                            </Col>

                            {/* End Time Tile */}
                            <Col xs={24} sm={8}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: token.borderRadiusSM,
                                            background: currentIncident.endTime
                                                ? token.colorSuccessBg
                                                : token.colorErrorBg,
                                            border: `1px solid ${currentIncident.endTime ? token.colorSuccessBorder : token.colorErrorBorder}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: currentIncident.endTime
                                                ? token.colorSuccess
                                                : token.colorError,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {currentIncident.endTime ? (
                                            <CheckCircleOutlined style={{ fontSize: 16 }} />
                                        ) : (
                                            <SyncOutlined spin style={{ fontSize: 16 }} />
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                display: 'block',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {t('errorManagement.table.columns.endTime')}
                                        </Text>
                                        {currentIncident.endTime ? (
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    fontFamily: 'monospace',
                                                    color: token.colorTextHeading,
                                                    display: 'block',
                                                    marginTop: 3,
                                                }}
                                            >
                                                {formatDateTime(currentIncident.endTime)}
                                            </Text>
                                        ) : (
                                            <Tag
                                                color="error"
                                                style={{
                                                    margin: 0,
                                                    marginTop: 3,
                                                    fontWeight: 600,
                                                    borderRadius: token.borderRadiusSM,
                                                }}
                                            >
                                                <SyncOutlined spin style={{ marginRight: 4 }} />
                                                {t('errorManagement.table.ongoingBadge')}
                                            </Tag>
                                        )}
                                    </div>
                                </div>
                            </Col>

                            {/* Downtime Tile (Hero Metric) */}
                            <Col xs={24} sm={8}>
                                <div
                                    style={{
                                        padding: '10px 14px',
                                        background: token.colorBgContainer,
                                        borderRadius: token.borderRadiusSM,
                                        border: `1px solid ${downtimeStyle.border}`,
                                        borderLeft: `4px solid ${downtimeStyle.main}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                display: 'block',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {t('errorManagement.table.columns.duration')}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: downtimeStyle.text,
                                                display: 'block',
                                                marginTop: 2,
                                            }}
                                        >
                                            {isOngoing || currentIncident.durationMinutes === null
                                                ? t('errorManagement.table.ongoingBadge')
                                                : formatDuration(currentIncident.durationMinutes)}
                                        </Text>
                                    </div>
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: downtimeStyle.bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: downtimeStyle.main,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <HourglassOutlined style={{ fontSize: 15 }} />
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Root Cause & Resolution Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col span={24}>
                        <Text
                            strong
                            style={{
                                fontSize: 13.5,
                                color: token.colorTextHeading,
                                display: 'block',
                                marginBottom: 8,
                            }}
                        >
                            <AlertOutlined style={{ marginRight: 6, color: token.colorWarning }} />
                            {t('errorManagement.drawer.analysisAndAction')}
                        </Text>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card
                            size="small"
                            title={
                                <Space size={6}>
                                    <AlertOutlined
                                        style={{ color: token.colorWarning, fontSize: 13 }}
                                    />
                                    <Text strong style={{ fontSize: 13 }}>
                                        {t('errorManagement.table.columns.cause')}
                                    </Text>
                                </Space>
                            }
                            style={{
                                height: '100%',
                                background: token.colorBgContainer,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                borderRadius: token.borderRadiusLG,
                            }}
                        >
                            {currentIncident.rootCause ? (
                                <Paragraph
                                    style={{
                                        margin: 0,
                                        color: token.colorText,
                                        lineHeight: 1.6,
                                        fontSize: 13,
                                    }}
                                >
                                    {currentIncident.rootCause}
                                </Paragraph>
                            ) : (
                                <Text type="secondary" italic style={{ fontSize: 12.5 }}>
                                    {t('errorManagement.table.noCauseYet')}
                                </Text>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card
                            size="small"
                            title={
                                <Space size={6}>
                                    <CheckCircleOutlined
                                        style={{ color: token.colorSuccess, fontSize: 13 }}
                                    />
                                    <Text strong style={{ fontSize: 13 }}>
                                        {t('errorManagement.table.columns.resolution')}
                                    </Text>
                                </Space>
                            }
                            style={{
                                height: '100%',
                                background: currentIncident.resolution
                                    ? token.colorSuccessBg
                                    : token.colorFillAlter,
                                border: `1px solid ${currentIncident.resolution ? token.colorSuccessBorder : token.colorBorderSecondary}`,
                                borderRadius: token.borderRadiusLG,
                            }}
                        >
                            {currentIncident.resolution ? (
                                <Paragraph
                                    style={{
                                        margin: 0,
                                        color: token.colorText,
                                        lineHeight: 1.6,
                                        fontSize: 13,
                                    }}
                                >
                                    {currentIncident.resolution}
                                </Paragraph>
                            ) : (
                                <Text type="secondary" italic style={{ fontSize: 12.5 }}>
                                    {t('errorManagement.table.noResolutionYet')}
                                </Text>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Audit Metadata */}
                {currentIncident.auditMetaData && (
                    <div style={{ marginTop: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 13.5,
                                color: token.colorTextHeading,
                                display: 'block',
                                marginBottom: 10,
                            }}
                        >
                            <AuditOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
                            {t('errorManagement.drawer.auditInfo')}
                        </Text>

                        <Row gutter={[14, 12]}>
                            {/* Created Record Card */}
                            <Col xs={24} sm={12}>
                                <div
                                    style={{
                                        padding: '12px 14px',
                                        background: token.colorFillQuaternary,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusLG,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: token.colorFillSecondary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: token.colorTextSecondary,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <CalendarOutlined style={{ fontSize: 15 }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Flex
                                            justify="space-between"
                                            align="center"
                                            style={{ marginBottom: 2 }}
                                        >
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                }}
                                            >
                                                {t('errorManagement.drawer.createdAt')}
                                            </Text>
                                            <Tag
                                                variant="filled"
                                                style={{
                                                    margin: 0,
                                                    fontSize: 11,
                                                    borderRadius: token.borderRadiusSM,
                                                    background: token.colorFillSecondary,
                                                    color: token.colorTextHeading,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <UserOutlined
                                                    style={{ marginRight: 3, fontSize: 10 }}
                                                />
                                                {currentIncident.auditMetaData.createdBy ||
                                                    'SYSTEM'}
                                            </Tag>
                                        </Flex>
                                        <span
                                            style={{
                                                fontFamily: 'monospace',
                                                fontSize: 12.5,
                                                color: token.colorText,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {formatDateTime(
                                                currentIncident.auditMetaData.createdAt
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </Col>

                            {/* Last Updated Record Card */}
                            <Col xs={24} sm={12}>
                                <div
                                    style={{
                                        padding: '12px 14px',
                                        background: token.colorFillQuaternary,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusLG,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: token.colorPrimaryBg,
                                            border: `1px solid ${token.colorPrimaryBorder}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: token.colorPrimary,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <EditOutlined style={{ fontSize: 15 }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Flex
                                            justify="space-between"
                                            align="center"
                                            style={{ marginBottom: 2 }}
                                        >
                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                }}
                                            >
                                                {t('errorManagement.drawer.updatedAt')}
                                            </Text>
                                            <Tag
                                                color="blue"
                                                style={{
                                                    margin: 0,
                                                    fontSize: 11,
                                                    borderRadius: token.borderRadiusSM,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <UserOutlined
                                                    style={{ marginRight: 3, fontSize: 10 }}
                                                />
                                                {currentIncident.auditMetaData.updatedBy ||
                                                    'SYSTEM'}
                                            </Tag>
                                        </Flex>
                                        <span
                                            style={{
                                                fontFamily: 'monospace',
                                                fontSize: 12.5,
                                                color: token.colorText,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {formatDateTime(
                                                currentIncident.auditMetaData.updatedAt
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};
