export interface MachineErrorDetailItem {
    id?: number | string;
    machineId?: string;
    errorName?: string;
    logStatus?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    reason?: string;
    [key: string]: unknown;
}

export interface MachineErrorDetailResponse {
    totalErrorHours?: number;
    errors: MachineErrorDetailItem[];
}

export interface MachineStatusSummaryItem {
    machineId: string;
    machineName: string;
    totalRuntimeHours: number;
    totalIdleHours: number;
    totalErrorHours: number;
    totalOfflineHours: number;
}

export interface MachineStatusSummaryResponse {
    data: MachineStatusSummaryItem[];
}

export interface MachineChartDataPoint {
    label: string;
    value: number;
}

export interface MachineChartSeries {
    machineId: string;
    machineName: string;
    dataPoints: MachineChartDataPoint[];
}

export interface MtbfChartResponse {
    series: MachineChartSeries[];
}

export interface MttrChartResponse {
    series: MachineChartSeries[];
}

export interface MachineStatusLogChartDataPoint {
    label: string;
    hours?: number;
    value?: number;
}

export interface MachineStatusLogChartSeries {
    status: string;
    data: MachineStatusLogChartDataPoint[];
}

export interface MachineStatusLogChartResponse {
    series: MachineStatusLogChartSeries[];
}

export type StatusLogSeries = MachineStatusLogChartSeries;
