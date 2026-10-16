export interface PageResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface DowntimeMachineRollupItem {
    machineId: string;
    machineCode: string | null;
    machineName: string;
    location: string;
    totalDowntimeMinutes: number;
    formattedDowntime: string;
}

export interface DowntimeMachineRollupResponse {
    page: PageResponse<DowntimeMachineRollupItem>;
    totalAffectedMachines: number;
    totalDowntimeMinutes: number;
}

export interface DowntimeMachineInfo {
    machineId: string;
    machineCode: string | null;
    machineName: string;
    location: string;
    totalDowntimeMinutes: number;
    formattedTotalDowntime: string;
    totalIncidents: number;
}

export interface DowntimeMachineIncidentItem {
    incidentCode: string;
    startTime: string;
    endTime: string | null;
    rootCause: string | null;
    durationMinutes: number;
    formattedDuration: string;
    errorName?: string | null;
    status?: string | null;
}

export interface DowntimeMachineIncidentResponse {
    machineInfo: DowntimeMachineInfo;
    page: PageResponse<DowntimeMachineIncidentItem>;
}

export interface DowntimeMachinesFilterParams {
    filterId: number;
    spaceId?: number;
    keyword?: string;
    page?: number;
    size?: number;
}

export interface DowntimeMachinesDateRangeParams {
    startDate: string;
    endDate: string;
    spaceId?: number;
    keyword?: string;
    page?: number;
    size?: number;
}

export interface DowntimeMachineIncidentsFilterParams {
    machineId: string;
    filterId: number;
    page?: number;
    size?: number;
    sort?: string;
}

export interface DowntimeMachineIncidentsDateRangeParams {
    machineId: string;
    startDate: string;
    endDate: string;
    page?: number;
    size?: number;
    sort?: string;
}
