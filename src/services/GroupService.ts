import { GroupFormData, UserGroup } from '@/types/UserGroup';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class GroupService {
    static async getAllGroupsPicking(): Promise<UserGroup[]> {
        const response = await NetworkService.requestJson<UserGroup[]>({
            method: 'GET',
            url: ENDPOINTS.GROUPS.PICKING,
        });

        return response.result!;
    }
    static async getAllGroups(): Promise<UserGroup[]> {
        const response = await NetworkService.requestJson<UserGroup[]>({
            method: 'GET',
            url: ENDPOINTS.GROUPS.BASE,
        });

        return response.result!;
    }

    static async getGroupById(groupId: number): Promise<UserGroup> {
        const response = await NetworkService.requestJson<UserGroup>({
            method: 'GET',
            url: ENDPOINTS.GROUPS.DETAIL(groupId),
        });

        return response.result!;
    }

    static async createGroup(group: GroupFormData): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'POST',
            url: ENDPOINTS.GROUPS.BASE,
            data: group,
        });

        return response.message as string;
    }

    static async updateGroup(group: GroupFormData): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'PUT',
            url: ENDPOINTS.GROUPS.BASE,
            data: group,
        });

        return response.message as string;
    }

    static async deleteGroup(groupId: number): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'DELETE',
            url: ENDPOINTS.GROUPS.DETAIL(groupId),
        });

        return response.message as string;
    }
}
