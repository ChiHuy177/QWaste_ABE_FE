'use client';

import { useState, useMemo } from 'react';
import { Card, Flex, Typography, Select, theme, Space } from 'antd';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MttrChartResponse } from '@/types/Monitoring';
import EmptyChart from './EmptyChart';

const { Text } = Typography;

const MACHINE_COLORS = ['#1890FF', '#458A6D', '#C35256', '#C18644', '#722ED1', '#13C2C2'];

interface AverageErrorTimeTrendProps {
    data: MttrChartResponse | null;
    loading?: boolean;
}

export default function AverageErrorTimeTrend({ data, loading }: AverageErrorTimeTrendProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const [selectedMachines, setSelectedMachines] = useState<string[]>([]);

    // Get all available machines
    const machineOptions = useMemo(() => {
        return (
            data?.series.map((machine) => ({
                label: machine.machineName,
                value: machine.machineId,
            })) || []
        );
    }, [data]);

    // Auto-select first 3 machines
    useMemo(() => {
        if (machineOptions.length > 0 && selectedMachines.length === 0) {
            setSelectedMachines(machineOptions.slice(0, 3).map((m) => m.value));
        }
    }, [machineOptions, selectedMachines.length]);

    // Transform data for recharts
    const chartData = useMemo(() => {
        if (!data) return [];

        const selectedSeries = data.series.filter((s) => selectedMachines.includes(s.machineId));
        if (selectedSeries.length === 0) return [];

        // Get all unique labels
        const allLabels = new Set<string>();
        selectedSeries.forEach((series) => {
            series.dataPoints.forEach((dp) => allLabels.add(dp.label));
        });

        // Create chart data points
        return Array.from(allLabels).map((label) => {
            const point: any = { time: label };
            selectedSeries.forEach((series) => {
                const dataPoint = series.dataPoints.find((dp) => dp.label === label);
                point[series.machineId] = dataPoint?.value || 0;
            });
            return point;
        });
    }, [data, selectedMachines]);

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                border: '1px solid rgba(0, 64, 156, 0.1)',
                height: '100%',
            }}
        >
            <Flex
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap={12}
                style={{ marginBottom: 24 }}
            >
                <Flex align="center" gap={8}>
                    <HistoryOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                    <Flex vertical>
                        <Text strong style={{ fontSize: 16 }}>
                            {t('adminPage.mttrTrend.title', 'Thời Gian Sửa Lỗi Trung Bình')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            MTTR (Giờ)
                        </Text>
                    </Flex>
                </Flex>

                <Space wrap>
                    <Select
                        mode="multiple"
                        size="small"
                        placeholder={t('common.placeholder.selectMachines', 'Chọn máy')}
                        value={selectedMachines}
                        onChange={setSelectedMachines}
                        maxTagCount="responsive"
                        options={machineOptions}
                        style={{ minWidth: 180 }}
                    />
                </Space>
            </Flex>

            {chartData.length === 0 ? (
                <EmptyChart message={t('adminPage.mttrTrend.noData', 'Không có dữ liệu')} />
            ) : (
                <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                        <defs>
                            {selectedMachines.map((machineId, index) => (
                                <linearGradient
                                    key={machineId}
                                    id={`color-${machineId}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={MACHINE_COLORS[index % MACHINE_COLORS.length]}
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={MACHINE_COLORS[index % MACHINE_COLORS.length]}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={token.colorFillSecondary}
                        />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: 11, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: 11 }}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 8,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                            formatter={(value: number) => `${value.toFixed(2)}h`}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />

                        {selectedMachines.map((machineId, index) => {
                            const machine = data?.series.find((s) => s.machineId === machineId);
                            return (
                                <Area
                                    key={machineId}
                                    type="monotone"
                                    dataKey={machineId}
                                    name={machine?.machineName || machineId}
                                    stroke={MACHINE_COLORS[index % MACHINE_COLORS.length]}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#color-${machineId})`}
                                    animationDuration={1000}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            )}
        </Card>
    );
}
