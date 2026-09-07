'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, DatePicker, Divider, Radio, Space, Tag, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { IndustryFilter } from '@/types/IndustryFilter';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export type PeriodFilterMode = 'PRESET' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM_RANGE';

export interface TimeFilterApplyPayload {
    mode: PeriodFilterMode;
    primaryFilterId: number | null;
    secondaryShiftId: number | null;
    startDate: string;
    endDate: string;
}

export interface TimeFilterPopoverContentProps {
    currentMode: PeriodFilterMode | null;
    currentPeriodId?: number | null;
    currentShiftId?: number | null;
    currentStartDate: string | null;
    currentEndDate: string | null;
    groupedOptions: {
        SHIFT?: { label: string; value: number }[];
        PERIOD?: { label: string; value: number }[];
    };
    industryFilters: IndustryFilter[];
    isShiftActive?: (filter: IndustryFilter) => boolean;

    // Feature toggles for flexibility across different modules
    showShifts?: boolean;
    showPresets?: boolean;
    allowedModes?: PeriodFilterMode[];
    title?: string;

    isMobile?: boolean;
    isOpen: boolean;
    onApply: (payload: TimeFilterApplyPayload) => void;
    onReset?: () => void;
    onCancel: () => void;
    defaultDate?: string;
}

/**
 * Computes start and end dates formatted as YYYY-MM-DD for a given mode.
 */
