import {
    MachineIncidentFilterParams,
    MachineIncidentItem,
    MachineIncidentListResponse,
    MachineIncidentUpdateRequest,
} from '@/types/MachineIncident';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class MachineIncidentService {
    /**
     * Get paginated list of machine incidents with optional search, filter, and date ranges.
     */
    static async getIncidents(
        params?: MachineIncidentFilterParams
    ): Promise<MachineIncidentListResponse> {
        const response = await NetworkService.requestJson<MachineIncidentListResponse>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_INCIDENTS.BASE,
            data: params,
        });

        return response.result as MachineIncidentListResponse;
    }

    /**
     * Get detail of a machine incident by ID.
     */
    static async getIncidentDetail(id: string): Promise<MachineIncidentItem> {
        const response = await NetworkService.requestJson<MachineIncidentItem>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_INCIDENTS.DETAIL(id),
        });

        return response.result as MachineIncidentItem;
    }

    /**
     * Update machine incident root cause and resolution.
     * Note: Backend automatically transitions status to RESOLVED upon successful update.
     */
    static async updateIncident(
        id: string,
        body: MachineIncidentUpdateRequest
    ): Promise<MachineIncidentItem> {
        const response = await NetworkService.requestJson<MachineIncidentItem>({
            method: 'PUT',
            url: ENDPOINTS.MACHINE_INCIDENTS.DETAIL(id),
            data: body,
        });

        return response.result as MachineIncidentItem;
    }
}
