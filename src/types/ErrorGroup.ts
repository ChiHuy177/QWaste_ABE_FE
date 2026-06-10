import type { AuditMetaData } from './Metadata';

export type ErrorGroupStatus = 'ACTIVE' | 'INACTIVE';

export interface ErrorGroup {
    errorGroupId: number;
    errorGroupName: string;
    description: string;
    status: ErrorGroupStatus;
    auditMetaData?: AuditMetaData;
}

export interface ErrorGroupFormData {
    errorGroupName: string;
    description: string;
    status: ErrorGroupStatus;
}

export interface ErrorGroupUpdateData extends ErrorGroupFormData {
    errorGroupId: number;
}
