'use client';

import { useState, useMemo } from 'react';
import { Card, Flex, Typography, Select, theme, Space, Segmented } from 'antd';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ErrorCountChartResponse } from '@/types/Monitoring';
import EmptyChart from './EmptyChart';

const { Text } = Typography;

const MACHINE_COLORS = ['#1890FF', '#458A6D', '#C35256', '#C18644', '#722ED1', '#13C2C2'];

interface ErrorTimelineProps {
    data: ErrorCountChartResponse | null;
    loading?: boolean;
}

export default function ErrorTimeline({ data, loading }: ErrorTimelineProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
    const [chartType, setChartType] = useState<'stacked' | 'line'>('stacked');

    // Get all available machines
    const machineOptions = useMemo(() => {
        return (
            data?.series.map((machine) => ({
                label: machine.machineName,
                value: machine.machineId,
            })) || []
        );
    }, [data]);

    // Auto-select first 5 machines
    useMemo(() => {
        if (machineOptions.length > 0 && selectedMachines.length === 0) {
            setSelectedMachines(machineOptions.slice(0, 5).map((m) => m.value));
        }
    }, [machineOptions, selectedMachines.length]);

    // Transform data for recharts stacked bar
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
        return Array.from(allLabels)
            .sort()
            .map((label) => {
                const point: any = { time: label };
                selectedSeries.forEach((series) => {
                    const dataPoint = series.dataPoints.find((dp) => dp.label === label);
                    point[series.machineId] = dataPoint?.value || 0;
                });
                return point;
            });
    }, [data, selectedMachines]);

    // Check if all data is zero
    const hasData = useMemo(() => {
        return chartData.some((point) => {
            return selectedMachines.some((machineId) => point[machineId] > 0);
        });
    }, [chartData, selectedMachines]);

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
                    <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                    <Flex vertical>
                        <Text strong style={{ fontSize: 16 }}>
                            {t('adminPage.errorTimeline.title', 'Lịch Sử Lỗi Theo Thời Gian')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {t('adminPage.errorTimeline.subtitle', 'Số lượng lỗi')}
                        </Text>
                    </Flex>
                </Flex>

                <Space wrap>
                    <Segmented
                        size="small"
                        value={chartType}
                        onChange={(value) => setChartType(value as 'stacked' | 'line')}
                        options={[
                            {
                                label: 'Stacked',
                                value: 'stacked',
                                icon: <BarChartOutlined />,
                            },
                            {
                                label: 'Line',
                                value: 'line',
                                icon: <LineChartOutlined />,
                            },
                        ]}
                    />
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

            {chartData.length === 0 || !hasData ? (
                <EmptyChart message={t('adminPage.errorTimeline.noData', 'Không có dữ liệu lỗi')} />
            ) : (
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'stacked' ? (
                            <BarChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
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
                                label={{
                                    value: t('adminPage.errorTimeline.yAxis', 'Số lỗi'),
                                    angle: -90,
                                    position: 'insideLeft',
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: 8,
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />

                                {selectedMachines.map((machineId, index) => {
                                    const machine = data?.series.find((s) => s.machineId === machineId);
                                    return (
                                        <Bar
                                            key={machineId}
                                            dataKey={machineId}
                                            name={machine?.machineName || machineId}
                                            stackId="a"
                                            fill={MACHINE_COLORS[index % MACHINE_COLORS.length]}
                                            radius={
                                                index === selectedMachines.length - 1
                                                    ? [4, 4, 0, 0]
                                                    : undefined
                                            }
                                        />
                                    );
                                })}
                            </BarChart>
                        ) : (
                            <LineChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
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
                                    label={{
                                        value: t('adminPage.errorTimeline.yAxis', 'Số lỗi'),
                                        angle: -90,
                                        position: 'insideLeft',
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
                                />

                                {selectedMachines.map((machineId, index) => {
                                    const machine = data?.series.find((s) => s.machineId === machineId);
                                    return (
                                        <Line
                                            key={machineId}
                                            type="monotone"
                                            dataKey={machineId}
                                            name={machine?.machineName || machineId}
                                            stroke={MACHINE_COLORS[index % MACHINE_COLORS.length]}
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    );
                                })}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}
