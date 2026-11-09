'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Pagination, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    DeleteOutlined,
    EditOutlined,
    HistoryOutlined,
    HolderOutlined,
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
import type { ProductionPlanStatus } from '@/types/ProductionPlan';
import { DragHandle, SmartTableRow } from './DraggableTableRow';
import ProductDetailModal from './ProductDetailModal';
import { MachineGroupVM, MonitorRowVM, PlanRowTarget, PlanRowVM } from './types';
import styles from './ProductionPlanTable.module.css';

const STATUS_TAG_COLOR: Record<ProductionPlanStatus, string> = {
    PENDING: 'default',
    RUNNING: 'processing',
    PAUSE: 'warning',
    PARTIAL: 'gold',
    COMPLETE: 'success',
};

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
    spaceName: string;
};

type TotalFlatRow = {
    type: 'total';
    groupKey: string;
    totalPieces: number;
    totalActualPieces: number;
};

type FlatRow = GroupHeaderRow | ProductFlatRow | TotalFlatRow;

interface DailyTableProps {
    groups: MachineGroupVM[];
    todayIndex: number;
    dateLabel: string;
    machineFilter: string;
    canReorder?: boolean;
    scrollY?: number;
    isMobile?: boolean;
    /** Còn thay đổi thứ tự chưa lưu ở page cha — khóa Sửa/Xóa/Chuyển. */
    actionsLocked?: boolean;
    onEdit: (target: PlanRowTarget) => void;
    onDelete: (target: PlanRowTarget) => void;
    onRestore: (target: PlanRowTarget) => void;
    onReorder: (machineId: string, activeRowKey: string, overRowKey: string) => void;
    /** Mở modal lưới tuần chuyển máy/lịch (hướng 1) — single instance, render ở page cha. */
    onTransferOpen: (target: PlanRowTarget) => void;
}

const matchMachineFilter = (group: MachineGroupVM, normalizedFilter: string) =>
    !normalizedFilter ||
    group.machineCode.toLowerCase().includes(normalizedFilter) ||
    group.machineName.toLowerCase().includes(normalizedFilter) ||
    group.spaceName.toLowerCase().includes(normalizedFilter);

