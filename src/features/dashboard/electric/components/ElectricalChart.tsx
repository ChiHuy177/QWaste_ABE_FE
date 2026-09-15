'use client';
import { theme } from 'antd';
import React, { useState } from 'react';
import { Card, Flex, Typography, Grid, Button, Space } from 'antd';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Brush,
} from 'recharts';
import { EnergyConsumption } from '@/types';
import { useTranslation } from 'react-i18next';
import { DAY_ODER, MONTH_ORDER } from '@/types/DateTime';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface ElectricalChartProps {
    zones: EnergyConsumption[];
}

const ElectricalChart: React.FC<ElectricalChartProps> = ({ zones }) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { token } = theme.useToken();

    // State for zoom
    const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
    const [brushIndexes, setBrushIndexes] = useState<{
        startIndex: number;
        endIndex: number;
    } | null>(null);

    // Transform data for chart
    const chartData = React.useMemo(() => {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentWeek = Math.ceil(now.getDate() / 7);

        if (zones.length === 0) return [];

        const allLabels = new Set<string>();
        zones.forEach((zone) => {
            zone.filterConsumptionResult.dateConsumption.forEach((point) => {
                allLabels.add(point.label);
            });
        });

        // Filter labels based on current time
        const filteredLabels = Array.from(allLabels).filter((label) => {
            // Hour-based (00:00, 00:30...)
            if (label.includes(':')) {
                const [hour, minute] = label.split(':').map(Number);
                if (hour < currentHour) return true;
                if (hour === currentHour && minute <= currentMinute) return true;
                return false;
            }

            // Day-based (Monday, Tuesday...)
            if (DAY_ODER.includes(label)) {
                return DAY_ODER.indexOf(label) <= DAY_ODER.indexOf(currentDay);
            }

            // Week-based (Week 1, Week 2...)
            if (label.startsWith('Week ')) {
                const weekNumber = parseInt(label.replace('Week ', ''));
                return weekNumber <= currentWeek;
            }

            // Month-based (January, February...)
            if (MONTH_ORDER.includes(label)) {
                return MONTH_ORDER.indexOf(label) <= MONTH_ORDER.indexOf(currentMonth);
            }

            return true;
        });

        const data = filteredLabels.map((label) => {
            const dataPoint: Record<string, string | number> = { label };
            zones.forEach((zone) => {
                const consumption = zone.filterConsumptionResult.dateConsumption.find(
                    (point) => point.label === label
                );
                dataPoint[zone.entityName] = consumption?.totalConsumption || 0;
            });
            return dataPoint;
        });

        return data;
    }, [zones]);

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa'];

    const handleZoomIn = () => {
        if (!brushIndexes) {
            // First zoom: zoom to middle 50%
            const startIndex = Math.floor(chartData.length * 0.25);
            const endIndex = Math.floor(chartData.length * 0.75);
            setBrushIndexes({ startIndex, endIndex });
        } else {
            // Subsequent zooms: zoom in by 25%
            const range = brushIndexes.endIndex - brushIndexes.startIndex;
            const newRange = Math.max(Math.floor(range * 0.75), 2);
            const center = Math.floor((brushIndexes.startIndex + brushIndexes.endIndex) / 2);
            const startIndex = Math.max(0, center - Math.floor(newRange / 2));
            const endIndex = Math.min(chartData.length - 1, startIndex + newRange);
            setBrushIndexes({ startIndex, endIndex });
        }
    };

    const handleZoomOut = () => {
        if (!brushIndexes) return;

        const range = brushIndexes.endIndex - brushIndexes.startIndex;
        const newRange = Math.min(Math.floor(range * 1.5), chartData.length);
        const center = Math.floor((brushIndexes.startIndex + brushIndexes.endIndex) / 2);
        const startIndex = Math.max(0, center - Math.floor(newRange / 2));
        const endIndex = Math.min(chartData.length - 1, startIndex + newRange);

        if (endIndex - startIndex >= chartData.length - 1) {
            setBrushIndexes(null);
        } else {
            setBrushIndexes({ startIndex, endIndex });
        }
    };

    const handleResetZoom = () => {
        setBrushIndexes(null);
        setZoomDomain(null);
    };

    const handleBrushChange = (brushArea: { startIndex?: number; endIndex?: number }) => {
        if (brushArea && brushArea.startIndex !== undefined && brushArea.endIndex !== undefined) {
            setBrushIndexes({
                startIndex: brushArea.startIndex,
                endIndex: brushArea.endIndex,
            });
        }
    };

    if (zones.length === 0) {
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
                <Text type="secondary">{t('electricManagement.noData')}</Text>
            </Card>
        );
    }

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
                align="center"
                style={{ marginBottom: 24 }}
                wrap="wrap"
                gap={12}
            >
                <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                    {t('electricManagement.electricalChart')}
                </Text>
                <Space>
                    <Button
                        size={isMobile ? 'small' : 'middle'}
                        onClick={handleZoomIn}
                        disabled={brushIndexes?.endIndex === brushIndexes?.startIndex}
                    >
                        Zoom In
                    </Button>
                    <Button
                        size={isMobile ? 'small' : 'middle'}
                        onClick={handleZoomOut}
                        disabled={!brushIndexes}
                    >
                        Zoom Out
                    </Button>
                    <Button
                        size={isMobile ? 'small' : 'middle'}
                        onClick={handleResetZoom}
                        disabled={!brushIndexes}
                    >
                        Reset
                    </Button>
                </Space>
            </Flex>

            <ResponsiveContainer width="100%" height={isMobile ? 350 : 450}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 64, 156, 0.1)" />
                    <XAxis
                        dataKey="label"
                        style={{
                            fontSize: isMobile ? 10 : 12,
                            fill: token.colorTextSecondary,
                        }}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 60 : 30}
                        stroke={token.colorBorder}
                        tick={{ fill: token.colorText }}
                    />
                    <YAxis
                        label={{
                            value: 'kW',
                            angle: -90,
                            position: 'insideLeft',
                            style: {
                                fontSize: 12,
                                fill: token.colorTextSecondary,
                            },
                        }}
                        style={{
                            fontSize: isMobile ? 10 : 12,
                        }}
                        stroke={token.colorBorder}
                        tick={{ fill: token.colorText }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: `1px solid ${token.colorBorder}`,
                            borderRadius: 8,
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} iconType="line" />
                    {zones.map((zone, index) => (
                        <Line
                            key={zone.entityId}
                            type="monotone"
                            dataKey={zone.entityName}
                            stroke={colors[index % colors.length]}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: isMobile ? 5 : 7, strokeWidth: 0 }}
                        />
                    ))}
                    {/* Brush for zoom functionality */}
                    <Brush
                        dataKey="label"
                        height={30}
                        stroke={token.colorPrimary}
                        fill="rgba(0, 64, 156, 0.05)"
                        onChange={handleBrushChange}
                        startIndex={brushIndexes?.startIndex}
                        endIndex={brushIndexes?.endIndex}
                        travellerWidth={10}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default ElectricalChart;
