'use client';

import React from 'react';
import { Flex, Typography, theme, Button } from 'antd';
import {
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
    DownOutlined,
    DoubleRightOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import MachineCard from './MachineCard';
import { LineInFactoryOverview } from '@/types/Line';
import { MachineInFactoryOverview } from '@/types/Zone';

const { Text } = Typography;

interface LineSectionProps {
    line: LineInFactoryOverview;
    lineIndex: number;
    totalLines: number;
    isExpanded: boolean;
    onToggle: () => void;
    onMachineClick: (machine: MachineInFactoryOverview, e: React.MouseEvent) => void;
    onLineClick: (lineId: number) => void;
}

const LineSection: React.FC<LineSectionProps> = ({
    line,
    lineIndex,
    totalLines,
    isExpanded,
    onToggle,
    onMachineClick,
    onLineClick,
}) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const calculateRuntimeByStatus = (
        runtimeByStatus: MachineInFactoryOverview['runtimeByStatus'],
        status: string
    ): number => {
        if (!runtimeByStatus) return 0;
        return runtimeByStatus.get(status) || 0;
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    };

    const calculateLineStats = (machines: MachineInFactoryOverview[]) => {
        let totalCalculatedEnergy = 0;
        let totalMeasuredEnergy = 0;
        let totalRuntime = 0;
        let totalIdle = 0;
        let totalError = 0;
        let totalOperatorCount = 0;

        machines.forEach((machine) => {
            const machineRuntime = calculateRuntimeByStatus(machine.runtimeByStatus, 'RUNTIME');
            const machineIdle = calculateRuntimeByStatus(machine.runtimeByStatus, 'IDLE');
            const machineError = calculateRuntimeByStatus(machine.runtimeByStatus, 'ERROR');

            const totalActiveSeconds = machineRuntime + machineIdle + machineError;
            const totalActiveHours = totalActiveSeconds / 3600;

            const power = machine.power || 0;
            const machineEnergy = power * totalActiveHours;

            totalCalculatedEnergy += machineEnergy;
            totalMeasuredEnergy += machine.currentEnergyConsumption || 0;
            totalRuntime += machineRuntime;
            totalIdle += machineIdle;
            totalError += machineError;
            totalOperatorCount += machine.operatorCount || 0;
        });

        return {
            energy: totalCalculatedEnergy.toLocaleString('en-US', { maximumFractionDigits: 1 }),
            measuredEnergy: totalMeasuredEnergy,
            runtime: formatTime(totalRuntime),
            idle: formatTime(totalIdle),
            error: formatTime(totalError),
            operatorCount: totalOperatorCount,
        };
    };

    const lineStats = calculateLineStats(line.machines);

    return (
        <div
            style={{
                marginBottom: lineIndex < totalLines - 1 ? 32 : 0,
            }}
        >
            {/* Line Header */}
            <div
                onClick={onToggle}
                style={{
                    marginBottom: 20,
                    padding: '18px 24px 18px 20px',
                    background: token.colorBgContainer,
                    borderRadius: 12,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderLeft: `4px solid ${token.colorPrimary}`,
                    boxShadow: token.boxShadowTertiary,
                    cursor: 'pointer',
                    /* removed hover effect - compatibility fix */
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative corner */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 60,
                        height: 60,
                        background: `${token.colorPrimary}08`,
                        borderBottomLeftRadius: '100%',
                    }}
                />

                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={24}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    {/* Line Info */}
                    <Flex align="center" gap={16}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: token.colorPrimaryBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                /* removed animation - compatibility fix */
                            }}
                        >
                            <DownOutlined
                                style={{
                                    fontSize: 12,
                                    color: token.colorPrimary,
                                    transition: 'transform 0.3s',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                            />
                        </div>
                        <div>
                            <Text
                                strong
                                style={{
                                    fontSize: 18,
                                    color: token.colorText,
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                {t('factoryOverview.zone.line')} {line.lineDisplayOrder}:{' '}
                                {line.lineName}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: token.colorTextTertiary,
                                }}
                            >
                                {line.machines.length}{' '}
                                {t('factoryOverview.zone.machines', 'machines')}
                            </Text>
                        </div>
                    </Flex>

                    <div
                        style={{
                            width: 1,
                            height: 44,
                            background: token.colorBorder,
                            opacity: 0.5,
                        }}
                    />

                    {/* Line Stats */}
                    <Flex gap={20} wrap="wrap" style={{ flex: 1 }}>
                        {/* Energy */}
                        <Flex align="center" gap={10}>
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: `${token.colorPrimary}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ThunderboltOutlined
                                    style={{
                                        fontSize: 16,
                                        color: token.colorPrimary,
                                    }}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextTertiary,
                                        marginBottom: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('machineManagement.timeline.energy', 'Energy')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: token.colorPrimary,
                                    }}
                                >
                                    {lineStats.energy} kWh
                                </div>
                            </div>
                        </Flex>

                        {/* Measured Energy */}
                        <Flex align="center" gap={10}>
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: `${token.colorWarning}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ThunderboltOutlined
                                    style={{
                                        fontSize: 16,
                                        color: token.colorWarning,
                                    }}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextTertiary,
                                        marginBottom: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t(
                                        'machineManagement.timeline.measuredEnergy',
                                        'Measured Energy'
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: token.colorWarning,
                                    }}
                                >
                                    {lineStats.measuredEnergy} kW
                                </div>
                            </div>
                        </Flex>

                        {/* Run */}
                        <Flex align="center" gap={10}>
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: `${token.colorSuccess}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ClockCircleOutlined
                                    style={{
                                        fontSize: 16,
                                        color: token.colorSuccess,
                                    }}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextTertiary,
                                        marginBottom: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('factoryOverview.zone.run', 'Run')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: token.colorSuccess,
                                    }}
                                >
                                    {lineStats.runtime}
                                </div>
                            </div>
                        </Flex>

                        {/* Stop */}
                        <Flex align="center" gap={10}>
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: `${token.colorWarning}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <PauseCircleOutlined
                                    style={{
                                        fontSize: 16,
                                        color: token.colorWarning,
                                    }}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextTertiary,
                                        marginBottom: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('factoryOverview.zone.stop', 'Stop')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: token.colorWarning,
                                    }}
                                >
                                    {lineStats.idle}
                                </div>
                            </div>
                        </Flex>

                        {/* Error */}
                        <Flex align="center" gap={10}>
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: `${token.colorError}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <CloseCircleOutlined
                                    style={{
                                        fontSize: 16,
                                        color: token.colorError,
                                    }}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextTertiary,
                                        marginBottom: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('factoryOverview.zone.error', 'Error')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: token.colorError,
                                    }}
                                >
                                    {lineStats.error}
                                </div>
                            </div>
                        </Flex>

                        {/* Operator Count */}
                        <Flex align="center" gap={10}>
                            <div
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    background: `${token.colorInfo}10`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <UserOutlined
                                    style={{
                                        fontSize: 16,
                                        color: token.colorInfo,
                                    }}
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextTertiary,
                                        marginBottom: 2,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t('machineManagement.timeline.operatorCount', 'Operators')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: token.colorInfo,
                                    }}
                                >
                                    {lineStats.operatorCount}
                                </div>
                            </div>
                        </Flex>
                    </Flex>

                    {/* Navigation Button */}
                    <Button
                        type="text"
                        icon={<DoubleRightOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onLineClick(line.lineId);
                        }}
                        style={{
                            color: token.colorPrimary,
                            fontSize: 18,
                        }}
                    />
                </Flex>
            </div>

            {/* Machines Grid */}
            {isExpanded && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
                        gap: 16,
                        animation: 'fadeIn 0.3s ease-in',
                    }}
                >
                    {line.machines.map((machine) => (
                        <MachineCard
                            key={machine.machineId}
                            machine={machine}
                            onClick={onMachineClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(LineSection);
