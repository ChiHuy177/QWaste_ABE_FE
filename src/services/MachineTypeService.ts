import { MachineType } from '@/types/MachineType';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import { MachineTypeFormData } from '@/types/MachineType';

export class MachineTypeService {
    static async getAllMachineTypesPicking(): Promise<MachineType[]> {
        const response = await NetworkService.requestJson<MachineType[]>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_TYPES.PICKING,
        });
        return response.result as MachineType[];
    }
    static async getAllMachineTypes(): Promise<MachineType[]> {
        const response = await NetworkService.requestJson<MachineType[]>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_TYPES.BASE,
        });
        return response.result as MachineType[];
    }

    static async getMachineTypeById(machineTypeId: number): Promise<MachineType> {
        const response = await NetworkService.requestJson<MachineType>({
            method: 'GET',
            url: ENDPOINTS.MACHINE_TYPES.DETAIL(machineTypeId),
        });
        return response.result as MachineType;
    }

    static async createMachineType(machineTypeData: MachineTypeFormData): Promise<MachineType> {
        const response = await NetworkService.requestJson<MachineType>({
            method: 'POST',
            url: ENDPOINTS.MACHINE_TYPES.BASE,
            data: machineTypeData,
        });
        return response.result as MachineType;
    }

    static async updateMachineType(machineTypeData: MachineType): Promise<string> {
        const response = await NetworkService.requestJson<MachineType>({
            method: 'PUT',
            url: ENDPOINTS.MACHINE_TYPES.BASE,
            data: machineTypeData,
        });
        return response.message as string;
    }

    static async deleteMachineType(machineTypeId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.MACHINE_TYPES.DETAIL(machineTypeId),
        });
        return response.result;
    }
}
