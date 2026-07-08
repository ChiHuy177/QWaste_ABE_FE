'use client';

import { useCallback, useMemo } from 'react';
import { Button, Empty, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
    closestCenter,
    CollisionDetection,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DragHandle, SmartTableRow } from './DraggableTableRow';
import { ProductionLine, ProductionProduct, ProductPosition } from './types';
import styles from './ProductionPlanTable.module.css';
import { WEEK_DAY_KEYS } from '../_utils/dateUtils';

type WeeklyProductRow = ProductionProduct & {
    lineIndex: number;
    lineName: string;
    productIndex: number;
};

type GroupHeaderRow = {
    type: 'group-header';
    groupKey: string;
    machine: string;
    lineName: string;
    lineIndex: number;
    groupSize: number;
};

type ProductFlatRow = WeeklyProductRow & {
    type: 'product';
    groupKey: string;
};

type TotalFlatRow = {
    type: 'total';
    groupKey: string;
    machine: string;
    lineName: string;
    lineIndex: number;
    totalPerDay: number[];
    grandTotal: number;
};

type FlatRow = GroupHeaderRow | ProductFlatRow | TotalFlatRow;

interface MachineGroup {
    key: string;
    lineIndex: number;
    lineName: string;
    machine: string;
    products: WeeklyProductRow[];
}

interface WeeklyTableProps {
    lines: ProductionLine[];
    todayIndex: number;
    machineFilter: string;
    onEdit: (position: ProductPosition) => void;
    onDelete: (position: ProductPosition) => void;
    onReorder: (lineIndex: number, activeCode: string, overCode: string) => void;
}

