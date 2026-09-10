'use client';

import React, { useMemo } from 'react';
import { Button, Col, Row, Select, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, LaptopOutlined } from '@ant-design/icons';
import {
    DashboardMachineProductionSeriesResponse,
    SingleMachinePerformanceResponse,
    SingleMachineKpiSummaryState,
} from '@/types/Dashboard';
import { KpiSummaryData } from '@/configs/mockData/productionOverviewMockData';
import { KpiCardsSection } from './KpiCardsSection';
import { MachineHourlyOutputChart } from './MachineHourlyOutputChart';
import { Machine7DaysEfficiencyChart } from './Machine7DaysEfficiencyChart';

const { Text, Title } = Typography;

export interface MachineListItem {
    machineId?: string;
    machineCode: string;
    machineName?: string;
}

interface MachineDetailViewProps {
    machineCode: string;
    machineId?: string | null;
    machineName?: string | null;
    machineList: MachineListItem[];
    productionSeries?: DashboardMachineProductionSeriesResponse | null;
    performanceSeries?: SingleMachinePerformanceResponse | null;
    singleMachineKpis?: SingleMachineKpiSummaryState | null;
    isLoadingSeries?: boolean;
    isLoadingPerformance?: boolean;
    isLoadingKpis?: boolean;
    subtitle?: string;
    onSelectMachine: (machineCode: string, machineId?: string) => void;
    onBack: () => void;
    onDowntimeClick?: () => void;
}

