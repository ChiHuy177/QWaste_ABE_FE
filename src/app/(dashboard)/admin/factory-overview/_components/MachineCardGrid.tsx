'use client';

import React from 'react';
import { Grid } from 'antd';
import { MachineWithStatusLogsSummary } from '@/types/Machine';
import MachineCard from './MachineCard';

const { useBreakpoint } = Grid;

interface MachineCardGridProps {
    machines: MachineWithStatusLogsSummary[];
    onMachineClick: (machine: MachineWithStatusLogsSummary, e: React.MouseEvent) => void;
}

const MachineCardGrid: React.FC<MachineCardGridProps> = ({ machines, onMachineClick }) => {
    const screens = useBreakpoint();
    // md breakpoint in antd is 768px. 
    // screens.md is false when viewport width is < 768px (Mobile & narrow tablets)
    const isMobile = screens.md === false;

    if (machines.length === 0) return null;

    return (
        <div
            style={{
                display: isMobile ? 'flex' : 'grid',
                flexWrap: isMobile ? 'nowrap' : undefined,
                alignItems: isMobile ? 'stretch' : undefined,
                overflowX: isMobile ? 'auto' : 'visible',
                gridTemplateColumns: isMobile ? undefined : 'repeat(auto-fill, minmax(165px, 1fr))',
                gap: 16,
                paddingBottom: isMobile ? 8 : 0, 
                WebkitOverflowScrolling: 'touch', 
                animation: 'fadeIn 0.3s ease-in',
            }}
        >
            {machines.map((machine) => (
                <div 
                    key={machine.machineId}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        ...(isMobile ? { flexShrink: 0, width: 170 } : { height: '100%' })
                    }}
                >
                    <div style={{ flex: 1, width: '100%', height: '100%' }}>
                        <MachineCard
                            machine={machine}
                            onClick={onMachineClick}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default React.memo(MachineCardGrid);
