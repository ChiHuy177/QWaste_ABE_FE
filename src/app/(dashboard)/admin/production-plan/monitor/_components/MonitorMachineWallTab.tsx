'use client';

import { useState, type ReactNode } from 'react';
import { Button, Flex, Typography, theme } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MonitorRowVM } from '../../_components/types';
import { getElapsedMinutes, isIncidentConfirmed } from '../_utils/incidentStatus';
import type { MonitorMachineGroup } from '../hooks/useMonitorMachineGroups';
import styles from '../../_components/ProductionPlanTable.module.css';

const { Text } = Typography;

interface MonitorMachineWallTabProps {
    groups: MonitorMachineGroup[];
    loading: boolean;
    onOpenIncident: (row: MonitorRowVM) => void;
    onSelectRow: (row: MonitorRowVM) => void;
}

/** Hàng thông tin kiểu "kính mờ" trên nền màu đặc — motif lặp lại từ MachineCard (space-monitoring). */
function GlassRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <Flex
            align="center"
            justify="space-between"
            style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '3px 8px',
                borderRadius: 6,
                backdropFilter: 'blur(10px)',
            }}
        >
            <Text style={{ fontSize: 10.5, color: '#fff', fontWeight: 500 }}>{label}</Text>
            <Text style={{ fontSize: 11.5, color: '#fff', fontWeight: 700 }}>{value}</Text>
        </Flex>
    );
}

