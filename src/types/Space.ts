import { MachineWithStatusLogsSummary } from './Machine';
import { AuditMetaData } from './Metadata';

export interface SpaceLevel {
    spaceLevelId: number;
    spaceLevel: number;
    spaceLevelName: string;
}

export interface SpaceDetailResponse {
    spaceId: number;
    parentId: number | null;
    spaceParentName: string | null;
    spaceParentCode: string | null;
    spaceCode: string;
    spaceName: string;
    floorPlanImageUrl?: string | null;
    description: string | null;
    displayOrder: number;
    auditMetaData: AuditMetaData;
    spaceLevel: SpaceLevel;
}

export interface SpaceWithChildrenResponse {
    spaceId: number;
    parentId: number | null;
    spaceCode: string;
    spaceName: string;
    floorPlanImageUrl?: string | null;
    description: string | null;
    displayOrder: number;
    auditMetaData: AuditMetaData;
    spaceLevel: SpaceLevel;
    children?: SpaceWithChildrenResponse[];
}

export interface SpacePickingResponse {
    spaceId: number;
    spaceCode: string;
    spaceName: string;
    displayOrder: number;
    spaceLevel: SpaceLevel;
}

export interface SpaceCRUDResponse {
    spaceId: number;
    spaceCode: string;
    spaceName: string;
    floorPlanImageUrl?: string | null;
    description: string | null;
    displayOrder: number;
    spaceLevel: SpaceLevel;
    newParentId: number | null;
    prevParentId: number | null;
}

export interface SpaceCreationRequest {
    parentSpaceId?: number | null;
    spaceCode: string;
    spaceName: string;
    floorPlanImageUrl?: string | null;
    description?: string;
    displayOrder?: number;
    spaceLevelId?: number;
}

export interface SpaceUpdationRequest {
    spaceId: number;
    parentSpaceId?: number | null;
    spaceCode: string;
    spaceName: string;
    floorPlanImageUrl?: string | null;
    description?: string;
    displayOrder?: number;
}
export interface SpacePickingWithChildren {
    spaceId: number;
    parentId: number;
    spaceCode: string;
    spaceName: string;
    description: string;
    displayOrder: number;
    spaceLevel: SpaceLevel;
    children: SpacePickingWithChildren[];
}

export interface SpaceOverview {
    spaceId: number;
    spaceCode: string;
    spaceName: string;
    children: SpaceOverview[];
    machineChildren: MachineWithStatusLogsSummary[];
}

export interface SpaceComputedStats {
    totalMachines: number;
    runtimeSeconds: number;
    idleSeconds: number;
    errorSeconds: number;
    offlineSeconds: number;
    energyKwh: number;
    operatorCount: number;
    totalProductions: number;
    machinesByStatus: {
        RUNTIME: number;
        IDLE: number;
        ERROR: number;
        OFFLINE: number;
        COMPLETE: number;
        TEMPORARY_STOP: number;
        OPEN_DOOR: number;
        WARNING: number;
        UNKNOWN: number;
    };
}
