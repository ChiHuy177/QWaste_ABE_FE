'use client';

import React from 'react';
import { Flex, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { MachineWithStatusLogsSummary } from '@/types/Machine';

const { Text } = Typography;

interface MachineCardProps {
    machine: MachineWithStatusLogsSummary;
    onClick: (machine: MachineWithStatusLogsSummary, e: React.MouseEvent) => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RUNTIME':
                return {
                    background: token.colorSuccess,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorSuccessBorder}`,
                };
            case 'IDLE':
                return {
                    background: token.colorWarning,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorWarningBorder}`,
                };
            case 'ERROR':
                return {
                    background: token.colorError,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorErrorBorder}`,
                };
            case 'OFFLINE':
                return {
                    background: token.colorTextDisabled,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorBorder}`,
                };
            case 'COMPLETE':
                return {
                    background: token.colorSuccess,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorSuccessBorder}`,
                };
            case 'TEMPORARY_STOP':
                return {
                    background: token.colorWarning,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorWarningBorder}`,
                };
            case 'OPEN_DOOR':
                return {
                    background: token.colorInfo,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorInfoBorder}`,
                };
            case 'WARNING':
                return {
                    background: '#faad14',
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px #ffe58f`,
                };
            default:
                return {
                    background: token.colorBgContainerDisabled,
                    color: token.colorTextDescription,
                    shadow: `0 4px 12px ${token.colorBorder}`,
                };
        }
    };

    const calculateRuntimeByStatus = (runtimeByStatus: any, status: string): number => {
        if (!runtimeByStatus) return 0;

        if (runtimeByStatus instanceof Map) {
            return runtimeByStatus.get(status) || 0;
        }
        return runtimeByStatus[status] || 0;
    };

    const calculateOnlineTime = (runtimeByStatus: any): number => {
        if (!runtimeByStatus) return 0;

        let totalSeconds = 0;
        const statusMap =
            runtimeByStatus instanceof Map
                ? runtimeByStatus
                : new Map(Object.entries(runtimeByStatus));

        for (const [status, timeInSeconds] of statusMap) {
            if (status !== 'OFFLINE') {
                totalSeconds += timeInSeconds as number;
            }
        }

        return totalSeconds;
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    };

    const statusStyle = getStatusColor(machine.currentStatus);

    const onlineSeconds = calculateOnlineTime(machine.runtimeByStatus);
    const onlineTime = formatTime(onlineSeconds);

    const offlineSeconds = calculateRuntimeByStatus(machine.runtimeByStatus, 'OFFLINE');
    const offlineTime = formatTime(offlineSeconds);

    const operatorCount = machine.operatorCount || 0;

    return (
        <div
            onClick={(e) => onClick(machine, e)}
            style={{
                height: '100%',
                background: statusStyle.background,
                color: statusStyle.color,
                borderRadius: 12,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                minHeight: 165,
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
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 40,
                    height: 40,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderBottomLeftRadius: '100%',
                }}
            />

            {/* Machine Info */}
            <Flex vertical gap={2} align="center" style={{ width: '100%' }}>
                <Text
                    strong
                    style={{
                        fontSize: 16,
                        color: statusStyle.color,
                        textAlign: 'center',
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                        lineHeight: 1.2,
                        fontWeight: 700,
                    }}
                >
                    {machine.topic || 'No Topic'}
                </Text>

                <Text
                    strong
                    style={{
                        fontSize: 13,
                        color: statusStyle.color,
                        textAlign: 'center',
                        letterSpacing: '0.3px',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        lineHeight: 1.2,
                        opacity: 0.9,
                    }}
                >
                    {machine.machineName || 'Machine Name'}
                </Text>

                <Text
                    style={{
                        fontSize: 11,
                        color: statusStyle.color,
                        textAlign: 'center',
                        opacity: 0.75,
                        lineHeight: 1.2,
                    }}
                >
                    {machine.machineCode}
                </Text>
            </Flex>

            {/* Divider */}
            <div
                style={{
                    width: '100%',
                    height: 1,
                    background: 'rgba(255, 255, 255, 0.2)',
                    margin: '4px 0',
                }}
            />

            {/* Machine Stats */}
            <Flex vertical gap={3} style={{ width: '100%' }}>
                {/* Online Time */}
                <Flex
                    align="center"
                    justify="space-between"
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 10,
                            color: statusStyle.color,
                            fontWeight: 500,
                        }}
                    >
                        {t('factoryOverview.machine.online', 'Online')}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: statusStyle.color,
                            fontWeight: 600,
                        }}
                    >
                        {onlineTime}
                    </Text>
                </Flex>

                {/* Offline Time */}
                <Flex
                    align="center"
                    justify="space-between"
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 10,
                            color: statusStyle.color,
                            fontWeight: 500,
                        }}
                    >
                        {t('factoryOverview.machine.offline', 'Offline')}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: statusStyle.color,
                            fontWeight: 600,
                        }}
                    >
                        {offlineTime}
                    </Text>
                </Flex>

                {/* Operators */}
                <Flex
                    align="center"
                    justify="space-between"
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 10,
                            color: statusStyle.color,
                            fontWeight: 500,
                        }}
                    >
                        {t('factoryOverview.machine.operators', 'Operators')}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: statusStyle.color,
                            fontWeight: 600,
                        }}
                    >
                        {operatorCount}
                    </Text>
                </Flex>

                {/* Production */}
                <Flex
                    align="center"
                    justify="space-between"
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 10,
                            color: statusStyle.color,
                            fontWeight: 500,
                        }}
                    >
                        {t('factoryOverview.machine.production', 'Production')}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: statusStyle.color,
                            fontWeight: 600,
                        }}
                    >
                        {machine.totalProductions || 0}
                    </Text>
                </Flex>
            </Flex>
        </div>
    );
};

export default React.memo(MachineCard);