export const MachineDetailView: React.FC<MachineDetailViewProps> = ({
    machineCode,
    machineName,
    machineList,
    productionSeries,
    performanceSeries,
    singleMachineKpis,
    isLoadingSeries = false,
    isLoadingPerformance = false,
    isLoadingKpis = false,
    subtitle,
    onSelectMachine,
    onBack,
    onDowntimeClick,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    // Compute live KPI summary prioritizing dedicated single machine KPI endpoints
    const computedKpi = useMemo<KpiSummaryData>(() => {
        // Priority 1: Direct live KPI response from dedicated Single Machine endpoints
        if (
            singleMachineKpis &&
            (singleMachineKpis.efficiency ||
                singleMachineKpis.capacity ||
                singleMachineKpis.downtime ||
                singleMachineKpis.production ||
                singleMachineKpis.runtime)
        ) {
            const eff = singleMachineKpis.efficiency;
            const down = singleMachineKpis.downtime;
            const run = singleMachineKpis.runtime;
            const prod = singleMachineKpis.production;

            const oeeVal =
                eff?.efficiencyPercentage != null ? Number(eff.efficiencyPercentage.toFixed(1)) : 0;
            const yesterdayDiffVal =
                eff?.efficiencyDeltaPercentage != null
                    ? Number(eff.efficiencyDeltaPercentage.toFixed(1))
                    : 0;

            const totalDowntimeSec = down?.downtimeSeconds ?? 0;
            const downtimeMins = Math.round(totalDowntimeSec / 60);
            const downtimeHoursVal = Number((totalDowntimeSec / 3600).toFixed(1));

            const totalRuntimeSec = run?.runtimeSeconds ?? 0;
            const runtimeMins = Math.round(totalRuntimeSec / 60);
            const runtimeHoursVal = Number((totalRuntimeSec / 3600).toFixed(1));

            const actualQty = prod?.actualQuantity ?? 0;
            const plannedQty = prod?.plannedQuantity ?? 0;
            const yieldVal =
                prod?.productionRatioPercentage != null
                    ? Number(prod.productionRatioPercentage.toFixed(1))
                    : 0;

            const actualCap = runtimeHoursVal > 0 ? Math.round(actualQty / runtimeHoursVal) : 0;

            const cap = singleMachineKpis.capacity;
            const plannedWorkingSec = cap?.plannedWorkingSeconds ?? 0;
            const plannedWorkingHoursVal = Number((plannedWorkingSec / 3600).toFixed(1));
            const plannedCap =
                plannedWorkingHoursVal > 0 && plannedQty > 0
                    ? Math.round(plannedQty / plannedWorkingHoursVal)
                    : 0;
            const rateVsMax =
                plannedCap > 0 ? Math.min(100, Math.round((actualCap / plannedCap) * 100)) : 0;

            const statusTag =
                oeeVal >= 85
                    ? t('productionOverview.kpi.targetMet', 'Đạt mục tiêu (≥85%)')
                    : oeeVal >= 70
                      ? t('productionOverview.kpi.improveArea', 'Vùng cải thiện (70–84%)')
                      : t('productionOverview.kpi.needImprove', 'Cần cải thiện (<70%)');

            return {
                oee: {
                    current: oeeVal,
                    target: 85.0,
                    yesterdayDiff: yesterdayDiffVal,
                    statusTag,
                },
                maxCapacity: {
                    current: plannedCap,
                    unit: 'sp/h',
                    target: plannedCap,
                },
                downtimeMinutes: {
                    current: downtimeMins,
                    overTargetMinutes: 0,
                },
                downtimeHours: {
                    current: downtimeHoursVal,
                    overTargetHours: 0,
                },
                runtimeSeconds: totalRuntimeSec,
                runtimeMinutes: {
                    current: runtimeMins,
                },
                runtimeHours: {
                    current: runtimeHoursVal,
                },
                actualCapacity: {
                    current: actualCap,
                    unit: 'sp/h',
                    rateVsMax,
                },
                yieldRate: {
                    current: yieldVal,
                    targetText: t('productionOverview.kpi.vsPlan'),
                },
                actualProduction: {
                    current: actualQty,
                    target: plannedQty,
                    unit: t('productionOverview.machineDetail.pcs', 'sp'),
                },
            };
        }

        // Priority 2 (Fallback): Compute from performanceSeries buckets
        let totalPlannedWorkingSec = 0;
        let totalRuntimeSec = 0;
        let totalDowntimeSec = 0;
        let validEffSum = 0;
        let validEffCount = 0;

        if (performanceSeries?.buckets && performanceSeries.buckets.length > 0) {
            performanceSeries.buckets.forEach((b) => {
                totalPlannedWorkingSec += b.plannedWorkingSeconds || 0;
                totalRuntimeSec += b.runtimeSeconds || 0;
                totalDowntimeSec += b.downtimeSeconds || 0;
                if (b.efficiencyPercentage !== null && b.efficiencyPercentage !== undefined) {
                    validEffSum += b.efficiencyPercentage;
                    validEffCount += 1;
                }
            });
        }

        const downtimeMins = Math.round(totalDowntimeSec / 60);
        const downtimeHoursVal = Number((totalDowntimeSec / 3600).toFixed(1));
        const runtimeMins = Math.round(totalRuntimeSec / 60);
        const runtimeHoursVal = Number((totalRuntimeSec / 3600).toFixed(1));

        let oeeVal = 0;
        if (totalPlannedWorkingSec > 0) {
            oeeVal = Number(((totalRuntimeSec / totalPlannedWorkingSec) * 100).toFixed(1));
        } else if (validEffCount > 0) {
            oeeVal = Number((validEffSum / validEffCount).toFixed(1));
        }

        const statusTag =
            oeeVal >= 85
                ? t('productionOverview.kpi.targetMet', 'Đạt mục tiêu (≥85%)')
                : oeeVal >= 70
                  ? t('productionOverview.kpi.improveArea', 'Vùng cải thiện (70–84%)')
                  : t('productionOverview.kpi.needImprove', 'Cần cải thiện (<70%)');

        let totalPlannedQty = 0;
        let totalActualQty = 0;

        if (productionSeries?.buckets && productionSeries.buckets.length > 0) {
            productionSeries.buckets.forEach((b) => {
                if (b.plannedQuantity !== null && b.plannedQuantity !== undefined) {
                    totalPlannedQty += b.plannedQuantity;
                }
                totalActualQty += b.actualQuantity || 0;
            });
        }

        const yieldVal =
            totalPlannedQty > 0 ? Number(((totalActualQty / totalPlannedQty) * 100).toFixed(1)) : 0;

        const actualCap = runtimeHoursVal > 0 ? Math.round(totalActualQty / runtimeHoursVal) : 0;
        const plannedWorkingHoursVal = Number((totalPlannedWorkingSec / 3600).toFixed(1));
        const plannedCap =
            plannedWorkingHoursVal > 0 && totalPlannedQty > 0
                ? Math.round(totalPlannedQty / plannedWorkingHoursVal)
                : 0;
        const rateVsMax =
            plannedCap > 0 ? Math.min(100, Math.round((actualCap / plannedCap) * 100)) : 0;

        return {
            oee: {
                current: oeeVal,
                target: 85.0,
                yesterdayDiff: 0,
                statusTag,
            },
            maxCapacity: {
                current: plannedCap,
                unit: 'sp/h',
                target: plannedCap,
            },
            downtimeMinutes: {
                current: downtimeMins,
                overTargetMinutes: 0,
            },
            downtimeHours: {
                current: downtimeHoursVal,
                overTargetHours: 0,
            },
            runtimeSeconds: totalRuntimeSec,
            runtimeMinutes: {
                current: runtimeMins,
            },
            runtimeHours: {
                current: runtimeHoursVal,
            },
            actualCapacity: {
                current: actualCap,
                unit: 'sp/h',
                rateVsMax,
            },
            yieldRate: {
                current: yieldVal,
                targetText: t('productionOverview.kpi.vsPlan'),
            },
            actualProduction: {
                current: totalActualQty,
                target: totalPlannedQty,
                unit: t('productionOverview.machineDetail.pcs', 'sp'),
            },
        };
    }, [singleMachineKpis, performanceSeries, productionSeries, t]);

    // Active status from performance data or runtime
    const isRunning = useMemo(() => {
        if (singleMachineKpis?.runtime) {
            return (singleMachineKpis.runtime.runtimeSeconds ?? 0) > 0;
        }
        if (!performanceSeries?.buckets || performanceSeries.buckets.length === 0) {
            return false;
        }
        const lastBucket = performanceSeries.buckets[performanceSeries.buckets.length - 1];
        return (lastBucket?.runtimeSeconds ?? 0) > 0;
    }, [singleMachineKpis, performanceSeries]);

    const displayName = machineName && machineName !== machineCode ? machineName : null;

    return (
        <div>
            {/* Machine Header & Switcher Bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: token.borderRadiusLG,
                    backgroundColor: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    marginBottom: 16,
                }}
            >
                {/* Left: Back button + Machine Title & Status */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}
                        style={{ borderRadius: token.borderRadius }}
                    >
                        {t('productionOverview.machineDetail.backToOverview')}
                    </Button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                borderRadius: 8,
                                backgroundColor: token.colorPrimaryBg,
                                color: token.colorPrimary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                            }}
                        >
                            <LaptopOutlined />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    minWidth: 0,
                                }}
                            >
                                <Tooltip
                                    title={
                                        displayName
                                            ? `${machineCode} (${displayName})`
                                            : machineCode
                                    }
                                >
                                    <Title
                                        level={4}
                                        style={{
                                            margin: 0,
                                            fontWeight: 800,
                                            maxWidth: 280,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {machineCode}
                                    </Title>
                                </Tooltip>
                                {displayName && (
                                    <Tooltip title={displayName}>
                                        <Tag
                                            color="blue"
                                            style={{
                                                borderRadius: 6,
                                                margin: 0,
                                                fontSize: 11,
                                                maxWidth: 140,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {displayName}
                                        </Tag>
                                    </Tooltip>
                                )}
                                <Tag
                                    color={isRunning ? 'success' : 'error'}
                                    style={{
                                        borderRadius: 6,
                                        margin: 0,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}
                                >
                                    ●{' '}
                                    {isRunning
                                        ? t('productionOverview.machineDetail.statusRunning')
                                        : t('productionOverview.machineDetail.statusStopped')}
                                </Tag>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Fast Machine Switcher Dropdown (compact fixed width) */}
                <Space size={8} align="center" style={{ flexShrink: 0 }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                        {t('productionOverview.machineDetail.selectMachine')}:
                    </Text>
                    <Select
                        value={machineCode}
                        onChange={(code) => {
                            const found = machineList.find((m) => m.machineCode === code);
                            onSelectMachine(code, found?.machineId);
                        }}
                        style={{ width: 220, borderRadius: token.borderRadius }}
                        popupMatchSelectWidth={false}
                        dropdownStyle={{ minWidth: 260, maxWidth: 420 }}
                        options={machineList.map((m) => {
                            const labelText = m.machineCode || m.machineName || 'N/A';
                            return {
                                label: (
                                    <Tooltip title={labelText} placement="left">
                                        <span
                                            style={{
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {labelText}
                                        </span>
                                    </Tooltip>
                                ),
                                value: m.machineCode,
                            };
                        })}
                    />
                </Space>
            </div>

            {/* 4 KPI Cards for this machine (computed dynamically from live data) */}
            <KpiCardsSection
                data={computedKpi}
                isMachineView={true}
                machineCode={machineCode}
                onDowntimeClick={onDowntimeClick}
            />

            {/* Charts Section: Timeline Output & Performance Operating Hours / Efficiency */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <MachineHourlyOutputChart
                        machineCode={machineCode}
                        seriesData={productionSeries}
                        isLoading={isLoadingSeries}
                        subtitle={subtitle}
                    />
                </Col>
                <Col xs={24} lg={12}>
                    <Machine7DaysEfficiencyChart
                        machineCode={machineCode}
                        performanceData={performanceSeries}
                        isLoading={isLoadingPerformance}
                        subtitle={subtitle}
                    />
                </Col>
            </Row>
        </div>
    );
};
