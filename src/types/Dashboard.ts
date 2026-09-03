export interface DashboardEfficiencyResponse {
    totalEfficiencyPercentage: number | null;
    efficiencyDeltaPercentage: number | null;
}

export interface DashboardDowntimeResponse {
    totalDowntimeSeconds: number;
}

export interface DashboardRuntimeResponse {
    totalRuntimeSeconds: number;
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
    runtime: DashboardRuntimeResponse | null;
    production: DashboardProductionResponse | null;
    isLoading: boolean;
}

export interface DashboardMachineEfficiencyResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    efficiencyPercentage: number | null;
}

export interface DashboardMachineProductionResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    plannedQuantity: number;
    actualQuantity: number;
}

export interface DashboardItemProductionResponse {
    productionPlanCode: string;
    productionPlanName: string;
    plannedQuantity: number;
    actualQuantity: number;
}

export interface DashboardChartsSummaryState {
    machineEfficiency: DashboardMachineEfficiencyResponse[] | null;
    machineProduction: DashboardMachineProductionResponse[] | null;
    itemProduction: DashboardItemProductionResponse[] | null;
    isLoading: boolean;
}
