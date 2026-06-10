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
import {
    ErrorCountChartResponse,
    MachineErrorDetailResponse,
    MachineStatusLogChartResponse,
    MachineStatusSummaryResponse,
    MtbfChartResponse,
    MttrChartResponse,
} from '@/types/Monitoring';
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

    static async getRootSpacesForRegistration(): Promise<SpacePickingResponse[]> {
        const response = await NetworkService.requestJson<SpacePickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.SPACES.PICKING_REGISTRATION,
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

    static async getSpaceOverview(spaceId: number, filterId: number): Promise<SpaceOverview> {
        const response = await NetworkService.requestJson<SpaceOverview>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.OVERVIEW_BY_FILTER}?spaceId=${spaceId}&filterId=${filterId}`,
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

    // Error Count Chart
    static async getErrorCountByFilter(
        filterId: number,
        spaceId: number
    ): Promise<ErrorCountChartResponse> {
        const response = await NetworkService.requestJson<ErrorCountChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.ERROR_COUNT_BY_FILTER}?filterId=${filterId}&spaceId=${spaceId}`,
        });
        return response.result as ErrorCountChartResponse;
    }

    static async getErrorCountByDateRange(
        startDate: string,
        endDate: string,
        spaceId: number
    ): Promise<ErrorCountChartResponse> {
        const response = await NetworkService.requestJson<ErrorCountChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.ERROR_COUNT_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&spaceId=${spaceId}`,
        });
        return response.result as ErrorCountChartResponse;
    }

    // MTBF Chart
    static async getMtbfByFilter(filterId: number, spaceId: number): Promise<MtbfChartResponse> {
        const response = await NetworkService.requestJson<MtbfChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.MTBF_BY_FILTER}?filterId=${filterId}&spaceId=${spaceId}`,
        });
        return response.result as MtbfChartResponse;
    }

    static async getMtbfByDateRange(
        startDate: string,
        endDate: string,
        spaceId: number
    ): Promise<MtbfChartResponse> {
        const response = await NetworkService.requestJson<MtbfChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.MTBF_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&spaceId=${spaceId}`,
        });
        return response.result as MtbfChartResponse;
    }

    // MTTR Chart
    static async getMttrByFilter(filterId: number, spaceId: number): Promise<MttrChartResponse> {
        const response = await NetworkService.requestJson<MttrChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.MTTR_BY_FILTER}?filterId=${filterId}&spaceId=${spaceId}`,
        });
        return response.result as MttrChartResponse;
    }

    static async getMttrByDateRange(
        startDate: string,
        endDate: string,
        spaceId: number
    ): Promise<MttrChartResponse> {
        const response = await NetworkService.requestJson<MttrChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.MTTR_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&spaceId=${spaceId}`,
        });
        return response.result as MttrChartResponse;
    }

    // Machine Status Summary
    static async getMachineStatusSummaryByFilter(
        filterId: number,
        spaceId: number
    ): Promise<MachineStatusSummaryResponse> {
        const response = await NetworkService.requestJson<{ data: MachineStatusSummaryResponse }>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.MACHINE_STATUS_SUMMARY_BY_FILTER}?filterId=${filterId}&spaceId=${spaceId}`,
        });
        return response.result as unknown as MachineStatusSummaryResponse;
    }

    static async getMachineStatusSummaryByDateRange(
        startDate: string,
        endDate: string,
        spaceId: number,
        filterId?: number
    ): Promise<MachineStatusSummaryResponse> {
        let url = `${ENDPOINTS.SPACES.MONITORING.MACHINE_STATUS_SUMMARY_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&spaceId=${spaceId}`;
        if (filterId != null) url += `&filterId=${filterId}`;
        const response = await NetworkService.requestJson<{ data: MachineStatusSummaryResponse }>({
            method: 'GET',
            url,
        });
        return response.result as unknown as MachineStatusSummaryResponse;
    }

    // Machine Error Detail
    static async getErrorDetailByFilter(
        filterId: number,
        machineId: string
    ): Promise<MachineErrorDetailResponse> {
        const response = await NetworkService.requestJson<{ data: MachineErrorDetailResponse }>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.ERROR_DETAIL_BY_FILTER}?filterId=${filterId}&machineId=${machineId}`,
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

    // Machine Status Log Chart
    static async getMachineStatusLogChartByFilter(
        filterId: number,
        machineId: string
    ): Promise<MachineStatusLogChartResponse> {
        const response = await NetworkService.requestJson<MachineStatusLogChartResponse>({
            method: 'GET',
            url: `${ENDPOINTS.SPACES.MONITORING.MACHINE_STATUS_LOG_CHART_BY_FILTER}?filterId=${filterId}&machineId=${machineId}`,
        });
        return response.result as MachineStatusLogChartResponse;
    }

    static async getMachineStatusLogChartByDateRange(
        startDate: string,
        endDate: string,
        machineId: string,
        filterId?: number
    ): Promise<MachineStatusLogChartResponse> {
        let url = `${ENDPOINTS.SPACES.MONITORING.MACHINE_STATUS_LOG_CHART_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&machineId=${machineId}`;
        if (filterId != null) url += `&filterId=${filterId}`;
        const response = await NetworkService.requestJson<MachineStatusLogChartResponse>({
            method: 'GET',
            url,
        });
        return response.result as MachineStatusLogChartResponse;
    }
}