export default function MonitorMachineWallTab({
    groups,
    loading,
    onOpenIncident,
    onSelectRow,
}: MonitorMachineWallTabProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const notAvailable = t('productionPlan.monitor.notAvailable');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (loading) return null;

    return (
        <div className={styles.monitorWallGrid}>
            {groups.map((group) => {
                const { current, queue, done, rows, totalPlanned } = group;
                const isPause = current?.status === 'PAUSE';
                const confirmed = isPause && isIncidentConfirmed(current!);
                const elapsed = isPause ? getElapsedMinutes(current!.updatedAt) : null;
                const reasonLabel = isPause
                    ? current!.incidentReason
                        ? t(`productionPlan.incidentReason.${current!.incidentReason}`)
                        : notAvailable
                    : notAvailable;

                // "Tạm dừng" luôn giữ tông vàng/cam dù đã xác nhận hay chưa — đỏ chỉ dùng làm
                // viền cảnh báo + pill nhãn để báo khẩn cấp, không chiếm nền cả tile.
                const isUrgent = isPause && !confirmed;
                let base = token.colorTextDisabled;
                let hover = token.colorTextSecondary;
                let shadowColor = token.colorBorder;
                let stateLabel = t('productionPlan.monitor.machineWall.idleTitle');

                if (isPause) {
                    base = token.colorWarning;
                    hover = token.colorWarningHover;
                    shadowColor = token.colorWarningBorder;
                    stateLabel = confirmed
                        ? t('productionPlan.monitor.confirmedTag')
                        : t('productionPlan.monitor.needsAction');
                } else if (current?.status === 'RUNNING') {
                    base = token.colorInfo;
                    hover = token.colorInfoHover;
                    shadowColor = token.colorInfoBorder;
                    stateLabel = t('productionPlan.monitor.status.IN_PROGRESS');
                } else if (queue.length > 0) {
                    base = token.colorWarning;
                    hover = token.colorWarningHover;
                    shadowColor = token.colorWarningBorder;
                    stateLabel = t('productionPlan.monitor.machineWall.idleTitle');
                } else {
                    base = token.colorSuccess;
                    hover = token.colorSuccessHover;
                    shadowColor = token.colorSuccessBorder;
                    stateLabel = t('productionPlan.monitor.machineWall.doneTitle');
                }

                const lastDone = done[done.length - 1];
                const clickTarget = current ?? lastDone ?? queue[0] ?? rows[0];
                const isHovered = hoveredId === group.machineId;

                return (
                    <div
                        key={group.machineId}
                        className={styles.monitorWallTile}
                        onClick={() => onSelectRow(clickTarget)}
                        onMouseEnter={() => setHoveredId(group.machineId)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                            background: isHovered ? hover : base,
                            color: token.colorTextLightSolid,
                            boxShadow: `0 4px 14px ${shadowColor}`,
                        }}
                    >
                        {/* Decorative corner — space-monitoring motif */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 44,
                                height: 44,
                                background: 'rgba(255,255,255,0.1)',
                                borderBottomLeftRadius: '100%',
                                pointerEvents: 'none',
                            }}
                        />

                        <Flex align="baseline" gap={9} style={{ marginBottom: 6, position: 'relative' }}>
                            <Text
                                strong
                                style={{
                                    fontSize: 18,
                                    color: '#fff',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                }}
                            >
                                {group.machineCode}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                                {group.spaceName}
                            </Text>
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 9px',
                                    borderRadius: 999,
                                    color: '#fff',
                                    background: isUrgent
                                        ? token.colorError
                                        : isPause && confirmed
                                          ? token.colorSuccess
                                          : 'rgba(255,255,255,0.22)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {stateLabel}
                            </span>
                        </Flex>

                        <div
                            style={{
                                height: 1,
                                background: 'rgba(255,255,255,0.2)',
                                margin: '2px 0 8px',
                            }}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {current ? (
                                <>
                                    <GlassRow
                                        label={
                                            isPause
                                                ? t('productionPlan.monitor.machineWall.pauseLabel')
                                                : t('productionPlan.monitor.machineWall.currentLabel')
                                        }
                                        value={current.name}
                                    />
                                    <GlassRow
                                        label={`${current.code} · ${current.moldCode ?? notAvailable}`}
                                        value={`${t('productionPlan.monitor.kanban.plannedQty')}: ${current.plannedQuantity}`}
                                    />
                                    <GlassRow
                                        label={t('productionPlan.monitor.kanban.producedQty')}
                                        value={notAvailable}
                                    />
                                    {isPause && (
                                        <GlassRow
                                            label={reasonLabel}
                                            value={
                                                confirmed
                                                    ? (current!.reason ?? notAvailable)
                                                    : elapsed !== null
                                                      ? t('productionPlan.monitor.pausedFor', {
                                                            count: elapsed,
                                                        })
                                                      : notAvailable
                                            }
                                        />
                                    )}
                                    <GlassRow
                                        label={t('productionPlan.monitor.lastUpdated')}
                                        value={
                                            current.updatedAt
                                                ? current.updatedAt.toLocaleTimeString('vi-VN')
                                                : notAvailable
                                        }
                                    />
                                    {isPause && !confirmed && (
                                        <Button
                                            size="small"
                                            block
                                            icon={<ExclamationCircleOutlined />}
                                            style={{
                                                marginTop: 2,
                                                background: '#fff',
                                                color: token.colorError,
                                                border: 'none',
                                                fontWeight: 700,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenIncident(current!);
                                            }}
                                        >
                                            {t('productionPlan.monitor.incident.actionBtn')}
                                        </Button>
                                    )}
                                    {isPause && confirmed && (
                                        <Flex align="center" gap={5} style={{ fontSize: 11, opacity: 0.9 }}>
                                            <CheckCircleOutlined />
                                            {t('productionPlan.monitor.confirmedTag')}
                                        </Flex>
                                    )}
                                </>
                            ) : queue.length > 0 ? (
                                <GlassRow
                                    label={stateLabel}
                                    value={t('productionPlan.monitor.machineWall.idleDesc', {
                                        count: queue.length,
                                    })}
                                />
                            ) : lastDone ? (
                                <>
                                    <GlassRow label={lastDone.code} value={lastDone.name} />
                                    <GlassRow
                                        label={t('productionPlan.monitor.kanban.plannedQty')}
                                        value={lastDone.plannedQuantity}
                                    />
                                    <GlassRow
                                        label={t('productionPlan.monitor.machineWall.doneDesc')}
                                        value=""
                                    />
                                </>
                            ) : null}

                            {queue.length > 0 && (
                                <GlassRow
                                    label={t('productionPlan.monitor.machineWall.queueLabel')}
                                    value={
                                        queue
                                            .slice(0, 3)
                                            .map((q) => q.code)
                                            .join(', ') + (queue.length > 3 ? ` +${queue.length - 3}` : '')
                                    }
                                />
                            )}

                            <div
                                style={{
                                    textAlign: 'right',
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.75)',
                                    marginTop: 2,
                                }}
                            >
                                {t('productionPlan.monitor.machineWall.dayTotal', {
                                    qty: totalPlanned,
                                    count: rows.length,
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
