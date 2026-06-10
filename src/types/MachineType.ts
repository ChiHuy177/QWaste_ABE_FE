import { AuditMetaData } from "./Metadata";

export interface MachineType {
    machineTypeId: number;
    machineTypeName: string;
    description: string;
    auditMetaData?: AuditMetaData;
}

export interface MachineTypeFormData {
    machineTypeId?: number;
    machineTypeName: string;
    description: string;
}