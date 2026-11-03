import { AuditMetaData, SoftDeleteMetaData } from './Metadata';
import { SpaceDetailResponse } from './Space';
import { OperationType } from './OperationType';

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
    machineCode?: string;
    topic?: string;
}

export interface Machine {
    machineId: string;
    machineName: string;
    /** Mã máy (BE Machine.machine_code, nullable ở DB nhưng bắt buộc khi tạo/sửa). */
    machineCode?: string | null;
    description: string;
    topic: string;
    displayOrder: number;
    productionTime: number;
    machineImage: string;
    space: SpaceDetailResponse;
    operatorCount?: number;
    power?: number;
    operationType: OperationType;
    auditMetaData?: AuditMetaData;
    softDeleteMetaData?: SoftDeleteMetaData;
}

export interface MachineFormData {
    machineName: string;
    description: string;
    topic: string;
    // Form gives a locally-picked File; executeSubmit resolves it to an uploaded URL before submit.
    machineImage: string | File;
    spaceId: number;
    machineCode?: string | null;
    power?: number;
    operationTypeId: number;
}

export interface MachineUpdateFormData {
    machineId: string;
    machineName: string;
    description: string;
    topic: string;
    machineImage: string;
    spaceId: number;
    machineCode?: string | null;
    power?: number;
    operationTypeId: number;
}
export interface MachineLog {
    totalLogStateTime: number;
    logStatus: currentStatus;
}

export interface MachineOverview {
    machineId: string;
    machineName: string;
    machineCode?: string;
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
    // Zone/line overview endpoints send a Map; other overview endpoints send a plain object.
    runtimeByStatus?:
        | {
              RUNTIME: number;
              IDLE: number;
              ERROR: number;
              OFFLINE: number;
              COMPLETE?: number;
              TEMPORARY_STOP?: number;
              OPEN_DOOR?: number;
              WARNING?: number;
          }
        | Map<string, number>;
    topic?: string;
}

export interface MachineCurrentShiftOverview {
    machineId: string;
    machineName: string;
    machineCode?: string;
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
    totalOffline: number;
}

export type ZoneFilter = 'all' | 'zone1' | 'zone2' | 'zone3';

/** Status values the `/topic/machines/status/{machineId}` frames carry. */
export type MachineStatusLogStatus =
    | 'RUNTIME'
    | 'IDLE'
    | 'ERROR'
    | 'COMPLETE'
    | 'OFFLINE'
    | 'UNKNOWN';

/** Frame pushed on `/topic/machines/status/{machineId}` whenever a machine changes status. */
export interface MachineStatusWsMessage {
    type: string;
    payload: {
        machineId: string;
        data: {
            previousLog: {
                startTime: string;
                endTime: string;
                logStatus: MachineStatusLogStatus;
            };
            newStatus: MachineStatusLogStatus;
            /** Java `LocalDateTime` (no offset) marking when `newStatus` began. */
            newStatusStartTime?: string | null;
            productionCounter: number;
        };
    };
}

export interface MachineWithStatusLogsSummary {
    machineId: string;
    machineName: string;
    machineCode: string;
    power: number;
    machineDisplayOrder: number;
    topic: string;
    currentStatus: currentStatus;
    /** Java `LocalDateTime` (no offset) marking when `currentStatus` began. */
    currentStatusStartTime?: string | null;
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
