import { currentStatus } from './Machine';

export interface FloorMapResponse {
    spaceId: number;
    floorPlanImageUrl: string | null;
    machines: FloorMapMachineResponse[];
}

export interface FloorMapMachineResponse {
    machineId: string;
    machineCode: string;
    spaceId: number;
    spaceCode: string;
    spaceName: string;
    spaceLevelName: string;
    xRatio: number | null;
    yRatio: number | null;
    widthRatio: number | null;
    heightRatio: number | null;
}

export type FloorMapMachineDisplayResponse = FloorMapMachineResponse & {
    currentStatus?: currentStatus;
};

export interface FloorMapDisplayResponse {
    spaceId: number;
    floorPlanImageUrl: string | null;
    machines: FloorMapMachineDisplayResponse[];
}

export interface MachineFloorPositionRequest {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}
