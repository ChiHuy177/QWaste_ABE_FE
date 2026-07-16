'use client';

import { useEffect, useState } from 'react';
import { Descriptions, Divider, Empty, Flex, Modal, Spin, Tag, Timeline, Typography, theme } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    RightOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type {
    ProductionPlanDetail,
    ProductionPlanStatus,
    ProductionPlanStatusLog,
} from '@/types/ProductionPlan';
import { MONITOR_GROUP_BY_STATUS, MonitorGroupKey, monitorGroupColor } from '../_utils/planMappers';
import type { MonitorRowVM } from './types';

const { Text } = Typography;

const STATUS_FLOW: MonitorGroupKey[] = ['TODO', 'IN_PROGRESS', 'PAUSE', 'COMPLETE'];

const STATUS_ICON: Record<MonitorGroupKey, React.ComponentType<{ style?: React.CSSProperties }>> = {
    TODO: ClockCircleOutlined,
    IN_PROGRESS: SyncOutlined,
    PAUSE: PauseCircleOutlined,
    COMPLETE: CheckCircleOutlined,
};

interface Props {
    row: MonitorRowVM | null;
    open: boolean;
    onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    const { token } = theme.useToken();
    return (
        <Text
            style={{
                fontSize: 11,
                fontWeight: 600,
                color: token.colorTextSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: 10,
            }}
        >
            {children}
        </Text>
    );
}

