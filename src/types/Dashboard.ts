export interface DashboardEfficiencyResponse {
    totalEfficiencyPercentage: number | null;
    efficiencyDeltaPercentage: number | null;
}

export interface DashboardDowntimeResponse {
    totalDowntimeSeconds: number;
}

export interface DashboardProductionResponse {
    actualQuantity: number;
    plannedQuantity: number;
    productionRatioPercentage: number | null;
}

export interface DashboardFilterQueryParams {
    spaceId: number;
    filterId: number;
    shiftFilterId?: number | null;
}

export interface DashboardDateRangeQueryParams {
    spaceId: number;
    startDate: string;
    endDate: string;
    filterId?: number | null;
}

export interface DashboardKpiSummaryState {
    efficiency: DashboardEfficiencyResponse | null;
    downtime: DashboardDowntimeResponse | null;
    production: DashboardProductionResponse | null;
    isLoading: boolean;
}
