'use client';

import { useMemo } from 'react';
import { Empty, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { ProductionLine } from './types';
import styles from './ProductionPlanTable.module.css';
import { WEEK_DAY_KEYS } from '../_utils/dateUtils';
import { getEffectiveMachine, getSortedProductsForDay } from '../_utils/planUtils';

interface MachineMatrixTableProps {
    lines: ProductionLine[];
    machineFilter: string;
}

interface FlatRow {
    key: string;
    machine: string;
    lineName: string;
    groupKey: string;
    groupSize: number;
    rowIndex: number;
    monday?: { code: string; qty: number };
    tuesday?: { code: string; qty: number };
    wednesday?: { code: string; qty: number };
    thursday?: { code: string; qty: number };
    friday?: { code: string; qty: number };
    saturday?: { code: string; qty: number };
    sunday?: { code: string; qty: number };
    [key: string]: any;
}

export default function MachineMatrixTable({ lines, machineFilter }: MachineMatrixTableProps) {
    const { t } = useTranslation();
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();

    // Group products by machine across all lines
    const machineGroups = useMemo(() => {
        const groups: {
            key: string;
            machine: string;
            lineName: string;
            dayItems: { code: string; qty: number }[][];
            maxRows: number;
        }[] = [];

        lines.forEach((line) => {
            // Find all unique machine names in this line
            const machinesInLine = new Set<string>();
            line.products.forEach((product) => {
                machinesInLine.add(product.machine);
                product.machineOverrides?.forEach((m) => m && machinesInLine.add(m));
            });

            machinesInLine.forEach((machine) => {
                if (
                    normalizedMachineFilter &&
                    !machine.toLowerCase().includes(normalizedMachineFilter)
                ) {
                    return;
                }

                // 7 days: 0 = Mon, ..., 6 = Sun
                const dayItems: { code: string; qty: number }[][] = Array.from({ length: 7 }, () => []);
                let hasAnySchedule = false;

                for (let d = 0; d < 7; d++) {
                    const sortedProducts = getSortedProductsForDay(line, d);
                    sortedProducts.forEach((product) => {
                        if (
                            product.schedule[d] > 0 &&
                            getEffectiveMachine(product, d) === machine
                        ) {
                            dayItems[d].push({
                                code: product.code,
                                qty: product.schedule[d],
                            });
                            hasAnySchedule = true;
                        }
                    });
                }

                if (hasAnySchedule) {
                    const maxRows = Math.max(...dayItems.map((items) => items.length));
                    groups.push({
                        key: `${line.spaceCode}-${machine}`,
                        machine,
                        lineName: line.spaceName,
                        dayItems,
                        maxRows,
                    });
                }
            });
        });

        return groups;
    }, [lines, normalizedMachineFilter]);

    // Flatten groups into table rows
    const flatRows = useMemo(() => {
        const rows: FlatRow[] = [];

        machineGroups.forEach((group) => {
            for (let r = 0; r < group.maxRows; r++) {
                const row: FlatRow = {
                    key: `${group.key}-row-${r}`,
                    machine: group.machine,
                    lineName: group.lineName,
                    groupKey: group.key,
                    groupSize: group.maxRows,
                    rowIndex: r,
                };

                WEEK_DAY_KEYS.forEach((dayKey, d) => {
                    const item = group.dayItems[d][r];
                    if (item) {
                        row[dayKey] = item;
                    }
                });

                rows.push(row);
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
                fixed: 'left',
                className: styles.dailySheetMachineColumn,
                onCell: (record) => {
                    if (record.rowIndex === 0) {
                        return { rowSpan: record.groupSize };
                    }
                    return { rowSpan: 0 };
                },
                render: (_, record) => (
                    <div className={styles.dailySheetMachineCell}>
                        <strong>{record.machine}</strong>
                        <span>{record.lineName}</span>
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
                        render: (_: any, record: FlatRow) => record[dayKey]?.code || '',
                    },
                    {
                        title: t('productionPlan.units.cases'),
                        key: `${dayKey}-qty`,
                        width: 80,
                        align: 'right' as const,
                        render: (_: any, record: FlatRow) =>
                            record[dayKey] ? record[dayKey].qty.toLocaleString('vi-VN') : '',
                    },
                ],
            })),
        ];
    }, [t]);

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
            scroll={{ x: 1430 }}
        />
    );
}
