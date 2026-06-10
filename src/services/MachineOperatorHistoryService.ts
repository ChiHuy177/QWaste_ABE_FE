import {
    MachineOperatorHistory,
    MachineOperatorHistoryFormData,
} from '@/types/MachineOperatorHistory';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class MachineOperatorHistoryService {
    static async getAllMachineOperatorHistory(zoneId: number): Promise<MachineOperatorHistory[]> {
        const response = await NetworkService.requestJson<MachineOperatorHistory[]>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_OPERATOR_HISTORY.BY_ZONE(zoneId),
        });
        return response.result as MachineOperatorHistory[];
    }

    static async getMachineOperatorHistoryById(id: string): Promise<MachineOperatorHistory> {
        const response = await NetworkService.requestJson<MachineOperatorHistory>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_OPERATOR_HISTORY.DETAIL(id),
        });
        return response.result as MachineOperatorHistory;
    }

    static async createMachineOperatorHistory(
        data: MachineOperatorHistoryFormData
    ): Promise<MachineOperatorHistoryFormData> {
        console.log('MachineOperatorHistoryService.createMachineOperatorHistory payload:', data);
        const response = await NetworkService.requestJson<MachineOperatorHistoryFormData>({
            method: 'POST',
            url: ENDPOINTS.MACHINE_OPERATOR_HISTORY.BASE,
            data: data,
        });
        return response.result as MachineOperatorHistoryFormData;
    }

    static async updateMachineOperatorHistory(
        id: string,
        data: MachineOperatorHistoryFormData
    ): Promise<MachineOperatorHistoryFormData> {
        console.log('MachineOperatorHistoryService.updateMachineOperatorHistory payload:', data);
        const response = await NetworkService.requestJson<MachineOperatorHistoryFormData>({
            method: 'PUT',
            url: ENDPOINTS.MACHINE_OPERATOR_HISTORY.BASE,
            data: data,
        });
        return response.result as MachineOperatorHistoryFormData;
    }

    static async deleteMachineOperatorHistory(id: string): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.MACHINE_OPERATOR_HISTORY.DETAIL(id),
        });
        return response.result;
    }
}
