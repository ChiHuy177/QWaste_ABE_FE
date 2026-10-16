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

export type MachineProductionBucketGranularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface DashboardMachineProductionBucket {
    bucketStart: string;
    bucketEnd: string;
    plannedQuantity: number | null;
    actualQuantity: number;
    productionRatioPercentage: number | null;
    shiftId?: number | null;
    shiftLabel?: string | null;
}

export interface DashboardMachineProductionSeriesResponse {
    rangeStart: string;
    rangeEnd: string;
    bucketGranularity: MachineProductionBucketGranularity;
    machineId: string;
    machineName: string;
    machineCode: string;
    buckets: DashboardMachineProductionBucket[];
}

export interface DashboardMachineProductionSeriesFilterParams {
    machineId: string;
    filterId: number;
    shiftFilterId?: number | null;
}

export interface DashboardMachineProductionSeriesDateRangeParams {
    machineId: string;
    startDate: string;
    endDate: string;
    filterId?: number | null;
}

export interface SingleMachinePerformanceBucket {
    bucketStart: string;
    bucketEnd: string;
    plannedWorkingSeconds: number;
    runtimeSeconds: number;
    downtimeSeconds: number;
    efficiencyPercentage: number | null;
    shiftId?: number | null;
    shiftLabel?: string | null;
}

export interface SingleMachinePerformanceResponse {
    rangeStart: string;
    rangeEnd: string;
    bucketGranularity: MachineProductionBucketGranularity;
    machineId: string;
    machineName: string;
    machineCode: string | null;
    buckets: SingleMachinePerformanceBucket[];
}

export interface SpacePerformanceReportResponse {
    rangeStart: string;
    rangeEnd: string;
    bucketGranularity: MachineProductionBucketGranularity;
    machines: Array<{
        machineId: string;
        machineName: string;
        machineCode: string | null;
        buckets: SingleMachinePerformanceBucket[];
    }>;
}

export interface SingleMachinePerformanceFilterParams {
    machineId: string;
    filterId: number;
    shiftFilterId?: number | null;
}

export interface SingleMachinePerformanceDateRangeParams {
    machineId: string;
    startDate: string;
    endDate: string;
    filterId?: number | null;
}

// Single Machine KPI Summary Widget Types (§3 in DASHBOARD_KPI_WIDGETS_SINGLE_MACHINE.md)
export interface DashboardMachineEfficiencySummaryResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    efficiencyPercentage: number | null;
    efficiencyDeltaPercentage: number | null;
}

export interface DashboardMachineCapacitySummaryResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    plannedWorkingSeconds: number;
}

export interface DashboardMachineDowntimeSummaryResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    downtimeSeconds: number;
}

export interface DashboardMachineProductionSummaryResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    actualQuantity: number;
    plannedQuantity: number;
    productionRatioPercentage: number | null;
}

export interface DashboardMachineRuntimeSummaryResponse {
    machineId: string;
    machineName: string;
    machineCode: string | null;
    runtimeSeconds: number;
}

export interface SingleMachineKpiSummaryState {
    efficiency: DashboardMachineEfficiencySummaryResponse | null;
    capacity: DashboardMachineCapacitySummaryResponse | null;
    downtime: DashboardMachineDowntimeSummaryResponse | null;
    production: DashboardMachineProductionSummaryResponse | null;
    runtime: DashboardMachineRuntimeSummaryResponse | null;
    isLoading?: boolean;
}

export interface SingleMachineKpiFilterQueryParams {
    machineId: string;
    filterId: number;
    shiftFilterId?: number | null;
}

export interface SingleMachineKpiDateRangeQueryParams {
    machineId: string;
    startDate: string;
    endDate: string;
    filterId?: number | null;
}
