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
import {
    OutputTimelinePoint,
    TimelineGranularity,
} from '@/configs/mockData/productionOverviewMockData';

const { Text } = Typography;

interface MachineHourlyOutputChartProps {
    machineCode: string;
    data: OutputTimelinePoint[];
    granularity?: TimelineGranularity;
    hasPlanLine?: boolean;
}

export const MachineHourlyOutputChart: React.FC<MachineHourlyOutputChartProps> = ({
    machineCode,
    data,
    granularity = 'DAY',
    hasPlanLine = true,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    // Stoppage note marker if present
    const stoppagePoint = data.find((p) => p.stoppageNote);

    // Title, Subtitle and Unit Label based on granularity
    const { title, subtitle, unitLabel } = React.useMemo(() => {
        switch (granularity) {
            case 'MONTH':
                return {
                    title: t('productionOverview.machineDetail.monthlyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.machineDetail.monthlyOutputDesc')} (${t('productionOverview.machineDetail.pcsPerMonth')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerMonth'),
                };
            case 'WEEK':
                return {
                    title: t('productionOverview.machineDetail.weeklyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.machineDetail.weeklyOutputDesc')} (${t('productionOverview.machineDetail.pcsPerWeek')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerWeek'),
                };
            case 'DAY':
                return {
                    title: t('productionOverview.machineDetail.dailyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.machineDetail.dailyOutputDesc')} (${t('productionOverview.machineDetail.pcsPerDay')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerDay'),
                };
            case 'HOUR':
            default:
                return {
                    title: t('productionOverview.machineDetail.hourlyOutput'),
                    subtitle: `${machineCode} – ${t('productionOverview.filters.dayShift')} 17/08/2026 – ${t('productionOverview.machineDetail.actualOutput')} (${t('productionOverview.machineDetail.pcsPerHour')})`,
                    unitLabel: t('productionOverview.machineDetail.pcsPerHour'),
                };
        }
    }, [granularity, machineCode, t]);

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
            <div style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorText }}>
                    {title}
                </Text>
                <div style={{ fontSize: 12, color: token.colorTextDescription }}>{subtitle}</div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={token.colorBorderSecondary}
                            opacity={0.5}
                        />
                        <XAxis
                            dataKey="label"
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
                                `${(value ?? 0).toLocaleString()} ${unitLabel}`,
                                name === 'planned'
                                    ? t('productionOverview.machineDetail.plannedOutput')
                                    : t('productionOverview.machineDetail.actualOutput'),
                            ]}
                        />

                        {hasPlanLine && (
                            <Legend
                                wrapperStyle={{ paddingTop: 6, fontSize: 11 }}
                                formatter={(value: string) =>
                                    value === 'planned'
                                        ? t('productionOverview.machineDetail.plannedOutput')
                                        : t('productionOverview.machineDetail.actualOutput')
                                }
                            />
                        )}

                        {/* Planned Bar: Rendered when hasPlanLine is true */}
                        {hasPlanLine && (
                            <Bar
                                dataKey="planned"
                                name="planned"
                                fill={token.colorTextQuaternary}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={24}
                            />
                        )}

                        {/* Actual Bar: Always rendered */}
                        <Bar
                            dataKey="actual"
                            name="actual"
                            fill={token.colorSuccess}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={hasPlanLine ? 24 : 36}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.stoppageNote ? token.colorError : token.colorSuccess
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Stoppage Alert Banner if present */}
            {stoppagePoint?.stoppageNote && (
                <div
                    style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        borderRadius: token.borderRadius,
                        backgroundColor: token.colorErrorBg,
                        border: `1px solid ${token.colorErrorBorder}`,
                        fontSize: 12,
                        color: token.colorErrorText,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span style={{ fontSize: 14 }}>●</span>
                    <span>{stoppagePoint.stoppageNote}</span>
                </div>
            )}
        </Card>
    );
};
