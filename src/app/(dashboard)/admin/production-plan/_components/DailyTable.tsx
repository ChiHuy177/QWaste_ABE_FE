'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Empty, Pagination, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    DeleteOutlined,
    EditOutlined,
    MoreOutlined,
    ScheduleOutlined,
    SwapOutlined,
    UndoOutlined,
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
import { MachineGroupVM, PlanRowTarget, PlanRowVM } from './types';
import styles from './ProductionPlanTable.module.css';

type GroupHeaderRow = {
    type: 'group-header';
    groupKey: string;
    machineCode: string;
    spaceName: string;
    groupSize: number;
};

type ProductFlatRow = PlanRowVM & {
    type: 'product';
    groupKey: string;
    machineId: string;
    machineCode: string;
};

type TotalFlatRow = {
    type: 'total';
    groupKey: string;
    totalCases: number;
};

type FlatRow = GroupHeaderRow | ProductFlatRow | TotalFlatRow;

interface DailyTableProps {
    groups: MachineGroupVM[];
    todayIndex: number;
    dateLabel: string;
    machineFilter: string;
    canReorder?: boolean;
    scrollY?: number;
    /** Còn thay đổi thứ tự chưa lưu ở page cha — khóa Sửa/Xóa/Chuyển máy/Chuyển lịch. */
    actionsLocked?: boolean;
    onEdit: (target: PlanRowTarget) => void;
    onDelete: (target: PlanRowTarget) => void;
    onRestore: (target: PlanRowTarget) => void;
    onReorder: (machineId: string, activeRowKey: string, overRowKey: string) => void;
    onTransferMachine?: (target: PlanRowTarget) => void;
    onTransferSchedule?: (target: PlanRowTarget) => void;
}

const matchMachineFilter = (group: MachineGroupVM, normalizedFilter: string) =>
    !normalizedFilter ||
    group.machineCode.toLowerCase().includes(normalizedFilter) ||
    group.machineName.toLowerCase().includes(normalizedFilter) ||
    group.spaceName.toLowerCase().includes(normalizedFilter);

const toTarget = (record: ProductFlatRow): PlanRowTarget => ({
    machineId: record.machineId,
    machineCode: record.machineCode,
    row: record,
});

