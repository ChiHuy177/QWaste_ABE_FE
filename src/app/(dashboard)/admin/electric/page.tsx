'use client';

import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    ElectricStatsCards,
    type ElectricStats,
    ElectricFilters,
    ZoneConsumptionCards,
    ElectricalChart,
    TopZoneConsumption,
} from '@/features/dashboard/electric';
import { EnergyConsumption, TimePeriod, Zone } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ElectricService } from '@/services';
import { Row, Col, Skeleton, Card, Flex, Typography, theme } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { calculateElectricityBill } from '@/utils';
import { useEnergyWebSocket } from '@/hooks/useWebSocket';
import { t } from 'i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import EmptyState from '@/components/shared/EmptyState';

const { Text } = Typography;

const initialElectricStats: ElectricStats = {
    totalComsumption: 0,
    totalCost: 0,
    totalIdleTime: 0,
    totalParts: 0,
};

const TRANSFORM_ENERGY_DATA = (data: EnergyConsumption[]): EnergyConsumption[] => {
    return data.map((item) => ({
        ...item,
        currentConsumption: (parseFloat(item.currentConsumption) / 60).toFixed(2),
        filterConsumptionResult: {
            ...item.filterConsumptionResult,
            totalAllConsumption: item.filterConsumptionResult.totalAllConsumption / 60,
        },
    }));
};

const BUILD_ELECTRIC_STATS = (data: EnergyConsumption[]): ElectricStats => {
    const totalConsumption = data.reduce(
        (sum, item) => sum + item.filterConsumptionResult.totalAllConsumption,
        0
    );

    return {
        totalComsumption: totalConsumption / 60,
        totalCost: calculateElectricityBill(totalConsumption / 60),
        totalIdleTime: 0,
        totalParts: 0,
    };
};

