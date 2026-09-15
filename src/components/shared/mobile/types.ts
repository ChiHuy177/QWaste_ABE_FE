import { ReactNode } from 'react';

export interface FilterOption<T = string | number> {
    label: string;
    value: T;
}

export interface BaseFilterConfig {
    id: string;
    label: string;
    type: 'time-radio' | 'hierarchical-select' | 'date-picker' | 'date-range' | 'select' | 'custom';
}

export interface TimeRadioFilterConfig extends BaseFilterConfig {
    type: 'time-radio';
    options: FilterOption<string>[];
    value: string;
    onChange: (value: string) => void;
    gridColumns?: number; 
}

export interface HierarchicalSelectFilterConfig extends BaseFilterConfig {
    type: 'hierarchical-select';
    useNavigation?: boolean; // Enable tab/view navigation instead of stacking
    levels: {
        id: string;
        label: string;
        options: FilterOption[];
        value?: string | number;
        onChange: (value: string | number) => void;
        placeholder?: string;
        showIcon?: boolean; // Show arrow icon when selected
        enableSearch?: boolean; // Enable search functionality for this level
        searchPlaceholder?: string; // Placeholder text for search input
    }[];
}

export interface DatePickerFilterConfig extends BaseFilterConfig {
    type: 'date-picker';
    value: string | null;
    onChange: (value: string | null) => void;
    format?: string;
    placeholder?: string;
    disableFuture?: boolean; // Disable future dates
}

export interface DateRangeFilterConfig extends BaseFilterConfig {
    type: 'date-range';
    value: [string | null, string | null];
    onChange: (value: [string | null, string | null]) => void;
    format?: string;
    placeholder?: [string, string];
}

export interface SelectFilterConfig extends BaseFilterConfig {
    type: 'select';
    options: FilterOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    allowClear?: boolean;
}

export interface CustomFilterConfig extends BaseFilterConfig {
    type: 'custom';
    render: () => ReactNode;
}

export type FilterConfig =
    | TimeRadioFilterConfig
    | HierarchicalSelectFilterConfig
    | DatePickerFilterConfig
    | DateRangeFilterConfig
    | SelectFilterConfig
    | CustomFilterConfig;

export interface MobileFilterSheetConfig {
    title: string;
    filters: FilterConfig[];
    onApply: () => void;
    onClearAll: () => void;
    applyButtonText?: string;
    clearButtonText?: string;
}
