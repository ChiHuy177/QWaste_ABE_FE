'use client';

import { type CSSProperties, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Flex,
    Input,
    Row,
    Table,
    Tag,
    Tooltip,
    Typography,
    theme,
} from 'antd';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    PauseCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { MonitorProduct } from '@/types/ProductionPlan';
import { useProductionMonitor } from '@/hooks/useProductionMonitor';
import { initialProductionPlan } from '../_utils/mockData';
import { getAllMachineNames } from '../_utils/planUtils';
import { getTodayScheduleIndex } from '../_utils/dateUtils';
import { ProductionStatus } from '../_components/types';
import ProductDetailModal from '../_components/ProductDetailModal';
import IncidentConfirmModal from '../_components/IncidentConfirmModal';
import styles from '../_components/ProductionPlanTable.module.css';

const { Text } = Typography;
const { Search } = Input;

const formatNumber = (v: number) => v.toLocaleString('vi-VN');

const GROUP_ORDER: ProductionStatus[] = ['TODO', 'IN_PROGRESS', 'PAUSE', 'COMPLETE'];

const machineOptions = getAllMachineNames(initialProductionPlan);

// -------- Flat-row types (machine-grouped, mirrors DailyTable pattern) --------
type MonitorGroupHeader = {
    type: 'group-header';
    groupKey: string;
    machine: string;
    lineName: string;
    groupSize: number;
};
type MonitorProductRow = MonitorProduct & { type: 'product'; groupKey: string };
type MonitorTotalRow = {
    type: 'total';
    groupKey: string;
    totalCases: number;
    totalPcs: number;
};
type MonitorFlatRow = MonitorGroupHeader | MonitorProductRow | MonitorTotalRow;

function toFlatRows(products: MonitorProduct[], todayIndex: number): MonitorFlatRow[] {
    const groupMap = new Map<string, MonitorProduct[]>();
    products.forEach((p) => {
        const key = `${p.lineName}|${p.machine}`;
        const arr = groupMap.get(key) ?? [];
        arr.push(p);
        groupMap.set(key, arr);
    });

    const rows: MonitorFlatRow[] = [];
    groupMap.forEach((group, key) => {
        const { machine, lineName } = group[0];
        const totalCases = group.reduce((sum, p) => sum + p.schedule[todayIndex], 0);
        const totalPcs = group.reduce(
            (sum, p) => sum + p.schedule[todayIndex] * p.pcsMultiplier,
            0
        );
        rows.push({
            type: 'group-header',
            groupKey: key,
            machine,
            lineName,
            groupSize: group.length,
        });
        group.forEach((p) => rows.push({ ...p, type: 'product', groupKey: key }));
        rows.push({ type: 'total', groupKey: key, totalCases, totalPcs });
    });

    return rows;
}

const anchorCell = (record: MonitorFlatRow) =>
    record.type === 'group-header' ? { className: styles.dailyGroupAnchorCell } : {};

