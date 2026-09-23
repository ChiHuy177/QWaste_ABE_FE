/**
 * Formats a decimal hour number into a human-readable string.
 * e.g. 1.2 -> '1h 12m', 0.5 -> '30m', 2.0 -> '2h'
 */
export const formatHours = (hours?: number | null): string => {
    if (hours == null || isNaN(hours) || hours <= 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

/**
 * Formats total minutes into a human-readable string.
 * e.g. 270 -> '4h 30m', 48 -> '48m', 60 -> '1h'
 */
export const formatMinutesToDuration = (minutes?: number | null): string => {
    if (minutes == null || isNaN(minutes) || minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

/**
 * Format date and time for incident history cleanly.
 * e.g. time: '08:00 ➔ 11:30' or '14:52 ➔', date: '23/09/2026'
 */
export const formatIncidentTimeRange = (
    startTime?: string,
    endTime?: string | null
): { time: string; date: string; isOngoing: boolean } => {
    if (!startTime) return { time: '—', date: '', isOngoing: false };
    const sDate = new Date(startTime);
    const sh = String(sDate.getHours()).padStart(2, '0');
    const sm = String(sDate.getMinutes()).padStart(2, '0');

    const day = String(sDate.getDate()).padStart(2, '0');
    const month = String(sDate.getMonth() + 1).padStart(2, '0');
    const year = sDate.getFullYear();
    const dateText = `${day}/${month}/${year}`;

    if (!endTime) {
        return {
            time: `${sh}:${sm}`,
            date: dateText,
            isOngoing: true,
        };
    }

    const eDate = new Date(endTime);
    const eh = String(eDate.getHours()).padStart(2, '0');
    const em = String(eDate.getMinutes()).padStart(2, '0');
    return {
        time: `${sh}:${sm} ➔ ${eh}:${em}`,
        date: dateText,
        isOngoing: false,
    };
};
