export type DayType = 'WORKING' | 'WEEKEND_OFF' | 'HOLIDAY';

export interface WorkCalendarDayResponse {
    date: string; // Format: yyyy-MM-dd
    dayOfWeek: string; // e.g. MONDAY, TUESDAY...
    dayType: DayType;
    plannedTime: number; // e.g. 22.5 or 0.0
    isWorkingDay: boolean;
    isOverride: boolean;
}

export interface WorkCalendarSummaryResponse {
    totalWorkingDays: number;
    totalOffDays: number;
    totalPlannedHours: number;
    isConfirmed?: boolean;
}

export interface WorkCalendarMonthResponse {
    year: number;
    month: number;
    isConfirmed?: boolean;
    days: WorkCalendarDayResponse[];
    summary: WorkCalendarSummaryResponse;
}

export interface WorkCalendarDayUpdationRequest {
    date: string; // Format: yyyy-MM-dd
    dayType: DayType;
    isWorkingDay: boolean;
}

export interface WorkCalendarAlarmResponse {
    shouldShowAlarm: boolean;
    targetYear?: number;
    targetMonth?: number;
    year?: number;
    month?: number;
    message?: string;
}

export interface WorkCalendarConfirmRequest {
    year: number;
    month: number;
}