export default function DailyTable({
    groups,
    todayIndex,
    dateLabel,
    machineFilter,
    canReorder = true,
    scrollY,
    actionsLocked = false,
    onEdit,
    onDelete,
    onRestore,
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

    const visibleGroups = useMemo(
        () =>
            groups.filter(
                (group) =>
                    group.products.length > 0 && matchMachineFilter(group, normalizedMachineFilter)
            ),
        [groups, normalizedMachineFilter]
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [visibleGroups.length]);

    const paginatedGroups = useMemo(
        () => visibleGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [visibleGroups, currentPage, pageSize]
    );

    const { flatRows, sortableKeys, rowGroupMap } = useMemo(() => {
        const rows: FlatRow[] = [];
        const keys: string[] = [];
        const groupMap = new Map<string, { groupKey: string; machineId: string }>();

        paginatedGroups.forEach((group) => {
            const groupKey = group.machineId;
            const totalCases = group.products
                .filter((p) => !p.isDeleted)
                .reduce((sum, p) => sum + p.schedule[todayIndex], 0);

            // Anchor row: holds the machine rowspan cell, not draggable.
            // groupSize + 2 = 1 (this row) + groupSize (products) + 1 (total).
            rows.push({
                type: 'group-header',
                groupKey,
                machineCode: group.machineCode,
                spaceName: group.spaceName,
                groupSize: group.products.length,
            });

            group.products.forEach((product) => {
                rows.push({
                    ...product,
                    type: 'product',
                    groupKey,
                    machineId: group.machineId,
                    machineCode: group.machineCode,
                });
                if (!product.isDeleted) {
                    keys.push(product.rowKey);
                    groupMap.set(product.rowKey, { groupKey, machineId: group.machineId });
                }
            });

            rows.push({ type: 'total', groupKey, totalCases });
        });

        return { flatRows: rows, sortableKeys: keys, rowGroupMap: groupMap };
    }, [paginatedGroups, todayIndex]);

    const sameGroupCollisionDetection = useCallback<CollisionDetection>(
        (args) => {
            const activeGroupKey = rowGroupMap.get(String(args.active.id))?.groupKey;
            if (!activeGroupKey) return [];

            const sameGroupContainers = args.droppableContainers.filter(
                (c) => rowGroupMap.get(String(c.id))?.groupKey === activeGroupKey
            );

            return closestCenter({ ...args, droppableContainers: sameGroupContainers });
        },
        [rowGroupMap]
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
                                    <strong>{record.machineCode}</strong>
                                    <span>{record.spaceName}</span>
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
                        render: (_, record) =>
                            record.type === 'product' && !record.isDeleted && canReorder ? (
                                <DragHandle />
                            ) : null,
                    },
                    {
                        title: (
                            <div className={styles.dailySheetHeaderStack}>
                                <span>{t('productionPlan.table.headers.codeVi')}</span>
                                <span>Code</span>
                            </div>
                        ),
                        key: 'code',
                        width: 140,
                        fixed: 'left',
                        onCell: anchorCell,
                        render: (_, record) => {
                            if (record.type === 'total')
                                return <strong>{t('productionPlan.table.total')}</strong>;
                            if (record.type === 'group-header') return null;
                            return (
                                <>
                                    <strong>{record.code}</strong>
                                    {record.isDeleted && (
                                        <Tag style={{ marginLeft: 6 }}>
                                            {t('productionPlan.table.deletedTag')}
                                        </Tag>
                                    )}
                                </>
                            );
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
                        width: 110,
                        onCell: anchorCell,
                        render: (_, record) => (record.type === 'product' ? record.moldCode : null),
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
                                return <strong>{record.totalCases.toLocaleString('vi-VN')}</strong>;
                            if (record.type === 'group-header') return null;
                            return record.schedule[todayIndex];
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
                            const target = toTarget(record);
                            const lockedHint = t('productionPlan.reorder.lockedActionHint');

                            if (record.isDeleted) {
                                return (
                                    <Tooltip
                                        title={
                                            actionsLocked
                                                ? lockedHint
                                                : t('productionPlan.actions.restore')
                                        }
                                    >
                                        <Button
                                            type="text"
                                            icon={<UndoOutlined />}
                                            disabled={actionsLocked}
                                            onClick={() => onRestore(target)}
                                        />
                                    </Tooltip>
                                );
                            }

                            return (
                                <div className={styles.actions}>
                                    <Tooltip title={actionsLocked ? lockedHint : t('common.edit')}>
                                        <Button
                                            type="text"
                                            icon={<EditOutlined />}
                                            disabled={actionsLocked}
                                            onClick={() => onEdit(target)}
                                        />
                                    </Tooltip>
                                    <Tooltip title={actionsLocked ? lockedHint : t('common.delete')}>
                                        <Button
                                            danger
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            disabled={actionsLocked}
                                            onClick={() => onDelete(target)}
                                        />
                                    </Tooltip>
                                    <Tooltip title={actionsLocked ? lockedHint : undefined}>
                                        <Dropdown
                                            trigger={['click']}
                                            placement="bottomRight"
                                            disabled={actionsLocked}
                                            menu={{
                                                items: [
                                                    {
                                                        key: 'transfer-machine',
                                                        label: t(
                                                            'productionPlan.actions.transferMachine'
                                                        ),
                                                        icon: <SwapOutlined />,
                                                        onClick: () => onTransferMachine?.(target),
                                                    },
                                                    {
                                                        key: 'transfer-schedule',
                                                        label: t(
                                                            'productionPlan.actions.transferSchedule'
                                                        ),
                                                        icon: <ScheduleOutlined />,
                                                        onClick: () => onTransferSchedule?.(target),
                                                    },
                                                ],
                                            }}
                                        >
                                            <Button
                                                type="text"
                                                icon={<MoreOutlined />}
                                                disabled={actionsLocked}
                                            />
                                        </Dropdown>
                                    </Tooltip>
                                </div>
                            );
                        },
                    },
                ],
            },
        ],
        [
            actionsLocked,
            canReorder,
            dateLabel,
            onDelete,
            onEdit,
            onRestore,
            onTransferMachine,
            onTransferSchedule,
            t,
            todayIndex,
        ]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeInfo = rowGroupMap.get(String(active.id));
        const overInfo = rowGroupMap.get(String(over.id));
        if (!activeInfo || !overInfo || activeInfo.groupKey !== overInfo.groupKey) return;

        onReorder(activeInfo.machineId, String(active.id), String(over.id));
    };

    if (visibleGroups.length === 0) {
        return <Empty description={t('productionPlan.table.emptyDaily')} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
                                if (record.type === 'product') return record.rowKey;
                                if (record.type === 'total') return `${record.groupKey}-total`;
                                return `${record.groupKey}-header`;
                            }}
                            rowClassName={(record) => {
                                if (record.type === 'total') return styles.dailySheetTotalRow;
                                if (record.type === 'product' && record.isDeleted) {
                                    return styles.deletedRow;
                                }
                                return '';
                            }}
                            onRow={(record) =>
                                ({
                                    'data-row-type': record.type,
                                }) as React.HTMLAttributes<HTMLTableRowElement>
                            }
                            pagination={false}
                            bordered
                            size="small"
                            scroll={{ x: 1100, y: scrollY }}
                        />
                    </SortableContext>
                </DndContext>
            </div>
            <div
                style={{
                    marginTop: 16,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    flexShrink: 0,
                }}
            >
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={visibleGroups.length}
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
        </div>
    );
}
