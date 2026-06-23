'use client';

import { useMemo } from 'react';
import { Button, Empty, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
    closestCenter,
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

type DailyProductRow = ProductionProduct & {
    lineIndex: number;
    lineName: string;
    productIndex: number;
    machineGroupRowIndex: number;
    machineGroupSize: number;
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

type FlatRow = ProductFlatRow | TotalFlatRow;

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
}

export default function DailyTable({
    lines,
    todayIndex,
    dateLabel,
    machineFilter,
    onEdit,
    onDelete,
    onReorder,
}: DailyTableProps) {
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
                if (
                    normalizedMachineFilter &&
                    !product.machine.toLowerCase().includes(normalizedMachineFilter)
                ) {
                    return;
                }

                const currentProducts = groupedProducts.get(product.machine) ?? [];
                currentProducts.push({
                    ...product,
                    lineIndex,
                    lineName: line.name,
                    productIndex,
                    machineGroupRowIndex: currentProducts.length,
                    machineGroupSize: 0,
                });
                groupedProducts.set(product.machine, currentProducts);
            });

            groupedProducts.forEach((products, machine) => {
                groups.push({
                    key: `${line.id}-${machine}`,
                    lineIndex,
                    lineName: line.name,
                    machine,
                    products: products.map((product, machineGroupRowIndex) => ({
                        ...product,
                        machineGroupRowIndex,
                        machineGroupSize: products.length,
                    })),
                });
            });
        });

        return groups;
    }, [lines, normalizedMachineFilter, todayIndex]);

    const { flatRows, sortableKeys, productGroupMap } = useMemo(() => {
        const rows: FlatRow[] = [];
        const keys: string[] = [];
        const groupMap = new Map<string, { groupKey: string; lineIndex: number }>();

        machineGroups.forEach((group) => {
            const totalCases = group.products.reduce(
                (sum, p) => sum + p.schedule[todayIndex],
                0
            );
            const totalPcs = group.products.reduce(
                (sum, p) => sum + p.schedule[todayIndex] * p.pcsMultiplier,
                0
            );

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
    }, [machineGroups, todayIndex]);

    const columns = useMemo<ColumnsType<FlatRow>>(
        () => [
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>Ngày (date)</span>
                        <span>Chuyền (Line)</span>
                    </div>
                ),
                children: [
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Máy</span>
                                <span>(Machine)</span>
                            </div>
                        ),
                        key: 'machine',
                        width: 170,
                        fixed: 'left',
                        className: styles.dailySheetMachineColumn,
                        onCell: (record) => {
                            if (record.type === 'total') return { rowSpan: 0 };
                            if (record.machineGroupRowIndex === 0) {
                                return { rowSpan: record.machineGroupSize + 1 };
                            }
                            return { rowSpan: 0 };
                        },
                        render: (_, record) => {
                            if (record.type !== 'product') return null;
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
                        render: (_, record) =>
                            record.type === 'product' ? <DragHandle /> : null,
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Mã</span>
                                <span>Code</span>
                            </div>
                        ),
                        key: 'code',
                        width: 120,
                        fixed: 'left',
                        render: (_, record) => {
                            if (record.type === 'total') return <strong>Total</strong>;
                            return <strong>{record.code}</strong>;
                        },
                    },
                    {
                        title: 'Tên hàng',
                        key: 'name',
                        width: 380,
                        render: (_, record) =>
                            record.type === 'product' ? record.name : null,
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Mã</span>
                                <span>khuôn</span>
                            </div>
                        ),
                        key: 'mold',
                        width: 100,
                        render: (_, record) =>
                            record.type === 'product' ? record.mold : null,
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Trung bình</span>
                                <span>Average</span>
                            </div>
                        ),
                        key: 'pcsMultiplier',
                        width: 100,
                        align: 'right',
                        render: (_, record) =>
                            record.type === 'product' ? record.pcsMultiplier : null,
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Thời gian</span>
                                <span>Time</span>
                            </div>
                        ),
                        key: 'time',
                        width: 120,
                        render: (_, record) =>
                            record.type === 'product' ? record.time : null,
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Thùng</span>
                                <span>(case)</span>
                            </div>
                        ),
                        key: 'caseQuantity',
                        width: 100,
                        align: 'right',
                        render: (_, record) => {
                            if (record.type === 'total') {
                                return record.totalCases.toLocaleString('vi-VN');
                            }
                            return record.schedule[todayIndex];
                        },
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>Cái</span>
                                <span>(pcs)</span>
                            </div>
                        ),
                        key: 'pcs',
                        width: 100,
                        align: 'right',
                        className: styles.dailySheetPcsColumn,
                        render: (_, record) => {
                            if (record.type === 'total') {
                                return (
                                    <strong>{record.totalPcs.toLocaleString('vi-VN')}</strong>
                                );
                            }
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
                        width: 92,
                        align: 'right',
                        render: (_, record) => {
                            if (record.type !== 'product') return null;
                            return (
                                <div className={styles.actions}>
                                    <Tooltip title="Sửa">
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
                                    <Tooltip title="Xóa">
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
            },
        ],
        [dateLabel, onDelete, onEdit, todayIndex]
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
        return <Empty description="Không có kế hoạch sản xuất cho ngày đã chọn" />;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
                    rowKey={(record) =>
                        record.type === 'product'
                            ? record.code
                            : `${record.groupKey}-total`
                    }
                    rowClassName={(record) =>
                        record.type === 'total' ? styles.dailySheetTotalRow : ''
                    }
                    onRow={(record) =>
                        ({
                            'data-row-type': record.type,
                        } as React.HTMLAttributes<HTMLTableRowElement>)
                    }
                    pagination={false}
                    bordered
                    size="small"
                    scroll={{ x: 1330 }}
                />
            </SortableContext>
        </DndContext>
    );
}
