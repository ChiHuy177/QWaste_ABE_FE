'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Avatar,
    Button,
    Card,
    Descriptions,
    Divider,
    Dropdown,
    Empty,
    Flex,
    Space,
    Tabs,
    Tag,
    Timeline,
    Typography,
    theme,
} from 'antd';
import {
    BuildOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    EditOutlined,
    EllipsisOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    PaperClipOutlined,
    RobotOutlined,
    SearchOutlined,
    SyncOutlined,
    UserOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
    IncidentClassification,
    IncidentReport,
    IncidentStatus,
} from '@/types/IncidentReport';
import { STATUS_BAR_COLOR } from './Columns';

const { Text } = Typography;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TAG_STYLE: Record<IncidentStatus, React.CSSProperties> = {
    ALL: { color: '#6b7280', background: '#f3f4f6', borderColor: '#d1d5db' },
    OPEN: { color: '#d97706', background: '#fffbeb', borderColor: '#fcd34d' },
    IN_PROGRESS: { color: '#2563eb', background: '#eff6ff', borderColor: '#93c5fd' },
    RESOLVED: { color: '#16a34a', background: '#f0fdf4', borderColor: '#86efac' },
};

const CLASSIFICATION_TAG_STYLE: Record<IncidentClassification, React.CSSProperties> = {
    MACHINE: { color: '#2563eb', background: '#eff6ff', borderColor: '#93c5fd' },
    MOLD: { color: '#7c3aed', background: '#f5f3ff', borderColor: '#c4b5fd' },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
    const { token } = theme.useToken();
    return (
        <Text
            strong
            style={{
                fontSize: 12,
                color: token.colorTextSecondary,
                display: 'block',
                marginBottom: 8,
            }}
        >
            {children}
        </Text>
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OverviewDetailPanelProps {
    data: IncidentReport | null;
    onClose: () => void;
    onEdit: (r: IncidentReport) => void;
    onStatusChange: (r: IncidentReport, s: IncidentStatus) => Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OverviewDetailPanel({
    data: vd,
    onClose,
    onEdit,
    onStatusChange,
}: OverviewDetailPanelProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [activeTab, setActiveTab] = useState('overview');
    const [actioning, setActioning] = useState(false);

    const statusLabel = (s: IncidentStatus) =>
        t(`maintenance.status.${s === 'IN_PROGRESS' ? 'inProgress' : s.toLowerCase()}`);

    const classificationLabel = (cls: IncidentClassification) =>
        cls === 'MACHINE'
            ? t('maintenance.classification.machine')
            : t('maintenance.classification.mold');

    const barColor = vd ? STATUS_BAR_COLOR[vd.status] : token.colorPrimary;
    const attachCount = vd?.imageUrls?.length || 0;

    const labelStyle = { color: token.colorTextSecondary, fontWeight: 500, fontSize: 12 } as const;
    const valStyle = { fontWeight: 600, fontSize: 12 } as const;

    const doAction = async (s: IncidentStatus) => {
        if (!vd) return;
        setActioning(true);
        try {
            await onStatusChange(vd, s);
        } finally {
            setActioning(false);
        }
    };

    if (!vd) return null;

    // ── Overview tab ──────────────────────────────────────────────────────────
    const overviewTab = (
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 195px)', padding: '12px 16px' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {/* Incident Information */}
                <div>
                    <SectionTitle>{t('maintenance.detail.sections.incidentInfo')}</SectionTitle>
                    <Descriptions
                        column={2}
                        size="small"
                        labelStyle={labelStyle}
                        contentStyle={valStyle}
                    >
                        <Descriptions.Item label={t('maintenance.detail.fields.reportNo')} span={2}>
                            <Text
                                strong
                                style={{ color: token.colorPrimary, fontFamily: 'monospace' }}
                            >
                                {vd.reportNumber}
                            </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('maintenance.detail.fields.classification')}>
                            <Tag
                                style={{
                                    margin: 0,
                                    ...CLASSIFICATION_TAG_STYLE[vd.classification],
                                }}
                            >
                                {vd.classification === 'MACHINE' ? (
                                    <RobotOutlined style={{ marginRight: 4 }} />
                                ) : (
                                    <BuildOutlined style={{ marginRight: 4 }} />
                                )}
                                {classificationLabel(vd.classification)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('maintenance.detail.fields.status')}>
                            <Tag style={{ margin: 0, ...STATUS_TAG_STYLE[vd.status] }}>
                                {statusLabel(vd.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={
                                vd.classification === 'MACHINE'
                                    ? t('maintenance.classification.machine')
                                    : t('maintenance.classification.mold')
                            }
                            span={2}
                        >
                            <Flex align="center" gap={4}>
                                <Text>{vd.machine?.machineName ?? vd.mold?.moldName ?? '-'}</Text>
                                <Text
                                    type="secondary"
                                    style={{ fontFamily: 'monospace', fontSize: 11 }}
                                >
                                    (#{vd.machine?.machineCode ?? vd.mold?.moldCode ?? '-'})
                                </Text>
                            </Flex>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('maintenance.detail.fields.reportedBy')}>
                            <Space size={4}>
                                <UserOutlined />
                                {vd.reportedByName}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('maintenance.detail.fields.reportedAt')}>
                            <Space size={4}>
                                <CalendarOutlined />
                                {dayjs(vd.reportedAt).format('DD/MM/YYYY HH:mm')}
                            </Space>
                        </Descriptions.Item>
                        {vd.resolvedAt && (
                            <Descriptions.Item
                                label={t('maintenance.detail.fields.resolvedAt')}
                                span={2}
                            >
                                <Space size={4}>
                                    <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                                    <Text style={{ color: token.colorSuccess }}>
                                        {dayjs(vd.resolvedAt).format('DD/MM/YYYY HH:mm')}
                                    </Text>
                                </Space>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>

                <Divider style={{ margin: '0' }} />

                {/* Error Information */}
                <div>
                    <SectionTitle>{t('maintenance.detail.sections.errorInfo')}</SectionTitle>
                    <Descriptions
                        column={2}
                        size="small"
                        labelStyle={labelStyle}
                        contentStyle={valStyle}
                    >
                        <Descriptions.Item
                            label={t('maintenance.detail.fields.errorGroup')}
                            span={2}
                        >
                            <Tag
                                style={{
                                    margin: 0,
                                    color: token.colorError,
                                    background: token.colorErrorBg,
                                    borderColor: token.colorErrorBorder,
                                }}
                            >
                                {vd.errorGroup.errorGroupName}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('maintenance.detail.fields.errorCode')}>
                            <Tag
                                style={{
                                    margin: 0,
                                    fontFamily: 'monospace',
                                    color: token.colorWarning,
                                    background: token.colorWarningBg,
                                    borderColor: token.colorWarningBorder,
                                }}
                            >
                                {vd.errorDetail.errorCode}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('maintenance.detail.fields.errorDetail')}>
                            {vd.errorDetail.errorName}
                        </Descriptions.Item>
                    </Descriptions>
                </div>

                <Divider style={{ margin: '0' }} />

                {/* Description */}
                <div>
                    <SectionTitle>{t('maintenance.detail.fields.description')}</SectionTitle>
                    <Text style={{ fontSize: 13, lineHeight: 1.7, display: 'block' }}>
                        {vd.description}
                    </Text>
                </div>

                {/* Images */}
                <div>
                    <SectionTitle>{t('maintenance.detail.sections.images')}</SectionTitle>
                    {vd.imageUrls && vd.imageUrls.length > 0 ? (
                        <Flex vertical gap={8}>
                            {vd.imageUrls.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <div
                                        style={{
                                            borderRadius: 8,
                                            border: `1px solid ${token.colorBorderSecondary}`,
                                            overflow: 'hidden',
                                            background: token.colorFillTertiary,
                                            maxWidth: 280,
                                        }}
                                    >
                                        <img
                                            src={url}
                                            alt={`incident-${index + 1}`}
                                            style={{
                                                width: '100%',
                                                maxHeight: 160,
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </a>
                            ))}
                        </Flex>
                    ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('maintenance.detail.images.empty')}
                        </Text>
                    )}
                </div>

                <Divider style={{ margin: '0' }} />

                {/* Root Cause */}
                <div>
                    <SectionTitle>{t('maintenance.detail.fields.rootCause')}</SectionTitle>
                    <div
                        style={{
                            padding: '10px 14px',
                            background: vd.rootCause
                                ? token.colorWarningBg
                                : token.colorFillTertiary,
                            border: `1px solid ${vd.rootCause ? token.colorWarningBorder : token.colorBorderSecondary}`,
                            borderRadius: 8,
                        }}
                    >
                        {vd.rootCause ? (
                            <Flex align="flex-start" gap={8}>
                                <WarningOutlined
                                    style={{ color: token.colorWarning, marginTop: 2 }}
                                />
                                <Text style={{ fontSize: 13 }}>{vd.rootCause}</Text>
                            </Flex>
                        ) : (
                            <Flex justify="space-between" align="center">
                                <div>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, fontWeight: 600, display: 'block' }}
                                    >
                                        {t('maintenance.detail.rootCause.pending')}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {t('maintenance.detail.rootCause.analysisInProgress')}
                                    </Text>
                                </div>
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => onEdit(vd)}
                                >
                                    {t('maintenance.detail.edit')}
                                </Button>
                            </Flex>
                        )}
                    </div>
                </div>

                <Divider style={{ margin: '0' }} />

                {/* Assigned Technician */}
                <div>
                    <SectionTitle>
                        {t('maintenance.detail.sections.assignedTechnician')}
                    </SectionTitle>
                    <Card
                        size="small"
                        style={{
                            borderRadius: 8,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                        styles={{ body: { padding: '10px 14px' } }}
                    >
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={10}>
                                <Avatar
                                    size={36}
                                    style={{
                                        background: barColor,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                >
                                    {(vd.reportedByName ?? '?').charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <Text strong style={{ fontSize: 13, display: 'block' }}>
                                        {vd.reportedByName}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {t('maintenance.detail.technicianRole')}
                                    </Text>
                                </div>
                            </Flex>
                            <Button size="small">{t('maintenance.detail.reassign')}</Button>
                        </Flex>
                        <Text
                            type="secondary"
                            style={{ fontSize: 11, display: 'block', marginTop: 6 }}
                        >
                            {t('maintenance.detail.assignedAt', {
                                date: dayjs(vd.reportedAt).format('DD/MM/YYYY HH:mm'),
                            })}
                        </Text>
                    </Card>
                </div>

                {/* Actions */}
                <div>
                    <SectionTitle>{t('maintenance.detail.sections.actions')}</SectionTitle>
                    <Flex gap={8}>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            style={{ flex: 1 }}
                            loading={actioning}
                            disabled={vd.status === 'IN_PROGRESS'}
                            onClick={() => doAction('IN_PROGRESS')}
                        >
                            {t('maintenance.detail.actions.investigate')}
                        </Button>
                        <Button
                            icon={<CheckCircleOutlined />}
                            style={{
                                flex: 1,
                                background: '#16a34a',
                                borderColor: '#16a34a',
                                color: '#fff',
                            }}
                            loading={actioning}
                            disabled={vd.status === 'RESOLVED'}
                            onClick={() => doAction('RESOLVED')}
                        >
                            {t('maintenance.detail.actions.resolve')}
                        </Button>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'reopen',
                                        label: t('maintenance.detail.actions.reopen'),
                                        onClick: () => doAction('OPEN'),
                                    },
                                    { type: 'divider' },
                                    {
                                        key: 'edit',
                                        label: t('maintenance.detail.actions.editReport'),
                                        icon: <EditOutlined />,
                                        onClick: () => onEdit(vd),
                                    },
                                ],
                            }}
                            trigger={['click']}
                        >
                            <Button icon={<EllipsisOutlined />}>
                                {t('maintenance.detail.actions.more')}
                            </Button>
                        </Dropdown>
                    </Flex>
                </div>
            </Space>
        </div>
    );

    // ── Timeline tab ──────────────────────────────────────────────────────────
    const timelineTab = (
        <div style={{ padding: '16px' }}>
            <Timeline
                items={[
                    {
                        color: barColor,
                        children: (
                            <div>
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('maintenance.detail.timeline.statusChange', {
                                        status: statusLabel(vd.status),
                                    })}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                    {dayjs(vd.auditMetaData?.updatedAt ?? vd.reportedAt).format(
                                        'DD/MM/YYYY HH:mm'
                                    )}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('maintenance.detail.timeline.updatedBy', {
                                        name: vd.auditMetaData?.updatedBy ?? vd.reportedByName,
                                    })}
                                </Text>
                            </div>
                        ),
                    },
                    {
                        color: STATUS_BAR_COLOR.OPEN,
                        children: (
                            <div>
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('maintenance.detail.timeline.incidentReported')}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                    {dayjs(vd.reportedAt).format('DD/MM/YYYY HH:mm')}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('maintenance.detail.timeline.reportedBy', {
                                        name: vd.reportedByName,
                                    })}
                                </Text>
                            </div>
                        ),
                    },
                    {
                        color: '#9ca3af',
                        children: (
                            <div>
                                <Text strong style={{ fontSize: 13 }}>
                                    {t('maintenance.detail.timeline.reportCreated')}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                    {dayjs(vd.auditMetaData?.createdAt ?? vd.reportedAt).format(
                                        'DD/MM/YYYY HH:mm'
                                    )}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('maintenance.detail.timeline.by', {
                                        name: vd.auditMetaData?.createdBy ?? vd.reportedByName,
                                    })}
                                </Text>
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );

    // ── Attachments tab ───────────────────────────────────────────────────────
    const attachTab = (
        <div style={{ padding: '16px' }}>
            {vd.imageUrls && vd.imageUrls.length > 0 ? (
                <Flex vertical gap={16}>
                    {vd.imageUrls.map((url, index) => (
                        <div key={index}>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                <div
                                    style={{
                                        borderRadius: 8,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        overflow: 'hidden',
                                        background: token.colorFillTertiary,
                                        maxWidth: '100%',
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={t('maintenance.detail.attachments.imageLabel', { number: index + 1 })}
                                        style={{
                                            width: '100%',
                                            maxHeight: 300,
                                            objectFit: 'contain',
                                            display: 'block',
                                        }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            </a>
                            <Flex align="center" gap={6} style={{ marginTop: 8 }}>
                                <PaperClipOutlined
                                    style={{ color: token.colorTextSecondary, fontSize: 12 }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('maintenance.detail.attachments.imageLabel', { number: index + 1 })}
                                </Text>
                            </Flex>
                        </div>
                    ))}
                </Flex>
            ) : (
                <Empty
                    description={t('maintenance.detail.attachments.empty')}
                    style={{ padding: '40px 0' }}
                />
            )}
        </div>
    );

    // ── Audit Trail tab ───────────────────────────────────────────────────────
    const auditTab = (
        <div style={{ padding: '16px' }}>
            <Descriptions
                column={1}
                size="small"
                labelStyle={labelStyle}
                contentStyle={valStyle}
                bordered
            >
                <Descriptions.Item label={t('maintenance.detail.fields.createdAt')}>
                    {vd.auditMetaData?.createdAt
                        ? dayjs(vd.auditMetaData.createdAt).format('DD/MM/YYYY HH:mm')
                        : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('maintenance.detail.fields.createdBy')}>
                    {vd.auditMetaData?.createdBy || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('maintenance.detail.fields.updatedAt')}>
                    {vd.auditMetaData?.updatedAt
                        ? dayjs(vd.auditMetaData.updatedAt).format('DD/MM/YYYY HH:mm')
                        : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('maintenance.detail.fields.updatedBy')}>
                    {vd.auditMetaData?.updatedBy || '-'}
                </Descriptions.Item>
            </Descriptions>
        </div>
    );

    return (
        <Card
            style={{ borderRadius: 10, height: '100%', overflow: 'hidden' }}
            styles={{
                body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' },
            }}
        >
            {/* Panel header */}
            <Flex
                align="center"
                justify="space-between"
                style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    flexShrink: 0,
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <Space size={8} wrap>
                    <Text
                        strong
                        style={{ fontSize: 14, fontFamily: 'monospace', color: token.colorPrimary }}
                    >
                        {vd.reportNumber}
                    </Text>
                    <Tag style={{ margin: 0, ...STATUS_TAG_STYLE[vd.status] }}>
                        {statusLabel(vd.status)}
                    </Tag>
                </Space>
                <Space size={6}>
                    <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(vd)}>
                        {t('maintenance.detail.edit')}
                    </Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={onClose} />
                </Space>
            </Flex>

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="small"
                tabBarStyle={{ padding: '0 16px', marginBottom: 0, flexShrink: 0 }}
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                items={[
                    {
                        key: 'overview',
                        label: (
                            <Space size={4}>
                                <FileTextOutlined />
                                {t('maintenance.detail.tabs.overview')}
                            </Space>
                        ),
                        children: overviewTab,
                    },
                    {
                        key: 'timeline',
                        label: (
                            <Space size={4}>
                                <SyncOutlined />
                                {t('maintenance.detail.tabs.timeline')}
                            </Space>
                        ),
                        children: timelineTab,
                    },
                    {
                        key: 'attachments',
                        label: (
                            <Space size={4}>
                                <PaperClipOutlined />
                                {t('maintenance.detail.tabs.attachments')}
                                {attachCount > 0 && (
                                    <Tag
                                        style={{
                                            margin: 0,
                                            fontSize: 10,
                                            padding: '0 5px',
                                            lineHeight: '16px',
                                            borderRadius: 8,
                                            background: token.colorPrimaryBg,
                                            color: token.colorPrimary,
                                            borderColor: token.colorPrimaryBorder,
                                        }}
                                    >
                                        {attachCount}
                                    </Tag>
                                )}
                            </Space>
                        ),
                        children: attachTab,
                    },
                    {
                        key: 'audit',
                        label: (
                            <Space size={4}>
                                <ExclamationCircleOutlined />
                                {t('maintenance.detail.sections.auditTrail')}
                            </Space>
                        ),
                        children: auditTab,
                    },
                ]}
            />
        </Card>
    );
}
