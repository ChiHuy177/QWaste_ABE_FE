import type { AuditMetaData } from './Metadata';

export type ErrorDetailStatus = 'ACTIVE' | 'INACTIVE';

export interface ErrorDetail {
    errorDetailId: number;
    errorCode: string;
    errorName: string;
    description: string;
    status: ErrorDetailStatus;
    errorGroupId: number;
    errorGroupName?: string;
    errorCodeId: number;
    auditMetaData?: AuditMetaData;
}

export interface ErrorDetailFormData {
    errorCode: string;
    errorName: string;
    description: string;
    status: ErrorDetailStatus;
    errorGroupId: number;
}

export interface ErrorDetailUpdateData extends ErrorDetailFormData {
    errorDetailId: number;
    errorName: string;
    description: string;
    status: ErrorDetailStatus;
}
