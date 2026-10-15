'use client';

import React, { useMemo } from 'react';
import { Card, Typography, theme, Tag, Space, Spin, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
    DashboardMachineProductionSeriesResponse,
    MachineProductionBucketGranularity,
} from '@/types/Dashboard';

const { Text } = Typography;

interface MachineOutputChartProps {
    machineCode: string;
    machineName?: string | null;
    seriesData?: DashboardMachineProductionSeriesResponse | null;
    isLoading?: boolean;
    subtitle?: string;
}

export const MachineOutputChart: React.FC<MachineOutputChartProps> = React.memo(
    ({ machineCode, machineName, seriesData, isLoading = false, subtitle: customSubtitle }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        const machineDisplay =
            machineName && machineName !== machineCode
                ? `${machineName} (${machineCode})`
                : machineCode;

        // Determine effective granularity
        const effectiveGranularity: MachineProductionBucketGranularity = useMemo(() => {
            return seriesData?.bucketGranularity ?? 'DAY';
        }, [seriesData?.bucketGranularity]);

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

        // Check if series has any planned quantities (can be null in degrade mode or HOURLY)
        const hasPlannedData = useMemo(() => {
            if (seriesData?.buckets) {
                return seriesData.buckets.some(
                    (b) => b.plannedQuantity !== null && b.plannedQuantity > 0
                );
            }
            return false;
        }, [seriesData]);

        interface MachineOutputChartItem {
            label: string;
            bucketStart?: string | null;
            bucketEnd?: string | null;
            planned: number | null;
            actual: number;
            ratio: number | null;
            stoppageNote?: string;
            shiftId?: number | null;
            shiftLabel?: string | null;
        }

        // Transform chart data (API buckets only, no mock fallback)
        const chartData = useMemo<MachineOutputChartItem[]>(() => {
            if (seriesData?.buckets && seriesData.buckets.length > 0) {
                return seriesData.buckets.map((b) => {
                    const label = formatBucketLabel(
                        b.bucketStart,
                        b.bucketEnd,
                        effectiveGranularity
                    );
                    return {
                        label,
                        bucketStart: b.bucketStart,
                        bucketEnd: b.bucketEnd,
                        planned: b.plannedQuantity,
                        actual: b.actualQuantity,
                        ratio: b.productionRatioPercentage,
                        shiftId: b.shiftId,
                        shiftLabel: b.shiftLabel,
                    };
                });
            }
            return [];
        }, [seriesData, effectiveGranularity, formatBucketLabel]);

        // Check if ratio line should be visible
        const showRatioLine = useMemo(() => {
            if (!hasPlannedData) return false;
            return chartData.some((d) => d.ratio !== null);
        }, [hasPlannedData, chartData]);

        // Title, Subtitle and Unit Label based on granularity
        const { title, subtitle, granTagLabel } = useMemo(() => {
            let tagText = t('productionOverview.performanceReport.granularityDay', 'Theo ngày');
            let titleText = t(
                'productionOverview.machineDetail.dailyOutput',
                'Sản lượng theo ngày'
            );
            let subText = `${machineDisplay} – ${t('productionOverview.machineDetail.dailyOutputDesc', 'Sản lượng kế hoạch vs thực tế theo ngày')} (${t('productionOverview.machineDetail.pcsPerDay', 'sp/ngày')})`;
            let unit = t('productionOverview.machineDetail.pcsPerDay', 'sp/ngày');

            switch (effectiveGranularity) {
                case 'MONTH':
                    tagText = t(
                        'productionOverview.performanceReport.granularityMonth',
                        'Theo tháng'
                    );
                    titleText = t(
                        'productionOverview.machineDetail.monthlyOutput',
                        'Sản lượng theo tháng'
                    );
                    subText = `${machineDisplay} – ${t('productionOverview.machineDetail.monthlyOutputDesc', 'Sản lượng kế hoạch vs thực tế theo tháng')} (${t('productionOverview.machineDetail.pcsPerMonth', 'sp/tháng')})`;
                    unit = t('productionOverview.machineDetail.pcsPerMonth', 'sp/tháng');
                    break;
                case 'WEEK':
                    tagText = t(
                        'productionOverview.performanceReport.granularityWeek',
                        'Theo tuần'
                    );
                    titleText = t(
                        'productionOverview.machineDetail.weeklyOutput',
                        'Sản lượng theo tuần'
                    );
                    subText = `${machineDisplay} – ${t('productionOverview.machineDetail.weeklyOutputDesc', 'Sản lượng kế hoạch vs thực tế theo tuần')} (${t('productionOverview.machineDetail.pcsPerWeek', 'sp/tuần')})`;
                    unit = t('productionOverview.machineDetail.pcsPerWeek', 'sp/tuần');
                    break;
                case 'HOUR':
                    tagText = t('productionOverview.performanceReport.granularityHour', 'Theo giờ');
                    titleText = t(
                        'productionOverview.machineDetail.hourlyOutput',
                        'Sản lượng theo giờ'
                    );
                    subText = `${machineDisplay} – ${t('productionOverview.machineDetail.actualOutput', 'Sản lượng thực tế')} (${t('productionOverview.machineDetail.pcsPerHour', 'sp/giờ')})`;
                    unit = t('productionOverview.machineDetail.pcsPerHour', 'sp/giờ');
                    break;
                case 'DAY':
                default:
                    break;
            }

            return {
                title: titleText,
                subtitle: customSubtitle ? `${machineDisplay} – ${customSubtitle}` : subText,
                unitLabel: unit,
                granTagLabel: tagText,
            };
        }, [effectiveGranularity, machineDisplay, customSubtitle, t]);

        // Minimum width for horizontal scrolling if many buckets
        const minChartWidth = useMemo(() => {
            if (chartData.length <= 12) return undefined;
            return Math.max(600, chartData.length * 48);
        }, [chartData.length]);

        // Custom Percentage badge label on Ratio Line
        const renderPercentageLabel = (props: any) => {
            const { x, y, value } = props;
            if (value == null) return null;
            return (
                <g>
                    <rect
                        x={x - 17}
                        y={y - 23}
                        width={34}
                        height={17}
                        fill={token.colorErrorBg}
                        stroke={token.colorErrorBorder}
                        strokeWidth={1}
                        rx={3}
                    />
                    <text
                        x={x}
                        y={y - 10}
                        fill={token.colorErrorText}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                    >
                        {value}%
                    </text>
                </g>
            );
        };

        // Custom Tooltip for Recharts
        const renderCustomTooltip = ({ active, payload, label }: any) => {
            if (!active || !payload || payload.length === 0) return null;
            const item = payload[0]?.payload;
            if (!item) return null;

            const hasItemPlanned = item.planned !== null && item.planned !== undefined;
            const ratio = item.ratio;

            let ratioColor = token.colorTextDescription;
            if (ratio !== null) {
                if (ratio >= 85) ratioColor = token.colorSuccess;
                else if (ratio >= 70) ratioColor = token.colorWarning;
                else ratioColor = token.colorError;
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
                    <div
                        style={{
                            fontWeight: 700,
                            color: token.colorText,
                            marginBottom: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                        }}
                    >
                        <span>
                            {label}{' '}
                            {item.bucketStart && item.bucketEnd && (
                                <span style={{ fontWeight: 400, color: token.colorTextSecondary }}>
                                    ({dayjs(item.bucketStart).format('DD/MM HH:mm')} -{' '}
                                    {dayjs(item.bucketEnd).format('DD/MM HH:mm')})
                                </span>
                            )}
                        </span>
                        {item.shiftLabel && (
                            <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                                {item.shiftLabel}
                            </Tag>
                        )}
                    </div>

                    {hasItemPlanned && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span style={{ color: token.colorTextSecondary }}>
                                {t('productionOverview.machineDetail.plannedOutput', 'Kế hoạch')}:
                            </span>
                            <strong style={{ color: token.colorPrimary }}>
                                {item.planned.toLocaleString()}{' '}
                                {t('productionOverview.machineDetail.pcs', 'sp')}
                            </strong>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span style={{ color: token.colorTextSecondary }}>
                            {t('productionOverview.machineDetail.actualOutput', 'Thực tế')}:
                        </span>
                        <strong style={{ color: token.colorSuccess }}>
                            {(item.actual ?? 0).toLocaleString()}{' '}
                            {t('productionOverview.machineDetail.pcs', 'sp')}
                        </strong>
                    </div>

                    {ratio !== null && (
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
                                {t(
                                    'productionOverview.machineDetail.productionRatio',
                                    'Tỷ lệ sản lượng'
                                )}
                                :
                            </span>
                            <strong style={{ color: ratioColor, fontSize: 13 }}>{ratio}%</strong>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <Card
                size="small"
                style={{
                    height: '100%',
                    width: '100%',
                    borderRadius: token.borderRadiusLG,
                    borderColor: token.colorBorderSecondary,
                    backgroundColor: token.colorBgContainer,
                    boxShadow: token.boxShadowTertiary,
                }}
            >
                {/* Header Toolbar */}
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
                                {title}
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
                            {!hasPlannedData && (
                                <Tag
                                    color="default"
                                    style={{
                                        borderRadius: 6,
                                        fontSize: 11,
                                        color: token.colorTextDescription,
                                    }}
                                >
                                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                                    {t(
                                        'productionOverview.machineDetail.actualOnlyNotice',
                                        'Chỉ có sản lượng thực tế'
                                    )}
                                </Tag>
                            )}
                        </Space>
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorTextDescription,
                                marginTop: 2,
                            }}
                        >
                            {subtitle}
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
                                {t('productionOverview.machineDetail.actualOutput', 'Thực tế')}
                            </Text>
                        </div>
                        {hasPlannedData && (
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
                                    {t(
                                        'productionOverview.machineDetail.plannedOutput',
                                        'Kế hoạch'
                                    )}
                                </Text>
                            </div>
                        )}
                        {showRatioLine && (
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
                                    {t(
                                        'productionOverview.machineDetail.productionRatio',
                                        'Tỷ lệ sản lượng'
                                    )}
                                </Text>
                            </div>
                        )}
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
                                        'Không có dữ liệu sản lượng'
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
                                    margin={{
                                        top: 18,
                                        right: 15,
                                        left: -10,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={token.colorBorderSecondary}
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                    />

                                    {/* Left Y-Axis: Output Quantity */}
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        tickFormatter={(val) =>
                                            val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                                        }
                                    />

                                    {/* Right Y-Axis: Ratio % (Only rendered when ratio data exists) */}
                                    {showRatioLine && (
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[
                                                0,
                                                (dataMax: number) =>
                                                    Math.max(
                                                        120,
                                                        Math.ceil((dataMax * 1.2) / 20) * 20
                                                    ),
                                            ]}
                                            tick={{ fill: token.colorTextSecondary, fontSize: 10 }}
                                            axisLine={{ stroke: token.colorBorderSecondary }}
                                            tickFormatter={(val) => `${val}%`}
                                        />
                                    )}

                                    <Tooltip content={renderCustomTooltip} />

                                    {/* Planned Bar: Rendered when hasPlannedData is true */}
                                    {hasPlannedData && (
                                        <Bar
                                            yAxisId="left"
                                            dataKey="planned"
                                            name="planned"
                                            fill={token.colorPrimary}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    )}

                                    {/* Actual Bar: Always rendered */}
                                    <Bar
                                        yAxisId="left"
                                        dataKey="actual"
                                        name="actual"
                                        fill={token.colorSuccess}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={hasPlannedData ? 28 : 40}
                                    />

                                    {/* Ratio Line: Rendered when ratio data exists */}
                                    {showRatioLine && (
                                        <Line
                                            yAxisId="right"
                                            type="linear"
                                            dataKey="ratio"
                                            name="ratio"
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
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </Card>
        );
    }
);

MachineOutputChart.displayName = 'MachineOutputChart';