// BE /reorder chỉ cho phép đổi sequence của plan PENDING/PAUSE — status khác khóa kéo-thả.
const isReorderableStatus = (status: ProductionPlanStatus) =>
    status === 'PENDING' || status === 'PAUSE';

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
    isMobile = false,
    actionsLocked = false,
    onEdit,
    onDelete,
    onRestore,
    onReorder,
    onTransferOpen,
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
    const [historyTarget, setHistoryTarget] = useState<ProductFlatRow | null>(null);

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
            const activeProducts = group.products.filter((p) => !p.isDeleted);
            const totalPieces = activeProducts.reduce((sum, p) => sum + p.schedule[todayIndex], 0);
            const totalActualPieces = activeProducts.reduce(
                (sum, p) => sum + (p.actualQuantity ?? 0),
                0
            );

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
                    spaceName: group.spaceName,
                });
                if (!product.isDeleted && isReorderableStatus(product.status)) {
                    keys.push(product.rowKey);
                    groupMap.set(product.rowKey, { groupKey, machineId: group.machineId });
                }
            });

            rows.push({ type: 'total', groupKey, totalPieces, totalActualPieces });
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
                        <span>{t('productionPlan.table.headers.date')}</span>
                        <span>{t('productionPlan.table.headers.line')}</span>
                    </div>
                ),
                children: [
                    {
                        title: t('productionPlan.table.headers.machine'),
                        key: 'machine',
                        width: 170,
                        fixed: isMobile ? undefined : 'left',
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
                        render: (_, record) => {
                            if (record.type !== 'product' || record.isDeleted || !canReorder)
                                return null;
                            if (isReorderableStatus(record.status)) return <DragHandle />;
                            return (
                                <Tooltip title={t('productionPlan.reorder.statusLockedDragHint')}>
                                    <HolderOutlined
                                        style={{ color: 'var(--plan-color-text-tertiary)' }}
                                    />
                                </Tooltip>
                            );
                        },
                    },
                    {
                        title: t('productionPlan.table.headers.codeVi'),
                        key: 'code',
                        width: 140,
                        fixed: isMobile ? undefined : 'left',
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
                        title: t('productionPlan.units.pieces'),
                        key: 'pieceQuantity',
                        width: 100,
                        align: 'right',
                        onCell: anchorCell,
                        render: (_, record) => {
                            if (record.type === 'total')
                                return (
                                    <strong>{record.totalPieces.toLocaleString('vi-VN')}</strong>
                                );
                            if (record.type === 'group-header') return null;
                            const qty = record.schedule[todayIndex];
                            return qty != null ? qty.toLocaleString('vi-VN') : 0;
                        },
                    },
                    {
                        title: t('productionPlan.table.headers.actualPieces'),
                        key: 'actualPieceQuantity',
                        width: 100,
                        align: 'right',
                        onCell: anchorCell,
                        render: (_, record) => {
                            if (record.type === 'total')
                                return (
                                    <strong>
                                        {record.totalActualPieces.toLocaleString('vi-VN')}
                                    </strong>
                                );
                            if (record.type === 'group-header') return null;
                            return record.actualQuantity != null
                                ? record.actualQuantity.toLocaleString('vi-VN')
                                : '—';
                        },
                    },
                    {
                        title: t('productionPlan.table.headers.status'),
                        key: 'status',
                        width: 130,
                        align: 'center',
                        onCell: anchorCell,
                        render: (_, record) => {
                            if (record.type !== 'product') return null;
                            return (
                                <Tag color={STATUS_TAG_COLOR[record.status]}>
                                    {t(`productionPlan.status.${record.status}`)}
                                </Tag>
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

                            // BE: update/delete chỉ cho PENDING (409 khác); transfer cho phép
                            // PENDING (/move) và PAUSE (/incident/defer) — status khác thì ẩn.
                            const isPending = record.status === 'PENDING';
                            const isPause = record.status === 'PAUSE';
                            const isFinished =
                                record.status === 'COMPLETE' || record.status === 'PARTIAL';
                            const canEdit = !actionsLocked && isPending;
                            const canDelete = !actionsLocked && isPending;
                            const canTransfer = !actionsLocked && (isPending || isPause);
                            const statusLockedHint = t('productionPlan.actions.statusLockedHint');

                            if (isFinished) {
                                return (
                                    <div className={styles.actions}>
                                        <Tooltip title={t('productionPlan.actions.viewHistory')}>
                                            <Button
                                                type="text"
                                                icon={<HistoryOutlined />}
                                                onClick={() => setHistoryTarget(record)}
                                            />
                                        </Tooltip>
                                    </div>
                                );
                            }

                            return (
                                <div className={styles.actions}>
                                    <Tooltip
                                        title={
                                            actionsLocked
                                                ? lockedHint
                                                : !isPending
                                                  ? statusLockedHint
                                                  : t('common.edit')
                                        }
                                    >
                                        <Button
                                            type="text"
                                            icon={<EditOutlined />}
                                            disabled={!canEdit}
                                            onClick={() => onEdit(target)}
                                        />
                                    </Tooltip>
                                    <Tooltip
                                        title={
                                            actionsLocked
                                                ? lockedHint
                                                : !isPending
                                                  ? statusLockedHint
                                                  : t('common.delete')
                                        }
                                    >
                                        <Button
                                            danger
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            disabled={!canDelete}
                                            onClick={() => onDelete(target)}
                                        />
                                    </Tooltip>
                                    {canTransfer && (
                                        <Tooltip title={t('productionPlan.actions.transfer')}>
                                            <Button
                                                type="text"
                                                icon={<SwapOutlined />}
                                                onClick={() => onTransferOpen(target)}
                                            />
                                        </Tooltip>
                                    )}
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
            isMobile,
            onDelete,
            onEdit,
            onRestore,
            onTransferOpen,
            t,
            todayIndex,
        ]
    );

    // ProductDetailModal đọc MonitorRowVM — dựng lại từ record daily (đủ field cần cho modal:
    // status track + product info + status logs; không có realtime trigger/incidentReason vì
    // đây là plan đã COMPLETE/PARTIAL, không còn nằm trong phiên WS đang mở).
    const historyRow = useMemo<MonitorRowVM | null>(() => {
        if (!historyTarget) return null;
        return {
            productionPlanId: historyTarget.productionPlanId,
            code: historyTarget.code,
            name: historyTarget.name,
            machineId: historyTarget.machineId,
            machineCode: historyTarget.machineCode,
            spaceName: historyTarget.spaceName,
            moldCode: historyTarget.moldCode,
            plannedQuantity: historyTarget.schedule[todayIndex],
            actualQuantity: historyTarget.actualQuantity,
            status: historyTarget.status,
            updatedAt: null,
        };
    }, [historyTarget, todayIndex]);

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
                                    'data-draggable':
                                        record.type === 'product' &&
                                        !record.isDeleted &&
                                        canReorder &&
                                        isReorderableStatus(record.status),
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
                />
            </div>
            <ProductDetailModal
                row={historyRow}
                open={historyRow != null}
                onClose={() => setHistoryTarget(null)}
            />
        </div>
    );
}
