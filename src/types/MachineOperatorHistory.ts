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
