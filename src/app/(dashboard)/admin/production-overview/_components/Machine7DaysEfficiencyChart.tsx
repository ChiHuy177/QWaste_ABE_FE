'use client';

import React from 'react';
import { Card, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
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

    const getBarColor = (efficiency: number) => {
        if (efficiency >= 85) return token.colorSuccess;
        if (efficiency >= 70) return token.colorWarning;
        return token.colorError;
    };

    const avgEfficiency =
        data.length > 0
            ? (data.reduce((sum, item) => sum + item.efficiency, 0) / data.length).toFixed(1)
            : '0';

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
                    <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorText }}>
                        {t('productionOverview.machineDetail.recent7DaysEfficiency')}
                    </Text>
                    <div style={{ fontSize: 12, color: token.colorTextDescription }}>
                        {machineCode} – {t('productionOverview.filters.dayShift')} – TB: {avgEfficiency}%
                    </div>
                </div>

                {/* Threshold Legends */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: token.colorSuccess,
                            }}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            ≥85%
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: token.colorWarning,
                            }}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            70–84%
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: token.colorError,
                            }}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            &lt;70%
                        </Text>
                    </div>
                </div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 35, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            unit="%"
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: token.colorBgElevated,
                                borderColor: token.colorBorderSecondary,
                                borderRadius: token.borderRadius,
                                color: token.colorText,
                                fontSize: 12,
                            }}
                            formatter={(value: any) => [`${value ?? 0}%`, t('productionOverview.machineDetail.efficiency')]}
                        />
                        <ReferenceLine
                            y={85}
                            stroke={token.colorSuccess}
                            strokeDasharray="4 4"
                            label={{
                                value: '85%',
                                fill: token.colorSuccess,
                                fontSize: 11,
                                fontWeight: 600,
                                position: 'right',
                            }}
                        />
                        <ReferenceLine
                            y={70}
                            stroke={token.colorWarning}
                            strokeDasharray="4 4"
                            label={{
                                value: '70%',
                                fill: token.colorWarning,
                                fontSize: 11,
                                fontWeight: 600,
                                position: 'right',
                            }}
                        />
                        <Bar dataKey="efficiency" radius={[4, 4, 0, 0]} maxBarSize={28}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-7day-${index}`} fill={getBarColor(entry.efficiency)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
