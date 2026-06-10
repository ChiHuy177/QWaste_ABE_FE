export const WOODSLAND_FILTER = '&company=WOODSLAND';

export type TimePeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3';

export const TIME_PERIOD_HOURS: Record<string, number> = {
    SHIFT_1: 8,
    SHIFT_2: 8,
    SHIFT_3: 8,
    TODAY: 24,
    WEEK: 168,
    MONTH: 720,
    YEAR: 8760,
} as const;

export const getTimePeriodHours = (timePeriod: string): number => {
    return TIME_PERIOD_HOURS[timePeriod] || 24;
};

export const getShiftTimeRange = (
    shift: string,
    currentTime: Date = new Date()
): { start: Date; end: Date } | null => {
    const now = new Date(currentTime);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (shift) {
        case 'SHIFT_1': // 6h -> 14h
            return {
                start: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6:00 AM
                end: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
            };
        case 'SHIFT_2': // 14h -> 22h
            return {
                start: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
                end: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 10:00 PM
            };
        case 'SHIFT_3': // 22h -> 6h hôm sau
            return {
                start: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 10:00 PM
                end: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000), // 6:00 AM next day
            };
        case 'TODAY': // 6h -> 6h hôm sau
            return {
                start: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6:00 AM
                end: new Date(tomorrow.getTime() + 6 * 60 * 60 * 1000), // 6:00 AM next day
            };
        default:
            // For WEEK, MONTH, YEAR - return null to use fixed hours
            return null;
    }
};

export const getCurrentShift = (): 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'SHIFT_1';
    if (hour >= 14 && hour < 22) return 'SHIFT_2';
    return 'SHIFT_3';
};

export const getElapsedHoursInPeriod = (
    timePeriod: string,
    currentTime: Date = new Date()
): number => {
    const range = getShiftTimeRange(timePeriod, currentTime);

    if (!range) {
        return TIME_PERIOD_HOURS[timePeriod] || 24;
    }

    const now = new Date(currentTime);
    const fullShiftDuration = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60);

    // If shift hasn't started yet, return full shift duration
    if (now < range.start) {
        return fullShiftDuration;
    }

    // If shift has ended, return full shift duration
    if (now > range.end) {
        return fullShiftDuration;
    }

    // Shift is currently active, return elapsed time
    const elapsedMs = now.getTime() - range.start.getTime();
    return elapsedMs / (1000 * 60 * 60);
};
