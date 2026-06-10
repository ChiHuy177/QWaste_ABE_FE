import type { Permission } from '@/types/Permission';
import { MOCK_RBAC_PERMISSIONS } from './permissions';

export const USE_MOCK_RBAC = true;

type DuplicatePermissionError = Error & {
    response?: {
        data?: {
            code?: number;
            result?: {
                conflictValue?: string;
            };
        };
    };
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const demoPermissions: Permission[] = MOCK_RBAC_PERMISSIONS.map((permission) => ({
    ...permission,
    auditMetaData: { ...permission.auditMetaData },
}));

const getNextPermissionId = () =>
    Math.max(...demoPermissions.map((permission) => permission.permissionId ?? 0), 0) + 1;

const findPermission = (permissionId: number) => {
    const permission = demoPermissions.find((item) => item.permissionId === permissionId);
    if (!permission) {
        throw new Error('Demo permission was not found');
    }

    return permission;
};

const createDuplicateError = (slug: string): DuplicatePermissionError => {
    const error = new Error(`Duplicate permission: ${slug}`) as DuplicatePermissionError;
    error.response = {
        data: {
            code: 2001,
            result: { conflictValue: slug },
        },
    };

    return error;
};

const touchPermission = (permission: Permission) => {
    permission.auditMetaData = {
        ...permission.auditMetaData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

export class DemoPermissionService {
    static async getAllPermissions(): Promise<Permission[]> {
        return clone(
            [...demoPermissions].sort((left, right) => left.slug.localeCompare(right.slug))
        );
    }

    static async createPermission(permissionData: Partial<Permission>): Promise<Permission> {
        if (!permissionData.slug || !permissionData.permissionName) {
            throw new Error('Demo permission slug and name are required');
        }

        const isDuplicate = demoPermissions.some(
            (permission) => permission.slug === permissionData.slug
        );
        if (isDuplicate) {
            throw createDuplicateError(permissionData.slug);
        }

        const permission: Permission = {
            permissionId: getNextPermissionId(),
            slug: permissionData.slug,
            permissionName: permissionData.permissionName,
            description: permissionData.description,
            auditMetaData: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };

        demoPermissions.push(permission);

        return clone(permission);
    }

    static async getPermissionById(permissionId: number): Promise<Permission> {
        return clone(findPermission(permissionId));
    }

    static async updatePermission(permissionData: Permission): Promise<Permission> {
        if (!permissionData.permissionId) {
            throw new Error('Demo permission id is required');
        }

        const permission = findPermission(permissionData.permissionId);
        const isDuplicate = demoPermissions.some(
            (item) => item.permissionId !== permissionData.permissionId && item.slug === permissionData.slug
        );
        if (isDuplicate) {
            throw createDuplicateError(permissionData.slug);
        }

        permission.slug = permissionData.slug;
        permission.permissionName = permissionData.permissionName;
        permission.description = permissionData.description;
        touchPermission(permission);

        return clone(permission);
    }

    static async deletePermission(permissionId: number): Promise<void> {
        const targetIndex = demoPermissions.findIndex(
            (permission) => permission.permissionId === permissionId
        );
        if (targetIndex === -1) {
            throw new Error('Demo permission was not found');
        }

        demoPermissions.splice(targetIndex, 1);
    }
}
