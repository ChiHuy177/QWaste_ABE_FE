'use client';

import React from 'react';
import { Flex, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { MachineOverview } from '@/types/Machine';

const { Text } = Typography;

interface MachineCardProps {
    machine: MachineOverview;
    onCardClick?: (machine: MachineOverview) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onCardClick }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RUNTIME':
                return {
                    background: token.colorSuccess,
                    shadow: `0 4px 12px ${token.colorSuccessBorder}`,
                };
            case 'IDLE':
            case 'TEMPORARY_STOP':
                return {
                    background: token.colorWarning,
                    shadow: `0 4px 12px ${token.colorWarningBorder}`,
                };
            case 'ERROR':
            case 'WARNING':
                return {
                    background: token.colorError,
                    shadow: `0 4px 12px ${token.colorErrorBorder}`,
                };
            case 'OPEN_DOOR':
                return {
                    background: token.colorInfo,
                    shadow: `0 4px 12px ${token.colorInfoBorder}`,
                };
            case 'COMPLETE':
                return {
                    background: token.colorSuccess,
                    shadow: `0 4px 12px ${token.colorSuccessBorder}`,
                };
            default:
                return {
                    background: token.colorTextDisabled,
                    shadow: `0 4px 12px ${token.colorBorder}`,
                };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'RUNTIME': return t('machineManagement.statuses.running');
            case 'IDLE': return t('machineManagement.statuses.idle');
            case 'ERROR': return t('machineManagement.statuses.error');
            case 'OFFLINE': return t('machineManagement.statuses.offline');
            case 'COMPLETE': return t('machineManagement.statuses.complete');
            case 'TEMPORARY_STOP': return t('machineManagement.statuses.temporaryStop');
            case 'OPEN_DOOR': return t('machineManagement.statuses.openDoor');
            case 'WARNING': return t('machineManagement.statuses.warning');
            default: return t('machineManagement.statuses.offline');
        }
    };

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const getRuntimeByStatus = (status: string): number => {
        if (!machine.runtimeByStatus) return 0;
        return (machine.runtimeByStatus as Record<string, number>)[status] || 0;
    };

    const onlineSeconds = Object.entries(machine.runtimeByStatus ?? {}).reduce(
        (sum, [status, val]) => (status !== 'OFFLINE' ? sum + (val as number) : sum),
        0
    );
    const offlineSeconds = getRuntimeByStatus('OFFLINE');

    const currentStatus = machine.currentStatus || 'OFFLINE';
    const statusStyle = getStatusStyle(currentStatus);
    const textColor = token.colorTextLightSolid;

    const statRow = (label: string, value: string | number, bg?: string) => (
        <Flex
            align="center"
            justify="space-between"
            style={{
                background: bg ?? 'rgba(255, 255, 255, 0.18)',
                padding: '4px 8px',
                borderRadius: 6,
                backdropFilter: 'blur(10px)',
            }}
        >
            <Text style={{ fontSize: 10, color: textColor, fontWeight: 500 }}>{label}</Text>
            <Text style={{ fontSize: 11, color: textColor, fontWeight: 700 }}>{value}</Text>
        </Flex>
    );

    return (
        <div
            onClick={() => onCardClick?.(machine)}
            style={{
                height: '100%',
                background: statusStyle.background,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: statusStyle.shadow,
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = token.boxShadow;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = statusStyle.shadow;
            }}
        >
            {/* Decorative corner accent */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 44,
                    height: 44,
                    background: 'rgba(255, 255, 255, 0.12)',
                    borderBottomLeftRadius: '100%',
                    zIndex: 1,
                }}
            />

            {/* Machine image */}
            {/* <div
                style={{
                    width: '100%',
                    height: 160,
                    background: 'rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                }}
            >
                <img
                    src={machine.machineImage || '/images/machine-placeholder.png'}
                    alt={machine.machineCode}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />

                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                        padding: '20px 10px 8px',
                        zIndex: 2,
                    }}
                >
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                            color: '#fff',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                        }}
                    >
                        {machine.machineName}
                    </Text>
                </div>
            </div> */}

            {/* Card body */}
            <Flex
                vertical
                gap={6}
                style={{
                    padding: '12px 12px 14px',
                    flex: 1,
                }}
            >
                {/* Status badge + machine name */}
                <Flex justify="space-between" align="flex-start" gap={8}>
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 14,
                                color: textColor,
                                lineHeight: 1.2,
                                fontWeight: 700,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }}
                        >
                            {machine.machineName}
                        </Text>
                        <Text
                            style={{
                                fontSize: 11,
                                color: textColor,
                                opacity: 0.8,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {machine.machineCode}
                        </Text>
                    </Flex>
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.22)',
                            borderRadius: 6,
                            padding: '2px 8px',
                            flexShrink: 0,
                        }}
                    >
                        <Text style={{ fontSize: 10, color: textColor, fontWeight: 700 }}>
                            {getStatusLabel(currentStatus)}
                        </Text>
                    </div>
                </Flex>

                {/* Topic */}
                {machine.topic && (
                    <Text
                        style={{
                            fontSize: 10,
                            color: textColor,
                            opacity: 0.7,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {machine.topic}
                    </Text>
                )}

                {/* Divider */}
                <div
                    style={{
                        width: '100%',
                        height: 1,
                        background: 'rgba(255,255,255,0.2)',
                        margin: '2px 0',
                    }}
                />

                {/* Stats */}
                <Flex vertical gap={4}>
                    {statRow(t('factoryOverview.machine.online', 'Online'), formatTime(onlineSeconds))}
                    {statRow(t('factoryOverview.machine.offline', 'Offline'), formatTime(offlineSeconds))}
                    {statRow(t('factoryOverview.machine.operators', 'Operators'), machine.operatorCount ?? 0)}
                    {statRow(t('factoryOverview.machine.production', 'Production'), machine.totalProductions ?? 0)}
                </Flex>
            </Flex>
        </div>
    );
};

export default MachineCard;
