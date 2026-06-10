import { TaskResponse } from '@/types';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class TaskService {
    static async getTasksByOrderId(orderId: string): Promise<TaskResponse[]> {
        const response = await NetworkService.requestJson<TaskResponse[]>({
            method: 'GET',
            url: ENDPOINTS.TASKS.BY_ORDER(orderId),
        });
        return response.result as TaskResponse[];
    }
}
