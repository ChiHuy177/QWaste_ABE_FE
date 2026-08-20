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
} from 'recharts';
import { DailyEfficiencyPoint } from '@/configs/mockData/productionOverviewMockData';

const { Text } = Typography;

interface Machine7DaysEfficiencyChartProps {
    machineCode: string;
    data: DailyEfficiencyPoint[];
}

export const Machine7DaysEfficiencyChart: React.FC<Machine7DaysEfficiencyChartProps> = ({
    machineCode,
    data,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const maxCapLabel = t('productionOverview.machineDetail.maxCapacityHoursLabel');
    const actHoursLabel = t('productionOverview.machineDetail.actualOperatingHoursLabel');
    const opRatioLabel = t('productionOverview.machineDetail.operatingRatioLabel');
    const avgShortLabel = t('productionOverview.machineDetail.averageShort');

    // Transform and ensure maxCapacityHours & actualOperatingHours exist
    const chartData = React.useMemo(() => {
        return data.map((item) => {
            const maxCap = item.maxCapacityHours ?? 180;
            const actualHours =
                item.actualOperatingHours ?? Number(((maxCap * item.efficiency) / 100).toFixed(1));

            return {
                ...item,
                maxCapacityHours: maxCap,
                actualOperatingHours: actualHours,
                efficiency: item.efficiency,
            };
        });
    }, [data]);

    const avgEfficiency =
        chartData.length > 0
            ? (
                  chartData.reduce((sum, item) => sum + item.efficiency, 0) / chartData.length
              ).toFixed(1)
            : '0';

    // Custom Percentage badge label on Line chart points using Ant Design tokens
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
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <div>
                    <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorText }}>
                        {t('productionOverview.machineDetail.recent7DaysEfficiency')}
                    </Text>
                    <div style={{ fontSize: 12, color: token.colorTextDescription }}>
                        {machineCode} – {t('productionOverview.filters.dayShift')} – {avgShortLabel}
                        : {avgEfficiency}%
                    </div>
                </div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: -5, bottom: 0 }}
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
                                    Math.max(250, Math.ceil((dataMax * 1.25) / 50) * 50),
                            ]}
                            tick={{ fill: token.colorTextSecondary, fontSize: 10 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickFormatter={(val) => Number(val).toFixed(2)}
                        />

                        {/* Right Y-Axis: Operating Ratio Percentage */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 200]}
                            tick={{ fill: token.colorTextSecondary, fontSize: 10 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickFormatter={(val) => `${val}%`}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: token.colorBgElevated,
                                borderColor: token.colorBorderSecondary,
                                borderRadius: token.borderRadius,
                                color: token.colorText,
                                fontSize: 12,
                            }}
                            formatter={(value: any, name: any) => {
                                if (name === 'maxCapacityHours' || name === maxCapLabel) {
                                    return [`${Number(value).toFixed(2)} h`, maxCapLabel];
                                }
                                if (name === 'actualOperatingHours' || name === actHoursLabel) {
                                    return [`${Number(value).toFixed(2)} h`, actHoursLabel];
                                }
                                return [`${value}%`, opRatioLabel];
                            }}
                        />

                        <Legend
                            verticalAlign="top"
                            align="center"
                            wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                            formatter={(value: string) => {
                                if (value === 'maxCapacityHours') return maxCapLabel;
                                if (value === 'actualOperatingHours') return actHoursLabel;
                                if (value === 'efficiency') return opRatioLabel;
                                return value;
                            }}
                        />

                        {/* 1. Maximum capacity h (Ant Design Warning Gold Bar) */}
                        <Bar
                            yAxisId="left"
                            dataKey="maxCapacityHours"
                            name="maxCapacityHours"
                            fill={token.colorWarning}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={16}
                        />

                        {/* 2. Actual operating time h (Ant Design Primary Blue Bar) */}
                        <Bar
                            yAxisId="left"
                            dataKey="actualOperatingHours"
                            name="actualOperatingHours"
                            fill={token.colorPrimary}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={16}
                        />

                        {/* 3. Operating ratio % (Ant Design Error Red Line with badge labels) */}
                        <Line
                            yAxisId="right"
                            type="linear"
                            dataKey="efficiency"
                            name="efficiency"
                            stroke={token.colorError}
                            strokeWidth={2.5}
                            dot={{
                                r: 4,
                                fill: token.colorError,
                                stroke: token.colorBgContainer,
                                strokeWidth: 1.5,
                            }}
                            activeDot={{ r: 6 }}
                            label={renderPercentageLabel}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
