import { Role } from '@/types/Role';
import { NetworkService } from './NetworkService';

export class RoleService {
    static async getAllRoles(): Promise<Role[]> {
        const response = await NetworkService.requestJson<Role[]>({
            method: 'GET',
            url: '/api/roles/v1',
        });
        return response.result as Role[];
    }

    static async getRolesForPicking(): Promise<Role[]> {
        const response = await NetworkService.requestJson<Role[]>({
            method: 'GET',
            url: '/api/roles/v1/picking',
        });
        return response.result as Role[];
    }

    static async getRoleById(id: number): Promise<Role> {
        const response = await NetworkService.requestJson<Role>({
            method: 'GET',
            url: `/api/roles/v1/${id}`,
        });
        return response.result as Role;
    }

    static async createRole(role: Partial<Role>): Promise<Role> {
        const response = await NetworkService.requestJson<Role>({
            method: 'POST',
            url: '/api/roles/v1',
            data: role,
        });
        return response.result as Role;
    }

    static async updateRole(role: Pick<Role, 'roleId' | 'description' | 'permissionIds'>): Promise<Role> {
        const response = await NetworkService.requestJson<Role>({
            method: 'PUT',
            url: '/api/roles/v1',
            data: role,
        });
        return response.result as Role;
    }

    static async deleteRole(id: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: `/api/roles/v1/${id}`,
        });
        return response.result;
    }
}
