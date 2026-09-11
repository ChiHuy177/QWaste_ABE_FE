'use client';

import React, { useMemo } from 'react';
import { Flex, Typography, theme } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachineOverview } from '@/types/Machine';

const { Text } = Typography;

interface MachineCardProps {
    machine: MachineOverview;
    onCardClick?: (machine: MachineOverview) => void;
}

/** Deterministic bar heights from machineId so they look consistent across re-renders */
const generateBarHeights = (seed: string, count: number): number[] => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    }
    return Array.from({ length: count }, () => {
        h = (Math.imul(1664525, h) + 1013904223) | 0;
        return 12 + Math.abs(h % 72); // 12–84 % of container height
    });
};

const fmtSec = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
};

const MachineCard: React.FC<MachineCardProps> = ({ machine, onCardClick }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const currentStatus = machine.currentStatus ?? 'OFFLINE';

    const statusStyle = useMemo(() => {
        switch (currentStatus) {
            case 'RUNTIME':
            case 'COMPLETE':
                return {
                    label: t('machineManagement.statuses.running'),
                    badgeBg: token.colorSuccessBg,
                    badgeColor: token.colorSuccess,
                    barColor: token.colorSuccess,
                    chartBarColor: `${token.colorSuccess}33`,
                };
            case 'IDLE':
            case 'TEMPORARY_STOP':
                return {
                    label: t('machineManagement.statuses.idle'),
                    badgeBg: token.colorWarningBg,
                    badgeColor: token.colorWarning,
                    barColor: token.colorWarning,
                    chartBarColor: `${token.colorWarning}33`,
                };
            case 'ERROR':
            case 'WARNING':
                return {
                    label: t('machineManagement.statuses.error'),
                    badgeBg: token.colorErrorBg,
                    badgeColor: token.colorError,
                    barColor: token.colorError,
                    chartBarColor: `${token.colorError}26`,
                };
            default:
                return {
                    label: t('machineManagement.statuses.offline'),
                    badgeBg: token.colorFillSecondary,
                    badgeColor: token.colorTextDisabled,
                    barColor: token.colorTextDisabled,
                    chartBarColor: token.colorFillSecondary,
                };
        }
    }, [currentStatus, token, t]);

    const barHeights = useMemo(
        () => generateBarHeights(machine.machineId, 10),
        [machine.machineId]
    );

    const runtimeMap = (machine.runtimeByStatus ?? {}) as Record<string, number>;
    const runtimeSec = runtimeMap['RUNTIME'] ?? 0;
    const idleSec = runtimeMap['IDLE'] ?? 0;
    const errorSec = (runtimeMap['ERROR'] ?? 0) + (runtimeMap['WARNING'] ?? 0);
    const offlineSec = runtimeMap['OFFLINE'] ?? 0;
    const activeSec = runtimeSec + idleSec + errorSec;
    const totalSec = activeSec + offlineSec;

    const pct = (sec: number) =>
        totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0;

    const runtimePct = pct(runtimeSec);
    const idlePct = pct(idleSec);
    const errorPct = pct(errorSec);

    return (
        <div
            onClick={() => onCardClick?.(machine)}
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
                border: `1px solid ${token.colorBorderSecondary}`,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = token.boxShadow;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = token.boxShadowSecondary;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
        >
            <div style={{ padding: '16px 16px 0' }}>
                {/* Header */}
                <Flex justify="space-between" align="flex-start" gap={8} style={{ marginBottom: 4 }}>
                    <Text
                        strong
                        style={{
                            fontSize: 15,
                            color: token.colorText,
                            lineHeight: 1.3,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {machine.machineName}
                    </Text>
                    <div
                        style={{
                            padding: '2px 10px',
                            borderRadius: 20,
                            background: statusStyle.badgeBg,
                            flexShrink: 0,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: statusStyle.badgeColor,
                            }}
                        >
                            {statusStyle.label}
                        </Text>
                    </div>
                </Flex>

                {/* Subtitle */}
                <Text
                    type="secondary"
                    style={{
                        fontSize: 12,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 12,
                    }}
                >
                    {machine.topic ?? machine.machineCode ?? ''}
                </Text>

                {/* Mini bar chart */}
                <div
                    style={{
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadius,
                        padding: '10px 10px 6px',
                        marginBottom: 14,
                        position: 'relative',
                    }}
                >
                    <Flex align="flex-end" gap={3} style={{ height: 56 }}>
                        {barHeights.map((h, i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    height: `${h}%`,
                                    background: statusStyle.chartBarColor,
                                    borderRadius: '3px 3px 0 0',
                                    transition: 'height 0.4s ease',
                                }}
                            />
                        ))}
                    </Flex>
                    {machine.machineCode && (
                        <Text
                            style={{
                                fontSize: 10,
                                color: token.colorTextQuaternary,
                                display: 'block',
                                marginTop: 4,
                            }}
                        >
                            {machine.machineCode}
                        </Text>
                    )}
                </div>

                {/* Machine time label row */}
                <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                    <Text
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: token.colorPrimary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}
                    >
                        Machine Time
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: token.colorPrimary }}>
                        {fmtSec(runtimeSec)}
                    </Text>
                </Flex>

                {/* Multi-color progress bar */}
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: 8,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: token.colorFillSecondary,
                        marginBottom: 8,
                    }}
                >
                    {runtimePct > 0 && (
                        <div style={{ width: `${runtimePct}%`, background: token.colorSuccess }} />
                    )}
                    {idlePct > 0 && (
                        <div style={{ width: `${idlePct}%`, background: token.colorWarning }} />
                    )}
                    {errorPct > 0 && (
                        <div style={{ width: `${errorPct}%`, background: token.colorError }} />
                    )}
                </div>

                {/* Legend — Running / Idle / Error */}
                <Flex gap={10} style={{ marginBottom: 8 }} wrap="wrap">
                    {[
                        { color: token.colorSuccess, label: t('machineManagement.statuses.running'), value: runtimePct },
                        { color: token.colorWarning, label: t('machineManagement.statuses.idle'), value: idlePct },
                        { color: token.colorError, label: t('machineManagement.statuses.error'), value: errorPct },
                    ].map((item) => (
                        <Flex key={item.label} align="center" gap={4}>
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: item.color,
                                    flexShrink: 0,
                                }}
                            />
                            <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                                {item.label}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: item.color,
                                    padding: '0 4px',
                                    background: `${item.color}18`,
                                    borderRadius: 3,
                                }}
                            >
                                {item.value}%
                            </Text>
                        </Flex>
                    ))}
                </Flex>

                {/* Offline row */}
                <Flex
                    justify="space-between"
                    align="center"
                    style={{
                        padding: '6px 8px',
                        background: token.colorFillQuaternary,
                        borderRadius: token.borderRadiusSM,
                        marginBottom: 14,
                    }}
                >
                    <Flex align="center" gap={6}>
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: token.colorTextDisabled,
                            }}
                        />
                        <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                            {t('machineManagement.statuses.offline')}
                        </Text>
                    </Flex>
                    <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextTertiary }}>
                        {fmtSec(offlineSec)}
                    </Text>
                </Flex>
            </div>

            {/* Power consumption footer */}
            <div
                style={{
                    marginTop: 'auto',
                    padding: '10px 16px',
                    borderTop: `2px solid ${token.colorPrimaryBg}`,
                    background: token.colorBgContainer,
                }}
            >
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={6}>
                        <ThunderboltOutlined style={{ fontSize: 13, color: token.colorPrimary }} />
                        <Text style={{ fontSize: 12, color: token.colorPrimary }}>
                            Power Consumption
                        </Text>
                    </Flex>
                    <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                        {machine.currentEnergyConsumption ?? 0} kW
                    </Text>
                </Flex>
            </div>
        </div>
    );
};

export default MachineCard;
