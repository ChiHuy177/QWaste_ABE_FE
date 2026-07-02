import { ImportResult } from '@/types/ProductionPlan';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ProductionPlanService {
    static async importFromFile(file: File): Promise<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await NetworkService.requestFormData<ImportResult>({
            method: 'POST',
            url: ENDPOINTS.PLANS.IMPORT,
            data: formData,
        });
        return response.result as ImportResult;
    }
}
