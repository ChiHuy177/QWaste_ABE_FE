'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Button, Flex, Tooltip, Typography, theme } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MonitorRowVM } from '../../_components/types';
import { getElapsedMinutes, isIncidentConfirmed, isReadyToComplete } from '../_utils/incidentStatus';
import type { MonitorMachineGroup } from '../hooks/useMonitorMachineGroups';
import styles from '../../_components/ProductionPlanTable.module.css';

const { Text } = Typography;

interface MonitorTimelineTabProps {
    groups: MonitorMachineGroup[];
    products: MonitorRowVM[];
    loading: boolean;
    onOpenIncident: (row: MonitorRowVM) => void;
    onSelectRow: (row: MonitorRowVM) => void;
}

export default function MonitorTimelineTab({
    groups,
    products,
    loading,
    onOpenIncident,
    onSelectRow,
}: MonitorTimelineTabProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const notAvailable = t('productionPlan.monitor.notAvailable');

    if (loading) return null;

    const unconfirmed = products
        .filter((row) => row.status === 'PAUSE' && !isIncidentConfirmed(row) && !isReadyToComplete(row))
        .map((row) => ({ row, elapsed: getElapsedMinutes(row.updatedAt) }))
        .sort((a, b) => (b.elapsed ?? -1) - (a.elapsed ?? -1));
    const confirmedList = products.filter((row) => row.status === 'PAUSE' && isIncidentConfirmed(row));
    const readyToCompleteList = products.filter(
        (row) => row.status === 'PAUSE' && !isIncidentConfirmed(row) && isReadyToComplete(row)
    );

    const legend: Array<{ key: string; swatch: CSSProperties }> = [
        { key: 'legendComplete', swatch: { background: token.colorSuccess } },
        {
            key: 'legendProgress',
            swatch: { background: token.colorInfoBg, border: `1.5px solid ${token.colorInfo}` },
        },
        {
            key: 'legendPauseBad',
            swatch: { background: token.colorWarningBg, border: `1.5px solid ${token.colorError}` },
        },
        {
            key: 'legendPauseOk',
            swatch: {
                background: token.colorWarningBg,
                border: `1.5px solid ${token.colorWarningBorder}`,
            },
        },
        {
            key: 'legendTodo',
            swatch: {
                background: token.colorFillTertiary,
                border: `1.5px dashed ${token.colorTextTertiary}`,
            },
        },
    ];

    return (
        <div className={styles.monitorTimelineLayout}>
            <aside className={styles.monitorTimelineRail}>
                <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
                    <Text strong style={{ fontSize: 13 }}>
                        {t('productionPlan.monitor.needsAction')}
                    </Text>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#fff',
                            background: token.colorError,
                            padding: '2px 8px',
                            borderRadius: 999,
                        }}
                    >
                        {unconfirmed.length}
                    </span>
                </Flex>

                {unconfirmed.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.monitor.timeline.noIncidents')}
                    </Text>
                ) : (
                    unconfirmed.map(({ row, elapsed }) => (
                        <div
                            key={row.productionPlanId}
                            style={{
                                position: 'relative',
                                overflow: 'hidden',
                                background: token.colorWarningBg,
                                borderRadius: 10,
                                padding: '9px 10px',
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 32,
                                    height: 32,
                                    background: `${token.colorWarning}22`,
                                    borderBottomLeftRadius: '100%',
                                    pointerEvents: 'none',
                                }}
                            />
                            <Flex align="center" justify="space-between" style={{ marginBottom: 3 }}>
                                <Text strong style={{ fontSize: 12.5 }}>
                                    {row.machineCode}
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: 700, color: token.colorError }}>
                                    {elapsed !== null
                                        ? t('productionPlan.monitor.minutesAgo', { count: elapsed })
                                        : notAvailable}
                                </Text>
                            </Flex>
                            <div style={{ fontSize: 12, marginBottom: 2 }}>{row.name}</div>
                            <div
                                style={{ fontSize: 11, color: token.colorTextSecondary, marginBottom: 7 }}
                            >
                                {row.incidentReason
                                    ? t(`productionPlan.incidentReason.${row.incidentReason}`)
                                    : notAvailable}
                            </div>
                            <Button
                                size="small"
                                block
                                danger
                                type="primary"
                                icon={<ExclamationCircleOutlined />}
                                onClick={() => onOpenIncident(row)}
                            >
                                {t('productionPlan.monitor.incident.actionBtn')}
                            </Button>
                        </div>
                    ))
                )}

                {readyToCompleteList.length > 0 && (
                    <>
                        <div
                            style={{
                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                margin: '10px 0',
                            }}
                        />
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                                display: 'block',
                                marginBottom: 6,
                            }}
                        >
                            {t('productionPlan.monitor.incident.readyToCompleteBadge')}
                        </Text>
                        {readyToCompleteList.map((row) => (
                            <div
                                key={row.productionPlanId}
                                style={{
                                    borderRadius: 10,
                                    background: token.colorSuccessBg,
                                    border: `1px solid ${token.colorSuccessBorder}`,
                                    padding: '9px 10px',
                                    marginBottom: 8,
                                }}
                            >
                                <Flex align="center" justify="space-between" style={{ marginBottom: 3 }}>
                                    <Text strong style={{ fontSize: 12.5 }}>
                                        {row.machineCode}
                                    </Text>
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: token.colorSuccess }}>
                                        {row.plannedQuantity}/{row.plannedQuantity}
                                    </Text>
                                </Flex>
                                <div style={{ fontSize: 12, marginBottom: 7 }}>{row.name}</div>
                                <Button
                                    size="small"
                                    block
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    style={{ background: token.colorSuccess, borderColor: token.colorSuccess }}
                                    onClick={() => onOpenIncident(row)}
                                >
                                    {t('productionPlan.monitor.incident.completeButton')}
                                </Button>
                            </div>
                        ))}
                    </>
                )}

                {confirmedList.length > 0 && (
                    <>
                        <div
                            style={{
                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                margin: '10px 0',
                            }}
                        />
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                                display: 'block',
                                marginBottom: 6,
                            }}
                        >
                            {t('productionPlan.monitor.timeline.recentlyConfirmed')}
                        </Text>
                        {confirmedList.map((row) => (
                            <div
                                key={row.productionPlanId}
                                style={{
                                    fontSize: 11.5,
                                    color: token.colorTextSecondary,
                                    background: token.colorSuccessBg,
                                    borderRadius: 7,
                                    padding: '6px 8px',
                                    marginBottom: 6,
                                }}
                            >
                                <b style={{ color: token.colorSuccess }}>{row.machineCode}</b> ·{' '}
                                {row.reason ?? notAvailable}
                            </div>
                        ))}
                    </>
                )}

                <div
                    style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                    }}
                >
                    {legend.map(({ key, swatch }) => (
                        <Flex key={key} align="center" gap={7}>
                            <span
                                style={{
                                    width: 16,
                                    height: 9,
                                    borderRadius: 3,
                                    flex: 'none',
                                    ...swatch,
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t(`productionPlan.monitor.timeline.${key}`)}
                            </Text>
                        </Flex>
                    ))}
                </div>
            </aside>

            <section className={styles.monitorTimelineCard}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                    {t('productionPlan.monitor.timeline.orderNote')}
                </Text>

                {groups.map((group) => (
                    <div key={group.machineId} className={styles.monitorTimelineRow}>
                        <div className={styles.monitorTimelineLabel}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{group.machineCode}</div>
                            <div style={{ fontSize: 10.5, color: token.colorTextTertiary }}>
                                {group.spaceName}
                            </div>
                        </div>
                        <div className={styles.monitorTimelineLane}>
                            {group.rows.map((row) => {
                                const confirmed = row.status === 'PAUSE' && isIncidentConfirmed(row);
                                const readyToComplete = row.status === 'PAUSE' && isReadyToComplete(row);
                                const elapsed =
                                    row.status === 'PAUSE' ? getElapsedMinutes(row.updatedAt) : null;
                                const reasonLabel = row.incidentReason
                                    ? t(`productionPlan.incidentReason.${row.incidentReason}`)
                                    : notAvailable;

                                let blockStyle: CSSProperties = {};
                                let icon: ReactNode = null;
                                if (row.status === 'COMPLETE' || row.status === 'PARTIAL') {
                                    blockStyle = { background: token.colorSuccess, color: '#fff' };
                                } else if (row.status === 'RUNNING') {
                                    blockStyle = {
                                        background: token.colorInfoBg,
                                        border: `1.5px solid ${token.colorInfo}`,
                                        color: token.colorInfo,
                                    };
                                } else if (row.status === 'PAUSE') {
                                    blockStyle = {
                                        background: token.colorWarningBg,
                                        border: `1.5px solid ${
                                            confirmed || readyToComplete
                                                ? token.colorWarningBorder
                                                : token.colorError
                                        }`,
                                        color: token.colorWarningText,
                                    };
                                    icon =
                                        confirmed || readyToComplete ? (
                                            <CheckCircleOutlined
                                                style={{ marginRight: 4, color: token.colorSuccess }}
                                            />
                                        ) : (
                                            <ExclamationCircleOutlined
                                                style={{ marginRight: 4, color: token.colorError }}
                                            />
                                        );
                                } else {
                                    blockStyle = {
                                        background: token.colorFillTertiary,
                                        border: `1.5px dashed ${token.colorTextTertiary}`,
                                        color: token.colorTextSecondary,
                                    };
                                }

                                return (
                                    <Tooltip
                                        key={row.productionPlanId}
                                        title={
                                            <div style={{ fontSize: 12 }}>
                                                <div style={{ fontWeight: 700 }}>{row.name}</div>
                                                <div>
                                                    {row.moldCode ?? notAvailable} ·{' '}
                                                    {t('productionPlan.monitor.kanban.plannedQty')}:{' '}
                                                    {row.plannedQuantity}
                                                </div>
                                                <div>
                                                    {t('productionPlan.monitor.kanban.producedQty')}:{' '}
                                                    {notAvailable}
                                                </div>
                                                {row.status === 'PAUSE' && (
                                                    <>
                                                        <div>{reasonLabel}</div>
                                                        <div>
                                                            {elapsed !== null
                                                                ? t('productionPlan.monitor.pausedFor', {
                                                                      count: elapsed,
                                                                  })
                                                                : notAvailable}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        }
                                    >
                                        <div
                                            className={styles.monitorTimelineBlock}
                                            style={{ ...blockStyle, fontSize: 11, fontWeight: 600 }}
                                            onClick={() => onSelectRow(row)}
                                        >
                                            {icon}
                                            {row.code}
                                        </div>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