export default function ProductionMonitorPage() {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    usePageTitle(t('productionPlan.monitor.title'));

    const [searchText, setSearchText] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<MonitorProduct | null>(null);
    const [incidentProduct, setIncidentProduct] = useState<MonitorProduct | null>(null);

    const { products, isConnected, lastUpdate } = useProductionMonitor({
        lines: initialProductionPlan,
    });

    const todayIndex = useMemo(() => getTodayScheduleIndex(new Date()), []);

    const planThemeVars = useMemo(
        () =>
            ({
                '--plan-color-primary': token.colorPrimary,
                '--plan-color-bg-container': token.colorBgContainer,
                '--plan-color-bg-muted': token.colorBgLayout,
                '--plan-color-border': token.colorBorder,
                '--plan-color-text': token.colorText,
                '--plan-color-text-secondary': token.colorTextSecondary,
                '--plan-color-text-tertiary': token.colorTextTertiary,
            }) as CSSProperties,
        [token]
    );

    const statConfigs = useMemo(
        () => [
            {
                status: 'TODO' as ProductionStatus,
                icon: ClockCircleOutlined,
                color: '#722ed1',
                bg: '#f9f0ff',
                border: '#d3adf7',
            },
            {
                status: 'IN_PROGRESS' as ProductionStatus,
                icon: SyncOutlined,
                color: token.colorInfo,
                bg: token.colorInfoBg,
                border: token.colorInfo,
            },
            {
                status: 'PAUSE' as ProductionStatus,
                icon: PauseCircleOutlined,
                color: token.colorWarning,
                bg: token.colorWarningBg,
                border: token.colorWarning,
            },
            {
                status: 'COMPLETE' as ProductionStatus,
                icon: CheckCircleOutlined,
                color: token.colorSuccess,
                bg: token.colorSuccessBg,
                border: token.colorSuccess,
            },
        ],
        [token]
    );

    const statusCounts = useMemo(() => {
        const counts: Record<ProductionStatus, number> = {
            TODO: 0,
            IN_PROGRESS: 0,
            PAUSE: 0,
            COMPLETE: 0,
        };
        products.forEach((p) => counts[p.status]++);
        return counts;
    }, [products]);

    const filteredByKeyword = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return products;
        return products.filter(
            (p) =>
                p.code.toLowerCase().includes(keyword) ||
                p.name.toLowerCase().includes(keyword) ||
                p.machine.toLowerCase().includes(keyword) ||
                p.lineName.toLowerCase().includes(keyword)
        );
    }, [products, searchText]);

    const grouped = useMemo(() => {
        const map: Record<ProductionStatus, MonitorProduct[]> = {
            IN_PROGRESS: [],
            PAUSE: [],
            TODO: [],
            COMPLETE: [],
        };
        filteredByKeyword.forEach((p) => map[p.status].push(p));
        return map;
    }, [filteredByKeyword]);

    const groupedFlatRows = useMemo(() => {
        const result = {} as Record<ProductionStatus, MonitorFlatRow[]>;
        GROUP_ORDER.forEach((status) => {
            result[status] = toFlatRows(grouped[status], todayIndex);
        });
        return result;
    }, [grouped, todayIndex]);

    const columns: ColumnsType<MonitorFlatRow> = useMemo(() => {
        return [
            {
                key: 'machine',
                width: 160,
                fixed: 'left',
                className: styles.dailySheetMachineColumn,
                onCell: (record) => {
                    if (record.type === 'group-header') return { rowSpan: record.groupSize + 2 };
                    return { rowSpan: 0 };
                },
                render: (_, record) => {
                    if (record.type !== 'group-header') return null;
                    return (
                        <div className={styles.dailySheetMachineCell}>
                            <strong>{record.machine}</strong>
                            <span>{record.lineName}</span>
                        </div>
                    );
                },
            },
            {
                title: t('productionPlan.table.headers.codeVi'),
                key: 'code',
                width: 110,
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{t('productionPlan.table.total')}</Text>;
                    if (record.type === 'group-header') return null;
                    return <Text strong>{record.code}</Text>;
                },
            },
            {
                title: t('productionPlan.table.headers.productName'),
                key: 'name',
                ellipsis: true,
                onCell: anchorCell,
                render: (_, record) => (record.type === 'product' ? record.name : null),
            },
            {
                title: t('productionPlan.table.headers.mold'),
                key: 'mold',
                width: 120,
                onCell: anchorCell,
                render: (_, record) => (record.type === 'product' ? record.mold : null),
            },
            {
                title: t('productionPlan.table.headers.time'),
                key: 'time',
                width: 140,
                onCell: anchorCell,
                render: (_, record) => (record.type === 'product' ? record.time : null),
            },
            {
                title: t('productionPlan.units.cases'),
                key: 'cases',
                width: 90,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total') return formatNumber(record.totalCases);
                    if (record.type === 'group-header') return null;
                    return record.schedule[todayIndex];
                },
            },
            {
                title: t('productionPlan.units.pcs'),
                key: 'pcs',
                width: 90,
                align: 'right',
                className: styles.dailySheetPcsColumn,
                onCell: (record) => ({
                    ...anchorCell(record),
                    className:
                        record.type === 'group-header'
                            ? styles.dailyGroupAnchorCell
                            : styles.dailySheetPcsColumn,
                }),
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{formatNumber(record.totalPcs)}</Text>;
                    if (record.type === 'group-header') return null;
                    return (
                        <Text strong>
                            {formatNumber(record.schedule[todayIndex] * record.pcsMultiplier)}
                        </Text>
                    );
                },
            },
            {
                title: t('productionPlan.monitor.lastUpdated'),
                key: 'updatedAt',
                width: 150,
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type !== 'product') return null;
                    return (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.updatedAt ? record.updatedAt.toLocaleTimeString('vi-VN') : '—'}
                        </Text>
                    );
                },
            },
        ];
    }, [t, todayIndex]);

    const pauseActionColumn: ColumnType<MonitorFlatRow> = useMemo(
        () => ({
            key: 'action',
            width: 160,
            onCell: anchorCell,
            render: (_: unknown, record: MonitorFlatRow) => {
                if (record.type !== 'product') return null;
                return (
                    <Button
                        size="small"
                        icon={<ExclamationCircleOutlined />}
                        style={{
                            color: token.colorWarning,
                            borderColor: token.colorWarningBorder,
                            background: token.colorWarningBg,
                            fontWeight: 600,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIncidentProduct(record);
                        }}
                    >
                        {t('productionPlan.monitor.incident.actionBtn')}
                    </Button>
                );
            },
        }),
        [token, t]
    );

    const pauseColumns: ColumnsType<MonitorFlatRow> = useMemo(
        () => [...columns, pauseActionColumn],
        [columns, pauseActionColumn]
    );

    const headerExtra = (
        <Flex align="center" gap={8}>
            <Tooltip
                title={
                    isConnected
                        ? t('productionPlan.monitor.connected')
                        : t('productionPlan.monitor.disconnected')
                }
            >
                <Badge
                    status={isConnected ? 'processing' : 'error'}
                    text={
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {isConnected
                                ? t('productionPlan.monitor.connected')
                                : t('productionPlan.monitor.disconnected')}
                        </Text>
                    }
                />
            </Tooltip>
            {lastUpdate && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('productionPlan.monitor.lastSync', {
                        time: lastUpdate.toLocaleTimeString('vi-VN'),
                    })}
                </Text>
            )}
        </Flex>
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('productionPlan.monitor.title')}
                rightContent={headerExtra}
            />

            {/* Stat cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {statConfigs.map(({ status, icon: Icon, color, bg, border }) => (
                    <Col xs={24} sm={12} lg={6} key={status}>
                        <Card
                            variant="borderless"
                            hoverable
                            style={{
                                height: '100%',
                                borderRadius: 12,
                                border: `1px solid ${border}`,
                                background: bg,
                                boxShadow: token.boxShadow,
                            }}
                        >
                            <Flex align="center" gap={16} wrap="nowrap">
                                <span
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 8,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: token.colorBgContainer,
                                        color,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon style={{ fontSize: 22 }} />
                                </span>
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            color: token.colorPrimary,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {t(`productionPlan.monitor.status.${status}`)}
                                    </div>
                                    <div
                                        style={{
                                            color: token.colorPrimary,
                                            fontSize: 30,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {formatNumber(statusCounts[status])}
                                    </div>
                                </div>
                            </Flex>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Search */}
            <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                <Search
                    placeholder={t('productionPlan.monitor.searchPlaceholder')}
                    allowClear
                    onSearch={setSearchText}
                    onChange={(e) => !e.target.value && setSearchText('')}
                    style={{ width: 320 }}
                />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {t('productionPlan.monitor.showing', {
                        count: filteredByKeyword.length,
                        total: products.length,
                    })}
                </Text>
            </Flex>

            {/* Grouped card sections */}
            <Flex vertical gap={16}>
                {GROUP_ORDER.map((status) => {
                    const config = statConfigs.find((c) => c.status === status)!;
                    const Icon = config.icon;
                    const { color, bg, border } = config;
                    const rows = grouped[status];
                    const flatRows = groupedFlatRows[status];
                    const isPause = status === 'PAUSE' && rows.length > 0;
                    const cols = status === 'PAUSE' ? pauseColumns : columns;

                    return (
                        <Card
                            key={status}
                            style={{
                                borderRadius: 12,
                                overflow: 'hidden',
                                boxShadow: isPause
                                    ? `0 4px 16px ${token.colorWarning}20`
                                    : token.boxShadow,
                                border: `1px solid ${isPause ? token.colorWarning : token.colorBorderSecondary}`,
                            }}
                            styles={{ body: { padding: 0 } }}
                        >
                            <Flex
                                align="center"
                                gap={10}
                                style={{
                                    padding: '12px 16px',
                                    background: isPause ? token.colorWarningBg : bg,
                                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                }}
                            >
                                <span
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: token.colorBgContainer,
                                        border: `1px solid ${border}`,
                                        color,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon style={{ fontSize: 14 }} />
                                </span>
                                <Text strong style={{ color, fontSize: 14 }}>
                                    {t(`productionPlan.monitor.status.${status}`)}
                                </Text>
                                <Badge
                                    count={rows.length}
                                    showZero
                                    color={isPause ? token.colorWarning : color}
                                    style={{ boxShadow: 'none' }}
                                />
                                {isPause && (
                                    <Tag
                                        color="warning"
                                        style={{ marginLeft: 'auto', fontWeight: 600 }}
                                    >
                                        {t('productionPlan.monitor.needsAction')}
                                    </Tag>
                                )}
                            </Flex>

                            {/* Wrapper carries CSS vars so DailySheet classes resolve correctly */}
                            <div
                                className={`${styles.planAntTable} ${styles.dailySheetTable}`}
                                style={{
                                    ...(planThemeVars as CSSProperties),
                                    border: 'none',
                                    borderRadius: 0,
                                }}
                            >
                                <Table<MonitorFlatRow>
                                    columns={cols}
                                    dataSource={flatRows}
                                    rowKey={(record) => {
                                        if (record.type === 'product') return record.code;
                                        if (record.type === 'total')
                                            return `${record.groupKey}-total`;
                                        return `${record.groupKey}-header`;
                                    }}
                                    rowClassName={(record) =>
                                        record.type === 'total' ? styles.dailySheetTotalRow : ''
                                    }
                                    size="small"
                                    bordered
                                    onRow={(record) => ({
                                        onClick:
                                            record.type === 'product'
                                                ? () => setSelectedProduct(record)
                                                : undefined,
                                        style:
                                            record.type === 'product' ? { cursor: 'pointer' } : {},
                                    })}
                                    pagination={false}
                                    scroll={{ x: status === 'PAUSE' ? 1200 : 1000 }}
                                    locale={{
                                        emptyText: (
                                            <Text type="secondary">
                                                {t('productionPlan.monitor.emptyGroup')}
                                            </Text>
                                        ),
                                    }}
                                />
                            </div>
                        </Card>
                    );
                })}
            </Flex>

            <ProductDetailModal
                product={selectedProduct}
                open={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />

            <IncidentConfirmModal
                product={incidentProduct}
                open={!!incidentProduct}
                machineOptions={machineOptions}
                lines={initialProductionPlan}
                onClose={() => setIncidentProduct(null)}
            />
        </>
    );
}
