'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import SpaceNode from './SpaceNode';
import MachineCardGrid from './MachineCardGrid';
import MachineTimelineModal from '../../machines/_components/MachineTimelineModal';
import { SpaceOverview } from '@/types/Space';
import { MachineWithStatusLogsSummary } from '@/types/Machine';
import { MachineOverview } from '@/types/Machine';

const { Text } = Typography;

interface SpaceOverviewGridProps {
    spaceData: SpaceOverview | null;
    expandedSpaces: Set<number>;
    onToggle: (spaceId: number, space?: SpaceOverview) => void;
    filterInfo?: {
        factoryName?: string;
        timePeriod?: string;
        timePeriodValue?: string;
    };
}

const SpaceOverviewGrid: React.FC<SpaceOverviewGridProps> = ({
    spaceData,
    expandedSpaces,
    onToggle,
    filterInfo,
}) => {
    const { t } = useTranslation();
    const [selectedMachine, setSelectedMachine] = useState<MachineOverview | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleMachineClick = useCallback(
        (machine: MachineWithStatusLogsSummary, e: React.MouseEvent) => {
            e.stopPropagation();

            const mapStatus = (s: string): 'running' | 'idle' | 'error' | 'empty' => {
                switch (s) {
                    case 'RUNTIME':
                        return 'running';
                    case 'IDLE':
                        return 'idle';
                    case 'ERROR':
                        return 'error';
                    default:
                        return 'empty';
                }
            };

            const convertRuntimeToLogs = (runtimeByStatus: Record<string, number> | undefined) => {
                if (!runtimeByStatus) return [];
                return Object.entries(runtimeByStatus)
                    .filter(([, time]) => time > 0)
                    .map(([status, time]) => ({
                        logStatus: status as
                            'RUNTIME' | 'IDLE' | 'ERROR' | 'OFFLINE' | 'COMPLETE' | 'UNKNOWN',
                        totalLogStateTime: time,
                    }));
            };

            const machineOverview: MachineOverview = {
                machineId: machine.machineId,
                machineName: machine.machineName,
                machineCode: machine.machineCode,
                power: machine.power,
                status: mapStatus(machine.currentStatus),
                currentStatus: machine.currentStatus,
                currentEnergyConsumption: 0,
                productionCounter: 0,
                totalProductions: machine.totalProductions || 0,
                logs: convertRuntimeToLogs(machine.runtimeByStatus),
                operatorCount: machine.operatorCount || 0,
                runtimeByStatus: machine.runtimeByStatus,
            };

            setSelectedMachine(machineOverview);
            setIsModalOpen(true);
        },
        []
    );

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedMachine(null);
    }, []);

    const children = useMemo(() => spaceData?.children ?? [], [spaceData]);
    const standaloneMachines = useMemo(() => spaceData?.machineChildren ?? [], [spaceData]);

    if (!spaceData) return null;

    return (
        <>
            {/* Zone list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {children.length === 0 && standaloneMachines.length === 0 ? (
                    <Empty
                        image={<InboxOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
                        styles={{ image: { height: 80 } }}
                        description={
                            <span style={{ color: '#999', fontSize: 16 }}>
                                {t('machineManagement.emptyStates.noResults.title')}
                            </span>
                        }
                        style={{ marginTop: 80, marginBottom: 80 }}
                    />
                ) : (
                    children.map((child) => (
                        <SpaceNode
                            key={child.spaceId}
                            space={child}
                            depth={0}
                            expandedSpaces={expandedSpaces}
                            onToggle={onToggle}
                            onMachineClick={handleMachineClick}
                        />
                    ))
                )}
            </div>

            {/* Standalone machines (directly in factory, no zone) */}
            {standaloneMachines.length > 0 && (
                <div style={{ marginTop: 32 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 16,
                        }}
                    >
                        <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.6px',
                                textTransform: 'uppercase',
                                color: '#888',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {t(
                                'factoryOverview.zone.standaloneMachinesLabel',
                                'STANDALONE MACHINES'
                            )}{' '}
                            ({standaloneMachines.length}) &larr;{' '}
                            {t('factoryOverview.zone.scrollHint', 'scroll')} &rarr;
                        </Text>
                        <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                    </div>
                    <MachineCardGrid
                        machines={standaloneMachines}
                        onMachineClick={handleMachineClick}
                    />
                </div>
            )}

            <MachineTimelineModal
                open={isModalOpen}
                onClose={handleModalClose}
                machine={selectedMachine}
                filterInfo={filterInfo}
            />
        </>
    );
};

export default React.memo(SpaceOverviewGrid);
