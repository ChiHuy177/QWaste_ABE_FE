import { IndustryFilter } from '@/types/IndustryFilter';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class UtilsService {
    /**
     * GET Highest Space Level
     */
    static async getHighestSpaceLevel(): Promise<number> {
        const response = await NetworkService.requestJson<number>({
            method: 'GET',
            url: ENDPOINTS.UTILS.SPACE_LEVELS.HIGHEST,
        });
        return response.result as number;
    }

    /**
     * GET all PERIOD filters
     */
    static async getAllPeriods(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.UTILS.FILTERS.ALL_PERIODS,
        });
        const filters = (response.result as IndustryFilter[]) || [];
        return [...filters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    /**
     * GET SHIFT and OT filters for a specific date according to that date's shift pattern
     * @param date Date in format YYYY-MM-DD
     */
    static async getShiftsForDate(date: string): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: `${ENDPOINTS.UTILS.FILTERS.SHIFTS_FOR_DATE}?date=${encodeURIComponent(date)}`,
        });
        const shifts = (response.result as IndustryFilter[]) || [];
        return [...shifts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
}
