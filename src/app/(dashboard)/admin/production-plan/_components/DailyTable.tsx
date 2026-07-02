'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Empty, Pagination, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    DeleteOutlined,
    EditOutlined,
    MoreOutlined,
    ScheduleOutlined,
    SwapOutlined,
} from '@ant-design/icons';
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
import { getEffectiveMachine } from '../_utils/planUtils';

type DailyProductRow = ProductionProduct & {
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

type ProductFlatRow = DailyProductRow & {
    type: 'product';
    groupKey: string;
};

type TotalFlatRow = {
    type: 'total';
    groupKey: string;
    machine: string;
    lineName: string;
    lineIndex: number;
    totalCases: number;
    totalPcs: number;
};

type FlatRow = GroupHeaderRow | ProductFlatRow | TotalFlatRow;

interface MachineGroup {
    key: string;
    lineIndex: number;
    lineName: string;
    machine: string;
    products: DailyProductRow[];
}

interface DailyTableProps {
    lines: ProductionLine[];
    todayIndex: number;
    dateLabel: string;
    machineFilter: string;
    onEdit: (position: ProductPosition) => void;
    onDelete: (position: ProductPosition) => void;
    onReorder: (lineIndex: number, activeCode: string, overCode: string) => void;
    onTransferMachine?: (position: ProductPosition) => void;
    onTransferSchedule?: (position: ProductPosition) => void;
}

export default function DailyTable({
    lines,
    todayIndex,
    dateLabel,
    machineFilter,
    onEdit,
    onDelete,
    onReorder,
    onTransferMachine,
    onTransferSchedule,
}: DailyTableProps) {
    const { t } = useTranslation();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();

    const machineGroups = useMemo<MachineGroup[]>(() => {
        const groups: MachineGroup[] = [];

        lines.forEach((line, lineIndex) => {
            const groupedProducts = new Map<string, DailyProductRow[]>();

            line.products.forEach((product, productIndex) => {
                if (product.schedule[todayIndex] <= 0) return;
                const effectiveMachine = getEffectiveMachine(product, todayIndex);
                if (
                    normalizedMachineFilter &&
                    !effectiveMachine.toLowerCase().includes(normalizedMachineFilter)
                ) {
                    return;
                }

                const current = groupedProducts.get(effectiveMachine) ?? [];
                current.push({ ...product, lineIndex, lineName: line.name, productIndex });
                groupedProducts.set(effectiveMachine, current);
            });

            groupedProducts.forEach((products, machine) => {
                groups.push({
                    key: `${line.id}-${machine}`,
                    lineIndex,
                    lineName: line.name,
                    machine,
                    products,
                });
            });
        });

        return groups;
    }, [lines, normalizedMachineFilter, todayIndex]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [machineGroups.length]);

    const paginatedGroups = useMemo(
        () => machineGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [machineGroups, currentPage, pageSize]
    );

    const { flatRows, sortableKeys, productGroupMap } = useMemo(() => {
        const rows: FlatRow[] = [];
        const keys: string[] = [];
        const groupMap = new Map<string, { groupKey: string; lineIndex: number }>();

        paginatedGroups.forEach((group) => {
            const totalCases = group.products.reduce((sum, p) => sum + p.schedule[todayIndex], 0);
            const totalPcs = group.products.reduce(
                (sum, p) => sum + p.schedule[todayIndex] * p.pcsMultiplier,
                0
            );

            // Anchor row: holds the machine rowspan cell, not draggable.
            // groupSize + 2 = 1 (this row) + groupSize (products) + 1 (total).
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
                totalCases,
                totalPcs,
            });
        });

        return { flatRows: rows, sortableKeys: keys, productGroupMap: groupMap };
    }, [paginatedGroups, todayIndex]);

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

    // Returns the onCell override that hides a cell inside the anchor (group-header) row.
    const anchorCell = (record: FlatRow) =>
        record.type === 'group-header' ? { className: styles.dailyGroupAnchorCell } : {};

    const columns = useMemo<ColumnsType<FlatRow>>(
        () => [
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.date')} (date)</span>
                        <span>{t('productionPlan.table.headers.line')}</span>
                    </div>
                ),
                children: [
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
                            // Anchor row: machine cell spans itself + all products + total row.
                            if (record.type === 'group-header') {
                                return { rowSpan: record.groupSize + 2 };
                            }
                            // All other rows: hidden (covered by the anchor row's rowspan).
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
                ],
            },
            {
                title: <span className={styles.dailySheetDateHeader}>{dateLabel}</span>,
                children: [
                    {
                        key: 'sort',
                        width: 48,
                        align: 'center',
                        onCell: anchorCell,
                        render: (_, record) => (record.type === 'product' ? <DragHandle /> : null),
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
                            if (record.type === 'total')
                                return <strong>{t('productionPlan.table.total')}</strong>;
                            if (record.type === 'group-header') return null;
                            return <strong>{record.code}</strong>;
                        },
                    },
                    {
                        title: t('productionPlan.table.headers.productName'),
                        key: 'name',
                        width: 380,
                        onCell: anchorCell,
                        render: (_, record) => (record.type === 'product' ? record.name : null),
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>{t('productionPlan.table.headers.codeVi')}</span>
                                <span>{t('productionPlan.table.headers.mold')}</span>
                            </div>
                        ),
                        key: 'mold',
                        width: 100,
                        onCell: anchorCell,
                        render: (_, record) => (record.type === 'product' ? record.mold : null),
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>{t('productionPlan.table.headers.average')}</span>
                                <span>Average</span>
                            </div>
                        ),
                        key: 'pcsMultiplier',
                        width: 100,
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
                        width: 120,
                        onCell: anchorCell,
                        render: (_, record) => (record.type === 'product' ? record.time : null),
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>{t('productionPlan.units.cases')}</span>
                                <span>(case)</span>
                            </div>
                        ),
                        key: 'caseQuantity',
                        width: 100,
                        align: 'right',
                        onCell: anchorCell,
                        render: (_, record) => {
                            if (record.type === 'total')
                                return record.totalCases.toLocaleString('vi-VN');
                            if (record.type === 'group-header') return null;
                            return record.schedule[todayIndex];
                        },
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>{t('productionPlan.units.pcs')}</span>
                                <span>(pcs)</span>
                            </div>
                        ),
                        key: 'pcs',
                        width: 100,
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
                            if (record.type === 'total') {
                                return <strong>{record.totalPcs.toLocaleString('vi-VN')}</strong>;
                            }
                            if (record.type === 'group-header') return null;
                            return (
                                <strong>
                                    {(
                                        record.schedule[todayIndex] * record.pcsMultiplier
                                    ).toLocaleString('vi-VN')}
                                </strong>
                            );
                        },
                    },
                    {
                        title: '',
                        key: 'actions',
                        width: 120,
                        align: 'right',
                        onCell: anchorCell,
                        render: (_, record) => {
                            if (record.type !== 'product') return null;
                            const position = {
                                lineIndex: record.lineIndex,
                                productIndex: record.productIndex,
                            };
                            return (
                                <div className={styles.actions}>
                                    <Tooltip title={t('common.edit')}>
                                        <Button
                                            type="text"
                                            icon={<EditOutlined />}
                                            onClick={() => onEdit(position)}
                                        />
                                    </Tooltip>
                                    <Tooltip title={t('common.delete')}>
                                        <Button
                                            danger
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            onClick={() => onDelete(position)}
                                        />
                                    </Tooltip>
                                    <Dropdown
                                        trigger={['click']}
                                        placement="bottomRight"
                                        menu={{
                                            items: [
                                                {
                                                    key: 'transfer-machine',
                                                    label: t(
                                                        'productionPlan.actions.transferMachine'
                                                    ),
                                                    icon: <SwapOutlined />,
                                                    onClick: () => onTransferMachine?.(position),
                                                },
                                                {
                                                    key: 'transfer-schedule',
                                                    label: t(
                                                        'productionPlan.actions.transferSchedule'
                                                    ),
                                                    icon: <ScheduleOutlined />,
                                                    onClick: () => onTransferSchedule?.(position),
                                                },
                                            ],
                                        }}
                                    >
                                        <Button type="text" icon={<MoreOutlined />} />
                                    </Dropdown>
                                </div>
                            );
                        },
                    },
                ],
            },
        ],
        [dateLabel, onDelete, onEdit, onTransferMachine, onTransferSchedule, t, todayIndex]
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
        return <Empty description={t('productionPlan.table.emptyDaily')} />;
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={sameGroupCollisionDetection}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={sortableKeys} strategy={verticalListSortingStrategy}>
                    <Table<FlatRow>
                        className={`${styles.planAntTable} ${styles.dailySheetTable}`}
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
                            record.type === 'total' ? styles.dailySheetTotalRow : ''
                        }
                        onRow={(record) =>
                            ({
                                'data-row-type': record.type,
                            }) as React.HTMLAttributes<HTMLTableRowElement>
                        }
                        pagination={false}
                        bordered
                        size="small"
                        scroll={{ x: 1330 }}
                    />
                </SortableContext>
            </DndContext>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={machineGroups.length}
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
                    showSizeChanger
                    pageSizeOptions={['3', '5', '10']}
                    showTotal={(total) =>
                        t('productionPlan.table.pagination.machineGroups', { total })
                    }
                    hideOnSinglePage
                />
            </div>
        </>
    );
}
