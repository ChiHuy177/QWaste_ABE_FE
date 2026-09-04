'use client';

import React from 'react';
import { Badge, Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    SyncOutlined,
    ToolOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { ErrorCategory, ErrorIncident, ErrorStatus } from '@/types/ErrorManagement';
import { GlobalToken } from 'antd/es/theme/interface';

const { Text } = Typography;

export interface ErrorTableColumnProps {
    token: GlobalToken;
    t: (key: string) => string;
    onViewDetail: (record: ErrorIncident) => void;
    onEdit: (record: ErrorIncident) => void;
    onDelete: (record: ErrorIncident) => void;
}

export const getErrorTableColumns = ({
    token,
    t,
    onViewDetail,
    onEdit,
    onDelete,
}: ErrorTableColumnProps): ColumnsType<ErrorIncident> => {
    // Helper format duration
    const formatDuration = (minutes: number) => {
        if (!minutes || minutes <= 0) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    };

    // Category visual config
    const getCategoryTag = (category: ErrorCategory) => {
        const categoryLabels: Record<ErrorCategory, string> = {
            mechanical: t('errorManagement.categories.mechanical'),
            electrical: t('errorManagement.categories.electrical'),
            hydraulic: t('errorManagement.categories.hydraulic'),
            mold: t('errorManagement.categories.mold'),
            operational: t('errorManagement.categories.operational'),
            software: t('errorManagement.categories.software'),
            material: t('errorManagement.categories.material'),
            quality: t('errorManagement.categories.quality'),
        };

        const categoryColors: Record<ErrorCategory, { bg: string; text: string; border: string }> =
            {
                mechanical: {
                    bg: token.colorFillAlter,
                    text: token.colorTextSecondary,
                    border: token.colorBorderSecondary,
                },
                electrical: {
                    bg: token.colorWarningBg,
                    text: token.colorWarningText,
                    border: token.colorWarningBorder,
                },
                hydraulic: {
                    bg: token.colorPrimaryBg,
                    text: token.colorPrimaryText,
                    border: token.colorPrimaryBorder,
                },
                mold: {
                    bg: token.colorInfoBg,
                    text: token.colorInfoText,
                    border: token.colorInfoBorder,
                },
                operational: {
                    bg: token.colorWarningBg,
                    text: token.colorWarningText,
                    border: token.colorWarningBorder,
                },
                software: {
                    bg: token.colorPrimaryBg,
                    text: token.colorPrimaryText,
                    border: token.colorPrimaryBorder,
                },
                material: {
                    bg: token.colorFillAlter,
                    text: token.colorTextTertiary,
                    border: token.colorBorder,
                },
                quality: {
                    bg: token.colorErrorBg,
                    text: token.colorErrorText,
                    border: token.colorErrorBorder,
                },
            };

        const config = categoryColors[category] || categoryColors.mechanical;

        return (
            <Tag
                style={{
                    background: config.bg,
                    color: config.text,
                    border: `1px solid ${config.border}`,
                    borderRadius: token.borderRadiusSM,
                    fontSize: 11,
                    marginRight: 4,
                }}
            >
                {categoryLabels[category] || category}
            </Tag>
        );
    };

    // Status tag config
    const getStatusTag = (status: ErrorStatus) => {
        switch (status) {
            case 'open':
                return (
                    <Tag
                        color="error"
                        style={{
                            borderRadius: token.borderRadiusSM,
                            fontWeight: 600,
                        }}
                    >
                        <Badge status="error" style={{ marginRight: 4 }} />
                        {t('errorManagement.statuses.open')}
                    </Tag>
                );
            case 'in_progress':
                return (
                    <Tag
                        color="warning"
                        style={{
                            borderRadius: token.borderRadiusSM,
                            fontWeight: 600,
                        }}
                    >
                        <SyncOutlined spin style={{ marginRight: 4 }} />
                        {t('errorManagement.statuses.in_progress')}
                    </Tag>
                );
            case 'resolved':
                return (
                    <Tag
                        color="success"
                        style={{
                            borderRadius: token.borderRadiusSM,
                        }}
                    >
                        <CheckCircleOutlined style={{ marginRight: 4 }} />
                        {t('errorManagement.statuses.resolved')}
                    </Tag>
                );
            case 'closed':
            default:
                return (
                    <Tag
                        style={{
                            borderRadius: token.borderRadiusSM,
                            color: token.colorTextSecondary,
                        }}
                    >
                        {t('errorManagement.statuses.closed')}
                    </Tag>
                );
        }
    };

    return [
        {
            title: () => t('errorManagement.table.columns.incidentCode'),
            dataIndex: 'code',
            key: 'code',
            width: 115,
            render: (code: string, record) => (
                <Space orientation="vertical" size={2}>
                    <Text
                        strong
                        style={{
                            color: token.colorPrimary,
                            fontFamily: 'monospace',
                            fontSize: 13,
                        }}
                    >
                        {code}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.machineCode}
                    </Text>
                </Space>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.machine'),
            dataIndex: 'machineName',
            key: 'machineName',
            width: 170,
            render: (machineName: string) => (
                <Text strong style={{ color: token.colorTextHeading, display: 'block' }}>
                    {machineName}
                </Text>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.status'),
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (status: ErrorStatus) => getStatusTag(status),
        },
        {
            title: () => t('errorManagement.table.columns.startTime'),
            dataIndex: 'startTime',
            key: 'startTime',
            width: 130,
            sorter: (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
            render: (time: string) => (
                <Space size={6}>
                    <CalendarOutlined style={{ color: token.colorTextSecondary, fontSize: 13 }} />
                    <span
                        style={{
                            fontFamily: 'monospace',
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: 12.5,
                            color: token.colorText,
                        }}
                    >
                        {time}
                    </span>
                </Space>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.endTime'),
            dataIndex: 'endTime',
            key: 'endTime',
            width: 130,
            render: (time: string | null) => {
                if (!time) {
                    return (
                        <Tag
                            style={{
                                background: token.colorWarningBg,
                                color: token.colorWarningText,
                                border: `1px solid ${token.colorWarningBorder}`,
                                borderRadius: token.borderRadiusSM,
                                fontWeight: 500,
                            }}
                        >
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {t('errorManagement.table.ongoingBadge')}
                        </Tag>
                    );
                }
                return (
                    <Space size={6}>
                        <ClockCircleOutlined
                            style={{ color: token.colorTextSecondary, fontSize: 13 }}
                        />
                        <span
                            style={{
                                fontFamily: 'monospace',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: 12.5,
                                color: token.colorText,
                            }}
                        >
                            {time}
                        </span>
                    </Space>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.duration'),
            dataIndex: 'durationMinutes',
            key: 'duration',
            width: 90,
            sorter: (a, b) => a.durationMinutes - b.durationMinutes,
            render: (minutes: number) => {
                let bg = token.colorInfoBg;
                let text = token.colorInfoText;
                let border = token.colorInfoBorder;

                if (minutes > 60) {
                    bg = token.colorErrorBg;
                    text = token.colorErrorText;
                    border = token.colorErrorBorder;
                } else if (minutes >= 30) {
                    bg = token.colorWarningBg;
                    text = token.colorWarningText;
                    border = token.colorWarningBorder;
                }

                return (
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: token.borderRadiusSM,
                            background: bg,
                            color: text,
                            border: `1px solid ${border}`,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            fontSize: 12.5,
                        }}
                    >
                        <ClockCircleOutlined style={{ fontSize: 11 }} />
                        {formatDuration(minutes)}
                    </div>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.cause'),
            dataIndex: 'cause',
            key: 'cause',
            width: 170,
            render: (cause: string) => (
                <Text
                    style={{
                        fontSize: 13,
                        color: token.colorTextHeading,
                        lineHeight: 1.5,
                        display: 'block',
                    }}
                >
                    {cause || '—'}
                </Text>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.resolution'),
            dataIndex: 'resolution',
            key: 'resolution',
            width: 190,
            render: (resolution: string) => {
                const hasResolution = Boolean(resolution && resolution.trim());

                if (!hasResolution) {
                    return (
                        <Text type="secondary" italic style={{ fontSize: 12.5 }}>
                            {t('errorManagement.table.noResolutionYet')}
                        </Text>
                    );
                }

                return (
                    <Text
                        style={{
                            fontSize: 13,
                            color: token.colorText,
                            lineHeight: 1.5,
                            display: 'block',
                        }}
                    >
                        {resolution}
                    </Text>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.actions'),
            key: 'actions',
            width: 120,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title={t('errorManagement.table.viewDetail')}>
                        <Button
                            type="default"
                            icon={<EyeOutlined />}
                            onClick={() => onViewDetail(record)}
                            aria-label={t('common.view')}
                        />
                    </Tooltip>

                    <Tooltip title={t('errorManagement.table.edit')}>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            aria-label={t('common.edit')}
                        />
                    </Tooltip>

                    <Popconfirm
                        title={t('errorManagement.table.delete')}
                        description={t('errorManagement.table.confirmDelete')}
                        onConfirm={() => onDelete(record)}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                    >
                        <Tooltip title={t('errorManagement.table.delete')}>
                            <Button
                                danger
                                type="primary"
                                icon={<DeleteOutlined />}
                                aria-label={t('common.delete')}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];
};
