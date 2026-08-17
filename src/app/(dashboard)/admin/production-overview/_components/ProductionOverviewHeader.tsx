'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    Button,
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
    theme,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import { SpacePickingWithChildren } from '@/types/Space';
import { IndustryFilter } from '@/types/IndustryFilter';

const { useBreakpoint } = Grid;
const { Text } = Typography;

export type TimeFilterMode = 'PRESET' | 'CUSTOM_RANGE';

interface ProductionOverviewHeaderProps {
    spaces: SpacePickingWithChildren[];
    selectedFactoryId: number | null;
    onFactoryChange: (factoryId: number) => void;
    industryFilters: IndustryFilter[];
    selectedTimePeriod: number | null;
    selectedShiftFilterId?: number | null;
    timeFilterMode?: TimeFilterMode;
    startDate?: string;
    endDate?: string;
    onApplyTimeFilter: (params: {
        mode: TimeFilterMode;
        periodId: number | null;
        shiftId: number | null;
        dateRange: [Dayjs, Dayjs] | null;
    }) => void;
    onRefresh: () => void;
    onExportExcel: () => void;
    isLoading: boolean;
    isExporting?: boolean;
}

export const ProductionOverviewHeader: React.FC<ProductionOverviewHeaderProps> = ({
    spaces,
    selectedFactoryId,
    onFactoryChange,
    industryFilters,
    selectedTimePeriod,
    selectedShiftFilterId = null,
    timeFilterMode = 'PRESET',
    startDate,
    endDate,
    onApplyTimeFilter,
    onRefresh,
    onExportExcel,
    isLoading,
    isExporting = false,
}) => {
    const { t, i18n } = useTranslation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { token } = theme.useToken();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Draft states inside Popover
    const [draftTimeFilterMode, setDraftTimeFilterMode] = useState<TimeFilterMode>(timeFilterMode);
    const [draftPeriodId, setDraftPeriodId] = useState<number | null>(selectedTimePeriod);
    const [draftShiftId, setDraftShiftId] = useState<number | null>(selectedShiftFilterId);
    const [draftDateRange, setDraftDateRange] = useState<[Dayjs, Dayjs]>([
        startDate ? dayjs(startDate) : dayjs(),
        endDate ? dayjs(endDate) : dayjs(),
    ]);

    // Check if shift is currently active
    const isShiftActive = useCallback((filter: IndustryFilter): boolean => {
        if (filter.category !== 'SHIFT') return false;
        const now = dayjs();
        const currentTime = now.format('HH:mm:ss');
        if (!filter.crossesMidnight) {
            return currentTime >= filter.startTime && currentTime < filter.endTime;
        } else {
            return currentTime >= filter.startTime || currentTime < filter.endTime;
        }
    }, []);

    // Group options
    const timePeriodOptions = useMemo(() => {
        const currentLang = i18n.language;
        return industryFilters.map((filter: IndustryFilter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
            category: filter.category,
        }));
    }, [industryFilters, i18n.language]);

    const groupedTimePeriodOptions = useMemo(
        () => ({
            SHIFT: timePeriodOptions.filter((option) => option.category === 'SHIFT'),
            PERIOD: timePeriodOptions.filter((option) => option.category === 'PERIOD'),
        }),
        [timePeriodOptions]
    );

    // Sync draft states when opening popover
    const syncDraftTimeFilter = useCallback(() => {
        setDraftTimeFilterMode(timeFilterMode);
        setDraftDateRange([
            startDate ? dayjs(startDate) : dayjs(),
            endDate ? dayjs(endDate) : dayjs(),
        ]);

        if (timeFilterMode === 'PRESET') {
            const primaryFilter = industryFilters.find((f) => f.filterId === selectedTimePeriod);
            if (primaryFilter?.category === 'PERIOD') {
                setDraftPeriodId(selectedTimePeriod);
                setDraftShiftId(selectedShiftFilterId ?? null);
            } else {
                setDraftPeriodId(null);
                setDraftShiftId(selectedTimePeriod);
            }
        } else {
            setDraftPeriodId(null);
            setDraftShiftId(selectedTimePeriod);
        }
    }, [
        endDate,
        startDate,
        selectedTimePeriod,
        selectedShiftFilterId,
        timeFilterMode,
        industryFilters,
    ]);

    // Active label on trigger button
    const activeLabel = useMemo(() => {
        const currentLang = i18n.language;

        if (timeFilterMode === 'CUSTOM_RANGE') {
            const dateLabel = `${dayjs(startDate ?? draftDateRange[0]).format('DD/MM')} → ${dayjs(endDate ?? draftDateRange[1]).format('DD/MM')}`;
            if (selectedShiftFilterId != null) {
                const shiftFilter = industryFilters.find((f) => f.filterId === selectedShiftFilterId);
                const shiftLabel = shiftFilter
                    ? currentLang === 'vi'
                        ? shiftFilter.displayNameVi
                        : shiftFilter.displayNameEn
                    : null;
                if (shiftLabel) return `${dateLabel} • ${shiftLabel}`;
            }
            return dateLabel;
        }

        const primaryFilter = industryFilters.find((f) => f.filterId === selectedTimePeriod);
        const primaryLabel = primaryFilter
            ? currentLang === 'vi'
                ? primaryFilter.displayNameVi
                : primaryFilter.displayNameEn
            : null;

        if (!primaryLabel) {
            // Fallback default
            return i18n.language === 'vi' ? 'Tuần này' : 'This week';
        }

        if (primaryFilter?.category === 'PERIOD' && selectedShiftFilterId != null) {
            const shiftFilter = industryFilters.find((f) => f.filterId === selectedShiftFilterId);
            const shiftLabel = shiftFilter
                ? currentLang === 'vi'
                    ? shiftFilter.displayNameVi
                    : shiftFilter.displayNameEn
                : null;
            return shiftLabel ? `${primaryLabel} • ${shiftLabel}` : primaryLabel;
        }

        return primaryLabel;
    }, [
        industryFilters,
        selectedTimePeriod,
        selectedShiftFilterId,
        timeFilterMode,
        startDate,
        endDate,
        draftDateRange,
        i18n.language,
    ]);

    const handleApply = () => {
        let primaryFilterId: number | null = null;
        let secondaryShiftId: number | null = null;

        if (draftTimeFilterMode === 'PRESET') {
            if (draftPeriodId !== null) {
                primaryFilterId = draftPeriodId;
                secondaryShiftId = draftShiftId;
            } else if (draftShiftId !== null) {
                primaryFilterId = draftShiftId;
                secondaryShiftId = null;
            }
        } else {
            primaryFilterId = draftShiftId;
            secondaryShiftId = null;
        }

        onApplyTimeFilter({
            mode: draftTimeFilterMode,
            periodId: primaryFilterId,
            shiftId: secondaryShiftId,
            dateRange: draftTimeFilterMode === 'CUSTOM_RANGE' ? draftDateRange : null,
        });
        setIsPopoverOpen(false);
    };

    const handleReset = () => {
        const activeShift = industryFilters.find(
            (filter) => filter.category === 'SHIFT' && isShiftActive(filter)
        );
        const defaultPeriod = industryFilters.find(
            (filter) => filter.category === 'PERIOD' && filter.periodCode === 'THIS_WEEK'
        );

        setDraftTimeFilterMode('PRESET');
        setDraftPeriodId(defaultPeriod ? defaultPeriod.filterId : null);
        setDraftShiftId(activeShift?.filterId ?? null);
        setDraftDateRange([dayjs(), dayjs()]);
    };

    const isPreset = draftTimeFilterMode === 'PRESET';

    const popoverContent = (
        <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 340, maxWidth: 360, padding: 4 }}>
            <Typography.Text strong style={{ fontSize: 14 }}>
                {i18n.language === 'vi' ? 'Thời gian' : 'Time Filter'}
            </Typography.Text>

            <Divider style={{ margin: '12px 0' }} />

            {/* 1. CA LÀM VIỆC (Shifts) */}
            {groupedTimePeriodOptions.SHIFT.length > 0 && (
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
                        {i18n.language === 'vi' ? 'CA LÀM VIỆC' : 'SHIFTS'}
                    </Typography.Text>
                    <Radio.Group
                        value={draftShiftId}
                        onChange={(e) => setDraftShiftId(e.target.value as number | null)}
                        style={{ width: '100%' }}
                    >
                        <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                            <Radio value={null}>
                                {i18n.language === 'vi' ? 'Tất cả' : 'All'}
                            </Radio>
                            {groupedTimePeriodOptions.SHIFT.map((option) => {
                                const filter = industryFilters.find((f) => f.filterId === option.value);
                                const isActive = filter && isShiftActive(filter);

                                return (
                                    <Radio key={option.value} value={option.value}>
                                        <Space size={6}>
                                            <Typography.Text
                                                ellipsis
                                                style={{
                                                    maxWidth: isMobile ? 'calc(100vw - 150px)' : 200,
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
                                                        fontSize: 11,
                                                        lineHeight: '18px',
                                                        padding: '0 6px',
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    {i18n.language === 'vi' ? 'Đang hoạt động' : 'Active'}
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

            {/* 2. Chọn nhanh (Quick Select - Periods) */}
            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                {groupedTimePeriodOptions.PERIOD.length > 0 && (
                    <>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {i18n.language === 'vi' ? 'Chọn nhanh' : 'Quick Select'}
                        </Typography.Text>
                        <Radio.Group
                            value={isPreset ? draftPeriodId : null}
                            onChange={(e) => {
                                setDraftPeriodId(e.target.value as number | null);
                                setDraftTimeFilterMode('PRESET');
                            }}
                            style={{ width: '100%' }}
                        >
                            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                                {groupedTimePeriodOptions.PERIOD.map((option) => (
                                    <Radio key={option.value} value={option.value}>
                                        <Typography.Text
                                            ellipsis
                                            style={{
                                                maxWidth: isMobile ? 'calc(100vw - 120px)' : 260,
                                                verticalAlign: 'middle',
                                            }}
                                        >
                                            {option.label}
                                        </Typography.Text>
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </>
                )}

                <Divider style={{ margin: '4px 0' }} />

                {/* 3. Khoảng ngày (Custom Date Range) */}
                <Radio
                    checked={draftTimeFilterMode === 'CUSTOM_RANGE'}
                    onChange={() => {
                        setDraftTimeFilterMode('CUSTOM_RANGE');
                        setDraftPeriodId(null);
                    }}
                >
                    {i18n.language === 'vi' ? 'Khoảng ngày' : 'Custom Date Range'}
                </Radio>
            </Space>

            <div style={{ marginTop: 8 }}>
                <DatePicker.RangePicker
                    value={draftDateRange}
                    onChange={(dates) => {
                        if (dates?.[0] && dates?.[1]) {
                            setDraftDateRange([dates[0], dates[1]]);
                            setDraftTimeFilterMode('CUSTOM_RANGE');
                            setDraftPeriodId(null);
                        }
                    }}
                    format="DD/MM/YYYY"
                    style={{ width: '100%', borderRadius: 8 }}
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                    disabled={draftTimeFilterMode !== 'CUSTOM_RANGE'}
                />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <Button size="small" onClick={handleReset}>
                    {i18n.language === 'vi' ? 'Đặt lại' : 'Reset'}
                </Button>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        size="small"
                        onClick={() => {
                            syncDraftTimeFilter();
                            setIsPopoverOpen(false);
                        }}
                    >
                        {i18n.language === 'vi' ? 'Hủy' : 'Cancel'}
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        onClick={handleApply}
                        disabled={
                            draftTimeFilterMode === 'PRESET' &&
                            draftPeriodId === null &&
                            draftShiftId === null
                        }
                    >
                        {i18n.language === 'vi' ? 'Áp dụng' : 'Apply'}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                width: isMobile ? '100%' : 'auto',
            }}
        >
            {/* Factory Dropdown */}
            {spaces && spaces.length > 0 && (
                <Select
                    value={selectedFactoryId ?? spaces[0]?.spaceId}
                    onChange={onFactoryChange}
                    options={spaces.map((f) => ({
                        label: `${f.spaceCode} — ${f.spaceName}`,
                        value: f.spaceId,
                    }))}
                    style={{ width: isMobile ? '100%' : 220, borderRadius: token.borderRadius }}
                    placeholder={t('productionOverview.filters.selectFactory')}
                    showSearch={{
                        filterOption: (input, option) =>
                            ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase()),
                    }}
                />
            )}

            {/* Time Filter Popover */}
            <Popover
                open={isPopoverOpen}
                onOpenChange={(open) => {
                    if (open) {
                        syncDraftTimeFilter();
                    }
                    setIsPopoverOpen(open);
                }}
                trigger="click"
                placement={isMobile ? 'bottomLeft' : 'bottomRight'}
                content={popoverContent}
            >
                <Button
                    style={{
                        borderRadius: token.borderRadius,
                        width: isMobile ? '100%' : 'auto',
                        maxWidth: isMobile ? '100%' : 280,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span style={{ fontWeight: 600 }}>
                        {i18n.language === 'vi' ? 'Thời gian' : 'Time'}:
                    </span>
                    <Text ellipsis style={{ maxWidth: 180, color: 'inherit' }}>
                        {activeLabel}
                    </Text>
                </Button>
            </Popover>

            {/* Refresh Button */}
            <Tooltip title={t('productionOverview.actions.refreshData')}>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={isLoading}
                    type="primary"
                    style={{ borderRadius: token.borderRadius }}
                />
            </Tooltip>

            {/* Export Excel Button */}
            <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={onExportExcel}
                loading={isExporting}
                style={{
                    borderRadius: token.borderRadius,
                    backgroundColor: '#107c41',
                    borderColor: '#107c41',
                }}
            >
                {t('productionOverview.actions.exportReport')}
            </Button>
        </div>
    );
};
