import { MachineWithStatusLogsSummary } from './Machine';
import { AuditMetaData } from './Metadata';

export interface SpaceLevel {
    spaceLevelId: number;
    spaceLevel: number;
    spaceLevelName: string;
}

export interface SpaceDTO {
    spaceId: number;
    spaceCode: string;
    spaceName: string;
    description?: string;
}

export type AccessibleSpace = SpaceDTO;

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
    spaceLevelId?: number;
}

/** Form values submitted by the create/edit Space modal (see spaceFormConfig.tsx). */
export interface SpaceFormData {
    spaceLevelId?: number;
    parentSpaceId?: number | null;
    spaceCode: string;
    spaceName: string;
    displayOrder: number;
    description?: string | null;
    floorPlanImageUrl?: string | File | null;
}

/** Context passed as `EntityFormModal` initialData: fields from the full record
 * when editing (see SpaceDetailResponse), or just the parent/level context when
 * creating a new space under a given level — all optional since only one set
 * of fields is populated depending on `modalState.mode`. */
export interface SpaceModalData {
    spaceId?: number;
    parentId?: number | null;
    parentSpaceId?: number | null;
    parentName?: string;
    spaceLevelId?: number;
    spaceLevelName?: string;
    spaceCode?: string;
    spaceName?: string;
    floorPlanImageUrl?: string | null;
    description?: string | null;
    displayOrder?: number;
    auditMetaData?: AuditMetaData;
    spaceLevel?: SpaceLevel;
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
    lastUpdate?: string;
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
