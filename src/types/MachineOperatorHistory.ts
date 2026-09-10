import { AuditMetaData } from './Metadata';

export interface MachineOperatorHistory {
    machineId: string;
    machineCode: string;
    machineName: string;
    operatorCount?: number;
    notes?: string;
    createdAt?: Date;
    auditMetaData?: AuditMetaData;
}

export interface MachineOperatorHistoryFormData {
    machineId: string;
    zoneId: number;
    operatorCount: number;
    notes?: string;
}

/** Pre-fill context for the edit modal: form fields plus the raw machineId
 * (`id`) and read-only display fields not part of the submitted payload. */
export interface MachineOperatorHistoryModalData extends Partial<MachineOperatorHistoryFormData> {
    id: string;
    machineCode: string;
    machineName: string;
    machineDisplay: string;
    auditMetaData?: AuditMetaData;
}
