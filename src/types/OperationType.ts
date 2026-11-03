import { AuditMetaData } from './Metadata';

export interface OperationType {
    operationTypeId: number;
    operationTypeCode: string;
    operationTypeName: string;
    description?: string;
    auditMetaData?: AuditMetaData;
}

export interface OperationTypeFormData {
    operationTypeCode: string;
    operationTypeName: string;
    description?: string;
}

export interface OperationTypeUpdateFormData extends OperationTypeFormData {
    operationTypeId: number;
}

export interface OperationTypePaginatedParams {
    page: number;
    size: number;
    sort?: string | string[];
    search?: string;
    operationTypeCode?: string;
    operationTypeName?: string;
}
