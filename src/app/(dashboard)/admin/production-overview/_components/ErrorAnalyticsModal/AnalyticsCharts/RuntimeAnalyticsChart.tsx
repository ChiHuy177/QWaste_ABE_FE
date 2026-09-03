'use client';

import React, { useMemo } from 'react';
import { Empty, theme, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { MachineStatusSummaryItem } from '@/types/Monitoring';
import { formatHours, getRuntimeLegend, useTooltipStyle } from './analyticsUtils';

const { Text } = Typography;

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

    const totals = useMemo(() => {
        let totalRun = 0;
        let totalStop = 0;
        let totalError = 0;
        let totalOffline = 0;

        chartData.forEach((d) => {
            totalRun += d.runTime || 0;
            totalStop += d.stopTime || 0;
            totalError += d.errorTime || 0;
            totalOffline += d.offlineTime || 0;
        });

        const totalAll = totalRun + totalStop + totalError + totalOffline;
        const runPct = totalAll > 0 ? ((totalRun / totalAll) * 100).toFixed(1) : '0';
        const stopPct = totalAll > 0 ? ((totalStop / totalAll) * 100).toFixed(1) : '0';
        const errorPct = totalAll > 0 ? ((totalError / totalAll) * 100).toFixed(1) : '0';
        const offlinePct = totalAll > 0 ? ((totalOffline / totalAll) * 100).toFixed(1) : '0';

        return {
            totalRun,
            totalStop,
            totalError,
            totalOffline,
            totalAll,
            runPct,
            stopPct,
            errorPct,
            offlinePct,
        };
    }, [chartData]);

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
                <Empty description={t('common.noData') || 'Không có dữ liệu'} />
            </div>
        );
    }

    const maxLabelLen = Math.max(...chartData.map((d) => d.label.length), 0);
    const yAxisWidth = Math.min(Math.max(maxLabelLen * 7.2, 130), 220);
    const formatMachineLabel = (label: string) =>
        label.length > 28 ? `${label.slice(0, 27)}...` : label;

    // Expand chart comfortably across container when <= 12 machines, or scroll when more
    const isFewMachines = chartData.length <= 12;
    const chartHeight = isFewMachines ? '100%' : Math.max(chartData.length * 46, 450);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                height: '100%',
            }}
        >
            {/* Top Legend Bar */}
            <div
                style={{
                    display: 'flex',
                    gap: '6px 20px',
                    flexWrap: 'wrap',
                    flexShrink: 0,
                    marginBottom: 10,
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
                        <span style={{ fontSize: 12, fontWeight: 500, color: token.colorText }}>
                            {l.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chart Area - stretches to fill available space */}
            <div
                style={{
                    flex: 1,
                    minHeight: 280,
                    width: '100%',
                    overflowY: isFewMachines ? 'hidden' : 'auto',
                    overflowX: 'hidden',
                }}
            >
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
                        barCategoryGap={chartData.length <= 5 ? '28%' : '16%'}
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
                            tick={{ fill: token.colorText, fontSize: 12, fontWeight: 500 }}
                            axisLine={{ stroke: token.colorBorderSecondary }}
                            tickLine={false}
                            tickFormatter={formatMachineLabel}
                        />
                        <Tooltip
                            {...tooltipStyle}
                            formatter={(value: any, name: any) => [formatHours(value), name]}
                        />
                        {runtimeLegend.map((l, i) => (
                            <Bar
                                key={l.key}
                                dataKey={l.key}
                                name={l.name}
                                stackId="a"
                                fill={l.color}
                                legendType="none"
                                barSize={22}
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

            {/* Bottom Summary KPI Cards - eliminates empty whitespace and delivers executive overview */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    flexShrink: 0,
                }}
            >
                {/* 1. Run Time */}
                <div
                    style={{
                        padding: '10px 12px',
                        borderRadius: token.borderRadiusLG,
                        background: token.colorSuccessBg || 'rgba(61, 138, 107, 0.08)',
                        border: `1px solid ${token.colorSuccessBorder || 'rgba(61, 138, 107, 0.2)'}`,
                    }}
                >
                    <Text
                        style={{ fontSize: 11, color: token.colorTextSecondary, display: 'block' }}
                    >
                        {t('factoryOverview.stats.totalRunTime') || 'Thời gian chạy'}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                        <Text strong style={{ fontSize: 16, color: token.colorSuccess }}>
                            {formatHours(totals.totalRun)}
                        </Text>
                        <Text style={{ fontSize: 11, color: token.colorSuccess, fontWeight: 600 }}>
                            ({totals.runPct}%)
                        </Text>
                    </div>
                </div>

                {/* 2. Stop Time */}
                <div
                    style={{
                        padding: '10px 12px',
                        borderRadius: token.borderRadiusLG,
                        background: token.colorWarningBg || 'rgba(196, 136, 58, 0.08)',
                        border: `1px solid ${token.colorWarningBorder || 'rgba(196, 136, 58, 0.2)'}`,
                    }}
                >
                    <Text
                        style={{ fontSize: 11, color: token.colorTextSecondary, display: 'block' }}
                    >
                        {t('factoryOverview.stats.totalStopTime') || 'Thời gian dừng'}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                        <Text strong style={{ fontSize: 16, color: token.colorWarning }}>
                            {formatHours(totals.totalStop)}
                        </Text>
                        <Text style={{ fontSize: 11, color: token.colorWarning, fontWeight: 600 }}>
                            ({totals.stopPct}%)
                        </Text>
                    </div>
                </div>

                {/* 3. Error Time */}
                <div
                    style={{
                        padding: '10px 12px',
                        borderRadius: token.borderRadiusLG,
                        background: token.colorErrorBg || 'rgba(230, 80, 80, 0.08)',
                        border: `1px solid ${token.colorErrorBorder || 'rgba(230, 80, 80, 0.2)'}`,
                    }}
                >
                    <Text
                        style={{ fontSize: 11, color: token.colorTextSecondary, display: 'block' }}
                    >
                        {t('factoryOverview.stats.totalErrorTime') || 'Thời gian lỗi'}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                        <Text strong style={{ fontSize: 16, color: token.colorError }}>
                            {formatHours(totals.totalError)}
                        </Text>
                        <Text style={{ fontSize: 11, color: token.colorError, fontWeight: 600 }}>
                            ({totals.errorPct}%)
                        </Text>
                    </div>
                </div>

                {/* 4. Offline Time */}
                <div
                    style={{
                        padding: '10px 12px',
                        borderRadius: token.borderRadiusLG,
                        background: token.colorFillAlter,
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Text
                        style={{ fontSize: 11, color: token.colorTextSecondary, display: 'block' }}
                    >
                        {t('factoryOverview.stats.totalOfflineTime') || 'Ngoại tuyến'}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                        <Text strong style={{ fontSize: 16, color: token.colorTextSecondary }}>
                            {formatHours(totals.totalOffline)}
                        </Text>
                        <Text
                            style={{
                                fontSize: 11,
                                color: token.colorTextSecondary,
                                fontWeight: 600,
                            }}
                        >
                            ({totals.offlinePct}%)
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
};
