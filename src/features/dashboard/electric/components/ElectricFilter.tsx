'use client';

import React from 'react';
import { Select, DatePicker, Flex, Grid, Button } from 'antd';
import { CalendarOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

import { TimePeriod, Zone } from '@/types';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

interface ElectricFiltersProps {
    timePeriod: TimePeriod;
    dateRange: [string, string] | null;
    zoneId: string | null;
    zones: Zone[];
    loading?: boolean;
    onTimePeriodChange: (value: TimePeriod) => void;
    onDateRangeChange: (dates: [string, string] | null) => void;
    onZoneChange: (value: string | null) => void;
    onSearch: () => void;
    onClearFilter: () => void;
}

const ElectricFilters: React.FC<ElectricFiltersProps> = ({
    timePeriod,
    dateRange,
    zoneId,
    zones,
    loading = false,
    onTimePeriodChange,
    onDateRangeChange,
    onZoneChange,
    onSearch,
    onClearFilter,
}) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const isMobile = !screens.sm;

    const timePeriodOptions = [
        { label: t('common.filters.today'), value: 'TODAY' },
        { label: t('common.filters.week'), value: 'WEEK' },
        { label: t('common.filters.month'), value: 'MONTH' },
        { label: t('common.filters.year'), value: 'YEAR' },
    ];

    const zoneOptions = [
        { label: t('common.filters.allZone'), value: null },
        ...zones.map((zone) => ({
            label: zone.zoneName,
            value: zone.zoneId,
        })),
    ];

    const handleDateRangeChange = (dates: null | (Dayjs | null)[], dateStrings: string[]) => {
        if (dates && dates[0] && dates[1]) {
            onDateRangeChange([dateStrings[0], dateStrings[1]]);
        } else {
            onDateRangeChange(null);
        }
    };

    const disabledDate = (current: Dayjs) => {
        // Disable nếu ngày lớn hơn hôm nay
        return current && current > dayjs().endOf('day');
    };

    const dateRangeValue: [Dayjs, Dayjs] | null = dateRange
        ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
        : null;

    const isUsingCustomDateRange = dateRange !== null;

    const hasActiveFilters = timePeriod !== 'TODAY' || dateRange !== null || zoneId !== null;

    if (isMobile) {
        return (
            <Flex vertical gap={8} style={{ width: '100%' }}>
                <Select
                    value={timePeriod}
                    onChange={onTimePeriodChange}
                    disabled={loading || isUsingCustomDateRange}
                    options={timePeriodOptions}
                    style={{ width: '100%' }}
                    placeholder={isUsingCustomDateRange ? 'Custom' : undefined}
                />
                <RangePicker
                    value={dateRangeValue}
                    onChange={handleDateRangeChange}
                    disabled={loading}
                    allowEmpty
                    format="YYYY-MM-DD"
                    suffixIcon={<CalendarOutlined />}
                    style={{ width: '100%' }}
                    disabledDate={disabledDate}
                />
                <Select
                    value={zoneId || '0'}
                    onChange={onZoneChange}
                    disabled={loading}
                    options={zoneOptions}
                    style={{ width: '100%' }}
                />
                <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={onSearch}
                    loading={loading}
                    disabled={loading}
                >
                    {t('common.search')}
                </Button>
                <Button
                    icon={<ClearOutlined />}
                    onClick={onClearFilter}
                    disabled={loading || !hasActiveFilters}
                >
                    {t('common.clear')}
                </Button>
            </Flex>
        );
    }

    return (
        <Flex align="center" gap={12}>
            <Select
                value={timePeriod}
                onChange={onTimePeriodChange}
                disabled={loading || isUsingCustomDateRange}
                options={timePeriodOptions}
                style={{ width: 120 }}
                placeholder={isUsingCustomDateRange ? 'Using custom date range' : undefined}
            />
            <RangePicker
                value={dateRangeValue}
                onChange={handleDateRangeChange}
                disabled={loading}
                format="YYYY-MM-DD"
                suffixIcon={<CalendarOutlined />}
                style={{ minWidth: 280 }}
                disabledDate={disabledDate}
            />
            <Select
                value={zoneId}
                onChange={onZoneChange}
                disabled={loading}
                options={zoneOptions}
                style={{ width: 140 }}
            />
            <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={onSearch}
                loading={loading}
                disabled={loading}
            >
                {t('common.search')}
            </Button>
            <Button
                icon={<ClearOutlined />}
                onClick={onClearFilter}
                disabled={loading || !hasActiveFilters}
            >
                {t('common.clear')}
            </Button>
        </Flex>
    );
};

export default ElectricFilters;
