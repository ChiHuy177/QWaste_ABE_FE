'use client';

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Collapse,
    Flex,
    Input,
    Row,
    Table,
    Tag,
    Tooltip,
    Typography,
    theme,
} from 'antd';
import type { CollapseProps } from 'antd';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import {
    CaretRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    PauseCircleOutlined,
    ReloadOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useProductionMonitor } from '@/hooks/useProductionMonitor';
import { MachineService } from '@/services/MachineService';
import { MoldService } from '@/services/MoldService';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { Machine } from '@/types/Machine';
import { isMoldSchedulable, type Mold } from '@/types/Mold';
import {
    MONITOR_GROUP_BY_STATUS,
    MONITOR_GROUP_ORDER,
    type MonitorGroupKey,
    buildMachineInfoMap,
    mapDailyGroups,
} from '../_utils/planMappers';
import type { MonitorRowVM, SelectOptionVM } from '../_components/types';
import ProductDetailModal from '../_components/ProductDetailModal';
import IncidentConfirmModal from '../_components/IncidentConfirmModal';
import styles from '../_components/ProductionPlanTable.module.css';

const { Text } = Typography;
const { Search } = Input;

const formatNumber = (v: number) => v.toLocaleString('vi-VN');

const DATE_FORMAT = 'YYYY-MM-DD';
const MACHINE_PAGE_SIZE = 100;

// -------- Flat-row types (machine-grouped, mirrors DailyTable pattern) --------
type MonitorGroupHeader = {
    type: 'group-header';
    groupKey: string;
    machineCode: string;
    spaceName: string;
    groupSize: number;
};
type MonitorProductRow = MonitorRowVM & { type: 'product'; groupKey: string };
type MonitorTotalRow = {
    type: 'total';
    groupKey: string;
    totalCases: number;
};
type MonitorFlatRow = MonitorGroupHeader | MonitorProductRow | MonitorTotalRow;

function toFlatRows(products: MonitorProductRowInput[]): MonitorFlatRow[] {
    const groupMap = new Map<string, MonitorProductRowInput[]>();
    products.forEach((p) => {
        const arr = groupMap.get(p.machineId) ?? [];
        arr.push(p);
        groupMap.set(p.machineId, arr);
    });

    const rows: MonitorFlatRow[] = [];
    groupMap.forEach((group, machineId) => {
        const { machineCode, spaceName } = group[0];
        const totalCases = group.reduce((sum, p) => sum + p.plannedQuantity, 0);
        rows.push({
            type: 'group-header',
            groupKey: machineId,
            machineCode,
            spaceName,
            groupSize: group.length,
        });
        group.forEach((p) => rows.push({ ...p, type: 'product', groupKey: machineId }));
        rows.push({ type: 'total', groupKey: machineId, totalCases });
    });

    return rows;
}

type MonitorProductRowInput = MonitorRowVM;

const anchorCell = (record: MonitorFlatRow) =>
    record.type === 'group-header' ? { className: styles.dailyGroupAnchorCell } : {};

