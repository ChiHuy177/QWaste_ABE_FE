'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    DatePicker,
    Divider,
    Grid,
    Popover,
    Radio,
    Space,
    Tag,
    theme,
    Tooltip,
    Typography,
    Spin,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { IndustryFilter } from '@/types/IndustryFilter';
import { UtilsService } from '@/services/UtilsService';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export type PeriodFilterMode = 'PRESET' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM_RANGE';

export interface TimeFilterApplyPayload {
    mode: PeriodFilterMode;
    primaryFilterId: number | null;
    secondaryShiftId: number | null;
    startDate: string;
    endDate: string;
}

export interface TimeFilterPopoverProps {
    currentMode: PeriodFilterMode;
    currentPeriodId: number | null;
    currentShiftId: number | null;
    currentStartDate: string;
    currentEndDate: string;
    groupedOptions: {
        SHIFT: { label: string; value: number }[];
        PERIOD: { label: string; value: number }[];
    };
    industryFilters: IndustryFilter[];
    isShiftActive: (filter: IndustryFilter) => boolean;
    onApply: (payload: TimeFilterApplyPayload) => void;
    placement?: 'bottomLeft' | 'bottomRight';
}

const { useBreakpoint } = Grid;

function safeDayjs(date?: string | Dayjs | null): Dayjs {
    if (!date) return dayjs();
    const d = dayjs(date);
    return d.isValid() ? d : dayjs();
}

function computeDateRangeForMode(
    mode: PeriodFilterMode,
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
        case 'PRESET':
        default:
            return [
                values.dateRange[0].format('YYYY-MM-DD'),
                values.dateRange[1].format('YYYY-MM-DD'),
            ];
    }
}

