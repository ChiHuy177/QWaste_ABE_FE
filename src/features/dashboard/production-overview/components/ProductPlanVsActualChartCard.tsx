'use client';

import React, { useMemo } from 'react';
import { Card, Typography, theme, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardItemProductionResponse } from '@/types/Dashboard';
import { ProductOutputData } from '@/types/ProductionOverview';

const { Text } = Typography;

export interface NormalizedItemProductionItem {
    moldName: string;
    moldCode?: string;
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
            return data.map((item: any) => {
                if ('productionPlanCode' in item) {
                    const moldName =
                        item.moldName ||
                        item.snapshotMoldName ||
                        item.productionPlanName ||
                        item.productName ||
                        item.productionPlanCode;

                    const moldCode =
                        item.moldCode || item.snapshotMoldCode || item.productionPlanCode;

                    return {
                        moldName,
                        moldCode,
                        productCode: item.productionPlanCode,
                        productName: item.productionPlanName || item.productionPlanCode,
                        planned: item.plannedQuantity ?? 0,
                        actual: item.actualQuantity ?? 0,
                    };
                }
                // Mock data fallback
                const fallbackMoldName =
                    item.moldName || item.snapshotMoldName || item.productName || item.productCode;

                const fallbackMoldCode = item.moldCode || item.snapshotMoldCode || item.productCode;

                return {
                    moldCode: fallbackMoldCode,
                    moldName: fallbackMoldName,
                    productCode: item.productCode,
                    productName: item.productName || item.productCode,
                    planned: item.planned ?? 0,
                    actual: item.actual ?? 0,
                };
            });
        }, [data]);

        // Calculate minimum container width for smooth horizontal scrolling if many items
        const minChartWidth = useMemo(() => {
            if (chartData.length <= 8) return undefined;
            const itemWidth = 75;
            return Math.max(650, chartData.length * itemWidth);
        }, [chartData.length]);

        const hasRotatedLabels = chartData.length > 5;

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
                {/* Header with Title (Left) & Series Legend (Right) */}
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
                            {t(
                                'productionOverview.charts.planVsActualByMold',
                                'Sản lượng Kế hoạch vs Thực tế theo khuôn'
                            )}
                        </Text>
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorTextDescription,
                                marginTop: 2,
                            }}
                        >
                            {subtitle ||
                                t(
                                    'productionOverview.charts.planVsActualMoldDesc',
                                    'So sánh kế hoạch và thực tế theo từng khuôn'
                                )}
                        </div>
                    </div>

                    {/* Series Legend (Kế hoạch & Thực tế) cố định ở góc trên bên phải */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor: token.colorTextQuaternary,
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('productionOverview.charts.planned', 'Kế hoạch')}
                            </Text>
                        </div>
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
                                {t('productionOverview.charts.actual', 'Thực tế')}
                            </Text>
                        </div>
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
                    <div
                        style={{
                            width: '100%',
                            overflowX: minChartWidth ? 'auto' : 'hidden',
                            paddingBottom: minChartWidth ? 6 : 0,
                        }}
                    >
                        <div style={{ width: '100%', minWidth: minChartWidth, height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: -10,
                                        bottom: hasRotatedLabels ? 10 : 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={token.colorBorderSecondary}
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="moldName"
                                        interval={0}
                                        angle={hasRotatedLabels ? -35 : 0}
                                        textAnchor={hasRotatedLabels ? 'end' : 'middle'}
                                        height={hasRotatedLabels ? 65 : 30}
                                        tick={{ fill: token.colorTextSecondary, fontSize: 10.5 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        tickFormatter={(val) => {
                                            if (typeof val === 'string' && val.length > 15) {
                                                return `${val.substring(0, 13)}…`;
                                            }
                                            return val;
                                        }}
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
                                            if (rawItem) {
                                                const code =
                                                    rawItem.moldCode || rawItem.productCode;
                                                if (code && code !== rawItem.moldName) {
                                                    return `${rawItem.moldName} (${code})`;
                                                }
                                                return rawItem.moldName;
                                            }
                                            return label;
                                        }}
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
                                        fill={token.colorSuccess}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={22}
                                    />
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
