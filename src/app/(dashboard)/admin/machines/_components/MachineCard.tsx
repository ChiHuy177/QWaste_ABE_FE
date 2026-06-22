'use client';

import React from 'react';
import { Card, Flex, Typography, Tag, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { theme } from 'antd';
import { MachineOverview } from '@/types/Machine';

const { Text } = Typography;

interface MachineCardProps {
    machine: MachineOverview;
    onCardClick?: (machine: MachineOverview) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onCardClick }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'RUNTIME':
                return {
                    color: token.colorSuccess,
                    text: t('machineManagement.statuses.running'),
                    badge: 'success',
                };
            case 'IDLE':
                return {
                    color: token.colorWarning,
                    text: t('machineManagement.statuses.idle'),
                    badge: 'warning',
                };
            case 'ERROR':
                return {
                    color: token.colorError,
                    text: t('machineManagement.statuses.error'),
                    badge: 'error',
                };
            case 'OFFLINE':
                return {
                    color: token.colorTextDisabled,
                    text: t('machineManagement.statuses.offline'),
                    badge: 'default',
                };
            case 'COMPLETE':
                return {
                    color: token.colorSuccess,
                    text: t('machineManagement.statuses.complete'),
                    badge: 'success',
                };
            case 'TEMPORARY_STOP':
                return {
                    color: token.colorWarning,
                    text: t('machineManagement.statuses.temporaryStop'),
                    badge: 'warning',
                };
            case 'OPEN_DOOR':
                return {
                    color: token.colorInfo,
                    text: t('machineManagement.statuses.openDoor'),
                    badge: 'processing',
                };
            case 'WARNING':
                return {
                    color: '#faad14',
                    text: t('machineManagement.statuses.warning'),
                    badge: 'warning',
                };
            default:
                return {
                    color: token.colorTextDisabled,
                    text: t('machineManagement.statuses.offline'),
                    badge: 'default',
                };
        }
    };

    const currentStatus = machine.currentStatus || 'OFFLINE';
    const statusConfig = getStatusConfig(currentStatus);

    const calculateTimeBreakdown = () => {
        if (!machine.runtimeByStatus) {
            return {
                runtime: 0,
                idleTime: 0,
                errorTime: 0,
                offlineSeconds: 0,
            };
        }

        const runtimeSeconds = machine.runtimeByStatus.RUNTIME || 0;
        const idleSeconds = machine.runtimeByStatus.IDLE || 0;
        const errorSeconds = 0; // API doesn't provide ERROR status
        const offlineSeconds = machine.runtimeByStatus.OFFLINE || 0;

        const totalActiveSeconds = runtimeSeconds + idleSeconds + errorSeconds;

        if (totalActiveSeconds === 0) {
            return {
                runtime: 0,
                idleTime: 0,
                errorTime: 0,
                offlineSeconds,
            };
        }

        return {
            runtime: Math.round((runtimeSeconds / totalActiveSeconds) * 100),
            idleTime: Math.round((idleSeconds / totalActiveSeconds) * 100),
            errorTime: Math.round((errorSeconds / totalActiveSeconds) * 100),
            offlineSeconds,
        };
    };

    const timeBreakdown = calculateTimeBreakdown();

    const calculateTotalMachineTime = () => {
        if (!machine.runtimeByStatus) {
            return { hours: 0, minutes: 0, seconds: 0 };
        }

        const totalRuntimeSeconds = machine.runtimeByStatus.RUNTIME || 0;

        const hours = Math.floor(totalRuntimeSeconds / 3600);
        const minutes = Math.floor((totalRuntimeSeconds % 3600) / 60);
        const seconds = totalRuntimeSeconds % 60;

        return { hours, minutes, seconds };
    };

    const machineTime = calculateTotalMachineTime();

    const formatTime = (hours: number, minutes: number, seconds: number) => {
        return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(
            seconds
        ).padStart(2, '0')}s`;
    };

    const formatOfflineTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return formatTime(hours, minutes, seconds);
    };

    return (
        <Card
            hoverable
            variant="borderless"
            style={{
                borderRadius: 12,
                boxShadow: token.boxShadowSecondary,
                height: '100%',
            }}
            styles={{
                body: {
                    padding: 16,
                },
            }}
            onClick={() => onCardClick?.(machine)}
        >
            {/* Card Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                gap={8}
                style={{
                    marginBottom: 12,
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Tooltip title={machine.machineName} placement="topLeft">
                        <Text
                            strong
                            style={{
                                fontSize: 15,
                                color: token.colorPrimary,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'help',
                            }}
                        >
                            {machine.machineName}
                        </Text>
                    </Tooltip>
                    {machine.topic && (
                        <Text
                            style={{
                                fontSize: 12,
                                color: token.colorTextSecondary,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: 2,
                            }}
                        >
                            {machine.topic}
                        </Text>
                    )}
                </div>
                <Tag
                    color={statusConfig.color}
                    style={{
                        flexShrink: 0,
                        margin: 0,
                    }}
                >
                    <Text style={{ fontSize: 15, color: '#fff' }}>{statusConfig.text}</Text>
                </Tag>
            </Flex>

            {/* Machine Image */}
            <div
                style={{
                    width: '100%',
                    height: 120,
                    background: token.colorBgContainer,
                    borderRadius: 8,
                    marginBottom: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <img
                    src={machine.machineImage || '/images/machine-placeholder.png'}
                    alt={machine.machineName}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            </div>

            {/* Machine Info */}

            {/*
            <Space
                orientation="vertical"
                size={8}
                style={{
                    width: '100%',
                    marginBottom: 12,
                }}
            >
                <Flex
                    align="center"
                    gap={8}
                    style={{
                        marginTop: 10,
                        padding: '8px 4px',
                        background: '#8C8C8C10',
                        borderRadius: 6,
                    }}
                >
                    <UserOutlined style={{ fontSize: 14, color: token.colorPrimary }} />
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: 500,

                            color: token.colorPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {machine.operatorName || t('machineManagement.emptyStates.noOperator')}
                    </Text>
                </Flex>
                <Flex
                    align="center"
                    gap={8}
                    style={{
                        marginTop: 10,
                        padding: '8px 4px',
                        background: '#8C8C8C10',
                        borderRadius: 6,
                    }}
                >
                    <Ruler size={14} color={token.colorPrimary} />
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: token.colorPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {machine.taskName || 'Task...'}
                    </Text>
                </Flex>
            </Space>
            */}

            {/*
            <Flex
                justify="space-between"
                align="center"
                style={{
                    padding: '8px 12px',
                    background: 'rgba(82, 196, 26, 0.05)',
                    borderRadius: 6,
                    marginBottom: 12,
                    border: '1px solid rgba(82, 196, 26, 0.2)',
                }}
            >
                <Text style={{ fontSize: 12, color: token.colorPrimary, fontWeight: 500 }}>
                    {t('machineManagement.stats.production')}
                </Text>
                <Text
                    strong
                    style={{ fontSize: 16, color: token.colorPrimary, fontFamily: 'monospace' }}
                >
                    {machine.productionCounter?.toLocaleString() || '0'}
                </Text>
            </Flex>
            */}

            {/* Machine Time Section */}
            <Card
                size="small"
                style={{
                    marginBottom: 12,
                    background: token.colorFillQuaternary,
                    borderRadius: 8,
                }}
                styles={{
                    body: { padding: 12 },
                }}
                variant="borderless"
            >
                <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                    <Text
                        strong
                        style={{
                            fontSize: 12,
                            color: token.colorPrimary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        {t('machineManagement.stats.machineTime')}
                    </Text>
                    <Text
                        strong
                        style={{
                            fontSize: 14,
                            color: token.colorPrimary,
                        }}
                    >
                        {formatTime(machineTime.hours, machineTime.minutes, machineTime.seconds)}
                    </Text>
                </Flex>

                {/* Multi-color Progress Bar - Không bao gồm OFFLINE */}
                <div style={{ marginBottom: 10 }}>
                    <Flex
                        style={{
                            width: '100%',
                            height: 8,
                            background: token.colorBorderSecondary,
                            borderRadius: 4,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${timeBreakdown.runtime}%`,
                                height: '100%',
                                background: token.colorSuccess,
                                transition: 'width 0.3s ease',
                            }}
                        />
                        <div
                            style={{
                                width: `${timeBreakdown.idleTime}%`,
                                height: '100%',
                                background: token.colorWarning,
                                transition: 'width 0.3s ease',
                            }}
                        />
                        <div
                            style={{
                                width: `${timeBreakdown.errorTime}%`,
                                height: '100%',
                                background: token.colorError,
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </Flex>
                </div>

                {/* Time Legend */}
                <div>
                    {/* Active Status Grid - Runtime, Idle, Error */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                            gap: 10,
                            padding: 4,
                        }}
                    >
                        {[
                            {
                                color: token.colorSuccess,
                                label: t('machineManagement.statuses.running'),
                                value: timeBreakdown.runtime,
                            },
                            {
                                color: token.colorWarning,
                                label: t('machineManagement.statuses.idle'),
                                value: timeBreakdown.idleTime,
                            },
                            {
                                color: token.colorError,
                                label: t('machineManagement.statuses.error'),
                                value: timeBreakdown.errorTime,
                            },
                        ].map((item, index) => (
                            <Flex key={index} align="center" gap={4} justify="space-between">
                                <Flex align="center" gap={4} style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: item.color,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            color: token.colorTextSecondary,
                                            fontWeight: 500,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {item.label}
                                    </Text>
                                </Flex>
                                <Text
                                    strong
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        padding: '2px 5px',
                                        background: `${item.color}20`,
                                        color: item.color,
                                        borderRadius: 4,
                                        minWidth: '32px',
                                        textAlign: 'center',
                                    }}
                                >
                                    {item.value}%
                                </Text>
                            </Flex>
                        ))}
                    </div>

                    {/* Offline Row - Full Width */}
                    <Flex
                        align="center"
                        gap={8}
                        justify="space-between"
                        style={{
                            marginTop: 10,
                            padding: '8px 4px',
                            background: token.colorFillQuaternary,
                            borderRadius: 6,
                        }}
                    >
                        <Flex align="center" gap={6}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: token.colorTextDisabled,
                                    flexShrink: 0,
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: token.colorTextSecondary,
                                    fontWeight: 500,
                                }}
                            >
                                {t('machineManagement.statuses.offline')}
                            </Text>
                        </Flex>
                        <Text
                            strong
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                background: token.colorFillQuaternary,
                                color: token.colorTextDisabled,
                                borderRadius: 4,
                            }}
                        >
                            {formatOfflineTime(timeBreakdown.offlineSeconds)}
                        </Text>
                    </Flex>
                </div>
            </Card>

            {/* Power Consumption */}
            <Flex
                justify="space-between"
                align="center"
                style={{
                    padding: '10px 12px',
                    background: 'var(--color-power-bg)',
                    borderRadius: 8,
                    borderTop: '2px solid var(--color-power)',
                }}
            >
                <Text style={{ fontSize: 11, color: token.colorPrimary, fontWeight: 500 }}>
                    {t('machineManagement.stats.powerConsumption')}
                </Text>
                <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                    {machine.currentEnergyConsumption} kW
                </Text>
            </Flex>
        </Card>
    );
};

export default MachineCard;
