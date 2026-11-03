'use client';

import React, { useMemo, useState } from 'react';
import { Table, Tag, Progress, Input, Typography, Flex, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { MachineOverview } from '@/types/Machine';
import {
    MOCK_MACHINE_PLAN_NUMBER,
    MOCK_ERROR_CAUSES,
    MOCK_ERROR_TIMES,
} from '@/mockData/admin/factory/machineDashboard';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
    RUNTIME: 'success',
    IDLE: 'warning',
    ERROR: 'error',
    OFFLINE: 'default',
    COMPLETE: 'processing',
    TEMPORARY_STOP: 'gold',
    WARNING: 'orange',
};

interface TableRow {
    key: string;
    machineId: string;
    machineName: string;
    machineCode?: string;
    status: string;
    actual: number;
    plan: number | null;
    achieveRate: number | null;
    runtimeSec: number;
    idleSec: number;
    errorSec: number;
    offlineSec: number;
    totalSec: number;
    errorCause: string | null;
    errorTime: string | null;
}

interface Props {
    machines: MachineOverview[];
    highlightMachineCode?: string | null;
}

const fmtDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const MachineDurationSummaryTable: React.FC<Props> = ({ machines, highlightMachineCode }) => {
    const { token } = theme.useToken();
    const [localSearch, setLocalSearch] = useState('');

    const rows: TableRow[] = useMemo(() => {
        return machines.map((m) => {
            const runtimeMap = (m.runtimeByStatus ?? {}) as Record<string, number>;
            const runtimeSec = runtimeMap['RUNTIME'] ?? 0;
            const idleSec = runtimeMap['IDLE'] ?? 0;
            const errorSec = (runtimeMap['ERROR'] ?? 0) + (runtimeMap['WARNING'] ?? 0);
            const offlineSec = runtimeMap['OFFLINE'] ?? 0;
            const totalSec = Object.values(runtimeMap).reduce((s, v) => s + v, 0);
            const plan = MOCK_MACHINE_PLAN_NUMBER[m.machineId] ?? null;
            const actual = m.totalProductions ?? 0;
            const achieveRate =
                plan !== null && plan > 0 ? Math.min(Math.round((actual / plan) * 100), 100) : null;

            return {
                key: m.machineId,
                machineId: m.machineId,
                machineName: m.machineName ?? m.machineId,
                machineCode: m.machineCode,
                status: m.currentStatus ?? 'OFFLINE',
                actual,
                plan,
                achieveRate,
                runtimeSec,
                idleSec,
                errorSec,
                offlineSec,
                totalSec,
                errorCause: MOCK_ERROR_CAUSES[m.machineId] ?? null,
                errorTime: MOCK_ERROR_TIMES[m.machineId] ?? null,
            };
        });
    }, [machines]);

    const filteredRows = useMemo(() => {
        if (!localSearch) return rows;
        const q = localSearch.toLowerCase();
        return rows.filter(
            (r) =>
                r.machineName.toLowerCase().includes(q) ||
                (r.machineCode?.toLowerCase().includes(q) ?? false)
        );
    }, [rows, localSearch]);

    const columns: ColumnsType<TableRow> = [
        {
            title: 'Machine',
            dataIndex: 'machineName',
            key: 'machineName',
            width: 180,
            render: (name: string, row) => (
                <div>
                    <Text strong style={{ fontSize: 13 }}>
                        {name}
                    </Text>
                    {row.machineCode && (
                        <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                            {row.machineCode}
                        </Text>
                    )}
                </div>
            ),
            sorter: (a, b) => a.machineName.localeCompare(b.machineName),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => (
                <Tag color={STATUS_COLOR[status] ?? 'default'} style={{ margin: 0 }}>
                    {status}
                </Tag>
            ),
            filters: ['RUNTIME', 'IDLE', 'ERROR', 'OFFLINE', 'COMPLETE'].map((s) => ({
                text: s,
                value: s,
            })),
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Production',
            key: 'production',
            width: 160,
            render: (_, row) => (
                <div>
                    <Text style={{ fontSize: 13 }}>
                        {row.actual}
                        {row.plan !== null ? ` / ${row.plan} pcs` : ' pcs'}
                    </Text>
                    {row.achieveRate !== null && (
                        <Progress
                            percent={row.achieveRate}
                            size="small"
                            showInfo={false}
                            strokeColor={
                                row.achieveRate >= 80
                                    ? token.colorSuccess
                                    : row.achieveRate >= 50
                                      ? token.colorWarning
                                      : token.colorError
                            }
                            style={{ marginBottom: 0 }}
                        />
                    )}
                </div>
            ),
            sorter: (a, b) => a.actual - b.actual,
        },
        {
            title: 'Runtime',
            dataIndex: 'runtimeSec',
            key: 'runtimeSec',
            width: 100,
            render: (sec: number, row) => {
                const pct = row.totalSec > 0 ? Math.round((sec / row.totalSec) * 100) : 0;
                return (
                    <Text style={{ color: token.colorSuccess, fontSize: 13 }}>
                        {fmtDuration(sec)}
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                            ({pct}%)
                        </Text>
                    </Text>
                );
            },
            sorter: (a, b) => a.runtimeSec - b.runtimeSec,
        },
        {
            title: 'Idle',
            dataIndex: 'idleSec',
            key: 'idleSec',
            width: 90,
            render: (sec: number, row) => {
                const pct = row.totalSec > 0 ? Math.round((sec / row.totalSec) * 100) : 0;
                return (
                    <Text style={{ color: token.colorWarning, fontSize: 13 }}>
                        {fmtDuration(sec)}
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                            ({pct}%)
                        </Text>
                    </Text>
                );
            },
            sorter: (a, b) => a.idleSec - b.idleSec,
        },
        {
            title: 'Error',
            dataIndex: 'errorSec',
            key: 'errorSec',
            width: 90,
            render: (sec: number, row) => {
                const pct = row.totalSec > 0 ? Math.round((sec / row.totalSec) * 100) : 0;
                return (
                    <Text style={{ color: token.colorError, fontSize: 13 }}>
                        {sec > 0 ? fmtDuration(sec) : '—'}
                        {sec > 0 && (
                            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                                ({pct}%)
                            </Text>
                        )}
                    </Text>
                );
            },
            sorter: (a, b) => a.errorSec - b.errorSec,
        },
        {
            title: 'Error Cause',
            key: 'errorCause',
            width: 180,
            render: (_, row) =>
                row.errorCause ? (
                    <Flex gap={4} vertical>
                        <Text type="danger" style={{ fontSize: 12 }}>
                            {row.errorCause}
                        </Text>
                        {row.errorTime && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                at {row.errorTime}
                            </Text>
                        )}
                    </Flex>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        —
                    </Text>
                ),
        },
    ];

    return (
        <div style={{ marginTop: 24 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 15 }}>
                    Duration Summary
                </Text>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search machines…"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    allowClear
                    style={{ width: 220 }}
                />
            </Flex>
            <Table<TableRow>
                columns={columns}
                dataSource={filteredRows}
                pagination={false}
                scroll={{ x: 900 }}
                size="small"
                onRow={(record) => ({
                    id: record.machineCode ? `machine-row-${record.machineCode}` : undefined,
                })}
                rowClassName={(record) =>
                    highlightMachineCode &&
                    record.machineCode?.toLowerCase() === highlightMachineCode.toLowerCase()
                        ? 'highlighted-incident-row'
                        : ''
                }
                style={{ borderRadius: 12, overflow: 'hidden' }}
            />
        </div>
    );
};

export default MachineDurationSummaryTable;
