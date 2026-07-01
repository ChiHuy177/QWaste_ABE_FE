'use client';

import { Descriptions, Divider, Flex, Modal, Tag, Tooltip, Typography, theme } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    RightOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MonitorProduct } from '@/hooks/useProductionMonitor';
import type { ProductionStatus } from './types';

const { Text } = Typography;

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const STATUS_FLOW: ProductionStatus[] = ['TODO', 'IN_PROGRESS', 'PAUSE', 'COMPLETE'];

const STATUS_ICON: Record<ProductionStatus, React.ComponentType<{ style?: React.CSSProperties }>> = {
    TODO: ClockCircleOutlined,
    IN_PROGRESS: SyncOutlined,
    PAUSE: PauseCircleOutlined,
    COMPLETE: CheckCircleOutlined,
};

interface Props {
    product: MonitorProduct | null;
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

interface WeeklyScheduleProps {
    schedule: [number, number, number, number, number, number, number];
    pcsMultiplier: number;
}

function WeeklySchedule({ schedule, pcsMultiplier }: WeeklyScheduleProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const maxQty = Math.max(...schedule, 1);
    const totalLots = schedule.reduce((a, b) => a + b, 0);

    return (
        <div>
            <Flex gap={6}>
                {schedule.map((qty, i) => {
                    const isEmpty = qty === 0;
                    const pct = (qty / maxQty) * 100;
                    const dayKey = DAY_KEYS[i];
                    const isWeekend = i >= 5;

                    return (
                        <Tooltip
                            key={dayKey}
                            title={
                                isEmpty ? undefined : (
                                    <span>
                                        {qty} {t('productionPlan.monitor.detail.lots')}
                                        {' · '}
                                        {qty * pcsMultiplier} {t('productionPlan.monitor.detail.pcs')}
                                    </span>
                                )
                            }
                        >
                            <div
                                style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    cursor: isEmpty ? 'default' : 'help',
                                }}
                            >
                                {/* Bar chart area */}
                                <div
                                    style={{
                                        height: 56,
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        marginBottom: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '65%',
                                            height: isEmpty ? 4 : `${Math.max(pct, 8)}%`,
                                            borderRadius: '3px 3px 0 0',
                                            background: isEmpty
                                                ? token.colorFillSecondary
                                                : isWeekend
                                                  ? token.colorPrimaryBg
                                                  : token.colorPrimary,
                                            opacity: isEmpty ? 0.5 : 1,
                                            transition: 'height 0.3s ease',
                                        }}
                                    />
                                </div>

                                {/* Lot count */}
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: isEmpty ? 400 : 700,
                                        color: isEmpty ? token.colorTextQuaternary : token.colorText,
                                        marginBottom: 3,
                                        lineHeight: 1,
                                    }}
                                >
                                    {isEmpty ? '—' : qty}
                                </div>

                                {/* Day label */}
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: isWeekend
                                            ? token.colorPrimary
                                            : token.colorTextSecondary,
                                        fontWeight: isWeekend ? 600 : 400,
                                    }}
                                >
                                    {t(`productionPlan.monitor.detail.days.${dayKey}`)}
                                </div>
                            </div>
                        </Tooltip>
                    );
                })}
            </Flex>

            {/* Summary row */}
            <div
                style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: token.colorFillQuaternary,
                    border: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Flex justify="space-between" wrap="wrap" gap={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.monitor.detail.totalWeeklyLots')}:{' '}
                        <Text strong style={{ color: token.colorText }}>
                            {totalLots}
                        </Text>{' '}
                        {t('productionPlan.monitor.detail.lots')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.monitor.detail.totalWeeklyPcs')}:{' '}
                        <Text strong style={{ color: token.colorPrimary }}>
                            {(totalLots * pcsMultiplier).toLocaleString('vi-VN')}
                        </Text>{' '}
                        {t('productionPlan.monitor.detail.pcs')}
                    </Text>
                </Flex>
            </div>
        </div>
    );
}

