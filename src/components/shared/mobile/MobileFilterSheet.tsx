'use client';

import React, { useState } from 'react';
import { Drawer, Button, Space, DatePicker, Input } from 'antd';
import { CloseOutlined, RightOutlined, SearchOutlined, LeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
    FilterConfig,
    TimeRadioFilterConfig,
    HierarchicalSelectFilterConfig,
    DatePickerFilterConfig,
    DateRangeFilterConfig,
    SelectFilterConfig,
    CustomFilterConfig,
} from './types';

const { RangePicker } = DatePicker;

interface MobileFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    filters: FilterConfig[];
    onApply: () => void;
    onClearAll: () => void;
    applyButtonText?: string;
    clearButtonText?: string;
}

/**
 * Reusable Mobile Filter Sheet component with flexible filter configurations
 *
 * @example
 * // Machine page with hierarchical filters
 * const filters = [
 *   { type: 'time-radio', id: 'time', label: 'Time', options: [...], value: '...', onChange: ... },
 *   { type: 'hierarchical-select', id: 'location', label: 'Location', levels: [...] }
 * ]
 *
 * @example
 * // Factory page with date picker
 * const filters = [
 *   { type: 'select', id: 'factory', label: 'Factory', options: [...], value: ..., onChange: ... },
 *   { type: 'date-picker', id: 'date', label: 'Date', value: ..., onChange: ... }
 * ]
 */
