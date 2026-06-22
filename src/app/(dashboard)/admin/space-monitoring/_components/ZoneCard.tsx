'use client';

import React, { useState, useCallback } from 'react';
import { Card, Typography, Flex, theme } from 'antd';
import {
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
    DownOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import LineSection from './LineSection';

const { Title, Text } = Typography;

interface ZoneCardProps {
    zone: {
        zoneId: number;
        zoneName: string;
        zoneCode: string;
        lines: any[];
    };
    isExpanded: boolean;
    onToggle: () => void;
    onLineClick: (zoneId: number, lineId: number) => void;
    onMachineClick: (machine: any, e: React.MouseEvent) => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({
    zone,
    isExpanded,
    onToggle,
    onLineClick,
    onMachineClick,
}) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

    const calculateRuntimeByStatus = (runtimeByStatus: any, status: string): number => {
        if (!runtimeByStatus) return 0;

        if (runtimeByStatus instanceof Map) {
            return runtimeByStatus.get(status) || 0;
        }
        return runtimeByStatus[status] || 0;
    };

    const getTotalMachinesInZone = (lines: any[]): number => {
        return lines.reduce((total, line) => total + line.machines.length, 0);
    };

    const calculateZoneRuntimeByStatus = (lines: any[], status: string): string => {
        let totalSeconds = 0;
        lines.forEach((line) => {
            line.machines.forEach((machine: any) => {
                totalSeconds += calculateRuntimeByStatus(machine.runtimeByStatus, status);
            });
        });

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    };

    const calculateZoneStats = (lines: any[]) => {
        let totalCalculatedEnergy = 0;
        let totalMeasuredEnergy = 0;
        let totalOperatorCount = 0;

        lines.forEach((line) => {
            line.machines.forEach((machine: any) => {
                const machineRuntime = calculateRuntimeByStatus(machine.runtimeByStatus, 'RUNTIME');
                const machineIdle = calculateRuntimeByStatus(machine.runtimeByStatus, 'IDLE');
                const machineError = calculateRuntimeByStatus(machine.runtimeByStatus, 'ERROR');

                const totalActiveSeconds = machineRuntime + machineIdle + machineError;
                const totalActiveHours = totalActiveSeconds / 3600;

                const power = machine.power || 0;
                const machineEnergy = power * totalActiveHours;

                totalCalculatedEnergy += machineEnergy;
                totalMeasuredEnergy += machine.currentEnergyConsumption || 0;
                totalOperatorCount += machine.operatorCount || 0;
            });
        });

        return {
            energy: totalCalculatedEnergy.toLocaleString('en-US', { maximumFractionDigits: 1 }),
            measuredEnergy: totalMeasuredEnergy,
            operatorCount: totalOperatorCount,
        };
    };

    const handleToggleLine = useCallback((lineId: number) => {
        setExpandedLines((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(lineId)) {
                newSet.delete(lineId);
            } else {
                newSet.add(lineId);
            }
            return newSet;
        });
    }, []);

    const totalMachines = getTotalMachinesInZone(zone.lines);
    const zoneStats = calculateZoneStats(zone.lines);

    return (
        <Card
            style={{
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: token.boxShadowTertiary,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
            styles={{
                body: { padding: 0 },
            }}
        >
            {/* Zone Header */}
            <div
                onClick={onToggle}
                style={{
                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    /* removed animation - compatibility fix */
                    color: token.colorTextLightSolid,
                }}
            >
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Flex align="center" gap={12}>
                        <DownOutlined
                            style={{
                                fontSize: 16,
                                color: token.colorTextLightSolid,
                                transition: 'transform 0.3s',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                        />
                        <div>
                            <Title
                                level={3}
                                style={{
                                    color: token.colorTextLightSolid,
                                    margin: 0,
                                    marginBottom: 4,
                                }}
                            >
                                {zone.zoneName}
                            </Title>
                            <Text
                                style={{
                                    color: token.colorBgBase,
                                    fontSize: 13,
                                    opacity: 0.85,
                                }}
                            >
                                {zone.zoneCode} • {zone.lines.length}{' '}
                                {t('factoryOverview.zone.lines', 'lines')} • {totalMachines}{' '}
                                {t('factoryOverview.zone.machines')}
                            </Text>
                        </div>
                    </Flex>

                    <div
                        style={{
                            width: 1,
                            height: 40,
                            background: token.colorBgBase,
                            opacity: 0.3,
                        }}
                    />

                    {/* Zone Stats */}
                    <Flex gap={24} wrap="wrap" style={{ flex: 1 }}>
                        {/* Energy */}
                        <Flex align="center" gap={8}>
                            <ThunderboltOutlined
                                style={{
                                    fontSize: 18,
                                    color: token.colorBgBase,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorBgBase,
                                        opacity: 0.75,
                                    }}
                                >
                                    {t('machineManagement.timeline.energy', 'Energy')}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    {zoneStats.energy} kWh
                                </div>
                            </div>
                        </Flex>

                        {/* Measured Energy */}
                        <Flex align="center" gap={8}>
                            <ThunderboltOutlined
                                style={{
                                    fontSize: 18,
                                    color: token.colorWarningText,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorBgBase,
                                        opacity: 0.75,
                                    }}
                                >
                                    {t(
                                        'machineManagement.timeline.measuredEnergy',
                                        'Measured Energy'
                                    )}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    {zoneStats.measuredEnergy} kW
                                </div>
                            </div>
                        </Flex>

                        {/* Run */}
                        <Flex align="center" gap={8}>
                            <ClockCircleOutlined
                                style={{
                                    fontSize: 18,
                                    color: token.colorSuccessText,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorBgBase,
                                        opacity: 0.75,
                                    }}
                                >
                                    {t('factoryOverview.zone.run')}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    {calculateZoneRuntimeByStatus(zone.lines, 'RUNTIME')}
                                </div>
                            </div>
                        </Flex>

                        {/* Stop */}
                        <Flex align="center" gap={8}>
                            <PauseCircleOutlined
                                style={{
                                    fontSize: 18,
                                    color: token.colorWarningText,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorBgBase,
                                        opacity: 0.75,
                                    }}
                                >
                                    {t('factoryOverview.zone.stop')}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    {calculateZoneRuntimeByStatus(zone.lines, 'IDLE')}
                                </div>
                            </div>
                        </Flex>

                        {/* Error */}
                        <Flex align="center" gap={8}>
                            <CloseCircleOutlined
                                style={{
                                    fontSize: 18,
                                    color: token.colorErrorText,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorBgBase,
                                        opacity: 0.75,
                                    }}
                                >
                                    {t('factoryOverview.zone.error')}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    {calculateZoneRuntimeByStatus(zone.lines, 'ERROR')}
                                </div>
                            </div>
                        </Flex>

                        {/* Operator Count */}
                        <Flex align="center" gap={8}>
                            <UserOutlined
                                style={{
                                    fontSize: 18,
                                    color: token.colorBgBase,
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: token.colorBgBase,
                                        opacity: 0.75,
                                    }}
                                >
                                    {t('machineManagement.timeline.operatorCount', 'Operators')}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                    {zoneStats.operatorCount}
                                </div>
                            </div>
                        </Flex>
                    </Flex>
                </Flex>
            </div>

            {/* Lines Container */}
            {isExpanded && (
                <div
                    style={{
                        padding: 24,
                        animation: 'fadeIn 0.3s ease-in',
                    }}
                >
                    {[...zone.lines]
                        .sort((a, b) => a.lineDisplayOrder - b.lineDisplayOrder)
                        .map((line, lineIndex) => (
                            <LineSection
                                key={line.lineId}
                                line={line}
                                lineIndex={lineIndex}
                                totalLines={zone.lines.length}
                                isExpanded={expandedLines.has(line.lineId)}
                                onToggle={() => handleToggleLine(line.lineId)}
                                onMachineClick={onMachineClick}
                                onLineClick={(lineId) => onLineClick(zone.zoneId, lineId)}
                            />
                        ))}
                </div>
            )}
        </Card>
    );
};

export default React.memo(ZoneCard);
