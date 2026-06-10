import React, { useEffect, useState } from 'react';
import { Typography, theme, Spin, message } from 'antd';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { MachineStatusSummaryItem } from '@/types/Monitoring';
import { useTooltipStyle, formatHours } from './analyticsUtils';
import { SpaceService } from '@/services/SpaceService';

const { Text } = Typography;
const STATUS_KEYS = ['RUNTIME', 'IDLE', 'ERROR', 'OFFLINE'] as const;
type StatusKey = (typeof STATUS_KEYS)[number];
type ChartPoint = Record<StatusKey, number> & { name: string; isFallback?: boolean };
type StatusPoint = { label?: string; hours?: number; value?: number };
type StatusSeries = {
    status?: string;
    data?: StatusPoint[];
    dataPoints?: StatusPoint[];
};

const isStatusKey = (status?: string): status is StatusKey =>
    STATUS_KEYS.includes(status as StatusKey);

interface MachineDetailAreaChartProps {
    selectedRow: MachineStatusSummaryItem;
    filterId: number | null;
    startDate: string;
    endDate: string;
    isDateRange: boolean;
}

const buildFallbackChartData = (selectedRow: MachineStatusSummaryItem) => {
    const fallbackPoint: ChartPoint = {
        name: 'Total',
        RUNTIME: selectedRow.totalRuntimeHours || 0,
        IDLE: selectedRow.totalIdleHours || 0,
        ERROR: selectedRow.totalErrorHours || 0,
        OFFLINE: selectedRow.totalOfflineHours || 0,
        isFallback: true,
    };
    const totalHours =
        fallbackPoint.RUNTIME + fallbackPoint.IDLE + fallbackPoint.ERROR + fallbackPoint.OFFLINE;
    return totalHours > 0 ? [fallbackPoint] : [];
};

