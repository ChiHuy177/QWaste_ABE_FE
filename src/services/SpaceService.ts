import {
    SpaceDetailResponse,
    SpaceWithChildrenResponse,
    SpacePickingResponse,
    SpaceCRUDResponse,
    SpaceCreationRequest,
    SpaceUpdationRequest,
    SpaceOverview,
    SpacePickingWithChildren,
} from '@/types/Space';
import { MachineErrorDetailResponse } from '@/types/Monitoring';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class SpaceService {
    static async getSpaceById(spaceId: number | string): Promise<SpaceDetailResponse> {
        const response = await NetworkService.requestJson<SpaceDetailResponse>({
            method: 'GET',
            url: ENDPOINTS.SPACES.DETAIL(spaceId),
        });
        return response.result as SpaceDetailResponse;
    }

    static async getAllSpacesTree(): Promise<SpaceWithChildrenResponse[]> {
        const response = await NetworkService.requestJson<SpaceWithChildrenResponse[]>({
            method: 'GET',
            url: ENDPOINTS.SPACES.ALL,
        });
        return response.result as SpaceWithChildrenResponse[];
    }

    static async getSpacesByLevelWithChildren(level: number): Promise<SpacePickingWithChildren[]> {
        const response = await NetworkService.requestJson<SpacePickingWithChildren[]>({
            method: 'GET',
            url: ENDPOINTS.SPACES.PICKING_BY_LEVEL_WITH_CHILDREN(level),
        });
        return response.result as SpacePickingWithChildren[];
    }

    static async getSpacesByLevel(level: number): Promise<SpacePickingWithChildren[]> {
        const response = await NetworkService.requestJson<SpacePickingWithChildren[]>({
            method: 'GET',
            url: ENDPOINTS.SPACES.PICKING_BY_LEVEL(level),
        });
        return response.result as SpacePickingWithChildren[];
    }

    static async getSpacesFromLevelToLevel(
        fromLevel: number,
        toLevel: number
    ): Promise<SpacePickingWithChildren[]> {
        const response = await NetworkService.requestJson<SpacePickingWithChildren[]>({
            method: 'GET',
            url: ENDPOINTS.SPACES.PICKING_FROM_LEVEL_TO_LEVEL(fromLevel, toLevel),
        });
        return response.result as SpacePickingWithChildren[];
    }

    static async getRootSpacesForRegistration(): Promise<SpacePickingResponse[]> {
        const response = await NetworkService.requestJson<SpacePickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.SPACES.PICKING_REGISTRATION,
            skipAuthHandling: true,
        });
        return response.result as SpacePickingResponse[];
    }

    static async createSpace(spaceData: SpaceCreationRequest): Promise<SpaceCRUDResponse> {
        const response = await NetworkService.requestJson<SpaceCRUDResponse>({
            method: 'POST',
            url: ENDPOINTS.SPACES.ALL,
            data: spaceData,
        });
        return response.result as SpaceCRUDResponse;
    }

    static async updateSpace(spaceData: SpaceUpdationRequest): Promise<SpaceCRUDResponse> {
        const response = await NetworkService.requestJson<SpaceCRUDResponse>({
            method: 'PUT',
            url: ENDPOINTS.SPACES.ALL,
            data: spaceData,
        });
        return response.result as SpaceCRUDResponse;
    }

    static async deleteSpace(spaceId: number | string): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.SPACES.DETAIL(spaceId),
        });
    }

    static async getSpaceOverview(
        spaceId: number,
        filterId: number,
        shiftFilterId?: number | null
    ): Promise<SpaceOverview> {
        let url = `${ENDPOINTS.SPACES.MONITORING.OVERVIEW_BY_FILTER}?spaceId=${spaceId}&filterId=${filterId}`;
        if (shiftFilterId != null) url += `&shiftFilterId=${shiftFilterId}`;
        const response = await NetworkService.requestJson<SpaceOverview>({
            method: 'GET',
            url,
        });
        return response.result as SpaceOverview;
    }

    static async getSpaceOverviewByDateRange(
        spaceId: number,
        startDate: string,
        endDate: string,
        filterId?: number
    ): Promise<SpaceOverview> {
        let url = `${ENDPOINTS.SPACES.MONITORING.OVERVIEW_BY_DATE_RANGE}?spaceId=${spaceId}&startDate=${startDate}&endDate=${endDate}`;
        if (filterId !== undefined) {
            url += `&filterId=${filterId}`;
        }
        const response = await NetworkService.requestJson<SpaceOverview>({
            method: 'GET',
            url,
        });
        return response.result as SpaceOverview;
    }

    // Machine Error Detail
    static async getErrorDetailByFilter(
        filterId: number,
        machineId: string,
        shiftFilterId?: number | null
    ): Promise<MachineErrorDetailResponse> {
        let url = `${ENDPOINTS.SPACES.MONITORING.ERROR_DETAIL_BY_FILTER}?filterId=${filterId}&machineId=${machineId}`;
        if (shiftFilterId != null) url += `&shiftFilterId=${shiftFilterId}`;
        const response = await NetworkService.requestJson<{ data: MachineErrorDetailResponse }>({
            method: 'GET',
            url,
        });
        return response.result as unknown as MachineErrorDetailResponse;
    }

    static async getErrorDetailByDateRange(
        startDate: string,
        endDate: string,
        machineId: string,
        filterId?: number
    ): Promise<MachineErrorDetailResponse> {
        let url = `${ENDPOINTS.SPACES.MONITORING.ERROR_DETAIL_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&machineId=${machineId}`;
        if (filterId != null) url += `&filterId=${filterId}`;
        const response = await NetworkService.requestJson<{ data: MachineErrorDetailResponse }>({
            method: 'GET',
            url,
        });
        return response.result as unknown as MachineErrorDetailResponse;
    }
}
