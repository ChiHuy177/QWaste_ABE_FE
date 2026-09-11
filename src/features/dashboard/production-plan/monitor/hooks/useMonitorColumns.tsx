'use client';

import { useMemo, type CSSProperties } from 'react';
import { Button, Table, Tag, theme, Typography, Flex } from 'antd';
import type { CollapseProps, GlobalToken } from 'antd';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MONITOR_GROUP_ORDER, monitorGroupColor, type MonitorGroupKey } from '../../utils/planMappers';
import styles from '../../components/ProductionPlanTable.module.css';
import type { MonitorRowVM } from '../../components/types';
import { isIncidentConfirmed, isReadyToComplete } from '../utils/incidentStatus';
import type { MonitorFlatRow, MonitorStatConfig } from './useMonitorGroups';

const { Text } = Typography;

const formatNumber = (v: number) => v.toLocaleString('vi-VN');

/** Khung nền tint theo màu riêng của từng nhóm — cùng motif hộp viền như "Tạm dừng" trước đây. */
function monitorGroupHeaderStyle(status: MonitorGroupKey, token: GlobalToken): CSSProperties {
    const todoColor = monitorGroupColor('TODO', token);
    const border =
        status === 'TODO'
            ? // Không có token semantic riêng cho Chàm — mix với viền hiện tại của theme
              // (thay vì hex tĩnh) để tự thích ứng dark mode giống 3 trạng thái còn lại.
              `color-mix(in srgb, ${todoColor} 45%, ${token.colorBorder})`
            : status === 'IN_PROGRESS'
              ? token.colorInfo
              : status === 'PAUSE'
                ? token.colorWarning
                : token.colorSuccess;
    const background =
        status === 'TODO'
            ? `color-mix(in srgb, ${todoColor} 12%, ${token.colorBgContainer})`
            : status === 'IN_PROGRESS'
              ? token.colorInfoBg
              : status === 'PAUSE'
                ? token.colorWarningBg
                : token.colorSuccessBg;

    return { background, border: `1px solid ${border}`, borderRadius: 8 };
}

const anchorCell = (record: MonitorFlatRow) =>
    record.type === 'group-header' ? { className: styles.dailyGroupAnchorCell } : {};

interface UseMonitorColumnsParams {
    statConfigs: MonitorStatConfig[];
    grouped: Record<MonitorGroupKey, MonitorRowVM[]>;
    groupedFlatRows: Record<MonitorGroupKey, MonitorFlatRow[]>;
    loading: boolean;
    onOpenIncident: (row: MonitorRowVM) => void;
    onSelectRow: (row: MonitorRowVM) => void;
}

