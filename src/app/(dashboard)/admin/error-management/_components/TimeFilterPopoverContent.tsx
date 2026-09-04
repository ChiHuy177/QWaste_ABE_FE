'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, DatePicker, Divider, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export type ErrorPeriodFilterMode = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM_RANGE';

export interface ErrorTimeFilterApplyPayload {
    mode: ErrorPeriodFilterMode;
    startDate: string;
    endDate: string;
}

export interface ErrorTimeFilterPopoverContentProps {
    currentMode: ErrorPeriodFilterMode | null;
    currentStartDate: string | null;
    currentEndDate: string | null;
    isOpen: boolean;
    onApply: (payload: ErrorTimeFilterApplyPayload) => void;
    onReset: () => void;
    onCancel: () => void;
    defaultDate?: string;
}

export function computeDateRangeForMode(
    mode: ErrorPeriodFilterMode,
    values: {
        dateRange: [Dayjs, Dayjs];
        week: Dayjs;
        month: Dayjs;
        quarter: Dayjs;
        year: Dayjs;
    }
): [string, string] {
    switch (mode) {
        case 'WEEK':
            return [
                values.week.startOf('isoWeek').format('YYYY-MM-DD'),
                values.week.endOf('isoWeek').format('YYYY-MM-DD'),
            ];
        case 'MONTH':
            return [
                values.month.startOf('month').format('YYYY-MM-DD'),
                values.month.endOf('month').format('YYYY-MM-DD'),
            ];
        case 'QUARTER':
            return [
                values.quarter.startOf('quarter').format('YYYY-MM-DD'),
                values.quarter.endOf('quarter').format('YYYY-MM-DD'),
            ];
        case 'YEAR':
            return [
                values.year.startOf('year').format('YYYY-MM-DD'),
                values.year.endOf('year').format('YYYY-MM-DD'),
            ];
        case 'CUSTOM_RANGE':
        default:
            return [
                values.dateRange[0].format('YYYY-MM-DD'),
                values.dateRange[1].format('YYYY-MM-DD'),
            ];
    }
}

