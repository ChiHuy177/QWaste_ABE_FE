'use client';

import React, { useMemo, useState } from 'react';
import { Card, Flex, Input, Select, Table, Tag, Typography, theme } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MachineOverview } from '@/types/Machine';

const { Title, Text } = Typography;

const MOCK_MACHINE_PLAN: Record<string, number> = {
    'machine-demo-cnc-01':   200,
    'machine-demo-cnc-02':   150,
    'machine-demo-lathe-01': 100,
    'machine-demo-cut-01':   250,
    'machine-demo-heat-01':  100,
};

const MOCK_ERROR_CAUSES: Record<string, string> = {
    'machine-demo-cnc-02':   'Spindle temperature alarm',
    'machine-demo-heat-01':  'PLC communication lost',
};

const fmt = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
};

const statusTag = (status: string) => {
    switch (status) {
        case 'RUNTIME':
            return <Tag color="success">Running</Tag>;
        case 'IDLE':
        case 'TEMPORARY_STOP':
            return <Tag color="warning">Stopped</Tag>;
        case 'ERROR':
        case 'WARNING':
            return <Tag color="error">Error</Tag>;
        case 'COMPLETE':
            return <Tag color="success">Complete</Tag>;
        default:
            return <Tag color="default">Offline</Tag>;
    }
};

interface TableRow {
    key: string;
    machineName: string;
    machineCode: string;
    status: string;
    running: number;
    stopped: number;
    error: number;
    offline: number;
    outputToday: number;
    plan: number;
    errorCause: string;
}

interface MachineDurationSummaryTableProps {
    machines: MachineOverview[];
}

