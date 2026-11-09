'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Button,
    Descriptions,
    Divider,
    Empty,
    Flex,
    Modal,
    Spin,
    Tag,
    Timeline,
    Typography,
    theme,
} from 'antd';
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
import { MONITOR_GROUP_BY_STATUS, MonitorGroupKey, monitorGroupColor } from '../utils/planMappers';
import type { MonitorRowVM } from './types';

const { Text } = Typography;

const STATUS_FLOW: MonitorGroupKey[] = ['TODO', 'IN_PROGRESS', 'PAUSE', 'COMPLETE'];

const LOGS_PAGE_SIZE = 20;

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
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Chỉ phụ thuộc id/status thay vì cả object `row` — `row` đổi reference mỗi tick WS của
    // plan này (kể cả tick sản lượng MQTT, ~2 lần/giây), nên dùng nó làm dep sẽ bắn lại cả 2
    // API liên tục, nháy Spin và xoá state phân trang của status log.
    const planId = open ? (row?.productionPlanId ?? null) : null;
    const planStatus = row?.status;

    // ── Detail: các field từ API này là snapshot tĩnh theo plan (mã khuôn, ngày kế hoạch,
    // loại công đoạn, ghi chú) → fetch 1 lần mỗi lần mở. Sản lượng/trạng thái realtime đọc
    // trực tiếp từ `row`.
    useEffect(() => {
        if (!planId) {
            setDetail(null);
            return;
        }
        let cancelled = false;

        const fetchDetail = async () => {
            try {
                setLoadingDetail(true);
                const response = await ProductionPlanService.getProductionPlanById(planId);
                if (!cancelled) setDetail(response);
            } catch (error) {
                if (!cancelled) {
                    handleError(error, { fallbackKey: 'productionPlan.fetchError' });
                }
            } finally {
                if (!cancelled) setLoadingDetail(false);
            }
        };

        fetchDetail();
        return () => {
            cancelled = true;
        };
    }, [handleError, planId]);

    // ── Status logs: log mới chỉ sinh ra khi status đổi → refetch theo `planStatus`, không
    // theo tick sản lượng.
    const logsPlanIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!planId) {
            logsPlanIdRef.current = null;
            setLogs([]);
            setNextCursor(null);
            setHasMore(false);
            return;
        }

        // Đổi plan → xoá log của plan cũ và hiện loading. Cùng plan nhưng đổi status →
        // refetch im lặng, giữ list hiện tại để không nháy Empty giữa 2 lần fetch.
        const isPlanSwitch = logsPlanIdRef.current !== planId;
        logsPlanIdRef.current = planId;
        if (isPlanSwitch) {
            setLogs([]);
            setNextCursor(null);
            setHasMore(false);
            setLoadingLogs(true);
        }

        let cancelled = false;

        const fetchLogs = async () => {
            try {
                const response = await ProductionPlanService.getProductionPlanStatusLogs(planId, {
                    limit: LOGS_PAGE_SIZE,
                });
                if (cancelled) return;
                setLogs(response.items);
                setNextCursor(response.nextCursor);
                setHasMore(response.hasMore);
            } catch (error) {
                if (!cancelled) {
                    handleError(error, { fallbackKey: 'productionPlan.fetchError' });
                }
            } finally {
                if (!cancelled) setLoadingLogs(false);
            }
        };

        fetchLogs();
        return () => {
            cancelled = true;
        };
    }, [handleError, planId, planStatus]);

    const loadMoreLogs = async () => {
        if (!planId || !nextCursor || loadingMore) return;
        try {
            setLoadingMore(true);
            const response = await ProductionPlanService.getProductionPlanStatusLogs(planId, {
                limit: LOGS_PAGE_SIZE,
                cursor: nextCursor,
            });
            setLogs((prev) => [...prev, ...response.items]);
            setNextCursor(response.nextCursor);
            setHasMore(response.hasMore);
        } catch (error) {
            handleError(error, { fallbackKey: 'productionPlan.fetchError' });
        } finally {
            setLoadingMore(false);
        }
    };

    const todoColor = monitorGroupColor('TODO', token);
    const STATUS_STYLE: Record<MonitorGroupKey, { color: string; bg: string; border: string }> = {
        TODO: {
            color: todoColor,
            // Modal này portal ra ngoài cây DOM của Tabs nên không dùng CSS var được —
            // mix trực tiếp với token hiện tại để vẫn tự thích ứng dark mode.
            bg: `color-mix(in srgb, ${todoColor} 12%, ${token.colorBgContainer})`,
            border: `color-mix(in srgb, ${todoColor} 45%, ${token.colorBorder})`,
        },
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
            <Spin spinning={loadingDetail || loadingLogs}>
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
                                <Flex align="center" gap={6} wrap="wrap">
                                    <Text code style={{ fontSize: 12 }}>
                                        {detail?.snapshotMoldCode ?? row.moldCode ?? '—'}
                                    </Text>
                                    {detail?.snapshotMoldName && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            ({detail.snapshotMoldName})
                                        </Text>
                                    )}
                                </Flex>
                            ),
                        },
                        {
                            key: 'moldType',
                            label: t('productionPlan.monitor.detail.moldType'),
                            children: (() => {
                                const moldType = detail?.snapshotMoldType ?? 'PRODUCTS_PER_SHOT';
                                const isShotsPerProduct = moldType === 'SHOTS_PER_PRODUCT';
                                const factor = detail?.snapshotMoldQuantity;
                                const factorText =
                                    factor != null
                                        ? isShotsPerProduct
                                            ? `${factor} ${t('productionPlan.monitor.detail.shotsPerProductSuffix')}`
                                            : `${factor} ${t('productionPlan.monitor.detail.productsPerShotSuffix')}`
                                        : null;

                                return (
                                    <Flex align="center" gap={6} wrap="wrap">
                                        <Tag
                                            color={isShotsPerProduct ? 'purple' : 'cyan'}
                                            style={{ margin: 0 }}
                                        >
                                            {isShotsPerProduct
                                                ? t('moldManagement.moldTypes.shotsPerProductShort')
                                                : t(
                                                      'moldManagement.moldTypes.productsPerShotShort'
                                                  )}
                                        </Tag>
                                        {factorText && (
                                            <Text strong style={{ fontSize: 12 }}>
                                                ({factorText})
                                            </Text>
                                        )}
                                    </Flex>
                                );
                            })(),
                        },
                        {
                            key: 'operationType',
                            label: t('productionPlan.monitor.detail.operationType'),
                            children: detail?.snapshotOperationTypeName ?? '—',
                        },
                        {
                            key: 'plannedDate',
                            label: t('productionPlan.monitor.detail.plannedDate'),
                            children: detail?.plannedDate ?? '—',
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
                            // Realtime từ WS — `detail.actualQuantity` chỉ là snapshot lúc mở modal.
                            children:
                                row.actualQuantity != null
                                    ? row.actualQuantity.toLocaleString('vi-VN')
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
                        <>
                            <Timeline
                                items={logs.map((log) => ({
                                    key: log.productionPlanStatusLogId,
                                    icon: (
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
                                    content: (
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
                                                                background: statusLogColor(
                                                                    log.fromStatus
                                                                ),
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
                                                style={{
                                                    fontSize: 12,
                                                    display: 'block',
                                                    marginTop: 2,
                                                }}
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
                            {hasMore && (
                                <Flex justify="center" style={{ marginTop: 8, marginBottom: 8 }}>
                                    <Button
                                        type="text"
                                        size="small"
                                        loading={loadingMore}
                                        onClick={loadMoreLogs}
                                        style={{ color: token.colorPrimary }}
                                    >
                                        {t('common.loadMore')}
                                    </Button>
                                </Flex>
                            )}
                        </>
                    )}
                </div>
            </Spin>
        </Modal>
    );
}
