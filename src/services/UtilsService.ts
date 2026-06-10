import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export interface TaskDeclineReason {
    name: string;
    nameEn: string;
    nameVi: string;
}

export class UtilsService {
    static async getTaskDeclineReasons(): Promise<TaskDeclineReason[]> {
        const response = await NetworkService.requestJson<TaskDeclineReason[]>({
            method: 'GET',
            url: ENDPOINTS.UTILS.ENUMS.TASK_DECLINE_REASONS,
        });
        return response.result as TaskDeclineReason[];
    }
}
