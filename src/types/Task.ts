import type { AuditMetaData as GlobalAuditMetaData } from './Metadata';

export type TaskStatus = 'DRAFT' | 'LOCKED' | 'TO_DO' | 'IN_PROGRESS' | 'PAUSED' | 'QC_CHECK' | 'COMPLETE' | 'CANCELLED';
export type TaskType = 'NORMAL' | 'REWORK';

export interface TaskAssignment {
    taskAssignmentId: number;
    operatorId: string;
    operatorFullName: string;
    operatorUserCode: string;
    machineId: string | null;
    machineName?: string;
    machineCode?: string;
    materialName?: string;
    startedAt: string | null;
    endedAt: string | null;
    assignedByUserId: string;
    assignedByFullName: string;
    assignedAt: string;
}

export interface TaskDefectRecordResponse {
    defectRecordId: number;
    defectType: string;
    nameEn: string;
    nameVi: string;
    quantity: number;
    note: string;
    recordedAt: string;
}

export interface TaskResponse {
    taskId: string;
    taskName?: string;
    taskOrder?: number;
    stepOrder: number;
    stepName: string;
    stepDescription?: string;
    requiresQc: boolean;
    stepDefaultCompletionTimeSeconds?: number;
    materialName?: string;
    taskType: TaskType;
    taskQuantity?: number;
    taskRequestedQuantity?: number;
    taskPlannedQuantity?: number;
    taskActualQuantity?: number;
    taskErrorActualQuantity?: number;
    taskStatus: TaskStatus;
    parentTaskId: string | null;
    rootTaskId?: string | null;
    reworkGeneration?: number;
    createdAt?: string;
    completedAt?: string | null;
    taskAssignments: TaskAssignment[];
    defectRecords?: TaskDefectRecordResponse[];
    auditMetaData?: GlobalAuditMetaData;
}
