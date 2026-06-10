import {
    ShiftBreakPeriod,
    ShiftBreakPeriodCreationRequest,
    ShiftBreakPeriodUpdationRequest,
} from '@/types/ShiftBreakPeriod';

import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ShiftBreakPeriodService {
    static async getAllShiftBreakPeriods(filterId: number): Promise<ShiftBreakPeriod[]> {
        const response = await NetworkService.requestJson<ShiftBreakPeriod[]>({
            method: 'GET',
            url: ENDPOINTS.SHIFT_BREAK_PERIOD.FORSHIFT(filterId),
        });

        return response.result as ShiftBreakPeriod[];
    }

    static async createShiftBreakPeriod(
        shiftBreakPeriodData: ShiftBreakPeriodCreationRequest
    ): Promise<ShiftBreakPeriod> {
        const response = await NetworkService.requestJson<ShiftBreakPeriod>({
            method: 'POST',
            url: ENDPOINTS.SHIFT_BREAK_PERIOD.BASE,
            data: shiftBreakPeriodData,
        });

        return response.result as ShiftBreakPeriod;
    }

    static async updateShiftBreakPeriods(
        shiftBreakPeriodData: ShiftBreakPeriodUpdationRequest[]
    ): Promise<ShiftBreakPeriod[]> {
        const response = await NetworkService.requestJson<ShiftBreakPeriod[]>({
            method: 'PUT',
            url: ENDPOINTS.SHIFT_BREAK_PERIOD.BASE,
            data: shiftBreakPeriodData,
        });

        return response.result as ShiftBreakPeriod[];
    }

    static async deleteShiftBreakPeriod(breakPeriodId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.SHIFT_BREAK_PERIOD.DETAIL(breakPeriodId),
        });

        return response.result;
    }
}
