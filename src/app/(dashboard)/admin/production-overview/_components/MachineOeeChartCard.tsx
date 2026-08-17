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
import { MachineOeeData } from '@/configs/mockData/productionOverviewMockData';

const { Text } = Typography;

interface MachineOeeChartCardProps {
    data: MachineOeeData[];
    onSelectMachine?: (machineCode: string) => void;
}

export const MachineOeeChartCard: React.FC<MachineOeeChartCardProps> = ({
    data,
    onSelectMachine,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    // Helper for threshold colors
    const getBarColor = (oee: number) => {
        if (oee >= 85) return token.colorSuccess;
        if (oee >= 70) return token.colorWarning;
        return token.colorError;
    };

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
            {/* Title & Legend Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <div>
                    <Text style={{ fontSize: 14, fontWeight: 700, color: token.colorText }}>
                        {t('productionOverview.charts.oeeByMachine')}
                    </Text>
                    <div style={{ fontSize: 12, color: token.colorTextDescription }}>
                        {t('productionOverview.filters.dayShift')} 17/08/2026
                    </div>
                </div>

                {/* Threshold Legends */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
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
                            dataKey="machineCode"
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
                            formatter={(value: any) => [
                                `${value ?? 0}%`,
                                t('productionOverview.machineDetail.efficiency'),
                            ]}
                        />

                        {/* Reference lines for 85% and 70% */}
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

                        <Bar dataKey="oee" radius={[4, 4, 0, 0]} maxBarSize={28}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={getBarColor(entry.oee)}
                                    style={{ cursor: onSelectMachine ? 'pointer' : 'default' }}
                                    onClick={() => onSelectMachine?.(entry.machineCode)}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
