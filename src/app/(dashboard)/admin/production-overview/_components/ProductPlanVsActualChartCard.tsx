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
    Cell,
} from 'recharts';
import { ProductOutputData } from '@/configs/mockData/productionOverviewMockData';

const { Text } = Typography;

interface ProductPlanVsActualChartCardProps {
    data: ProductOutputData[];
}

export const ProductPlanVsActualChartCard: React.FC<ProductPlanVsActualChartCardProps> = ({
    data,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    return (
        <Card
            size="small"
            style={{
                width: '100%',
                borderRadius: token.borderRadiusLG,
                borderColor: token.colorBorderSecondary,
                backgroundColor: token.colorBgContainer,
                boxShadow: token.boxShadowTertiary,
                marginTop: 16,
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorText }}>
                    {t('productionOverview.charts.planVsActualBySku')}
                </Text>
                <div style={{ fontSize: 12, color: token.colorTextDescription }}>
                    {t('productionOverview.charts.planVsActualSkuDesc')} – {t('productionOverview.filters.dayShift')} 17/08/2026
                </div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} opacity={0.5} />
                        <XAxis
                            dataKey="productCode"
                            tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                        />
                        <YAxis
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
                            radius={[4, 4, 0, 0]}
                            maxBarSize={22}
                        />
                        <Bar
                            dataKey="actual"
                            name="actual"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={22}
                        >
                            {data.map((entry, index) => {
                                const ratio = entry.planned > 0 ? entry.actual / entry.planned : 1;
                                const barColor = ratio < 0.7 ? token.colorError : token.colorSuccess;
                                return <Cell key={`cell-product-${index}`} fill={barColor} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
