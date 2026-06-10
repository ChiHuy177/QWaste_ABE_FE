'use client';

import React, { useMemo } from 'react';
import {
    Modal, Typography, Tag, Flex, Row, Col, Divider, Space, Tabs, Table, Timeline, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
    ThunderboltOutlined,
    FieldTimeOutlined,
    UserOutlined,
    CheckCircleOutlined,
    RiseOutlined,
    WarningOutlined,
    SyncOutlined,
    LoginOutlined,
    LogoutOutlined,
    ToolOutlined,
    AlertOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { theme } from 'antd';
import { MachineOverview } from '@/types/Machine';

const { Title, Text } = Typography;

// ─── Mock data types ───────────────────────────────────────────────────────────

interface ErrorHistoryRow {
    key: string;
    time: string;
    errorCause: string;
    duration: string;
    severity: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'Resolved';
}

interface OperationLogItem {
    key: string;
    time: string;
    color: string;
    icon?: React.ReactNode;
    title: string;
    note: string;
}

// ─── Per-machine mock data ─────────────────────────────────────────────────────

const MOCK_ERROR_HISTORY: Record<string, ErrorHistoryRow[]> = {
    'machine-demo-cnc-01': [
        { key: '1', time: '09:20', errorCause: 'Tool wear warning', duration: '0h 15m', severity: 'Low', status: 'Resolved' },
        { key: '2', time: '07:45', errorCause: 'Coolant pressure low', duration: '0h 05m', severity: 'Low', status: 'Resolved' },
    ],
    'machine-demo-cnc-02': [
        { key: '1', time: '11:10', errorCause: 'Spindle temperature alarm', duration: '0h 40m', severity: 'High', status: 'Open' },
        { key: '2', time: '08:30', errorCause: 'Axis servo fault', duration: '0h 12m', severity: 'Medium', status: 'Resolved' },
        { key: '3', time: '06:55', errorCause: 'Door interlock triggered', duration: '0h 03m', severity: 'Low', status: 'Resolved' },
    ],
    'machine-demo-lathe-01': [
        { key: '1', time: '10:05', errorCause: 'Chuck pressure warning', duration: '0h 08m', severity: 'Low', status: 'Resolved' },
    ],
    'machine-demo-cut-01': [
        { key: '1', time: '13:05', errorCause: 'Laser calibration pause', duration: '0h 20m', severity: 'Medium', status: 'Resolved' },
        { key: '2', time: '09:40', errorCause: 'Assist gas pressure drop', duration: '0h 06m', severity: 'Low', status: 'Resolved' },
    ],
    'machine-demo-heat-01': [
        { key: '1', time: '06:00', errorCause: 'PLC communication lost', duration: '3h 30m+', severity: 'High', status: 'Open' },
    ],
};

const MOCK_OPERATION_LOGS: Record<string, OperationLogItem[]> = {
    'machine-demo-cnc-01': [
        { key: '1', time: '15:00', color: 'green',  icon: <SyncOutlined />,   title: 'Data synchronised',            note: 'Status, output, and duration refreshed.' },
        { key: '2', time: '14:30', color: 'green',  icon: <CheckCircleOutlined />, title: 'Production checkpoint',   note: '186 units produced — on track with plan.' },
        { key: '3', time: '09:20', color: 'orange', icon: <WarningOutlined />, title: 'Tool wear warning resolved',   note: 'Operator replaced tool insert. Machine resumed.' },
        { key: '4', time: '08:00', color: 'green',  icon: <LoginOutlined />,   title: 'Shift started',               note: 'Operator logged in. Machine powered on.' },
    ],
    'machine-demo-cnc-02': [
        { key: '1', time: '15:00', color: 'red',    icon: <AlertOutlined />,   title: 'Error still active',          note: 'Spindle temperature alarm unresolved. Awaiting maintenance.' },
        { key: '2', time: '11:10', color: 'red',    icon: <CloseCircleOutlined />, title: 'Error detected',          note: 'Spindle temperature exceeded threshold. Machine stopped.' },
        { key: '3', time: '10:50', color: 'orange', icon: <WarningOutlined />, title: 'Temperature rising warning',   note: 'Spindle temp at 85 °C — pre-alarm threshold reached.' },
        { key: '4', time: '08:30', color: 'orange', icon: <ToolOutlined />,    title: 'Axis servo fault resolved',   note: 'Servo drive reset by operator. Production resumed.' },
        { key: '5', time: '08:00', color: 'green',  icon: <LoginOutlined />,   title: 'Shift started',               note: 'Operator logged in. Machine powered on.' },
    ],
    'machine-demo-lathe-01': [
        { key: '1', time: '15:00', color: 'orange', icon: <PauseCircleOutlined />, title: 'Machine idle',            note: 'Waiting for next batch. Operator on standby.' },
        { key: '2', time: '14:10', color: 'green',  icon: <CheckCircleOutlined />, title: 'Production checkpoint',   note: '74 units produced. Running below plan — monitored.' },
        { key: '3', time: '10:05', color: 'orange', icon: <WarningOutlined />, title: 'Chuck pressure warning cleared', note: 'Pressure normalised. No operator action needed.' },
        { key: '4', time: '08:00', color: 'green',  icon: <LoginOutlined />,   title: 'Shift started',               note: 'Operator logged in. Machine powered on.' },
    ],
    'machine-demo-cut-01': [
        { key: '1', time: '15:00', color: 'green',  icon: <SyncOutlined />,    title: 'Data synchronised',           note: 'Status, output, and duration refreshed.' },
        { key: '2', time: '13:30', color: 'green',  icon: <CheckCircleOutlined />, title: 'Laser calibration complete', note: 'Machine returned to production after calibration.' },
        { key: '3', time: '13:05', color: 'orange', icon: <ToolOutlined />,    title: 'Laser calibration started',   note: 'Scheduled mid-shift calibration routine initiated.' },
        { key: '4', time: '08:00', color: 'green',  icon: <LoginOutlined />,   title: 'Shift started',               note: 'Operator logged in. Machine powered on.' },
    ],
    'machine-demo-heat-01': [
        { key: '1', time: '15:00', color: 'gray',   icon: <StopOutlined />,    title: 'Still offline',               note: 'PLC communication not restored. IT team notified.' },
        { key: '2', time: '09:00', color: 'gray',   icon: <ToolOutlined />,    title: 'Maintenance team on site',    note: 'Investigating PLC communication failure.' },
        { key: '3', time: '06:00', color: 'red',    icon: <AlertOutlined />,   title: 'Machine went offline',        note: 'PLC communication lost at shift start. Operator reported.' },
        { key: '4', time: '05:55', color: 'gray',   icon: <LogoutOutlined />,  title: 'Previous shift ended',        note: 'Machine was online at end of previous shift.' },
    ],
};

// ─── Fallback for unknown machines ────────────────────────────────────────────

const getErrorHistory = (machineId: string): ErrorHistoryRow[] =>
    MOCK_ERROR_HISTORY[machineId] ?? [];

const getOperationLogs = (machineId: string): OperationLogItem[] =>
    MOCK_OPERATION_LOGS[machineId] ?? [
        { key: '1', time: '08:00', color: 'green', icon: <LoginOutlined />, title: 'Shift started', note: 'Machine powered on.' },
    ];

// ─── Component ────────────────────────────────────────────────────────────────

interface MachineTimelineModalProps {
    open: boolean;
    onClose: () => void;
    machine: MachineOverview | null;
    filterInfo?: {
        factoryName?: string;
        zoneCode?: string;
        timePeriod?: string;
        timePeriodValue?: string;
    };
}

const MachineTimelineModal: React.FC<MachineTimelineModalProps> = ({
    open,
    onClose,
    machine,
    filterInfo,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const statusConfig = useMemo(
        () => ({
            RUNTIME: {
                color: '#3D8A6B',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(61, 138, 107, 0.08)',
                text: t('machineManagement.statuses.running') || 'Running',
                icon: PlayCircleOutlined,
            },
            IDLE: {
                color: '#C4883A',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(196, 136, 58, 0.08)',
                text: t('machineManagement.statuses.idle') || 'Idle',
                icon: PauseCircleOutlined,
            },
            ERROR: {
                color: '#C75454',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(199, 84, 84, 0.08)',
                text: t('machineManagement.statuses.error') || 'Error',
                icon: CloseCircleOutlined,
            },
            OFFLINE: {
                color: token.colorTextTertiary,
                bgColor: token.colorBgContainer,
                lightBg: token.colorBgLayout,
                text: t('machineManagement.statuses.offline') || 'Offline',
                icon: StopOutlined,
            },
            COMPLETE: {
                color: '#3D8A6B',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(61, 138, 107, 0.08)',
                text: t('machineManagement.statuses.complete') || 'Complete',
                icon: CheckCircleOutlined,
            },
            TEMPORARY_STOP: {
                color: '#C4883A',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(196, 136, 58, 0.08)',
                text: t('machineManagement.statuses.temporaryStop') || 'Stopped',
                icon: PauseCircleOutlined,
            },
            OPEN_DOOR: {
                color: token.colorInfo,
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(24, 144, 255, 0.08)',
                text: t('machineManagement.statuses.openDoor') || 'Open Door',
                icon: StopOutlined,
            },
            WARNING: {
                color: '#faad14',
                bgColor: token.colorBgContainer,
                lightBg: 'rgba(250, 173, 20, 0.08)',
                text: t('machineManagement.statuses.warning') || 'Warning',
                icon: WarningOutlined,
            },
            UNKNOWN: {
                color: token.colorTextTertiary,
                bgColor: token.colorBgContainer,
                lightBg: token.colorBgLayout,
                text: t('machineManagement.timeline.unknown') || 'Unknown',
                icon: StopOutlined,
            },
        }),
        [t, token]
    );

    const getStatusConfig = (status: string) =>
        statusConfig[status as keyof typeof statusConfig] || statusConfig.UNKNOWN;

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const hasTimeData = useMemo(() => {
        if (!machine?.runtimeByStatus) return false;
        if (machine.runtimeByStatus instanceof Map) return machine.runtimeByStatus.size > 0;
        return Object.keys(machine.runtimeByStatus).length > 0;
    }, [machine?.runtimeByStatus]);

    const statsData = useMemo(() => {
        if (!machine?.runtimeByStatus) {
            return { runtime: 0, idle: 0, error: 0, offline: 0, totalActive: 0, total: 0, runtimePercent: 0, idlePercent: 0, errorPercent: 0 };
        }
        const get = (status: string): number => {
            if (machine.runtimeByStatus instanceof Map) return machine.runtimeByStatus.get(status) || 0;
            return (machine.runtimeByStatus as Record<string, number>)[status] || 0;
        };
        const runtime = get('RUNTIME');
        const idle = get('IDLE');
        const error = get('ERROR');
        const offline = get('OFFLINE');
        const totalActive = runtime + idle + error;
        const total = totalActive + offline;
        return {
            runtime, idle, error, offline,
            totalActive, total,
            runtimePercent: totalActive > 0 ? Number(((runtime / totalActive) * 100).toFixed(2)) : 0,
            idlePercent:    totalActive > 0 ? Number(((idle    / totalActive) * 100).toFixed(2)) : 0,
            errorPercent:   totalActive > 0 ? Number(((error   / totalActive) * 100).toFixed(2)) : 0,
        };
    }, [machine?.runtimeByStatus]);

    // ─── Error History tab ───────────────────────────────────────────────────

    const errorColumns: ColumnsType<ErrorHistoryRow> = [
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 70,
            render: (v) => <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</Text>,
        },
        {
            title: 'Error Cause',
            dataIndex: 'errorCause',
            key: 'errorCause',
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            width: 90,
            render: (v) => <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</Text>,
        },
        {
            title: 'Severity',
            dataIndex: 'severity',
            key: 'severity',
            width: 90,
            render: (v: ErrorHistoryRow['severity']) => {
                const map = { High: 'error', Medium: 'warning', Low: 'default' } as const;
                return <Tag color={map[v]}>{v}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 90,
            render: (v: ErrorHistoryRow['status']) => (
                <Tag color={v === 'Open' ? 'error' : 'success'}>{v}</Tag>
            ),
        },
    ];

    // ─── Operation Logs tab ──────────────────────────────────────────────────

    const renderOperationLogs = (logs: OperationLogItem[]) => (
        <Timeline
            style={{ paddingTop: 8 }}
            items={logs.map((log) => ({
                key: log.key,
                color: log.color,
                dot: log.icon
                    ? React.cloneElement(log.icon as React.ReactElement<any>, {
                          style: { fontSize: 14 },
                      })
                    : undefined,
                children: (
                    <div style={{ paddingBottom: 4 }}>
                        <Flex align="center" gap={10} style={{ marginBottom: 2 }}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: token.colorTextTertiary,
                                    fontVariantNumeric: 'tabular-nums',
                                    minWidth: 42,
                                }}
                            >
                                {log.time}
                            </Text>
                            <Text strong style={{ fontSize: 13, color: token.colorText }}>
                                {log.title}
                            </Text>
                        </Flex>
                        <Text
                            style={{
                                fontSize: 12,
                                color: token.colorTextSecondary,
                                paddingLeft: 52,
                                display: 'block',
                            }}
                        >
                            {log.note}
                        </Text>
                    </div>
                ),
            }))}
        />
    );

    // ─── Overview tab (existing content) ─────────────────────────────────────

    const renderOverview = () => {
        if (!statsData) return <Empty description={t('machineManagement.timeline.noActivityData')} />;

        const isCompletelyOffline = statsData.totalActive === 0 && statsData.offline > 0;
        const activeStatItems = [
            { status: 'RUNTIME', duration: statsData.runtime,  percent: statsData.runtimePercent },
            { status: 'IDLE',    duration: statsData.idle,     percent: statsData.idlePercent },
            { status: 'ERROR',   duration: statsData.error,    percent: statsData.errorPercent },
        ];

        return (
            <div>
                {/* Machine info row */}
                <Row gutter={[16, 16]} style={{ marginBottom: token.marginLG }}>
                    {[
                        { label: t('machineManagement.timeline.machineCode'),    value: machine?.machineCode },
                        { label: t('machineManagement.timeline.propertyCode'),   value: machine?.propertyCode || t('common.notAvailable') },
                        { label: t('machineManagement.timeline.power'),          value: machine?.power ? `${machine.power} kW` : '10 kW' },
                        {
                            label: t('machineManagement.timeline.energy'),
                            value: (() => {
                                const power = machine?.power || 0;
                                const hours = statsData.totalActive / 3600;
                                const energy = power * hours;
                                return energy > 0
                                    ? `${energy.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`
                                    : t('common.notAvailable');
                            })(),
                        },
                        { label: t('machineManagement.timeline.measuredEnergy'), value: `${machine?.currentEnergyConsumption ?? 0} kW` },
                    ].map(({ label, value }, i) => (
                        <Col xs={24} sm={12} md={8} lg={5} key={i}>
                            <Text style={{ display: 'block', fontSize: 12, color: token.colorTextTertiary, marginBottom: 4 }}>
                                {label}
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: 500 }}>{value}</Text>
                        </Col>
                    ))}
                </Row>

                <Divider style={{ margin: `0 0 ${token.marginLG}px` }} />

                {/* Time distribution bar */}
                {!isCompletelyOffline && (
                    <div style={{ marginBottom: token.marginLG }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: token.marginSM }}>
                            <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>
                                {t('machineManagement.timeline.timeDistribution')}
                            </Text>
                            <Text style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                                {t('machineManagement.timeline.excludingOffline')}
                            </Text>
                        </Flex>
                        <Flex style={{ width: '100%', height: 32, background: token.colorBgLayout, borderRadius: token.borderRadius, overflow: 'hidden' }} align="center" justify="center">
                            {!hasTimeData ? (
                                <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                                    {t('machineManagement.timeline.noTimeData')}
                                </Text>
                            ) : (
                                activeStatItems.map((item, i) => {
                                    const cfg = getStatusConfig(item.status);
                                    if (item.percent === 0) return null;
                                    return (
                                        <div key={i} style={{ width: `${item.percent}%`, height: '100%', background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.3s ease' }} title={`${cfg.text}: ${item.percent}%`}>
                                            {item.percent > 12 && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{item.percent}%</Text>}
                                        </div>
                                    );
                                })
                            )}
                        </Flex>
                        <Flex gap={token.marginMD} style={{ marginTop: token.marginSM }} wrap="wrap">
                            {activeStatItems.map((item, i) => {
                                const cfg = getStatusConfig(item.status);
                                return (
                                    <Flex key={i} align="center" gap={6}>
                                        <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.color }} />
                                        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>{cfg.text}</Text>
                                    </Flex>
                                );
                            })}
                        </Flex>
                    </div>
                )}

                {/* Stat cards */}
                <Row gutter={[16, 16]}>
                    {activeStatItems.map((item, i) => {
                        const cfg = getStatusConfig(item.status);
                        const IconComp = cfg.icon;
                        return (
                            <Col xs={24} sm={8} key={i}>
                                <div style={{ padding: token.padding, background: cfg.lightBg, borderRadius: token.borderRadius, borderLeft: `3px solid ${cfg.color}` }}>
                                    <Flex align="center" gap={10} style={{ marginBottom: 12 }}>
                                        <IconComp style={{ color: cfg.color, fontSize: 18 }} />
                                        <Text style={{ color: cfg.color, fontWeight: 500, fontSize: 14 }}>{cfg.text}</Text>
                                    </Flex>
                                    <Flex justify="space-between" align="baseline">
                                        <div>
                                            <Text style={{ fontSize: 24, fontWeight: 600, color: token.colorText, fontVariantNumeric: 'tabular-nums' }}>{item.percent}</Text>
                                            <Text style={{ fontSize: 14, color: token.colorTextTertiary, marginLeft: 2 }}>%</Text>
                                        </div>
                                        <Text style={{ fontSize: 13, color: token.colorTextSecondary, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(item.duration)}</Text>
                                    </Flex>
                                </div>
                            </Col>
                        );
                    })}
                </Row>

                {/* Offline row */}
                {statsData.offline > 0 && (
                    <div style={{ marginTop: token.margin, padding: `${token.paddingSM}px ${token.padding}px`, background: token.colorBgLayout, borderRadius: token.borderRadius }}>
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={10}>
                                <StopOutlined style={{ color: token.colorTextTertiary, fontSize: 16 }} />
                                <div>
                                    <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>{t('machineManagement.statuses.offline')}</Text>
                                    <Text style={{ display: 'block', fontSize: 11, color: token.colorTextTertiary }}>{t('machineManagement.timeline.offlineNote')}</Text>
                                </div>
                            </Flex>
                            <Text style={{ fontSize: 14, color: token.colorTextSecondary, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(statsData.offline)}</Text>
                        </Flex>
                    </div>
                )}

                {/* Production metrics */}
                <Divider style={{ margin: `${token.marginLG}px 0` }} />
                <Text style={{ display: 'block', fontSize: 14, fontWeight: 500, color: token.colorText, marginBottom: token.marginMD }}>
                    {t('machineManagement.timeline.productionMetrics')}
                </Text>
                <Row gutter={[16, 16]}>
                    {[
                        { icon: <UserOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />,  label: t('machineManagement.timeline.operatorCount'),  value: machine?.operatorCount || 0 },
                        { icon: <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 16 }} />, label: t('machineManagement.timeline.totalProductions'), value: machine?.totalProductions || 0 },
                        { icon: <RiseOutlined style={{ color: token.colorWarning, fontSize: 16 }} />, label: t('machineManagement.timeline.yields'), value: '100%' },
                    ].map(({ icon, label, value }, i) => (
                        <Col xs={24} sm={8} key={i}>
                            <div style={{ padding: token.padding, background: token.colorBgContainer, borderRadius: token.borderRadius, border: `1px solid ${token.colorBorder}` }}>
                                <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                                    {icon}
                                    <Text style={{ color: token.colorTextSecondary, fontSize: 13 }}>{label}</Text>
                                </Flex>
                                <Text style={{ fontSize: 24, fontWeight: 600, color: token.colorText, fontVariantNumeric: 'tabular-nums' }}>{value}</Text>
                            </div>
                        </Col>
                    ))}
                </Row>

                {/* Total active time */}
                <div style={{ marginTop: token.marginLG, padding: token.padding, background: `${token.colorSuccess}40`, borderRadius: token.borderRadius, border: `1px solid ${token.colorSuccess}30` }}>
                    <Flex justify="space-between" align="center">
                        <Flex align="center" gap={10}>
                            <FieldTimeOutlined style={{ color: token.colorSuccess, fontSize: 20 }} />
                            <div>
                                <Text style={{ fontSize: 14, color: token.colorText, fontWeight: 500 }}>{t('machineManagement.timeline.totalActiveTime')}</Text>
                                <Text style={{ display: 'block', fontSize: 12, color: token.colorTextTertiary }}>{t('machineManagement.timeline.excludingOffline')}</Text>
                            </div>
                        </Flex>
                        <Text style={{ fontSize: 20, fontWeight: 600, color: token.colorPrimary, fontVariantNumeric: 'tabular-nums' }}>
                            {formatDuration(statsData.totalActive)}
                        </Text>
                    </Flex>
                </div>
            </div>
        );
    };

    // ─── Tabs ─────────────────────────────────────────────────────────────────

    const currentStatusConfig = machine?.currentStatus ? getStatusConfig(machine.currentStatus) : null;

    const errorRows  = machine ? getErrorHistory(machine.machineId)    : [];
    const logItems   = machine ? getOperationLogs(machine.machineId)   : [];

    const TAB_CONTENT_HEIGHT = 580;
    const tabContentStyle: React.CSSProperties = {
        minHeight: TAB_CONTENT_HEIGHT,
        maxHeight: TAB_CONTENT_HEIGHT,
        overflowY: 'auto',
        paddingRight: 4,
    };

    const tabItems = [
        {
            key: 'overview',
            label: 'Overview',
            children: <div style={tabContentStyle}>{renderOverview()}</div>,
        },
        {
            key: 'errors',
            label: (
                <Flex align="center" gap={6}>
                    Error History
                    {errorRows.some((r) => r.status === 'Open') && (
                        <Tag color="error" style={{ margin: 0, fontSize: 11, lineHeight: '16px', padding: '0 5px' }}>
                            {errorRows.filter((r) => r.status === 'Open').length} Open
                        </Tag>
                    )}
                </Flex>
            ),
            children: (
                <div style={tabContentStyle}>
                    {errorRows.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text style={{ color: token.colorTextTertiary }}>
                                    No errors recorded for this machine today.
                                </Text>
                            }
                            style={{ padding: '40px 0' }}
                        />
                    ) : (
                        <Table<ErrorHistoryRow>
                            columns={errorColumns}
                            dataSource={errorRows}
                            pagination={false}
                            size="small"
                            style={{ marginTop: 4 }}
                        />
                    )}
                </div>
            ),
        },
        {
            key: 'logs',
            label: 'Operation Logs',
            children: <div style={tabContentStyle}>{renderOperationLogs(logItems)}</div>,
        },
    ];

    return (
        <Modal
            title={
                <Flex align="center" justify="space-between" gap={16} wrap="wrap" style={{ paddingBottom: 8 }}>
                    <Flex align="center" gap={12}>
                        <Title level={5} style={{ margin: 0 }}>
                            {machine?.machineName || t('machineManagement.timeline.machineDetails')}
                        </Title>
                        {currentStatusConfig && (
                            <Tag style={{ color: currentStatusConfig.color, background: currentStatusConfig.lightBg, border: `1px solid ${currentStatusConfig.color}30`, fontWeight: 500, fontSize: 12 }}>
                                {currentStatusConfig.text}
                            </Tag>
                        )}
                    </Flex>
                    {filterInfo && (
                        <Flex gap={8} wrap="wrap" align="center" style={{ paddingRight: 32 }}>
                            {filterInfo.timePeriod && (
                                <Tag style={{ margin: 0, fontSize: 12, background: token.colorBgLayout, border: `1px solid ${token.colorBorder}`, color: token.colorTextSecondary }}>
                                    {filterInfo.timePeriod}
                                </Tag>
                            )}
                            {filterInfo.factoryName && (
                                <Tag style={{ margin: 0, fontSize: 12, background: token.colorBgLayout, border: `1px solid ${token.colorBorder}`, color: token.colorTextSecondary }}>
                                    {filterInfo.factoryName}
                                </Tag>
                            )}
                            {filterInfo.zoneCode && (
                                <Tag style={{ margin: 0, fontSize: 12, background: token.colorBgLayout, border: `1px solid ${token.colorBorder}`, color: token.colorTextSecondary }}>
                                    {filterInfo.zoneCode}
                                </Tag>
                            )}
                        </Flex>
                    )}
                </Flex>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ maxWidth: 900 }}
            centered
            styles={{
                body: { padding: `0 ${token.paddingLG}px ${token.paddingLG}px` },
                header: { borderBottom: `1px solid ${token.colorBorderSecondary}`, padding: `${token.paddingMD}px ${token.paddingLG}px` },
            }}
        >
            {machine ? (
                <Tabs
                    defaultActiveKey="overview"
                    items={tabItems}
                    style={{ marginTop: 0 }}
                    tabBarStyle={{ marginBottom: token.marginMD }}
                />
            ) : (
                <Space style={{ width: '100%', padding: token.paddingLG }}>
                    <Empty description={t('machineManagement.timeline.noMachineData')} />
                </Space>
            )}
        </Modal>
    );
};

export default MachineTimelineModal;
