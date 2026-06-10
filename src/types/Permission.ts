import { AuditMetaData } from './Metadata';

export interface Permission {
    permissionId?: number;
    slug: string;
    permissionName: string;
    description?: string;
    auditMetaData: AuditMetaData;
}

export interface PermissionCreation {
    slug: string;
    permissionName: string;
    description?: string;
    auditMetaData: AuditMetaData;
}

export interface PermissionFormData {
    permissionName: string;
    description?: string;
    subject: string;
    action?: string | string[];
    customAction?: string;
}