// 1. Memoized Shift Section
interface ShiftSectionProps {
    shiftId: number | null;
    onChange: (id: number | null) => void;
    groupedShifts: { label: string; value: number }[];
    industryFilters: IndustryFilter[];
    isShiftActive: (filter: IndustryFilter) => boolean;
    isMobile: boolean;
    title: string;
    allShiftsLabel: string;
    activeTagLabel: string;
    isSingleDay?: boolean;
    singleDayWarning?: string;
    isLoading?: boolean;
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
        isSingleDay = true,
        singleDayWarning,
        isLoading = false,
    }) => {
        const { token } = theme.useToken();

        return (
            <div>
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
                {!isSingleDay && singleDayWarning && (
                    <Typography.Text
                        type="secondary"
                        style={{
                            fontSize: 11,
                            display: 'block',
                            marginBottom: 6,
                            color: token.colorWarning,
                        }}
                    >
                        {singleDayWarning}
                    </Typography.Text>
                )}
                {isLoading ? (
                    <div style={{ padding: '8px 0', textAlign: 'center' }}>
                        <Spin size="small" />
                    </div>
                ) : (
                    <Radio.Group
                        value={shiftId}
                        onChange={(e) => onChange(e.target.value as number | null)}
                        disabled={!isSingleDay}
                        style={{ width: '100%' }}
                    >
                        <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                            <Radio value={null}>{allShiftsLabel}</Radio>
                            {isSingleDay && groupedShifts.length === 0 && (
                                <Typography.Text
                                    type="secondary"
                                    style={{ fontSize: 12, paddingLeft: 24, display: 'block' }}
                                >
                                    {/* helper note */}
                                </Typography.Text>
                            )}
                            {groupedShifts.map((option) => {
                                const filter = industryFilters.find(
                                    (f) => f.filterId === option.value
                                );
                                const isActive = filter && isShiftActive(filter);

                                return (
                                    <Tooltip
                                        key={option.value}
                                        title={!isSingleDay ? singleDayWarning : undefined}
                                    >
                                        <Radio value={option.value} disabled={!isSingleDay}>
                                            <Space size={4}>
                                                <Typography.Text
                                                    ellipsis
                                                    style={{
                                                        maxWidth: isMobile
                                                            ? 'calc(100vw - 160px)'
                                                            : 200,
                                                        verticalAlign: 'middle',
                                                        color: !isSingleDay ? 'inherit' : undefined,
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
                                    </Tooltip>
                                );
                            })}
                        </Space>
                    </Radio.Group>
                )}
            </div>
        );
    }
);
ShiftSection.displayName = 'ShiftSection';

// 2. Memoized Mode Button Item
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

// 3. Memoized Mode Selection Section
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

// 4. Memoized Preset Pill Item
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

// 5. Memoized Preset Grid Section
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

// 6. Memoized Footer Actions
interface FooterActionsProps {
    onReset: () => void;
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
                    <Button onClick={onReset}>{resetLabel}</Button>
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

// Self-contained Popover: owns the trigger Button and open state itself, unlike the
// previous split (page.tsx wired Popover + trigger + isOpen, this file only rendered
// the inner content). One instantiation per breakpoint still needed for the differing
// trigger layout (block+no-tooltip on mobile vs fixed-width+Tooltip on desktop) — the
// caller picks that via `placement`, everything else adapts internally via isMobile.
const TimeFilterPopover: React.FC<TimeFilterPopoverProps> = ({
    currentMode,
    currentPeriodId,
    currentShiftId,
    currentStartDate,
    currentEndDate,
    groupedOptions,
    industryFilters,
    isShiftActive,
    onApply,
    placement = 'bottomRight',
}) => {
    const { t, i18n } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [open, setOpen] = useState(false);
    const [draftMode, setDraftMode] = useState<PeriodFilterMode>(currentMode);
    const [draftPeriodId, setDraftPeriodId] = useState<number | null>(currentPeriodId);
    const [draftShiftId, setDraftShiftId] = useState<number | null>(currentShiftId);
    const [draftWeek, setDraftWeek] = useState<Dayjs>(() => safeDayjs(currentStartDate));
    const [draftMonth, setDraftMonth] = useState<Dayjs>(() => safeDayjs(currentStartDate));
    const [draftQuarter, setDraftQuarter] = useState<Dayjs>(() => safeDayjs(currentStartDate));
    const [draftYear, setDraftYear] = useState<Dayjs>(() => safeDayjs(currentStartDate));
    const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs]>([
        safeDayjs(currentStartDate),
        safeDayjs(currentEndDate),
    ]);

    const syncDraft = useCallback(() => {
        setDraftMode(currentMode);
        setDraftPeriodId(currentPeriodId);
        setDraftShiftId(currentShiftId);
        const s = safeDayjs(currentStartDate);
        const e = safeDayjs(currentEndDate);
        setDraftWeek(s);
        setDraftMonth(s);
        setDraftQuarter(s);
        setDraftYear(s);
        setDraftDateRange([s, e]);
    }, [currentMode, currentPeriodId, currentShiftId, currentStartDate, currentEndDate]);

    // Backend rule (Error 915): Single shift filtering is only supported when viewing a single specific day
    const isSingleDay = useMemo(() => {
        if (draftMode === 'CUSTOM_RANGE') {
            return (
                draftDateRange[0].format('YYYY-MM-DD') === draftDateRange[1].format('YYYY-MM-DD')
            );
        }
        if (draftMode === 'PRESET') {
            const selectedPeriod = industryFilters.find((f) => f.filterId === draftPeriodId);
            if (!selectedPeriod) return false;
            return (
                selectedPeriod.periodCode === 'TODAY' || selectedPeriod.periodCode === 'YESTERDAY'
            );
        }
        return false;
    }, [draftMode, draftDateRange, industryFilters, draftPeriodId]);

    // Compute the single date string if currently picking/viewing a single day
    const pickedDate = useMemo(() => {
        if (!isSingleDay) return null;
        if (draftMode === 'CUSTOM_RANGE') {
            return draftDateRange[0].format('YYYY-MM-DD');
        }
        if (draftMode === 'PRESET') {
            const selectedPeriod = industryFilters.find((f) => f.filterId === draftPeriodId);
            if (selectedPeriod?.periodCode === 'TODAY') {
                return dayjs().format('YYYY-MM-DD');
            }
            if (selectedPeriod?.periodCode === 'YESTERDAY') {
                return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
            }
        }
        return null;
    }, [isSingleDay, draftMode, draftDateRange, industryFilters, draftPeriodId]);

    // Automatically clear specific shift filter if period spans more than 1 day (default to all shifts)
    useEffect(() => {
        if (!isSingleDay && draftShiftId !== null) {
            setDraftShiftId(null);
        }
    }, [isSingleDay, draftShiftId]);

    // Fetch available shifts dynamically from backend API when picking a single date
    const [dynamicShifts, setDynamicShifts] = useState<IndustryFilter[]>([]);
    const [isLoadingShifts, setIsLoadingShifts] = useState<boolean>(false);

    useEffect(() => {
        if (!isSingleDay || !pickedDate) {
            setDynamicShifts([]);
            setIsLoadingShifts(false);
            return;
        }

        let isCancelled = false;

        const fetchShifts = async () => {
            setIsLoadingShifts(true);
            try {
                const shifts = await UtilsService.getShiftsForDate(pickedDate);
                if (!isCancelled) {
                    const validShifts = shifts || [];
                    setDynamicShifts(validShifts);
                    if (
                        draftShiftId !== null &&
                        !validShifts.some((s) => s.filterId === draftShiftId)
                    ) {
                        setDraftShiftId(null);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch shifts for date:', pickedDate, err);
                if (!isCancelled) {
                    setDynamicShifts([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingShifts(false);
                }
            }
        };

        fetchShifts();

        return () => {
            isCancelled = true;
        };
    }, [pickedDate, isSingleDay]);

    // Grouped shift options for ShiftSection
    const currentShiftOptions = useMemo(() => {
        if (!isSingleDay) {
            return [];
        }
        const currentLang = i18n.language;
        return dynamicShifts.map((f) => ({
            label: currentLang === 'vi' ? f.displayNameVi : f.displayNameEn,
            value: f.filterId,
        }));
    }, [isSingleDay, dynamicShifts, i18n.language]);

    // Merged filters to resolve labels and active states for both global and dynamic shifts
    const allIndustryFilters = useMemo(() => {
        const map = new Map<number, IndustryFilter>();
        industryFilters.forEach((f) => map.set(f.filterId, f));
        dynamicShifts.forEach((f) => map.set(f.filterId, f));
        return Array.from(map.values());
    }, [industryFilters, dynamicShifts]);

    const singleDayWarning = useMemo(
        () =>
            i18n.language === 'vi'
                ? '(*) Khi xem khoảng ngày, mặc định xem tất cả các ca (không chọn ca riêng lẻ).'
                : '(*) Date range: viewing all shifts by default (individual shift selection disabled).',
        [i18n.language]
    );

    const todayPeriod = useMemo(
        () =>
            industryFilters.find((f) => f.category === 'PERIOD' && f.periodCode === 'TODAY') ||
            industryFilters.find((f) => f.category === 'PERIOD'),
        [industryFilters]
    );

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (nextOpen) syncDraft();
            setOpen(nextOpen);
        },
        [syncDraft]
    );

    const handleReset = useCallback(() => {
        setDraftMode('PRESET');
        setDraftPeriodId(todayPeriod?.filterId ?? null);
        setDraftShiftId(null);
        setDraftDateRange([dayjs(), dayjs()]);
        setDraftWeek(dayjs());
        setDraftMonth(dayjs());
        setDraftQuarter(dayjs());
        setDraftYear(dayjs());
    }, [todayPeriod]);

    const handleSelectMode = useCallback(
        (mode: PeriodFilterMode) => {
            setDraftMode(mode);
            if (mode === 'PRESET' && groupedOptions.PERIOD.length > 0) {
                setDraftPeriodId((prev) => prev ?? groupedOptions.PERIOD[0].value);
            }
            setDraftWeek((prev) => (prev && prev.isValid() ? prev : dayjs()));
            setDraftMonth((prev) => (prev && prev.isValid() ? prev : dayjs()));
            setDraftQuarter((prev) => (prev && prev.isValid() ? prev : dayjs()));
            setDraftYear((prev) => (prev && prev.isValid() ? prev : dayjs()));
            setDraftDateRange((prev) =>
                prev && prev[0]?.isValid() && prev[1]?.isValid() ? prev : [dayjs(), dayjs()]
            );
        },
        [groupedOptions.PERIOD]
    );

    const handleSelectPeriod = useCallback((id: number) => {
        setDraftPeriodId(id);
    }, []);

    const handleApplyClick = useCallback(() => {
        let primaryFilterId: number | null;
        let secondaryShiftId: number | null;
        let startDate = draftDateRange[0]?.isValid()
            ? draftDateRange[0].format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD');
        let endDate = draftDateRange[1]?.isValid()
            ? draftDateRange[1].format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD');

        if (draftMode === 'PRESET') {
            if (draftPeriodId !== null) {
                primaryFilterId = draftPeriodId;
                secondaryShiftId = draftShiftId;
            } else if (draftShiftId !== null) {
                primaryFilterId = draftShiftId;
                secondaryShiftId = null;
            } else {
                return;
            }
        } else {
            const computedDates = computeDateRangeForMode(draftMode, {
                dateRange: draftDateRange,
                week: draftWeek,
                month: draftMonth,
                quarter: draftQuarter,
                year: draftYear,
            });
            startDate = computedDates[0];
            endDate = computedDates[1];
            primaryFilterId = draftShiftId;
            secondaryShiftId = null;
        }

        onApply({
            mode: draftMode,
            primaryFilterId,
            secondaryShiftId,
            startDate,
            endDate,
        });
        setOpen(false);
    }, [
        draftMode,
        draftPeriodId,
        draftShiftId,
        draftDateRange,
        draftWeek,
        draftMonth,
        draftQuarter,
        draftYear,
        onApply,
    ]);

    const modeButtons = useMemo(
        (): { label: string; value: PeriodFilterMode }[] => [
            ...(groupedOptions.PERIOD.length > 0
                ? [{ label: t('spaceMonitoring.timeFilter.quickSelect'), value: 'PRESET' as const }]
                : []),
            { label: t('spaceMonitoring.timeFilter.week'), value: 'WEEK' as const },
            { label: t('spaceMonitoring.timeFilter.month'), value: 'MONTH' as const },
            { label: t('spaceMonitoring.timeFilter.quarter'), value: 'QUARTER' as const },
            { label: t('spaceMonitoring.timeFilter.year'), value: 'YEAR' as const },
            { label: t('spaceMonitoring.timeFilter.customRange'), value: 'CUSTOM_RANGE' as const },
        ],
        [groupedOptions.PERIOD.length, t]
    );

    const renderDatePreview = (start: Dayjs, end: Dayjs) => (
        <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
            {start.format('DD/MM/YYYY')} → {end.format('DD/MM/YYYY')}
        </Typography.Text>
    );

    const isApplyDisabled =
        draftMode === 'PRESET' && draftPeriodId === null && draftShiftId === null;

    // Trigger-button label, resolved from the committed (applied) filter — not the draft
    // being edited inside the popover. Mirrors the old page-level activeTimePeriodLabel.
    const activeLabel = useMemo(() => {
        const currentLang = i18n.language;
        const shiftFilter =
            currentShiftId != null
                ? allIndustryFilters.find((f) => f.filterId === currentShiftId)
                : null;
        const shiftLabel = shiftFilter
            ? currentLang === 'vi'
                ? shiftFilter.displayNameVi
                : shiftFilter.displayNameEn
            : null;

        if (currentMode === 'WEEK') {
            const startStr = dayjs(currentStartDate).format('DD/MM');
            const endStr = dayjs(currentEndDate).format('DD/MM');
            const weekNum = dayjs(currentStartDate).isoWeek();
            const yearStr = dayjs(currentStartDate).format('YYYY');
            const label = `${t('spaceMonitoring.timeFilter.weekLabel', { week: weekNum, year: yearStr })} (${startStr} → ${endStr})`;
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (currentMode === 'MONTH') {
            const label = t('spaceMonitoring.timeFilter.monthLabel', {
                month: dayjs(currentStartDate).format('MM'),
                year: dayjs(currentStartDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (currentMode === 'QUARTER') {
            const quarterNum = dayjs(currentStartDate).quarter();
            const label = t('spaceMonitoring.timeFilter.quarterLabel', {
                quarter: quarterNum,
                year: dayjs(currentStartDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (currentMode === 'YEAR') {
            const label = t('spaceMonitoring.timeFilter.yearLabel', {
                year: dayjs(currentStartDate).format('YYYY'),
            });
            return shiftLabel ? `${label} • ${shiftLabel}` : label;
        }

        if (currentMode === 'CUSTOM_RANGE') {
            const dateLabel = `${dayjs(currentStartDate).format('DD/MM')} → ${dayjs(currentEndDate).format('DD/MM')}`;
            return shiftLabel ? `${dateLabel} • ${shiftLabel}` : dateLabel;
        }

        const period = allIndustryFilters.find((f) => f.filterId === currentPeriodId);
        const periodLabel = period
            ? currentLang === 'vi'
                ? period.displayNameVi
                : period.displayNameEn
            : null;

        if (!periodLabel) return shiftLabel;
        return shiftLabel ? `${periodLabel} • ${shiftLabel}` : periodLabel;
    }, [
        currentMode,
        currentPeriodId,
        currentShiftId,
        currentStartDate,
        currentEndDate,
        allIndustryFilters,
        i18n.language,
        t,
    ]);

    const content = (
        <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 340, maxWidth: 340 }}>
            <Typography.Text strong style={{ fontSize: 14 }}>
                {t('spaceMonitoring.timeFilter.title')}
            </Typography.Text>

            <Divider style={{ margin: '10px 0' }} />

            {/* Mode selection buttons */}
            <ModeSelectionSection
                currentMode={draftMode}
                onSelectMode={handleSelectMode}
                modeButtons={modeButtons}
                title={t('spaceMonitoring.timeFilter.periodType')}
            />

            {/* Context-aware Picker & Sub-container */}
            {draftMode === 'PRESET' && groupedOptions.PERIOD.length > 0 && (
                <PresetGridSection
                    selectedPeriodId={draftPeriodId}
                    onSelectPeriod={handleSelectPeriod}
                    periodOptions={groupedOptions.PERIOD}
                    title={t('spaceMonitoring.timeFilter.presetOptions')}
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
                        {t('spaceMonitoring.timeFilter.selectWeek')}
                    </Typography.Text>
                    <DatePicker
                        picker="week"
                        showWeek={false}
                        value={draftWeek && draftWeek.isValid() ? draftWeek : dayjs()}
                        onChange={(date) => setDraftWeek(date && date.isValid() ? date : dayjs())}
                        format={(date) =>
                            date && date.isValid()
                                ? `${date.startOf('isoWeek').format('DD/MM')} - ${date.endOf('isoWeek').format('DD/MM/YYYY')}`
                                : ''
                        }
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('spaceMonitoring.timeFilter.selectWeek')}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
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
                        {t('spaceMonitoring.timeFilter.selectMonth')}
                    </Typography.Text>
                    <DatePicker
                        picker="month"
                        format="MM/YYYY"
                        value={draftMonth && draftMonth.isValid() ? draftMonth : dayjs()}
                        onChange={(date) => setDraftMonth(date && date.isValid() ? date : dayjs())}
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('spaceMonitoring.timeFilter.selectMonth')}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                    {renderDatePreview(
                        (draftMonth && draftMonth.isValid() ? draftMonth : dayjs()).startOf(
                            'month'
                        ),
                        (draftMonth && draftMonth.isValid() ? draftMonth : dayjs()).endOf('month')
                    )}
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
                        {t('spaceMonitoring.timeFilter.selectQuarter')}
                    </Typography.Text>
                    <DatePicker
                        picker="quarter"
                        format="[Q]Q/YYYY"
                        value={draftQuarter && draftQuarter.isValid() ? draftQuarter : dayjs()}
                        onChange={(date) =>
                            setDraftQuarter(date && date.isValid() ? date : dayjs())
                        }
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('spaceMonitoring.timeFilter.selectQuarter')}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                    {renderDatePreview(
                        (draftQuarter && draftQuarter.isValid() ? draftQuarter : dayjs()).startOf(
                            'quarter'
                        ),
                        (draftQuarter && draftQuarter.isValid() ? draftQuarter : dayjs()).endOf(
                            'quarter'
                        )
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
                        {t('spaceMonitoring.timeFilter.selectYear')}
                    </Typography.Text>
                    <DatePicker
                        picker="year"
                        format="YYYY"
                        value={draftYear && draftYear.isValid() ? draftYear : dayjs()}
                        onChange={(date) => setDraftYear(date && date.isValid() ? date : dayjs())}
                        style={{ width: '100%', borderRadius: 6 }}
                        placeholder={t('spaceMonitoring.timeFilter.selectYear')}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                    {renderDatePreview(
                        (draftYear && draftYear.isValid() ? draftYear : dayjs()).startOf('year'),
                        (draftYear && draftYear.isValid() ? draftYear : dayjs()).endOf('year')
                    )}
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
                        {t('spaceMonitoring.timeFilter.selectDateRange')}
                    </Typography.Text>
                    <DatePicker.RangePicker
                        value={
                            draftDateRange &&
                            draftDateRange[0]?.isValid() &&
                            draftDateRange[1]?.isValid()
                                ? draftDateRange
                                : [dayjs(), dayjs()]
                        }
                        onChange={(dates) => {
                            if (dates?.[0] && dates?.[1]) {
                                setDraftDateRange([dates[0], dates[1]]);
                            }
                        }}
                        format="DD/MM/YYYY"
                        style={{ width: '100%', borderRadius: 6 }}
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                    />
                </div>
            )}

            <Divider style={{ margin: '10px 0' }} />

            {/* Shift selection (Ca làm việc) - MOVED BELOW */}
            <ShiftSection
                shiftId={draftShiftId}
                onChange={setDraftShiftId}
                groupedShifts={currentShiftOptions}
                industryFilters={allIndustryFilters}
                isShiftActive={isShiftActive}
                isMobile={isMobile}
                title={t('spaceMonitoring.timeFilter.shifts')}
                allShiftsLabel={t('spaceMonitoring.timeFilter.allShifts')}
                activeTagLabel={t('spaceMonitoring.timeFilter.active')}
                isSingleDay={isSingleDay}
                singleDayWarning={singleDayWarning}
                isLoading={isLoadingShifts}
            />

            {/* Action buttons */}
            <FooterActions
                onReset={handleReset}
                onCancel={() => setOpen(false)}
                onApply={handleApplyClick}
                isApplyDisabled={isApplyDisabled}
                resetLabel={t('common.reset')}
                cancelLabel={t('common.cancel')}
                applyLabel={t('spaceMonitoring.timeFilter.apply')}
            />
        </div>
    );

    return (
        <Popover
            open={open}
            onOpenChange={handleOpenChange}
            trigger="click"
            placement={placement}
            content={content}
        >
            {isMobile ? (
                <Button
                    block
                    style={{
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 4,
                    }}
                >
                    <span style={{ flexShrink: 0 }}>{t('spaceMonitoring.timeFilter.time')}:</span>
                    <Typography.Text
                        ellipsis
                        style={{
                            maxWidth: 'calc(100% - 76px)',
                            color: 'inherit',
                            lineHeight: 'inherit',
                        }}
                    >
                        {activeLabel ?? t('common.filter')}
                    </Typography.Text>
                </Button>
            ) : (
                <Tooltip title={activeLabel}>
                    <Button
                        style={{
                            borderRadius: 8,
                            width: 220,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 4,
                        }}
                    >
                        <span style={{ flexShrink: 0 }}>
                            {t('spaceMonitoring.timeFilter.time')}:
                        </span>
                        <Typography.Text
                            ellipsis
                            style={{ maxWidth: 135, color: 'inherit', lineHeight: 'inherit' }}
                        >
                            {activeLabel ?? t('common.filter')}
                        </Typography.Text>
                    </Button>
                </Tooltip>
            )}
        </Popover>
    );
};

export default TimeFilterPopover;
