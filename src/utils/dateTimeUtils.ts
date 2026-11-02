import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Backend `LocalDateTime` arrives without an offset (`2026-10-29T13:33:22.776468`). */
const HAS_OFFSET = /(?:Z|z|[+-]\d{2}:?\d{2})$/;

/**
 * Parse a backend timestamp into Vietnam time (GMT+7).
 *
 * A value without an offset is a Java `LocalDateTime` already expressed in
 * Vietnam time, so it is pinned to `Asia/Ho_Chi_Minh` instead of the browser's
 * timezone — the card then reads the same whether the viewer sits in Hanoi or
 * abroad. A value that does carry an offset (`Instant`/`ZonedDateTime`) is
 * converted into Vietnam time.
 */
export const parseVietnamDateTime = (value?: string | null): Dayjs | null => {
    if (!value) return null;

    // Checked up front because `dayjs.tz` throws on an unparseable input
    // instead of returning an invalid instance.
    if (!dayjs(value).isValid()) return null;

    return HAS_OFFSET.test(value)
        ? dayjs(value).tz(VIETNAM_TIMEZONE)
        : dayjs.tz(value, VIETNAM_TIMEZONE);
};

/** Format a backend timestamp in Vietnam time, or `null` when it is missing/invalid. */
export const formatVietnamDateTime = (
    value?: string | null,
    format = 'DD/MM/YYYY HH:mm:ss'
): string | null => parseVietnamDateTime(value)?.format(format) ?? null;

/** ISO 8601 string with the Vietnam offset, e.g. `2026-10-29T13:33:22+07:00`. */
export const toVietnamIsoString = (value?: string | null): string | null =>
    formatVietnamDateTime(value, 'YYYY-MM-DDTHH:mm:ssZ');

/**
 * Compact label for tight UI: `HH:mm:ss` while the timestamp falls on today in
 * Vietnam, `DD/MM HH:mm` once it is older.
 */
export const formatVietnamTimeCompact = (value?: string | null): string | null => {
    const parsed = parseVietnamDateTime(value);
    if (!parsed) return null;

    const nowInVietnam = dayjs().tz(VIETNAM_TIMEZONE);
    return parsed.isSame(nowInVietnam, 'day')
        ? parsed.format('HH:mm:ss')
        : parsed.format('DD/MM HH:mm');
};
