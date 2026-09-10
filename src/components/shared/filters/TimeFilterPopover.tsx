'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Collapse,
    DatePicker,
    Divider,
    Grid,
    Popover,
    Select,
    Space,
    Tabs,
    Tag,
    theme,
    Tooltip,
    Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { useTranslation } from 'react-i18next';
import { IndustryFilter } from '@/types/IndustryFilter';
import {
    ALL_LABEL_STYLES,
    ALL_TIME_GRAINS,
    CUSTOM_RANGE_DEFAULT_GRAIN,
    LabelStyle,
    TimeGrain,
    TimeGrainOption,
} from '@/types/Chart';
import { getLabelStyleLabel } from '@/utils/enumMappers';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

// ISO 8601: a year has 53 weeks iff Jan 1 falls on a Thursday, or it's a leap
// year and Jan 1 falls on a Wednesday — captured by this day-of-week congruence.
function isoWeeksInYear(year: number): number {
    const p = (y: number) =>
        (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
    return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

function startOfIsoWeek(year: number, week: number): Dayjs {
    // Jan 4th always falls in ISO week 1 of its year, regardless of weekday.
    const week1Start = dayjs().year(year).month(0).date(4).startOf('isoWeek');
    return week1Start.add((week - 1) * 7, 'day');
}

function capToToday(d: Dayjs): Dayjs {
    const today = dayjs().endOf('day');
    return d.isAfter(today) ? today : d;
}

export type TimeFilterMode = 'PRESET' | 'CUSTOM_RANGE';

export interface TimeFilterValue {
    mode: TimeFilterMode;
    periodId: number | null;
    shiftId: number | null;
    startDate: string;
    endDate: string;
    // Only meaningful when the caller passes grainOptions (see TimeFilterPopoverProps).
    grain?: TimeGrain | null;
    labelStyle?: LabelStyle | null;
}

interface TimeFilterPopoverProps {
    industryFilters: IndustryFilter[];
    value: TimeFilterValue;
    onApply: (value: TimeFilterValue) => void;
    placement?: 'bottomLeft' | 'bottomRight';
    // Presence of this prop turns on the "Group by" (grain) + advanced label-style
    // UI. Callers that don't pass it (OEE, Factory Pulse, Space Monitoring) render
    // exactly as before — their chart endpoints don't support grain/labelStyle yet.
    grainOptions?: TimeGrainOption[];
}

const { useBreakpoint } = Grid;

// Sentinel for the CheckableTagGroup "All shifts" option — group values must be string | number, not null.
const SHIFT_ALL = '__ALL__';

function checkShiftActive(filter: IndustryFilter): boolean {
    if (filter.category !== 'SHIFT') return false;
    const currentTime = dayjs().format('HH:mm:ss');
    if (!filter.crossesMidnight) {
        return currentTime >= filter.startTime && currentTime < filter.endTime;
    }
    return currentTime >= filter.startTime || currentTime < filter.endTime;
}

const TimeFilterPopover: React.FC<TimeFilterPopoverProps> = ({
    industryFilters,
    value,
    onApply,
    placement = 'bottomRight',
    grainOptions,
}) => {
    const { t, i18n } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const lang = i18n.language;
    const grainEnabled = grainOptions !== undefined;

    const [open, setOpen] = useState(false);
    const [draftMode, setDraftMode] = useState<TimeFilterMode>(value.mode);
    const [draftPeriodId, setDraftPeriodId] = useState<number | null>(value.periodId);
    const [draftShiftId, setDraftShiftId] = useState<number | null>(value.shiftId);
    const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs(value.startDate),
        dayjs(value.endDate),
    ]);
    const [draftYear, setDraftYear] = useState(() => dayjs().year());
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
    const [draftGrain, setDraftGrain] = useState<TimeGrain | null>(value.grain ?? null);
    const [draftLabelStyle, setDraftLabelStyle] = useState<LabelStyle | null>(
        value.labelStyle ?? null
    );
    // Shift/grain apply regardless of PRESET vs CUSTOM_RANGE, so only the preset-vs-range
    // choice itself is tabbed — this key is a view toggle, not part of the applied filter.
    const [activeTabKey, setActiveTabKey] = useState<'quick' | 'custom'>(
        value.mode === 'CUSTOM_RANGE' ? 'custom' : 'quick'
    );

    const yearOptions = useMemo(() => {
        const currentYear = dayjs().year();
        return Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => ({
            label: String(y),
            value: y,
        }));
    }, []);

    // Only weeks/quarters that have already started are selectable — a future
    // period would force startDate after the today-capped endDate, inverting the range.
    const weekOptions = useMemo(() => {
        const today = dayjs().endOf('day');
        return Array.from({ length: isoWeeksInYear(draftYear) }, (_, i) => i + 1)
            .filter((w) => !startOfIsoWeek(draftYear, w).isAfter(today))
            .map((w) => ({
                label: `${lang === 'vi' ? 'Tuần' : 'Week'} ${w}`,
                value: w,
            }));
    }, [draftYear, lang]);

    const quarterOptions = useMemo(() => {
        const today = dayjs().endOf('day');
        return [1, 2, 3, 4]
            .filter((q) => !dayjs().year(draftYear).quarter(q).startOf('quarter').isAfter(today))
            .map((q) => ({
                label: `${lang === 'vi' ? 'Quý' : 'Quarter'} ${q}`,
                value: q,
            }));
    }, [draftYear, lang]);

    const shiftFilters = useMemo(
        () => industryFilters.filter((f) => f.category === 'SHIFT'),
        [industryFilters]
    );
    const periodFilters = useMemo(
        () => industryFilters.filter((f) => f.category === 'PERIOD'),
        [industryFilters]
    );

    // Shift chips include a synthetic "All" option; the active shift also gets a small
    // dot indicator (not a nested pill) so the currently-running shift stays visible
    // without the chip looking like a tag stuffed inside another tag.
    const shiftChipOptions = useMemo<
        Array<{ value: number | typeof SHIFT_ALL; label: React.ReactNode }>
    >(
        () => [
            { value: SHIFT_ALL, label: lang === 'vi' ? 'Tất cả' : 'All' },
            ...shiftFilters.map((filter) => ({
                value: filter.filterId,
                label: (
                    <Space size={5} align="center">
                        <span>{lang === 'vi' ? filter.displayNameVi : filter.displayNameEn}</span>
                        {checkShiftActive(filter) && (
                            <Tooltip title={lang === 'vi' ? 'Đang hoạt động' : 'Active'}>
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: token.colorSuccess,
                                        display: 'inline-block',
                                        flexShrink: 0,
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Space>
                ),
            })),
        ],
        [shiftFilters, lang, token.colorSuccess]
    );

    const periodChipOptions = useMemo(
        () =>
            periodFilters.map((filter) => ({
                value: filter.filterId,
                label: lang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            })),
        [periodFilters, lang]
    );

    // byDateRange has no allow-list (all 8 grains, default DAY); byFilter is
    // restricted to the selected period's allowedGrains/defaultGrain.
    const activeAllowedGrains = useMemo<TimeGrain[]>(() => {
        if (!grainEnabled) return [];
        if (draftMode === 'CUSTOM_RANGE') return ALL_TIME_GRAINS;
        const period = periodFilters.find((f) => f.filterId === draftPeriodId);
        return period?.allowedGrains ?? ALL_TIME_GRAINS;
    }, [grainEnabled, draftMode, draftPeriodId, periodFilters]);

    const activeDefaultGrain = useMemo<TimeGrain | null>(() => {
        if (draftMode === 'CUSTOM_RANGE') return CUSTOM_RANGE_DEFAULT_GRAIN;
        const period = periodFilters.find((f) => f.filterId === draftPeriodId);
        return period?.defaultGrain ?? activeAllowedGrains[0] ?? null;
    }, [draftMode, draftPeriodId, periodFilters, activeAllowedGrains]);

    // Silently fall back to the new default when switching period/mode leaves the
    // current grain outside the newly allowed set — no error shown to the user.
    useEffect(() => {
        if (!grainEnabled) return;
        if (draftGrain !== null && activeAllowedGrains.includes(draftGrain)) return;
        setDraftGrain(activeDefaultGrain);
    }, [grainEnabled, activeAllowedGrains, activeDefaultGrain, draftGrain]);

    const syncDraft = useCallback(() => {
        setDraftMode(value.mode);
        setDraftPeriodId(value.periodId);
        setDraftShiftId(value.shiftId);
        setDraftDateRange([dayjs(value.startDate), dayjs(value.endDate)]);
        setDraftYear(dayjs().year());
        setSelectedWeek(null);
        setSelectedQuarter(null);
        setDraftGrain(value.grain ?? null);
        setDraftLabelStyle(value.labelStyle ?? null);
        setActiveTabKey(value.mode === 'CUSTOM_RANGE' ? 'custom' : 'quick');
    }, [value]);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (nextOpen) syncDraft();
            setOpen(nextOpen);
        },
        [syncDraft]
    );

    const handleReset = useCallback(() => {
        const activeShift = shiftFilters.find(checkShiftActive);
        setDraftMode('PRESET');
        setDraftPeriodId(null);
        setDraftShiftId(activeShift?.filterId ?? shiftFilters[0]?.filterId ?? null);
        setDraftDateRange([dayjs(), dayjs()]);
        setDraftYear(dayjs().year());
        setSelectedWeek(null);
        setSelectedQuarter(null);
        setDraftGrain(null);
        setDraftLabelStyle(null);
        setActiveTabKey('quick');
    }, [shiftFilters]);

    const handleYearChange = useCallback((year: number) => {
        setDraftYear(year);
        // Week/quarter numbers are only meaningful for the year they were picked in.
        setSelectedWeek(null);
        setSelectedQuarter(null);
    }, []);

    const handleSelectWeek = useCallback(
        (week: number | undefined) => {
            setSelectedWeek(week ?? null);
            if (week == null) return;

            const start = startOfIsoWeek(draftYear, week);
            setDraftDateRange([start, capToToday(start.endOf('isoWeek'))]);
            setDraftMode('CUSTOM_RANGE');
            setDraftPeriodId(null);
            setSelectedQuarter(null);
        },
        [draftYear]
    );

    const handleSelectQuarter = useCallback(
        (quarter: number | undefined) => {
            setSelectedQuarter(quarter ?? null);
            if (quarter == null) return;

            const start = dayjs().year(draftYear).quarter(quarter).startOf('quarter');
            setDraftDateRange([start, capToToday(start.endOf('quarter'))]);
            setDraftMode('CUSTOM_RANGE');
            setDraftPeriodId(null);
            setSelectedWeek(null);
        },
        [draftYear]
    );

    // Small confirmation chip so the user can see exactly what week/quarter
    // resolved to before hitting Apply — Select's own value only shows the number.
    const quickRangeLabel = useMemo(() => {
        const rangeText = `${draftDateRange[0].format('DD/MM')} → ${draftDateRange[1].format('DD/MM/YYYY')}`;
        if (selectedWeek != null) {
            return `${lang === 'vi' ? 'Tuần' : 'Week'} ${selectedWeek}/${draftYear}: ${rangeText}`;
        }
        if (selectedQuarter != null) {
            return `${lang === 'vi' ? 'Quý' : 'Quarter'} ${selectedQuarter}/${draftYear}: ${rangeText}`;
        }
        return null;
    }, [selectedWeek, selectedQuarter, draftYear, draftDateRange, lang]);

    // Live "what will Apply do" summary — shift/period/grain are edited from different
    // tabs, so this is the one place that always reflects the combined draft state.
    const draftShiftLabel = useMemo(() => {
        if (draftShiftId == null) return null;
        const shift = shiftFilters.find((f) => f.filterId === draftShiftId);
        return shift ? (lang === 'vi' ? shift.displayNameVi : shift.displayNameEn) : null;
    }, [draftShiftId, shiftFilters, lang]);

    const draftRangeLabel = useMemo(() => {
        if (draftMode === 'CUSTOM_RANGE') {
            return (
                quickRangeLabel ??
                `${draftDateRange[0].format('DD/MM/YYYY')} → ${draftDateRange[1].format('DD/MM/YYYY')}`
            );
        }
        const period = periodFilters.find((f) => f.filterId === draftPeriodId);
        return period ? (lang === 'vi' ? period.displayNameVi : period.displayNameEn) : null;
    }, [draftMode, draftPeriodId, periodFilters, quickRangeLabel, draftDateRange, lang]);

    const draftGrainLabel = useMemo(() => {
        if (!grainEnabled || !draftGrain) return null;
        const option = grainOptions?.find((o) => o.name === draftGrain);
        return option ? (lang === 'vi' ? option.nameVi : option.nameEn) : draftGrain;
    }, [grainEnabled, draftGrain, grainOptions, lang]);

    const draftSummaryText = useMemo(() => {
        const parts = [draftShiftLabel, draftRangeLabel, draftGrainLabel].filter(Boolean);
        return parts.length > 0
            ? parts.join(' • ')
            : lang === 'vi'
              ? 'Chưa chọn khoảng thời gian'
              : 'No time range selected yet';
    }, [draftShiftLabel, draftRangeLabel, draftGrainLabel, lang]);

    const handleApply = useCallback(() => {
        onApply({
            mode: draftMode,
            periodId: draftMode === 'PRESET' ? draftPeriodId : null,
            shiftId: draftShiftId,
            startDate: draftDateRange[0].format('YYYY-MM-DD'),
            endDate: draftDateRange[1].format('YYYY-MM-DD'),
            grain: grainEnabled ? draftGrain : undefined,
            labelStyle: grainEnabled ? draftLabelStyle : undefined,
        });
        setOpen(false);
    }, [
        draftMode,
        draftPeriodId,
        draftShiftId,
        draftDateRange,
        grainEnabled,
        draftGrain,
        draftLabelStyle,
        onApply,
    ]);

    const activeLabel = useMemo(() => {
        if (value.mode === 'CUSTOM_RANGE') {
            const dateLabel = `${dayjs(value.startDate).format('DD/MM')} → ${dayjs(value.endDate).format('DD/MM')}`;
            if (value.shiftId != null) {
                const shift = industryFilters.find((f) => f.filterId === value.shiftId);
                const shiftLabel = shift
                    ? lang === 'vi'
                        ? shift.displayNameVi
                        : shift.displayNameEn
                    : null;
                if (shiftLabel) return `${dateLabel} • ${shiftLabel}`;
            }
            return dateLabel;
        }

        const period = industryFilters.find((f) => f.filterId === value.periodId);
        const periodLabel = period
            ? lang === 'vi'
                ? period.displayNameVi
                : period.displayNameEn
            : null;

        if (!periodLabel && value.shiftId != null) {
            const shift = industryFilters.find((f) => f.filterId === value.shiftId);
            return shift ? (lang === 'vi' ? shift.displayNameVi : shift.displayNameEn) : null;
        }

        if (periodLabel && value.shiftId != null) {
            const shift = industryFilters.find((f) => f.filterId === value.shiftId);
            const shiftLabel = shift
                ? lang === 'vi'
                    ? shift.displayNameVi
                    : shift.displayNameEn
                : null;
            return shiftLabel ? `${periodLabel} • ${shiftLabel}` : periodLabel;
        }

        return periodLabel;
    }, [value, industryFilters, lang]);

    const isApplyDisabled =
        draftMode === 'PRESET' && draftPeriodId === null && draftShiftId === null;

    const sectionLabelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 8,
        textTransform: 'uppercase',
    };

    // Shift + the Quick/Custom choice always resolve to a real value (Apply is gated on
    // them below) — Grain never blocks Apply and silently auto-fills, so it's the one
    // truly optional section. Marking both ends makes that contrast legible at a glance.
    const requiredMark = <span style={{ color: token.colorError, marginLeft: 4 }}>*</span>;
    const optionalMark = (
        <span
            style={{
                marginLeft: 6,
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
                color: token.colorTextTertiary,
                fontSize: 11,
            }}
        >
            {lang === 'vi'
                ? '(tuỳ chọn — tự động nếu bỏ qua)'
                : '(optional — auto-filled if skipped)'}
        </span>
    );

    const quickTabContent =
        periodFilters.length > 0 ? (
            <Tag.CheckableTagGroup
                className="qw-time-filter-chips qw-preset-grid"
                style={{ gap: 6 }}
                options={periodChipOptions}
                value={draftMode === 'PRESET' ? draftPeriodId : null}
                onChange={(nextValue) => {
                    setDraftPeriodId(nextValue == null ? null : Number(nextValue));
                    setDraftMode('PRESET');
                    setSelectedWeek(null);
                    setSelectedQuarter(null);
                }}
            />
        ) : (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {lang === 'vi' ? 'Chưa có preset nào được cấu hình.' : 'No presets configured yet.'}
            </Typography.Text>
        );

    const customTabContent = (
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <Typography.Text type="secondary" style={{ flexShrink: 0 }}>
                    {lang === 'vi' ? 'Năm' : 'Year'}
                </Typography.Text>
                <Select
                    size="small"
                    style={{ flex: 1 }}
                    value={draftYear}
                    options={yearOptions}
                    onChange={handleYearChange}
                />
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <Select
                    size="small"
                    style={{ flex: 1, minWidth: 0 }}
                    placeholder={lang === 'vi' ? 'Chọn tuần' : 'Select week'}
                    options={weekOptions}
                    value={selectedWeek}
                    onChange={handleSelectWeek}
                    disabled={selectedQuarter !== null}
                    allowClear
                />
                <Select
                    size="small"
                    style={{ flex: 1, minWidth: 0 }}
                    placeholder={lang === 'vi' ? 'Chọn quý' : 'Select quarter'}
                    options={quarterOptions}
                    value={selectedQuarter}
                    onChange={handleSelectQuarter}
                    disabled={selectedWeek !== null}
                    allowClear
                />
            </div>
            {quickRangeLabel && (
                <Tag color="blue" style={{ margin: 0 }}>
                    {quickRangeLabel}
                </Tag>
            )}
            <DatePicker.RangePicker
                value={draftDateRange}
                onChange={(dates) => {
                    if (dates?.[0] && dates?.[1]) {
                        setDraftDateRange([dates[0], dates[1]]);
                        setDraftMode('CUSTOM_RANGE');
                        setDraftPeriodId(null);
                    }
                }}
                format="DD/MM/YYYY"
                style={{ width: '100%', borderRadius: 8 }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
                // No longer gated on draftMode === 'CUSTOM_RANGE': picking a date here is
                // itself what switches the mode, now that there's no separate mode radio.
                disabled={selectedWeek !== null || selectedQuarter !== null}
            />
        </Space>
    );

    const content = (
        <div
            style={{
                width: isMobile ? 'calc(100vw - 48px)' : 360,
                maxWidth: 360,
                maxHeight: 'min(560px, calc(100vh - 96px))',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Unchecked CheckableTags render with a transparent border/background by
                antd default, so they read as plain links rather than tappable chips.
                Scoped to this popover so it doesn't affect CheckableTag usage elsewhere. */}
            <style jsx global>{`
                .qw-time-filter-chips .ant-tag-checkable:not(.ant-tag-checkable-checked) {
                    background-color: ${token.colorBgContainer};
                    border-color: ${token.colorBorder};
                }
                .qw-time-filter-chips .ant-tag-checkable:not(.ant-tag-checkable-checked):hover {
                    border-color: ${token.colorPrimary};
                }
                /* Presets vary in label length (Hôm nay vs. Tháng trước) — a plain flex-wrap
                   sizes each chip to its own text, so columns drift out of alignment as the
                   popover width changes. A fixed 2-column grid keeps them aligned always. */
                .qw-preset-grid.ant-tag-checkable-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }
                .qw-preset-grid .ant-tag-checkable {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: ${token.controlHeightSM}px;
                    box-sizing: border-box;
                }
            `}</style>
            <div
                style={{
                    overflowY: 'auto',
                    flex: '1 1 auto',
                    minHeight: 0,
                    paddingRight: 2,
                    paddingTop: 4,
                }}
            >
                {/* Shift is independent of PRESET vs CUSTOM_RANGE, so it sits above the
                    tabs — otherwise switching tabs would appear to drop the selection. */}
                {shiftFilters.length > 0 && (
                    <>
                        <Typography.Text type="secondary" style={sectionLabelStyle}>
                            {lang === 'vi' ? 'Ca làm việc' : 'Shifts'}
                            {requiredMark}
                        </Typography.Text>
                        <div
                            className="qw-time-filter-chips"
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                        >
                            <Tag.CheckableTagGroup
                                options={shiftChipOptions}
                                value={draftShiftId ?? SHIFT_ALL}
                                onChange={(nextValue) =>
                                    setDraftShiftId(
                                        nextValue == null || nextValue === SHIFT_ALL
                                            ? null
                                            : Number(nextValue)
                                    )
                                }
                            />
                        </div>
                    </>
                )}

                <Typography.Text
                    type="secondary"
                    style={{
                        ...sectionLabelStyle,
                        marginTop: shiftFilters.length > 0 ? 16 : 0,
                        marginBottom: 4,
                    }}
                >
                    {lang === 'vi' ? 'Khoảng thời gian' : 'Time range'}
                    {requiredMark}
                </Typography.Text>
                <Tabs
                    size="small"
                    activeKey={activeTabKey}
                    onChange={(key) => setActiveTabKey(key as 'quick' | 'custom')}
                    items={[
                        {
                            key: 'quick',
                            label: lang === 'vi' ? 'Nhanh' : 'Quick',
                            children: quickTabContent,
                        },
                        {
                            key: 'custom',
                            label: lang === 'vi' ? 'Tuỳ chỉnh' : 'Custom',
                            children: customTabContent,
                        },
                    ]}
                />

                {grainEnabled && (
                    <>
                        {/* The whole Grain section is now behind one collapsed-by-default
                            panel — not just the label-style sub-option — since it's the one
                            control that never blocks Apply and always has a working default. */}
                        <Collapse
                            ghost
                            size="small"
                            style={{ marginTop: 8 }}
                            items={[
                                {
                                    key: 'grain',
                                    label: (
                                        <Typography.Text
                                            type="secondary"
                                            style={{
                                                ...sectionLabelStyle,
                                                display: 'inline',
                                                marginBottom: 0,
                                            }}
                                        >
                                            {lang === 'vi' ? 'Nhóm theo' : 'Group by'}
                                            {optionalMark}
                                        </Typography.Text>
                                    ),
                                    children: (
                                        <Space
                                            orientation="vertical"
                                            size={10}
                                            style={{ width: '100%' }}
                                        >
                                            <Select
                                                size="small"
                                                style={{ width: '100%' }}
                                                value={draftGrain}
                                                onChange={(nextGrain: TimeGrain) =>
                                                    setDraftGrain(nextGrain)
                                                }
                                                options={activeAllowedGrains.map((grainName) => {
                                                    const option = grainOptions?.find(
                                                        (o) => o.name === grainName
                                                    );
                                                    const label = option
                                                        ? lang === 'vi'
                                                            ? option.nameVi
                                                            : option.nameEn
                                                        : grainName;
                                                    return { value: grainName, label };
                                                })}
                                            />
                                            <div>
                                                <Typography.Text
                                                    type="secondary"
                                                    style={{
                                                        fontSize: 11,
                                                        display: 'block',
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    {draftGrainLabel
                                                        ? lang === 'vi'
                                                            ? `Kiểu nhãn cho "${draftGrainLabel}"`
                                                            : `Label style for "${draftGrainLabel}"`
                                                        : lang === 'vi'
                                                          ? 'Kiểu nhãn'
                                                          : 'Label style'}
                                                </Typography.Text>
                                                <Select
                                                    size="small"
                                                    style={{ width: '100%' }}
                                                    allowClear
                                                    placeholder="Auto"
                                                    value={draftLabelStyle}
                                                    onChange={(nextStyle: LabelStyle | undefined) =>
                                                        setDraftLabelStyle(nextStyle ?? null)
                                                    }
                                                    options={ALL_LABEL_STYLES.map((style) => ({
                                                        value: style,
                                                        label: getLabelStyleLabel(style, lang),
                                                    }))}
                                                />
                                            </div>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Always-visible resolved summary — the one place that reflects the combined
                draft state regardless of which tab is active. */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    background: token.colorPrimaryBg,
                    border: `1px solid ${token.colorPrimaryBorder}`,
                    borderRadius: token.borderRadius,
                    padding: '8px 10px',
                    margin: '12px 0',
                    flexShrink: 0,
                }}
            >
                <Typography.Text
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        color: token.colorPrimary,
                        opacity: 0.75,
                        flexShrink: 0,
                    }}
                >
                    {lang === 'vi' ? 'Đang chọn' : 'Selected'}
                </Typography.Text>
                <Typography.Text
                    ellipsis
                    style={{ fontSize: 12.5, fontWeight: 600, color: token.colorPrimary }}
                >
                    {draftSummaryText}
                </Typography.Text>
            </div>

            <Divider style={{ margin: '0 0 12px', flexShrink: 0 }} />

            <div
                style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}
            >
                <Button onClick={handleReset}>{t('common.reset')}</Button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        onClick={() => {
                            syncDraft();
                            setOpen(false);
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button type="primary" onClick={handleApply} disabled={isApplyDisabled}>
                        {lang === 'vi' ? 'Áp dụng' : 'Apply'}
                    </Button>
                </div>
            </div>
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
            <Tooltip title={activeLabel}>
                <Button
                    style={{
                        borderRadius: 8,
                        width: isMobile ? '100%' : 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 4,
                    }}
                >
                    <span style={{ flexShrink: 0 }}>{lang === 'vi' ? 'Thời gian' : 'Time'}:</span>
                    <Typography.Text
                        ellipsis
                        style={{
                            maxWidth: isMobile ? 'calc(100% - 76px)' : 135,
                            color: 'inherit',
                            lineHeight: 'inherit',
                        }}
                    >
                        {activeLabel ?? t('common.filter')}
                    </Typography.Text>
                </Button>
            </Tooltip>
        </Popover>
    );
};

export default TimeFilterPopover;