const MachineDurationSummaryTable: React.FC<MachineDurationSummaryTableProps> = ({ machines }) => {
    const { token } = theme.useToken();
    const [tableSearch, setTableSearch] = useState('');
    const [tableStatus, setTableStatus] = useState('ALL');
    const [tablePlan, setTablePlan] = useState('ALL');

    const rows = useMemo<TableRow[]>(() =>
        machines.map((m) => {
            const rb = (m.runtimeByStatus ?? {}) as Record<string, number>;
            const stopped =
                (rb['IDLE'] ?? 0) +
                (rb['TEMPORARY_STOP'] ?? 0) +
                (rb['COMPLETE'] ?? 0);
            return {
                key: m.machineId,
                machineName: m.machineName,
                machineCode: m.machineCode,
                status: m.currentStatus ?? 'OFFLINE',
                running: rb['RUNTIME'] ?? 0,
                stopped,
                error: rb['ERROR'] ?? 0,
                offline: rb['OFFLINE'] ?? 0,
                outputToday: m.totalProductions ?? 0,
                plan: MOCK_MACHINE_PLAN[m.machineId] ?? 0,
                errorCause: MOCK_ERROR_CAUSES[m.machineId] ?? 'No error cause',
            };
        }),
        [machines]
    );

    const filteredRows = useMemo(() => {
        const statusGroups: Record<string, string[]> = {
            Running: ['RUNTIME'],
            Stopped: ['IDLE', 'TEMPORARY_STOP', 'COMPLETE'],
            Error: ['ERROR', 'WARNING'],
            Offline: ['OFFLINE'],
        };

        return rows.filter((row) => {
            if (tableSearch) {
                const q = tableSearch.toLowerCase();
                if (
                    !row.machineName.toLowerCase().includes(q) &&
                    !row.machineCode.toLowerCase().includes(q)
                ) return false;
            }
            if (tableStatus !== 'ALL') {
                const allowed = statusGroups[tableStatus] ?? [];
                if (!allowed.includes(row.status)) return false;
            }
            if (tablePlan === 'behind') {
                if (row.plan <= 0 || row.outputToday >= row.plan) return false;
            } else if (tablePlan === 'on_track') {
                if (row.plan > 0 && row.outputToday < row.plan) return false;
            }
            return true;
        });
    }, [rows, tableSearch, tableStatus, tablePlan]);

    const columns: ColumnsType<TableRow> = [
        {
            title: 'Machine',
            dataIndex: 'machineName',
            key: 'machineName',
            render: (name: string, row: TableRow) => (
                <div>
                    <Text strong style={{ fontSize: 13 }}>{name}</Text>
                    <br />
                    <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>{row.machineCode}</Text>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => statusTag(s),
        },
        {
            title: 'Running',
            dataIndex: 'running',
            key: 'running',
            render: (v: number) => (
                <Text style={{ fontSize: 13, color: token.colorSuccess }}>{fmt(v)}</Text>
            ),
        },
        {
            title: 'Stopped',
            dataIndex: 'stopped',
            key: 'stopped',
            render: (v: number) => (
                <Text style={{ fontSize: 13, color: token.colorWarning }}>{fmt(v)}</Text>
            ),
        },
        {
            title: 'Error',
            dataIndex: 'error',
            key: 'error',
            render: (v: number) => (
                <Text style={{ fontSize: 13, color: v > 0 ? token.colorError : token.colorTextTertiary }}>
                    {fmt(v)}
                </Text>
            ),
        },
        {
            title: 'Offline',
            dataIndex: 'offline',
            key: 'offline',
            render: (v: number) => (
                <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>{fmt(v)}</Text>
            ),
        },
        {
            title: 'Output Today',
            dataIndex: 'outputToday',
            key: 'outputToday',
            render: (v: number) => (
                <Text strong style={{ fontSize: 13 }}>{v.toLocaleString()} pcs</Text>
            ),
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
            render: (v: number) => (
                <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                    {v > 0 ? `${v.toLocaleString()} pcs` : '—'}
                </Text>
            ),
        },
        {
            title: 'Error Cause / Note',
            dataIndex: 'errorCause',
            key: 'errorCause',
            render: (cause: string, row: TableRow) => (
                <Text
                    style={{
                        fontSize: 13,
                        color: row.status === 'ERROR' || row.status === 'OFFLINE'
                            ? token.colorError
                            : token.colorTextTertiary,
                    }}
                >
                    {cause}
                </Text>
            ),
        },
    ];

    if (machines.length === 0) return null;

    return (
        <Card
            style={{ borderRadius: 12, boxShadow: token.boxShadowSecondary, marginTop: 40 }}
            styles={{ body: { padding: '0 0 8px' } }}
            variant="borderless"
        >
            <div
                style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
                    <div>
                        <Title level={5} style={{ margin: 0, color: token.colorPrimary }}>
                            Current Day Machine Duration Summary
                        </Title>
                        <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                            Running / Stopped / Error / Offline duration and error cause
                        </Text>
                    </div>
                    <Flex gap={10} align="center" wrap="wrap">
                        <Input
                            placeholder="Search machine name or code"
                            prefix={<SearchOutlined />}
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            allowClear
                            style={{ width: 220, borderRadius: 6 }}
                        />
                        <Select
                            value={tableStatus}
                            onChange={setTableStatus}
                            style={{ width: 150 }}
                            options={[
                                { label: 'All Statuses', value: 'ALL' },
                                { label: 'Running', value: 'Running' },
                                { label: 'Stopped', value: 'Stopped' },
                                { label: 'Error', value: 'Error' },
                                { label: 'Offline', value: 'Offline' },
                            ]}
                        />
                        <Select
                            value={tablePlan}
                            onChange={setTablePlan}
                            style={{ width: 170 }}
                            options={[
                                { label: 'All Output', value: 'ALL' },
                                { label: 'Behind plan', value: 'behind' },
                                { label: 'On track', value: 'on_track' },
                            ]}
                        />
                    </Flex>
                </Flex>
            </div>
            <Table<TableRow>
                columns={columns}
                dataSource={filteredRows}
                pagination={false}
                size="middle"
                scroll={{ x: 900 }}
                style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
                components={{
                    body: {
                        cell: ({ style, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
                            <td {...rest} style={{ ...style, padding: '14px 20px' }} />
                        ),
                    },
                    header: {
                        cell: ({ style, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                            <th {...rest} style={{ ...style, padding: '12px 20px' }} />
                        ),
                    },
                }}
            />
        </Card>
    );
};

export default MachineDurationSummaryTable;
