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
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { MachineOutputData } from '@/configs/mockData/productionOverviewMockData';

const { Text } = Typography;

interface MachinePlanVsActualChartCardProps {
    data: MachineOutputData[];
}

export const MachinePlanVsActualChartCard: React.FC<MachinePlanVsActualChartCardProps> = ({
    data,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

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
            <div style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: 700, color: token.colorText }}>
                    {t('productionOverview.charts.planVsActualByMachine')}
                </Text>
                <div style={{ fontSize: 12, color: token.colorTextDescription }}>
                    {t('productionOverview.charts.outputPcs')}
                </div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={token.colorBorderSecondary}
                            opacity={0.5}
                        />
                        <XAxis
                            dataKey="machineCode"
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                        />
                        <YAxis
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickFormatter={(val) =>
                                val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                            }
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: token.colorBgElevated,
                                borderColor: token.colorBorderSecondary,
                                borderRadius: token.borderRadius,
                                color: token.colorText,
                                fontSize: 12,
                            }}
                            formatter={(value: any, name: any) => [
                                `${(value ?? 0).toLocaleString()} sp`,
                                name === 'planned'
                                    ? t('productionOverview.charts.planned')
                                    : t('productionOverview.charts.actual'),
                            ]}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
                            formatter={(value: string) =>
                                value === 'planned'
                                    ? t('productionOverview.charts.planned')
                                    : t('productionOverview.charts.actual')
                            }
                        />
                        <Bar
                            dataKey="planned"
                            name="planned"
                            fill={token.colorTextQuaternary}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={18}
                        />
                        <Bar
                            dataKey="actual"
                            name="actual"
                            fill={token.colorSuccess}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={18}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
