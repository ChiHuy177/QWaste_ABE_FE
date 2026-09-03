'use client';

import React from 'react';
import { Typography, theme } from 'antd';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { chartColors } from '@/configs/antdTheme';
import { ParsedChartData, useTooltipStyle, formatHours } from './analyticsUtils';

const { Text } = Typography;

interface SimpleLineChartProps {
    chartData: ParsedChartData;
    selectedMachines: string[];
    title: string;
    chartHeight?: number | string;
    showLegend?: boolean;
    useFlex?: boolean;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
    chartData,
    selectedMachines,
    title,
    chartHeight = 200,
    showLegend = false,
    useFlex = false,
}) => {
    const { token } = theme.useToken();
    const tooltipStyle = useTooltipStyle();
    const { data, machines } = chartData;
    const displayMachines = machines.filter((m) => selectedMachines.includes(m.id));
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                ...(useFlex ? { flex: 1, minHeight: 0 } : { height: chartHeight, marginBottom: 0 }),
            }}
        >
            <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13, flexShrink: 0 }}>
                {title}
            </Text>
            {data.length === 0 || displayMachines.length === 0 ? (
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
                    <Text type="secondary">{t('common.noData') || 'Không có dữ liệu'}</Text>
                </div>
            ) : (
                <>
                    <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer>
                            <LineChart
                                data={data}
                                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke={token.colorBorderSecondary}
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                    axisLine={{ stroke: token.colorBorderSecondary }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                    axisLine={{ stroke: token.colorBorderSecondary }}
                                    tickLine={false}
                                    tickFormatter={(value: number) => formatHours(value)}
                                    width={55}
                                />
                                <Tooltip
                                    {...tooltipStyle}
                                    formatter={(value: any) => formatHours(value)}
                                />
                                {displayMachines.map((machine, index) => (
                                    <Line
                                        key={machine.id}
                                        type="linear"
                                        dataKey={machine.id}
                                        name={machine.name}
                                        stroke={chartColors[index % chartColors.length]}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                        animationDuration={800}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {showLegend && (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px 14px',
                                paddingTop: 8,
                                flexShrink: 0,
                            }}
                        >
                            {displayMachines.map((machine, index) => (
                                <div
                                    key={machine.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <div
                                        style={{
                                            width: 20,
                                            height: 2,
                                            borderRadius: 1,
                                            backgroundColor:
                                                chartColors[index % chartColors.length],
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span style={{ fontSize: 11, color: token.colorText }}>
                                        {machine.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
