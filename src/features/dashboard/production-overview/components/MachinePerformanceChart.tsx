'use client';

import React, { useMemo } from 'react';
import { Card, Typography, theme, Tag, Space, Spin, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { ClockCircleOutlined } from '@ant-design/icons';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import {
    SingleMachinePerformanceResponse,
    MachineProductionBucketGranularity,
} from '@/types/Dashboard';

const { Text } = Typography;

interface MachinePerformanceChartProps {
    machineCode: string;
    machineName?: string | null;
    performanceData?: SingleMachinePerformanceResponse | null;
    isLoading?: boolean;
    subtitle?: string;
}

interface PerformanceChartItem {
    date: string;
    bucketStart?: string | null;
    bucketEnd?: string | null;
    maxCapacityHours: number;
    actualOperatingHours: number;
    downtimeHours?: number;
    efficiency: number | null;
}

export const MachinePerformanceChart: React.FC<MachinePerformanceChartProps> = React.memo(
    ({
        machineCode,
        machineName,
        performanceData,
        isLoading = false,
        subtitle: customSubtitle,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        const machineDisplay =
            machineName && machineName !== machineCode
                ? `${machineName} (${machineCode})`
                : machineCode;

        const maxCapLabel = t(
            'productionOverview.machineDetail.maxCapacityHoursLabel',
            'Kế hoạch (giờ)'
        );
        const actHoursLabel = t(
            'productionOverview.machineDetail.actualOperatingHoursLabel',
            'Vận hành thực tế (giờ)'
        );
        const opRatioLabel = t(
            'productionOverview.machineDetail.operatingRatioLabel',
            'Hiệu suất %'
        );
        const avgShortLabel = t('productionOverview.machineDetail.averageShort', 'TB');

        // Granularity
        const granularity: MachineProductionBucketGranularity = useMemo(() => {
            return performanceData?.bucketGranularity ?? 'DAY';
        }, [performanceData?.bucketGranularity]);

        // Format bucket label according to granularity
        const formatBucketLabel = useMemo(() => {
            return (
                start: string,
                end: string,
                gran: MachineProductionBucketGranularity
            ): string => {
                const s = dayjs(start);
                switch (gran) {
                    case 'HOUR':
                        return s.format('HH:mm');
                    case 'DAY':
                        return s.format('DD/MM');
                    case 'WEEK':
                        return `${s.format('DD/MM')} - ${dayjs(end).format('DD/MM')}`;
                    case 'MONTH':
                        return s.format('MM/YYYY');
                    default:
                        return s.format('DD/MM');
                }
            };
        }, []);

        // Granularity tag label
        const granTagLabel = useMemo(() => {
            switch (granularity) {
                case 'HOUR':
                    return t('productionOverview.performanceReport.granularityHour', 'Theo giờ');
                case 'DAY':
                    return t('productionOverview.performanceReport.granularityDay', 'Theo ngày');
                case 'WEEK':
                    return t('productionOverview.performanceReport.granularityWeek', 'Theo tuần');
                case 'MONTH':
                    return t('productionOverview.performanceReport.granularityMonth', 'Theo tháng');
                default:
                    return granularity;
            }
        }, [granularity, t]);

        // Transform chart data (real API buckets or mock fallback)
        const chartData = useMemo<PerformanceChartItem[]>(() => {
            if (performanceData?.buckets && performanceData.buckets.length > 0) {
                return performanceData.buckets.map((b) => {
                    const label = formatBucketLabel(b.bucketStart, b.bucketEnd, granularity);
                    const maxCap = Number((b.plannedWorkingSeconds / 3600).toFixed(2));
                    const actualHours = Number((b.runtimeSeconds / 3600).toFixed(2));
                    const downtimeH = Number((b.downtimeSeconds / 3600).toFixed(2));
                    return {
                        date: label,
                        bucketStart: b.bucketStart,
                        bucketEnd: b.bucketEnd,
                        maxCapacityHours: maxCap,
                        actualOperatingHours: actualHours,
                        downtimeHours: downtimeH,
                        efficiency: b.efficiencyPercentage,
                    };
                });
            }

            return [];
        }, [performanceData, granularity, formatBucketLabel]);

        // Average efficiency
        const avgEfficiency = useMemo(() => {
            const validItems = chartData.filter((item) => item.efficiency !== null);
            if (validItems.length === 0) return '0';
            const sum = validItems.reduce((acc, item) => acc + (item.efficiency ?? 0), 0);
            return (sum / validItems.length).toFixed(1);
        }, [chartData]);

        // Min width for horizontal scrolling
        const minChartWidth = useMemo(() => {
            if (chartData.length <= 12) return undefined;
            return Math.max(600, chartData.length * 48);
        }, [chartData.length]);

        // Custom Percentage badge label on Line chart points
        const renderPercentageLabel = (props: any) => {
            const { x, y, value } = props;
            if (value == null) return null;
            const textVal = `${value}%`;
            const rectWidth = Math.max(38, textVal.length * 7);
            const isNearTop = y < 35;
            const rectY = isNearTop ? y + 8 : y - 23;
            const textY = isNearTop ? y + 20 : y - 10;
            return (
                <g>
                    <rect
                        x={x - rectWidth / 2}
                        y={rectY}
                        width={rectWidth}
                        height={17}
                        fill={token.colorErrorBg}
                        stroke={token.colorErrorBorder}
                        strokeWidth={1}
                        rx={3}
                    />
                    <text
                        x={x}
                        y={textY}
                        fill={token.colorErrorText}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                    >
                        {textVal}
                    </text>
                </g>
            );
        };

        // Custom Tooltip
        const renderCustomTooltip = ({ active, payload, label }: any) => {
            if (!active || !payload || payload.length === 0) return null;
            const item = payload[0]?.payload as PerformanceChartItem;
            if (!item) return null;

            const eff = item.efficiency;
            let effColor = token.colorTextDescription;
            let effText = t('productionOverview.performanceReport.notApplicable', 'N/A');

            if (eff !== null) {
                effText = `${eff}%`;
                if (eff >= 85) effColor = token.colorSuccess;
                else if (eff >= 70) effColor = token.colorWarning;
                else effColor = token.colorError;
            }

            return (
                <div
                    style={{
                        backgroundColor: token.colorBgElevated,
                        padding: '10px 14px',
                        borderRadius: token.borderRadiusLG,
                        boxShadow: token.boxShadowSecondary,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        fontSize: 12,
                        lineHeight: 1.6,
                    }}
                >
                    <div style={{ fontWeight: 700, color: token.colorText, marginBottom: 4 }}>
                        {label}{' '}
                        {item.bucketStart && item.bucketEnd && (
                            <span style={{ fontWeight: 400, color: token.colorTextSecondary }}>
                                ({dayjs(item.bucketStart).format('DD/MM HH:mm')} -{' '}
                                {dayjs(item.bucketEnd).format('DD/MM HH:mm')})
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span style={{ color: token.colorTextSecondary }}>{maxCapLabel}:</span>
                        <strong style={{ color: token.colorPrimary }}>
                            {item.maxCapacityHours}{' '}
                            {t('productionOverview.performanceReport.hoursUnit', 'h')}
                        </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span style={{ color: token.colorTextSecondary }}>{actHoursLabel}:</span>
                        <strong style={{ color: token.colorSuccess }}>
                            {item.actualOperatingHours}{' '}
                            {t('productionOverview.performanceReport.hoursUnit', 'h')}
                        </strong>
                    </div>

                    {item.downtimeHours !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: token.colorTextSecondary }}>
                                {t(
                                    'productionOverview.performanceReport.downtimeHours',
                                    'Downtime'
                                )}
                                :
                            </span>
                            <strong style={{ color: token.colorError }}>
                                {item.downtimeHours}{' '}
                                {t('productionOverview.performanceReport.hoursUnit', 'h')}
                            </strong>
                        </div>
                    )}

                    <div
                        style={{
                            marginTop: 6,
                            paddingTop: 6,
                            borderTop: `1px dashed ${token.colorBorderSecondary}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 16,
                        }}
                    >
                        <span style={{ fontWeight: 600, color: token.colorText }}>
                            {t('productionOverview.performanceReport.efficiency', 'Hiệu suất')}:
                        </span>
                        <strong style={{ color: effColor, fontSize: 13 }}>{effText}</strong>
                    </div>
                </div>
            );
        };

        return (
            <Card
                size="small"
                style={{
                    height: '100%',
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorderSecondary,
                    backgroundColor: token.colorBgContainer,
                    boxShadow: token.boxShadowTertiary,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    <div>
                        <Space align="center" size={8} wrap>
                            <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorText }}>
                                {t(
                                    'productionOverview.machineDetail.machineEfficiencyTitle',
                                    'Hiệu suất vận hành máy'
                                )}
                            </Text>
                            <Tag
                                color="processing"
                                style={{
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            >
                                <ClockCircleOutlined style={{ marginRight: 4 }} />
                                {granTagLabel}
                            </Tag>
                        </Space>
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorTextDescription,
                                marginTop: 2,
                            }}
                        >
                            {machineDisplay} –{' '}
                            {customSubtitle || t('productionOverview.filters.dayShift')} –{' '}
                            {avgShortLabel}: {avgEfficiency}%
                        </div>
                    </div>

                    {/* Series Legend cố định ở góc trên bên phải */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 11,
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor: token.colorSuccess,
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {actHoursLabel}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor: token.colorPrimary,
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {maxCapLabel}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 12,
                                    height: 2,
                                    backgroundColor: token.colorError,
                                    borderRadius: 1,
                                    position: 'relative',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        backgroundColor: token.colorError,
                                    }}
                                />
                            </span>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {opRatioLabel}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div
                        style={{
                            height: 280,
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
                            height: 280,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span style={{ color: token.colorTextDescription, fontSize: 13 }}>
                                    {t(
                                        'productionOverview.charts.noData',
                                        'Không có dữ liệu hiệu suất'
                                    )}
                                </span>
                            }
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            width: '100%',
                            overflowX: minChartWidth ? 'auto' : 'hidden',
                            paddingBottom: minChartWidth ? 6 : 0,
                        }}
                    >
                        <div style={{ width: '100%', minWidth: minChartWidth, height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 18, right: 12, left: -5, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={token.colorBorderSecondary}
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                    />

                                    {/* Left Y-Axis: Operating Capacity Hours */}
                                    <YAxis
                                        yAxisId="left"
                                        domain={[
                                            0,
                                            (dataMax: number) =>
                                                dataMax <= 1 ? 1 : Math.ceil(dataMax * 1.1),
                                        ]}
                                        tick={{ fill: token.colorTextSecondary, fontSize: 10 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        tickFormatter={(val) => Number(val).toFixed(1)}
                                    />

                                    {/* Right Y-Axis: Operating Ratio Percentage (No unit=% to prevent %% duplicate) */}
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        domain={[
                                            0,
                                            (dataMax: number) =>
                                                Math.max(
                                                    120,
                                                    Math.ceil((dataMax * 1.25) / 20) * 20
                                                ),
                                        ]}
                                        tick={{ fill: token.colorTextSecondary, fontSize: 10 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        tickFormatter={(val) => `${val}%`}
                                    />

                                    <Tooltip content={renderCustomTooltip} />

                                    {/* 1. Planned working hours (Primary Blue Bar) */}
                                    <Bar
                                        yAxisId="left"
                                        dataKey="maxCapacityHours"
                                        name="maxCapacityHours"
                                        fill={token.colorPrimary}
                                        radius={[3, 3, 0, 0]}
                                        maxBarSize={20}
                                    />

                                    {/* 2. Actual operating time (Success Green Bar) */}
                                    <Bar
                                        yAxisId="left"
                                        dataKey="actualOperatingHours"
                                        name="actualOperatingHours"
                                        fill={token.colorSuccess}
                                        radius={[3, 3, 0, 0]}
                                        maxBarSize={20}
                                    />

                                    {/* 3. Efficiency % (Line with badge labels) */}
                                    <Line
                                        yAxisId="right"
                                        type="linear"
                                        dataKey="efficiency"
                                        name="efficiency"
                                        stroke={token.colorError}
                                        strokeWidth={2.5}
                                        dot={{
                                            r: 3.5,
                                            fill: token.colorError,
                                            stroke: token.colorBgContainer,
                                            strokeWidth: 1.5,
                                        }}
                                        activeDot={{ r: 5.5 }}
                                        label={renderPercentageLabel}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </Card>
        );
    }
);

MachinePerformanceChart.displayName = 'MachinePerformanceChart';
