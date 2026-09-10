'use client';

import React, { useMemo } from 'react';
import { Card, Typography, theme, Empty } from 'antd';
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
import { DashboardItemProductionResponse } from '@/types/Dashboard';
import { ProductOutputData } from '@/types/ProductionOverview';

const { Text } = Typography;

export interface NormalizedItemProductionItem {
    productCode: string;
    productName: string;
    planned: number;
    actual: number;
}

interface ProductPlanVsActualChartCardProps {
    data: (DashboardItemProductionResponse | ProductOutputData)[];
    subtitle?: string;
}

export const ProductPlanVsActualChartCard: React.FC<ProductPlanVsActualChartCardProps> = React.memo(
    ({ data, subtitle }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();

        // Normalize incoming data (handles both API response and mock data)
        const chartData = useMemo<NormalizedItemProductionItem[]>(() => {
            if (!data || data.length === 0) return [];
            return data.map((item) => {
                if ('productionPlanCode' in item) {
                    return {
                        productCode: item.productionPlanCode,
                        productName: item.productionPlanName || item.productionPlanCode,
                        planned: item.plannedQuantity ?? 0,
                        actual: item.actualQuantity ?? 0,
                    };
                }
                // Mock data fallback
                return {
                    productCode: item.productCode,
                    productName: item.productCode,
                    planned: item.planned ?? 0,
                    actual: item.actual ?? 0,
                };
            });
        }, [data]);

        // Calculate minimum container width for smooth horizontal scrolling if many items
        const minChartWidth = useMemo(() => {
            const itemWidth = 64;
            return Math.max(600, chartData.length * itemWidth);
        }, [chartData.length]);

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
                        {subtitle || t('productionOverview.charts.planVsActualSkuDesc')}
                    </div>
                </div>

                {/* Recharts Container / Empty State */}
                {chartData.length === 0 ? (
                    <div
                        style={{
                            width: '100%',
                            height: 280,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('productionOverview.charts.noData')}
                                </Text>
                            }
                        />
                    </div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 8 }}>
                        <div style={{ width: '100%', minWidth: minChartWidth, height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={token.colorBorderSecondary}
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="productCode"
                                        tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        interval={0}
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
                                            `${(value ?? 0).toLocaleString()} ${t('productionOverview.charts.pieces')}`,
                                            name === 'planned'
                                                ? t('productionOverview.charts.planned')
                                                : t('productionOverview.charts.actual'),
                                        ]}
                                        labelFormatter={(label: any, items: readonly any[]) => {
                                            const rawItem = items?.[0]?.payload as
                                                NormalizedItemProductionItem | undefined;
                                            if (
                                                rawItem?.productName &&
                                                rawItem.productName !== label
                                            ) {
                                                return `${rawItem.productName} (${label})`;
                                            }
                                            return label;
                                        }}
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
                                        {chartData.map((entry, index) => {
                                            const ratio =
                                                entry.planned > 0
                                                    ? entry.actual / entry.planned
                                                    : 1;
                                            const barColor =
                                                ratio < 0.7 ? token.colorError : token.colorSuccess;
                                            return (
                                                <Cell
                                                    key={`cell-product-${index}`}
                                                    fill={barColor}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </Card>
        );
    }
);

ProductPlanVsActualChartCard.displayName = 'ProductPlanVsActualChartCard';
