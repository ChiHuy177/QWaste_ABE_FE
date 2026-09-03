'use client';

import React from 'react';
import { Card, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import {
    OutputTimelinePoint,
    TimelineGranularity,
} from '@/configs/mockData/productionOverviewMockData';

const { Text } = Typography;

interface MachineHourlyOutputChartProps {
    machineCode: string;
    data: OutputTimelinePoint[];
    granularity?: TimelineGranularity;
    hasPlanLine?: boolean;
}

export const MachineHourlyOutputChart: React.FC<MachineHourlyOutputChartProps> = ({
    machineCode,
    data,
    granularity = 'DAY',
    hasPlanLine = true,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    // Determine whether to display the ratio line (only when granularity is NOT HOUR)
    const showRatioLine = hasPlanLine && granularity !== 'HOUR';

    // Calculate ratio = (actual / planned) * 100
    const chartData = React.useMemo(() => {
        return data.map((item) => {
            const actual = item.actual ?? 0;
            const planned = item.planned ?? 0;
            const ratio = planned > 0 ? Number(((actual / planned) * 100).toFixed(1)) : null;

            return {
                ...item,
                actual,
                planned,
                ratio,
            };
        });
    }, [data]);

    // Stoppage note marker if present
    const stoppagePoint = data.find((p) => p.stoppageNote);

    // Title, Subtitle and Unit Label based on granularity
    const { title, subtitle, unitLabel } = React.useMemo(() => {
        switch (granularity) {
            case 'MONTH':
                return {
                    title: t('productionOverview.machineDetail.monthlyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.machineDetail.monthlyOutputDesc')} (${t('productionOverview.machineDetail.pcsPerMonth')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerMonth'),
                };
            case 'WEEK':
                return {
                    title: t('productionOverview.machineDetail.weeklyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.machineDetail.weeklyOutputDesc')} (${t('productionOverview.machineDetail.pcsPerWeek')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerWeek'),
                };
            case 'DAY':
                return {
                    title: t('productionOverview.machineDetail.dailyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.machineDetail.dailyOutputDesc')} (${t('productionOverview.machineDetail.pcsPerDay')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerDay'),
                };
            case 'HOUR':
            default:
                return {
                    title: t('productionOverview.machineDetail.hourlyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.filters.dayShift')} 17/08/2026 – ${t('productionOverview.machineDetail.actualOutput')} (${t('productionOverview.machineDetail.pcsPerHour')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerHour'),
                };
        }
    }, [granularity, machineCode, t]);

    // Custom Percentage badge label on Ratio Line chart points
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
            <div style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorText }}>
                    {title}
                </Text>
                <div style={{ fontSize: 12, color: token.colorTextDescription }}>{subtitle}</div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{
                            top: 15,
                            right: showRatioLine ? 15 : 15,
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

                        {/* Right Y-Axis: Ratio % (Only rendered when not HOURLY) */}
                        {showRatioLine && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[
                                    0,
                                    (dataMax: number) =>
                                        Math.max(120, Math.ceil((dataMax * 1.2) / 20) * 20),
                                ]}
                                tick={{ fill: token.colorTextSecondary, fontSize: 10 }}
                                axisLine={{ stroke: token.colorBorderSecondary }}
                                tickFormatter={(val) => `${val}%`}
                            />
                        )}

                        <Tooltip
                            contentStyle={{
                                backgroundColor: token.colorBgElevated,
                                borderColor: token.colorBorderSecondary,
                                borderRadius: token.borderRadius,
                                color: token.colorText,
                                fontSize: 12,
                            }}
                            formatter={(value: any, name: any) => {
                                if (
                                    name === 'ratio' ||
                                    name ===
                                        t(
                                            'productionOverview.machineDetail.productionRatio',
                                            'Tỷ lệ sản lượng'
                                        )
                                ) {
                                    return [
                                        value != null ? `${value}%` : 'N/A',
                                        t(
                                            'productionOverview.machineDetail.productionRatio',
                                            'Tỷ lệ sản lượng'
                                        ),
                                    ];
                                }
                                if (
                                    name === 'planned' ||
                                    name ===
                                        t(
                                            'productionOverview.machineDetail.plannedOutput',
                                            'Kế hoạch'
                                        )
                                ) {
                                    return [
                                        `${(value ?? 0).toLocaleString()} ${unitLabel}`,
                                        t(
                                            'productionOverview.machineDetail.plannedOutput',
                                            'Kế hoạch'
                                        ),
                                    ];
                                }
                                return [
                                    `${(value ?? 0).toLocaleString()} ${unitLabel}`,
                                    t('productionOverview.machineDetail.actualOutput', 'Thực tế'),
                                ];
                            }}
                        />

                        <Legend
                            wrapperStyle={{ paddingTop: 6, fontSize: 11 }}
                            formatter={(value: string) => {
                                if (value === 'planned') {
                                    return t(
                                        'productionOverview.machineDetail.plannedOutput',
                                        'Kế hoạch'
                                    );
                                }
                                if (value === 'actual') {
                                    return t(
                                        'productionOverview.machineDetail.actualOutput',
                                        'Thực tế'
                                    );
                                }
                                if (value === 'ratio') {
                                    return t(
                                        'productionOverview.machineDetail.productionRatio',
                                        'Tỷ lệ sản lượng'
                                    );
                                }
                                return value;
                            }}
                        />

                        {/* Planned Bar: Rendered when hasPlanLine is true */}
                        {hasPlanLine && (
                            <Bar
                                yAxisId="left"
                                dataKey="planned"
                                name="planned"
                                fill={token.colorTextQuaternary}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={24}
                            />
                        )}

                        {/* Actual Bar: Always rendered */}
                        <Bar
                            yAxisId="left"
                            dataKey="actual"
                            name="actual"
                            fill={token.colorSuccess}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={hasPlanLine ? 24 : 36}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.stoppageNote ? token.colorError : token.colorSuccess
                                    }
                                />
                            ))}
                        </Bar>

                        {/* Ratio Line: Rendered from DAY and above (not for HOUR) */}
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

            {/* Stoppage Alert Banner if present */}
            {stoppagePoint?.stoppageNote && (
                <div
                    style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        borderRadius: token.borderRadius,
                        backgroundColor: token.colorErrorBg,
                        border: `1px solid ${token.colorErrorBorder}`,
                        fontSize: 12,
                        color: token.colorErrorText,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span style={{ fontSize: 14 }}>●</span>
                    <span>{stoppagePoint.stoppageNote}</span>
                </div>
            )}
        </Card>
    );
};
