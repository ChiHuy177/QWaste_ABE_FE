'use client';

import React, { useMemo } from 'react';
import { Card, Flex, Typography, Tag, Progress, Alert } from 'antd';
import { WarningOutlined, AlertOutlined, DisconnectOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import { MachineOverview } from '@/types/Machine';

const { Text, Title } = Typography;

// ─── Mock plan data per machineId (prototype only) ────────────────────────────

const MOCK_MACHINE_PLAN: Record<string, { zone: string; plan: number }> = {
    'machine-demo-cnc-01':   { zone: 'Zone A1 · CNC',     plan: 200 },
    'machine-demo-cnc-02':   { zone: 'Zone A1 · CNC',     plan: 150 },
    'machine-demo-lathe-01': { zone: 'Zone A1 · CNC',     plan: 100 },
    'machine-demo-cut-01':   { zone: 'Zone A2 · Cutting', plan: 250 },
    'machine-demo-heat-01':  { zone: 'Zone A2 · Cutting', plan: 100 },
};

const MOCK_ERROR_CAUSES: Record<string, string> = {
    'machine-demo-cnc-02':   'Spindle temperature alarm',
    'machine-demo-heat-01':  'PLC communication lost',
};

const MOCK_ERROR_TIMES: Record<string, string> = {
    'machine-demo-cnc-02':   '11:10',
    'machine-demo-heat-01':  '06:00',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (actual: number, plan: number) =>
    plan > 0 ? Math.min(Math.round((actual / plan) * 100), 100) : 0;

const progressStatus = (p: number): 'success' | 'normal' | 'exception' =>
    p >= 80 ? 'success' : p >= 50 ? 'normal' : 'exception';

const progressStrokeColor = (p: number, token: ReturnType<typeof theme.useToken>['token']) =>
    p >= 80 ? token.colorSuccess : p >= 50 ? token.colorWarning : token.colorError;

// ─── Component ────────────────────────────────────────────────────────────────

interface MachineDashboardSummaryProps {
    machines: MachineOverview[];
}

const MachineDashboardSummary: React.FC<MachineDashboardSummaryProps> = ({ machines }) => {
    const { token } = theme.useToken();

    // ── Production output ────────────────────────────────────────────────────

    const productionData = useMemo(() => {
        const zoneMap: Record<string, { actual: number; plan: number }> = {};
        let totalActual = 0;
        let totalPlan = 0;

        for (const machine of machines) {
            const meta = MOCK_MACHINE_PLAN[machine.machineId];
            if (!meta) continue;

            const actual = machine.totalProductions ?? 0;
            if (!zoneMap[meta.zone]) zoneMap[meta.zone] = { actual: 0, plan: 0 };
            zoneMap[meta.zone].actual += actual;
            zoneMap[meta.zone].plan   += meta.plan;
            totalActual += actual;
            totalPlan   += meta.plan;
        }

        const zones = Object.entries(zoneMap).map(([zone, { actual, plan }]) => ({
            zone,
            actual,
            plan,
            percent: pct(actual, plan),
        }));

        const overallPct = pct(totalActual, totalPlan);
        const deficit = totalPlan - totalActual;

        return { zones, totalActual, totalPlan, overallPct, deficit };
    }, [machines]);

    // ── Latest issues ────────────────────────────────────────────────────────

    const issueMachines = useMemo(
        () =>
            machines
                .filter((m) => m.currentStatus === 'ERROR' || m.currentStatus === 'OFFLINE')
                .slice(0, 5),
        [machines]
    );

    if (machines.length === 0) return null;

    // ── Render ───────────────────────────────────────────────────────────────

    const overallBelowPlan = productionData.overallPct < 100;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: 16,
                marginBottom: 24,
            }}
        >
            {/* ── Production Output Today ──────────────────────────────────── */}
            <Card
                style={{ borderRadius: 12, boxShadow: token.boxShadowSecondary }}
                styles={{ body: { padding: '16px 20px' } }}
                variant="borderless"
            >
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div>
                        <Title level={5} style={{ margin: 0, color: token.colorPrimary }}>
                            Production Output Today
                        </Title>
                        <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                            Actual output vs production plan
                        </Text>
                    </div>
                    <Tag color={overallBelowPlan ? 'warning' : 'success'}>
                        {overallBelowPlan ? 'Below Plan' : 'On Track'}
                    </Tag>
                </Flex>

                <Flex vertical gap={14}>
                    {/* Zone rows */}
                    {productionData.zones.map(({ zone, actual, plan, percent }) => (
                        <div key={zone}>
                            <Flex justify="space-between" style={{ marginBottom: 4 }}>
                                <Text style={{ fontSize: 13, fontWeight: 600 }}>
                                    {zone} — {actual.toLocaleString()} / {plan.toLocaleString()} pcs
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: progressStrokeColor(percent, token),
                                    }}
                                >
                                    {percent}%
                                </Text>
                            </Flex>
                            <Progress
                                percent={percent}
                                showInfo={false}
                                status={progressStatus(percent)}
                                strokeColor={progressStrokeColor(percent, token)}
                                trailColor={token.colorBgLayout}
                                strokeLinecap="round"
                                size={['100%', 10]}
                            />
                        </div>
                    ))}

                    {/* Overall row */}
                    <div
                        style={{
                            borderTop: `1px solid ${token.colorBorderSecondary}`,
                            paddingTop: 12,
                        }}
                    >
                        <Flex justify="space-between" style={{ marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, fontWeight: 700, color: token.colorText }}>
                                Overall — {productionData.totalActual.toLocaleString()} /{' '}
                                {productionData.totalPlan.toLocaleString()} pcs
                            </Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: progressStrokeColor(productionData.overallPct, token),
                                }}
                            >
                                {productionData.overallPct}%
                            </Text>
                        </Flex>
                        <Progress
                            percent={productionData.overallPct}
                            showInfo={false}
                            status={progressStatus(productionData.overallPct)}
                            strokeColor={progressStrokeColor(productionData.overallPct, token)}
                            trailColor={token.colorBgLayout}
                            strokeLinecap="round"
                            size={['100%', 10]}
                        />
                    </div>

                    {/* Warning alert */}
                    {overallBelowPlan && productionData.deficit > 0 && (
                        <Alert
                            type="warning"
                            icon={<WarningOutlined />}
                            showIcon
                            message={
                                <Flex justify="space-between" align="center">
                                    <Text style={{ fontSize: 13, fontWeight: 600 }}>
                                        Production is {productionData.deficit.toLocaleString()} pcs below plan
                                    </Text>
                                    <Tag color="warning">
                                        -{(100 - productionData.overallPct)}%
                                    </Tag>
                                </Flex>
                            }
                            description={
                                issueMachines.length > 0 ? (
                                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                        Main impact:{' '}
                                        {issueMachines.map((m) => m.machineName).join(', ')}
                                    </Text>
                                ) : undefined
                            }
                            style={{
                                borderRadius: 8,
                                backgroundColor: '#fffbe6',
                                border: '1px solid #ffe58f',
                            }}
                        />
                    )}
                </Flex>
            </Card>

            {/* ── Latest Machine Issues ────────────────────────────────────── */}
            <Card
                style={{ borderRadius: 12, boxShadow: token.boxShadowSecondary }}
                styles={{ body: { padding: '16px 20px' } }}
                variant="borderless"
            >
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <div>
                        <Title level={5} style={{ margin: 0, color: token.colorPrimary }}>
                            Latest Machine Issues
                        </Title>
                        <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                            Error &amp; offline machines today
                        </Text>
                    </div>
                    {issueMachines.length > 0 && (
                        <Tag color="error">{issueMachines.length} Open</Tag>
                    )}
                </Flex>

                {issueMachines.length === 0 ? (
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        style={{ padding: '32px 0', color: token.colorTextTertiary }}
                        gap={8}
                    >
                        <Text style={{ fontSize: 28 }}>✓</Text>
                        <Text style={{ color: token.colorSuccess, fontWeight: 600 }}>
                            All machines running normally
                        </Text>
                    </Flex>
                ) : (
                    <Flex vertical gap={10}>
                        {issueMachines.map((machine) => {
                            const isError   = machine.currentStatus === 'ERROR';
                            const isOffline = machine.currentStatus === 'OFFLINE';
                            const cause = MOCK_ERROR_CAUSES[machine.machineId] ?? 'Unknown cause';
                            const time  = MOCK_ERROR_TIMES[machine.machineId]  ?? '--:--';

                            return (
                                <Flex
                                    key={machine.machineId}
                                    justify="space-between"
                                    align="center"
                                    gap={12}
                                    style={{
                                        padding: '10px 14px',
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: 10,
                                        background: token.colorBgContainer,
                                    }}
                                >
                                    <Flex align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
                                        {isError ? (
                                            <AlertOutlined
                                                style={{ color: token.colorError, fontSize: 16, flexShrink: 0 }}
                                            />
                                        ) : (
                                            <DisconnectOutlined
                                                style={{ color: token.colorTextDisabled, fontSize: 16, flexShrink: 0 }}
                                            />
                                        )}
                                        <div style={{ minWidth: 0 }}>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: 13,
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {machine.machineName}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: isError
                                                        ? token.colorError
                                                        : token.colorTextSecondary,
                                                }}
                                            >
                                                {cause}
                                            </Text>
                                        </div>
                                    </Flex>
                                    <Flex vertical align="flex-end" gap={4} style={{ flexShrink: 0 }}>
                                        <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
                                            {time}
                                        </Text>
                                        <Tag
                                            color={isError ? 'error' : isOffline ? 'default' : 'warning'}
                                            style={{ margin: 0 }}
                                        >
                                            {isError ? 'Error' : 'Offline'}
                                        </Tag>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                )}
            </Card>
        </div>
    );
};

export default MachineDashboardSummary;
