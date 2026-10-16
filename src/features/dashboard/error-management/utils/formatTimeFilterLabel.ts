import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { PeriodFilterMode } from '@/components/shared/filters/TimeFilterPopover';
import { IndustryFilter } from '@/types/IndustryFilter';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export interface FormatTimeFilterLabelParams {
    mode: PeriodFilterMode | null;
    startDate: string | null;
    endDate: string | null;
    periodId?: number | null;
    industryFilters: IndustryFilter[];
    lang?: string;
    t: (key: string, options?: any) => string;
}

export function formatTimeFilterLabel({
    mode,
    startDate,
    endDate,
    periodId,
    industryFilters,
    lang = 'vi',
    t,
}: FormatTimeFilterLabelParams): string | null {
    if (!mode) {
        return t('common.allTime', { defaultValue: 'Tất cả thời gian' });
    }

    if (mode === 'WEEK') {
        const startStr = startDate ? dayjs(startDate).format('DD/MM') : '';
        const endStr = endDate ? dayjs(endDate).format('DD/MM') : '';
        const weekNum = startDate ? dayjs(startDate).isoWeek() : '';
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        return `${t('timeFilter.weekLabel', {
            week: weekNum,
            year: yearStr,
            defaultValue: `Tuần ${weekNum}, ${yearStr}`,
        })} (${startStr} → ${endStr})`;
    }

    if (mode === 'MONTH') {
        const monthStr = startDate ? dayjs(startDate).format('MM') : '';
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        return t('timeFilter.monthLabel', {
            month: monthStr,
            year: yearStr,
            defaultValue: `Tháng ${monthStr}/${yearStr}`,
        });
    }

    if (mode === 'QUARTER') {
        const quarterNum = startDate ? dayjs(startDate).quarter() : '';
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        return t('timeFilter.quarterLabel', {
            quarter: quarterNum,
            year: yearStr,
            defaultValue: `Quý ${quarterNum}/${yearStr}`,
        });
    }

    if (mode === 'YEAR') {
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        return t('timeFilter.yearLabel', {
            year: yearStr,
            defaultValue: `Năm ${yearStr}`,
        });
    }

    if (mode === 'CUSTOM_RANGE') {
        const startStr = startDate ? dayjs(startDate).format('DD/MM') : '';
        const endStr = endDate ? dayjs(endDate).format('DD/MM') : '';
        return `${startStr} → ${endStr}`;
    }

    const period = industryFilters.find((f) => f.filterId === periodId);
    return period ? (lang === 'vi' ? period.displayNameVi : period.displayNameEn) : null;
}
