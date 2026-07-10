import { AuditMetaData, SoftDeleteMetaData } from './Metadata';
import { SpaceDetailResponse } from './Space';

export type currentStatus =
    | 'RUNTIME'
    | 'IDLE'
    | 'ERROR'
    | 'OFFLINE'
    | 'COMPLETE'
    | 'TEMPORARY_STOP'
    | 'OPEN_DOOR'
    | 'WARNING'
    | 'UNKNOWN';

export interface MachinePaginatedParams {
    page: number;
    size: number;
    sort?: string | string[];
    search?: string;
    spaceId?: number;
    machineName?: string;
    propertyCode?: string;
    topic?: string;
}

export interface Machine {
    machineId: string;
    machineName: string;
    /** Mã máy (BE Machine.machine_code, nullable) — dùng ở production plan. */
    machineCode?: string | null;
    description: string;
    topic: string;
    displayOrder: number;
    productionTime: number;
    machineImage: string;
    space: SpaceDetailResponse;
    propertyCode?: string;
    operatorCount?: number;
    power?: number;
    auditMetaData?: AuditMetaData;
    softDeleteMetaData?: SoftDeleteMetaData;
}

export interface MachineFormData {
    machineName: string;
    description: string;
    topic: string;
    machineImage: string;
    spaceId: number;
    propertyCode?: string;
    power?: number;
}

export interface MachineUpdateFormData {
    machineId: string;
    machineName: string;
    description: string;
    topic: string;
    machineImage: string;
    spaceId: number;
    propertyCode?: string;
    power?: number;
}
export interface MachineLog {
    totalLogStateTime: number;
    logStatus: currentStatus;
}

export interface MachineOverview {
    machineId: string;
    machineName: string;
    machineCode?: string;
    propertyCode?: string;
    power?: number;
    status: 'running' | 'idle' | 'error' | 'empty';
    machineImage?: string;
    // operatorName?: string;
    operatorCount?: number;
    // taskName?: string;
    logs: MachineLog[];
    currentEnergyConsumption: number;
    currentStatus?: currentStatus;
    productionCounter?: number;
    totalProductions?: number;
    lastStatusUpdate?: Date | string;
    runtimeByStatus?: {
        RUNTIME: number;
        IDLE: number;
        ERROR: number;
        OFFLINE: number;
        COMPLETE?: number;
        TEMPORARY_STOP?: number;
        OPEN_DOOR?: number;
        WARNING?: number;
    };
    topic?: string;
}

export interface MachineCurrentShiftOverview {
    machineId: string;
    machineName: string;
    propertyCode?: string;
    power?: number;
    topic?: string;
    currentStatus: currentStatus;
    operatorCount?: number;
    totalProductions?: number;
    runtimeByStatus?: Partial<Record<currentStatus, number>>;
}

export interface MachineStats {
    totalRun: number;
    totalIdle: number;
    totalError: number;
    totalEmpty: number;
}

export type ZoneFilter = 'all' | 'zone1' | 'zone2' | 'zone3';

export interface MachineWithStatusLogsSummary {
    machineId: string;
    machineName: string;
    machineCode: string;
    propertyCode: string;
    power: number;
    machineDisplayOrder: number;
    topic: string;
    currentStatus: currentStatus;
    operatorCount: number;
    totalProductions: number;
    runtimeByStatus?: {
        RUNTIME: number;
        IDLE: number;
        ERROR: number;
        OFFLINE: number;
        COMPLETE?: number;
        TEMPORARY_STOP?: number;
        OPEN_DOOR?: number;
        WARNING?: number;
    };
}