export default function WeeklyTable({
    lines,
    todayIndex,
    machineFilter,
    onEdit,
    onDelete,
    onReorder,
}: WeeklyTableProps) {
    const { t } = useTranslation();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();
    const weekDayLabels = useMemo(
        () => WEEK_DAY_KEYS.map((dayKey) => t(`productionPlan.days.short.${dayKey}`)),
        [t]
    );

    const machineGroups = useMemo<MachineGroup[]>(() => {
        const groups: MachineGroup[] = [];

        lines.forEach((line, lineIndex) => {
            const groupedProducts = new Map<string, WeeklyProductRow[]>();

            line.products.forEach((product, productIndex) => {
                if (!product.schedule.some((q) => q > 0)) return;
                if (
                    normalizedMachineFilter &&
                    !product.machine.toLowerCase().includes(normalizedMachineFilter)
                ) {
                    return;
                }

                const current = groupedProducts.get(product.machine) ?? [];
                current.push({ ...product, lineIndex, lineName: line.spaceName, productIndex });
                groupedProducts.set(product.machine, current);
            });

            groupedProducts.forEach((products, machine) => {
                groups.push({
                    key: `${line.spaceCode}-${machine}`,
                    lineIndex,
                    lineName: line.spaceName,
                    machine,
                    products,
                });
            });
        });

        return groups;
    }, [lines, normalizedMachineFilter]);

    const { flatRows, sortableKeys, productGroupMap } = useMemo(() => {
        const rows: FlatRow[] = [];
        const keys: string[] = [];
        const groupMap = new Map<string, { groupKey: string; lineIndex: number }>();

        machineGroups.forEach((group) => {
            const totalPerDay = weekDayLabels.map((_, i) =>
                group.products.reduce((sum, p) => sum + p.schedule[i], 0)
            );
            const grandTotal = totalPerDay.reduce((sum, d) => sum + d, 0);

            rows.push({
                type: 'group-header',
                groupKey: group.key,
                machine: group.machine,
                lineName: group.lineName,
                lineIndex: group.lineIndex,
                groupSize: group.products.length,
            });

            group.products.forEach((product) => {
                rows.push({ ...product, type: 'product', groupKey: group.key });
                keys.push(product.code);
                groupMap.set(product.code, { groupKey: group.key, lineIndex: group.lineIndex });
            });

            rows.push({
                type: 'total',
                groupKey: group.key,
                machine: group.machine,
                lineName: group.lineName,
                lineIndex: group.lineIndex,
                totalPerDay,
                grandTotal,
            });
        });

        return { flatRows: rows, sortableKeys: keys, productGroupMap: groupMap };
    }, [machineGroups, weekDayLabels]);

    const sameGroupCollisionDetection = useCallback<CollisionDetection>(
        (args) => {
            const activeGroupKey = productGroupMap.get(String(args.active.id))?.groupKey;
            if (!activeGroupKey) return [];

            const sameGroupContainers = args.droppableContainers.filter(
                (c) => productGroupMap.get(String(c.id))?.groupKey === activeGroupKey
            );

            return closestCenter({ ...args, droppableContainers: sameGroupContainers });
        },
        [productGroupMap]
    );

    const anchorCell = (record: FlatRow) =>
        record.type === 'group-header' ? { className: styles.dailyGroupAnchorCell } : {};

    const columns = useMemo<ColumnsType<FlatRow>>(
        () => [
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.machine')}</span>
                        <span>(Machine)</span>
                    </div>
                ),
                key: 'machine',
                width: 170,
                fixed: 'left',
                className: styles.dailySheetMachineColumn,
                onCell: (record) => {
                    if (record.type === 'group-header') {
                        return {
                            rowSpan: record.groupSize + 2,
                            className: styles.dailySheetMachineColumn,
                        };
                    }
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
                key: 'sort',
                width: 48,
                align: 'center',
                onCell: anchorCell,
                render: (_, record) =>
                    record.type === 'product' ? <DragHandle /> : null,
            },
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.codeVi')}</span>
                        <span>Code</span>
                    </div>
                ),
                key: 'code',
                width: 120,
                fixed: 'left',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total') return <strong>{t('productionPlan.table.total')}</strong>;
                    if (record.type === 'group-header') return null;
                    return <strong>{record.code}</strong>;
                },
            },
            {
                title: t('productionPlan.table.headers.productName'),
                key: 'name',
                width: 200,
                onCell: anchorCell,
                render: (_, record) =>
                    record.type === 'product' ? record.name : null,
            },
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.codeVi')}</span>
                        <span>{t('productionPlan.table.headers.mold')}</span>
                    </div>
                ),
                key: 'mold',
                width: 90,
                onCell: anchorCell,
                render: (_, record) =>
                    record.type === 'product' ? record.mold : null,
            },
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.avgShort')}</span>
                        <span>({t('productionPlan.units.pcsPerCase')})</span>
                    </div>
                ),
                key: 'pcsMultiplier',
                width: 80,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) =>
                    record.type === 'product' ? record.pcsMultiplier : null,
            },
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.time')}</span>
                        <span>Time</span>
                    </div>
                ),
                key: 'time',
                width: 100,
                onCell: anchorCell,
                render: (_, record) =>
                    record.type === 'product' ? record.time : null,
            },
            ...weekDayLabels.map((day, index) => ({
                title: day,
                key: day,
                width: 86,
                align: 'right' as const,
                className: index === todayIndex ? styles.todayColumn : undefined,
                onCell: (record: FlatRow) => {
                    if (record.type === 'group-header') {
                        return { className: styles.dailyGroupAnchorCell };
                    }
                    return {
                        className: [
                            index === todayIndex ? styles.todayColumn : '',
                            record.type === 'product' && record.schedule[index] === 0
                                ? styles.mutedQuantity
                                : '',
                        ]
                            .filter(Boolean)
                            .join(' '),
                    };
                },
                render: (_: unknown, record: FlatRow) => {
                    if (record.type === 'total') return record.totalPerDay[index];
                    if (record.type === 'group-header') return null;
                    return record.schedule[index];
                },
            })),
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('common.total')}</span>
                        <span>{t('productionPlan.units.cases')}</span>
                    </div>
                ),
                key: 'grandTotal',
                width: 100,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type === 'total') {
                        return <strong>{record.grandTotal.toLocaleString('vi-VN')}</strong>;
                    }
                    if (record.type === 'group-header') return null;
                    return record.schedule.reduce((sum, q) => sum + q, 0);
                },
            },
            {
                title: '',
                key: 'actions',
                width: 92,
                align: 'right',
                onCell: anchorCell,
                render: (_, record) => {
                    if (record.type !== 'product') return null;
                    return (
                        <div className={styles.actions}>
                            <Tooltip title={t('common.edit')}>
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() =>
                                        onEdit({
                                            lineIndex: record.lineIndex,
                                            productIndex: record.productIndex,
                                        })
                                    }
                                />
                            </Tooltip>
                            <Tooltip title={t('common.delete')}>
                                <Button
                                    danger
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                        onDelete({
                                            lineIndex: record.lineIndex,
                                            productIndex: record.productIndex,
                                        })
                                    }
                                />
                            </Tooltip>
                        </div>
                    );
                },
            },
        ],
        [onDelete, onEdit, t, todayIndex, weekDayLabels]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeInfo = productGroupMap.get(String(active.id));
        const overInfo = productGroupMap.get(String(over.id));
        if (!activeInfo || !overInfo || activeInfo.groupKey !== overInfo.groupKey) return;

        onReorder(activeInfo.lineIndex, String(active.id), String(over.id));
    };

    if (machineGroups.length === 0) {
        return <Empty description={t('productionPlan.table.emptyFiltered')} />;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={sameGroupCollisionDetection}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={sortableKeys} strategy={verticalListSortingStrategy}>
                <Table<FlatRow>
                    className={`${styles.planAntTable} ${styles.weeklySheetTable}`}
                    components={{
                        body: {
                            row: SmartTableRow,
                        },
                    }}
                    columns={columns}
                    dataSource={flatRows}
                    rowKey={(record) => {
                        if (record.type === 'product') return record.code;
                        if (record.type === 'total') return `${record.groupKey}-total`;
                        return `${record.groupKey}-header`;
                    }}
                    rowClassName={(record) =>
                        record.type === 'total' ? styles.weeklyTotalRow : ''
                    }
                    onRow={(record) =>
                        ({
                            'data-row-type': record.type,
                        }) as React.HTMLAttributes<HTMLTableRowElement>
                    }
                    pagination={false}
                    bordered
                    size="small"
                    scroll={{ x: 1602 }}
                />
            </SortableContext>
        </DndContext>
    );
}
