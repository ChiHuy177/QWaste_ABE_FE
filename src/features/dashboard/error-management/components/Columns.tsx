'use client';

import React from 'react';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { MachineIncidentItem } from '@/types/MachineIncident';
import { GlobalToken } from 'antd/es/theme/interface';
import { AppAbility } from '@/configs/permissions/caslAbility';

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
    page?: number;
    pageSize?: number;
    ability?: AppAbility;
}

export const getErrorTableColumns = ({
    token,
    t,
    onViewDetail,
    onEdit,
    isRowHighlighted,
    isMobile,
    page = 0,
    pageSize = 10,
    ability,
}: ErrorTableColumnProps): ColumnsType<MachineIncidentItem> => {
    const canUpdate = ability ? ability.can('update', 'machine_incident') : true;
    const formatDuration = (minutes: number | null) => {
        if (minutes === null || minutes === undefined || minutes < 0) return '—';
        if (minutes === 0) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const d = dayjs(dateStr);
        return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : dateStr;
    };

    const getStatusTag = (record: MachineIncidentItem) => {
        // Ongoing error happening right now
        if (!record.endTime) {
            return (
                <Tag color="error" style={{ margin: 0, fontWeight: 500 }}>
                    {t('errorManagement.table.ongoingBadge')}
                </Tag>
            );
        }

        // Waiting for technician to input root cause
        if (record.status === 'IN_PROGRESS') {
            return (
                <Tag color="warning" style={{ margin: 0, fontWeight: 500 }}>
                    {t('errorManagement.table.waitingUpdateBadge')}
                </Tag>
            );
        }

        // Resolved
        return (
            <Tag color="success" style={{ margin: 0, fontWeight: 500 }}>
                {t('errorManagement.table.resolvedBadge')}
            </Tag>
        );
    };

    const rawColumns: ColumnsType<MachineIncidentItem> = [
        {
            title: () => t('common.index', { defaultValue: 'STT' }),
            key: 'index',
            width: 65,
            align: 'center',
            render: (_: any, __: any, index: number) => (
                <Text type="secondary">{page * pageSize + index + 1}</Text>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.incidentCode'),
            dataIndex: 'incidentCode',
            key: 'incidentCode',
            width: 150,
            render: (incidentCode: string) => (
                <Text strong style={{ fontSize: 14, color: token.colorPrimary }}>
                    {incidentCode}
                </Text>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.machine'),
            key: 'machine',
            width: 210,
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <Text
                        strong
                        style={{
                            fontSize: 14,
                            color: token.colorTextHeading,
                            display: 'block',
                            lineHeight: 1.3,
                        }}
                    >
                        {record.machineName || '—'}
                    </Text>
                    {record.machineCode && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
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
            width: 200,
            render: (location: string) => (
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>
                    {location || '—'}
                </Text>
            ),
        },
        {
            title: () => t('errorManagement.table.columns.startTime'),
            dataIndex: 'startTime',
            key: 'startTime',
            width: 160,
            render: (time: string) => <Text style={{ fontSize: 13 }}>{formatDateTime(time)}</Text>,
        },
        {
            title: () => t('errorManagement.table.columns.endTime'),
            dataIndex: 'endTime',
            key: 'endTime',
            width: 160,
            render: (time: string | null) => {
                if (!time) {
                    return (
                        <Tag color="error" style={{ margin: 0, fontWeight: 500 }}>
                            {t('errorManagement.table.ongoingBadge')}
                        </Tag>
                    );
                }
                return <Text style={{ fontSize: 13 }}>{formatDateTime(time)}</Text>;
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
                        <Tag color="error" style={{ margin: 0, fontWeight: 500 }}>
                            {t('errorManagement.table.ongoingBadge')}
                        </Tag>
                    );
                }

                const color = minutes > 60 ? 'error' : minutes >= 30 ? 'warning' : 'blue';
                return (
                    <Tag color={color} style={{ margin: 0, fontWeight: 500 }}>
                        {formatDuration(minutes)}
                    </Tag>
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
                        <Text type="secondary" italic style={{ fontSize: 13 }}>
                            {t('errorManagement.table.noCauseYet')}
                        </Text>
                    );
                }

                return (
                    <Tooltip placement="topLeft" title={trimmed}>
                        <div
                            style={{
                                maxWidth: 195,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Text style={{ fontSize: 13 }}>{trimmed}</Text>
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
                        <Text type="secondary" italic style={{ fontSize: 13 }}>
                            {t('errorManagement.table.noResolutionYet')}
                        </Text>
                    );
                }

                return (
                    <Tooltip placement="topLeft" title={trimmed}>
                        <div
                            style={{
                                maxWidth: 195,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: 13 }}>
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
            width: 130,
            render: (_, record) => getStatusTag(record),
        },
        {
            title: () => t('errorManagement.table.columns.actions'),
            key: 'actions',
            width: canUpdate ? 110 : 70,
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

                        {canUpdate && (
                            <Tooltip
                                title={
                                    isOngoing
                                        ? t('errorManagement.table.cannotUpdateOngoing')
                                        : t('errorManagement.table.edit')
                                }
                            >
                                <span>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        disabled={isOngoing}
                                        onClick={() => !isOngoing && onEdit(record)}
                                        aria-label={t('errorManagement.table.edit')}
                                    />
                                </span>
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
