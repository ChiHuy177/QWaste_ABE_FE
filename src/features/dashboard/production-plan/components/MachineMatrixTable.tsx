'use client';

import { useMemo } from 'react';
import { Empty, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { MachineGroupVM } from './types';
import styles from './ProductionPlanTable.module.css';
import { WEEK_DAY_KEYS } from '../utils/dateUtils';

interface MachineMatrixTableProps {
    groups: MachineGroupVM[];
    machineFilter: string;
    scrollY?: number;
    isMobile?: boolean;
}

interface DayItem {
    code: string;
    qty: number;
}

interface FlatRow {
    key: string;
    machineCode: string;
    spaceName: string;
    groupKey: string;
    groupSize: number;
    rowIndex: number;
    dayItems: (DayItem | undefined)[];
}

const matchMachineFilter = (group: MachineGroupVM, normalizedFilter: string) =>
    !normalizedFilter ||
    group.machineCode.toLowerCase().includes(normalizedFilter) ||
    group.machineName.toLowerCase().includes(normalizedFilter) ||
    group.spaceName.toLowerCase().includes(normalizedFilter);

export default function MachineMatrixTable({
    groups,
    machineFilter,
    scrollY,
    isMobile = false,
}: MachineMatrixTableProps) {
    const { t } = useTranslation();
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();

    // Mỗi máy: cột ngày chứa danh sách (code, qty) các plan chạy ngày đó.
    const machineGroups = useMemo(() => {
        return groups
            .filter((group) => matchMachineFilter(group, normalizedMachineFilter))
            .map((group) => {
                const dayItems: DayItem[][] = Array.from({ length: 7 }, () => []);
                let hasAnySchedule = false;

                group.products
                    .filter((product) => !product.isDeleted)
                    .forEach((product) => {
                        product.schedule.forEach((qty, dayIndex) => {
                            if (qty > 0) {
                                dayItems[dayIndex].push({ code: product.code, qty });
                                hasAnySchedule = true;
                            }
                        });
                    });

                return {
                    key: group.machineId,
                    machineCode: group.machineCode,
                    spaceName: group.spaceName,
                    dayItems,
                    maxRows: Math.max(...dayItems.map((items) => items.length), 0),
                    hasAnySchedule,
                };
            })
            .filter((group) => group.hasAnySchedule);
    }, [groups, normalizedMachineFilter]);

    const flatRows = useMemo(() => {
        const rows: FlatRow[] = [];

        machineGroups.forEach((group) => {
            for (let r = 0; r < group.maxRows; r++) {
                rows.push({
                    key: `${group.key}-row-${r}`,
                    machineCode: group.machineCode,
                    spaceName: group.spaceName,
                    groupKey: group.key,
                    groupSize: group.maxRows,
                    rowIndex: r,
                    dayItems: group.dayItems.map((items) => items[r]),
                });
            }
        });

        return rows;
    }, [machineGroups]);

    const columns = useMemo<ColumnsType<FlatRow>>(() => {
        return [
            {
                title: (
                    <div className={styles.dailySheetHeaderStack}>
                        <span>{t('productionPlan.table.headers.machine')}</span>
                        <span>(Machine)</span>
                    </div>
                ),
                key: 'machine',
                width: 170,
                fixed: isMobile ? undefined : 'left',
                className: styles.dailySheetMachineColumn,
                onCell: (record) => {
                    if (record.rowIndex === 0) {
                        return { rowSpan: record.groupSize };
                    }
                    return { rowSpan: 0 };
                },
                render: (_, record) => (
                    <div className={styles.dailySheetMachineCell}>
                        <strong>{record.machineCode}</strong>
                        <span>{record.spaceName}</span>
                    </div>
                ),
            },
            ...WEEK_DAY_KEYS.map((dayKey, d) => ({
                title: t(`productionPlan.days.full.${dayKey}`),
                key: dayKey,
                children: [
                    {
                        title: t('productionPlan.table.headers.codeVi'),
                        key: `${dayKey}-code`,
                        width: 100,
                        align: 'center' as const,
                        render: (_: unknown, record: FlatRow) => record.dayItems[d]?.code ?? '',
                    },
                    {
                        title: t('productionPlan.units.pieces'),
                        key: `${dayKey}-qty`,
                        width: 80,
                        align: 'right' as const,
                        render: (_: unknown, record: FlatRow) =>
                            record.dayItems[d] ? record.dayItems[d].qty.toLocaleString('vi-VN') : '',
                    },
                ],
            })),
        ];
    }, [isMobile, t]);

    if (machineGroups.length === 0) {
        return <Empty description={t('productionPlan.table.emptyFiltered')} />;
    }

    return (
        <Table<FlatRow>
            className={`${styles.planAntTable} ${styles.weeklySheetTable}`}
            columns={columns}
            dataSource={flatRows}
            rowKey={(record) => record.key}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 1430, y: scrollY }}
        />
    );
}
