import type { AuditMetaData } from './Metadata';

export type IncidentClassification = 'MACHINE' | 'MOLD';
export type IncidentStatus = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface IncidentMachineRef {
    machineId: string;
    machineName: string;
    machineCode: string;
}

export interface IncidentMoldRef {
    moldId: number;
    moldCode: string;
    moldName: string;
}

export interface IncidentErrorGroupRef {
    errorGroupId: number;
    errorGroupName: string;
}

export interface IncidentErrorDetailRef {
    errorDetailId: number;
    errorCode: string;
    errorName: string;
}

export interface IncidentReport {
    reportId: number;
    reportNumber: string;
    classification: IncidentClassification;
    machine?: IncidentMachineRef;
    mold?: IncidentMoldRef;
    description: string;
    imageUrls: string[];
    rootCause?: string;
    errorGroup: IncidentErrorGroupRef;
    errorDetail: IncidentErrorDetailRef;
    status: IncidentStatus;
    reportedBy: string;
    reportedByName: string;
    reportedAt: string;
    resolvedAt?: string;
    auditMetaData?: AuditMetaData;
}

export interface IncidentReportFormData {
    classification: IncidentClassification;
    machineId?: string;
    moldId?: number;
    description: string;
    imageUrls?: string[];
    rootCause?: string;
    errorGroupId: number;
    errorDetailId: number;
}

export interface IncidentReportUpdateData extends IncidentReportFormData {
    reportId: number;
    status: IncidentStatus;
    resolvedAt?: string;
}

export interface IncidentReportPaginatedParams {
    page: number;
    size: number;
    sort?: string | string[];
    search?: string;
    classification?: IncidentClassification;
    status?: IncidentStatus;
    machineId?: string;
    moldId?: number;
    errorGroupId?: number;
    fromDate?: string;
    toDate?: string;
}
