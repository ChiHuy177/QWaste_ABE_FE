import React, { useMemo } from 'react';
import { Empty, theme } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { MachineStatusSummaryItem } from '@/types/Monitoring';
import { formatHours, getRuntimeLegend, useTooltipStyle } from './analyticsUtils';

interface RuntimeAnalyticsChartProps {
    summaryData: MachineStatusSummaryItem[];
    selectedIds: string[];
    onBarClick?: (machineId: string) => void;
}

export const RuntimeAnalyticsChart: React.FC<RuntimeAnalyticsChartProps> = ({
    summaryData,
    selectedIds,
    onBarClick,
}) => {
    const { token } = theme.useToken();
    const tooltipStyle = useTooltipStyle();
    const { t } = useTranslation();
    const runtimeLegend = useMemo(() => getRuntimeLegend(t, token), [t, token]);

    const chartData = useMemo(() => {
        const selectedIdSet = new Set(selectedIds);
        const selectedOrder = new Map(selectedIds.map((id, index) => [id, index]));
        const data = summaryData
            .filter((item) => selectedIdSet.has(item.machineId))
            .map((item) => ({
                machineId: item.machineId,
                label: item.machineName,
                runTime: item.totalRuntimeHours,
                stopTime: item.totalIdleHours,
                errorTime: item.totalErrorHours,
                offlineTime: item.totalOfflineHours,
            }));

        return data.sort((a, b) => {
            const aIndex = selectedOrder.get(a.machineId) ?? Number.MAX_SAFE_INTEGER;
            const bIndex = selectedOrder.get(b.machineId) ?? Number.MAX_SAFE_INTEGER;
            return aIndex - bIndex;
        });
    }, [summaryData, selectedIds]);

    if (chartData.length === 0) {
        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Empty description={t('common.noData')} />
            </div>
        );
    }

    const maxLabelLen = Math.max(...chartData.map((d) => d.label.length));
    const yAxisWidth = Math.min(Math.max(maxLabelLen * 7, 96), 168);
    const chartHeight = Math.max(chartData.length * 34, 280);
    const formatMachineLabel = (label: string) =>
        label.length > 22 ? `${label.slice(0, 21)}...` : label;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div
                style={{
                    display: 'flex',
                    gap: '6px 18px',
                    flexWrap: 'wrap',
                    flexShrink: 0,
                    marginBottom: 8,
                }}
            >
                {runtimeLegend.map((l) => (
                    <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                background: l.color,
                                flexShrink: 0,
                            }}
                        />
                        <span style={{ fontSize: 12, color: token.colorText }}>{l.name}</span>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 6, right: 24, left: 0, bottom: 8 }}
                        barCategoryGap={8}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke={token.colorBorderSecondary}
                        />
                        <XAxis
                            type="number"
                            tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickLine={false}
                            tickFormatter={(value: number) => formatHours(value)}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={yAxisWidth}
                            tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickLine={false}
                            tickFormatter={formatMachineLabel}
                        />
                        <Tooltip
                            {...tooltipStyle}
                            formatter={(value: number, name: string) => [
                                formatHours(value),
                                name,
                            ]}
                        />
                        {runtimeLegend.map((l, i) => (
                            <Bar
                                key={l.key}
                                dataKey={l.key}
                                name={l.name}
                                stackId="a"
                                fill={l.color}
                                legendType="none"
                                radius={
                                    i === runtimeLegend.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]
                                }
                                onClick={(data: any) => {
                                    if (onBarClick && data?.machineId) {
                                        onBarClick(data.machineId);
                                    } else if (onBarClick && data?.payload?.machineId) {
                                        onBarClick(data.payload.machineId);
                                    }
                                }}
                                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
