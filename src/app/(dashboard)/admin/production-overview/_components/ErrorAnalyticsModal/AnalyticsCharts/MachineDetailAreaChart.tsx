'use client';

import { getMockMachineStatusLogs } from '../mockErrorAnalyticsData';
import React, { useEffect, useState, useMemo } from 'react';
import { Empty, theme, Skeleton, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { MachineStatusSummaryItem, StatusLogSeries } from '@/types/Monitoring';
import { SpaceService } from '@/services/SpaceService';
import { formatHours, getRuntimeLegend, useTooltipStyle } from './analyticsUtils';

const { Text, Title } = Typography;

interface MachineDetailAreaChartProps {
    selectedRow: MachineStatusSummaryItem;
    filterId: number | null;
    startDate: string;
    endDate: string;
    isDateRange: boolean;
}

export const MachineDetailAreaChart: React.FC<MachineDetailAreaChartProps> = ({
    selectedRow,
    filterId,
    startDate,
    endDate,
    isDateRange,
}) => {
    const { token } = theme.useToken();
    const tooltipStyle = useTooltipStyle();
    const { t } = useTranslation();
    const runtimeLegend = useMemo(() => getRuntimeLegend(t, token), [t, token]);

    const [loading, setLoading] = useState(false);
    const [chartSeries, setChartSeries] = useState<StatusLogSeries[]>([]);

    useEffect(() => {
        const fetchStatusLogs = async () => {
            setLoading(true);
            try {
                let res;
                if (isDateRange) {
                    res = await (SpaceService as any).getMachineStatusLogChartByDateRange?.(
                        startDate,
                        endDate,
                        selectedRow.machineId,
                        filterId ?? undefined
                    );
                } else if (filterId) {
                    res = await (SpaceService as any).getMachineStatusLogChartByFilter?.(
                        filterId,
                        selectedRow.machineId
                    );
                }
                if (res?.series && res.series.length > 0) {
                    setChartSeries(res.series);
                } else {
                    setChartSeries(getMockMachineStatusLogs(selectedRow.machineId).series);
                }
            } catch (_error) {
                setChartSeries(getMockMachineStatusLogs(selectedRow.machineId).series);
            } finally {
                setLoading(false);
            }
        };

        fetchStatusLogs();
    }, [selectedRow.machineId, filterId, startDate, endDate, isDateRange]);

    const chartData = useMemo(() => {
        const labelsMap: Record<
            string,
            {
                label: string;
                runTime: number;
                stopTime: number;
                errorTime: number;
                offlineTime: number;
            }
        > = {};

        chartSeries.forEach((s) => {
            let key: 'runTime' | 'stopTime' | 'errorTime' | 'offlineTime' = 'offlineTime';
            if (s.status === 'RUNTIME') key = 'runTime';
            if (s.status === 'IDLE') key = 'stopTime';
            if (s.status === 'ERROR') key = 'errorTime';
            if (s.status === 'OFFLINE') key = 'offlineTime';

            s.data.forEach((pt) => {
                const label = pt.label;
                const val = pt.value ?? pt.hours ?? 0;
                if (!labelsMap[label]) {
                    labelsMap[label] = {
                        label,
                        runTime: 0,
                        stopTime: 0,
                        errorTime: 0,
                        offlineTime: 0,
                    };
                }
                labelsMap[label][key] = val;
            });
        });

        return Object.values(labelsMap).sort((a, b) => a.label.localeCompare(b.label));
    }, [chartSeries]);

    // Calculate percentage fallback for selectedRow if no chart data
    const fallbackStats = useMemo(() => {
        const total =
            selectedRow.totalRuntimeHours +
            selectedRow.totalIdleHours +
            selectedRow.totalErrorHours +
            selectedRow.totalOfflineHours;

        if (total === 0) return null;

        return {
            total,
            runTimePct: (selectedRow.totalRuntimeHours / total) * 100,
            stopTimePct: (selectedRow.totalIdleHours / total) * 100,
            errorTimePct: (selectedRow.totalErrorHours / total) * 100,
            offlineTimePct: (selectedRow.totalOfflineHours / total) * 100,
        };
    }, [selectedRow]);

    if (loading) {
        return (
            <div
                style={{
                    padding: '24px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    flex: 1,
                }}
            >
                <Skeleton.Input active block style={{ height: 32 }} />
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    // Fallback: If no series data or only one point, show a beautiful segmented progress bar
    if (chartData.length <= 1) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: 16,
                    padding: '16px 0',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Title level={5} style={{ margin: 0 }}>
                        {t('factoryOverview.chartDescriptions.statusDistribution') ||
                            'Phân phối trạng thái'}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {t('factoryOverview.chartDescriptions.totalMonitoredTime') ||
                            'Tổng thời gian theo dõi'}
                        : {fallbackStats ? formatHours(fallbackStats.total) : '—'}
                    </Text>
                </div>

                {/* Progress bar container */}
                <div
                    style={{
                        height: 32,
                        width: '100%',
                        borderRadius: token.borderRadiusLG,
                        display: 'flex',
                        overflow: 'hidden',
                        backgroundColor: token.colorFillSecondary,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                    }}
                >
                    {fallbackStats ? (
                        <>
                            {fallbackStats.runTimePct > 0 && (
                                <div
                                    style={{
                                        width: `${fallbackStats.runTimePct}%`,
                                        backgroundColor: token.colorSuccess,
                                        transition: 'width 0.3s ease',
                                    }}
                                    title={`${t('factoryOverview.stats.totalRunTime')}: ${formatHours(
                                        selectedRow.totalRuntimeHours
                                    )} (${fallbackStats.runTimePct.toFixed(1)}%)`}
                                />
                            )}
                            {fallbackStats.stopTimePct > 0 && (
                                <div
                                    style={{
                                        width: `${fallbackStats.stopTimePct}%`,
                                        backgroundColor: token.colorWarning,
                                        transition: 'width 0.3s ease',
                                    }}
                                    title={`${t('factoryOverview.stats.totalStopTime')}: ${formatHours(
                                        selectedRow.totalIdleHours
                                    )} (${fallbackStats.stopTimePct.toFixed(1)}%)`}
                                />
                            )}
                            {fallbackStats.errorTimePct > 0 && (
                                <div
                                    style={{
                                        width: `${fallbackStats.errorTimePct}%`,
                                        backgroundColor: token.colorError,
                                        transition: 'width 0.3s ease',
                                    }}
                                    title={`${t('factoryOverview.stats.totalErrorTime')}: ${formatHours(
                                        selectedRow.totalErrorHours
                                    )} (${fallbackStats.errorTimePct.toFixed(1)}%)`}
                                />
                            )}
                            {fallbackStats.offlineTimePct > 0 && (
                                <div
                                    style={{
                                        width: `${fallbackStats.offlineTimePct}%`,
                                        backgroundColor: token.colorTextSecondary,
                                        transition: 'width 0.3s ease',
                                    }}
                                    title={`${t('factoryOverview.stats.totalOfflineTime')}: ${formatHours(
                                        selectedRow.totalOfflineHours
                                    )} (${fallbackStats.offlineTimePct.toFixed(1)}%)`}
                                />
                            )}
                        </>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                            }}
                        >
                            <Text type="secondary">{t('common.noData') || 'Không có dữ liệu'}</Text>
                        </div>
                    )}
                </div>

                {/* Legend list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {runtimeLegend.map((item) => {
                        let pct = 0;
                        let val = 0;
                        if (fallbackStats) {
                            if (item.key === 'runTime') {
                                pct = fallbackStats.runTimePct;
                                val = selectedRow.totalRuntimeHours;
                            } else if (item.key === 'stopTime') {
                                pct = fallbackStats.stopTimePct;
                                val = selectedRow.totalIdleHours;
                            } else if (item.key === 'errorTime') {
                                pct = fallbackStats.errorTimePct;
                                val = selectedRow.totalErrorHours;
                            } else if (item.key === 'offlineTime') {
                                pct = fallbackStats.offlineTimePct;
                                val = selectedRow.totalOfflineHours;
                            }
                        }

                        return (
                            <div
                                key={item.key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    borderRadius: token.borderRadius,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorBgContainer,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 3,
                                            backgroundColor: item.color,
                                        }}
                                    />
                                    <Text>{item.name}</Text>
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <Text strong>{formatHours(val)}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        ({pct.toFixed(1)}%)
                                    </Text>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Header Legend */}
            <div
                style={{
                    display: 'flex',
                    gap: '6px 18px',
                    flexWrap: 'wrap',
                    flexShrink: 0,
                    marginBottom: 12,
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

            {/* Recharts Bar Chart */}
            <div style={{ flex: 1, minHeight: 280, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={token.colorBorderSecondary}
                        />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
                            stroke={token.colorBorderSecondary}
                        />
                        <YAxis
                            tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
                            stroke={token.colorBorderSecondary}
                            tickFormatter={(value: number) => formatHours(value)}
                        />
                        <Tooltip
                            {...tooltipStyle}
                            formatter={(value: any, name: any) => [formatHours(value), name]}
                        />
                        {runtimeLegend.map((l, index) => (
                            <Bar
                                key={l.key}
                                dataKey={l.key}
                                name={l.name}
                                stackId="a"
                                fill={l.color}
                                radius={
                                    index === runtimeLegend.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                                }
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