export default function ProductionMonitorPage() {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { handleError } = useApiErrorHandler();
    const { checkPermission } = usePermissionCheck();

    usePageTitle(t('productionPlan.monitor.title'));

    // Monitor luôn nhìn hôm nay.
    const todayIso = useMemo(() => dayjs().format(DATE_FORMAT), []);

    const [searchText, setSearchText] = useState('');
    const [baseRows, setBaseRows] = useState<MonitorRowVM[]>([]);
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [molds, setMolds] = useState<Mold[]>([]);
    const [selectedRow, setSelectedRow] = useState<MonitorRowVM | null>(null);
    const [incidentRow, setIncidentRow] = useState<MonitorRowVM | null>(null);
    const [activeKeys, setActiveKeys] = useState<MonitorGroupKey[]>(
        MONITOR_GROUP_ORDER.filter((status) => status !== 'COMPLETE')
    );

    const machineInfoPromiseRef = useRef<Promise<{
        machines: Machine[];
        map: ReturnType<typeof buildMachineInfoMap>;
    }> | null>(null);

    const loadMachineInfo = useCallback(() => {
        machineInfoPromiseRef.current ??= MachineService.getAllMachines().then((machineList) => {
            setMachines(machineList);
            return { machines: machineList, map: buildMachineInfoMap(machineList) };
        });
        return machineInfoPromiseRef.current;
    }, []);

    const fetchMonitorData = useCallback(async () => {
        try {
            setLoading(true);
            const { map } = await loadMachineInfo();
            const page = await ProductionPlanService.getDailyProductionPlans({
                date: todayIso,
                size: MACHINE_PAGE_SIZE,
            });

            const groups = mapDailyGroups(page.content, map, 0);
            const rows: MonitorRowVM[] = groups.flatMap((group) =>
                group.products
                    .filter((product) => !product.isDeleted)
                    .map((product) => ({
                        productionPlanId: product.productionPlanId,
                        code: product.code,
                        name: product.name,
                        machineId: group.machineId,
                        machineCode: group.machineCode,
                        spaceName: group.spaceName,
                        moldCode: product.moldCode,
                        plannedQuantity: product.schedule[0],
                        status: product.status,
                        updatedAt: null,
                    }))
            );
            setBaseRows(rows);
        } catch (error) {
            handleError(error, { fallbackKey: 'productionPlan.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [handleError, loadMachineInfo, todayIso]);

    useEffect(() => {
        fetchMonitorData();
    }, [fetchMonitorData]);

    useEffect(() => {
        let cancelled = false;

        const fetchMolds = async () => {
            try {
                const moldList = await MoldService.getAllMolds();
                if (!cancelled) {
                    setMolds(moldList);
                }
            } catch (error) {
                handleError(error, { fallbackKey: 'productionPlan.moldFetchError' });
            }
        };

        fetchMolds();
        return () => {
            cancelled = true;
        };
    }, [handleError]);

    const machineIds = useMemo(
        () => Array.from(new Set(baseRows.map((row) => row.machineId))),
        [baseRows]
    );
    const knownPlanIds = useMemo(
        () => new Set(baseRows.map((row) => row.productionPlanId)),
        [baseRows]
    );

    const { statusMap, isConnected, lastUpdate } = useProductionMonitor({
        machineIds,
        dateIso: todayIso,
        knownPlanIds,
        onUnknownPlan: fetchMonitorData,
    });

    // Merge status realtime đè lên dữ liệu fetch.
    const products = useMemo<MonitorRowVM[]>(
        () =>
            baseRows.map((row) => {
                const entry = statusMap.get(row.productionPlanId);
                if (!entry) return row;
                return { ...row, status: entry.status, updatedAt: entry.updatedAt };
            }),
        [baseRows, statusMap]
    );

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
                '--plan-color-warning': token.colorWarning,
                '--plan-color-warning-bg': token.colorWarningBg,
            }) as CSSProperties,
        [token]
    );

    const statConfigs = useMemo(
        () => [
            {
                status: 'TODO' as MonitorGroupKey,
                icon: ClockCircleOutlined,
                color: '#722ed1',
                bg: '#f9f0ff',
                border: '#d3adf7',
            },
            {
                status: 'IN_PROGRESS' as MonitorGroupKey,
                icon: SyncOutlined,
                color: token.colorInfo,
                bg: token.colorInfoBg,
                border: token.colorInfo,
            },
            {
                status: 'PAUSE' as MonitorGroupKey,
                icon: PauseCircleOutlined,
                color: token.colorWarning,
                bg: token.colorWarningBg,
                border: token.colorWarning,
            },
            {
                status: 'COMPLETE' as MonitorGroupKey,
                icon: CheckCircleOutlined,
                color: token.colorSuccess,
                bg: token.colorSuccessBg,
                border: token.colorSuccess,
            },
        ],
        [token]
    );

    const statusCounts = useMemo(() => {
        const counts: Record<MonitorGroupKey, number> = {
            TODO: 0,
            IN_PROGRESS: 0,
            PAUSE: 0,
            COMPLETE: 0,
        };
        products.forEach((p) => counts[MONITOR_GROUP_BY_STATUS[p.status]]++);
        return counts;
    }, [products]);

    const filteredByKeyword = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return products;
        return products.filter(
            (p) =>
                p.code.toLowerCase().includes(keyword) ||
                p.name.toLowerCase().includes(keyword) ||
                p.machineCode.toLowerCase().includes(keyword) ||
                p.spaceName.toLowerCase().includes(keyword)
        );
    }, [products, searchText]);

    const grouped = useMemo(() => {
        const map: Record<MonitorGroupKey, MonitorRowVM[]> = {
            IN_PROGRESS: [],
            PAUSE: [],
            TODO: [],
            COMPLETE: [],
        };
        filteredByKeyword.forEach((p) => map[MONITOR_GROUP_BY_STATUS[p.status]].push(p));
        return map;
    }, [filteredByKeyword]);

    const groupedFlatRows = useMemo(() => {
        const result = {} as Record<MonitorGroupKey, MonitorFlatRow[]>;
        MONITOR_GROUP_ORDER.forEach((status) => {
            result[status] = toFlatRows(grouped[status]);
        });
        return result;
    }, [grouped]);

    // While searching, force-open every group that has matches so results are never hidden
    const displayedActiveKeys = useMemo(() => {
        if (!searchText.trim()) return activeKeys;
        const withMatches = MONITOR_GROUP_ORDER.filter((status) => grouped[status].length > 0);
        return Array.from(new Set([...activeKeys, ...withMatches]));
    }, [activeKeys, grouped, searchText]);

    const machineOptions = useMemo<SelectOptionVM[]>(
        () =>
            machines.map((machine) => {
                const code = machine.machineCode || machine.machineName;
                const space = machine.space?.spaceName;
                return {
                    value: String(machine.machineId),
                    label: space ? `${code} — ${space}` : code,
                };
            }),
        [machines]
    );

    // GET /v1 trả cả mold đã xóa/RETIRED — picker chỉ đưa mold còn dùng được.
    const moldOptions = useMemo<SelectOptionVM[]>(
        () =>
            molds.filter(isMoldSchedulable).map((mold) => ({
                value: mold.moldId,
                label: `${mold.moldCode} — ${mold.moldName}`,
            })),
        [molds]
    );

    // Tra trên toàn bộ list (kể cả mold hết ACTIVE) vì plan cũ vẫn giữ khuôn cũ.
    const incidentCurrentMoldId = useMemo(() => {
        if (!incidentRow?.moldCode) return undefined;
        return molds.find((m) => m.moldCode === incidentRow.moldCode)?.moldId;
    }, [incidentRow, molds]);

    const openIncidentModal = useCallback(
        (row: MonitorRowVM) => {
            if (!checkPermission('incident', 'production_plan')) return;
            setIncidentRow(row);
        },
        [checkPermission]
    );

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
                            <strong>{record.machineCode}</strong>
                            <span>{record.spaceName}</span>
                        </div>
                    );
                },
            },
            {
                title: t('productionPlan.table.headers.codeVi'),
                key: 'code',
                width: 140,
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{t('productionPlan.table.total')}</Text>;
                    if (record.type === 'group-header') return null;
                    return (
                        <>
                            <Text strong>{record.code}</Text>
                            {record.status === 'PARTIAL' && (
                                <Tag color="warning" style={{ marginLeft: 6 }}>
                                    {t('productionPlan.monitor.partialTag')}
                                </Tag>
                            )}
                        </>
                    );
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
                render: (_, record) => (record.type === 'product' ? record.moldCode : null),
            },
            {
                title: t('productionPlan.units.cases'),
                key: 'cases',
                width: 100,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{formatNumber(record.totalCases)}</Text>;
                    if (record.type === 'group-header') return null;
                    return record.plannedQuantity;
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
    }, [t]);

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
                            openIncidentModal(record);
                        }}
                    >
                        {t('productionPlan.monitor.incident.actionBtn')}
                    </Button>
                );
            },
        }),
        [openIncidentModal, token, t]
    );

    const pauseColumns: ColumnsType<MonitorFlatRow> = useMemo(
        () => [...columns, pauseActionColumn],
        [columns, pauseActionColumn]
    );

    const handleStatCardClick = (status: MonitorGroupKey) => {
        setActiveKeys((prev) => (prev.includes(status) ? prev : [...prev, status]));
        requestAnimationFrame(() => {
            document
                .getElementById(`monitor-group-${status}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const collapseItems = useMemo<CollapseProps['items']>(
        () =>
            MONITOR_GROUP_ORDER.map((status) => {
                const config = statConfigs.find((c) => c.status === status)!;
                const rows = grouped[status];
                const isPause = status === 'PAUSE' && rows.length > 0;

                return {
                    key: status,
                    classNames: isPause ? { header: styles.monitorPauseHeader } : undefined,
                    label: (
                        <Flex align="center" gap={10} id={`monitor-group-${status}`}>
                            <span
                                className={styles.monitorStatusPill}
                                style={{ background: config.color }}
                            >
                                {t(`productionPlan.monitor.status.${status}`)}
                            </span>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>
                                {rows.length}
                            </Text>
                        </Flex>
                    ),
                    extra: isPause ? (
                        <Tag color="warning" style={{ margin: 0, fontWeight: 600 }}>
                            {t('productionPlan.monitor.needsAction')}
                        </Tag>
                    ) : undefined,
                    children: (
                        // CSS vars inherit from the Collapse root wrapper below
                        <div className={`${styles.planAntTable} ${styles.dailySheetTable}`}>
                            <Table<MonitorFlatRow>
                                columns={status === 'PAUSE' ? pauseColumns : columns}
                                dataSource={groupedFlatRows[status]}
                                loading={loading}
                                rowKey={(record) => {
                                    if (record.type === 'product') return record.productionPlanId;
                                    if (record.type === 'total') return `${record.groupKey}-total`;
                                    return `${record.groupKey}-header`;
                                }}
                                rowClassName={(record) =>
                                    record.type === 'total' ? styles.dailySheetTotalRow : ''
                                }
                                size="small"
                                onRow={(record) => ({
                                    onClick:
                                        record.type === 'product'
                                            ? () => setSelectedRow(record)
                                            : undefined,
                                    style: record.type === 'product' ? { cursor: 'pointer' } : {},
                                })}
                                pagination={false}
                                scroll={{ x: status === 'PAUSE' ? 1100 : 950 }}
                                locale={{
                                    emptyText: (
                                        <Text type="secondary">
                                            {t('productionPlan.monitor.emptyGroup')}
                                        </Text>
                                    ),
                                }}
                            />
                        </div>
                    ),
                };
            }),
        [statConfigs, grouped, groupedFlatRows, columns, loading, pauseColumns, t]
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
            <Tooltip title={t('productionPlan.monitor.refresh')}>
                <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={fetchMonitorData}
                />
            </Tooltip>
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
                            onClick={() => handleStatCardClick(status)}
                            style={{
                                height: '100%',
                                borderRadius: 12,
                                border: `1px solid ${border}`,
                                background: bg,
                                boxShadow: token.boxShadow,
                                cursor: 'pointer',
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
                <Flex gap={4} style={{ marginLeft: 'auto' }}>
                    <Button
                        type="text"
                        size="small"
                        onClick={() => setActiveKeys([...MONITOR_GROUP_ORDER])}
                    >
                        {t('productionPlan.monitor.expandAll')}
                    </Button>
                    <Button type="text" size="small" onClick={() => setActiveKeys([])}>
                        {t('productionPlan.monitor.collapseAll')}
                    </Button>
                </Flex>
            </Flex>

            {/* ClickUp-style collapsible status groups */}
            <Collapse
                ghost
                style={planThemeVars}
                items={collapseItems}
                activeKey={displayedActiveKeys}
                onChange={(keys) => setActiveKeys(keys as MonitorGroupKey[])}
                collapsible="header"
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                classNames={{
                    header: styles.monitorGroupHeader,
                    body: styles.monitorGroupBody,
                }}
            />

            <ProductDetailModal
                row={selectedRow}
                open={!!selectedRow}
                onClose={() => setSelectedRow(null)}
            />

            <IncidentConfirmModal
                open={!!incidentRow}
                row={incidentRow}
                machineOptions={machineOptions}
                moldOptions={moldOptions}
                currentMoldId={incidentCurrentMoldId}
                onClose={() => setIncidentRow(null)}
                onDone={fetchMonitorData}
            />
        </>
    );
}