export const TimeFilterPopoverContent: React.FC<ErrorTimeFilterPopoverContentProps> = ({
    currentMode,
    currentStartDate,
    currentEndDate,
    isOpen,
    onApply,
    onReset,
    onCancel,
    defaultDate = '2025-08-25',
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const baseDate = useMemo(() => {
        if (currentStartDate) return dayjs(currentStartDate);
        return dayjs(defaultDate);
    }, [currentStartDate, defaultDate]);

    const [draftMode, setDraftMode] = useState<ErrorPeriodFilterMode>(currentMode || 'MONTH');
    const [draftWeek, setDraftWeek] = useState<Dayjs>(baseDate);
    const [draftMonth, setDraftMonth] = useState<Dayjs>(baseDate);
    const [draftQuarter, setDraftQuarter] = useState<Dayjs>(baseDate);
    const [draftYear, setDraftYear] = useState<Dayjs>(baseDate);
    const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs]>([
        currentStartDate ? dayjs(currentStartDate) : baseDate.startOf('month'),
        currentEndDate ? dayjs(currentEndDate) : baseDate.endOf('month'),
    ]);

    useEffect(() => {
        if (isOpen) {
            setDraftMode(currentMode || 'MONTH');
            const initialDate = currentStartDate ? dayjs(currentStartDate) : dayjs(defaultDate);
            setDraftWeek(initialDate);
            setDraftMonth(initialDate);
            setDraftQuarter(initialDate);
            setDraftYear(initialDate);
            setDraftDateRange([
                currentStartDate ? dayjs(currentStartDate) : initialDate.startOf('month'),
                currentEndDate ? dayjs(currentEndDate) : initialDate.endOf('month'),
            ]);
        }
    }, [isOpen, currentMode, currentStartDate, currentEndDate, defaultDate]);

    const modeButtons: { label: string; value: ErrorPeriodFilterMode }[] = useMemo(
        () => [
            { label: t('timeFilter.week', { defaultValue: 'Theo tuần' }), value: 'WEEK' },
            { label: t('timeFilter.month', { defaultValue: 'Theo tháng' }), value: 'MONTH' },
            { label: t('timeFilter.quarter', { defaultValue: 'Theo quý' }), value: 'QUARTER' },
            { label: t('timeFilter.year', { defaultValue: 'Theo năm' }), value: 'YEAR' },
            {
                label: t('timeFilter.customRange', { defaultValue: 'Khoảng ngày' }),
                value: 'CUSTOM_RANGE',
            },
        ],
        [t]
    );

    const handleApply = useCallback(() => {
        const [startDate, endDate] = computeDateRangeForMode(draftMode, {
            dateRange: draftDateRange,
            week: draftWeek,
            month: draftMonth,
            quarter: draftQuarter,
            year: draftYear,
        });

        onApply({
            mode: draftMode,
            startDate,
            endDate,
        });
    }, [draftMode, draftDateRange, draftWeek, draftMonth, draftQuarter, draftYear, onApply]);

    const renderDatePreview = (start: Dayjs, end: Dayjs) => (
        <div
            style={{
                marginTop: 8,
                fontSize: 12,
                color: token.colorTextSecondary,
                textAlign: 'center',
            }}
        >
            {start.format('DD/MM/YYYY')} &rarr; {end.format('DD/MM/YYYY')}
        </div>
    );

    return (
        <div style={{ width: 330, padding: 4 }}>
            {/* Mode selection buttons */}
            <Typography.Text
                type="secondary"
                style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                {t('timeFilter.periodType', { defaultValue: 'Chế độ chọn thời gian' })}
            </Typography.Text>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 6,
                    marginBottom: 10,
                }}
            >
                {modeButtons.map((btn) => (
                    <Button
                        key={btn.value}
                        size="small"
                        type={draftMode === btn.value ? 'primary' : 'default'}
                        onClick={() => setDraftMode(btn.value)}
                        style={{
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: draftMode === btn.value ? 600 : 400,
                            height: 30,
                            padding: '0 4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {btn.label}
                    </Button>
                ))}
            </div>

            {/* Context-aware Picker & Sub-container */}
            {draftMode === 'WEEK' && (
                <div
                    style={{
                        background: token.colorFillQuaternary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Typography.Text
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6,
                        }}
                    >
                        {t('timeFilter.selectWeek', { defaultValue: 'Chọn tuần' })}
                    </Typography.Text>
                    <DatePicker
                        picker="week"
                        value={draftWeek}
                        onChange={(date) => date && setDraftWeek(date)}
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('timeFilter.selectWeek', { defaultValue: 'Chọn tuần' })}
                    />
                    {renderDatePreview(draftWeek.startOf('isoWeek'), draftWeek.endOf('isoWeek'))}
                </div>
            )}

            {draftMode === 'MONTH' && (
                <div
                    style={{
                        background: token.colorFillQuaternary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Typography.Text
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6,
                        }}
                    >
                        {t('timeFilter.selectMonth', { defaultValue: 'Chọn tháng' })}
                    </Typography.Text>
                    <DatePicker
                        picker="month"
                        format="MM/YYYY"
                        value={draftMonth}
                        onChange={(date) => date && setDraftMonth(date)}
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('timeFilter.selectMonth', { defaultValue: 'Chọn tháng' })}
                    />
                    {renderDatePreview(draftMonth.startOf('month'), draftMonth.endOf('month'))}
                </div>
            )}

            {draftMode === 'QUARTER' && (
                <div
                    style={{
                        background: token.colorFillQuaternary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Typography.Text
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6,
                        }}
                    >
                        {t('timeFilter.selectQuarter', { defaultValue: 'Chọn quý' })}
                    </Typography.Text>
                    <DatePicker
                        picker="quarter"
                        format="[Q]Q/YYYY"
                        value={draftQuarter}
                        onChange={(date) => date && setDraftQuarter(date)}
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('timeFilter.selectQuarter', { defaultValue: 'Chọn quý' })}
                    />
                    {renderDatePreview(
                        draftQuarter.startOf('quarter'),
                        draftQuarter.endOf('quarter')
                    )}
                </div>
            )}

            {draftMode === 'YEAR' && (
                <div
                    style={{
                        background: token.colorFillQuaternary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Typography.Text
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6,
                        }}
                    >
                        {t('timeFilter.selectYear', { defaultValue: 'Chọn năm' })}
                    </Typography.Text>
                    <DatePicker
                        picker="year"
                        format="YYYY"
                        value={draftYear}
                        onChange={(date) => date && setDraftYear(date)}
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('timeFilter.selectYear', { defaultValue: 'Chọn năm' })}
                    />
                    {renderDatePreview(draftYear.startOf('year'), draftYear.endOf('year'))}
                </div>
            )}

            {draftMode === 'CUSTOM_RANGE' && (
                <div
                    style={{
                        background: token.colorFillQuaternary,
                        borderRadius: 8,
                        padding: '10px 12px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Typography.Text
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6,
                        }}
                    >
                        {t('timeFilter.selectDateRange', { defaultValue: 'Chọn khoảng ngày' })}
                    </Typography.Text>
                    <DatePicker.RangePicker
                        format="DD/MM/YYYY"
                        value={draftDateRange}
                        onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                                setDraftDateRange([dates[0], dates[1]]);
                            }
                        }}
                        style={{ width: '100%', borderRadius: 6 }}
                    />
                    {draftDateRange[0] &&
                        draftDateRange[1] &&
                        renderDatePreview(draftDateRange[0], draftDateRange[1])}
                </div>
            )}

            {/* Footer actions */}
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <Button onClick={onReset}>
                    {t('timeFilter.reset', { defaultValue: 'Đặt lại' })}
                </Button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={onCancel}>
                        {t('common.cancel', { defaultValue: 'Hủy' })}
                    </Button>
                    <Button type="primary" onClick={handleApply}>
                        {t('timeFilter.apply', { defaultValue: 'Áp dụng' })}
                    </Button>
                </div>
            </div>
        </div>
    );
};
