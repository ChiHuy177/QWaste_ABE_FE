'use client';

import { Card, Flex, Typography, Grid, theme } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DashboardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EmptyChart from './EmptyChart';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface MachineStatusData {
    running: number;
    idle: number;
    error: number;
    offline: number;
}

interface MachineStatusChartProps {
    data: MachineStatusData;
}

const STATUS_CONFIG = [
    { key: 'running', labelKey: 'adminPage.machineStatus.running', color: '#458A6D' },
    { key: 'idle', labelKey: 'adminPage.machineStatus.idle', color: '#C18644' },
    { key: 'error', labelKey: 'adminPage.machineStatus.error', color: '#C35256' },
    { key: 'offline', labelKey: 'adminPage.machineStatus.offline', color: '#8C8C8C' },
] as const;

export default function MachineStatusChart({ data }: MachineStatusChartProps) {
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const isMobile = !screens.md;

    const total = data.running + data.idle + data.error + data.offline;

    const chartData = STATUS_CONFIG.map((status) => ({
        name: t(status.labelKey),
        value: data[status.key],
        color: status.color,
    }));

    const outerRadius = isMobile ? 70 : 80;
    const innerRadius = isMobile ? 48 : 56;

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
            <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
                <DashboardOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                    {t('adminPage.machineStatus.title')}
                </Text>
            </Flex>

            {total === 0 ? (
                <EmptyChart message={t('adminPage.machineStatus.noData', 'Không có dữ liệu máy')} />
            ) : (
                <Flex align="center" justify="center" gap={isMobile ? 16 : 24} wrap="wrap">
                    {/* Donut chart */}
                    <div
                        style={{
                            position: 'relative',
                            width: outerRadius * 2,
                            height: outerRadius * 2,
                        }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius}
                                    paddingAngle={2}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: isMobile ? 22 : 28,
                                    fontWeight: 700,
                                    color: token.colorText,
                                    lineHeight: 1.1,
                                }}
                            >
                                {total}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: token.colorTextSecondary,
                                    fontWeight: 500,
                                }}
                            >
                                {t('adminPage.machineStatus.total')}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <Flex vertical gap={8}>
                        {STATUS_CONFIG.map((status) => (
                            <Flex key={status.key} align="center" gap={8}>
                                <div
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        backgroundColor: status.color,
                                        flexShrink: 0,
                                    }}
                                />
                                <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
                                    {t(status.labelKey)}:
                                </Text>
                                <Text strong style={{ fontSize: 14 }}>
                                    {data[status.key]}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            )}
        </Card>
    );
}
