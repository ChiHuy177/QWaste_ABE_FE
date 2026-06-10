import { Permission } from '@/types/Permission';
import { NetworkService } from './NetworkService';

export class PermissionService {
    static async getAllPermissions(): Promise<Permission[]> {
        const response = await NetworkService.requestJson<Permission[]>({
            method: 'GET',
            url: '/api/permissions/v1',
        });
        return response.result as Permission[];
    }

    static async createPermission(permission: Partial<Permission>): Promise<Permission> {
        const response = await NetworkService.requestJson<Permission>({
            method: 'POST',
            url: '/api/permissions/v1',
            data: permission,
        });
        return response.result as Permission;
    }

    static async getPermissionById(id: number): Promise<Permission> {
        const response = await NetworkService.requestJson<Permission>({
            method: 'GET',
            url: `/api/permissions/v1/${id}`,
        });
        return response.result as Permission;
    }

    static async updatePermission(permission: Permission): Promise<Permission> {
        const response = await NetworkService.requestJson<Permission>({
            method: 'PUT',
            url: '/api/permissions/v1',
            data: permission,
        });
        return response.result as Permission;
    }

    static async deletePermission(id: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: `/api/permissions/v1/${id}`,
        });
        return response.result;
    }
}
