'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ZoneCard from './ZoneCard';
import MachineTimelineModal from '../../machines/_components/MachineTimelineModal';
import { FactoryOverviewResponse } from '@/types/Factory';
import { MachineOverview } from '@/types/Machine';
import { Empty } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

interface FactoryZonesGridProps {
    factoryData: FactoryOverviewResponse | null;
    factoryId?: number | null;
    filterInfo?: {
        factoryName?: string;
        timePeriod?: string;
        timePeriodValue?: string;
    };
}

const FactoryZonesGrid: React.FC<FactoryZonesGridProps> = ({
    factoryData,
    factoryId,
    filterInfo,
}) => {
    const router = useRouter();
    const { t } = useTranslation();
    const [selectedMachine, setSelectedMachine] = useState<MachineOverview | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());

    const handleLineClick = useCallback(
        (zoneId: number, lineId: number) => {
            const queryParams = new URLSearchParams();
            if (factoryId) queryParams.set('factoryId', factoryId.toString());
            queryParams.set('zoneId', zoneId.toString());
            queryParams.set('lineId', lineId.toString());
            router.push(`/admin/machines?${queryParams.toString()}`);
        },
        [factoryId, router]
    );

    const handleMachineClick = useCallback((machine: any, e: React.MouseEvent) => {
        e.stopPropagation();

        const mapStatus = (currentStatus: string): 'running' | 'idle' | 'error' | 'empty' => {
            switch (currentStatus) {
                case 'RUNTIME':
                    return 'running';
                case 'IDLE':
                    return 'idle';
                case 'ERROR':
                    return 'error';
                case 'OFFLINE':
                default:
                    return 'empty';
            }
        };

        const convertRuntimeToLogs = (runtimeByStatus: any) => {
            if (!runtimeByStatus) return [];

            const logs = [];
            const statusMap =
                runtimeByStatus instanceof Map
                    ? runtimeByStatus
                    : new Map(Object.entries(runtimeByStatus));

            for (const [status, timeInSeconds] of statusMap) {
                if (timeInSeconds > 0) {
                    logs.push({
                        logStatus: status as
                            | 'RUNTIME'
                            | 'IDLE'
                            | 'ERROR'
                            | 'OFFLINE'
                            | 'COMPLETE'
                            | 'UNKNOWN',
                        totalLogStateTime: timeInSeconds as number,
                    });
                }
            }

            return logs;
        };

        const machineOverview: MachineOverview = {
            machineId: machine.machineId,
            machineCode: machine.machineCode,
            machineName: machine.machineName || machine.machineCode,
            propertyCode: machine.propertyCode,
            power: machine.power,
            status: mapStatus(machine.currentStatus),
            currentStatus: machine.currentStatus,
            currentEnergyConsumption: machine.currentEnergyConsumption || 0,
            productionCounter: machine.productionCounter || 0,
            totalProductions: machine.totalProductions || 0,
            logs: convertRuntimeToLogs(machine.runtimeByStatus),
            operatorCount: machine.operatorCount || 0,
            runtimeByStatus: machine.runtimeByStatus,
        };

        setSelectedMachine(machineOverview);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedMachine(null);
    }, []);

    const handleToggleZone = useCallback((zoneId: number) => {
        setExpandedZones((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(zoneId)) {
                newSet.delete(zoneId);
            } else {
                newSet.add(zoneId);
            }
            return newSet;
        });
    }, []);

    if (!factoryData) {
        return null;
    }

    return (
        <>
            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {factoryData.zones.length === 0 ? (
                    <Empty
                        image={<InboxOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
                        styles={{ image: { height: 80 } }}
                        description={
                            <span style={{ color: '#999', fontSize: 16 }}>
                                {t('machineManagement.emptyStates.noResults.title')}
                            </span>
                        }
                        style={{
                            marginTop: 80,
                            marginBottom: 80,
                        }}
                    />
                ) : (
                    factoryData.zones.map((zone) => (
                        <ZoneCard
                            key={zone.zoneId}
                            zone={zone}
                            isExpanded={expandedZones.has(zone.zoneId)}
                            onToggle={() => handleToggleZone(zone.zoneId)}
                            onLineClick={handleLineClick}
                            onMachineClick={handleMachineClick}
                        />
                    ))
                )}
            </div>

            {/* Machine Timeline Modal */}
            <MachineTimelineModal
                open={isModalOpen}
                onClose={handleModalClose}
                machine={selectedMachine}
                filterInfo={filterInfo}
            />
        </>
    );
};

export default FactoryZonesGrid;