export const MachineDetailAreaChart: React.FC<MachineDetailAreaChartProps> = ({
    selectedRow,
    filterId,
    startDate,
    endDate,
    isDateRange,
}) => {
    const { token } = theme.useToken();
    const tooltipStyle = useTooltipStyle();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const totalHours = chartData.reduce(
        (sum, point) =>
            sum + point.RUNTIME + point.IDLE + point.ERROR + point.OFFLINE,
        0
    );
    const isSummaryMode = chartData.length <= 1 || chartData.some((point) => point.isFallback);

    const statusConfig: Record<
        StatusKey,
        { label: string; color: string; background: string }
    > = {
        RUNTIME: {
            label: t('factoryOverview.stats.totalRunTime'),
            color: token.colorSuccess,
            background: token.colorSuccessBg || 'rgba(61, 138, 107, 0.18)',
        },
        IDLE: {
            label: t('factoryOverview.stats.totalStopTime'),
            color: token.colorWarning,
            background: token.colorWarningBg || 'rgba(196, 136, 58, 0.18)',
        },
        ERROR: {
            label: t('factoryOverview.stats.totalErrorTime'),
            color: token.colorError,
            background: token.colorErrorBg || 'rgba(199, 84, 84, 0.18)',
        },
        OFFLINE: {
            label: t('factoryOverview.stats.totalOfflineTime'),
            color: token.colorTextSecondary,
            background: token.colorFillAlter || 'rgba(0, 0, 0, 0.08)',
        },
    };

    useEffect(() => {
        if (!selectedRow) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let res;
                if (isDateRange) {
                    res = await SpaceService.getMachineStatusLogChartByDateRange(
                        startDate,
                        endDate,
                        selectedRow.machineId,
                        filterId ?? undefined
                    );
                } else {
                    if (!filterId) throw new Error('Filter ID is required');
                    res = await SpaceService.getMachineStatusLogChartByFilter(
                        filterId,
                        selectedRow.machineId
                    );
                }

                const payload = (res as any)?.data ?? res;
                const seriesData: StatusSeries[] = Array.isArray(payload?.series)
                    ? payload.series
                    : [];
                const dataMap: Record<string, ChartPoint> = {};

                seriesData.forEach((seriesItem) => {
                    const status = seriesItem.status;
                    const points = seriesItem.data ?? seriesItem.dataPoints ?? [];
                    if (!isStatusKey(status) || !Array.isArray(points)) return;

                    points.forEach((point) => {
                        const label = point.label;
                        if (!label) return;

                        const hours = Number(point.hours ?? point.value ?? 0);
                        if (!dataMap[label]) {
                            dataMap[label] = {
                                name: label,
                                RUNTIME: 0,
                                IDLE: 0,
                                ERROR: 0,
                                OFFLINE: 0,
                            };
                        }
                        dataMap[label][status] = Number.isFinite(hours) ? hours : 0;
                    });
                });

                const nextChartData = Object.values(dataMap);
                setChartData(
                    nextChartData.length > 0 ? nextChartData : buildFallbackChartData(selectedRow)
                );
            } catch (error) {
                console.error('Failed to fetch machine status log chart', error);
                message.error('Không tải được dữ liệu biểu đồ trạng thái');
                setChartData(buildFallbackChartData(selectedRow));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedRow, filterId, startDate, endDate, isDateRange]);

    return (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ marginBottom: 16 }}>
                {t('factoryOverview.charts.title.runtimeAnalytics')}
            </Text>
            {loading ? (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Spin />
                </div>
            ) : chartData.length === 0 ? (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px dashed ${token.colorBorder}`,
                        borderRadius: token.borderRadius,
                    }}
                >
                    <Text type="secondary">{t('common.noData')}</Text>
                </div>
            ) : isSummaryMode ? (
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        justifyContent: 'center',
                    }}
                >
                    <div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            {t('factoryOverview.errorAnalytics.totalTime')}
                        </Text>
                        <Text strong style={{ fontSize: 22 }}>
                            {formatHours(totalHours)}
                        </Text>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: 22,
                            borderRadius: token.borderRadiusLG,
                            overflow: 'hidden',
                            background: token.colorFillSecondary,
                        }}
                    >
                        {STATUS_KEYS.map((status) => {
                            const value = chartData[0][status];
                            if (value <= 0 || totalHours <= 0) return null;
                            return (
                                <div
                                    key={status}
                                    title={`${statusConfig[status].label}: ${formatHours(value)}`}
                                    style={{
                                        width: `${(value / totalHours) * 100}%`,
                                        background: statusConfig[status].color,
                                        minWidth: value > 0 ? 3 : 0,
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 10,
                        }}
                    >
                        {STATUS_KEYS.map((status) => {
                            const value = chartData[0][status];
                            const pct = totalHours > 0 ? Math.round((value / totalHours) * 100) : 0;
                            return (
                                <div
                                    key={status}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: token.borderRadiusLG,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: statusConfig[status].background,
                                        minWidth: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 2,
                                                background: statusConfig[status].color,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Text ellipsis style={{ fontSize: 12 }}>
                                            {statusConfig[status].label}
                                        </Text>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                        }}
                                    >
                                        <Text strong>{formatHours(value)}</Text>
                                        <Text type="secondary">{pct}%</Text>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={token.colorBorderSecondary}
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickLine={false}
                            tickFormatter={(value) => formatHours(value)}
                            width={55}
                        />
                        <Tooltip
                            {...tooltipStyle}
                            formatter={(value: number, name: string) => {
                                const status = name as StatusKey;
                                const translatedName = statusConfig[status]?.label ?? name;
                                return [formatHours(value), translatedName];
                            }}
                        />
                        <Legend
                            formatter={(value) => {
                                const status = value as StatusKey;
                                return statusConfig[status]?.label ?? value;
                            }}
                            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: token.colorText }}
                        />
                        {STATUS_KEYS.map((status, index) => (
                            <Bar
                                key={status}
                                dataKey={status}
                                stackId="1"
                                fill={statusConfig[status].color}
                                radius={index === STATUS_KEYS.length - 1 ? [4, 4, 0, 0] : 0}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};