const ElectricOverviewPage = () => {
    const { token } = theme.useToken();
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('TODAY');
    const [dateRange, setDateRange] = useState<[string, string] | null>(null);
    const [zoneId, setZoneId] = useState<string | null>(null);
    const [zones] = useState<Zone[]>([]);
    const [electricData, setElectricData] = useState<ElectricStats>(initialElectricStats);
    const [energyConsumption, setEnergyConsumption] = useState<EnergyConsumption[]>([]);
    const [loading, setLoading] = useState(false);
    const {
        energyData,
        setInitialData,
    } = useEnergyWebSocket({
        selectedZoneId: zoneId,
    });

    usePageTitle(t('electricManagement.electricOverview'));

    // Sync WebSocket data to local state
    useEffect(() => {
        if (energyData.length > 0) {
            const transformedData = TRANSFORM_ENERGY_DATA(energyData);
            setEnergyConsumption(transformedData);
            setElectricData(BUILD_ELECTRIC_STATS(energyData));
        }
    }, [energyData]);

    const fetchElectricData = async (
        period: TimePeriod,
        selectedZoneId: string | null,
        customDateRange: [string, string] | null
    ) => {
        setLoading(true);
        try {
            let response: EnergyConsumption[];

            if (customDateRange) {
                response = await ElectricService.getElectricByDateRange(
                    customDateRange[0],
                    customDateRange[1],
                    selectedZoneId || ''
                );
            } else {
                response = await ElectricService.getElectricByDateAndZone(
                    period,
                    selectedZoneId || ''
                );
            }

            setElectricData(BUILD_ELECTRIC_STATS(response));
            const transformedData = TRANSFORM_ENERGY_DATA(response);
            setEnergyConsumption(transformedData);
            setInitialData(response);
        } catch (err: unknown) {
            toast.error('Failed to load electric data');
        } finally {
            setLoading(false);
        }
    };

    const handleTimePeriodChange = (value: TimePeriod) => {
        setTimePeriod(value);
        setDateRange(null);
    };

    const handleDateRangeChange = (dates: [string, string] | null) => {
        setDateRange(dates);
    };

    const handleZoneChange = (value: string | null) => {
        setZoneId(value);
    };

    const handleSearch = () => {
        fetchElectricData(timePeriod, zoneId, dateRange);
    };

    const handleClearFilter = () => {
        setTimePeriod('TODAY');
        setDateRange(null);
        setZoneId(null);
        fetchElectricData('TODAY', null, null);
    };

    useEffect(() => {
        let isSubscribed = true;

        const loadInitialData = async () => {
            setLoading(true);
            try {
                const todayData = await ElectricService.getElectricByDateAndZone('TODAY');

                if (!isSubscribed) return;

                setElectricData(BUILD_ELECTRIC_STATS(todayData));
                const transformedData = TRANSFORM_ENERGY_DATA(todayData);
                setEnergyConsumption(transformedData);
                setInitialData(todayData);
            } catch (err: unknown) {
                if (isSubscribed) {
                    toast.error('Failed to load initial data');
                }
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            isSubscribed = false;
        };
    }, []);

    const hasData = useMemo(() => energyConsumption.length > 0, [energyConsumption]);

    return (
        <>
            <ResponsivePageHeader
                title={t('electricManagement.electricOverview')}
                rightContent={
                    <ElectricFilters
                        timePeriod={timePeriod}
                        dateRange={dateRange}
                        zoneId={zoneId}
                        zones={zones}
                        loading={loading}
                        onTimePeriodChange={handleTimePeriodChange}
                        onDateRangeChange={handleDateRangeChange}
                        onZoneChange={handleZoneChange}
                        onSearch={handleSearch}
                        onClearFilter={handleClearFilter}
                    />
                }
            />

            {loading ? (
                <>
                    <Skeleton active paragraph={{ rows: 2 }} />
                    <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 24 }} />
                </>
            ) : hasData ? (
                <>
                    <ElectricStatsCards stats={electricData} />
                    <ZoneConsumptionCards zones={energyConsumption} />
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <ElectricalChart zones={energyConsumption} />
                        </Col>
                        <Col xs={24} lg={8}>
                            <TopZoneConsumption zones={energyConsumption} />
                        </Col>
                    </Row>
                </>
            ) : (
                <>
                    {/* Empty Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {[
                            {
                                label: t('electricManagement.stats.totalConsumption'),
                                color: '#D46B08',
                            },
                            { label: t('electricManagement.stats.totalCost'), color: '#237804' },
                            {
                                label: t('electricManagement.stats.totalIdleTime'),
                                color: '#0050B3',
                            },
                            { label: t('electricManagement.stats.totalParts'), color: '#391085' },
                        ].map((stat, index) => (
                            <Col xs={24} sm={12} lg={6} key={index}>
                                <Card
                                    style={{
                                        borderRadius: 12,
                                        border: `2px dashed ${token.colorBorder}`,
                                        background: token.colorBgLayout,
                                        height: 120,
                                    }}
                                >
                                    <Flex
                                        vertical
                                        align="center"
                                        justify="center"
                                        gap={8}
                                        style={{ height: '100%' }}
                                    >
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: token.colorBgContainer,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <ThunderboltOutlined
                                                style={{
                                                    fontSize: 20,
                                                    color: token.colorTextDisabled,
                                                }}
                                            />
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {stat.label}
                                        </Text>
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Empty Zone Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {[1, 2, 3].map((i) => (
                            <Col xs={24} sm={12} lg={8} key={i}>
                                <Card
                                    style={{
                                        borderRadius: 12,
                                        border: `2px dashed ${token.colorBorder}`,
                                        background: token.colorBgLayout,
                                        height: 150,
                                    }}
                                >
                                    <Flex
                                        vertical
                                        align="center"
                                        justify="center"
                                        gap={8}
                                        style={{ height: '100%' }}
                                    >
                                        <ThunderboltOutlined
                                            style={{
                                                fontSize: 32,
                                                color: token.colorTextDisabled,
                                            }}
                                        />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {t('electricManagement.noData')}
                                        </Text>
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Main Empty State */}
                    <EmptyState
                        title={t('electricManagement.noData')}
                        description={t('electricManagement.noDataDescription')}
                        onRetry={handleSearch}
                    />
                </>
            )}
        </>
    );
};

export default ElectricOverviewPage;
