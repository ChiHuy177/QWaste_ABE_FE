'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';
import { FloorMapDisplayResponse, MachineFloorPositionRequest } from '@/types/FloorMap';


const FloorMapKonvaCanvas = dynamic(() => import('./FloorMapKonvaCanvas'), {
    ssr: false,
    loading: () => (
        <div
            style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Spin />
        </div>
    ),
});

interface FloorMapCanvasShellProps {
    floorMap: FloorMapDisplayResponse;
    selectedMachineId: string | null;
    savingMachineId: string | null;
    readOnly?: boolean;
    minHeight?: number;
    initialZoom?: number;
    prominentSelection?: boolean;
    onSelectMachine: (machineId: string | null) => void;
    onUpdateMachine?: (machineId: string, position: MachineFloorPositionRequest) => void;
    onDropMachine?: (machineId: string, position: MachineFloorPositionRequest) => void;
}

export function FloorMapCanvasShell(props: FloorMapCanvasShellProps) {
    return <FloorMapKonvaCanvas {...props} />;
}
