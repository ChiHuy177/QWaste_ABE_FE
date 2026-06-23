export const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
export const FULL_WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'] as const;

export const getTodayScheduleIndex = (date = new Date()) => {
    const day = date.getDay();
    return (day + 6) % 7;
};

export const formatDailyLabel = (date = new Date()) => {
    const dayIndex = getTodayScheduleIndex(date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${FULL_WEEK_DAYS[dayIndex]} - ${day}/${month}`;
};

export const getIsoWeek = (date = new Date()) => {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

    return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const formatWeeklyLabel = (date = new Date()) => `Tuần ${getIsoWeek(date)}`;

