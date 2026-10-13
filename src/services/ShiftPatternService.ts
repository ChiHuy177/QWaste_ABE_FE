import {
    ShiftPatternResponse,
    ShiftPatternForPicking,
    ShiftPatternCreationRequest,
} from '@/types/ShiftPattern';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ShiftPatternService {
    /**
     * Get all shift patterns
     */
    static async getAllShiftPatterns(): Promise<ShiftPatternResponse[]> {
        const response = await NetworkService.requestJson<ShiftPatternResponse[]>({
            method: 'GET',
            url: ENDPOINTS.SHIFT_PATTERNS.BASE,
        });
        return response.result as ShiftPatternResponse[];
    }

    /**
     * Get shift pattern by ID
     */
    static async getShiftPatternById(patternId: number | string): Promise<ShiftPatternResponse> {
        const response = await NetworkService.requestJson<ShiftPatternResponse>({
            method: 'GET',
            url: ENDPOINTS.SHIFT_PATTERNS.DETAIL(patternId),
        });
        return response.result as ShiftPatternResponse;
    }

    /**
     * Get shift patterns for picking (dropdowns)
     */
    static async getShiftPatternsForPicking(): Promise<ShiftPatternForPicking[]> {
        const response = await NetworkService.requestJson<ShiftPatternForPicking[]>({
            method: 'GET',
            url: ENDPOINTS.SHIFT_PATTERNS.PICKING,
        });
        return response.result as ShiftPatternForPicking[];
    }

    /**
     * Create a new shift pattern
     */
    static async createShiftPattern(
        data: ShiftPatternCreationRequest
    ): Promise<ShiftPatternResponse> {
        const response = await NetworkService.requestJson<ShiftPatternResponse>({
            method: 'POST',
            url: ENDPOINTS.SHIFT_PATTERNS.BASE,
            data,
        });
        return response.result as ShiftPatternResponse;
    }
}
