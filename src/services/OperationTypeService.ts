import {
    OperationType,
    OperationTypeFormData,
    OperationTypeUpdateFormData,
} from '@/types/OperationType';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class OperationTypeService {
    static async getAllOperationTypes(): Promise<OperationType[]> {
        const response = await NetworkService.requestJson<OperationType[]>({
            method: 'GET',
            url: ENDPOINTS.OPERATION_TYPES.BASE,
        });
        return response.result as OperationType[];
    }

    static async getOperationTypeById(operationTypeId: number): Promise<OperationType> {
        const response = await NetworkService.requestJson<OperationType>({
            method: 'GET',
            url: ENDPOINTS.OPERATION_TYPES.DETAIL(operationTypeId),
        });
        return response.result as OperationType;
    }

    static async createOperationType(data: OperationTypeFormData): Promise<OperationType> {
        const response = await NetworkService.requestJson<OperationType>({
            method: 'POST',
            url: ENDPOINTS.OPERATION_TYPES.BASE,
            data,
        });
        return response.result as OperationType;
    }

    static async updateOperationType(data: OperationTypeUpdateFormData): Promise<string> {
        const response = await NetworkService.requestJson<OperationType>({
            method: 'PUT',
            url: ENDPOINTS.OPERATION_TYPES.BASE,
            data,
        });
        return response.message as string;
    }

    static async deleteOperationType(operationTypeId: number): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.OPERATION_TYPES.DETAIL(operationTypeId),
        });
        return response.message as string;
    }
}
