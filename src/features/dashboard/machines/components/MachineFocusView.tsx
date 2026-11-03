'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Flex, Typography, Tag, theme, Row, Col, Button } from 'antd';
import {
    ThunderboltOutlined,
    TeamOutlined,
    AimOutlined,
    RadarChartOutlined,
} from '@ant-design/icons';
import { MachineOverview } from '@/types/Machine';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const fmtTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
};

interface Props {
    machines: MachineOverview[];
    onCardClick?: (machine: MachineOverview) => void;
    highlightMachineCode?: string | null;
}

const MachineFocusView: React.FC<Props> = ({ machines, onCardClick, highlightMachineCode }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<string>(machines[0]?.machineId ?? '');

    useEffect(() => {
        if (highlightMachineCode && machines.length > 0) {
            const found = machines.find(
                (m) =>
                    m.machineCode?.toLowerCase() === highlightMachineCode.toLowerCase() ||
                    m.machineId.toLowerCase() === highlightMachineCode.toLowerCase()
            );
            if (found) {
                setSelectedId(found.machineId);
            }
        }
    }, [highlightMachineCode, machines]);

    const selected = useMemo(
        () => machines.find((m) => m.machineId === selectedId) ?? machines[0] ?? null,
        [machines, selectedId]
    );

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'RUNTIME':
            case 'COMPLETE':
                return token.colorSuccess;
            case 'IDLE':
            case 'TEMPORARY_STOP':
                return token.colorWarning;
            case 'ERROR':
            case 'WARNING':
                return token.colorError;
            default:
                return token.colorTextDisabled;
        }
    };

    const getStatusTagColor = (status: string) => {
        switch (status) {
            case 'RUNTIME':
            case 'COMPLETE':
                return 'success';
            case 'IDLE':
            case 'TEMPORARY_STOP':
                return 'warning';
            case 'ERROR':
            case 'WARNING':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'RUNTIME':
                return t('machineManagement.statuses.running');
            case 'IDLE':
                return t('machineManagement.statuses.idle');
            case 'ERROR':
                return t('machineManagement.statuses.error');
            case 'OFFLINE':
                return t('machineManagement.statuses.offline');
            case 'COMPLETE':
                return t('machineManagement.statuses.complete');
            case 'TEMPORARY_STOP':
                return t('machineManagement.statuses.temporaryStop');
            case 'WARNING':
                return t('machineManagement.statuses.warning');
            default:
                return t('machineManagement.statuses.offline');
        }
    };

    if (!selected) return null;

    const runtimeMap = (selected.runtimeByStatus ?? {}) as Record<string, number>;
    const runtimeSec = runtimeMap['RUNTIME'] ?? 0;
    const idleSec = runtimeMap['IDLE'] ?? 0;
    const errorSec = (runtimeMap['ERROR'] ?? 0) + (runtimeMap['WARNING'] ?? 0);
    const offlineSec = runtimeMap['OFFLINE'] ?? 0;
    const totalSec = runtimeSec + idleSec + errorSec + offlineSec;
    const activeSec = runtimeSec + idleSec + errorSec;

    const pct = (sec: number) => (totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0);

    const runtimePct = pct(runtimeSec);
    const idlePct = pct(idleSec);
    const errorPct = pct(errorSec);
    const offlinePct = pct(offlineSec);

    const currentStatus = selected.currentStatus ?? 'OFFLINE';

    return (
        <Flex
            style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                overflow: 'hidden',
                marginTop: 16,
                minHeight: 480,
                background: token.colorBgContainer,
            }}
        >
            {/* ── Sidebar ── */}
            <div
                style={{
                    width: 260,
                    borderRight: `1px solid ${token.colorBorder}`,
                    overflowY: 'auto',
                    flexShrink: 0,
                }}
            >
                {machines.map((m) => {
                    const isSelected = m.machineId === selected.machineId;
                    const dotColor = getStatusDotColor(m.currentStatus ?? 'OFFLINE');
                    return (
                        <Flex
                            key={m.machineId}
                            align="center"
                            justify="space-between"
                            gap={8}
                            onClick={() => setSelectedId(m.machineId)}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderLeft: isSelected
                                    ? `3px solid ${token.colorPrimary}`
                                    : '3px solid transparent',
                                background: isSelected ? token.colorPrimaryBg : 'transparent',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected)
                                    (e.currentTarget as HTMLDivElement).style.background =
                                        token.colorFillQuaternary;
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected)
                                    (e.currentTarget as HTMLDivElement).style.background =
                                        'transparent';
                            }}
                        >
                            <Flex gap={10} align="center" style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: dotColor,
                                        flexShrink: 0,
                                    }}
                                />
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
                                        {m.machineName}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {m.machineCode ?? m.topic ?? m.machineId}
                                    </Text>
                                </div>
                            </Flex>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: token.colorPrimary,
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {m.currentEnergyConsumption ?? 0} kW
                            </Text>
                        </Flex>
                    );
                })}
            </div>

            {/* ── Detail panel ── */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
                {/* Header */}
                <Flex justify="space-between" align="flex-start" style={{ marginBottom: 16 }}>
                    <div>
                        <Flex gap={10} align="center" style={{ marginBottom: 4 }}>
                            <Title level={4} style={{ margin: 0 }}>
                                {selected.machineName}
                            </Title>
                            <Tag
                                color={getStatusTagColor(currentStatus)}
                                style={{ margin: 0, fontWeight: 600 }}
                            >
                                {getStatusLabel(currentStatus)}
                            </Tag>
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {selected.machineCode}
                            {selected.topic ? ` · ${selected.topic}` : ''}
                        </Text>
                    </div>
                    <Button
                        icon={<RadarChartOutlined />}
                        onClick={() => onCardClick?.(selected)}
                        style={{ borderRadius: token.borderRadius }}
                    >
                        Live Data
                    </Button>
                </Flex>

                {/* 4 metric cards */}
                <Row gutter={[12, 12]}>
                    <Col xs={12} sm={6}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                background: token.colorSuccessBg,
                                border: `1px solid ${token.colorSuccessBorder}`,
                                height: '100%',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: token.colorSuccess,
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Runtime
                            </Text>
                            <div
                                style={{
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: token.colorSuccess,
                                    lineHeight: 1.1,
                                }}
                            >
                                {runtimePct}%
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {fmtTime(runtimeSec)}
                            </Text>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                background: token.colorWarningBg,
                                border: `1px solid ${token.colorWarningBorder}`,
                                height: '100%',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: token.colorWarning,
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Idle
                            </Text>
                            <div
                                style={{
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: token.colorWarning,
                                    lineHeight: 1.1,
                                }}
                            >
                                {idlePct}%
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {fmtTime(idleSec)}
                            </Text>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                background: token.colorErrorBg,
                                border: `1px solid ${token.colorErrorBorder}`,
                                height: '100%',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: token.colorError,
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Error
                            </Text>
                            <div
                                style={{
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: token.colorError,
                                    lineHeight: 1.1,
                                }}
                            >
                                {errorPct}%
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {fmtTime(errorSec)}
                            </Text>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                background: token.colorInfoBg,
                                border: `1px solid ${token.colorInfoBorder}`,
                                height: '100%',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: token.colorInfo,
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Energy
                            </Text>
                            <div
                                style={{
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: token.colorInfo,
                                    lineHeight: 1.1,
                                }}
                            >
                                {selected.currentEnergyConsumption ?? 0}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                kW · rated {selected.power ?? 0} kW
                            </Text>
                        </div>
                    </Col>
                </Row>

                {/* Time distribution */}
                <div style={{ marginTop: 20 }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 13 }}>
                            Time Distribution
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Active: {fmtTime(activeSec)}
                        </Text>
                    </Flex>

                    {/* Segmented bar */}
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: 20,
                            borderRadius: token.borderRadius,
                            overflow: 'hidden',
                            background: token.colorFillQuaternary,
                        }}
                    >
                        {runtimePct > 0 && (
                            <div
                                style={{
                                    width: `${runtimePct}%`,
                                    background: token.colorSuccess,
                                    transition: 'width 0.4s ease',
                                }}
                            />
                        )}
                        {idlePct > 0 && (
                            <div
                                style={{
                                    width: `${idlePct}%`,
                                    background: token.colorWarning,
                                    transition: 'width 0.4s ease',
                                    marginLeft: runtimePct > 0 ? 2 : 0,
                                }}
                            />
                        )}
                        {errorPct > 0 && (
                            <div
                                style={{
                                    width: `${errorPct}%`,
                                    background: token.colorError,
                                    transition: 'width 0.4s ease',
                                    marginLeft: runtimePct > 0 || idlePct > 0 ? 2 : 0,
                                }}
                            />
                        )}
                        {offlinePct > 0 && (
                            <div
                                style={{
                                    width: `${offlinePct}%`,
                                    background: token.colorTextDisabled,
                                    transition: 'width 0.4s ease',
                                    marginLeft: activeSec > 0 ? 2 : 0,
                                }}
                            />
                        )}
                    </div>

                    {/* Legend */}
                    <Flex gap={16} style={{ marginTop: 8 }} wrap="wrap">
                        {[
                            { color: token.colorSuccess, label: `Running ${fmtTime(runtimeSec)}` },
                            { color: token.colorWarning, label: `Idle ${fmtTime(idleSec)}` },
                            { color: token.colorError, label: `Error ${fmtTime(errorSec)}` },
                            {
                                color: token.colorTextDisabled,
                                label: `Offline ${fmtTime(offlineSec)}`,
                            },
                        ].map((item, i) => (
                            <Flex key={i} gap={6} align="center">
                                <div
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 2,
                                        background: item.color,
                                        flexShrink: 0,
                                    }}
                                />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {item.label}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                </div>

                {/* Bottom stats */}
                <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
                    <Col xs={24} sm={8}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                        >
                            <Flex gap={8} align="center" style={{ marginBottom: 6 }}>
                                <TeamOutlined style={{ color: token.colorTextSecondary }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Operators
                                </Text>
                            </Flex>
                            <div
                                style={{
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: token.colorText,
                                    lineHeight: 1,
                                }}
                            >
                                {selected.operatorCount ?? 0}
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                        >
                            <Flex gap={8} align="center" style={{ marginBottom: 6 }}>
                                <AimOutlined style={{ color: token.colorTextSecondary }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Productions
                                </Text>
                            </Flex>
                            <div
                                style={{
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: token.colorText,
                                    lineHeight: 1,
                                }}
                            >
                                {selected.totalProductions ?? 0}
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div
                            style={{
                                padding: '14px 16px',
                                borderRadius: token.borderRadius,
                                border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                        >
                            <Flex gap={8} align="center" style={{ marginBottom: 6 }}>
                                <ThunderboltOutlined style={{ color: token.colorPrimary }} />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Power Rating
                                </Text>
                            </Flex>
                            <Flex align="baseline" gap={4}>
                                <span
                                    style={{
                                        fontSize: 30,
                                        fontWeight: 700,
                                        color: token.colorPrimary,
                                        lineHeight: 1,
                                    }}
                                >
                                    {selected.power ?? 0}
                                </span>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    kW
                                </Text>
                            </Flex>
                        </div>
                    </Col>
                </Row>
            </div>
        </Flex>
    );
};

export default MachineFocusView;
