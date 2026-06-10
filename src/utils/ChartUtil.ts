export const breakpoints = {
    xs: 576,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1600,
};

export const chartColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    purple: '#8b5cf6',
    danger: '#ef4444',
    info: '#06b6d4',
    gray: '#6b7280',
};

export const chartTheme = {
    fontSize: {
        small: 11,
        normal: 13,
        large: 15,
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        bold: 600,
    },
    spacing: {
        small: 8,
        medium: 16,
        large: 24,
    },
    borderRadius: {
        small: 4,
        medium: 6,
        large: 8,
    },
};

export const getResponsiveChartHeight = (width: number): number => {
    if (width < breakpoints.xs) return 250;
    if (width < breakpoints.md) return 300;
    return 350;
};

export const getResponsiveFontSize = (width: number): number => {
    if (width < breakpoints.xs) return chartTheme.fontSize.small;
    if (width < breakpoints.md) return chartTheme.fontSize.normal;
    return chartTheme.fontSize.normal;
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

export const getTrendColor = (trend: number): string => {
    if (trend > 0) return chartColors.success;
    if (trend < 0) return chartColors.danger;
    return chartColors.gray;
};

export const getTrendIcon = (trend: number): string => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
};

// Chart configuration presets
export const defaultChartConfig = {
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
    strokeWidth: 2,
    dotRadius: 4,
    activeDotRadius: 6,
};

export const mobileChartConfig = {
    margin: { top: 5, right: 10, left: -10, bottom: 0 },
    strokeWidth: 1.5,
    dotRadius: 3,
    activeDotRadius: 5,
};
