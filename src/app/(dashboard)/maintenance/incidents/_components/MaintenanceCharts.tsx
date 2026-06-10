'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Col, Empty, Flex, Grid, Row, Segmented, Typography, theme } from 'antd';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    BarChartOutlined,
    ClockCircleOutlined,
    LineChartOutlined,
    PieChartOutlined,
} from '@ant-design/icons';
import type { IncidentReport } from '@/types/IncidentReport';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const PIE_COLORS = ['#1890FF', '#52C41A', '#FA8C16', '#F5222D', '#722ED1', '#13C2C2', '#EB2F96'];
const LINE_COLOR = '#074695';

// ── Error Group Donut ─────────────────────────────────────────────────────────

function ErrorGroupPie({ incidents }: { incidents: IncidentReport[] }) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const outerRadius = isMobile ? 70 : 80;
    const innerRadius = isMobile ? 48 : 56;

    const chartData = useMemo(() => {
        const groups = new Map<string, number>();
        incidents.forEach((r) => {
            const name = r.errorGroup.errorGroupName;
            groups.set(name, (groups.get(name) ?? 0) + 1);
        });
        return Array.from(groups.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [incidents]);

    const total = chartData.reduce((s, d) => s + d.value, 0);

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
            <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                <PieChartOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                    {t('maintenance.charts.byErrorGroup')}
                </Text>
            </Flex>

            {total === 0 ? (
                <Flex justify="center" align="center" style={{ height: 200 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">{t('maintenance.charts.noData')}</Text>}
                    />
                </Flex>
            ) : (
                <Flex align="center" justify="center" gap={isMobile ? 16 : 24} wrap="wrap">
                    {/* Donut */}
                    <div style={{
                        position: 'relative',
                        width: outerRadius * 2,
                        height: outerRadius * 2,
                        flexShrink: 0,
                    }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%" cy="50%"
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius}
                                    paddingAngle={2}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontSize: 12,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center', pointerEvents: 'none',
                        }}>
                            <div style={{
                                fontSize: isMobile ? 22 : 28,
                                fontWeight: 700,
                                color: token.colorText,
                                lineHeight: 1.1,
                            }}>
                                {total}
                            </div>
                            <div style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500 }}>
                                {t('maintenance.charts.total')}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <Flex vertical gap={6} style={{ maxWidth: 200 }}>
                        {chartData.map((d, i) => (
                            <Flex key={d.name} align="center" gap={8}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                                    flexShrink: 0,
                                }} />
                                <Text
                                    ellipsis
                                    style={{ fontSize: 13, color: token.colorTextSecondary, flex: 1 }}
                                >
                                    {d.name}:
                                </Text>
                                <Text strong style={{ fontSize: 13 }}>{d.value}</Text>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            )}
        </Card>
    );
}

// ── Incident Monthly Timeline ─────────────────────────────────────────────────

function IncidentTimeline({ incidents }: { incidents: IncidentReport[] }) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [chartType, setChartType] = useState<'stacked' | 'line'>('stacked');

    const chartData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - (5 - i));
            return {
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
            };
        });

        return months.map(({ year, month, label }) => ({
            time: label,
            total: incidents.filter((r) => {
                const d = new Date(r.reportedAt);
                return d.getFullYear() === year && d.getMonth() + 1 === month;
            }).length,
        }));
    }, [incidents]);

    const hasData = chartData.some((d) => d.total > 0);
    const totalLabel = t('maintenance.charts.total');

    const commonAxisProps = {
        cartesianGrid: (
            <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={token.colorFillSecondary}
            />
        ),
        xAxis: (
            <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                style={{ fontSize: 11, fontWeight: 500 }}
                dy={8}
            />
        ),
        yAxis: (
            <YAxis
                axisLine={false}
                tickLine={false}
                style={{ fontSize: 11 }}
                allowDecimals={false}
                label={{
                    value: t('maintenance.charts.incidents'),
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11 },
                }}
            />
        ),
        tooltip: (
            <Tooltip
                contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: 12,
                }}
            />
        ),
        legend: (
            <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            />
        ),
    };

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
                wrap="wrap"
                gap={12}
                style={{ marginBottom: 20 }}
            >
                <Flex align="center" gap={8}>
                    <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                    <Flex vertical>
                        <Text strong style={{ fontSize: 16 }}>
                            {t('maintenance.charts.overTime')}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {t('maintenance.charts.last6Months')}
                        </Text>
                    </Flex>
                </Flex>
                <Segmented
                    size="small"
                    value={chartType}
                    onChange={(v) => setChartType(v as 'stacked' | 'line')}
                    options={[
                        { label: 'Stacked', value: 'stacked', icon: <BarChartOutlined /> },
                        { label: 'Line',    value: 'line',    icon: <LineChartOutlined /> },
                    ]}
                />
            </Flex>

            {!hasData ? (
                <Flex justify="center" align="center" style={{ height: 260 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">{t('maintenance.charts.noData')}</Text>}
                    />
                </Flex>
            ) : (
                <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'stacked' ? (
                            <BarChart
                                data={chartData}
                                margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                            >
                                {commonAxisProps.cartesianGrid}
                                {commonAxisProps.xAxis}
                                {commonAxisProps.yAxis}
                                {commonAxisProps.tooltip}
                                {commonAxisProps.legend}
                                <Bar
                                    dataKey="total"
                                    name={totalLabel}
                                    stackId="a"
                                    fill={LINE_COLOR}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        ) : (
                            <LineChart
                                data={chartData}
                                margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                            >
                                {commonAxisProps.cartesianGrid}
                                {commonAxisProps.xAxis}
                                {commonAxisProps.yAxis}
                                {commonAxisProps.tooltip}
                                {commonAxisProps.legend}
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    name={totalLabel}
                                    stroke={LINE_COLOR}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface MaintenanceChartsProps {
    incidents: IncidentReport[];
}

export function MaintenanceCharts({ incidents }: MaintenanceChartsProps) {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
                <ErrorGroupPie incidents={incidents} />
            </Col>
            <Col xs={24} lg={14}>
                <IncidentTimeline incidents={incidents} />
            </Col>
        </Row>
    );
}
