/**
 * Formats a decimal hour number into a human-readable string.
 * e.g. 1.2 -> '1h 12m', 0.5 -> '30m', 2.0 -> '2h'
 */
export const formatHours = (hours: number): string => {
    if (hours == null || isNaN(hours)) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

/**
 * Format date and time for incident history cleanly.
 * e.g. time: '09:00 ➔ 11:30', date: '22/09/2026'
 */
export const formatIncidentTimeRange = (
    startTime?: string,
    endTime?: string
): { time: string; date: string } => {
    if (!startTime) return { time: '—', date: '' };
    const sDate = new Date(startTime);
    const sh = String(sDate.getHours()).padStart(2, '0');
    const sm = String(sDate.getMinutes()).padStart(2, '0');

    let timeText = `${sh}:${sm}`;
    if (endTime) {
        const eDate = new Date(endTime);
        const eh = String(eDate.getHours()).padStart(2, '0');
        const em = String(eDate.getMinutes()).padStart(2, '0');
        timeText += ` ➔ ${eh}:${em}`;
    }

    const day = String(sDate.getDate()).padStart(2, '0');
    const month = String(sDate.getMonth() + 1).padStart(2, '0');
    const year = sDate.getFullYear();
    const dateText = `${day}/${month}/${year}`;

    return { time: timeText, date: dateText };
};
