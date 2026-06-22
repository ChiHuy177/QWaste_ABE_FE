import { currentStatus } from './Machine';

export interface FloorMapResponse {
    spaceId: number;
    floorPlanImageUrl: string | null;
    machines: FloorMapMachineResponse[];
}

export interface FloorMapMachineResponse {
    machineId: string;
    propertyCode: string;
    spaceId: number;
    spaceCode: string;
    spaceName: string;
    spaceLevelName: string;
    xRatio: number | null;
    yRatio: number | null;
    widthRatio: number | null;
    heightRatio: number | null;
}

export interface FloorMapMachineStatusResponse extends FloorMapMachineResponse {
    currentStatus: currentStatus;
}

export type FloorMapMachineDisplayResponse = FloorMapMachineResponse & {
    currentStatus?: currentStatus;
};

export interface FloorMapDisplayResponse {
    spaceId: number;
    floorPlanImageUrl: string | null;
    machines: FloorMapMachineDisplayResponse[];
}

export interface FloorMapStatusResponse {
    spaceId: number;
    floorPlanImageUrl: string | null;
    machines: FloorMapMachineStatusResponse[];
}

export interface MachineFloorPositionRequest {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
}
