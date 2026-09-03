import {
    DashboardEfficiencyResponse,
    DashboardDowntimeResponse,
    DashboardRuntimeResponse,
    DashboardProductionResponse,
    DashboardFilterQueryParams,
    DashboardDateRangeQueryParams,
    DashboardMachineEfficiencyResponse,
    DashboardMachineProductionResponse,
    DashboardItemProductionResponse,
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
     * Widget 5: Runtime by Filter
     */
    static async getRuntimeByFilter(
        params: DashboardFilterQueryParams
    ): Promise<DashboardRuntimeResponse> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            filterId: params.filterId,
        };
        if (params.shiftFilterId) {
            queryParams.shiftFilterId = params.shiftFilterId;
        }

        const response = await NetworkService.requestJson<DashboardRuntimeResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.RUNTIME_BY_FILTER,
            data: queryParams,
        });
        return response.result as DashboardRuntimeResponse;
    }

    /**
     * Widget 5: Runtime by Date Range
     */
    static async getRuntimeByDateRange(
        params: DashboardDateRangeQueryParams
    ): Promise<DashboardRuntimeResponse> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            startDate: params.startDate,
            endDate: params.endDate,
        };
        if (params.filterId) {
            queryParams.filterId = params.filterId;
        }

        const response = await NetworkService.requestJson<DashboardRuntimeResponse>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.RUNTIME_BY_DATE_RANGE,
            data: queryParams,
        });
        return response.result as DashboardRuntimeResponse;
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
     * Chart 1: Efficiency by Machine (by Filter)
     */
    static async getMachineEfficiencyByFilter(
        params: DashboardFilterQueryParams
    ): Promise<DashboardMachineEfficiencyResponse[]> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            filterId: params.filterId,
        };
        if (params.shiftFilterId) {
            queryParams.shiftFilterId = params.shiftFilterId;
        }

        const response = await NetworkService.requestJson<DashboardMachineEfficiencyResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.EFFICIENCY_BY_MACHINE_BY_FILTER,
            data: queryParams,
        });
        return (response.result as DashboardMachineEfficiencyResponse[]) || [];
    }

    /**
     * Chart 1: Efficiency by Machine (by Date Range)
     */
    static async getMachineEfficiencyByDateRange(
        params: DashboardDateRangeQueryParams
    ): Promise<DashboardMachineEfficiencyResponse[]> {
        const queryParams: Record<string, any> = {
            spaceId: params.spaceId,
            startDate: params.startDate,
            endDate: params.endDate,
        };
        if (params.filterId) {
            queryParams.filterId = params.filterId;
        }

        const response = await NetworkService.requestJson<DashboardMachineEfficiencyResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.EFFICIENCY_BY_MACHINE_BY_DATE_RANGE,
            data: queryParams,
        });
        return (response.result as DashboardMachineEfficiencyResponse[]) || [];
    }

    /**
     * Chart 2: Planned vs Actual Production by Machine (by Filter)
     */
    static async getMachineProductionByFilter(params: {
        spaceId: number;
        filterId: number;
    }): Promise<DashboardMachineProductionResponse[]> {
        const response = await NetworkService.requestJson<DashboardMachineProductionResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.PRODUCTION_BY_MACHINE_BY_FILTER,
            data: {
                spaceId: params.spaceId,
                filterId: params.filterId,
            },
        });
        return (response.result as DashboardMachineProductionResponse[]) || [];
    }

    /**
     * Chart 2: Planned vs Actual Production by Machine (by Date Range)
     */
    static async getMachineProductionByDateRange(params: {
        spaceId: number;
        startDate: string;
        endDate: string;
    }): Promise<DashboardMachineProductionResponse[]> {
        const response = await NetworkService.requestJson<DashboardMachineProductionResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.PRODUCTION_BY_MACHINE_BY_DATE_RANGE,
            data: {
                spaceId: params.spaceId,
                startDate: params.startDate,
                endDate: params.endDate,
            },
        });
        return (response.result as DashboardMachineProductionResponse[]) || [];
    }

    /**
     * Chart 3: Planned vs Actual Production by Item / SKU (by Filter)
     */
    static async getItemProductionByFilter(params: {
        spaceId: number;
        filterId: number;
    }): Promise<DashboardItemProductionResponse[]> {
        const response = await NetworkService.requestJson<DashboardItemProductionResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.PRODUCTION_BY_ITEM_BY_FILTER,
            data: {
                spaceId: params.spaceId,
                filterId: params.filterId,
            },
        });
        return (response.result as DashboardItemProductionResponse[]) || [];
    }

    /**
     * Chart 3: Planned vs Actual Production by Item / SKU (by Date Range)
     */
    static async getItemProductionByDateRange(params: {
        spaceId: number;
        startDate: string;
        endDate: string;
    }): Promise<DashboardItemProductionResponse[]> {
        const response = await NetworkService.requestJson<DashboardItemProductionResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DASHBOARD.PRODUCTION_BY_ITEM_BY_DATE_RANGE,
            data: {
                spaceId: params.spaceId,
                startDate: params.startDate,
                endDate: params.endDate,
            },
        });
        return (response.result as DashboardItemProductionResponse[]) || [];
    }

    /**
     * Helper to fetch all 5 Dashboard KPI widgets in parallel
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
        runtime: DashboardRuntimeResponse | null;
        production: DashboardProductionResponse | null;
    }> {
        const { spaceId, mode, filterId, shiftFilterId, isShiftFilter, startDate, endDate } =
            params;

        let efficiencyPromise: Promise<DashboardEfficiencyResponse>;
        let downtimePromise: Promise<DashboardDowntimeResponse>;
        let runtimePromise: Promise<DashboardRuntimeResponse>;
        let productionPromise: Promise<DashboardProductionResponse> | null = null;

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
            runtimePromise = this.getRuntimeByDateRange({
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
            runtimePromise = this.getRuntimeByFilter({
                spaceId,
                filterId,
                shiftFilterId,
            });
            // Production endpoint does NOT support SHIFT filters (returns 400 error 912)
            if (!isShiftFilter && !shiftFilterId) {
                productionPromise = this.getProductionByFilter({
                    spaceId,
                    filterId,
                });
            }
        } else {
            return { efficiency: null, downtime: null, runtime: null, production: null };
        }

        const [effRes, downRes, runRes, prodRes] = await Promise.allSettled([
            efficiencyPromise,
            downtimePromise,
            runtimePromise,
            productionPromise ?? Promise.resolve(null as any),
        ]);

        return {
            efficiency: effRes.status === 'fulfilled' ? effRes.value : null,
            downtime: downRes.status === 'fulfilled' ? downRes.value : null,
            runtime: runRes.status === 'fulfilled' ? runRes.value : null,
            production: prodRes.status === 'fulfilled' && productionPromise ? prodRes.value : null,
        };
    }

    /**
     * Helper to fetch all 3 Dashboard Chart Visualizations in parallel
     */
    static async getDashboardCharts(params: {
        spaceId: number;
        mode: 'PRESET' | 'CUSTOM_RANGE';
        filterId?: number | null;
        shiftFilterId?: number | null;
        isShiftFilter?: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        machineEfficiency: DashboardMachineEfficiencyResponse[] | null;
        machineProduction: DashboardMachineProductionResponse[] | null;
        itemProduction: DashboardItemProductionResponse[] | null;
    }> {
        const { spaceId, mode, filterId, shiftFilterId, isShiftFilter, startDate, endDate } =
            params;

        let machineEffPromise: Promise<DashboardMachineEfficiencyResponse[]>;
        let machineProdPromise: Promise<DashboardMachineProductionResponse[]> | null = null;
        let itemProdPromise: Promise<DashboardItemProductionResponse[]> | null = null;

        if (mode === 'CUSTOM_RANGE' && startDate && endDate) {
            machineEffPromise = this.getMachineEfficiencyByDateRange({
                spaceId,
                startDate,
                endDate,
                filterId: isShiftFilter ? filterId : undefined,
            });
            machineProdPromise = this.getMachineProductionByDateRange({
                spaceId,
                startDate,
                endDate,
            });
            itemProdPromise = this.getItemProductionByDateRange({
                spaceId,
                startDate,
                endDate,
            });
        } else if (filterId) {
            machineEffPromise = this.getMachineEfficiencyByFilter({
                spaceId,
                filterId,
                shiftFilterId,
            });
            // Chart 2 & 3 only support PERIOD filters (not SHIFT filters)
            if (!isShiftFilter && !shiftFilterId) {
                machineProdPromise = this.getMachineProductionByFilter({
                    spaceId,
                    filterId,
                });
                itemProdPromise = this.getItemProductionByFilter({
                    spaceId,
                    filterId,
                });
            }
        } else {
            return { machineEfficiency: null, machineProduction: null, itemProduction: null };
        }

        const [machineEffRes, machineProdRes, itemProdRes] = await Promise.allSettled([
            machineEffPromise,
            machineProdPromise ?? Promise.resolve([]),
            itemProdPromise ?? Promise.resolve([]),
        ]);

        return {
            machineEfficiency: machineEffRes.status === 'fulfilled' ? machineEffRes.value : null,
            machineProduction:
                machineProdRes.status === 'fulfilled' && machineProdPromise
                    ? machineProdRes.value
                    : null,
            itemProduction:
                itemProdRes.status === 'fulfilled' && itemProdPromise ? itemProdRes.value : null,
        };
    }
}
