import {
    DowntimeMachineRollupResponse,
    DowntimeMachineIncidentResponse,
    DowntimeMachinesFilterParams,
    DowntimeMachinesDateRangeParams,
    DowntimeMachineIncidentsFilterParams,
    DowntimeMachineIncidentsDateRangeParams,
} from '@/types/Downtime';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class DowntimeService {
    /**
     * Get machine downtime rollup list by filter
     */
    static async getMachinesByFilter(
        params: DowntimeMachinesFilterParams
    ): Promise<DowntimeMachineRollupResponse> {
        const queryParams: Record<string, any> = {
            filterId: params.filterId,
        };
        if (params.spaceId !== undefined && params.spaceId !== null) {
            queryParams.spaceId = params.spaceId;
        }
        if (params.keyword?.trim()) {
            queryParams.keyword = params.keyword.trim();
        }
        if (params.page !== undefined) {
            queryParams.page = params.page;
        }
        if (params.size !== undefined) {
            queryParams.size = params.size;
        }

        const response = await NetworkService.requestJson<DowntimeMachineRollupResponse>({
            method: 'GET',
            url: ENDPOINTS.DOWNTIME.MACHINES_BY_FILTER,
            data: queryParams,
        });
        return response.result as DowntimeMachineRollupResponse;
    }

    /**
     * Get machine downtime rollup list by date range
     */
    static async getMachinesByDateRange(
        params: DowntimeMachinesDateRangeParams
    ): Promise<DowntimeMachineRollupResponse> {
        const queryParams: Record<string, any> = {
            startDate: params.startDate,
            endDate: params.endDate,
        };
        if (params.spaceId !== undefined && params.spaceId !== null) {
            queryParams.spaceId = params.spaceId;
        }
        if (params.keyword?.trim()) {
            queryParams.keyword = params.keyword.trim();
        }
        if (params.page !== undefined) {
            queryParams.page = params.page;
        }
        if (params.size !== undefined) {
            queryParams.size = params.size;
        }

        const response = await NetworkService.requestJson<DowntimeMachineRollupResponse>({
            method: 'GET',
            url: ENDPOINTS.DOWNTIME.MACHINES_BY_DATE_RANGE,
            data: queryParams,
        });
        return response.result as DowntimeMachineRollupResponse;
    }

    /**
     * Get machine incidents history by filter
     */
    static async getMachineIncidentsByFilter(
        params: DowntimeMachineIncidentsFilterParams
    ): Promise<DowntimeMachineIncidentResponse> {
        const queryParams: Record<string, any> = {
            filterId: params.filterId,
        };
        if (params.page !== undefined) {
            queryParams.page = params.page;
        }
        if (params.size !== undefined) {
            queryParams.size = params.size;
        }
        if (params.sort) {
            queryParams.sort = params.sort;
        }

        const response = await NetworkService.requestJson<DowntimeMachineIncidentResponse>({
            method: 'GET',
            url: ENDPOINTS.DOWNTIME.MACHINE_INCIDENTS_BY_FILTER(params.machineId),
            data: queryParams,
        });
        return response.result as DowntimeMachineIncidentResponse;
    }

    /**
     * Get machine incidents history by date range
     */
    static async getMachineIncidentsByDateRange(
        params: DowntimeMachineIncidentsDateRangeParams
    ): Promise<DowntimeMachineIncidentResponse> {
        const queryParams: Record<string, any> = {
            startDate: params.startDate,
            endDate: params.endDate,
        };
        if (params.page !== undefined) {
            queryParams.page = params.page;
        }
        if (params.size !== undefined) {
            queryParams.size = params.size;
        }
        if (params.sort) {
            queryParams.sort = params.sort;
        }

        const response = await NetworkService.requestJson<DowntimeMachineIncidentResponse>({
            method: 'GET',
            url: ENDPOINTS.DOWNTIME.MACHINE_INCIDENTS_BY_DATE_RANGE(params.machineId),
            data: queryParams,
        });
        return response.result as DowntimeMachineIncidentResponse;
    }
}