const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
    isOpen,
    onClose,
    title,
    filters,
    onApply,
    onClearAll,
    applyButtonText = 'Apply',
    clearButtonText = 'Clear All',
}) => {
    const { t } = useTranslation();
    const renderTimeRadioFilter = (config: TimeRadioFilterConfig) => (
        <div key={config.id} style={{ marginBottom: '24px' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '12px',
                }}
            >
                {config.label}
            </label>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${config.gridColumns || 2}, 1fr)`,
                    gap: '8px',
                }}
            >
                {config.options.map((option) => (
                    <Button
                        key={option.value}
                        onClick={() => config.onChange(option.value)}
                        type={config.value === option.value ? 'primary' : 'default'}
                        style={{
                            height: '44px',
                            borderRadius: '8px',
                        }}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>
    );

    const renderHierarchicalSelectFilter = (config: HierarchicalSelectFilterConfig) => {
        const [searchTexts, setSearchTexts] = useState<Record<string, string>>({});
        const [currentViewIndex, setCurrentViewIndex] = useState(0);

        // Navigation mode: show one level at a time
        if (config.useNavigation) {
            const currentLevel = config.levels[currentViewIndex];
            if (!currentLevel) return null;

            // Filter options based on search text
            const searchText = searchTexts[currentLevel.id] || '';
            const filteredOptions = searchText
                ? currentLevel.options.filter((option) =>
                      option.label.toLowerCase().includes(searchText.toLowerCase())
                  )
                : currentLevel.options;

            const handleLevelSelect = (value: any) => {
                currentLevel.onChange(value);

                // Auto-advance to next level if not the last one
                if (currentViewIndex < config.levels.length - 1) {
                    setCurrentViewIndex(currentViewIndex + 1);
                }
            };

            const handleBack = () => {
                if (currentViewIndex > 0) {
                    setCurrentViewIndex(currentViewIndex - 1);
                }
            };

            // Get selected item label for display
            const selectedLabel = currentLevel.value
                ? currentLevel.options.find((opt) => opt.value === currentLevel.value)?.label
                : null;

            return (
                <div key={config.id}>
                    {/* Breadcrumb / Title with selected value */}
                    <div style={{ marginBottom: '16px' }}>
                        {currentViewIndex > 0 && (
                            <Button
                                type="text"
                                icon={<LeftOutlined />}
                                onClick={handleBack}
                                style={{ marginBottom: '12px', padding: '4px 8px' }}
                            >
                                {t('common.back')}
                            </Button>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                            }}
                        >
                            <label
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#374151',
                                }}
                            >
                                {currentLevel.label}
                            </label>
                            {selectedLabel && (
                                <span
                                    style={{
                                        fontSize: '14px',
                                        color: '#1890ff',
                                        fontWeight: 500,
                                    }}
                                >
                                    {selectedLabel}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Search Input */}
                    {currentLevel.enableSearch && (
                        <Input
                            placeholder={currentLevel.searchPlaceholder || 'Tìm kiếm...'}
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) =>
                                setSearchTexts((prev) => ({
                                    ...prev,
                                    [currentLevel.id]: e.target.value,
                                }))
                            }
                            allowClear
                            style={{
                                marginBottom: '12px',
                                borderRadius: '8px',
                            }}
                        />
                    )}

                    {/* Options List - Grid Layout (2 columns) */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px',
                            width: '100%',
                        }}
                    >
                        {filteredOptions.map((option) => (
                            <Button
                                key={option.value}
                                onClick={() => handleLevelSelect(option.value)}
                                type={currentLevel.value === option.value ? 'primary' : 'default'}
                                block
                                style={{
                                    height: 'auto',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                }}
                            >
                                <span>{option.label}</span>
                                {currentLevel.showIcon && currentLevel.value === option.value && (
                                    <RightOutlined style={{ fontSize: '16px' }} />
                                )}
                            </Button>
                        ))}
                    </div>
                </div>
            );
        }

        // Stacking mode: show all levels (default behavior)
        return (
            <div key={config.id}>
                {config.levels.map((level, index) => {
                    // Check if this level should be visible
                    if (index > 0) {
                        const prevLevel = config.levels[index - 1];
                        if (!prevLevel.value) return null; // Hide if previous level not selected
                    }

                    if (level.options.length === 0 && index > 0) return null;

                    // Filter options based on search text
                    const searchText = searchTexts[level.id] || '';
                    const filteredOptions = searchText
                        ? level.options.filter((option) =>
                              option.label.toLowerCase().includes(searchText.toLowerCase())
                          )
                        : level.options;

                    // Get selected item label for display
                    const selectedLabel = level.value
                        ? level.options.find((opt) => opt.value === level.value)?.label
                        : null;

                    return (
                        <div key={level.id} style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px',
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#374151',
                                    }}
                                >
                                    {level.label}
                                </label>
                                {selectedLabel && (
                                    <span
                                        style={{
                                            fontSize: '14px',
                                            color: '#1890ff',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {selectedLabel}
                                    </span>
                                )}
                            </div>

                            {/* Search Input */}
                            {level.enableSearch && (
                                <Input
                                    placeholder={level.searchPlaceholder || 'Tìm kiếm...'}
                                    prefix={<SearchOutlined />}
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchTexts((prev) => ({
                                            ...prev,
                                            [level.id]: e.target.value,
                                        }))
                                    }
                                    allowClear
                                    style={{
                                        marginBottom: '12px',
                                        borderRadius: '8px',
                                    }}
                                />
                            )}

                            {/* Options List - Grid Layout (2 columns) */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '12px',
                                    width: '100%',
                                }}
                            >
                                {filteredOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        onClick={() => level.onChange(option.value)}
                                        type={level.value === option.value ? 'primary' : 'default'}
                                        block
                                        style={{
                                            height: 'auto',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span>{option.label}</span>
                                        {level.showIcon && level.value === option.value && (
                                            <RightOutlined style={{ fontSize: '16px' }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDatePickerFilter = (config: DatePickerFilterConfig) => (
        <div key={config.id} style={{ marginBottom: '24px' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '12px',
                }}
            >
                {config.label}
            </label>
            <DatePicker
                value={config.value ? dayjs(config.value, 'YYYY-MM-DD') : null}
                onChange={(date) => config.onChange(date ? date.format('YYYY-MM-DD') : null)}
                format={config.format || 'YYYY-MM-DD'}
                placeholder={config.placeholder || 'Select date'}
                disabledDate={
                    config.disableFuture
                        ? (current) => current && current > dayjs().endOf('day')
                        : undefined
                }
                style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                }}
            />
        </div>
    );

    const renderDateRangeFilter = (config: DateRangeFilterConfig) => (
        <div key={config.id} style={{ marginBottom: '24px' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '12px',
                }}
            >
                {config.label}
            </label>
            <RangePicker
                value={[
                    config.value[0] ? dayjs(config.value[0]) : null,
                    config.value[1] ? dayjs(config.value[1]) : null,
                ]}
                onChange={(dates) => {
                    const format = config.format || 'YYYY-MM-DD';
                    config.onChange([
                        dates?.[0] ? dates[0].format(format) : null,
                        dates?.[1] ? dates[1].format(format) : null,
                    ]);
                }}
                format={config.format || 'YYYY-MM-DD'}
                placeholder={config.placeholder || ['Start date', 'End date']}
                style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                }}
            />
        </div>
    );

    const renderSelectFilter = (config: SelectFilterConfig) => (
        <div key={config.id} style={{ marginBottom: '24px' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '12px',
                }}
            >
                {config.label}
            </label>
            <Space orientation="vertical" style={{ width: '100%' }}>
                {config.options.map((option) => (
                    <Button
                        key={option.value}
                        onClick={() => config.onChange(option.value)}
                        type={config.value === option.value ? 'primary' : 'default'}
                        block
                        style={{
                            height: '44px',
                            borderRadius: '8px',
                        }}
                    >
                        {option.label}
                    </Button>
                ))}
            </Space>
        </div>
    );

    const renderCustomFilter = (config: CustomFilterConfig) => (
        <div key={config.id} style={{ marginBottom: '24px' }}>
            {config.render()}
        </div>
    );

    const renderFilter = (filter: FilterConfig) => {
        switch (filter.type) {
            case 'time-radio':
                return renderTimeRadioFilter(filter);
            case 'hierarchical-select':
                return renderHierarchicalSelectFilter(filter);
            case 'date-picker':
                return renderDatePickerFilter(filter);
            case 'date-range':
                return renderDateRangeFilter(filter);
            case 'select':
                return renderSelectFilter(filter);
            case 'custom':
                return renderCustomFilter(filter);
            default:
                return null;
        }
    };

    return (
        <Drawer
            title={
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--foreground)',
                            margin: 0,
                        }}
                    >
                        {title}
                    </h2>
                </div>
            }
            placement="bottom"
            onClose={onClose}
            open={isOpen}
            size="85vh"
            zIndex={800}
            closeIcon={<CloseOutlined style={{ fontSize: '24px' }} />}
            styles={{
                body: { paddingTop: 16 },
                header: { borderBottom: '1px solid #e5e7eb' },
            }}
            footer={
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button onClick={onClearAll} block size="large" style={{ borderRadius: '8px' }}>
                        {clearButtonText}
                    </Button>
                    <Button
                        type="primary"
                        onClick={onApply}
                        block
                        size="large"
                        style={{ borderRadius: '8px' }}
                    >
                        {applyButtonText}
                    </Button>
                </div>
            }
        >
            {filters.map((filter) => renderFilter(filter))}
        </Drawer>
    );
};

export default MobileFilterSheet;
