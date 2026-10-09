'use client';

import { memo } from 'react';
import { Button, Flex, Tag, Typography, theme } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MONITOR_GROUP_ORDER, type MonitorGroupKey } from '../../utils/planMappers';
import type { MonitorRowVM } from '../../components/types';
import {
    getElapsedMinutes,
    isIncidentConfirmed,
    isReadyToComplete,
} from '../utils/incidentStatus';
import type { MonitorStatConfig } from '../hooks/useMonitorGroups';
import styles from '../../components/ProductionPlanTable.module.css';

const { Text } = Typography;

interface MonitorKanbanTabProps {
    statConfigs: MonitorStatConfig[];
    grouped: Record<MonitorGroupKey, MonitorRowVM[]>;
    loading: boolean;
    onOpenIncident: (row: MonitorRowVM) => void;
    onSelectRow: (row: MonitorRowVM) => void;
}

interface MonitorCardProps {
    row: MonitorRowVM;
    config: MonitorStatConfig;
    onOpenIncident: (row: MonitorRowVM) => void;
    onSelectRow: (row: MonitorRowVM) => void;
}

const MonitorCard = memo(function MonitorCard({
    row,
    config,
    onOpenIncident,
    onSelectRow,
}: MonitorCardProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const notAvailable = t('productionPlan.monitor.notAvailable');

    const confirmed = isIncidentConfirmed(row);
    const readyToComplete = isReadyToComplete(row);
    const elapsed = getElapsedMinutes(row.updatedAt);
    const reasonLabel = row.incidentReason
        ? t(`productionPlan.incidentReason.${row.incidentReason}`)
        : notAvailable;
    const isAlert = row.status === 'PAUSE' && !confirmed && !readyToComplete;
    const textColor = token.colorText;
    const mutedColor = token.colorTextTertiary;

    return (
        <div
            className={styles.monitorKanbanCard}
            onClick={() => onSelectRow(row)}
            style={{
                position: 'relative',
                overflow: 'hidden',
                borderLeft: `3px solid ${config.color}`,
                background: token.colorBgContainer,
                color: textColor,
            }}
        >
            {/* Decorative corner accent — space-monitoring motif */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    background: `${config.color}14`,
                    borderBottomLeftRadius: '100%',
                    pointerEvents: 'none',
                }}
            />
            <Flex align="center" justify="space-between" gap={8} style={{ position: 'relative' }}>
                <Text strong style={{ fontSize: 12.5, color: textColor }}>
                    {row.code}
                </Text>
                <Tag
                    style={{
                        margin: 0,
                        fontSize: 10.5,
                        color: token.colorTextSecondary,
                        background: token.colorFillTertiary,
                        border: 'none',
                    }}
                >
                    {row.machineCode} · {row.spaceName}
                </Tag>
            </Flex>
            {isAlert && (
                <Tag
                    style={{
                        margin: '6px 0 0',
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#fff',
                        background: token.colorError,
                        border: 'none',
                    }}
                    icon={<ExclamationCircleOutlined />}
                >
                    {t('productionPlan.monitor.needsAction')}
                </Tag>
            )}
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    margin: '5px 0 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: textColor,
                }}
            >
                {row.name}
            </div>
            <Flex align="center" justify="space-between">
                <Text style={{ fontSize: 11.5, color: mutedColor }}>
                    {row.moldCode ?? notAvailable}
                </Text>
                <Text strong style={{ fontSize: 11.5, color: mutedColor }}>
                    {t('productionPlan.monitor.kanban.plannedQty')}: {row.plannedQuantity}
                </Text>
            </Flex>
            {(row.status === 'RUNNING' || row.status === 'PAUSE') && (
                <Text
                    style={{
                        fontSize: 11,
                        display: 'block',
                        marginTop: 2,
                        color: mutedColor,
                    }}
                >
                    {t('productionPlan.monitor.kanban.producedQty')}:{' '}
                    {row.actualQuantity ?? notAvailable}
                </Text>
            )}
            {row.status === 'PARTIAL' && (
                <Tag
                    style={{
                        marginTop: 6,
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        background: token.colorSuccess,
                    }}
                >
                    {t('productionPlan.monitor.partialTag')}
                </Tag>
            )}
            {row.status === 'PAUSE' &&
                (confirmed ? (
                    <div
                        style={{
                            marginTop: 7,
                            padding: '6px 8px',
                            borderRadius: 8,
                            background: token.colorSuccessBg,
                            fontSize: 11,
                            color: token.colorTextSecondary,
                        }}
                    >
                        <CheckCircleOutlined
                            style={{ color: token.colorSuccess, marginRight: 4 }}
                        />
                        <b style={{ color: token.colorSuccess }}>
                            {t('productionPlan.monitor.confirmedTag')}
                        </b>{' '}
                        · {row.reason ?? notAvailable}
                    </div>
                ) : readyToComplete ? (
                    <div
                        style={{
                            marginTop: 7,
                            padding: '7px 8px',
                            borderRadius: 8,
                            background: token.colorSuccessBg,
                            border: `1px solid ${token.colorSuccessBorder}`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11.5,
                                color: token.colorText,
                                marginBottom: 6,
                            }}
                        >
                            {t('productionPlan.monitor.incident.readyToCompleteTitle')}
                        </div>
                        <Button
                            size="small"
                            block
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            style={{
                                background: token.colorSuccess,
                                borderColor: token.colorSuccess,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenIncident(row);
                            }}
                        >
                            {t('productionPlan.monitor.incident.completeButton')}
                        </Button>
                    </div>
                ) : (
                    <div
                        style={{
                            marginTop: 7,
                            padding: '7px 8px',
                            borderRadius: 8,
                            background: token.colorErrorBg,
                            border: `1px solid ${token.colorErrorBorder}`,
                        }}
                    >
                        <div style={{ fontSize: 11.5, color: token.colorText }}>{reasonLabel}</div>
                        <div
                            style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: token.colorError,
                                marginBottom: 6,
                            }}
                        >
                            {elapsed !== null
                                ? t('productionPlan.monitor.pausedFor', { count: elapsed })
                                : notAvailable}
                        </div>
                        <Button
                            size="small"
                            block
                            danger
                            type="primary"
                            icon={<ExclamationCircleOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenIncident(row);
                            }}
                        >
                            {t('productionPlan.monitor.incident.actionBtn')}
                        </Button>
                    </div>
                ))}
            <Text
                style={{
                    fontSize: 10.5,
                    display: 'block',
                    marginTop: 7,
                    color: mutedColor,
                }}
            >
                {t('productionPlan.monitor.lastUpdated')}:{' '}
                {row.updatedAt ? row.updatedAt.toLocaleTimeString('vi-VN') : notAvailable}
            </Text>
        </div>
    );
});

