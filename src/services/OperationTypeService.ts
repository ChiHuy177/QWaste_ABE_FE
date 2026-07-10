import { OperationType } from '@/types/OperationType';
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
}
