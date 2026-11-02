'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input, Select, Empty, Spin, Button, Flex, Segmented, Row, Col } from 'antd';
import { AppstoreOutlined, TableOutlined, AimOutlined } from '@ant-design/icons';
import {
    MachineStatsCards,
    MachineCard,
    MachineFilterInfo,
    MachineFocusView,
    MachineTimelineModal,
    MachineDashboardSummary,
    MachineDurationSummaryTable,
} from '@/features/dashboard/machines';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, InboxOutlined } from '@ant-design/icons';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { MachineOverview, MachineStatusWsMessage } from '@/types/Machine';

interface ZoneEnergyWsFrame {
    payload?:
        | { type: 'MACHINES_CURRENT_POWER'; machines: Record<string, number> }
        | { type: 'MACHINES_FULL_POWER'; data: MachineOverview[] };
}
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { machineActions } from '@/stores';
import { SpaceWithChildrenResponse } from '@/types/Space';
import {
    mapSpaceTreeToTreeSelect,
    SpaceTreeSelect,
} from '@/components/shared/filters/SpaceTreeSelect';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { IndustryFilter } from '@/types/IndustryFilter';
import { DemoFactoryOverviewService, USE_MOCK_FACTORY_OVERVIEW } from '@/mockData/admin/factory';

import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const isDev = process.env.NODE_ENV === 'development';

const MachinesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();
    const searchParams = useSearchParams();
    const { wsService, isConnected: wsConnected } = useWebSocketContext();
    const {
        machines,
        spacesTree,
        selectedSpaceId,
        selectedTimePeriod,
        searchText,
        isFetching: isLoading,
        isLoadingFactories,
        selectedMachine,
        isModalOpen: modalOpen,
        stats: machineStats,
    } = useAppSelector((state) => state.machine);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [industryFilters, setIndustryFilters] = useState<IndustryFilter[]>([]);
    const [cardStatusFilter, setCardStatusFilter] = useState<string>('ALL');
    const [cardSortBy, setCardSortBy] = useState<string>('default');
    const [viewMode, setViewMode] = useState<'card' | 'table' | 'focus'>('card');
    const [isLoadingIndustryFilters, setIsLoadingIndustryFilters] = useState(false);
    const selectedTimePeriodRef = useRef<number | null>(selectedTimePeriod);

    const findSpacePathNodes = (
        tree: SpaceWithChildrenResponse[],
        targetId: number,
        currentPath: SpaceWithChildrenResponse[] = []
    ): SpaceWithChildrenResponse[] | null => {
        for (const node of tree) {
            const nextPath = [...currentPath, node];
            if (node.spaceId === targetId) return nextPath;
            if (node.children) {
                const found = findSpacePathNodes(node.children, targetId, nextPath);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedNodes = useMemo(() => {
        if (selectedSpaceId === undefined || spacesTree.length === 0) return [];
        return findSpacePathNodes(spacesTree, selectedSpaceId) || [];
    }, [spacesTree, selectedSpaceId]);

    const spaceTreeSelectData = useMemo(() => mapSpaceTreeToTreeSelect(spacesTree), [spacesTree]);

    const timePeriodOptions = useMemo(() => {
        const currentLang = i18n.language;
        return industryFilters.map((filter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
        }));
    }, [industryFilters, i18n.language]);

    usePageTitle(t('machineManagement.header.title'));

    useEffect(() => {
        dispatch(machineActions.fetchFactories());
    }, [dispatch]);

    useEffect(() => {
        selectedTimePeriodRef.current = selectedTimePeriod;
    }, [selectedTimePeriod]);

    useEffect(() => {
        const fetchIndustryFilters = async () => {
            setIsLoadingIndustryFilters(true);
            try {
                const filters = USE_MOCK_FACTORY_OVERVIEW
                    ? await DemoFactoryOverviewService.getIndustryFilters()
                    : await IndustryFilterService.getAllIndustryFilters();
                setIndustryFilters(filters);
                if (filters.length > 0 && selectedTimePeriodRef.current == null) {
                    dispatch(machineActions.setSelectedTimePeriod(filters[0].filterId));
                }
            } catch (error) {
                console.error('Failed to fetch industry filters:', error);
                toast.error('Failed to load filters');
            } finally {
                setIsLoadingIndustryFilters(false);
            }
        };
        fetchIndustryFilters();
    }, [dispatch]);

    useEffect(() => {
        if (spacesTree.length === 0) return;

        const zoneIdParam = searchParams.get('zoneId');
        const factoryIdParam = searchParams.get('factoryId');
        const spaceIdFromQuery = zoneIdParam ?? factoryIdParam;

        if (spaceIdFromQuery) {
            const nextSpaceId = Number(spaceIdFromQuery);
            if (selectedSpaceId !== nextSpaceId) {
                dispatch(machineActions.setSelectedSpaceId(nextSpaceId));
            }
            return;
        }

        if (selectedSpaceId === undefined) {
            dispatch(machineActions.setSelectedSpaceId(spacesTree[0].spaceId));
        }
    }, [searchParams, dispatch, selectedSpaceId, spacesTree]);

    const hasSelectedSpace = selectedSpaceId !== undefined;

    useEffect(() => {
        if (!hasSelectedSpace || selectedSpaceId === undefined || selectedTimePeriod == null)
            return;
        if (isFirstLoad) {
            dispatch(machineActions.fetchMachines(selectedSpaceId, selectedTimePeriod));
            setIsFirstLoad(false);
        }
    }, [hasSelectedSpace, selectedSpaceId, selectedTimePeriod, isFirstLoad, dispatch]);

    useEffect(() => {
        if (!wsConnected || selectedSpaceId === undefined) return;
        const topic = `/topic/energy/zone/${selectedSpaceId}`;
        if (isDev) console.log('[Machine Page] Subscribing to:', topic);

        const unsubscribe = wsService.subscribe<ZoneEnergyWsFrame>(topic, (message) => {
            if (message.payload?.type === 'MACHINES_CURRENT_POWER') {
                dispatch(machineActions.updateMachinesPower(message.payload.machines));
            }
            if (message.payload?.type === 'MACHINES_FULL_POWER') {
                const { data } = message.payload;
                if (Array.isArray(data)) {
                    dispatch(machineActions.setFullMachinesData(data));
                }
            }
        });

        return () => unsubscribe();
    }, [wsConnected, selectedSpaceId, dispatch, wsService]);

    useEffect(() => {
        if (!wsConnected || machines.length === 0) return;
        const unsubscribes: (() => void)[] = [];

        if (isDev)
            console.log(`[Machine Page] Subscribing to ${machines.length} machine status topics`);

        machines.forEach((machine: MachineOverview) => {
            const statusTopic = `/topic/machines/status/${machine.machineId}`;
            const unsubscribe = wsService.subscribe<MachineStatusWsMessage>(
                statusTopic,
                (message) => {
                    if (message.type !== 'DATA') return;
                    const { machineId, data } = message.payload;
                    const { newStatus, productionCounter } = data;
                    if (!machineId || !newStatus || newStatus === 'UNKNOWN') return;
                    dispatch(
                        machineActions.updateMachineStatus(machineId, newStatus, productionCounter)
                    );
                }
            );
            unsubscribes.push(unsubscribe);
        });

        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };
    }, [wsConnected, machines.length, dispatch, wsService]);

    const handleSearchChange = useCallback(
        (value: string) => {
            dispatch(machineActions.setSearchText(value));
        },
        [dispatch]
    );

    const handleSpaceChange = useCallback(
        (spaceId: number | string | undefined | null) => {
            dispatch(
                machineActions.setSelectedSpaceId(
                    spaceId !== undefined && spaceId !== null ? Number(spaceId) : undefined
                )
            );
        },
        [dispatch]
    );

    const handleCardClick = useCallback(
        (machine: MachineOverview) => {
            dispatch(machineActions.openMachineModal(machine));
        },
        [dispatch]
    );

    const handleModalClose = useCallback(() => {
        dispatch(machineActions.closeMachineModal());
    }, [dispatch]);

    const handleSearch = useCallback(() => {
        if (!hasSelectedSpace) {
            toast.warning(t('common.selectSpace') || 'Please select a space');
            return;
        }
        if (selectedTimePeriod == null) {
            toast.warning(t('common.filter') || 'Please select a filter');
            return;
        }
        if (selectedSpaceId !== undefined) {
            dispatch(machineActions.fetchMachines(selectedSpaceId, selectedTimePeriod));
        }
    }, [hasSelectedSpace, selectedSpaceId, selectedTimePeriod, dispatch, t]);

    const handleTimePeriodChange = useCallback(
        (value: number) => {
            dispatch(machineActions.setSelectedTimePeriod(value));
        },
        [dispatch]
    );

    const filteredMachines = useMemo(() => {
        if (!searchText) return machines;
        const search = searchText.toString().toLowerCase();
        return machines.filter((machine: MachineOverview) =>
            machine.machineName?.toString().toLowerCase().includes(search)
        );
    }, [machines, searchText]);

    const displayedMachines = useMemo(() => {
        const statusGroups: Record<string, string[]> = {
            Running: ['RUNTIME'],
            Stopped: ['IDLE', 'TEMPORARY_STOP', 'COMPLETE'],
            Error: ['ERROR', 'WARNING'],
            Offline: ['OFFLINE'],
        };

        let result = filteredMachines;

        if (cardStatusFilter !== 'ALL') {
            const allowed = statusGroups[cardStatusFilter] ?? [];
            result = result.filter((m: MachineOverview) =>
                allowed.includes(m.currentStatus ?? 'OFFLINE')
            );
        }

        if (cardSortBy === 'production_desc') {
            result = [...result].sort(
                (a, b) => (b.totalProductions ?? 0) - (a.totalProductions ?? 0)
            );
        } else if (cardSortBy === 'online_desc') {
            const onlineSec = (m: MachineOverview) =>
                Object.entries(m.runtimeByStatus ?? {}).reduce(
                    (sum, [s, v]) => (s !== 'OFFLINE' ? sum + (v as number) : sum),
                    0
                );
            result = [...result].sort((a, b) => onlineSec(b) - onlineSec(a));
        } else if (cardSortBy === 'error_desc') {
            const errorSec = (m: MachineOverview) =>
                ((m.runtimeByStatus as Record<string, number> | undefined)?.['ERROR'] ?? 0) +
                ((m.runtimeByStatus as Record<string, number> | undefined)?.['WARNING'] ?? 0);
            result = [...result].sort((a, b) => errorSec(b) - errorSec(a));
        }

        return result;
    }, [filteredMachines, cardStatusFilter, cardSortBy]);

    const headerActions = useMemo(
        () => (
            <>
                <Input
                    placeholder={t('machineManagement.filters.searchPlaceholder')}
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    allowClear
                    style={{ width: 280, borderRadius: 8 }}
                />
                <Select
                    value={selectedTimePeriod}
                    onChange={handleTimePeriodChange}
                    style={{ width: 180 }}
                    options={timePeriodOptions}
                    loading={isLoadingIndustryFilters}
                    disabled={timePeriodOptions.length === 0}
                />
                <SpaceTreeSelect
                    value={selectedSpaceId}
                    onChange={handleSpaceChange}
                    treeData={spaceTreeSelectData}
                    loading={isLoadingFactories}
                    style={{ width: 280, minWidth: 180 }}
                />
                <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                    loading={isLoading}
                    style={{ borderRadius: 8 }}
                >
                    {t('common.search')}
                </Button>
            </>
        ),
        [
            t,
            searchText,
            selectedTimePeriod,
            selectedSpaceId,
            isLoading,
            isLoadingFactories,
            isLoadingIndustryFilters,
            handleSearchChange,
            handleTimePeriodChange,
            handleSpaceChange,
            handleSearch,
            spaceTreeSelectData,
            timePeriodOptions,
        ]
    );

    const isInitialLoading =
        isLoadingFactories ||
        isLoadingIndustryFilters ||
        (isLoading && machines.length === 0) ||
        (isFirstLoad && selectedTimePeriod != null && hasSelectedSpace);

    return (
        <>
            <ResponsivePageHeader
                title={t('machineManagement.header.title')}
                rightContent={headerActions}
                mobileSearch={{
                    text: searchText,
                    onChange: handleSearchChange,
                    placeholder: t('machineManagement.mobile.searchPlaceholder'),
                }}
            />

            {isInitialLoading ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <Spin size="large" description={t('common.loading')} />
                </div>
            ) : (
                <>
                    <MachineStatsCards stats={machineStats} />

                    {!isLoading && machines.length > 0 && (
                        <MachineFilterInfo
                            totalMachines={machines.length}
                            displayedMachines={filteredMachines.length}
                            factoryName={selectedNodes[0]?.spaceName}
                            zoneCode={selectedNodes[1]?.spaceCode}
                            timePeriod={
                                timePeriodOptions.find((tp) => tp.value === selectedTimePeriod)
                                    ?.label
                            }
                            isFiltered={searchText.length > 0}
                        />
                    )}

                    {!isLoading && machines.length > 0 && (
                        <MachineDashboardSummary machines={machines} />
                    )}

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : filteredMachines.length > 0 ? (
                        <>
                            <Flex
                                justify="space-between"
                                align="center"
                                gap={12}
                                style={{ marginTop: 24, marginBottom: 12, flexWrap: 'wrap' }}
                            >
                                <Flex gap={12} align="center" wrap="wrap">
                                    <Select
                                        value={cardStatusFilter}
                                        onChange={setCardStatusFilter}
                                        style={{ width: 160 }}
                                        options={[
                                            { label: 'All Statuses', value: 'ALL' },
                                            { label: 'Running', value: 'Running' },
                                            { label: 'Stopped', value: 'Stopped' },
                                            { label: 'Error', value: 'Error' },
                                            { label: 'Offline', value: 'Offline' },
                                        ]}
                                    />
                                    <Select
                                        value={cardSortBy}
                                        onChange={setCardSortBy}
                                        style={{ width: 200 }}
                                        options={[
                                            { label: 'Sort: Default', value: 'default' },
                                            {
                                                label: 'Production count ↓',
                                                value: 'production_desc',
                                            },
                                            { label: 'Online time ↓', value: 'online_desc' },
                                            { label: 'Error time ↓', value: 'error_desc' },
                                        ]}
                                    />
                                </Flex>
                                <Segmented
                                    value={viewMode}
                                    onChange={(v) => setViewMode(v as typeof viewMode)}
                                    options={[
                                        { value: 'card', icon: <AppstoreOutlined /> },
                                        { value: 'table', icon: <TableOutlined /> },
                                        { value: 'focus', icon: <AimOutlined /> },
                                    ]}
                                />
                            </Flex>

                            {viewMode === 'card' && (
                                <Row gutter={[16, 16]}>
                                    {displayedMachines.map((machine: MachineOverview) => (
                                        <Col key={machine.machineId} xs={24} sm={12} lg={8} xl={6}>
                                            <MachineCard
                                                machine={machine}
                                                onCardClick={handleCardClick}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            )}

                            {viewMode === 'table' && (
                                <MachineDurationSummaryTable machines={displayedMachines} />
                            )}

                            {viewMode === 'focus' && (
                                <MachineFocusView
                                    machines={displayedMachines}
                                    onCardClick={handleCardClick}
                                />
                            )}
                        </>
                    ) : (
                        <Empty
                            image={<InboxOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
                            styles={{ image: { height: 80 } }}
                            description={
                                <span style={{ color: '#999', fontSize: 16 }}>
                                    {searchText || selectedSpaceId !== undefined
                                        ? t('machineManagement.emptyStates.noResults.title')
                                        : t('machineManagement.emptyStates.noMachines.title')}
                                </span>
                            }
                            style={{ marginTop: 80, marginBottom: 80 }}
                        />
                    )}
                </>
            )}

            <MachineTimelineModal
                open={modalOpen}
                onClose={handleModalClose}
                machine={selectedMachine}
                filterInfo={{
                    factoryName: selectedNodes[0]?.spaceName,
                    zoneCode: selectedNodes[1]?.spaceCode,
                    timePeriod: timePeriodOptions.find((tp) => tp.value === selectedTimePeriod)
                        ?.label,
                }}
            />
        </>
    );
};

export default MachinesPage;