export function computeDateRangeForMode(
    mode: PeriodFilterMode,
    values: {
        dateRange: [Dayjs, Dayjs];
        week: Dayjs;
        month: Dayjs;
        quarter: Dayjs;
        year: Dayjs;
    },
    selectedPeriodFilter?: IndustryFilter | null
): [string, string] {
    switch (mode) {
        case 'PRESET': {
            const today = dayjs();
            const code = selectedPeriodFilter?.periodCode?.toUpperCase();
            if (code === 'TODAY') {
                return [today.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
            }
            if (code === 'YESTERDAY') {
                const yest = today.subtract(1, 'day');
                return [yest.format('YYYY-MM-DD'), yest.format('YYYY-MM-DD')];
            }
            if (code === 'THIS_WEEK' || code === 'WEEK') {
                return [
                    today.startOf('isoWeek').format('YYYY-MM-DD'),
                    today.endOf('isoWeek').format('YYYY-MM-DD'),
                ];
            }
            if (code === 'LAST_WEEK') {
                const lastW = today.subtract(1, 'week');
                return [
                    lastW.startOf('isoWeek').format('YYYY-MM-DD'),
                    lastW.endOf('isoWeek').format('YYYY-MM-DD'),
                ];
            }
            if (code === 'THIS_MONTH' || code === 'MONTH') {
                return [
                    today.startOf('month').format('YYYY-MM-DD'),
                    today.endOf('month').format('YYYY-MM-DD'),
                ];
            }
            if (code === 'LAST_MONTH') {
                const lastM = today.subtract(1, 'month');
                return [
                    lastM.startOf('month').format('YYYY-MM-DD'),
                    lastM.endOf('month').format('YYYY-MM-DD'),
                ];
            }
            if (code === 'LAST_7_DAYS') {
                return [today.subtract(6, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
            }
            if (code === 'LAST_30_DAYS') {
                return [today.subtract(29, 'day').format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
            }
            if (code === 'THIS_QUARTER' || code === 'QUARTER') {
                return [
                    today.startOf('quarter').format('YYYY-MM-DD'),
                    today.endOf('quarter').format('YYYY-MM-DD'),
                ];
            }
            if (code === 'THIS_YEAR' || code === 'YEAR') {
                return [
                    today.startOf('year').format('YYYY-MM-DD'),
                    today.endOf('year').format('YYYY-MM-DD'),
                ];
            }
            return [today.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')];
        }
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

/**
 * Formats a clean human-readable label for the time filter button.
 */
export function formatTimeFilterLabel({
    mode,
    startDate,
    endDate,
    periodId,
    shiftId,
    industryFilters,
    showShifts = true,
    lang = 'vi',
    t,
}: {
    mode: PeriodFilterMode | null;
    startDate: string | null;
    endDate: string | null;
    periodId?: number | null;
    shiftId?: number | null;
    industryFilters: IndustryFilter[];
    showShifts?: boolean;
    lang?: string;
    t: (key: string, options?: any) => string;
}): string | null {
    if (!mode) {
        return t('timeFilter.all', { defaultValue: 'Tất cả thời gian' });
    }

    const shiftFilter =
        showShifts && shiftId != null ? industryFilters.find((f) => f.filterId === shiftId) : null;
    const shiftLabel = shiftFilter
        ? lang === 'vi'
            ? shiftFilter.displayNameVi
            : shiftFilter.displayNameEn
        : null;

    if (mode === 'WEEK') {
        const startStr = startDate ? dayjs(startDate).format('DD/MM') : '';
        const endStr = endDate ? dayjs(endDate).format('DD/MM') : '';
        const weekNum = startDate ? dayjs(startDate).isoWeek() : '';
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        const label = `${t('timeFilter.weekLabel', {
            week: weekNum,
            year: yearStr,
            defaultValue: `Tuần ${weekNum}, ${yearStr}`,
        })} (${startStr} → ${endStr})`;
        return shiftLabel ? `${label} • ${shiftLabel}` : label;
    }

    if (mode === 'MONTH') {
        const monthStr = startDate ? dayjs(startDate).format('MM') : '';
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        const label = t('timeFilter.monthLabel', {
            month: monthStr,
            year: yearStr,
            defaultValue: `Tháng ${monthStr}/${yearStr}`,
        });
        return shiftLabel ? `${label} • ${shiftLabel}` : label;
    }

    if (mode === 'QUARTER') {
        const quarterNum = startDate ? dayjs(startDate).quarter() : '';
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        const label = t('timeFilter.quarterLabel', {
            quarter: quarterNum,
            year: yearStr,
            defaultValue: `Quý ${quarterNum}/${yearStr}`,
        });
        return shiftLabel ? `${label} • ${shiftLabel}` : label;
    }

    if (mode === 'YEAR') {
        const yearStr = startDate ? dayjs(startDate).format('YYYY') : '';
        const label = t('timeFilter.yearLabel', {
            year: yearStr,
            defaultValue: `Năm ${yearStr}`,
        });
        return shiftLabel ? `${label} • ${shiftLabel}` : label;
    }

    if (mode === 'CUSTOM_RANGE') {
        const rangeLabel =
            startDate && endDate
                ? `${dayjs(startDate).format('DD/MM')} → ${dayjs(endDate).format('DD/MM')}`
                : '';
        return shiftLabel ? `${rangeLabel} • ${shiftLabel}` : rangeLabel;
    }

    if (mode === 'PRESET') {
        const primaryFilter = industryFilters.find((f) => f.filterId === periodId);
        const primaryLabel = primaryFilter
            ? lang === 'vi'
                ? primaryFilter.displayNameVi
                : primaryFilter.displayNameEn
            : null;

        if (primaryLabel && shiftLabel) {
            return `${primaryLabel} • ${shiftLabel}`;
        }
        return primaryLabel ?? shiftLabel ?? null;
    }

    return t('timeFilter.all', { defaultValue: 'Tất cả thời gian' });
}

// 1. Shift Section
interface ShiftSectionProps {
    shiftId: number | null;
    onChange: (id: number | null) => void;
    groupedShifts: { label: string; value: number }[];
    industryFilters: IndustryFilter[];
    isShiftActive?: (filter: IndustryFilter) => boolean;
    isMobile: boolean;
    title: string;
    allShiftsLabel: string;
    activeTagLabel: string;
}

const ShiftSection = React.memo<ShiftSectionProps>(
    ({
        shiftId,
        onChange,
        groupedShifts,
        industryFilters,
        isShiftActive,
        isMobile,
        title,
        allShiftsLabel,
        activeTagLabel,
    }) => {
        if (groupedShifts.length === 0) return null;

        return (
            <>
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
                    {title}
                </Typography.Text>
                <Radio.Group
                    value={shiftId}
                    onChange={(e) => onChange(e.target.value as number | null)}
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Radio value={null}>{allShiftsLabel}</Radio>
                        {groupedShifts.map((option) => {
                            const filter = industryFilters.find((f) => f.filterId === option.value);
                            const isActive = Boolean(filter && isShiftActive?.(filter));

                            return (
                                <Radio key={option.value} value={option.value}>
                                    <Space size={4}>
                                        <Typography.Text
                                            ellipsis
                                            style={{
                                                maxWidth: isMobile ? 'calc(100vw - 160px)' : 200,
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            {option.label}
                                        </Typography.Text>
                                        {isActive && (
                                            <Tag
                                                color="green"
                                                style={{
                                                    margin: 0,
                                                    fontSize: 10,
                                                    lineHeight: '16px',
                                                    padding: '0 5px',
                                                }}
                                            >
                                                {activeTagLabel}
                                            </Tag>
                                        )}
                                    </Space>
                                </Radio>
                            );
                        })}
                    </Space>
                </Radio.Group>
                <Divider style={{ margin: '10px 0' }} />
            </>
        );
    }
);
ShiftSection.displayName = 'ShiftSection';

// 2. Mode Button Item
interface ModeButtonItemProps {
    label: string;
    value: PeriodFilterMode;
    isSelected: boolean;
    onClick: (value: PeriodFilterMode) => void;
}

const ModeButtonItem = React.memo<ModeButtonItemProps>(({ label, value, isSelected, onClick }) => {
    return (
        <Button
            size="small"
            type={isSelected ? 'primary' : 'default'}
            onClick={() => onClick(value)}
            style={{
                borderRadius: 6,
                fontSize: 11,
                fontWeight: isSelected ? 600 : 400,
                height: 30,
                padding: '0 2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {label}
        </Button>
    );
});
ModeButtonItem.displayName = 'ModeButtonItem';

// 3. Mode Selection Section
interface ModeSelectionSectionProps {
    currentMode: PeriodFilterMode;
    onSelectMode: (mode: PeriodFilterMode) => void;
    modeButtons: { label: string; value: PeriodFilterMode }[];
    title: string;
}

const ModeSelectionSection = React.memo<ModeSelectionSectionProps>(
    ({ currentMode, onSelectMode, modeButtons, title }) => {
        return (
            <>
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
                    {title}
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
                        <ModeButtonItem
                            key={btn.value}
                            label={btn.label}
                            value={btn.value}
                            isSelected={currentMode === btn.value}
                            onClick={onSelectMode}
                        />
                    ))}
                </div>
            </>
        );
    }
);
ModeSelectionSection.displayName = 'ModeSelectionSection';

// 4. Preset Pill Item
interface PresetPillItemProps {
    label: string;
    value: number;
    isSelected: boolean;
    onClick: (value: number) => void;
    colorPrimary: string;
    colorPrimaryBg: string;
    colorBgContainer: string;
    colorText: string;
    colorBorderSecondary: string;
}

const PresetPillItem = React.memo<PresetPillItemProps>(
    ({
        label,
        value,
        isSelected,
        onClick,
        colorPrimary,
        colorPrimaryBg,
        colorBgContainer,
        colorText,
        colorBorderSecondary,
    }) => {
        return (
            <div
                onClick={() => onClick(value)}
                style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    textAlign: 'center',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? colorPrimaryBg : colorBgContainer,
                    color: isSelected ? colorPrimary : colorText,
                    border: `1px solid ${isSelected ? colorPrimary : colorBorderSecondary}`,
                    boxShadow: isSelected ? `0 0 0 1px ${colorPrimary}` : 'none',
                    transition: 'all 0.15s ease-in-out',
                    userSelect: 'none',
                }}
            >
                <Typography.Text
                    ellipsis
                    style={{
                        color: 'inherit',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                    }}
                >
                    {label}
                </Typography.Text>
            </div>
        );
    }
);
PresetPillItem.displayName = 'PresetPillItem';

// 5. Preset Grid Section
interface PresetGridSectionProps {
    selectedPeriodId: number | null;
    onSelectPeriod: (id: number) => void;
    periodOptions: { label: string; value: number }[];
    title: string;
    colorPrimary: string;
    colorPrimaryBg: string;
    colorBgContainer: string;
    colorText: string;
    colorBorderSecondary: string;
    colorFillQuaternary: string;
}

const PresetGridSection = React.memo<PresetGridSectionProps>(
    ({
        selectedPeriodId,
        onSelectPeriod,
        periodOptions,
        title,
        colorPrimary,
        colorPrimaryBg,
        colorBgContainer,
        colorText,
        colorBorderSecondary,
        colorFillQuaternary,
    }) => {
        return (
            <div
                style={{
                    background: colorFillQuaternary,
                    borderRadius: 8,
                    padding: '10px 10px',
                    border: `1px solid ${colorBorderSecondary}`,
                }}
            >
                <Typography.Text
                    type="secondary"
                    style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                    }}
                >
                    {title}
                </Typography.Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {periodOptions.map((option) => (
                        <PresetPillItem
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            isSelected={selectedPeriodId === option.value}
                            onClick={onSelectPeriod}
                            colorPrimary={colorPrimary}
                            colorPrimaryBg={colorPrimaryBg}
                            colorBgContainer={colorBgContainer}
                            colorText={colorText}
                            colorBorderSecondary={colorBorderSecondary}
                        />
                    ))}
                </div>
            </div>
        );
    }
);
PresetGridSection.displayName = 'PresetGridSection';

// 6. Footer Actions
interface FooterActionsProps {
    onReset?: () => void;
    onCancel: () => void;
    onApply: () => void;
    isApplyDisabled: boolean;
    resetLabel: string;
    cancelLabel: string;
    applyLabel: string;
}

const FooterActions = React.memo<FooterActionsProps>(
    ({ onReset, onCancel, onApply, isApplyDisabled, resetLabel, cancelLabel, applyLabel }) => {
        return (
            <>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    {onReset ? <Button onClick={onReset}>{resetLabel}</Button> : <div />}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button onClick={onCancel}>{cancelLabel}</Button>
                        <Button type="primary" onClick={onApply} disabled={isApplyDisabled}>
                            {applyLabel}
                        </Button>
                    </div>
                </div>
            </>
        );
    }
);
FooterActions.displayName = 'FooterActions';

/**
 * Shared TimeFilterPopoverContent component.
 * Supports configurable sections (showShifts, showPresets, allowedModes).
 */
export const TimeFilterPopoverContent: React.FC<TimeFilterPopoverContentProps> = ({
    currentMode,
    currentPeriodId = null,
    currentShiftId = null,
    currentStartDate,
    currentEndDate,
    groupedOptions,
    industryFilters,
    isShiftActive,
    showShifts = true,
    showPresets = true,
    allowedModes,
    title,
    isMobile = false,
    isOpen,
    onApply,
    onReset,
    onCancel,
    defaultDate = '2025-08-25',
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const periodOptions = groupedOptions.PERIOD || [];
    const shiftOptions = groupedOptions.SHIFT || [];
    const canShowShifts = showShifts && shiftOptions.length > 0;
    const canShowPresets = showPresets && periodOptions.length > 0;

    const baseDate = useMemo(() => {
        if (currentStartDate) return dayjs(currentStartDate);
        return dayjs(defaultDate);
    }, [currentStartDate, defaultDate]);

    // Available mode list filtered by allowedModes and availability
    const modeButtons = useMemo((): { label: string; value: PeriodFilterMode }[] => {
        const allCandidates: { label: string; value: PeriodFilterMode; condition: boolean }[] = [
            {
                label: t('timeFilter.quickSelect', { defaultValue: 'Chọn nhanh' }),
                value: 'PRESET',
                condition: canShowPresets,
            },
            {
                label: t('timeFilter.week', { defaultValue: 'Theo tuần' }),
                value: 'WEEK',
                condition: true,
            },
            {
                label: t('timeFilter.month', { defaultValue: 'Theo tháng' }),
                value: 'MONTH',
                condition: true,
            },
            {
                label: t('timeFilter.quarter', { defaultValue: 'Theo quý' }),
                value: 'QUARTER',
                condition: true,
            },
            {
                label: t('timeFilter.year', { defaultValue: 'Theo năm' }),
                value: 'YEAR',
                condition: true,
            },
            {
                label: t('timeFilter.customRange', { defaultValue: 'Khoảng ngày' }),
                value: 'CUSTOM_RANGE',
                condition: true,
            },
        ];

        return allCandidates
            .filter((c) => c.condition && (!allowedModes || allowedModes.includes(c.value)))
            .map(({ label, value }) => ({ label, value }));
    }, [canShowPresets, allowedModes, t]);

    const fallbackMode = modeButtons[0]?.value || 'MONTH';

    const [draftMode, setDraftMode] = useState<PeriodFilterMode>(currentMode || fallbackMode);
    const [draftPeriodId, setDraftPeriodId] = useState<number | null>(
        currentPeriodId ?? periodOptions[0]?.value ?? null
    );
    const [draftShiftId, setDraftShiftId] = useState<number | null>(
        canShowShifts ? (currentShiftId ?? null) : null
    );
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
            setDraftMode(currentMode || fallbackMode);
            setDraftPeriodId(currentPeriodId ?? periodOptions[0]?.value ?? null);
            setDraftShiftId(canShowShifts ? (currentShiftId ?? null) : null);
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
    }, [
        isOpen,
        currentMode,
        fallbackMode,
        currentPeriodId,
        currentShiftId,
        currentStartDate,
        currentEndDate,
        defaultDate,
        canShowShifts,
        periodOptions,
    ]);

    const handleSelectMode = useCallback(
        (mode: PeriodFilterMode) => {
            setDraftMode(mode);
            if (mode === 'PRESET' && periodOptions.length > 0) {
                setDraftPeriodId((prev) => prev ?? periodOptions[0].value);
            }
        },
        [periodOptions]
    );

    const handleSelectPeriod = useCallback((id: number) => {
        setDraftPeriodId(id);
    }, []);

    const handleApply = useCallback(() => {
        let primaryFilterId: number | null = null;
        let secondaryShiftId: number | null = null;
        let startDate: string;
        let endDate: string;

        if (draftMode === 'PRESET') {
            if (draftPeriodId !== null) {
                primaryFilterId = draftPeriodId;
                secondaryShiftId = canShowShifts ? draftShiftId : null;
                const selectedFilter = industryFilters.find((f) => f.filterId === draftPeriodId);
                const [s, e] = computeDateRangeForMode(
                    'PRESET',
                    {
                        dateRange: draftDateRange,
                        week: draftWeek,
                        month: draftMonth,
                        quarter: draftQuarter,
                        year: draftYear,
                    },
                    selectedFilter
                );
                startDate = s;
                endDate = e;
            } else if (canShowShifts && draftShiftId !== null) {
                primaryFilterId = draftShiftId;
                secondaryShiftId = null;
                const todayStr = dayjs().format('YYYY-MM-DD');
                startDate = todayStr;
                endDate = todayStr;
            } else {
                return;
            }
        } else {
            primaryFilterId = canShowShifts ? draftShiftId : null;
            secondaryShiftId = null;
            const [s, e] = computeDateRangeForMode(draftMode, {
                dateRange: draftDateRange,
                week: draftWeek,
                month: draftMonth,
                quarter: draftQuarter,
                year: draftYear,
            });
            startDate = s;
            endDate = e;
        }

        onApply({
            mode: draftMode,
            primaryFilterId,
            secondaryShiftId,
            startDate,
            endDate,
        });
    }, [
        draftMode,
        draftPeriodId,
        draftShiftId,
        canShowShifts,
        industryFilters,
        draftDateRange,
        draftWeek,
        draftMonth,
        draftQuarter,
        draftYear,
        onApply,
    ]);

    const renderDatePreview = (start: Dayjs, end: Dayjs) => (
        <Typography.Text
            type="secondary"
            style={{
                fontSize: 11,
                display: 'block',
                marginTop: 6,
                textAlign: 'center',
            }}
        >
            {start.format('DD/MM/YYYY')} &rarr; {end.format('DD/MM/YYYY')}
        </Typography.Text>
    );

    const isApplyDisabled =
        draftMode === 'PRESET' &&
        draftPeriodId === null &&
        (!canShowShifts || draftShiftId === null);

    const handleReset = useCallback(() => {
        if (onReset) {
            onReset();
            return;
        }
        const activeShift = industryFilters.find(
            (filter) => filter.category === 'SHIFT' && isShiftActive?.(filter)
        );
        setDraftMode(fallbackMode);
        setDraftPeriodId(periodOptions[0]?.value ?? null);
        setDraftShiftId(
            canShowShifts ? (activeShift?.filterId ?? shiftOptions[0]?.value ?? null) : null
        );
        setDraftDateRange([dayjs(), dayjs()]);
        setDraftWeek(dayjs());
        setDraftMonth(dayjs());
        setDraftQuarter(dayjs());
        setDraftYear(dayjs());
    }, [
        onReset,
        industryFilters,
        isShiftActive,
        fallbackMode,
        periodOptions,
        canShowShifts,
        shiftOptions,
    ]);

    return (
        <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 340, maxWidth: 340 }}>
            <Typography.Text strong style={{ fontSize: 14 }}>
                {title || t('timeFilter.title', { defaultValue: 'Thời gian' })}
            </Typography.Text>

            <Divider style={{ margin: '10px 0' }} />

            {/* Shift selection (Ca làm việc) — only displayed when enabled */}
            {canShowShifts && (
                <ShiftSection
                    shiftId={draftShiftId}
                    onChange={setDraftShiftId}
                    groupedShifts={shiftOptions}
                    industryFilters={industryFilters}
                    isShiftActive={isShiftActive}
                    isMobile={isMobile}
                    title={t('timeFilter.shifts', { defaultValue: 'Ca làm việc' })}
                    allShiftsLabel={t('timeFilter.allShifts', { defaultValue: 'Tất cả' })}
                    activeTagLabel={t('timeFilter.active', { defaultValue: 'Đang hoạt động' })}
                />
            )}

            {/* Mode selection buttons */}
            <ModeSelectionSection
                currentMode={draftMode}
                onSelectMode={handleSelectMode}
                modeButtons={modeButtons}
                title={t('timeFilter.periodType', { defaultValue: 'Chế độ chọn thời gian' })}
            />

            {/* Context-aware Picker & Sub-container */}
            {draftMode === 'PRESET' && canShowPresets && (
                <PresetGridSection
                    selectedPeriodId={draftPeriodId}
                    onSelectPeriod={handleSelectPeriod}
                    periodOptions={periodOptions}
                    title={t('timeFilter.presetOptions', { defaultValue: 'Tùy chọn có sẵn' })}
                    colorPrimary={token.colorPrimary}
                    colorPrimaryBg={token.colorPrimaryBg}
                    colorBgContainer={token.colorBgContainer}
                    colorText={token.colorText}
                    colorBorderSecondary={token.colorBorderSecondary}
                    colorFillQuaternary={token.colorFillQuaternary}
                />
            )}

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
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
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
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
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
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
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
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
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
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                    {draftDateRange[0] &&
                        draftDateRange[1] &&
                        renderDatePreview(draftDateRange[0], draftDateRange[1])}
                </div>
            )}

            {/* Footer actions */}
            <FooterActions
                onReset={handleReset}
                onCancel={onCancel}
                onApply={handleApply}
                isApplyDisabled={isApplyDisabled}
                resetLabel={t('timeFilter.reset', { defaultValue: 'Đặt lại' })}
                cancelLabel={t('common.cancel', { defaultValue: 'Hủy' })}
                applyLabel={t('timeFilter.apply', { defaultValue: 'Áp dụng' })}
            />
        </div>
    );
};

export const TimeFilterPopover = TimeFilterPopoverContent;
export type TimeFilterPopoverProps = TimeFilterPopoverContentProps;
export default React.memo(TimeFilterPopoverContent);
