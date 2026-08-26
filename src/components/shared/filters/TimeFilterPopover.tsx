'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Collapse,
    DatePicker,
    Divider,
    Grid,
    Popover,
    Radio,
    Select,
    Space,
    Tag,
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
    const p = (y: number) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
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
    const [draftLabelStyle, setDraftLabelStyle] = useState<LabelStyle | null>(value.labelStyle ?? null);

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
    }, [draftMode, draftPeriodId, draftShiftId, draftDateRange, grainEnabled, draftGrain, draftLabelStyle, onApply]);

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

    const content = (
        <div
            style={{
                width: isMobile ? 'calc(100vw - 48px)' : 360,
                maxWidth: 360,
                // Content can grow past the viewport (shift list + period list + custom
                // range + grain + advanced) — cap it and scroll internally instead of
                // letting the popover overflow the screen and break page layout.
                maxHeight: 'min(560px, calc(100vh - 96px))',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Typography.Text strong style={{ flexShrink: 0 }}>
                {lang === 'vi' ? 'Thời gian' : 'Time Filter'}
            </Typography.Text>

            <Divider style={{ margin: '12px 0', flexShrink: 0 }} />

            <div style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, paddingRight: 2 }}>

            {shiftFilters.length > 0 && (
                <>
                    <Typography.Text
                        type="secondary"
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 8,
                            textTransform: 'uppercase',
                        }}
                    >
                        {lang === 'vi' ? 'Ca làm việc' : 'Shifts'}
                    </Typography.Text>
                    <Radio.Group
                        value={draftShiftId}
                        onChange={(e) => setDraftShiftId(e.target.value as number | null)}
                        style={{ width: '100%' }}
                    >
                        <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                            <Radio value={null}>{lang === 'vi' ? 'Tất cả' : 'All'}</Radio>
                            {shiftFilters.map((filter) => {
                                const active = checkShiftActive(filter);
                                return (
                                    <Radio key={filter.filterId} value={filter.filterId}>
                                        <Space size={4}>
                                            <Typography.Text
                                                ellipsis
                                                style={{
                                                    maxWidth: isMobile
                                                        ? 'calc(100vw - 150px)'
                                                        : 220,
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                {lang === 'vi'
                                                    ? filter.displayNameVi
                                                    : filter.displayNameEn}
                                            </Typography.Text>
                                            {active && (
                                                <Tag
                                                    color="green"
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 11,
                                                        lineHeight: '18px',
                                                        padding: '0 6px',
                                                    }}
                                                >
                                                    {lang === 'vi' ? 'Đang hoạt động' : 'Active'}
                                                </Tag>
                                            )}
                                        </Space>
                                    </Radio>
                                );
                            })}
                        </Space>
                    </Radio.Group>
                    <Divider style={{ margin: '12px 0' }} />
                </>
            )}

            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {periodFilters.length > 0 && (
                    <>
                        <Typography.Text type="secondary">
                            {lang === 'vi' ? 'Chọn nhanh' : 'Quick Select'}
                        </Typography.Text>
                        <Radio.Group
                            value={draftMode === 'PRESET' ? draftPeriodId : null}
                            onChange={(e) => {
                                setDraftPeriodId(e.target.value as number | null);
                                setDraftMode('PRESET');
                                setSelectedWeek(null);
                                setSelectedQuarter(null);
                            }}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                {periodFilters.map((filter) => (
                                    <Radio key={filter.filterId} value={filter.filterId}>
                                        <Typography.Text
                                            ellipsis
                                            style={{
                                                maxWidth: isMobile
                                                    ? 'calc(100vw - 120px)'
                                                    : 280,
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            {lang === 'vi'
                                                ? filter.displayNameVi
                                                : filter.displayNameEn}
                                        </Typography.Text>
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </>
                )}

                <Divider style={{ margin: '4px 0' }} />

                <Radio
                    checked={draftMode === 'CUSTOM_RANGE'}
                    onChange={() => {
                        setDraftMode('CUSTOM_RANGE');
                        setDraftPeriodId(null);
                        setSelectedWeek(null);
                        setSelectedQuarter(null);
                    }}
                >
                    {lang === 'vi' ? 'Khoảng ngày' : 'Custom Date Range'}
                </Radio>
            </Space>

            <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
                <Space size={8}>
                    <Typography.Text type="secondary">
                        {lang === 'vi' ? 'Năm' : 'Year'}
                    </Typography.Text>
                    <Select
                        size="small"
                        style={{ width: 90 }}
                        value={draftYear}
                        options={yearOptions}
                        onChange={handleYearChange}
                    />
                </Space>
                <Space size={8} wrap style={{ width: '100%' }}>
                    <Select
                        size="small"
                        style={{ flex: 1, minWidth: 120 }}
                        placeholder={lang === 'vi' ? 'Chọn tuần' : 'Select week'}
                        options={weekOptions}
                        value={selectedWeek}
                        onChange={handleSelectWeek}
                        disabled={selectedQuarter !== null}
                        allowClear
                    />
                    <Select
                        size="small"
                        style={{ flex: 1, minWidth: 120 }}
                        placeholder={lang === 'vi' ? 'Chọn quý' : 'Select quarter'}
                        options={quarterOptions}
                        value={selectedQuarter}
                        onChange={handleSelectQuarter}
                        disabled={selectedWeek !== null}
                        allowClear
                    />
                </Space>
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
                    disabled={
                        draftMode !== 'CUSTOM_RANGE' || selectedWeek !== null || selectedQuarter !== null
                    }
                />
            </Space>

            {grainEnabled && (
                <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Typography.Text
                        type="secondary"
                        style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 8,
                            textTransform: 'uppercase',
                        }}
                    >
                        {lang === 'vi' ? 'Nhóm theo' : 'Group by'}
                    </Typography.Text>
                    <Select
                        size="small"
                        style={{ width: '100%' }}
                        value={draftGrain}
                        onChange={(nextGrain: TimeGrain) => setDraftGrain(nextGrain)}
                        options={activeAllowedGrains.map((grainName) => {
                            const option = grainOptions?.find((o) => o.name === grainName);
                            const label = option
                                ? lang === 'vi'
                                    ? option.nameVi
                                    : option.nameEn
                                : grainName;
                            return { value: grainName, label };
                        })}
                    />
                    <Collapse
                        ghost
                        size="small"
                        style={{ marginTop: 8 }}
                        items={[
                            {
                                key: 'advanced',
                                label:
                                    lang === 'vi' ? 'Nâng cao — kiểu nhãn' : 'Advanced — label style',
                                children: (
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
                                ),
                            },
                        ]}
                    />
                </>
            )}

            </div>

            <Divider style={{ margin: '12px 0', flexShrink: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
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
                    <span style={{ flexShrink: 0 }}>
                        {lang === 'vi' ? 'Thời gian' : 'Time'}:
                    </span>
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
