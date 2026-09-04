'use client';

import React from 'react';
import { Button, Card, Descriptions, Drawer, Space, Tag, Typography, theme } from 'antd';
import {
    AlertOutlined,
    ClockCircleOutlined,
    EditOutlined,
    SyncOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ErrorIncident } from '@/types/ErrorManagement';

const { Title, Text, Paragraph } = Typography;

interface ErrorDetailDrawerProps {
    open: boolean;
    incident: ErrorIncident | null;
    onClose: () => void;
    onEdit: (incident: ErrorIncident) => void;
}

export const ErrorDetailDrawer: React.FC<ErrorDetailDrawerProps> = ({
    open,
    incident,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    if (!incident) return null;

    const formatDuration = (minutes: number) => {
        if (!minutes || minutes <= 0) return '0 phút';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m} phút`;
        return `${h} giờ ${m > 0 ? `${m} phút` : ''}`.trim();
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={580}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ToolOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                    <span>
                        {t('errorManagement.drawer.title')} -{' '}
                        <span style={{ fontFamily: 'monospace' }}>{incident.code}</span>
                    </span>
                </div>
            }
            extra={
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                        onClose();
                        onEdit(incident);
                    }}
                >
                    {t('errorManagement.table.edit')}
                </Button>
            }
        >
            {/* Header Badge Strip */}
            <Card
                styles={{ body: { padding: 16 } }}
                style={{
                    background: token.colorFillAlter,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG,
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {incident.lineName} • {incident.zoneName}
                        </Text>
                        <Title
                            level={5}
                            style={{ margin: '4px 0 0', color: token.colorTextHeading }}
                        >
                            {incident.machineName} ({incident.machineCode})
                        </Title>
                    </div>
                    <Tag
                        color={
                            incident.status === 'resolved'
                                ? 'success'
                                : incident.status === 'in_progress'
                                  ? 'warning'
                                  : 'error'
                        }
                        style={{ borderRadius: token.borderRadiusSM, fontWeight: 600, margin: 0 }}
                    >
                        {t(`errorManagement.statuses.${incident.status}`)}
                    </Tag>
                </div>
            </Card>

            {/* Timing & Downtime */}
            <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
                {t('errorManagement.drawer.timeAndDuration')}
            </Title>
            <Descriptions
                bordered
                size="small"
                column={1}
                style={{ marginBottom: 20 }}
                labelStyle={{ width: 160, fontWeight: 500 }}
            >
                <Descriptions.Item label={t('errorManagement.table.columns.startTime')}>
                    <span style={{ fontFamily: 'monospace' }}>{incident.startTime}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t('errorManagement.table.columns.endTime')}>
                    {incident.endTime ? (
                        <span style={{ fontFamily: 'monospace' }}>{incident.endTime}</span>
                    ) : (
                        <Tag color="warning" icon={<SyncOutlined spin />}>
                            {t('errorManagement.table.ongoingBadge')}
                        </Tag>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label={t('errorManagement.table.columns.duration')}>
                    <span
                        style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color:
                                incident.durationMinutes > 60
                                    ? token.colorError
                                    : incident.durationMinutes > 30
                                      ? token.colorWarning
                                      : token.colorInfo,
                        }}
                    >
                        {formatDuration(incident.durationMinutes)}
                    </span>
                </Descriptions.Item>
                <Descriptions.Item label="Nguồn ghi nhận">
                    <Tag color="geekblue" icon={<ToolOutlined />}>
                        Hệ thống / Thiết bị bắt tự động
                    </Tag>
                </Descriptions.Item>
            </Descriptions>

            {/* Root Cause & Countermeasure */}
            <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>
                <AlertOutlined style={{ marginRight: 6, color: token.colorWarning }} />
                {t('errorManagement.drawer.analysisAndAction')}
            </Title>

            <Card
                styles={{ body: { padding: 16 } }}
                style={{
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG,
                    marginBottom: 16,
                }}
            >
                <Text
                    strong
                    style={{ display: 'block', marginBottom: 6, color: token.colorTextHeading }}
                >
                    Nguyên nhân gốc rễ (Root Cause):
                </Text>
                <Paragraph style={{ margin: 0, color: token.colorText, lineHeight: 1.6 }}>
                    {incident.cause}
                </Paragraph>
            </Card>

            <Card
                styles={{ body: { padding: 16 } }}
                style={{
                    background: incident.resolution ? token.colorSuccessBg : token.colorFillAlter,
                    border: `1px solid ${incident.resolution ? token.colorSuccessBorder : token.colorBorderSecondary}`,
                    borderRadius: token.borderRadiusLG,
                    marginBottom: 16,
                }}
            >
                <Text
                    strong
                    style={{ display: 'block', marginBottom: 6, color: token.colorTextHeading }}
                >
                    Biện pháp khắc phục (Countermeasure):
                </Text>
                <Paragraph style={{ margin: 0, color: token.colorText, lineHeight: 1.6 }}>
                    {incident.resolution || t('errorManagement.table.noResolutionYet')}
                </Paragraph>
            </Card>
        </Drawer>
    );
};
