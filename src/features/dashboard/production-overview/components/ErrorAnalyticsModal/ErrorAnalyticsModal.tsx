'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, theme, Skeleton, Grid, Empty, Button, Tag, Segmented, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, UnorderedListOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DowntimeService } from '@/services/DowntimeService';
import { SpaceService } from '@/services/SpaceService';
import {
    DowntimeMachineRollupItem,
    DowntimeMachineInfo,
    DowntimeMachineIncidentItem,
} from '@/types/Downtime';
import { SpacePickingWithChildren, SpaceWithChildrenResponse } from '@/types/Space';
import { useAppSelector } from '@/stores/hook';
import { IFactoryOverviewStoreState } from '@/stores/FactoryOverviewStore';
import { collectAllMachines } from '@/utils/spaceStatsUtils';
import {
    MachineListSidebar,
    MachineHeroHeader,
    IncidentHistoryTable,
    ModalHeader,
} from './_components';
import { formatMinutesToDuration } from './errorAnalyticsUtils';

export interface ErrorAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    spaceId: number | null;
    spaces?: SpacePickingWithChildren[];
    filterId: number | null;
    startDate: string;
    endDate: string;
    isDateRange: boolean;
    restrictToMachineIds?: string[];
}

export const ErrorAnalyticsModal: React.FC<ErrorAnalyticsModalProps> = React.memo(
    ({
        isOpen,
        onClose,
        spaceId,
        spaces: propSpaces,
        filterId,
        startDate,
        endDate,
        isDateRange,
        restrictToMachineIds,
    }) => {
        const { t } = useTranslation();
        const { token } = theme.useToken();
        const screens = Grid.useBreakpoint();
        const isMobile = screens.md === false;
        const isXs = screens.xs === true;
        const isSingleMachineMode = Boolean(
            restrictToMachineIds && restrictToMachineIds.length > 0
        );

        // --- Left Column (Machines List) States ---
        const [loadingMachines, setLoadingMachines] = useState(false);
        const [machinesList, setMachinesList] = useState<DowntimeMachineRollupItem[]>([]);
        const [totalAffectedCount, setTotalAffectedCount] = useState(0);
        const [plantTotalDowntimeMinutes, setPlantTotalDowntimeMinutes] = useState(0);
        const [selectedMachine, setSelectedMachine] = useState<DowntimeMachineRollupItem | null>(
            null
        );
        const [searchText, setSearchText] = useState('');
        const [debouncedSearch, setDebouncedSearch] = useState('');
        const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | 'all' | null>('all');
        const [sortByError, setSortByError] = useState(true);

        // --- Right Column (Incidents & Details) States ---
        const [loadingIncidents, setLoadingIncidents] = useState(false);
        const [selectedMachineInfo, setSelectedMachineInfo] = useState<DowntimeMachineInfo | null>(
            null
        );
        const [incidents, setIncidents] = useState<DowntimeMachineIncidentItem[]>([]);
        const [errorDateRange, setErrorDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(
            null
        );
        const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');

        // Space / Redux data for workshop tree mapping
        const reduxState = useAppSelector((state) => state.factoryOverview) as
            IFactoryOverviewStoreState | undefined;

        const effectiveSpaces = useMemo(() => {
            if (propSpaces && propSpaces.length > 0) return propSpaces;
            return reduxState?.spaces || [];
        }, [propSpaces, reduxState?.spaces]);

        const currentSpace = useMemo(() => {
            if (!spaceId) return null;
            return effectiveSpaces.find((s) => s.spaceId === spaceId) || null;
        }, [effectiveSpaces, spaceId]);

        const spaceData = useMemo(() => {
            return reduxState?.spaceData || null;
        }, [reduxState]);

        const [fetchedWorkshops, setFetchedWorkshops] = useState<
            Array<{ spaceId: number; spaceName: string; spaceCode?: string }>
        >([]);
        const [fetchedSpaceName, setFetchedSpaceName] = useState<string>('');

        // Fetch children (level 2 spaces) if not present in currentSpace
        useEffect(() => {
            if (!isOpen || !spaceId) return;

            // If currentSpace in Redux/props already has children, use them directly
            if (currentSpace?.children && currentSpace.children.length > 0) {
                setFetchedWorkshops(currentSpace.children);
                return;
            }

            let isMounted = true;
            const fetchChildrenSpaces = async () => {
                try {
                    const level1WithChildren = await SpaceService.getSpacesByLevelWithChildren(1);
                    if (!isMounted) return;
                    const target = level1WithChildren.find((s) => s.spaceId === spaceId);
                    if (target) {
                        if (target.spaceName) {
                            setFetchedSpaceName(target.spaceName);
                        }
                        if (target.children && target.children.length > 0) {
                            setFetchedWorkshops(target.children);
                            return;
                        }
                    }

                    // Secondary fallback: full space tree
                    const tree = await SpaceService.getAllSpacesTree();
                    if (!isMounted) return;
                    const findNode = (
                        nodes: SpaceWithChildrenResponse[]
                    ): SpaceWithChildrenResponse | null => {
                        for (const node of nodes) {
                            if (node.spaceId === spaceId) return node;
                            if (node.children) {
                                const found = findNode(node.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    const treeTarget = findNode(tree);
                    if (treeTarget) {
                        if (treeTarget.spaceName) {
                            setFetchedSpaceName(treeTarget.spaceName);
                        }
                        if (treeTarget.children && treeTarget.children.length > 0) {
                            setFetchedWorkshops(treeTarget.children);
                        }
                    }
                } catch (err) {
                    console.error(
                        '[ErrorAnalyticsModal] Error fetching child spaces for spaceId:',
                        spaceId,
                        err
                    );
                }
            };

            fetchChildrenSpaces();

            return () => {
                isMounted = false;
            };
        }, [isOpen, spaceId, currentSpace]);

        const workshopsList = useMemo(() => {
            if (currentSpace?.children && currentSpace.children.length > 0) {
                return currentSpace.children;
            }
            if (fetchedWorkshops.length > 0) {
                return fetchedWorkshops;
            }
            if (spaceData?.children && spaceData.children.length > 0) {
                return spaceData.children;
            }
            return [];
        }, [currentSpace?.children, fetchedWorkshops, spaceData?.children]);

        const workshopOptions = useMemo(() => {
            const allLabel =
                t('productionOverview.downtimeModal.allWorkshops') ||
                t('common.all') ||
                'Tất cả phân xưởng';
            if (workshopsList.length > 0) {
                return [
                    { label: allLabel, value: 'all' as const },
                    ...workshopsList.map((child) => ({
                        label: child.spaceName,
                        value: child.spaceId,
                    })),
                ];
            }
            return [{ label: allLabel, value: 'all' as const }];
        }, [workshopsList, t]);

        const activeSelectedWorkshop = useMemo(() => {
            if (selectedWorkshopId === 'all' || selectedWorkshopId === null) return null;
            return workshopsList.find((w) => w.spaceId === selectedWorkshopId) || null;
        }, [selectedWorkshopId, workshopsList]);

        const machineWorkshopMap = useMemo(() => {
            const map = new Map<string, { id: number; name: string }>();
            if (spaceData?.children && spaceData.children.length > 0) {
                spaceData.children.forEach((workshop) => {
                    if (workshop.machineChildren) {
                        const machines = collectAllMachines(workshop);
                        machines.forEach((m) =>
                            map.set(m.machineId, { id: workshop.spaceId, name: workshop.spaceName })
                        );
                    }
                });
            }
            if (workshopsList.length > 0 && machinesList.length > 0) {
                machinesList.forEach((m) => {
                    if (!map.has(m.machineId) && m.location) {
                        const matchedWs = workshopsList.find(
                            (ws) =>
                                m.location.includes(ws.spaceName) ||
                                (Boolean(ws.spaceCode) && m.location.includes(ws.spaceCode!))
                        );
                        if (matchedWs) {
                            map.set(m.machineId, {
                                id: matchedWs.spaceId,
                                name: matchedWs.spaceName,
                            });
                        }
                    }
                });
            }
            return map;
        }, [spaceData, workshopsList, machinesList]);

        // Debounce search text input
        useEffect(() => {
            const timer = setTimeout(() => {
                setDebouncedSearch(searchText);
            }, 300);
            return () => clearTimeout(timer);
        }, [searchText]);

        // Fetch Machines List (Left Column)
        useEffect(() => {
            if (!isOpen) return;

            let isMounted = true;

            const fetchMachines = async () => {
                setLoadingMachines(true);
                try {
                    const querySpaceId =
                        selectedWorkshopId !== 'all' && selectedWorkshopId !== null
                            ? selectedWorkshopId
                            : (spaceId ?? undefined);

                    let res;
                    if (isDateRange) {
                        res = await DowntimeService.getMachinesByDateRange({
                            startDate,
                            endDate,
                            spaceId: querySpaceId,
                            keyword: debouncedSearch.trim() || undefined,
                            page: 0,
                            size: 100,
                        });
                    } else {
                        res = await DowntimeService.getMachinesByFilter({
                            filterId: filterId ?? 1,
                            spaceId: querySpaceId,
                            keyword: debouncedSearch.trim() || undefined,
                            page: 0,
                            size: 100,
                        });
                    }

                    if (!isMounted) return;

                    let items = res?.page?.content || [];
                    const totalAffected = res?.totalAffectedMachines ?? items.length;

                    if (restrictToMachineIds && restrictToMachineIds.length > 0) {
                        const restricted = items.filter(
                            (i) =>
                                restrictToMachineIds.includes(i.machineId) ||
                                (i.machineCode && restrictToMachineIds.includes(i.machineCode))
                        );
                        if (restricted.length > 0) {
                            items = restricted;
                        }
                    }

                    setMachinesList(items);
                    setTotalAffectedCount(totalAffected);
                    setPlantTotalDowntimeMinutes(res?.totalDowntimeMinutes ?? 0);

                    // Auto-select first machine or keep existing selection
                    setSelectedMachine((prev) => {
                        if (items.length === 0) {
                            if (restrictToMachineIds && restrictToMachineIds.length > 0) {
                                return {
                                    machineId: restrictToMachineIds[0],
                                    machineCode: restrictToMachineIds[0],
                                    machineName: `Thiết bị ${restrictToMachineIds[0]}`,
                                    location: '',
                                    totalDowntimeMinutes: 0,
                                    formattedDowntime: '0m',
                                };
                            }
                            return null;
                        }
                        if (prev && items.some((item) => item.machineId === prev.machineId)) {
                            return prev;
                        }
                        return items[0];
                    });
                } catch (error: unknown) {
                    if (!isMounted) return;
                    console.error('Error fetching downtime machine list:', error);
                    toast.error(
                        (error as Error)?.message ||
                            t('common.errorOccurred', 'Không thể tải danh sách thiết bị downtime')
                    );
                    setMachinesList([]);
                } finally {
                    if (isMounted) {
                        setLoadingMachines(false);
                    }
                }
            };

            fetchMachines();

            return () => {
                isMounted = false;
            };
        }, [
            isOpen,
            spaceId,
            filterId,
            startDate,
            endDate,
            isDateRange,
            debouncedSearch,
            selectedWorkshopId,
            restrictToMachineIds,
            t,
        ]);

        // Client-side sort toggle for machines list
        const displayedMachines = useMemo(() => {
            if (sortByError) {
                return [...machinesList].sort(
                    (a, b) => (b.totalDowntimeMinutes || 0) - (a.totalDowntimeMinutes || 0)
                );
            }
            return [...machinesList].sort((a, b) => a.machineName.localeCompare(b.machineName));
        }, [machinesList, sortByError]);

        const machinesWithErrorCount = useMemo(() => {
            return machinesList.filter((m) => (m.totalDowntimeMinutes || 0) > 0).length;
        }, [machinesList]);

        // Reset state upon modal open/close
        useEffect(() => {
            if (!isOpen) {
                setSelectedMachine(null);
                setSelectedMachineInfo(null);
                setIncidents([]);
                setSearchText('');
                setDebouncedSearch('');
                setSelectedWorkshopId('all');
                setErrorDateRange(null);
                setMobileActiveView('list');
                setPlantTotalDowntimeMinutes(0);
                return;
            }

            if (isSingleMachineMode) {
                setMobileActiveView('detail');
            }
        }, [isOpen, isSingleMachineMode]);

        // Reset workshop filter when spaceId changes
        useEffect(() => {
            setSelectedWorkshopId('all');
            setSelectedMachine(null);
            setSelectedMachineInfo(null);
        }, [spaceId]);

        // Fetch Machine Details & Incident History (Right Column)
        useEffect(() => {
            if (!isOpen || !selectedMachine) {
                setSelectedMachineInfo(null);
                setIncidents([]);
                return;
            }

            let isMounted = true;

            const fetchIncidents = async () => {
                setLoadingIncidents(true);
                try {
                    let res;

                    if (errorDateRange && errorDateRange[0] && errorDateRange[1]) {
                        res = await DowntimeService.getMachineIncidentsByDateRange({
                            machineId: selectedMachine.machineId,
                            startDate: errorDateRange[0].format('YYYY-MM-DD'),
                            endDate: errorDateRange[1].format('YYYY-MM-DD'),
                            page: 0,
                            size: 100,
                        });
                    } else if (isDateRange) {
                        res = await DowntimeService.getMachineIncidentsByDateRange({
                            machineId: selectedMachine.machineId,
                            startDate,
                            endDate,
                            page: 0,
                            size: 100,
                        });
                    } else {
                        res = await DowntimeService.getMachineIncidentsByFilter({
                            machineId: selectedMachine.machineId,
                            filterId: filterId ?? 1,
                            page: 0,
                            size: 100,
                        });
                    }

                    if (!isMounted) return;

                    if (res?.machineInfo) {
                        setSelectedMachineInfo(res.machineInfo);
                    } else {
                        setSelectedMachineInfo({
                            machineId: selectedMachine.machineId,
                            machineCode: selectedMachine.machineCode,
                            machineName: selectedMachine.machineName,
                            location: selectedMachine.location,
                            totalDowntimeMinutes: selectedMachine.totalDowntimeMinutes,
                            formattedTotalDowntime: selectedMachine.formattedDowntime,
                            totalIncidents: res?.page?.totalElements ?? 0,
                        });
                    }

                    setIncidents(res?.page?.content || []);
                } catch (error: unknown) {
                    if (!isMounted) return;
                    console.error('Error fetching machine incidents:', error);
                    toast.error(
                        (error as Error)?.message ||
                            t('common.errorOccurred', 'Không thể tải lịch sử sự cố thiết bị')
                    );
                    setIncidents([]);
                } finally {
                    if (isMounted) {
                        setLoadingIncidents(false);
                    }
                }
            };

            fetchIncidents();

            return () => {
                isMounted = false;
            };
        }, [
            isOpen,
            selectedMachine?.machineId,
            filterId,
            startDate,
            endDate,
            isDateRange,
            errorDateRange,
            t,
        ]);

        // Machine selection handler
        const handleSelectMachine = useCallback(
            (machine: DowntimeMachineRollupItem) => {
                setSelectedMachine(machine);
                setErrorDateRange(null);
                if (isMobile) {
                    setMobileActiveView('detail');
                }
            },
            [isMobile]
        );

        const handleToggleSort = useCallback(() => {
            setSortByError((prev) => !prev);
        }, []);

        const handleSearchTextChange = useCallback((text: string) => {
            setSearchText(text);
        }, []);

        const handleWorkshopChange = useCallback((wsId: number | 'all') => {
            setSelectedWorkshopId(wsId);
        }, []);

        // Lock inner date picker strictly within outer startDate and endDate if in date range mode
        const disabledDate = useCallback(
            (current: Dayjs) => {
                if (!current) return false;
                if (isDateRange) {
                    if (startDate && current.isBefore(dayjs(startDate).startOf('day'))) {
                        return true;
                    }
                    if (endDate && current.isAfter(dayjs(endDate).endOf('day'))) {
                        return true;
                    }
                }
                return false;
            },
            [isDateRange, startDate, endDate]
        );

        const resolvedSpaceName = useMemo(() => {
            return currentSpace?.spaceName || fetchedSpaceName || spaceData?.spaceName || '';
        }, [currentSpace?.spaceName, fetchedSpaceName, spaceData?.spaceName]);

        const selectedWorkshopName = useMemo(() => {
            if (activeSelectedWorkshop) {
                return activeSelectedWorkshop.spaceName;
            }
            if (!selectedMachine) return '';
            const ws = machineWorkshopMap.get(selectedMachine.machineId);
            if (ws?.name) return ws.name;
            if (selectedMachine.location) {
                return selectedMachine.location.split('-')[1]?.trim() || selectedMachine.location;
            }
            return '';
        }, [activeSelectedWorkshop, selectedMachine, machineWorkshopMap]);

        const formattedPlantDowntime = useMemo(() => {
            return formatMinutesToDuration(plantTotalDowntimeMinutes);
        }, [plantTotalDowntimeMinutes]);

        return (
            <Modal
                title={
                    <ModalHeader
                        isSingleMachineMode={isSingleMachineMode}
                        machineName={
                            selectedMachineInfo?.machineName || selectedMachine?.machineName
                        }
                        machineId={selectedMachineInfo?.machineCode || selectedMachine?.machineId}
                        formattedTotalDowntime={
                            selectedMachineInfo?.formattedTotalDowntime ||
                            selectedMachine?.formattedDowntime
                        }
                        plantTotalDowntime={
                            plantTotalDowntimeMinutes > 0 ? formattedPlantDowntime : undefined
                        }
                        spaceName={resolvedSpaceName}
                        workshopName={selectedWorkshopName}
                        isDateRange={isDateRange}
                        startDate={startDate}
                        endDate={endDate}
                        totalMachinesCount={totalAffectedCount || displayedMachines.length}
                        isMobile={isMobile}
                    />
                }
                open={isOpen}
                onCancel={onClose}
                footer={null}
                width={isSingleMachineMode ? (isMobile ? '95%' : 1080) : '95%'}
                centered
                style={{
                    maxWidth: isSingleMachineMode ? 1080 : 1440,
                    top: isMobile ? 12 : 20,
                    paddingBottom: 0,
                }}
                styles={{
                    body: {
                        height: isMobile ? 'calc(90vh - 70px)' : 'calc(88vh - 90px)',
                        minHeight: isMobile ? 480 : 640,
                        overflow: 'hidden',
                        padding: isMobile ? '10px 12px 14px' : '10px 20px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
                destroyOnHidden
            >
                {loadingMachines && machinesList.length === 0 ? (
                    <div
                        style={{
                            height: '100%',
                            display: isMobile ? 'flex' : 'grid',
                            flexDirection: isMobile ? 'column' : 'row',
                            gridTemplateColumns: isMobile ? undefined : '36% 64%',
                            gap: 20,
                            paddingTop: 16,
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Skeleton.Input active block size="large" style={{ height: 38 }} />
                            <Skeleton active paragraph={{ rows: 12 }} />
                        </div>
                        <div
                            style={{
                                paddingLeft: isMobile ? 0 : 20,
                                borderLeft: isMobile
                                    ? 'none'
                                    : `1px solid ${token.colorBorderSecondary}`,
                                borderTop: isMobile
                                    ? `1px solid ${token.colorBorderSecondary}`
                                    : 'none',
                                paddingTop: isMobile ? 20 : 0,
                            }}
                        >
                            <Skeleton active paragraph={{ rows: 14 }} />
                        </div>
                    </div>
                ) : isMobile ? (
                    /* MOBILE MASTER-DETAIL LAYOUT */
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            minHeight: 0,
                            flex: 1,
                            overflow: 'hidden',
                        }}
                    >
                        {!isSingleMachineMode && (
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Segmented: {
                                            itemSelectedBg: token.colorPrimary,
                                            itemSelectedColor: token.colorWhite,
                                            itemHoverColor: token.colorPrimary,
                                            itemActiveBg: token.colorPrimaryActive,
                                            trackBg: token.colorFillAlter,
                                            trackPadding: 3,
                                        },
                                    },
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 10,
                                        flexShrink: 0,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusLG,
                                        padding: 2,
                                        backgroundColor: token.colorFillAlter,
                                    }}
                                >
                                    <Segmented
                                        block
                                        size="middle"
                                        value={mobileActiveView}
                                        onChange={(v) =>
                                            setMobileActiveView(v as 'list' | 'detail')
                                        }
                                        options={[
                                            {
                                                value: 'list',
                                                icon: (
                                                    <UnorderedListOutlined
                                                        style={{
                                                            fontSize: 13,
                                                            color:
                                                                mobileActiveView === 'list'
                                                                    ? token.colorWhite
                                                                    : token.colorTextSecondary,
                                                        }}
                                                    />
                                                ),
                                                label: (
                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight:
                                                                mobileActiveView === 'list'
                                                                    ? 600
                                                                    : 400,
                                                            color:
                                                                mobileActiveView === 'list'
                                                                    ? token.colorWhite
                                                                    : token.colorText,
                                                        }}
                                                    >
                                                        {t(
                                                            'productionOverview.downtimeModal.deviceList'
                                                        )}{' '}
                                                        ({displayedMachines.length})
                                                    </span>
                                                ),
                                            },
                                            {
                                                value: 'detail',
                                                disabled: !selectedMachine,
                                                icon: (
                                                    <FileTextOutlined
                                                        style={{
                                                            fontSize: 13,
                                                            color:
                                                                mobileActiveView === 'detail'
                                                                    ? token.colorWhite
                                                                    : token.colorTextSecondary,
                                                        }}
                                                    />
                                                ),
                                                label: (
                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight:
                                                                mobileActiveView === 'detail'
                                                                    ? 600
                                                                    : 400,
                                                            color:
                                                                mobileActiveView === 'detail'
                                                                    ? token.colorWhite
                                                                    : token.colorText,
                                                        }}
                                                    >
                                                        {t(
                                                            'productionOverview.downtimeModal.incidentHistory'
                                                        )}
                                                    </span>
                                                ),
                                            },
                                        ]}
                                    />
                                </div>
                            </ConfigProvider>
                        )}

                        {mobileActiveView === 'list' && !isSingleMachineMode ? (
                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    height: '100%',
                                    overflow: 'hidden',
                                }}
                            >
                                <MachineListSidebar
                                    filteredSummaryData={displayedMachines}
                                    selectedMachineId={selectedMachine?.machineId || null}
                                    onSelectMachine={handleSelectMachine}
                                    searchText={searchText}
                                    onSearchTextChange={handleSearchTextChange}
                                    selectedWorkshopId={selectedWorkshopId}
                                    onWorkshopChange={handleWorkshopChange}
                                    workshopOptions={workshopOptions}
                                    sortByError={sortByError}
                                    onToggleSort={handleToggleSort}
                                    machinesWithErrorCount={machinesWithErrorCount}
                                    machineWorkshopMap={machineWorkshopMap}
                                    isMobile={isMobile}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    overflow: 'hidden',
                                }}
                            >
                                {!isSingleMachineMode && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingBottom: 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ArrowLeftOutlined />}
                                            onClick={() => setMobileActiveView('list')}
                                            style={{
                                                fontWeight: 500,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                color: token.colorPrimary,
                                                borderRadius: token.borderRadiusSM,
                                                backgroundColor: token.colorPrimaryBg,
                                                padding: '4px 10px',
                                                height: 28,
                                            }}
                                        >
                                            {t('productionOverview.downtimeModal.backToList')}
                                        </Button>
                                        <Tag
                                            color="blue"
                                            bordered={false}
                                            style={{
                                                margin: 0,
                                                borderRadius: 10,
                                                fontSize: 11,
                                            }}
                                        >
                                            {displayedMachines.findIndex(
                                                (m) => m.machineId === selectedMachine?.machineId
                                            ) + 1}{' '}
                                            / {displayedMachines.length}
                                        </Tag>
                                    </div>
                                )}

                                {selectedMachineInfo || selectedMachine ? (
                                    <>
                                        <MachineHeroHeader
                                            machineInfo={
                                                selectedMachineInfo || {
                                                    machineId: selectedMachine!.machineId,
                                                    machineCode: selectedMachine!.machineCode,
                                                    machineName: selectedMachine!.machineName,
                                                    location: selectedMachine!.location,
                                                    totalDowntimeMinutes:
                                                        selectedMachine!.totalDowntimeMinutes,
                                                    formattedTotalDowntime:
                                                        selectedMachine!.formattedDowntime,
                                                    totalIncidents: incidents.length,
                                                }
                                            }
                                            workshopName={selectedWorkshopName}
                                            isXs={isXs}
                                            isMobile={isMobile}
                                        />
                                        <IncidentHistoryTable
                                            incidents={incidents}
                                            totalIncidents={selectedMachineInfo?.totalIncidents}
                                            loading={loadingIncidents}
                                            errorDateRange={errorDateRange}
                                            onErrorDateRangeChange={setErrorDateRange}
                                            disabledDate={disabledDate}
                                            startDate={startDate}
                                            endDate={endDate}
                                            isMobile={isMobile}
                                        />
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                        }}
                                    >
                                        <Empty
                                            description={t(
                                                'productionOverview.downtimeModal.selectMachinePrompt'
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* DESKTOP SPLIT LAYOUT */
                    <div
                        style={{
                            display: isSingleMachineMode ? 'flex' : 'grid',
                            gridTemplateColumns: isSingleMachineMode ? undefined : '36% 64%',
                            gap: isSingleMachineMode ? 0 : 20,
                            height: '100%',
                            paddingTop: 4,
                            width: '100%',
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        {/* LEFT PANE: Machine Directory Table (Plant-wide mode only) */}
                        {!isSingleMachineMode && (
                            <MachineListSidebar
                                filteredSummaryData={displayedMachines}
                                selectedMachineId={selectedMachine?.machineId || null}
                                onSelectMachine={handleSelectMachine}
                                searchText={searchText}
                                onSearchTextChange={handleSearchTextChange}
                                selectedWorkshopId={selectedWorkshopId}
                                onWorkshopChange={handleWorkshopChange}
                                workshopOptions={workshopOptions}
                                sortByError={sortByError}
                                onToggleSort={handleToggleSort}
                                machinesWithErrorCount={machinesWithErrorCount}
                                machineWorkshopMap={machineWorkshopMap}
                                isMobile={isMobile}
                            />
                        )}

                        {/* RIGHT PANE: Selected Machine Details & Incident Table */}
                        <div
                            style={{
                                borderLeft: isSingleMachineMode
                                    ? 'none'
                                    : `1px solid ${token.colorBorderSecondary}`,
                                paddingLeft: isSingleMachineMode ? 0 : 20,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                minHeight: 0,
                                overflow: 'hidden',
                                gap: 12,
                                width: isSingleMachineMode ? '100%' : undefined,
                                flex: isSingleMachineMode ? 1 : undefined,
                            }}
                        >
                            {selectedMachineInfo || selectedMachine ? (
                                <>
                                    <MachineHeroHeader
                                        machineInfo={
                                            selectedMachineInfo || {
                                                machineId: selectedMachine!.machineId,
                                                machineCode: selectedMachine!.machineCode,
                                                machineName: selectedMachine!.machineName,
                                                location: selectedMachine!.location,
                                                totalDowntimeMinutes:
                                                    selectedMachine!.totalDowntimeMinutes,
                                                formattedTotalDowntime:
                                                    selectedMachine!.formattedDowntime,
                                                totalIncidents: incidents.length,
                                            }
                                        }
                                        workshopName={selectedWorkshopName}
                                        isXs={isXs}
                                        isMobile={isMobile}
                                    />
                                    <IncidentHistoryTable
                                        incidents={incidents}
                                        totalIncidents={selectedMachineInfo?.totalIncidents}
                                        loading={loadingIncidents}
                                        errorDateRange={errorDateRange}
                                        onErrorDateRangeChange={setErrorDateRange}
                                        disabledDate={disabledDate}
                                        startDate={startDate}
                                        endDate={endDate}
                                        isMobile={isMobile}
                                    />
                                </>
                            ) : (
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                    }}
                                >
                                    <Empty
                                        description={t(
                                            'productionOverview.downtimeModal.selectMachinePrompt'
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        );
    }
);

ErrorAnalyticsModal.displayName = 'ErrorAnalyticsModal';

export default ErrorAnalyticsModal;
