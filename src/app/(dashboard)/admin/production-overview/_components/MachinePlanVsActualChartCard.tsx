'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Typography, theme, Empty, Select, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardMachineProductionResponse } from '@/types/Dashboard';
import { MachineOutputData } from '@/types/ProductionOverview';

const { Text } = Typography;

export interface NormalizedMachineProductionItem {
    machineId?: string;
    machineCode: string;
    machineName: string;
    planned: number;
    actual: number;
    rate: number;
    diff: number;
}

export type PlanVsActualFilterType =
    'top10_actual' | 'top10_low_actual' | 'top10_deficit' | 'top10_rate' | 'all';

interface MachinePlanVsActualChartCardProps {
    data: (DashboardMachineProductionResponse | MachineOutputData)[];
    subtitle?: string;
    onSelectMachine?: (machineCode: string, machineId?: string) => void;
}

export const MachinePlanVsActualChartCard: React.FC<MachinePlanVsActualChartCardProps> = React.memo(
    ({ data, subtitle, onSelectMachine }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();
        const [filterType, setFilterType] = useState<PlanVsActualFilterType>('top10_actual');

        // Normalize incoming data (handles both API response and mock data)
        const allNormalizedData = useMemo<NormalizedMachineProductionItem[]>(() => {
            if (!data || data.length === 0) return [];
            return data.map((item) => {
                let machineId: string | undefined;
                let machineCode = 'N/A';
                let machineName = 'N/A';
                let planned = 0;
                let actual = 0;

                if ('plannedQuantity' in item && 'actualQuantity' in item) {
                    machineId = item.machineId;
                    machineCode = item.machineCode || item.machineName || 'N/A';
                    machineName = item.machineName || item.machineCode || 'N/A';
                    planned = item.plannedQuantity ?? 0;
                    actual = item.actualQuantity ?? 0;
                } else {
                    // Mock data fallback
                    machineCode = item.machineCode;
                    machineName = item.machineCode;
                    planned = item.planned ?? 0;
                    actual = item.actual ?? 0;
                }

                const rate = planned > 0 ? (actual / planned) * 100 : 0;
                const diff = actual - planned;

                return {
                    machineId,
                    machineCode,
                    machineName,
                    planned,
                    actual,
                    rate: Number(rate.toFixed(1)),
                    diff,
                };
            });
        }, [data]);

        // Filter & sort data according to user selection
        const chartData = useMemo<NormalizedMachineProductionItem[]>(() => {
            if (allNormalizedData.length === 0) return [];
            const copy = [...allNormalizedData];

            switch (filterType) {
                case 'top10_actual':
                    return copy.sort((a, b) => b.actual - a.actual).slice(0, 10);
                case 'top10_low_actual':
                    return copy.sort((a, b) => a.actual - b.actual).slice(0, 10);
                case 'top10_deficit':
                    return copy
                        .filter((i) => i.diff < 0)
                        .sort((a, b) => a.diff - b.diff)
                        .slice(0, 10);
                case 'top10_rate':
                    return copy.sort((a, b) => b.rate - a.rate).slice(0, 10);
                case 'all':
                default:
                    return copy;
            }
        }, [allNormalizedData, filterType]);

        // Minimum width for scrollable view when displaying many machines
        const minChartWidth = useMemo(() => {
            if (chartData.length <= 10) return undefined;
            return Math.max(500, chartData.length * 60);
        }, [chartData.length]);

        // Filter options
        const filterOptions = [
            {
                value: 'top10_actual',
                label: t(
                    'productionOverview.charts.filterOptions.top10Output',
                    'Top 10 sản lượng cao'
                ),
            },
            {
                value: 'top10_low_actual',
                label: t(
                    'productionOverview.charts.filterOptions.top10LowOutput',
                    'Top 10 sản lượng thấp'
                ),
            },
            {
                value: 'top10_deficit',
                label: t(
                    'productionOverview.charts.filterOptions.top10Deficit',
                    'Top 10 chưa đạt KH'
                ),
            },
            {
                value: 'top10_rate',
                label: t(
                    'productionOverview.charts.filterOptions.top10Rate',
                    'Top 10 % hoàn thành KH'
                ),
            },
            {
                value: 'all',
                label: t('productionOverview.charts.filterOptions.all', 'Tất cả máy'),
            },
        ];

        // Handle clicking anywhere in the column space / category band
        const handleChartClick = useCallback(
            (state: any) => {
                if (!onSelectMachine || !state) return;

                // 1. Try activePayload (populated when clicking inside the column/band)
                if (state.activePayload && state.activePayload.length > 0) {
                    const rawItem = state.activePayload[0]
                        .payload as NormalizedMachineProductionItem;
                    if (rawItem && rawItem.machineCode) {
                        onSelectMachine(rawItem.machineCode, rawItem.machineId);
                        return;
                    }
                }

                // 2. Try activeTooltipIndex (index of the active column)
                if (
                    typeof state.activeTooltipIndex === 'number' &&
                    state.activeTooltipIndex >= 0 &&
                    state.activeTooltipIndex < chartData.length
                ) {
                    const rawItem = chartData[state.activeTooltipIndex];
                    if (rawItem && rawItem.machineCode) {
                        onSelectMachine(rawItem.machineCode, rawItem.machineId);
                        return;
                    }
                }
            },
            [chartData, onSelectMachine]
        );

        // Custom Tooltip
        const renderTooltip = (props: any) => {
            const { active, payload } = props;
            if (!active || !payload || !payload.length) return null;
            const rawItem = payload[0].payload as NormalizedMachineProductionItem;
            const isSurplus = rawItem.diff >= 0;

            return (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectMachine && rawItem.machineCode) {
                            onSelectMachine(rawItem.machineCode, rawItem.machineId);
                        }
                    }}
                    style={{
                        backgroundColor: token.colorBgElevated,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: token.borderRadiusLG,
                        padding: '8px 12px',
                        boxShadow: token.boxShadowSecondary,
                        minWidth: 180,
                        cursor: onSelectMachine ? 'pointer' : 'default',
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: token.colorText,
                            marginBottom: 2,
                        }}
                    >
                        {rawItem.machineName}
                    </div>
                    {rawItem.machineCode && rawItem.machineCode !== rawItem.machineName && (
                        <div
                            style={{
                                fontSize: 11,
                                color: token.colorTextDescription,
                                marginBottom: 6,
                            }}
                        >
                            {rawItem.machineCode}
                        </div>
                    )}

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 12,
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ color: token.colorTextSecondary }}>
                            {t('productionOverview.charts.planned')}:
                        </span>
                        <span style={{ fontWeight: 600, color: token.colorTextSecondary }}>
                            {rawItem.planned.toLocaleString()}{' '}
                            {t('productionOverview.charts.pieces')}
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 12,
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ color: token.colorTextSecondary }}>
                            {t('productionOverview.charts.actual')}:
                        </span>
                        <span style={{ fontWeight: 700, color: token.colorSuccess }}>
                            {rawItem.actual.toLocaleString()}{' '}
                            {t('productionOverview.charts.pieces')}
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 11,
                            paddingTop: 4,
                            borderTop: `1px dashed ${token.colorBorderSecondary}`,
                        }}
                    >
                        <span style={{ color: token.colorTextDescription }}>
                            {t('productionOverview.charts.completionRate', 'Tỷ lệ đạt')}:
                        </span>
                        <span
                            style={{
                                fontWeight: 700,
                                color:
                                    rawItem.rate >= 100
                                        ? token.colorSuccess
                                        : rawItem.rate >= 70
                                          ? token.colorWarning
                                          : token.colorError,
                            }}
                        >
                            {rawItem.rate}%
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 11,
                            marginTop: 2,
                        }}
                    >
                        <span style={{ color: token.colorTextDescription }}>
                            {isSurplus
                                ? t('productionOverview.charts.surplus', 'Vượt KH')
                                : t('productionOverview.charts.deficit', 'Chưa đạt')}
                            :
                        </span>
                        <span
                            style={{
                                fontWeight: 600,
                                color: isSurplus ? token.colorSuccess : token.colorError,
                            }}
                        >
                            {isSurplus
                                ? `+${rawItem.diff.toLocaleString()}`
                                : rawItem.diff.toLocaleString()}{' '}
                            {t('productionOverview.charts.pieces')}
                        </span>
                    </div>

                    {onSelectMachine && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectMachine(rawItem.machineCode, rawItem.machineId);
                            }}
                            style={{
                                marginTop: 6,
                                paddingTop: 6,
                                borderTop: `1px dashed ${token.colorBorderSecondary}`,
                                fontSize: 10,
                                color: token.colorPrimary,
                                textAlign: 'center',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            {t('productionOverview.machineDetail.selectMachine')} ➔
                        </div>
                    )}
                </div>
            );
        };

        // Custom Bar Shape for Planned Bar with minimum visible height
        const renderPlannedBar = (barProps: any) => {
            const { x, y, width, height, payload } = barProps;
            if (!payload) return null;

            const minH = 6;
            const barH = Math.max(height || 0, minH);
            const barY = (y || 0) + (height || 0) - barH;

            const handleClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (onSelectMachine && payload.machineCode) {
                    onSelectMachine(payload.machineCode, payload.machineId);
                }
            };

            return (
                <g
                    style={{ cursor: onSelectMachine ? 'pointer' : 'default' }}
                    onClick={handleClick}
                >
                    <rect
                        x={x}
                        y={barY}
                        width={width}
                        height={barH}
                        rx={3}
                        ry={3}
                        fill={token.colorTextQuaternary}
                        style={{
                            cursor: onSelectMachine ? 'pointer' : 'default',
                            pointerEvents: 'all',
                        }}
                    />
                </g>
            );
        };

        // Custom Bar Shape for Actual Bar with dedicated full-column clickable hit area
        const renderActualBar = (barProps: any) => {
            const { x, y, width, height, payload, background: bg } = barProps;
            if (!payload) return null;

            const isSuccess = payload.actual >= payload.planned;
            const barColor = isSuccess ? token.colorSuccess : token.colorWarning;

            // Full column hit area using background dimensions from Recharts or calculated bounds
            const hitX = bg?.x ?? x - (Math.max(width, 36) - width) / 2;
            const hitY = bg?.y ?? 10;
            const hitWidth = bg?.width ?? Math.max(width, 36);
            const hitHeight = bg?.height ?? Math.max((y ?? 0) + (height ?? 0) - hitY, 200);

            const minH = 6;
            const barH = Math.max(height || 0, minH);
            const barY = (y || 0) + (height || 0) - barH;

            const handleClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (onSelectMachine && payload.machineCode) {
                    onSelectMachine(payload.machineCode, payload.machineId);
                }
            };

            return (
                <g
                    style={{ cursor: onSelectMachine ? 'pointer' : 'default' }}
                    onClick={handleClick}
                >
                    {/* Full-height column hit area */}
                    <rect
                        x={hitX}
                        y={hitY}
                        width={hitWidth}
                        height={hitHeight}
                        fill="rgba(0, 0, 0, 0.001)"
                        style={{
                            cursor: onSelectMachine ? 'pointer' : 'default',
                            pointerEvents: 'all',
                        }}
                    />
                    {/* The visible colored bar */}
                    <rect
                        x={x}
                        y={barY}
                        width={width}
                        height={barH}
                        rx={3}
                        ry={3}
                        fill={barColor}
                        style={{
                            cursor: onSelectMachine ? 'pointer' : 'default',
                            pointerEvents: 'all',
                        }}
                    />
                </g>
            );
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
                {/* Unified 2-Row Header */}
                {/* Row 1: Title + Tag (Left) & Filter Dropdown (Right) */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                        gap: 8,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: 700, color: token.colorText }}>
                            {t('productionOverview.charts.planVsActualByMachine')}
                        </Text>
                        {allNormalizedData.length > 0 && (
                            <Tag
                                style={{
                                    borderRadius: 10,
                                    fontSize: 10,
                                    padding: '0 6px',
                                    margin: 0,
                                    backgroundColor: token.colorFillTertiary,
                                    borderColor: token.colorBorderSecondary,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {chartData.length}/{allNormalizedData.length}
                            </Tag>
                        )}
                    </div>

                    <Select
                        size="small"
                        value={filterType}
                        onChange={(val) => setFilterType(val)}
                        options={filterOptions}
                        popupMatchSelectWidth={false}
                        style={{ width: 165 }}
                    />
                </div>

                {/* Row 2: Subtitle (Left) & Series Legends (Right) */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        minHeight: 20,
                        gap: 8,
                    }}
                >
                    <div style={{ fontSize: 12, color: token.colorTextDescription }}>
                        {subtitle || t('productionOverview.charts.outputPcs')}
                    </div>

                    {/* Series Legend (Thực tế & Kế hoạch) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor: token.colorSuccess,
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('productionOverview.charts.actual', 'Thực tế')}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    backgroundColor: token.colorTextQuaternary,
                                }}
                            />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('productionOverview.charts.planned', 'Kế hoạch')}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Recharts Container / Empty State */}
                {chartData.length === 0 ? (
                    <div
                        style={{
                            width: '100%',
                            height: 260,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('productionOverview.charts.noData')}
                                </Text>
                            }
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            width: '100%',
                            overflowX: minChartWidth ? 'auto' : 'hidden',
                            paddingBottom: minChartWidth ? 6 : 0,
                        }}
                    >
                        <div style={{ width: '100%', minWidth: minChartWidth, height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                    onClick={handleChartClick}
                                    style={{ cursor: onSelectMachine ? 'pointer' : 'default' }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={token.colorBorderSecondary}
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="machineName"
                                        interval={0}
                                        angle={chartData.length > 5 ? -25 : 0}
                                        textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                                        height={chartData.length > 5 ? 52 : 30}
                                        tick={{ fill: token.colorTextSecondary, fontSize: 10.5 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        tickFormatter={(val) => {
                                            if (typeof val === 'string' && val.length > 15) {
                                                return `${val.substring(0, 13)}…`;
                                            }
                                            return val;
                                        }}
                                    />
                                    <YAxis
                                        tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
                                        tickFormatter={(val) =>
                                            val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
                                        }
                                    />
                                    <Tooltip
                                        content={renderTooltip}
                                        cursor={{
                                            fill: token.colorFillTertiary,
                                            opacity: 0.5,
                                            cursor: onSelectMachine ? 'pointer' : 'default',
                                        }}
                                        wrapperStyle={{
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <Bar
                                        dataKey="planned"
                                        name="planned"
                                        shape={renderPlannedBar}
                                        maxBarSize={20}
                                    />
                                    <Bar
                                        dataKey="actual"
                                        name="actual"
                                        shape={renderActualBar}
                                        maxBarSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </Card>
        );
    }
);

MachinePlanVsActualChartCard.displayName = 'MachinePlanVsActualChartCard';
