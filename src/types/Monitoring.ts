export interface MachineErrorCountDataPoint {
    label: string;
    value: number; // Long - error count
}

export interface MachineChartDataPoint {
    label: string;
    value: number; // Double for MTBF/MTTR (hours), Long for error count
}

export interface MachineErrorCountSeries {
    machineId: string;
    machineName: string;
    dataPoints: MachineErrorCountDataPoint[];
}

export interface MachineChartSeries {
    machineId: string;
    machineName: string;
    dataPoints: MachineChartDataPoint[];
}

export interface ErrorCountChartResponse {
    series: MachineErrorCountSeries[];
}

export interface MtbfChartResponse {
    series: MachineChartSeries[];
}

export interface MttrChartResponse {
    series: MachineChartSeries[];
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

export interface MachineErrorDetailItem {
    id?: number | string;
    machineId?: string;
    errorName?: string;
    logStatus?: string;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    [key: string]: any;
}

export interface MachineErrorDetailResponse {
    totalErrorHours?: number;
    errors: MachineErrorDetailItem[];
}

export interface MachineStatusLogChartDataPoint {
    label: string;
    hours: number;
}

export interface MachineStatusLogChartSeries {
    status: string; // 'RUNTIME' | 'IDLE' | 'ERROR' | 'OFFLINE'
    data: MachineStatusLogChartDataPoint[];
}

export interface MachineStatusLogChartResponse {
    series: MachineStatusLogChartSeries[];
}
