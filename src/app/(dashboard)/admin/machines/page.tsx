'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Row, Col, Input, Select, Empty, Spin, Button } from 'antd';
import MachineStatsCards from './_components/MachineStatsCards';
import MachineCard from './_components/MachineCard';
import MachineFilterInfo from './_components/MachineFilterInfo';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, InboxOutlined } from '@ant-design/icons';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import MachineTimelineModal from './_components/MachineTimelineModal';
import { MachineOverview } from '@/types/Machine';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { machineActions } from '@/stores';
import { SpaceWithChildrenResponse } from '@/types/Space';
import {
    mapSpaceTreeToTreeSelect,
    SpaceTreeSelect,
} from '@/components/shared/filters/SpaceTreeSelect';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { IndustryFilter } from '@/types/IndustryFilter';

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
    const [isLoadingIndustryFilters, setIsLoadingIndustryFilters] = useState(false);
    const selectedTimePeriodRef = useRef<number | null>(selectedTimePeriod);

    // Helper to find space path for display
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

    const spaceTreeSelectData = useMemo(
        () => mapSpaceTreeToTreeSelect(spacesTree),
        [spacesTree]
    );

    const timePeriodOptions = useMemo(() => {
        const currentLang = i18n.language;

        return industryFilters.map((filter) => ({
            label: currentLang === 'vi' ? filter.displayNameVi : filter.displayNameEn,
            value: filter.filterId,
        }));
    }, [industryFilters, i18n.language]);

    usePageTitle(t('machineManagement.header.title'));

    // Step 1: Fetch full spaces tree when component mounts
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
                const filters = await IndustryFilterService.getAllIndustryFilters();
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

        // Priority: zone > factory > random space from tree
        if (zoneIdParam) {
            dispatch(machineActions.setSelectedSpaceId(Number(zoneIdParam)));
        } else if (factoryIdParam) {
            dispatch(machineActions.setSelectedSpaceId(Number(factoryIdParam)));
        } else if (selectedSpaceId === undefined) {
            const getAllSpaceIds = (nodes: SpaceWithChildrenResponse[]): number[] => {
                const ids: number[] = [];
                const traverse = (treeNodes: SpaceWithChildrenResponse[]) => {
                    for (const node of treeNodes) {
                        ids.push(node.spaceId);
                        if (node.children && node.children.length > 0) {
                            traverse(node.children);
                        }
                    }
                };
                traverse(nodes);
                return ids;
            };

            const allIds = getAllSpaceIds(spacesTree);
            if (allIds.length > 0) {
                const randomId = allIds[Math.floor(Math.random() * allIds.length)];
                dispatch(machineActions.setSelectedSpaceId(randomId));
            }
        }
    }, [searchParams, dispatch, spacesTree, selectedSpaceId]);

    const hasSelectedSpace = selectedSpaceId !== undefined;

    // Step 2: Fetch machines với spaceId ngay sau khi load xong filter
    useEffect(() => {
        if (!hasSelectedSpace || selectedSpaceId === undefined || selectedTimePeriod == null) {
            return;
        }

        if (isFirstLoad) {
            dispatch(machineActions.fetchMachines(selectedSpaceId, selectedTimePeriod));
            setIsFirstLoad(false);
        }
    }, [hasSelectedSpace, selectedSpaceId, selectedTimePeriod, isFirstLoad, dispatch]);

    // Step 3: Subscribe to WebSocket energy topic
    useEffect(() => {
        if (!wsConnected || selectedSpaceId === undefined) return;

        // Use the selected space ID for subscription (might need adjustment based on your WS logic)
        const topic = `/topic/energy/zone/${selectedSpaceId}`;
        if (isDev) console.log('[Machine Page] Subscribing to:', topic);

        const unsubscribe = wsService.subscribe<any>(topic, (message) => {
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

    // Step 4: Subscribe to individual machine status topics
    useEffect(() => {
        if (!wsConnected || machines.length === 0) return;

        const unsubscribes: (() => void)[] = [];

        if (isDev) console.log(`[Machine Page] Subscribing to ${machines.length} machine status topics`);

        machines.forEach((machine: MachineOverview) => {
            const statusTopic = `/topic/machines/status/${machine.machineId}`;

            const unsubscribe = wsService.subscribe<{
                type: string;
                payload: {
                    machineId: string;
                    data: {
                        previousLog: {
                            startTime: string;
                            endTime: string;
                            logStatus:
                            | 'RUNTIME'
                            | 'IDLE'
                            | 'ERROR'
                            | 'COMPLETE'
                            | 'OFFLINE'
                            | 'UNKNOWN';
                        };
                        newStatus:
                        | 'RUNTIME'
                        | 'IDLE'
                        | 'ERROR'
                        | 'COMPLETE'
                        | 'OFFLINE'
                        | 'UNKNOWN';
                        productionCounter: number;
                    };
                };
            }>(statusTopic, (message) => {
                if (message.type !== 'DATA') return;

                const { machineId, data } = message.payload;
                const { newStatus, productionCounter } = data;

                if (!machineId || !newStatus || newStatus === 'UNKNOWN') return;

                dispatch(
                    machineActions.updateMachineStatus(machineId, newStatus, productionCounter)
                );
            });

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
            dispatch(machineActions.setSelectedSpaceId(
                spaceId !== undefined && spaceId !== null ? Number(spaceId) : undefined
            ));
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
        return machines.filter(
            (machine: MachineOverview) =>
                machine.machineName?.toString().toLowerCase().includes(search)
        );
    }, [machines, searchText]);

    const headerActions = useMemo(
        () => (
            <>
                <Input
                    placeholder={t('machineManagement.filters.searchPlaceholder')}
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    allowClear
                    style={{
                        width: 280,
                        borderRadius: 8,
                    }}
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

    // Check initial loading state
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

                    {/* Machine Filter Info */}
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

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : filteredMachines.length > 0 ? (
                        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                            {filteredMachines.map((machine: MachineOverview) => (
                                <Col xs={24} sm={12} lg={6} key={machine.machineId}>
                                    <MachineCard machine={machine} onCardClick={handleCardClick} />
                                </Col>
                            ))}
                        </Row>
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
                            style={{
                                marginTop: 80,
                                marginBottom: 80,
                            }}
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
