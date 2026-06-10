import { StepDTO, CreateStepRequest, UpdateStepRequest } from '@/types/Step';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class StepService {
    /**
     * GET All Steps
     */
    static async getAllSteps(): Promise<StepDTO[]> {
        const response = await NetworkService.requestJson<StepDTO[]>({
            method: 'GET',
            url: ENDPOINTS.STEPS.BASE,
        });
        return response.result as StepDTO[];
    }

    /**
     * POST Create Step
     */
    static async createStep(data: CreateStepRequest): Promise<StepDTO> {
        const response = await NetworkService.requestJson<StepDTO>({
            method: 'POST',
            url: ENDPOINTS.STEPS.BASE,
            data,
        });
        return response.result as StepDTO;
    }

    /**
     * PUT Update Step
     */
    static async updateStep(data: UpdateStepRequest): Promise<StepDTO> {
        const response = await NetworkService.requestJson<StepDTO>({
            method: 'PUT',
            url: ENDPOINTS.STEPS.BASE,
            data,
        });
        return response.result as StepDTO;
    }

    /**
     * GET Step By ID
     */
    static async getStepById(id: number): Promise<StepDTO> {
        const response = await NetworkService.requestJson<StepDTO>({
            method: 'GET',
            url: ENDPOINTS.STEPS.DETAIL(id),
        });
        return response.result as StepDTO;
    }

    /**
     * DELETE Step
     */
    static async deleteStep(id: number): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.STEPS.DETAIL(id),
        });
    }
}
