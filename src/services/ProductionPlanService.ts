import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export interface SkippedDay {
    date: string;
    reason: string;
}

export interface ImportRowError {
    rowIndex: number;
    dayLabel: string;
    column: string;
    message: string;
}

export interface ImportResult {
    requiresConfirmation: boolean;
    sessionToken: string;
    totalInserted: number;
    importedDays: string[];
    deferredDays: string[];
    skippedDays: SkippedDay[];
    errors: ImportRowError[];
}

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
