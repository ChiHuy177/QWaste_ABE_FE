import { IndustryFilter } from '@/types/IndustryFilter';
import { SpaceLevelDTO } from '@/types/SpaceLevel';
import { NetworkService } from './NetworkService';
import { SpaceLevelService } from './SpaceLevelService';
import { ENDPOINTS } from './endpoints';

export class UtilsService {
    /**
     * GET Highest Space Level
     */
    static async getHighestSpaceLevel(): Promise<number> {
        try {
            const response = await NetworkService.requestJson<number>({
                method: 'GET',
                url: ENDPOINTS.UTILS.SPACE_LEVELS.HIGHEST,
            });
            const raw = response?.result ?? (response as unknown as { data?: number })?.data;
            if (raw !== undefined && raw !== null) {
                const parsed = Number(raw);
                if (!Number.isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            }
        } catch {}

        try {
            const levels = await SpaceLevelService.getAllSpaceLevels();
            const list = Array.isArray(levels)
                ? levels
                : ((levels as unknown as { content?: SpaceLevelDTO[] })?.content ?? []);
            if (list.length > 0) {
                const maxLevel = Math.max(...list.map((l) => Number(l.spaceLevel ?? 0)));
                if (maxLevel > 0) {
                    return maxLevel;
                }
            }
        } catch {}

        return 0;
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
