import { AuditMetaData } from './Metadata';

export interface RolePermission {
    permissionId: number;
    slug: string;
    permissionName: string;
    description?: string;
}

export interface Role {
    roleId: number;
    roleName: string;
    description?: string;
    permissions: RolePermission[];
    permissionIds?: number[];
    auditMetaData: AuditMetaData;
}

export interface RoleFormData {
    roleName: string;
    description?: string;
    permissionIds: number[];
}
