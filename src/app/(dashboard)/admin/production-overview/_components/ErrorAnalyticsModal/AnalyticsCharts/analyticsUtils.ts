import { theme } from 'antd';
import { MtbfChartResponse, MttrChartResponse } from '@/types/Monitoring';

export interface ParsedMachine {
    id: string;
    name: string;
    totalValue: number;
}

export interface ParsedChartData {
    data: any[];
    machines: ParsedMachine[];
}

export const formatHours = (hours: number): string => {
    if (hours == null || isNaN(hours)) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

export const parseChartData = (
    apiResponse?: MtbfChartResponse | MttrChartResponse
): ParsedChartData => {
    const seriesData = apiResponse?.series || [];
    if (!Array.isArray(seriesData) || seriesData.length === 0) {
        return { data: [], machines: [] };
    }

    const machines: ParsedMachine[] = [];
    const dataMap: Record<string, any> = {};

    seriesData.forEach((series: any) => {
        const machineId = series.machineId;
        const machineName = series.machineName || series.machineId;
        let totalValue = 0;

        if (Array.isArray(series.dataPoints)) {
            series.dataPoints.forEach((point: any) => {
                const val = point.value ?? 0;
                totalValue += val;
                const label = point.label;
                if (!dataMap[label]) dataMap[label] = { label };
                dataMap[label][machineId] = val;
            });
        }

        machines.push({ id: machineId, name: machineName, totalValue });
    });

    const data = Object.values(dataMap);
    machines.sort((a, b) => b.totalValue - a.totalValue);
    return { data, machines };
};

export const useTooltipStyle = () => {
    const { token } = theme.useToken();
    return {
        contentStyle: {
            backgroundColor: token.colorBgElevated,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadow,
            maxHeight: '250px',
            overflowY: 'auto' as const,
        },
        itemStyle: { color: token.colorText },
        labelStyle: {
            color: token.colorTextHeading || token.colorText,
            fontWeight: 500 as const,
            marginBottom: 8,
        },
        wrapperStyle: { zIndex: 1000, pointerEvents: 'auto' as const },
    };
};

export const getRuntimeLegend = (t: any, token: any) => [
    {
        key: 'runTime',
        name: t('factoryOverview.stats.totalRunTime') || 'Thời gian chạy',
        color: token.colorSuccess,
    },
    {
        key: 'stopTime',
        name: t('factoryOverview.stats.totalStopTime') || 'Thời gian dừng',
        color: token.colorWarning,
    },
    {
        key: 'errorTime',
        name: t('factoryOverview.stats.totalErrorTime') || 'Thời gian lỗi',
        color: token.colorError,
    },
    {
        key: 'offlineTime',
        name: t('factoryOverview.stats.totalOfflineTime') || 'Thời gian ngoại tuyến',
        color: token.colorTextSecondary,
    },
];