export default function MonitorKanbanTab({
    statConfigs,
    grouped,
    loading,
    onOpenIncident,
    onSelectRow,
}: MonitorKanbanTabProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    return (
        <div className={styles.monitorKanbanBoard}>
            {MONITOR_GROUP_ORDER.map((status) => {
                const rows = grouped[status];
                const config = statConfigs.find((c) => c.status === status)!;
                const Icon = config.icon;

                return (
                    <div
                        key={status}
                        className={styles.monitorKanbanColumn}
                        style={{ background: config.bg, border: `1px solid ${config.border}` }}
                    >
                        <Flex align="center" gap={10} style={{ padding: '14px 14px 12px' }}>
                            <span
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 8,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: token.colorBgContainer,
                                    color: config.color,
                                    flexShrink: 0,
                                }}
                            >
                                <Icon style={{ fontSize: 16 }} />
                            </span>
                            <Text strong style={{ fontSize: 13.5, color: config.color }}>
                                {t(`productionPlan.monitor.status.${status}`)}
                            </Text>
                            <Text
                                strong
                                style={{
                                    fontSize: 11.5,
                                    color: config.color,
                                    background: token.colorBgContainer,
                                    borderRadius: 999,
                                    padding: '1px 8px',
                                    marginLeft: 'auto',
                                }}
                            >
                                {rows.length}
                            </Text>
                        </Flex>

                        <div className={styles.monitorKanbanColumnBody}>
                            {loading ? null : rows.length === 0 ? (
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 12.5, padding: '4px 2px' }}
                                >
                                    {t('productionPlan.monitor.emptyGroup')}
                                </Text>
                            ) : (
                                rows.map((row) => (
                                    <MonitorCard
                                        key={row.productionPlanId}
                                        row={row}
                                        config={config}
                                        onOpenIncident={onOpenIncident}
                                        onSelectRow={onSelectRow}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
