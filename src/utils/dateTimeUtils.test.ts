import {
    formatVietnamDateTime,
    formatVietnamDateTimeCompact,
    parseVietnamDateTime,
    toVietnamIsoString,
} from './dateTimeUtils';

describe('dateTimeUtils', () => {
    const LOCAL_DATE_TIME = '2026-10-29T13:33:22.776468';

    it('treats an offset-less LocalDateTime as Vietnam time', () => {
        expect(toVietnamIsoString(LOCAL_DATE_TIME)).toBe('2026-10-29T13:33:22+07:00');
    });

    it('formats a LocalDateTime without shifting the clock', () => {
        expect(formatVietnamDateTime(LOCAL_DATE_TIME)).toBe('29/10/2026 13:33:22');
    });

    it('converts a UTC instant into Vietnam time', () => {
        expect(formatVietnamDateTime('2026-10-29T13:33:22Z')).toBe('29/10/2026 20:33:22');
        expect(formatVietnamDateTime('2026-10-29T13:33:22+00:00')).toBe('29/10/2026 20:33:22');
    });

    it('keeps an explicit +07:00 offset untouched', () => {
        expect(formatVietnamDateTime('2026-10-29T13:33:22+07:00')).toBe('29/10/2026 13:33:22');
    });

    it('returns null for missing or invalid values', () => {
        expect(parseVietnamDateTime(undefined)).toBeNull();
        expect(parseVietnamDateTime(null)).toBeNull();
        expect(parseVietnamDateTime('')).toBeNull();
        expect(formatVietnamDateTime('not-a-date')).toBeNull();
        expect(formatVietnamDateTimeCompact(undefined)).toBeNull();
    });

    it('always keeps the date in the compact label', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-10-29T10:00:00Z')); // 17:00 in Vietnam

        expect(formatVietnamDateTimeCompact(LOCAL_DATE_TIME)).toBe('29/10 13:33:22');
        expect(formatVietnamDateTimeCompact('2026-10-28T13:33:22.776468')).toBe('28/10 13:33:22');
        expect(formatVietnamDateTimeCompact('2025-12-31T23:59:00')).toBe('31/12/2025 23:59');

        jest.useRealTimers();
    });
});
