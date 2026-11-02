'use client';

import React from 'react';
import { Flex, Tooltip, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatVietnamDateTime, formatVietnamTimeCompact } from '@/utils/dateTimeUtils';
const { Text } = Typography;

/**
 * MachineCard is shared by two real data shapes with incompatible
 * `runtimeByStatus` representations: the factory/zone/line overview grid
 * (`MachineInFactoryOverview`, `runtimeByStatus` as a `Map`) and the flat
 * machine grid (`MachineWithStatusLogsSummary`, `runtimeByStatus` as a plain
 * object). Kept generic so each caller's own concrete type flows through
 * untouched instead of being widened to `any`.
 */
export interface MachineCardData {
    machineId: string;
    machineName: string;
    topic?: string;
    currentStatus: string;
    /** Backend `LocalDateTime` for when `currentStatus` began; absent on the overview grid shape. */
    currentStatusStartTime?: string | null;
    operatorCount?: number;
    totalProductions: number;
    runtimeByStatus?: Map<string, number> | Record<string, number | undefined>;
}

interface MachineCardProps<T extends MachineCardData> {
    machine: T;
    onClick: (machine: T, e: React.MouseEvent) => void;
}

function MachineCardComponent<T extends MachineCardData>({ machine, onClick }: MachineCardProps<T>) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RUNTIME':
                return {
                    background: token.colorSuccess,
                    hoverBackground:
                        token.colorSuccessHover /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorSuccessBorder}`,
                };
            case 'IDLE':
                return {
                    background: token.colorWarning,
                    hoverBackground:
                        token.colorWarningHover /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorWarningBorder}`,
                };
            case 'ERROR':
                return {
                    background: token.colorError,
                    hoverBackground:
                        token.colorErrorHover /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorErrorBorder}`,
                };
            case 'OFFLINE':
                return {
                    background: token.colorTextDisabled,
                    hoverBackground: token.colorTextSecondary,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorBorder}`,
                };
            case 'COMPLETE':
                return {
                    background: token.colorSuccess,
                    hoverBackground:
                        token.colorSuccessHover /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorSuccessBorder}`,
                };
            case 'TEMPORARY_STOP':
                return {
                    background: token.colorWarning,
                    hoverBackground:
                        token.colorWarningHover /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorWarningBorder}`,
                };
            case 'OPEN_DOOR':
                return {
                    background: token.colorInfo,
                    hoverBackground:
                        token.colorInfoHover /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px ${token.colorInfoBorder}`,
                };
            case 'WARNING':
                return {
                    background: '#faad14',
                    hoverBackground:
                        '#ffc53d' /* hover color feedback - replaces removed scale effect */,
                    color: token.colorTextLightSolid,
                    shadow: `0 4px 12px #ffe58f`,
                };
            default:
                return {
                    background: token.colorBgContainerDisabled,
                    hoverBackground: token.colorFill,
                    color: token.colorTextDescription,
                    shadow: `0 4px 12px ${token.colorBorder}`,
                };
        }
    };

    const calculateRuntimeByStatus = (
        runtimeByStatus: MachineCardData['runtimeByStatus'],
        status: string
    ): number => {
        if (!runtimeByStatus) return 0;

        if (runtimeByStatus instanceof Map) {
            return runtimeByStatus.get(status) || 0;
        }
        return (runtimeByStatus as Record<string, number | undefined>)[status] || 0;
    };

    const calculateOnlineTime = (
        runtimeByStatus: MachineCardData['runtimeByStatus']
    ): number => {
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

    const lastUpdate = formatVietnamTimeCompact(machine.currentStatusStartTime);
    const lastUpdateFull = formatVietnamDateTime(machine.currentStatusStartTime);

    return (
        <div
            onClick={(e) => onClick(machine, e)}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = statusStyle.hoverBackground;
            }} /* hover color feedback - replaces removed scale effect */
            onMouseLeave={(e) => {
                e.currentTarget.style.background = statusStyle.background;
            }} /* hover color feedback - replaces removed scale effect */
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
                transition:
                    'background-color 0.15s' /* hover color feedback - replaces removed scale effect */,
                boxShadow: statusStyle.shadow,
                position: 'relative',
                overflow: 'hidden',
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

                {/* Last update - when the current status started (Vietnam time, GMT+7) */}
                <Tooltip title={lastUpdateFull ? `${lastUpdateFull} (GMT+7)` : undefined}>
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
                            {t('factoryOverview.machine.lastUpdate', 'Last update')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 11,
                                color: statusStyle.color,
                                fontWeight: 600,
                            }}
                        >
                            {lastUpdate ?? '-'}
                        </Text>
                    </Flex>
                </Tooltip>

                {/* Operators */}
                {/* <Flex
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
                </Flex> */}

                {/* Production */}
                {/* <Flex
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
                </Flex> */}
            </Flex>
        </div>
    );
};

const MachineCard = React.memo(MachineCardComponent) as typeof MachineCardComponent;

export default MachineCard;
