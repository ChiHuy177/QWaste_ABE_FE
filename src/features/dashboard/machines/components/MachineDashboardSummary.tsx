'use client';

import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Typography, Flex, Tooltip, theme } from 'antd';
import type { GlobalToken } from 'antd';
import {
    CheckCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    PoweroffOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { MachineOverview } from '@/types/Machine';
import { MOCK_MACHINE_PLAN } from '@/mockData/admin/factory/machineDashboard';
import { ErrorManagementService } from '@/services/ErrorManagementService';

const { Text } = Typography;

const getStatusTokens = (status: string, token: GlobalToken) => {
    switch (status) {
        case 'RUNTIME':
        case 'COMPLETE':
            return {
                base: token.colorSuccess,
                bg: token.colorSuccessBg,
                border: token.colorSuccessBorder,
            };
        case 'IDLE':
        case 'TEMPORARY_STOP':
            return {
                base: token.colorWarning,
                bg: token.colorWarningBg,
                border: token.colorWarningBorder,
            };
        case 'ERROR':
        case 'WARNING':
            return {
                base: token.colorError,
                bg: token.colorErrorBg,
                border: token.colorErrorBorder,
            };
        default:
            return {
                base: token.colorTextDisabled,
                bg: token.colorFillQuaternary,
                border: token.colorBorderSecondary,
            };
    }
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    RUNTIME: <CheckCircleOutlined />,
    IDLE: <WarningOutlined />,
    ERROR: <CloseCircleOutlined />,
    OFFLINE: <PoweroffOutlined />,
};

interface Props {
    machines: MachineOverview[];
}

const MachineDashboardSummary: React.FC<Props> = ({ machines }) => {
    const { token } = theme.useToken();
    const router = useRouter();
    const [hoveredMachineId, setHoveredMachineId] = useState<string | null>(null);

    const productionSummary = useMemo(() => {
        return machines.map((m) => {
            const plan = MOCK_MACHINE_PLAN[m.machineId]?.plan ?? null;
            const actual = m.totalProductions ?? 0;
            const pct = plan ? Math.min(Math.round((actual / plan) * 100), 100) : null;
            return { machine: m, plan, actual, pct };
        });
    }, [machines]);

    const errorMachines = useMemo(
        () => machines.filter((m) => m.currentStatus === 'ERROR' || m.currentStatus === 'WARNING'),
        [machines]
    );

    const totalActual = useMemo(
        () => machines.reduce((s, m) => s + (m.totalProductions ?? 0), 0),
        [machines]
    );

    const totalPlan = useMemo(
        () => machines.reduce((s, m) => s + (MOCK_MACHINE_PLAN[m.machineId]?.plan ?? 0), 0),
        [machines]
    );

    const overallPct =
        totalPlan > 0 ? Math.min(Math.round((totalActual / totalPlan) * 100), 100) : 0;

    return (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            {/* Production output */}
            <Col xs={24} lg={12}>
                <Card
                    title="Production Output"
                    style={{ borderRadius: 12, height: '100%' }}
                    styles={{ body: { padding: '12px 20px' } }}
                >
                    <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                        <Statistic
                            title="Total Actual"
                            value={totalActual}
                            suffix={`/ ${totalPlan} pcs`}
                            styles={{
                                content: {
                                    fontSize: 22,
                                    fontWeight: 700,
                                },
                            }}
                        />
                        <div style={{ textAlign: 'right' }}>
                            <Progress
                                type="circle"
                                percent={overallPct}
                                size={64}
                                strokeColor={
                                    overallPct >= 80
                                        ? token.colorSuccess
                                        : overallPct >= 50
                                          ? token.colorWarning
                                          : token.colorError
                                }
                            />
                        </div>
                    </Flex>

                    {productionSummary.map(({ machine, plan, actual, pct }) => (
                        <div key={machine.machineId} style={{ marginBottom: 10 }}>
                            <Flex
                                justify="space-between"
                                align="center"
                                style={{ marginBottom: 2 }}
                            >
                                <Flex gap={6} align="center">
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: getStatusTokens(
                                                machine.currentStatus ?? 'OFFLINE',
                                                token
                                            ).base,
                                        }}
                                    />
                                    <Text style={{ fontSize: 13 }}>{machine.machineName}</Text>
                                </Flex>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {actual} {plan !== null ? `/ ${plan}` : ''} pcs
                                    {pct !== null ? ` (${pct}%)` : ''}
                                </Text>
                            </Flex>
                            {pct !== null && (
                                <Progress
                                    percent={pct}
                                    size="small"
                                    showInfo={false}
                                    strokeColor={
                                        pct >= 80
                                            ? token.colorSuccess
                                            : pct >= 50
                                              ? token.colorWarning
                                              : token.colorError
                                    }
                                    style={{ marginBottom: 0 }}
                                />
                            )}
                        </div>
                    ))}
                </Card>
            </Col>

            {/* Machine issues */}
            <Col xs={24} lg={12}>
                <Card
                    title={
                        <Flex gap={8} align="center">
                            Machine Issues
                            {errorMachines.length > 0 && (
                                <Tag color="error" style={{ margin: 0 }}>
                                    {errorMachines.length} active
                                </Tag>
                            )}
                        </Flex>
                    }
                    style={{ borderRadius: 12, height: '100%' }}
                    styles={{ body: { padding: '12px 20px' } }}
                >
                    {errorMachines.length === 0 ? (
                        <Flex
                            justify="center"
                            align="center"
                            vertical
                            style={{ padding: '32px 0', color: '#52c41a' }}
                        >
                            <CheckCircleOutlined style={{ fontSize: 36, marginBottom: 8 }} />
                            <Text type="secondary">All machines operating normally</Text>
                        </Flex>
                    ) : (
                        errorMachines.map((m) => {
                            const status = m.currentStatus ?? 'OFFLINE';
                            const statusTokens = getStatusTokens(status, token);
                            const icon = STATUS_ICONS[status];
                            const runtimeMap = m.runtimeByStatus as
                                Record<string, number> | undefined;
                            const errorSec =
                                (runtimeMap?.['ERROR'] ?? 0) + (runtimeMap?.['WARNING'] ?? 0);
                            const errorHr = Math.round(errorSec / 360) / 10;
                            const isHovered = hoveredMachineId === m.machineId;

                            const activeIncident =
                                ErrorManagementService.getActiveIncidentForMachine(
                                    m.machineCode,
                                    m.machineId
                                );

                            const handleRowClick = () => {
                                const query = activeIncident
                                    ? `?incidentCode=${encodeURIComponent(activeIncident.code)}&machineCode=${encodeURIComponent(m.machineCode || '')}&from=machines`
                                    : `?machineCode=${encodeURIComponent(m.machineCode || m.machineName)}&from=machines`;
                                router.push(`/admin/error-management${query}`);
                            };

                            return (
                                <Tooltip
                                    key={m.machineId}
                                    title={
                                        activeIncident
                                            ? `Xem sự cố ${activeIncident.code} trong Quản lý sự cố`
                                            : `Xem lịch sử sự cố máy ${m.machineName} (${m.machineCode || ''})`
                                    }
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={handleRowClick}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleRowClick();
                                            }
                                        }}
                                        onMouseEnter={() => setHoveredMachineId(m.machineId)}
                                        onMouseLeave={() => setHoveredMachineId(null)}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: token.borderRadius,
                                            border: `1px solid ${isHovered ? token.colorPrimary : statusTokens.border}`,
                                            background: isHovered
                                                ? token.colorFillQuaternary
                                                : statusTokens.bg,
                                            boxShadow: isHovered ? token.boxShadowTertiary : 'none',
                                            marginBottom: 8,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease-in-out',
                                        }}
                                    >
                                        <Flex justify="space-between" align="center">
                                            <Flex gap={8} align="center">
                                                <span
                                                    style={{
                                                        color: statusTokens.base,
                                                        fontSize: 16,
                                                    }}
                                                >
                                                    {icon}
                                                </span>
                                                <div>
                                                    <Text strong style={{ fontSize: 13 }}>
                                                        {m.machineName}
                                                    </Text>
                                                    {m.machineCode && (
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 11, marginLeft: 6 }}
                                                        >
                                                            ({m.machineCode})
                                                        </Text>
                                                    )}
                                                </div>
                                            </Flex>
                                            <Flex gap={8} align="center">
                                                <Tag
                                                    color={status === 'ERROR' ? 'error' : 'warning'}
                                                    style={{ margin: 0, fontSize: 11 }}
                                                >
                                                    {status}
                                                </Tag>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {errorHr}h error
                                                </Text>
                                                <RightOutlined
                                                    style={{
                                                        fontSize: 11,
                                                        color: isHovered
                                                            ? token.colorPrimary
                                                            : token.colorTextTertiary,
                                                        transition: 'color 0.2s',
                                                    }}
                                                />
                                            </Flex>
                                        </Flex>
                                    </div>
                                </Tooltip>
                            );
                        })
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default MachineDashboardSummary;
