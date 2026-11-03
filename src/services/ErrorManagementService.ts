import {
    CreateErrorIncidentDto,
    ErrorFilterParams,
    ErrorIncident,
    ErrorSummaryStats,
} from '@/types/ErrorManagement';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import { initialErrorIncidents } from '@/configs/mockData/errorManagementMockData';

// Local in-memory state fallback when backend endpoint is not yet connected
let localIncidentsStore: ErrorIncident[] = [...initialErrorIncidents];

export class ErrorManagementService {
    /**
     * Get list of error incidents with optional filters
     */
    static async getIncidents(
        filters?: ErrorFilterParams
    ): Promise<{ data: ErrorIncident[]; total: number }> {
        try {
            const response = await NetworkService.requestJson<{
                data: ErrorIncident[];
                total: number;
            }>({
                method: 'GET',
                url: ENDPOINTS.INCIDENTS.BASE,
                data: filters,
            });

            if (response?.result?.data) {
                return response.result;
            }
        } catch (_error) {
            // Fallback to local store with filtering
        }

        // Apply filters in memory
        let filtered = [...localIncidentsStore];

        if (filters?.searchText) {
            const search = filters.searchText.toLowerCase().trim();
            filtered = filtered.filter(
                (item) =>
                    item.code.toLowerCase().includes(search) ||
                    item.machineName.toLowerCase().includes(search) ||
                    item.machineCode.toLowerCase().includes(search) ||
                    item.cause.toLowerCase().includes(search) ||
                    item.resolution.toLowerCase().includes(search)
            );
        }

        if (filters?.category && filters.category !== 'all') {
            filtered = filtered.filter((item) => item.category === filters.category);
        }

        if (filters?.severity && filters.severity !== 'all') {
            filtered = filtered.filter((item) => item.severity === filters.severity);
        }

        if (filters?.status && filters.status !== 'all') {
            filtered = filtered.filter((item) => item.status === filters.status);
        }

        if (filters?.machineId) {
            filtered = filtered.filter((item) => item.machineId === filters.machineId);
        }

        const start = filters?.startDate || (filters?.dateRange ? filters.dateRange[0] : undefined);
        const end = filters?.endDate || (filters?.dateRange ? filters.dateRange[1] : undefined);

        if (start && end) {
            const startDay = start.slice(0, 10);
            const endDay = end.slice(0, 10);
            filtered = filtered.filter((item) => {
                const itemDate = item.startTime.slice(0, 10);
                const itemEndDate = item.endTime ? item.endTime.slice(0, 10) : itemDate;
                return itemDate <= endDay && itemEndDate >= startDay;
            });
        }

        return {
            data: filtered,
            total: filtered.length,
        };
    }

    /**
     * Get KPI summary statistics for errors & downtime
     */
    static async getSummaryStats(filters?: ErrorFilterParams): Promise<ErrorSummaryStats> {
        try {
            const response = await NetworkService.requestJson<ErrorSummaryStats>({
                method: 'GET',
                url: ENDPOINTS.INCIDENTS.STATS,
                data: filters,
            });

            if (response?.result) {
                return response.result;
            }
        } catch (_error) {
            // Fallback to local calculation
        }

        const pool = filters ? (await this.getIncidents(filters)).data : localIncidentsStore;
        const totalIncidents = pool.length;
        const totalDowntimeMinutes = pool.reduce(
            (acc, curr) => acc + (curr.durationMinutes || 0),
            0
        );
        const ongoingIncidents = pool.filter(
            (item) => item.status === 'open' || item.status === 'in_progress'
        ).length;
        const resolvedCount = pool.filter(
            (item) => item.status === 'resolved' || item.status === 'closed'
        ).length;
        const criticalCount = pool.filter((item) => item.severity === 'critical').length;
        const resolvedRate = totalIncidents > 0 ? (resolvedCount / totalIncidents) * 100 : 0;
        const avgResolutionTimeMinutes =
            resolvedCount > 0 ? Math.round(totalDowntimeMinutes / resolvedCount) : 0;

        return {
            totalIncidents,
            totalDowntimeMinutes,
            ongoingIncidents,
            resolvedRate: Number(resolvedRate.toFixed(1)),
            criticalCount,
            avgResolutionTimeMinutes,
        };
    }

    /**
     * Get single incident by ID
     */
    static async getIncidentById(id: string): Promise<ErrorIncident | null> {
        try {
            const response = await NetworkService.requestJson<ErrorIncident>({
                method: 'GET',
                url: ENDPOINTS.INCIDENTS.DETAIL(id),
            });

            if (response?.result) {
                return response.result;
            }
        } catch (_error) {
            // Fallback
        }

        const found = localIncidentsStore.find((item) => item.id === id);
        return found || null;
    }