/** Cột bảng + Collapse items cho monitor — mỗi status 1 panel, PAUSE có thêm cột hành động. */
export const useMonitorColumns = ({
    statConfigs,
    grouped,
    groupedFlatRows,
    loading,
    onOpenIncident,
    onSelectRow,
}: UseMonitorColumnsParams) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

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
                width: 150,
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{t('productionPlan.table.total')}</Text>;
                    if (record.type === 'group-header') return null;
                    return (
                        <Flex vertical align="flex-start" gap={2}>
                            <Text strong>{record.code}</Text>
                            {record.status === 'PARTIAL' && (
                                <Tag
                                    style={{
                                        margin: 0,
                                        border: 'none',
                                        color: '#fff',
                                        fontWeight: 600,
                                        whiteSpace: 'normal',
                                        background: monitorGroupColor('COMPLETE', token),
                                    }}
                                >
                                    {t('productionPlan.monitor.partialTag')}
                                </Tag>
                            )}
                        </Flex>
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
                title: t('productionPlan.units.pieces'),
                key: 'pieces',
                width: 100,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{formatNumber(record.totalPieces)}</Text>;
                    if (record.type === 'group-header') return null;
                    return record.plannedQuantity;
                },
            },
            {
                title: t('productionPlan.table.headers.actualPieces'),
                key: 'actual',
                width: 140,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total')
                        return <Text strong>{formatNumber(record.totalActualPieces)}</Text>;
                    if (record.type === 'group-header') return null;
                    return record.actualQuantity != null ? formatNumber(record.actualQuantity) : '—';
                },
            },
            {
                title: t('productionPlan.monitor.lastUpdated'),
                key: 'updatedAt',
                width: 140,
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type !== 'product') return null;
                    return record.updatedAt ? record.updatedAt.toLocaleTimeString('vi-VN') : '—';
                },
            },
        ];
    }, [t, token]);

    const pauseActionColumn: ColumnType<MonitorFlatRow> = useMemo(
        () => ({
            key: 'action',
            width: 190,
            onCell: anchorCell,
            render: (_: unknown, record: MonitorFlatRow) => {
                if (record.type !== 'product') return null;
                if (isIncidentConfirmed(record)) {
                    return (
                        <Tag
                            icon={<CheckCircleOutlined />}
                            color="success"
                            style={{ margin: 0, fontWeight: 600 }}
                        >
                            {t('productionPlan.monitor.confirmedTag')}
                        </Tag>
                    );
                }
                if (isReadyToComplete(record)) {
                    return (
                        <Button
                            size="small"
                            block
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            style={{
                                background: token.colorSuccess,
                                borderColor: token.colorSuccess,
                                whiteSpace: 'normal',
                                height: 'auto',
                                lineHeight: 1.3,
                                padding: '4px 8px',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenIncident(record);
                            }}
                        >
                            {t('productionPlan.monitor.incident.completeButton')}
                        </Button>
                    );
                }
                return (
                    <Button
                        size="small"
                        block
                        icon={<ExclamationCircleOutlined />}
                        style={{
                            color: token.colorWarning,
                            borderColor: token.colorWarningBorder,
                            background: token.colorWarningBg,
                            fontWeight: 600,
                            whiteSpace: 'normal',
                            height: 'auto',
                            lineHeight: 1.3,
                            padding: '4px 8px',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenIncident(record);
                        }}
                    >
                        {t('productionPlan.monitor.incident.actionBtn')}
                    </Button>
                );
            },
        }),
        [onOpenIncident, token, t]
    );

    const pauseColumns: ColumnsType<MonitorFlatRow> = useMemo(
        () => [...columns, pauseActionColumn],
        [columns, pauseActionColumn]
    );

    // Actual piece chỉ có ý nghĩa theo dõi tiến độ cho TODO/IN_PROGRESS/PAUSE — plan COMPLETE
    // đã đóng nên bỏ cột này khỏi bảng nhóm đó (xem lại qua ProductDetailModal thay vì bảng).
    const completeColumns: ColumnsType<MonitorFlatRow> = useMemo(
        () => columns.filter((column) => column.key !== 'actual'),
        [columns]
    );

    const collapseItems = useMemo<CollapseProps['items']>(
        () =>
            MONITOR_GROUP_ORDER.map((status) => {
                const config = statConfigs.find((c) => c.status === status)!;
                const rows = grouped[status];
                const unconfirmedCount =
                    status === 'PAUSE' ? rows.filter((row) => !isIncidentConfirmed(row)).length : 0;
                const isPause = status === 'PAUSE' && rows.length > 0;

                return {
                    key: status,
                    styles: { header: monitorGroupHeaderStyle(status, token) },
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
                        unconfirmedCount > 0 ? (
                            <Tag color="warning" style={{ margin: 0, fontWeight: 600 }}>
                                {t('productionPlan.monitor.needsAction')}
                            </Tag>
                        ) : (
                            <Tag color="success" style={{ margin: 0, fontWeight: 600 }}>
                                {t('productionPlan.monitor.allConfirmed')}
                            </Tag>
                        )
                    ) : undefined,
                    children: (
                        // CSS vars inherit from the Collapse root wrapper below
                        <div className={`${styles.planAntTable} ${styles.dailySheetTable}`}>
                            <Table<MonitorFlatRow>
                                columns={
                                    status === 'PAUSE'
                                        ? pauseColumns
                                        : status === 'COMPLETE'
                                          ? completeColumns
                                          : columns
                                }
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
                                        record.type === 'product' ? () => onSelectRow(record) : undefined,
                                    style: record.type === 'product' ? { cursor: 'pointer' } : {},
                                })}
                                pagination={false}
                                scroll={{ x: status === 'PAUSE' ? 1150 : 970 }}
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
        [
            statConfigs,
            grouped,
            groupedFlatRows,
            columns,
            loading,
            pauseColumns,
            completeColumns,
            onSelectRow,
            t,
            token,
        ]
    );

    return { collapseItems };
};
