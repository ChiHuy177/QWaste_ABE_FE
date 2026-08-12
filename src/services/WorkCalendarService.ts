import {
    WorkCalendarMonthResponse,
    WorkCalendarDayUpdationRequest,
} from '@/types/WorkCalendar';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class WorkCalendarService {
    /**
     * Get month calendar data for specified year and month.
     */
    static async getMonthCalendar(
        year: number,
        month: number
    ): Promise<WorkCalendarMonthResponse> {
        const response = await NetworkService.requestJson<WorkCalendarMonthResponse>({
            method: 'GET',
            url: ENDPOINTS.WORK_CALENDAR.BASE,
            data: { year, month },
        });
        return response.result as WorkCalendarMonthResponse;
    }

    /**
     * Save/Batch update calendar days for the entire month.
     */
    static async batchUpdateCalendar(
        days: WorkCalendarDayUpdationRequest[]
    ): Promise<WorkCalendarMonthResponse> {
        const response = await NetworkService.requestJson<WorkCalendarMonthResponse>({
            method: 'PUT',
            url: ENDPOINTS.WORK_CALENDAR.BATCH_UPDATE,
            data: days,
        });
        return response.result as WorkCalendarMonthResponse;
    }

    /**
     * Reset calendar days for specified year and month to default values.
     */
    static async resetMonthCalendar(
        year: number,
        month: number
    ): Promise<WorkCalendarMonthResponse> {
        const response = await NetworkService.requestJson<WorkCalendarMonthResponse>({
            method: 'PUT',
            url: `${ENDPOINTS.WORK_CALENDAR.RESET}?year=${year}&month=${month}`,
        });
        return response.result as WorkCalendarMonthResponse;
    }
}
