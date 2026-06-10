'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { Select, Flex, Button, Col, Row, Spin, DatePicker, TreeSelect } from 'antd';
import { DashboardOutlined, ReloadOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import DashboardStatsCards, { DashboardStats } from './_components/DashboardStatsCards';
import MachineStatusChart from './_components/MachineStatusChart';
import ErrorTypeDistribution from './_components/ErrorTypeDistribution';
import ErrorTimeline from './_components/ErrorTimeline';
import AverageErrorTimeTrend from './_components/AverageErrorTimeTrend';
import OperationalOverview from './_components/OperationalOverview';
import DashboardSnapshotPanels from './_components/DashboardSnapshotPanels';
import { SpaceService } from '@/services/SpaceService';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { computeStatsFromMachines, collectAllMachines } from '@/utils/spaceStatsUtils';
import { ErrorCountChartResponse, MttrChartResponse } from '@/types/Monitoring';
import { IndustryFilter } from '@/types/IndustryFilter';
import {
    getMockDashboardData,
    MOCK_DASHBOARD_STATS,
    MOCK_INDUSTRY_FILTERS,
    MOCK_PRIORITY_QUEUE,
    MOCK_PRODUCTION_HEALTH,
    MOCK_SPACES,
    USE_MOCK_DASHBOARD,
} from '@/mockData/admin/dashboard';
import dayjs, { Dayjs } from 'dayjs';

const DashboardPage = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [machineStatusData, setMachineStatusData] = useState({
        running: 0,
        idle: 0,
        error: 0,
        offline: 0,
    });
    const [errorCountData, setErrorCountData] = useState<ErrorCountChartResponse | null>(null);
    const [mttrData, setMttrData] = useState<MttrChartResponse | null>(null);
    const [productionHealth, setProductionHealth] = useState(MOCK_PRODUCTION_HEALTH);
    const [priorityQueue, setPriorityQueue] = useState(MOCK_PRIORITY_QUEUE);

    // Filter states
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);
    const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
    const [spaces, setSpaces] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<[string, string]>([
        dayjs().format('YYYY-MM-DD'),
        dayjs().format('YYYY-MM-DD'),
    ]);
    const [useFilter, setUseFilter] = useState(true); // true = use filter, false = use date range

    usePageTitle(t('adminPage.title'));

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            if (USE_MOCK_DASHBOARD) {
                setSpaces(MOCK_SPACES);
                setSelectedSpaceId(MOCK_SPACES[0]?.spaceId ?? null);
                setIndustryFilters(MOCK_INDUSTRY_FILTERS);
                setSelectedFilterId(MOCK_INDUSTRY_FILTERS[0]?.filterId ?? null);
                return;
            }

            try {
                // Load spaces
                const spacesData = await SpaceService.getAllSpacesTree();
                setSpaces(spacesData);
                if (spacesData.length > 0) {
                    setSelectedSpaceId(spacesData[0].spaceId);
                }

                // Load industry filters
                const filters = await IndustryFilterService.getAllIndustryFilters();
                setIndustryFilters(filters);
                if (filters.length > 0) {
                    setSelectedFilterId(filters[0].filterId);
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
                setSpaces(MOCK_SPACES);
                setSelectedSpaceId(MOCK_SPACES[0]?.spaceId ?? null);
                setIndustryFilters(MOCK_INDUSTRY_FILTERS);
                setSelectedFilterId(MOCK_INDUSTRY_FILTERS[0]?.filterId ?? null);
            }
        };

        loadInitialData();
    }, []);

    // Fetch all dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!selectedSpaceId) return;

        try {
            setLoading(true);

            if (USE_MOCK_DASHBOARD) {
                const mockData = getMockDashboardData();
                setMachineStatusData(mockData.machineStatusData);
                setErrorCountData(mockData.errorCountData);
                setMttrData(mockData.mttrData);
                setProductionHealth(mockData.productionHealth);
                setPriorityQueue(mockData.priorityQueue);
                return;
            }

            if (useFilter && selectedFilterId) {
                // Fetch by filter
                const results = await Promise.allSettled([
                    SpaceService.getSpaceOverview(selectedSpaceId, selectedFilterId),
                    SpaceService.getErrorCountByFilter(selectedFilterId, selectedSpaceId),
                    SpaceService.getMttrByFilter(selectedFilterId, selectedSpaceId),
                ]);

                // Process space data (machine status)
                if (results[0].status === 'fulfilled') {
                    const allMachines = collectAllMachines(results[0].value);
                    const stats = computeStatsFromMachines(allMachines);
                    setMachineStatusData({
                        running: stats.machinesByStatus.RUNTIME,
                        idle: stats.machinesByStatus.IDLE,
                        error: stats.machinesByStatus.ERROR,
                        offline: stats.machinesByStatus.OFFLINE,
                    });
                } else {
                    console.error('Failed to fetch space data:', results[0].reason);
                }

                // Process error count data
                if (results[1].status === 'fulfilled') {
                    setErrorCountData(results[1].value);
                } else {
                    console.error('Failed to fetch error count data:', results[1].reason);
                    setErrorCountData(null);
                }

                // Process MTTR data
                if (results[2].status === 'fulfilled') {
                    setMttrData(results[2].value);
                } else {
                    console.error('Failed to fetch MTTR data:', results[2].reason);
                    setMttrData(null);
                }
            } else {
                // Fetch by date range
                const [startDate, endDate] = dateRange;
                const results = await Promise.allSettled([
                    SpaceService.getSpaceOverviewByDateRange(
                        selectedSpaceId,
                        startDate,
                        endDate,
                        selectedFilterId || undefined
                    ),
                    SpaceService.getErrorCountByDateRange(startDate, endDate, selectedSpaceId),
                    SpaceService.getMttrByDateRange(startDate, endDate, selectedSpaceId),
                ]);

                // Process space data (machine status)
                if (results[0].status === 'fulfilled') {
                    const allMachines = collectAllMachines(results[0].value);
                    const stats = computeStatsFromMachines(allMachines);
                    setMachineStatusData({
                        running: stats.machinesByStatus.RUNTIME,
                        idle: stats.machinesByStatus.IDLE,
                        error: stats.machinesByStatus.ERROR,
                        offline: stats.machinesByStatus.OFFLINE,
                    });
                } else {
                    console.error('Failed to fetch space data:', results[0].reason);
                }

                // Process error count data
                if (results[1].status === 'fulfilled') {
                    setErrorCountData(results[1].value);
                } else {
                    console.error('Failed to fetch error count data:', results[1].reason);
                    setErrorCountData(null);
                }

                // Process MTTR data
                if (results[2].status === 'fulfilled') {
                    setMttrData(results[2].value);
                } else {
                    console.error('Failed to fetch MTTR data:', results[2].reason);
                    setMttrData(null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            const mockData = getMockDashboardData();
            setMachineStatusData(mockData.machineStatusData);
            setErrorCountData(mockData.errorCountData);
            setMttrData(mockData.mttrData);
            setProductionHealth(mockData.productionHealth);
            setPriorityQueue(mockData.priorityQueue);
        } finally {
            setLoading(false);
        }
    }, [selectedSpaceId, selectedFilterId, dateRange, useFilter]);

    // Auto-fetch when filters change
    useEffect(() => {
        if (selectedSpaceId && (useFilter ? selectedFilterId : true)) {
            fetchDashboardData();
        }
    }, [selectedSpaceId, selectedFilterId, useFilter, fetchDashboardData]);

    const filterOptions = useMemo(() => {
        const currentLang = i18n.language;
        return industryFilters.map((filter: IndustryFilter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
        }));
    }, [industryFilters, i18n.language]);

    const spaceTreeData = useMemo(() => {
        const convertToTreeData = (spaces: any[]): any[] => {
            return spaces.map((space) => ({
                title: space.spaceName,
                value: space.spaceId,
                children:
                    space.children && space.children.length > 0
                        ? convertToTreeData(space.children)
                        : undefined,
            }));
        };
        return convertToTreeData(spaces);
    }, [spaces]);

    const totalMachines = useMemo(
        () =>
            machineStatusData.running +
            machineStatusData.idle +
            machineStatusData.error +
            machineStatusData.offline,
        [machineStatusData]
    );

    const topErrorMachine = useMemo(() => {
        if (!errorCountData?.series.length) return undefined;

        return errorCountData.series
            .map((machine) => ({
                machineName: machine.machineName,
                errorCount: machine.dataPoints.reduce((sum, point) => sum + point.value, 0),
            }))
            .filter((machine) => machine.errorCount > 0)
            .sort((a, b) => b.errorCount - a.errorCount)[0];
    }, [errorCountData]);

    const dashboardStats = useMemo<DashboardStats>(
        () => ({
            ...MOCK_DASHBOARD_STATS,
            machinesRunning: machineStatusData.running,
            machinesTotal: totalMachines || MOCK_DASHBOARD_STATS.machinesTotal,
            machinesError: machineStatusData.error,
        }),
        [machineStatusData.error, machineStatusData.running, totalMachines]
    );

    const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        if (dates && dates[0] && dates[1]) {
            setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            setUseFilter(false);
        }
    };

    const handleFilterChange = (value: number) => {
        setSelectedFilterId(value);
        setUseFilter(true);
    };

    const headerActions = (
        <Flex gap={8} align="center" wrap="wrap">
            <TreeSelect
                placeholder="Select Space"
                value={selectedSpaceId}
                onChange={setSelectedSpaceId}
                treeData={spaceTreeData}
                style={{ minWidth: 200 }}
                showSearch
                treeDefaultExpandAll
                filterTreeNode={(search, item) =>
                    item.title?.toString().toLowerCase().includes(search.toLowerCase()) || false
                }
            />
            <Select
                value={selectedFilterId}
                onChange={handleFilterChange}
                options={filterOptions}
                style={{ minWidth: 120 }}
            />
            <DatePicker.RangePicker
                value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                style={{ borderRadius: 8 }}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchDashboardData}>
                {t('common.refresh')}
            </Button>
        </Flex>
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('adminPage.title')}
                icon={<DashboardOutlined />}
                rightContent={headerActions}
            />

            <DashboardStatsCards stats={dashboardStats} />
            <OperationalOverview
                loading={loading}
                isMockData={USE_MOCK_DASHBOARD}
                productionHealth={productionHealth}
                priorityQueue={priorityQueue}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
                    <Col xs={24} lg={8}>
                        <MachineStatusChart data={machineStatusData} />
                    </Col>
                    <Col xs={24} lg={16}>
                        <ErrorTimeline data={errorCountData} loading={loading} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <ErrorTypeDistribution data={errorCountData} loading={loading} />
                    </Col>

                    <Col xs={24} lg={16}>
                        <AverageErrorTimeTrend data={mttrData} loading={loading} />
                    </Col>
                </Row>
            )}

            <DashboardSnapshotPanels stats={dashboardStats} topErrorMachine={topErrorMachine} />
        </>
    );
};

export default DashboardPage;