export default function ProductDetailModal({ row, open, onClose }: Props) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { handleError } = useApiErrorHandler();

    /** Cùng mã màu với pill trạng thái trên header Collapse của trang monitor. */
    const statusLogColor = (status: ProductionPlanStatus): string =>
        monitorGroupColor(MONITOR_GROUP_BY_STATUS[status], token);

    const [detail, setDetail] = useState<ProductionPlanDetail | null>(null);
    const [logs, setLogs] = useState<ProductionPlanStatusLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !row) {
            setDetail(null);
            setLogs([]);
            return;
        }
        let cancelled = false;

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const [detailResponse, logsResponse] = await Promise.all([
                    ProductionPlanService.getProductionPlanById(row.productionPlanId),
                    ProductionPlanService.getProductionPlanStatusLogs(row.productionPlanId),
                ]);
                if (!cancelled) {
                    setDetail(detailResponse);
                    setLogs(logsResponse);
                }
            } catch (error) {
                if (!cancelled) {
                    handleError(error, { fallbackKey: 'productionPlan.fetchError' });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDetail();
        return () => {
            cancelled = true;
        };
    }, [handleError, open, row]);

    const STATUS_STYLE: Record<MonitorGroupKey, { color: string; bg: string; border: string }> = {
        TODO: { color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
        IN_PROGRESS: { color: token.colorInfo, bg: token.colorInfoBg, border: token.colorInfo },
        PAUSE: { color: token.colorWarning, bg: token.colorWarningBg, border: token.colorWarning },
        COMPLETE: {
            color: token.colorSuccess,
            bg: token.colorSuccessBg,
            border: token.colorSuccess,
        },
    };

    if (!row) return null;

    const activeGroup = MONITOR_GROUP_BY_STATUS[row.status];
    const isPartial = row.status === 'PARTIAL';

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={640}
            styles={{ body: { paddingTop: 4 } }}
            title={
                <Flex align="center" gap={8} style={{ flexWrap: 'wrap', paddingRight: 8 }}>
                    <Text strong style={{ fontSize: 15 }}>
                        {row.code}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                        ·
                    </Text>
                    <Text
                        type="secondary"
                        style={{ fontSize: 13, fontWeight: 400, flex: 1, minWidth: 0 }}
                        ellipsis={{ tooltip: row.name }}
                    >
                        {row.name}
                    </Text>
                    {isPartial && (
                        <Tag
                            style={{
                                margin: 0,
                                border: 'none',
                                color: '#fff',
                                fontWeight: 600,
                                background: monitorGroupColor('COMPLETE', token),
                            }}
                        >
                            {t('productionPlan.monitor.partialTag')}
                        </Tag>
                    )}
                </Flex>
            }
        >
            <Spin spinning={loading}>
                {/* ── Section 1: Status flow ── */}
                <SectionLabel>{t('productionPlan.monitor.detail.statusTrack')}</SectionLabel>

                <Flex gap={6} align="center" style={{ marginBottom: 10 }}>
                    {STATUS_FLOW.map((groupKey, i) => {
                        const cfg = STATUS_STYLE[groupKey];
                        const Icon = STATUS_ICON[groupKey];
                        const isActive = groupKey === activeGroup;

                        return (
                            <Flex
                                key={groupKey}
                                align="center"
                                style={{ flex: 1, gap: 0, minWidth: 0 }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        padding: '10px 8px',
                                        borderRadius: 10,
                                        background: isActive ? cfg.bg : token.colorFillTertiary,
                                        border: `1px solid ${isActive ? cfg.border : 'transparent'}`,
                                        textAlign: 'center',
                                        boxShadow: isActive
                                            ? `0 0 0 2px ${cfg.border}30`
                                            : undefined,
                                    }}
                                >
                                    <Icon
                                        style={{
                                            fontSize: 20,
                                            color: isActive ? cfg.color : token.colorTextQuaternary,
                                            display: 'block',
                                            marginBottom: 6,
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: isActive ? cfg.color : token.colorTextQuaternary,
                                            fontWeight: isActive ? 700 : 400,
                                            lineHeight: 1.3,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t(`productionPlan.monitor.status.${groupKey}`)}
                                    </div>
                                </div>
                                {i < STATUS_FLOW.length - 1 && (
                                    <RightOutlined
                                        style={{
                                            color: token.colorTextQuaternary,
                                            fontSize: 10,
                                            flexShrink: 0,
                                            margin: '0 2px',
                                        }}
                                    />
                                )}
                            </Flex>
                        );
                    })}
                </Flex>

                <Text type="secondary" style={{ fontSize: 12 }}>
                    {row.updatedAt
                        ? `${t('productionPlan.monitor.lastUpdated')}: ${row.updatedAt.toLocaleString('vi-VN')}`
                        : t('productionPlan.monitor.detail.noUpdate')}
                </Text>

                <Divider style={{ margin: '16px 0' }} />

                {/* ── Section 2: Product info ── */}
                <SectionLabel>{t('productionPlan.monitor.detail.productInfo')}</SectionLabel>

                <Descriptions
                    column={2}
                    size="small"
                    styles={{
                        label: {
                            fontWeight: 500,
                            color: token.colorTextSecondary,
                            width: 110,
                        },
                    }}
                    items={[
                        {
                            key: 'code',
                            label: t('productionPlan.monitor.detail.code'),
                            children: (
                                <Text strong style={{ color: token.colorPrimary }}>
                                    {row.code}
                                </Text>
                            ),
                        },
                        {
                            key: 'line',
                            label: t('productionPlan.monitor.detail.line'),
                            children: row.spaceName || '—',
                        },
                        {
                            key: 'name',
                            label: t('productionPlan.monitor.detail.name'),
                            children: row.name,
                            span: 2,
                        },
                        {
                            key: 'machine',
                            label: t('productionPlan.monitor.detail.machine'),
                            children: (
                                <Tag color="blue" style={{ margin: 0 }}>
                                    {row.machineCode}
                                </Tag>
                            ),
                        },
                        {
                            key: 'mold',
                            label: t('productionPlan.monitor.detail.mold'),
                            children: (
                                <Text code style={{ fontSize: 12 }}>
                                    {detail?.snapshotMoldCode ?? row.moldCode ?? '—'}
                                </Text>
                            ),
                        },
                        {
                            key: 'plannedDate',
                            label: t('productionPlan.monitor.detail.plannedDate'),
                            children: detail?.plannedDate ?? '—',
                        },
                        {
                            key: 'operationType',
                            label: t('productionPlan.monitor.detail.operationType'),
                            children: detail?.snapshotOperationTypeName ?? '—',
                        },
                        {
                            key: 'plannedQuantity',
                            label: t('productionPlan.monitor.detail.plannedQuantity'),
                            children: (
                                <Text strong>{row.plannedQuantity.toLocaleString('vi-VN')}</Text>
                            ),
                        },
                        {
                            key: 'actualQuantity',
                            label: t('productionPlan.monitor.detail.actualQuantity'),
                            children:
                                detail?.actualQuantity != null
                                    ? detail.actualQuantity.toLocaleString('vi-VN')
                                    : '—',
                        },
                        ...(detail?.note
                            ? [
                                  {
                                      key: 'note',
                                      label: t('productionPlan.monitor.detail.note'),
                                      children: detail.note,
                                      span: 2 as const,
                                  },
                              ]
                            : []),
                    ]}
                />

                <Divider style={{ margin: '16px 0' }} />

                {/* ── Section 3: Status logs ── */}
                <SectionLabel>{t('productionPlan.monitor.detail.statusLogs')}</SectionLabel>

                <div style={{ height: 260, overflowY: 'auto', paddingRight: 4 }}>
                    {logs.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={t('productionPlan.monitor.detail.noLogs')}
                        />
                    ) : (
                        <Timeline
                            items={logs.map((log) => ({
                                key: log.productionPlanStatusLogId,
                                dot: (
                                    <span
                                        style={{
                                            display: 'block',
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: statusLogColor(log.toStatus),
                                        }}
                                    />
                                ),
                                children: (
                                    <div>
                                        <Flex gap={6} align="center" wrap="wrap">
                                            {log.fromStatus && (
                                                <>
                                                    <Tag
                                                        style={{
                                                            margin: 0,
                                                            border: 'none',
                                                            color: '#fff',
                                                            fontWeight: 600,
                                                            background: statusLogColor(log.fromStatus),
                                                        }}
                                                    >
                                                        {t(
                                                            `productionPlan.status.${log.fromStatus}`
                                                        )}
                                                    </Tag>
                                                    <RightOutlined
                                                        style={{
                                                            fontSize: 10,
                                                            color: token.colorTextQuaternary,
                                                        }}
                                                    />
                                                </>
                                            )}
                                            <Tag
                                                style={{
                                                    margin: 0,
                                                    border: 'none',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    background: statusLogColor(log.toStatus),
                                                }}
                                            >
                                                {t(`productionPlan.status.${log.toStatus}`)}
                                            </Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {t(`productionPlan.trigger.${log.trigger}`)}
                                            </Text>
                                        </Flex>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 12, display: 'block', marginTop: 2 }}
                                        >
                                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                                            {log.changedBy && ` · ${log.changedBy}`}
                                            {log.incidentReason &&
                                                ` · ${t(`productionPlan.incidentReason.${log.incidentReason}`)}`}
                                        </Text>
                                        {log.reason && (
                                            <Text style={{ fontSize: 12, display: 'block' }}>
                                                {log.reason}
                                            </Text>
                                        )}
                                    </div>
                                ),
                            }))}
                        />
                    )}
                </div>
            </Spin>
        </Modal>
    );
}
