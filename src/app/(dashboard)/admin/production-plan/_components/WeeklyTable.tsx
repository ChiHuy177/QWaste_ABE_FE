'use client';

import { useMemo, useState } from 'react';
import { Button, Empty, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    DeleteOutlined,
    DownOutlined,
    EditOutlined,
    PlusOutlined,
    RightOutlined,
} from '@ant-design/icons';
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
import { WEEK_DAYS } from './dateUtils';
import { DragHandle, DraggableTableRow } from './DraggableTableRow';
import { ProductionLine, ProductionProduct, ProductPosition } from './types';
import styles from './ProductionPlanTable.module.css';

type WeeklyProductRow = ProductionProduct & {
    lineIndex: number;
    productIndex: number;
};

interface WeeklyTableProps {
    lines: ProductionLine[];
    todayIndex: number;
    machineFilter: string;
    onAdd: (lineIndex: number) => void;
    onEdit: (position: ProductPosition) => void;
    onDelete: (position: ProductPosition) => void;
    onReorder: (lineIndex: number, activeCode: string, overCode: string) => void;
}

export default function WeeklyTable({
    lines,
    todayIndex,
    machineFilter,
    onAdd,
    onEdit,
    onDelete,
    onReorder,
}: WeeklyTableProps) {
    const [collapsedLineIds, setCollapsedLineIds] = useState<Set<string>>(new Set());
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();

    const columns = useMemo<ColumnsType<WeeklyProductRow>>(
        () => [
            {
                key: 'sort',
                width: 48,
                fixed: 'left',
                align: 'center',
                render: () => <DragHandle />,
            },
            {
                title: 'Mã Code',
                dataIndex: 'code',
                width: 140,
                fixed: 'left',
                render: (code: string) => <strong>{code}</strong>,
            },
            {
                title: 'Tên hàng',
                dataIndex: 'name',
                width: 260,
                fixed: 'left',
                render: (name: string, product) => (
                    <>
                        <div>{name}</div>
                        <div className={styles.productMeta}>
                            {product.pcsMultiplier} cái/thùng
                        </div>
                    </>
                ),
            },
            {
                title: 'Máy',
                dataIndex: 'machine',
                width: 130,
            },
            {
                title: 'Khuôn',
                dataIndex: 'mold',
                width: 120,
            },
            {
                title: 'Thời gian',
                dataIndex: 'time',
                width: 150,
            },
            ...WEEK_DAYS.map((day, index) => ({
                title: day,
                key: day,
                width: 86,
                align: 'right' as const,
                className: index === todayIndex ? styles.todayColumn : undefined,
                onCell: (product: WeeklyProductRow) => ({
                    className: [
                        index === todayIndex ? styles.todayColumn : '',
                        product.schedule[index] === 0 ? styles.mutedQuantity : '',
                    ]
                        .filter(Boolean)
                        .join(' '),
                }),
                render: (_: unknown, product: WeeklyProductRow) => product.schedule[index],
            })),
            {
                title: 'Tổng thùng',
                key: 'totalCases',
                width: 120,
                align: 'right',
                render: (_, product) => (
                    <strong>
                        {product.schedule.reduce((sum, quantity) => sum + quantity, 0)}
                    </strong>
                ),
            },
            {
                title: 'Thao tác',
                key: 'actions',
                width: 116,
                align: 'right',
                render: (_, product) => (
                    <div className={styles.actions}>
                        <Tooltip title="Sửa">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() =>
                                    onEdit({
                                        lineIndex: product.lineIndex,
                                        productIndex: product.productIndex,
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
                                        lineIndex: product.lineIndex,
                                        productIndex: product.productIndex,
                                    })
                                }
                            />
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [onDelete, onEdit, todayIndex]
    );

    const hasVisibleProducts = useMemo(
        () =>
            lines.some((line) =>
                line.products.some(
                    (product) =>
                        !normalizedMachineFilter ||
                        product.machine.toLowerCase().includes(normalizedMachineFilter)
                )
            ),
        [lines, normalizedMachineFilter]
    );

    const toggleLine = (lineId: string) => {
        setCollapsedLineIds((prev) => {
            const next = new Set(prev);
            if (next.has(lineId)) {
                next.delete(lineId);
            } else {
                next.add(lineId);
            }
            return next;
        });
    };

    const handleDragEnd = (lineIndex: number) => (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        onReorder(lineIndex, String(active.id), String(over.id));
    };

    if (!hasVisibleProducts) {
        return <Empty description="Không có mã hàng phù hợp với bộ lọc" />;
    }

    return (
        <div className={styles.lineStack}>
            {lines.map((line, lineIndex) => {
                const isCollapsed = collapsedLineIds.has(line.id);
                const dataSource: WeeklyProductRow[] = line.products
                    .map((product, productIndex) => ({
                        ...product,
                        lineIndex,
                        productIndex,
                    }))
                    .filter(
                        (product) =>
                            !normalizedMachineFilter ||
                            product.machine.toLowerCase().includes(normalizedMachineFilter)
                    );
                const rowKeys = dataSource.map((product) => product.code);

                if (dataSource.length === 0) {
                    return null;
                }

                return (
                    <section className={styles.lineBlock} key={line.id}>
                        <div className={styles.lineGroupHeader}>
                            <button
                                type="button"
                                className={`${styles.groupTitle} ${styles.groupToggle}`}
                                onClick={() => toggleLine(line.id)}
                            >
                                {isCollapsed ? <RightOutlined /> : <DownOutlined />}
                                <span>{line.name}</span>
                                <span className={styles.productMeta}>
                                    {dataSource.length} mã hàng
                                </span>
                            </button>

                            <Tooltip title="Thêm mã hàng">
                                <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => onAdd(lineIndex)}
                                />
                            </Tooltip>
                        </div>

                        {!isCollapsed && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                modifiers={[restrictToVerticalAxis]}
                                onDragEnd={handleDragEnd(lineIndex)}
                            >
                                <SortableContext
                                    items={rowKeys}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <Table<WeeklyProductRow>
                                        className={styles.planAntTable}
                                        components={{
                                            body: {
                                                row: DraggableTableRow,
                                            },
                                        }}
                                        columns={columns}
                                        dataSource={dataSource}
                                        rowKey="code"
                                        pagination={false}
                                        bordered
                                        size="middle"
                                        scroll={{ x: 1430 }}
                                    />
                                </SortableContext>
                            </DndContext>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
