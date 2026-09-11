import { LabelStyle } from '@/types/Chart';

// Chart bucket label style (Nâng cao — Kiểu nhãn). No catalog endpoint for this
// enum exists on the backend, so the 14 values are mapped by hand here — values
// match the Chart Filter Guide's Phụ lục A.3 example column verbatim.
type ConcreteLabelStyle = Exclude<LabelStyle, 'AUTO'>;

const LABEL_STYLE_LABELS_VI: Record<ConcreteLabelStyle, string> = {
    CLOCK: 'Giờ (08:30)',
    CLOCK_RANGE: 'Khoảng giờ (08:30–09:00)',
    WEEKDAY: 'Thứ trong tuần (Thứ Hai)',
    WEEKDAY_SHORT: 'Thứ viết tắt (T2)',
    DATE: 'Ngày/tháng (24/08)',
    DATE_ISO: 'Ngày ISO (2026-08-24)',
    WEEK_INDEX: 'Số thứ tự tuần (Tuần 1)',
    WEEK_RANGE: 'Khoảng ngày trong tuần (01–07/08)',
    MONTH_NAME: 'Tên tháng (Tháng 8)',
    MONTH_SHORT: 'Tháng viết tắt (Th8)',
    MONTH_YEAR: 'Tháng/năm (08/2026)',
    QUARTER: 'Quý (Quý 3)',
    YEAR: 'Năm (2026)',
};

const LABEL_STYLE_LABELS_EN: Record<ConcreteLabelStyle, string> = {
    CLOCK: 'Clock (08:30)',
    CLOCK_RANGE: 'Clock range (08:30–09:00)',
    WEEKDAY: 'Weekday (Monday)',
    WEEKDAY_SHORT: 'Weekday short (Mon)',
    DATE: 'Date (24/08)',
    DATE_ISO: 'ISO date (2026-08-24)',
    WEEK_INDEX: 'Week index (Week 1)',
    WEEK_RANGE: 'Week range (01–07/08)',
    MONTH_NAME: 'Month name (August)',
    MONTH_SHORT: 'Month short (Aug)',
    MONTH_YEAR: 'Month/year (08/2026)',
    QUARTER: 'Quarter (Q3)',
    YEAR: 'Year (2026)',
};

export const getLabelStyleLabel = (style: ConcreteLabelStyle, lang: string): string =>
    (lang === 'vi' ? LABEL_STYLE_LABELS_VI : LABEL_STYLE_LABELS_EN)[style];
