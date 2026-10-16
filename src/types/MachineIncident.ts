import { PaginatedResult } from './Common';

export type MachineIncidentStatus = 'IN_PROGRESS' | 'RESOLVED';

export interface MachineIncidentAuditMetaData {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface MachineIncidentItem {
    machineIncidentId: string;
    incidentCode: string;
    machineId: string;
    machineCode: string | null;
    machineName: string | null;
    location: string;
    errorMessage: string | null;
    status: MachineIncidentStatus;
    startTime: string;
    endTime: string | null;
    durationMinutes: number | null;
    rootCause: string | null;
    resolution: string | null;
    auditMetaData: MachineIncidentAuditMetaData;
}

export interface MachineIncidentListResponse {
    page: PaginatedResult<MachineIncidentItem>;
    totalIncidents: number;
    activeIncidents: number;
}

export interface MachineIncidentFilterParams {
    search?: string;
    incidentCode?: string;
    resolution?: string;
    status?: MachineIncidentStatus;
    machineId?: string;
    filterId?: number;
    shiftFilterId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sort?: string;
}

export interface MachineIncidentUpdateRequest {
    rootCause: string;
    resolution?: string;
}