    /**
     * Create a new error incident
     */
    static async createIncident(dto: CreateErrorIncidentDto): Promise<ErrorIncident> {
        try {
            const response = await NetworkService.requestJson<ErrorIncident>({
                method: 'POST',
                url: ENDPOINTS.INCIDENTS.BASE,
                data: dto,
            });

            if (response?.result) {
                localIncidentsStore.unshift(response.result);
                return response.result;
            }
        } catch (_error) {
            // Fallback
        }

        // Calculate duration in minutes if endTime is present
        let durationMinutes = 0;
        if (dto.endTime && dto.startTime) {
            const diffMs = new Date(dto.endTime).getTime() - new Date(dto.startTime).getTime();
            durationMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
        }

        const newIncident: ErrorIncident = {
            id: `inc-${Date.now()}`,
            code: `ERR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            machineId: dto.machineId || 101,
            machineName: dto.machineName || 'Thiết bị xưởng',
            machineCode: dto.machineCode || 'MC-GEN',
            lineName: dto.lineName || 'Chuyền sản xuất',
            zoneName: dto.zoneName || 'Khu vực xưởng',
            startTime: dto.startTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
            endTime: dto.endTime || null,
            durationMinutes,
            category: dto.category || 'mechanical',
            severity: dto.severity || 'medium',
            status: dto.status || 'open',
            cause: dto.cause,
            resolution: dto.resolution,
            preventiveAction: dto.preventiveAction,
            technician: dto.technician,
            reportedBy: dto.reportedBy,
            notes: dto.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        localIncidentsStore.unshift(newIncident);
        return newIncident;
    }

    /**
     * Update incident details / resolution
     */
    static async updateIncident(
        id: string,
        dto: Partial<CreateErrorIncidentDto>
    ): Promise<ErrorIncident> {
        try {
            const response = await NetworkService.requestJson<ErrorIncident>({
                method: 'PUT',
                url: ENDPOINTS.INCIDENTS.DETAIL(id),
                data: dto,
            });

            if (response?.result) {
                const index = localIncidentsStore.findIndex((item) => item.id === id);
                if (index !== -1) {
                    localIncidentsStore[index] = response.result;
                }
                return response.result;
            }
        } catch (_error) {
            // Fallback
        }

        const index = localIncidentsStore.findIndex((item) => item.id === id);
        if (index === -1) {
            throw new Error(`Incident with id ${id} not found`);
        }

        const current = localIncidentsStore[index];
        let durationMinutes = current.durationMinutes;

        const startTime = dto.startTime || current.startTime;
        const endTime = dto.endTime !== undefined ? dto.endTime : current.endTime;

        if (startTime && endTime) {
            const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
            durationMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
        }

        const updated: ErrorIncident = {
            ...current,
            ...dto,
            startTime,
            endTime,
            durationMinutes,
            updatedAt: new Date().toISOString(),
        };

        localIncidentsStore[index] = updated;
        return updated;
    }

    /**
     * Quick resolve an ongoing incident
     */
    static async resolveIncident(
        id: string,
        resolution: string,
        preventiveAction?: string
    ): Promise<ErrorIncident> {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        return this.updateIncident(id, {
            status: 'resolved',
            endTime: now,
            resolution,
            preventiveAction,
        });
    }

    /**
     * Delete an incident
     */
    static async deleteIncident(id: string): Promise<boolean> {
        try {
            await NetworkService.requestJson({
                method: 'DELETE',
                url: ENDPOINTS.INCIDENTS.DETAIL(id),
            });
        } catch (_error) {
            // Fallback
        }

        localIncidentsStore = localIncidentsStore.filter((item) => item.id !== id);
        return true;
    }

    /**
     * Find active incident (open / in_progress) associated with a machine
     */
    static getActiveIncidentForMachine(
        machineCode?: string,
        machineId?: string | number
    ): ErrorIncident | undefined {
        return localIncidentsStore.find((item) => {
            const isActive = item.status === 'open' || item.status === 'in_progress';
            if (!isActive) return false;

            if (machineCode) {
                const cleanCode = machineCode.toLowerCase().trim();
                const itemCode = (item.machineCode || '').toLowerCase().trim();
                const itemName = (item.machineName || '').toLowerCase().trim();
                if (itemCode === cleanCode || itemName.includes(cleanCode)) {
                    return true;
                }
            }

            if (machineId) {
                const idStr = String(machineId).toLowerCase().trim();
                const itemIdStr = String(item.machineId).toLowerCase().trim();
                if (idStr === itemIdStr) {
                    return true;
                }
            }

            return false;
        });
    }

    /**
     * Find incident by incident code
     */
    static getIncidentByCode(code: string): ErrorIncident | undefined {
        const clean = code.toLowerCase().trim();
        return localIncidentsStore.find((item) => item.code.toLowerCase().trim() === clean);
    }
}
