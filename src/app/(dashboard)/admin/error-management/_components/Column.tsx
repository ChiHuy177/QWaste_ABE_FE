'use client';

import React from 'react';
import { Badge, Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    ClockCircleOutlined,
    EditOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    HourglassOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { MachineIncidentItem } from '@/types/MachineIncident';
import { GlobalToken } from 'antd/es/theme/interface';

const { Text } = Typography;

export interface ErrorTableColumnProps {
    token: GlobalToken;
    t: (key: string, values?: Record<string, any>) => string;
    onViewDetail: (record: MachineIncidentItem) => void;
    onEdit: (record: MachineIncidentItem) => void;
    highlightedCode?: string | null;
    highlightedMachineCode?: string | null;
    isRowHighlighted?: (record: MachineIncidentItem) => boolean;
    isMobile?: boolean;
}

export const getErrorTableColumns = ({
    token,
    t,
    onViewDetail,
    onEdit,
    isRowHighlighted,
    isMobile,
}: ErrorTableColumnProps): ColumnsType<MachineIncidentItem> => {
    const formatDuration = (minutes: number | null) => {
        if (minutes === null || minutes === undefined || minutes < 0) return '—';
        if (minutes === 0) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return null;
        const d = dayjs(dateStr);
        return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : dateStr;
    };

    const getStatusTag = (record: MachineIncidentItem) => {
        // Rule: endTime == null means active machine error happening right now
        if (!record.endTime) {
            return (
                <Tag
                    color="error"
                    style={{
                        borderRadius: token.borderRadiusSM,
                        fontWeight: 600,
                        margin: 0,
                    }}
                >
                    <SyncOutlined spin style={{ marginRight: 4 }} />
                    {t('errorManagement.table.ongoingBadge')}
                </Tag>
            );
        }

        // Rule: endTime != null but status is still IN_PROGRESS (waiting for technician to input root cause)
        if (record.status === 'IN_PROGRESS') {
            return (
                <Tag
                    color="warning"
                    style={{
                        borderRadius: token.borderRadiusSM,
                        fontWeight: 600,
                        margin: 0,
                    }}
                >
                    <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                    {t('errorManagement.table.waitingUpdateBadge')}
                </Tag>
            );
        }

        // Rule: status is RESOLVED
        return (
            <Tag
                color="success"
                style={{
                    borderRadius: token.borderRadiusSM,
                    fontWeight: 500,
                    margin: 0,
                }}
            >
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                {t('errorManagement.table.resolvedBadge')}
            </Tag>
        );
    };

    const rawColumns: ColumnsType<MachineIncidentItem> = [
        {
            title: () => t('errorManagement.table.columns.incidentCode'),
            dataIndex: 'incidentCode',
            key: 'incidentCode',
            width: 140,
            render: (incidentCode: string) => (
                <Text
                    strong
                    style={{
                        color: token.colorPrimary,
                        fontFamily: 'monospace',
                        fontSize: 13,
                    }}
                >
                    {incidentCode}
                </Text>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.machine'),
            key: 'machine',
            width: 190,
            render: (_, record) => (
                <Space orientation="vertical" size={2}>
                    <Text
                        strong
                        style={{
                            color: token.colorTextHeading,
                            display: 'block',
                            lineHeight: 1.3,
                        }}
                    >
                        {record.machineName || '—'}
                    </Text>
                    {record.machineCode && (
                        <Text
                            type="secondary"
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 11.5,
                            }}
                        >
                            {record.machineCode}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.location'),
            dataIndex: 'location',
            key: 'location',
            width: 210,
            render: (location: string) => (
                <Space size={4} align="start">
                    <EnvironmentOutlined
                        style={{
                            color: token.colorTextSecondary,
                            fontSize: 12,
                            marginTop: 3,
                        }}
                    />
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 12.5,
                            lineHeight: 1.4,
                        }}
                    >
                        {location || '—'}
                    </Text>
                </Space>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.startTime'),
            dataIndex: 'startTime',
            key: 'startTime',
            width: 165,
            render: (time: string) => (
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
                        {formatDateTime(time)}
                    </span>
                </Space>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.endTime'),
            dataIndex: 'endTime',
            key: 'endTime',
            width: 165,
            render: (time: string | null) => {
                if (!time) {
                    return (
                        <Tag
                            color="error"
                            style={{
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
                            {formatDateTime(time)}
                        </span>
                    </Space>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.duration'),
            dataIndex: 'durationMinutes',
            key: 'durationMinutes',
            width: 110,
            render: (minutes: number | null, record) => {
                if (!record.endTime || minutes === null) {
                    return (
                        <Tag
                            color="error"
                            style={{
                                borderRadius: token.borderRadiusSM,
                                fontWeight: 500,
                            }}
                        >
                            {t('errorManagement.table.ongoingBadge')}
                        </Tag>
                    );
                }

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
                        <HourglassOutlined style={{ fontSize: 11 }} />
                        {formatDuration(minutes)}
                    </div>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.cause'),
            dataIndex: 'rootCause',
            key: 'rootCause',
            width: 220,
            ellipsis: { showTitle: false },
            render: (text: string | null) => {
                const trimmed = text?.trim();
                if (!trimmed) {
                    return (
                        <Text type="secondary" italic style={{ fontSize: 12.5 }}>
                            {t('errorManagement.table.noCauseYet')}
                        </Text>
                    );
                }

                return (
                    <Tooltip placement="topLeft" title={trimmed}>
                        <div
                            style={{
                                maxWidth: 190,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: token.colorTextHeading,
                                }}
                            >
                                {trimmed}
                            </Text>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.resolution'),
            dataIndex: 'resolution',
            key: 'resolution',
            width: 220,
            ellipsis: { showTitle: false },
            render: (text: string | null) => {
                const trimmed = text?.trim();
                if (!trimmed) {
                    return (
                        <Text type="secondary" italic style={{ fontSize: 12.5 }}>
                            {t('errorManagement.table.noResolutionYet')}
                        </Text>
                    );
                }

                return (
                    <Tooltip placement="topLeft" title={trimmed}>
                        <div
                            style={{
                                maxWidth: 190,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: 12.5,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {trimmed}
                            </Text>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('errorManagement.table.columns.status'),
            key: 'status',
            width: 140,
            render: (_, record) => getStatusTag(record),
        },
        {
            title: () => t('errorManagement.table.columns.actions'),
            key: 'actions',
            width: 110,
            align: 'center',
            fixed: isMobile ? undefined : 'right',
            render: (_, record) => {
                const isOngoing = !record.endTime;

                return (
                    <Space size="small">
                        <Tooltip title={t('errorManagement.table.viewDetail')}>
                            <Button
                                type="default"
                                icon={<EyeOutlined />}
                                onClick={() => onViewDetail(record)}
                                aria-label={t('errorManagement.table.viewDetail')}
                            />
                        </Tooltip>

                        {isOngoing ? (
                            <Tooltip title={t('errorManagement.table.cannotUpdateOngoing')}>
                                <span>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        disabled
                                        aria-label={t('errorManagement.table.edit')}
                                    />
                                </span>
                            </Tooltip>
                        ) : (
                            <Tooltip title={t('errorManagement.table.edit')}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => onEdit(record)}
                                    aria-label={t('errorManagement.table.edit')}
                                />
                            </Tooltip>
                        )}
                    </Space>
                );
            },
        },
    ];

    return rawColumns.map((col, colIndex) => ({
        ...col,
        onCell: (record: MachineIncidentItem) => {
            const isTarget = isRowHighlighted?.(record);
            const userCell = col.onCell ? col.onCell(record) : {};
            if (!isTarget) return userCell;

            return {
                ...userCell,
                className: `${userCell?.className || ''} highlighted-incident-cell`.trim(),
                style: {
                    ...userCell?.style,
                    backgroundColor: token.colorPrimaryBg,
                    ...(colIndex === 0
                        ? {
                              borderLeft: `4px solid ${token.colorPrimary}`,
                          }
                        : {}),
                },
            };
        },
    }));
};
