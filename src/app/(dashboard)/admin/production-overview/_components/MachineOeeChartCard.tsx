'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Typography, theme, Empty, Select, Tag } from 'antd';
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
} from 'recharts';
import { DashboardMachineEfficiencyResponse } from '@/types/Dashboard';
import { MachineOeeData } from '@/types/ProductionOverview';

const { Text } = Typography;

export interface NormalizedMachineEfficiencyItem {
    machineId?: string;
    machineCode: string;
    machineName: string;
    efficiencyPercentage: number | null;
    displayValue: number;
}

export type OeeFilterType = 'top10_high' | 'top10_low' | 'target_met' | 'needs_improve' | 'all';

interface MachineOeeChartCardProps {
    data: (DashboardMachineEfficiencyResponse | MachineOeeData)[];
    subtitle?: string;
    onSelectMachine?: (machineCode: string, machineId?: string) => void;
}

export const MachineOeeChartCard: React.FC<MachineOeeChartCardProps> = React.memo(
    ({ data, subtitle, onSelectMachine }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();
        const [filterType, setFilterType] = useState<OeeFilterType>('top10_high');

        // Normalize incoming data (handles both API response and mock data)
        const allNormalizedData = useMemo<NormalizedMachineEfficiencyItem[]>(() => {
            if (!data || data.length === 0) return [];
            return data.map((item) => {
                if ('efficiencyPercentage' in item) {
                    const eff = item.efficiencyPercentage;
                    return {
                        machineId: item.machineId,
                        machineCode: item.machineCode || item.machineName || 'N/A',
                        machineName: item.machineName || item.machineCode || 'N/A',
                        efficiencyPercentage: eff,
                        displayValue: eff !== null ? Number(eff.toFixed(1)) : 0,
                    };
                }
                // Mock data fallback
                const mockOee = item.oee ?? null;
                return {
                    machineCode: item.machineCode,
                    machineName: item.machineCode,
                    efficiencyPercentage: mockOee,
                    displayValue: mockOee !== null ? Number(mockOee.toFixed(1)) : 0,
                };
            });
        }, [data]);

        // Filter & sort data according to user selection
        const chartData = useMemo<NormalizedMachineEfficiencyItem[]>(() => {
            if (allNormalizedData.length === 0) return [];
            const copy = [...allNormalizedData];

            switch (filterType) {
                case 'top10_high':
                    return copy.sort((a, b) => b.displayValue - a.displayValue).slice(0, 10);
                case 'top10_low':
                    return copy.sort((a, b) => a.displayValue - b.displayValue).slice(0, 10);
                case 'target_met':
                    return copy
                        .filter(
                            (i) => i.efficiencyPercentage !== null && i.efficiencyPercentage >= 85
                        )
                        .sort((a, b) => b.displayValue - a.displayValue);
                case 'needs_improve':
                    return copy
                        .filter(
                            (i) => i.efficiencyPercentage !== null && i.efficiencyPercentage < 70
                        )
                        .sort((a, b) => a.displayValue - b.displayValue);
                case 'all':
                default:
                    return copy;
            }
        }, [allNormalizedData, filterType]);

        // Minimum width for scrollable view when displaying many machines
        const minChartWidth = useMemo(() => {
            if (chartData.length <= 10) return undefined;
            return Math.max(500, chartData.length * 52);
        }, [chartData.length]);

        // Helper for threshold colors
        const getBarColor = (eff: number | null) => {
            if (eff === null) return token.colorFillSecondary;
            if (eff >= 85) return token.colorSuccess;
            if (eff >= 70) return token.colorWarning;
            return token.colorError;
        };

        // Filter options
        const filterOptions = [
            {
                value: 'top10_high',
                label: t(
                    'productionOverview.charts.filterOptions.top10High',
                    'Top 10 hiệu suất cao'
                ),
            },
            {
                value: 'top10_low',
                label: t(
                    'productionOverview.charts.filterOptions.top10Low',
                    'Top 10 hiệu suất thấp'
                ),
            },
            {
                value: 'target_met',
                label: t(
                    'productionOverview.charts.filterOptions.targetMet',
                    'Đạt mục tiêu (≥85%)'
                ),
            },
            {
                value: 'needs_improve',
                label: t(
                    'productionOverview.charts.filterOptions.needsImprove',
                    'Cần cải thiện (<70%)'
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
                        .payload as NormalizedMachineEfficiencyItem;
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
            const rawItem = payload[0].payload as NormalizedMachineEfficiencyItem;
            const eff = rawItem.efficiencyPercentage;
            const statusColor = getBarColor(eff);
            const statusText =
                eff === null
                    ? t('productionOverview.charts.notAvailable', 'N/A')
                    : eff >= 85
                      ? t(
                            'productionOverview.charts.filterOptions.targetMet',
                            'Đạt mục tiêu (≥85%)'
                        )
                      : eff >= 70
                        ? '70–84%'
                        : t(
                              'productionOverview.charts.filterOptions.needsImprove',
                              'Cần cải thiện (<70%)'
                          );

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
                        minWidth: 160,
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
                        }}
                    >
                        <span style={{ color: token.colorTextSecondary }}>
                            {t('productionOverview.charts.efficiency')}:
                        </span>
                        <span style={{ fontWeight: 700, color: statusColor }}>
                            {eff !== null
                                ? `${rawItem.displayValue}%`
                                : t('productionOverview.charts.notAvailable')}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            marginTop: 4,
                            fontSize: 11,
                        }}
                    >
                        <span style={{ color: token.colorTextDescription }}>
                            {t('productionOverview.charts.status', 'Trạng thái')}:
                        </span>
                        <Tag
                            color={
                                eff === null
                                    ? 'default'
                                    : eff >= 85
                                      ? 'success'
                                      : eff >= 70
                                        ? 'warning'
                                        : 'error'
                            }
                            style={{
                                margin: 0,
                                fontSize: 10,
                                lineHeight: '18px',
                                padding: '0 6px',
                                borderRadius: 10,
                            }}
                        >
                            {statusText}
                        </Tag>
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

        // Custom Bar Shape with dedicated full-column clickable hit area
        const renderCustomBar = (barProps: any) => {
            const { x, y, width, height, payload, background: bg } = barProps;
            if (!payload) return null;

            const eff = payload.efficiencyPercentage;
            const barColor = getBarColor(eff);

            // Full column hit area using background dimensions from Recharts or calculated bounds
            const hitX = bg?.x ?? x - (Math.max(width, 36) - width) / 2;
            const hitY = bg?.y ?? 10;
            const hitWidth = bg?.width ?? Math.max(width, 36);
            const hitHeight = bg?.height ?? Math.max((y ?? 0) + (height ?? 0) - hitY, 200);

            // Minimum visible height of 6px for very low values (e.g. 5.2% or 0%)
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
                    {/* 1. Full-height column hit area (transparent to eyes, but 100% solid to pointer clicks) */}
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
                    {/* 2. The visible colored bar */}
                    <rect
                        x={x}
                        y={barY}
                        width={width}
                        height={barH}
                        rx={4}
                        ry={4}
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
                            {t('productionOverview.charts.oeeByMachine')}
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

                {/* Row 2: Subtitle (Left) & Threshold Legends (Right) */}
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
                        {subtitle || ''}
                    </div>

                    {/* Threshold Legends */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
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
                                    margin={{ top: 10, right: 35, left: -20, bottom: 0 }}
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
                                        domain={[0, 100]}
                                        unit="%"
                                        tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                                        axisLine={{ stroke: token.colorBorderSecondary }}
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

                                    <Bar
                                        dataKey="displayValue"
                                        shape={renderCustomBar}
                                        maxBarSize={28}
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

MachineOeeChartCard.displayName = 'MachineOeeChartCard';
