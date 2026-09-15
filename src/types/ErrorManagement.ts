export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ErrorStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type ErrorCategory =
    | 'mechanical'
    | 'electrical'
    | 'hydraulic'
    | 'mold'
    | 'operational'
    | 'software'
    | 'material'
    | 'quality';

export interface ErrorIncident {
    id: string;
    code: string;
    machineId: number;
    machineName: string;
    machineCode: string;
    lineName: string;
    zoneName: string;
    startTime: string;
    endTime: string | null;
    durationMinutes: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
    status: ErrorStatus;
    cause: string;
    resolution: string;
    preventiveAction?: string;
    technician?: string;
    technicianAvatar?: string;
    reportedBy?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ErrorSummaryStats {
    totalIncidents: number;
    totalDowntimeMinutes: number;
    ongoingIncidents: number;
    resolvedRate: number;
    criticalCount: number;
    avgResolutionTimeMinutes: number;
}

export interface ErrorFilterParams {
    searchText?: string;
    category?: ErrorCategory | 'all';
    severity?: ErrorSeverity | 'all';
    status?: ErrorStatus | 'all';
    dateRange?: [string, string];
    startDate?: string;
    endDate?: string;
    machineId?: number;
    page?: number;
    pageSize?: number;
}

export interface CreateErrorIncidentDto {
    machineId?: number;
    machineName?: string;
    machineCode?: string;
    lineName?: string;
    zoneName?: string;
    startTime?: string;
    endTime?: string | null;
    durationMinutes?: number;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    status?: ErrorStatus;
    cause: string;
    resolution: string;
    preventiveAction?: string;
    technician?: string;
    reportedBy?: string;
    notes?: string;
}

export interface UpdateErrorIncidentDto extends Partial<CreateErrorIncidentDto> {
    id: string;
}
