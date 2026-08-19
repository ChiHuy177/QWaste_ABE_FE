import {
    DashboardEfficiencyResponse,
    DashboardDowntimeResponse,
    DashboardProductionResponse,
    DashboardFilterQueryParams,
    DashboardDateRangeQueryParams,
} from '@/types/Dashboard';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class DashboardService {
    /**
     * Widget 1: Efficiency by Filter
     */
    static async getEfficiencyByFilter(
        params: DashboardFilterQueryParams
    ): Promise<DashboardEfficiencyResponse> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            filterId: params.filterId,
        };
        if (params.shiftFilterId) {
            queryParams.shiftFilterId = params.shiftFilterId;
        }

        const response = await NetworkService.requestJson<DashboardEfficiencyResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.EFFICIENCY_BY_FILTER,
            data: queryParams,
        });
        return response.result as DashboardEfficiencyResponse;
    }

    /**
     * Widget 1: Efficiency by Date Range
     */
    static async getEfficiencyByDateRange(
        params: DashboardDateRangeQueryParams
    ): Promise<DashboardEfficiencyResponse> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            startDate: params.startDate,
            endDate: params.endDate,
        };
        if (params.filterId) {
            queryParams.filterId = params.filterId;
        }

        const response = await NetworkService.requestJson<DashboardEfficiencyResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.EFFICIENCY_BY_DATE_RANGE,
            data: queryParams,
        });
        return response.result as DashboardEfficiencyResponse;
    }

    /**
     * Widget 2: Downtime by Filter
     */
    static async getDowntimeByFilter(
        params: DashboardFilterQueryParams
    ): Promise<DashboardDowntimeResponse> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            filterId: params.filterId,
        };
        if (params.shiftFilterId) {
            queryParams.shiftFilterId = params.shiftFilterId;
        }

        const response = await NetworkService.requestJson<DashboardDowntimeResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.DOWNTIME_BY_FILTER,
            data: queryParams,
        });
        return response.result as DashboardDowntimeResponse;
    }

    /**
     * Widget 2: Downtime by Date Range
     */
    static async getDowntimeByDateRange(
        params: DashboardDateRangeQueryParams
    ): Promise<DashboardDowntimeResponse> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            startDate: params.startDate,
            endDate: params.endDate,
        };
        if (params.filterId) {
            queryParams.filterId = params.filterId;
        }

        const response = await NetworkService.requestJson<DashboardDowntimeResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.DOWNTIME_BY_DATE_RANGE,
            data: queryParams,
        });
        return response.result as DashboardDowntimeResponse;
    }

    /**
     * Widget 3 & 4: Production Summary by Filter
     */
    static async getProductionByFilter(params: {
        spaceId: number;
        filterId: number;
    }): Promise<DashboardProductionResponse> {
        const response = await NetworkService.requestJson<DashboardProductionResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.PRODUCTION_BY_FILTER,
            data: {
                spaceId: params.spaceId,
                filterId: params.filterId,
            },
        });
        return response.result as DashboardProductionResponse;
    }

    /**
     * Widget 3 & 4: Production Summary by Date Range
     */
    static async getProductionByDateRange(params: {
        spaceId: number;
        startDate: string;
        endDate: string;
    }): Promise<DashboardProductionResponse> {
        const response = await NetworkService.requestJson<DashboardProductionResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.PRODUCTION_BY_DATE_RANGE,
            data: {
                spaceId: params.spaceId,
                startDate: params.startDate,
                endDate: params.endDate,
            },
        });
        return response.result as DashboardProductionResponse;
    }

    /**
     * Helper to fetch all 4 Dashboard KPI widgets in parallel
     */
    static async getOverviewKpis(params: {
        spaceId: number;
        mode: 'PRESET' | 'CUSTOM_RANGE';
        filterId?: number | null;
        shiftFilterId?: number | null;
        isShiftFilter?: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        efficiency: DashboardEfficiencyResponse | null;
        downtime: DashboardDowntimeResponse | null;
        production: DashboardProductionResponse | null;
    }> {
        const { spaceId, mode, filterId, shiftFilterId, isShiftFilter, startDate, endDate } =
            params;

        let efficiencyPromise: Promise<DashboardEfficiencyResponse>;
        let downtimePromise: Promise<DashboardDowntimeResponse>;
        let productionPromise: Promise<DashboardProductionResponse>;

        if (mode === 'CUSTOM_RANGE' && startDate && endDate) {
            efficiencyPromise = this.getEfficiencyByDateRange({
                spaceId,
                startDate,
                endDate,
                filterId: isShiftFilter ? filterId : undefined,
            });
            downtimePromise = this.getDowntimeByDateRange({
                spaceId,
                startDate,
                endDate,
                filterId: isShiftFilter ? filterId : undefined,
            });
            productionPromise = this.getProductionByDateRange({
                spaceId,
                startDate,
                endDate,
            });
        } else if (filterId) {
            efficiencyPromise = this.getEfficiencyByFilter({
                spaceId,
                filterId,
                shiftFilterId,
            });
            downtimePromise = this.getDowntimeByFilter({
                spaceId,
                filterId,
                shiftFilterId,
            });
            productionPromise = this.getProductionByFilter({
                spaceId,
                filterId,
            });
        } else {
            return { efficiency: null, downtime: null, production: null };
        }

        const [effRes, downRes, prodRes] = await Promise.allSettled([
            efficiencyPromise,
            downtimePromise,
            productionPromise,
        ]);

        return {
            efficiency: effRes.status === 'fulfilled' ? effRes.value : null,
            downtime: downRes.status === 'fulfilled' ? downRes.value : null,
            production: prodRes.status === 'fulfilled' ? prodRes.value : null,
        };
    }
}