export default function ProductDetailModal({ product, open, onClose }: Props) {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const STATUS_STYLE: Record<ProductionStatus, { color: string; bg: string; border: string }> = {
        TODO: { color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
        IN_PROGRESS: { color: token.colorInfo, bg: token.colorInfoBg, border: token.colorInfo },
        PAUSE: { color: token.colorWarning, bg: token.colorWarningBg, border: token.colorWarning },
        COMPLETE: { color: token.colorSuccess, bg: token.colorSuccessBg, border: token.colorSuccess },
    };

    if (!product) return null;

    const currentStyle = STATUS_STYLE[product.status];
    const machineNames = [
        product.machine,
        ...(product.machineOverrides?.filter(Boolean) ?? []),
    ];
    const uniqueMachines = [...new Set(machineNames)];

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
                        {product.code}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                        ·
                    </Text>
                    <Text
                        type="secondary"
                        style={{ fontSize: 13, fontWeight: 400, flex: 1, minWidth: 0 }}
                        ellipsis={{ tooltip: product.name }}
                    >
                        {product.name}
                    </Text>
                </Flex>
            }
        >
            {/* ── Section 1: Status flow ── */}
            <SectionLabel>{t('productionPlan.monitor.detail.statusTrack')}</SectionLabel>

            <Flex gap={6} align="center" style={{ marginBottom: 10 }}>
                {STATUS_FLOW.map((s, i) => {
                    const cfg = STATUS_STYLE[s];
                    const Icon = STATUS_ICON[s];
                    const isActive = s === product.status;

                    return (
                        <Flex key={s} align="center" style={{ flex: 1, gap: 0, minWidth: 0 }}>
                            <div
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    borderRadius: 10,
                                    background: isActive ? cfg.bg : token.colorFillTertiary,
                                    border: `1px solid ${isActive ? cfg.border : 'transparent'}`,
                                    textAlign: 'center',
                                    boxShadow: isActive ? `0 0 0 2px ${cfg.border}30` : undefined,
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
                                    {t(`productionPlan.monitor.status.${s}`)}
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
                {product.updatedAt
                    ? `${t('productionPlan.monitor.lastUpdated')}: ${product.updatedAt.toLocaleString('vi-VN')}`
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
                        whiteSpace: 'nowrap',
                        color: token.colorTextSecondary,
                        width: 110,
                    },
                }}
                items={[
                    // Row 1: code (1) + line (1) = 2 ✓
                    {
                        key: 'code',
                        label: t('productionPlan.monitor.detail.code'),
                        children: <Text strong style={{ color: token.colorPrimary }}>{product.code}</Text>,
                    },
                    {
                        key: 'line',
                        label: t('productionPlan.monitor.detail.line'),
                        children: product.lineName,
                    },
                    // Row 2: name full (2) = 2 ✓
                    {
                        key: 'name',
                        label: t('productionPlan.monitor.detail.name'),
                        children: product.name,
                        span: 2,
                    },
                    // Row 3: machine full (2) = 2 ✓ — cần space để render tags
                    {
                        key: 'machine',
                        label: t('productionPlan.monitor.detail.machine'),
                        children: (
                            <Flex gap={4} wrap="wrap">
                                {uniqueMachines.map((m) => (
                                    <Tag key={m} color="blue" style={{ margin: 0 }}>
                                        {m}
                                    </Tag>
                                ))}
                            </Flex>
                        ),
                        span: 2,
                    },
                    // Row 4: mold (1) + time (1) = 2 ✓
                    {
                        key: 'mold',
                        label: t('productionPlan.monitor.detail.mold'),
                        children: (
                            <Text code style={{ fontSize: 12 }}>
                                {product.mold}
                            </Text>
                        ),
                    },
                    {
                        key: 'time',
                        label: t('productionPlan.monitor.detail.time'),
                        children: product.time,
                    },
                    // Row 5: pcs full (2) = 2 ✓
                    {
                        key: 'pcs',
                        label: t('productionPlan.monitor.detail.pcsMultiplier'),
                        children: (
                            <Text>
                                <Text strong>{product.pcsMultiplier}</Text>{' '}
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('productionPlan.monitor.detail.pcs')} /{' '}
                                    {t('productionPlan.monitor.detail.lot')}
                                </Text>
                            </Text>
                        ),
                        span: 2,
                    },
                ]}
            />

            <Divider style={{ margin: '16px 0' }} />

            {/* ── Section 3: Weekly schedule ── */}
            <SectionLabel>{t('productionPlan.monitor.detail.weeklySchedule')}</SectionLabel>
            <WeeklySchedule schedule={product.schedule} pcsMultiplier={product.pcsMultiplier} />
        </Modal>
    );
}
