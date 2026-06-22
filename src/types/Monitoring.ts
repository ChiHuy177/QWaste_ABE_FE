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
