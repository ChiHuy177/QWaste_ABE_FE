'use client';

import { useMemo } from 'react';
import { Empty, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { MachineGroupVM, PlanRowVM } from './types';
import styles from './ProductionPlanTable.module.css';
import { WEEK_DAY_KEYS } from '../utils/dateUtils';

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
};

type TotalFlatRow = {
    type: 'total';
    groupKey: string;
    totalPerDay: number[];
    grandTotal: number;
};

type FlatRow = GroupHeaderRow | ProductFlatRow | TotalFlatRow;

interface WeeklyTableProps {
    groups: MachineGroupVM[];
    todayIndex: number;
    machineFilter: string;
    scrollY?: number;
    isMobile?: boolean;
}

const matchMachineFilter = (group: MachineGroupVM, normalizedFilter: string) =>
    !normalizedFilter ||
    group.machineCode.toLowerCase().includes(normalizedFilter) ||
    group.machineName.toLowerCase().includes(normalizedFilter) ||
    group.spaceName.toLowerCase().includes(normalizedFilter);

// Weekly là view tổng hợp: 1 dòng gộp nhiều plan/ngày nên sửa/xoá/kéo-thả
// chỉ thao tác được ở daily view (mỗi dòng = đúng 1 plan).
export default function WeeklyTable({
    groups,
    todayIndex,
    machineFilter,
    scrollY,
    isMobile = false,
}: WeeklyTableProps) {
    const { t } = useTranslation();
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();
    const weekDayLabels = useMemo(
        () => WEEK_DAY_KEYS.map((dayKey) => t(`productionPlan.days.short.${dayKey}`)),
        [t]
    );

    const visibleGroups = useMemo(
        () =>
            groups.filter(
                (group) =>
                    group.products.length > 0 && matchMachineFilter(group, normalizedMachineFilter)
            ),
        [groups, normalizedMachineFilter]
    );

    const flatRows = useMemo(() => {
        const rows: FlatRow[] = [];

        visibleGroups.forEach((group) => {
            const groupKey = group.machineId;
            const activeProducts = group.products.filter((p) => !p.isDeleted);
            const totalPerDay = weekDayLabels.map((_, i) =>
                activeProducts.reduce((sum, p) => sum + p.schedule[i], 0)
            );
            const grandTotal = totalPerDay.reduce((sum, d) => sum + d, 0);

            rows.push({
                type: 'group-header',
                groupKey,
                machineCode: group.machineCode,
                spaceName: group.spaceName,
                groupSize: group.products.length,
            });

            group.products.forEach((product) => {
                rows.push({ ...product, type: 'product', groupKey });
            });

            rows.push({ type: 'total', groupKey, totalPerDay, grandTotal });
        });

        return rows;
    }, [visibleGroups, weekDayLabels]);

    const anchorCell = (record: FlatRow) =>
        record.type === 'group-header' ? { className: styles.dailyGroupAnchorCell } : {};

    const columns = useMemo<ColumnsType<FlatRow>>(
        () => [
            {
                title: t('productionPlan.table.headers.machine'),
                key: 'machine',
                width: 170,
                fixed: isMobile ? undefined : 'left',
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
                width: 220,
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
                render: (_, record) => (record.type === 'product' ? record.moldCode : null),
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
                    if (record.type === 'total')
                        return record.totalPerDay[index].toLocaleString('vi-VN');
                    if (record.type === 'group-header') return null;
                    const qty = record.schedule[index];
                    return qty != null ? qty.toLocaleString('vi-VN') : 0;
                },
            })),
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('common.total')}</span>
                        <span>{t('productionPlan.units.pieces')}</span>
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
                    return record.schedule.reduce((sum, q) => sum + q, 0).toLocaleString('vi-VN');
                },
            },
        ],
        [isMobile, t, todayIndex, weekDayLabels]
    );

    if (visibleGroups.length === 0) {
        return <Empty description={t('productionPlan.table.emptyFiltered')} />;
    }

    return (
        <Table<FlatRow>
            className={`${styles.planAntTable} ${styles.weeklySheetTable}`}
            columns={columns}
            dataSource={flatRows}
            rowKey={(record) => {
                if (record.type === 'product') return record.rowKey;
                if (record.type === 'total') return `${record.groupKey}-total`;
                return `${record.groupKey}-header`;
            }}
            rowClassName={(record) => {
                if (record.type === 'total') return styles.weeklyTotalRow;
                if (record.type === 'product' && record.isDeleted) return styles.deletedRow;
                return '';
            }}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1300, y: scrollY }}
        />
    );
}
