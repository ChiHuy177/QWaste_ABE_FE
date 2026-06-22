'use client';

import {
    DesktopOutlined,
    EyeOutlined,
    ReloadOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Drawer,
    Empty,
    Grid,
    Select,
    Space,
    Spin,
    Tooltip,
    theme,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    mapSpaceTreeToTreeSelect,
    SpaceTreeSelect,
} from '@/components/shared/filters/SpaceTreeSelect';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FloorMapService } from '@/services/FloorMapService';
import { MachineService } from '@/services/MachineService';
import { SpaceService } from '@/services/SpaceService';
import { FloorMapStatusResponse } from '@/types/FloorMap';
import { currentStatus } from '@/types/Machine';
import MachineTimelineModal from '@/app/(dashboard)/admin/machines/_components/MachineTimelineModal';
import { FloorMapCanvasShell } from '../_components/FloorMapCanvasShell';
import { FloorMapStatusMachinePanel } from '../_components/FloorMapStatusMachinePanel';
import { isMachinePlaced } from '../_utils/floorMapRatio';

const BATCH_DELAY = 200;
const FLOOR_MAP_SPACE_FROM_LEVEL = 1;
const FLOOR_MAP_SPACE_TO_LEVEL = 2;

type StatusFilter = 'all' | currentStatus;
type SpaceTreeNode = {
    spaceId: number;
    children?: SpaceTreeNode[];
};

const STATUS_ORDER: currentStatus[] = [
    'RUNTIME',
    'IDLE',
    'ERROR',
    'WARNING',
    'TEMPORARY_STOP',
    'OPEN_DOOR',
    'COMPLETE',
    'OFFLINE',
    'UNKNOWN',
];

const findRootSpaceIdBySpaceId = (
    spaces: SpaceTreeNode[],
    targetSpaceId: number
): number | null => {
    const visit = (space: SpaceTreeNode, rootSpaceId: number): number | null => {
        if (space.spaceId === targetSpaceId) return rootSpaceId;

        for (const child of space.children ?? []) {
            const matchedRootId = visit(child, rootSpaceId);
            if (matchedRootId !== null) return matchedRootId;
        }

        return null;
    };

    for (const rootSpace of spaces) {
        const matchedRootId = visit(rootSpace, rootSpace.spaceId);
        if (matchedRootId !== null) return matchedRootId;
    }

    return null;
};

const FloorMapStatusPage = () => {
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const { token } = theme.useToken();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { wsService, isConnected: wsConnected } = useWebSocketContext();
    const title = t('floorMap.viewTitle');
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | undefined>();
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [machineListOpen, setMachineListOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [machineDetailModalOpen, setMachineDetailModalOpen] = useState(false);

    const pendingStatusRef = useRef<Map<string, currentStatus>>(new Map());
    const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const firstBatchTimeRef = useRef<number | null>(null);
    const subscribedMachinesRef = useRef<Map<string, () => void>>(new Map());

    usePageTitle(title);

    const floorMapQuery = useQuery({
        queryKey: ['floor-map-status', selectedSpaceId],
        queryFn: () => FloorMapService.getFloorMapStatus(selectedSpaceId!),
        enabled: selectedSpaceId !== undefined,
    });

    const spaceTreeQuery = useQuery({
        queryKey: ['spaces', 'level-range', FLOOR_MAP_SPACE_FROM_LEVEL, FLOOR_MAP_SPACE_TO_LEVEL],
        queryFn: () =>
            SpaceService.getSpacesFromLevelToLevel(
                FLOOR_MAP_SPACE_FROM_LEVEL,
                FLOOR_MAP_SPACE_TO_LEVEL
            ),
        refetchOnMount: 'always',
    });

    const machineDetailQuery = useQuery({
        queryKey: ['machine-overview-current-shift', selectedMachineId],
        queryFn: () => MachineService.getMachineOverviewByCurrentShift(selectedMachineId!),
        enabled: machineDetailModalOpen && Boolean(selectedMachineId),
    });

    const floorMap = floorMapQuery.data;
    const spaceTree = spaceTreeQuery.data ?? [];
    const machines = floorMap?.machines ?? [];
    const placedMachines = useMemo(() => machines.filter(isMachinePlaced), [machines]);
    const isMobile = !screens.md;

    const spaceTreeSelectData = useMemo(() => mapSpaceTreeToTreeSelect(spaceTree), [spaceTree]);
    const selectedRootSpaceId = useMemo(() => {
        if (selectedSpaceId === undefined) return undefined;
        return findRootSpaceIdBySpaceId(spaceTree, selectedSpaceId) ?? selectedSpaceId;
    }, [selectedSpaceId, spaceTree]);

    const statusOptions = useMemo(() => {
        const presentStatuses = new Set(placedMachines.map((machine) => machine.currentStatus));

        return [
            { label: t('floorMap.machines.filters.all'), value: 'all' },
            ...STATUS_ORDER.filter((status) => presentStatuses.has(status)).map((status) => ({
                label: t(`floorMap.status.${status}`, { defaultValue: status }),
                value: status,
            })),
        ];
    }, [placedMachines, t]);

    const visibleMachines = useMemo(() => {
        return machines.filter((machine) => {
            return (
                statusFilter === 'all' ||
                (isMachinePlaced(machine) && machine.currentStatus === statusFilter)
            );
        });
    }, [machines, statusFilter]);

    const visibleFloorMap = useMemo(
        () => (floorMap ? { ...floorMap, machines: visibleMachines } : undefined),
        [floorMap, visibleMachines]
    );

    useEffect(() => {
        if (
            selectedMachineId &&
            !visibleMachines.some((machine) => machine.machineId === selectedMachineId)
        ) {
            setSelectedMachineId(null);
            setMachineDetailModalOpen(false);
        }
    }, [selectedMachineId, visibleMachines]);

    const handleSpaceChange = (spaceId: number | string | undefined | null) => {
        setSelectedSpaceId(spaceId != null ? Number(spaceId) : undefined);
        setSelectedMachineId(null);
        setMachineListOpen(false);
        setMachineDetailModalOpen(false);
        setStatusFilter('all');
        pendingStatusRef.current.clear();
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        firstBatchTimeRef.current = null;
    };

    const handleSelectMachine = useCallback(
        (machineId: string) => {
            setSelectedMachineId(machineId);
            setMachineDetailModalOpen(true);
            if (isMobile) {
                setMachineListOpen(false);
            }
        },
        [isMobile]
    );

    const handleSelectMachineOnCanvas = useCallback((machineId: string | null) => {
        setSelectedMachineId(machineId);
        if (machineId) {
            setMachineDetailModalOpen(true);
        }
    }, []);

    const flushStatusUpdates = useCallback(() => {
        if (pendingStatusRef.current.size === 0) return;

        const updates = new Map(pendingStatusRef.current);
        pendingStatusRef.current.clear();
        firstBatchTimeRef.current = null;

        queryClient.setQueryData<FloorMapStatusResponse>(
            ['floor-map-status', selectedSpaceId],
            (prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    machines: prev.machines.map((machine) => {
                        const newStatus = updates.get(machine.machineId);
                        return newStatus && newStatus !== machine.currentStatus
                            ? { ...machine, currentStatus: newStatus }
                            : machine;
                    }),
                };
            }
        );
    }, [queryClient, selectedSpaceId]);

    const scheduleStatusUpdate = useCallback(
        (machineId: string, newStatus: currentStatus) => {
            pendingStatusRef.current.set(machineId, newStatus);

            if (!firstBatchTimeRef.current) {
                firstBatchTimeRef.current = Date.now();
            }

            if (batchTimerRef.current) {
                clearTimeout(batchTimerRef.current);
            }

            const elapsed = Date.now() - firstBatchTimeRef.current;
            const remaining = Math.max(0, BATCH_DELAY - elapsed);

            if (remaining === 0) {
                flushStatusUpdates();
                return;
            }

            batchTimerRef.current = setTimeout(flushStatusUpdates, Math.min(50, remaining));
        },
        [flushStatusUpdates]
    );

    useEffect(() => {
        if (!wsConnected || !floorMap?.machines) {
            subscribedMachinesRef.current.forEach((unsub) => unsub());
            subscribedMachinesRef.current.clear();
            return;
        }

        const neededIds = new Set(floorMap.machines.map((machine) => machine.machineId));

        subscribedMachinesRef.current.forEach((unsub, machineId) => {
            if (!neededIds.has(machineId)) {
                unsub();
                subscribedMachinesRef.current.delete(machineId);
            }
        });

        neededIds.forEach((machineId) => {
            if (subscribedMachinesRef.current.has(machineId)) return;

            const unsub = wsService.subscribe<{
                type: string;
                payload: {
                    machineId: string;
                    data: { newStatus: currentStatus };
                };
            }>(`/topic/machines/status/${machineId}`, (message) => {
                if (message.type !== 'DATA') return;

                const { machineId: id, data } = message.payload;
                if (id && data?.newStatus) {
                    scheduleStatusUpdate(id, data.newStatus);
                }
            });

            subscribedMachinesRef.current.set(machineId, unsub);
        });
    }, [floorMap?.machines, scheduleStatusUpdate, wsConnected, wsService]);

    useEffect(() => {
        return () => {
            subscribedMachinesRef.current.forEach((unsub) => unsub());
            subscribedMachinesRef.current.clear();
            if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        };
    }, []);

    const headerActions = isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <SpaceTreeSelect
                autoSelectFirst
                autoSelectFirstChild
                treeData={spaceTreeSelectData}
                value={selectedSpaceId}
                onChange={handleSpaceChange}
                placeholder={t('floorMap.filters.selectSpace')}
                disabled={spaceTreeQuery.isLoading}
                style={{ width: '100%' }}
            />
            <Select
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
                disabled={!floorMap}
                style={{ width: '100%' }}
            />
            <Button
                block
                icon={<ReloadOutlined />}
                onClick={() => floorMapQuery.refetch()}
                loading={floorMapQuery.isFetching}
                disabled={selectedSpaceId === undefined}
            >
                {t('common.refresh')}
            </Button>
            <Button
                block
                icon={<UnorderedListOutlined />}
                disabled={!floorMap}
                onClick={() => setMachineListOpen(true)}
            >
                {t('floorMap.machines.expandList')}
                {machines.length > 0 ? ` (${visibleMachines.length})` : ''}
            </Button>
            <Button
                block
                type="primary"
                icon={<DesktopOutlined />}
                disabled={selectedSpaceId === undefined}
                onClick={() =>
                    router.push(`/admin/space-monitoring?factoryId=${selectedRootSpaceId}`)
                }
            >
                {t('floorMap.statusSummary.viewDetails')}
            </Button>
        </div>
    ) : (
        <Space size={8}>
            <Space wrap>
                <SpaceTreeSelect
                    autoSelectFirst
                    autoSelectFirstChild
                    treeData={spaceTreeSelectData}
                    value={selectedSpaceId}
                    onChange={handleSpaceChange}
                    placeholder={t('floorMap.filters.selectSpace')}
                    disabled={spaceTreeQuery.isLoading}
                    style={{ width: 260 }}
                />
                <Select
                    value={statusFilter}
                    options={statusOptions}
                    onChange={setStatusFilter}
                    disabled={!floorMap}
                    style={{ width: 180 }}
                />
                <Tooltip title={t('common.refresh')}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => floorMapQuery.refetch()}
                        loading={floorMapQuery.isFetching}
                        disabled={selectedSpaceId === undefined}
                    />
                </Tooltip>
            </Space>
            <Space wrap>
                <Button
                    icon={<UnorderedListOutlined />}
                    disabled={!floorMap}
                    onClick={() => setMachineListOpen(true)}
                >
                    {t('floorMap.machines.expandList')}
                    {machines.length > 0 ? ` (${visibleMachines.length})` : ''}
                </Button>
                <Button
                    type="primary"
                    icon={<DesktopOutlined />}
                    disabled={selectedSpaceId === undefined}
                    onClick={() =>
                        router.push(`/admin/space-monitoring?factoryId=${selectedRootSpaceId}`)
                    }
                >
                    {t('floorMap.statusSummary.viewDetails')}
                </Button>
            </Space>
        </Space>
    );

    return (
        <>
            <ResponsivePageHeader
                title={title}
                icon={<EyeOutlined />}
                rightContent={headerActions}
            />

            {selectedSpaceId === undefined ? (
                <Empty description={t('floorMap.empty.selectSpace')} style={{ padding: '80px 0' }} />
            ) : floorMapQuery.isLoading ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <Spin size="large" />
                </div>
            ) : floorMapQuery.isError ? (
                <Alert
                    type="error"
                    showIcon
                    title={t('floorMap.messages.loadFailed')}
                    action={
                        <Button onClick={() => floorMapQuery.refetch()}>
                            {t('common.refresh')}
                        </Button>
                    }
                />
            ) : floorMap ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? 12 : 14,
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            height: isMobile ? 'auto' : 'calc(100vh - 220px)',
                            minHeight: isMobile ? undefined : 520,
                            minWidth: 0,
                        }}
                    >
                        <main
                            style={{
                                width: '100%',
                                height: isMobile ? '58vh' : '100%',
                                minHeight: isMobile ? 340 : undefined,
                                minWidth: 0,
                            }}
                        >
                            {floorMap.floorPlanImageUrl ? (
                                <FloorMapCanvasShell
                                    readOnly
                                    floorMap={visibleFloorMap ?? floorMap}
                                    selectedMachineId={selectedMachineId}
                                    savingMachineId={null}
                                    minHeight={isMobile ? 340 : 420}
                                    initialZoom={1.3}
                                    prominentSelection
                                    onSelectMachine={handleSelectMachineOnCanvas}
                                />
                            ) : (
                                <div
                                    style={{
                                        height: '100%',
                                        minHeight: isMobile ? 340 : undefined,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        borderRadius: token.borderRadiusLG,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: token.colorBgContainer,
                                    }}
                                >
                                    <Empty
                                        description={t('floorMap.empty.noImage')}
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </div>
                            )}
                        </main>
                    </div>

                    <Drawer
                        title={t('floorMap.machines.title')}
                        open={machineListOpen}
                        onClose={() => setMachineListOpen(false)}
                        placement={isMobile ? 'bottom' : 'right'}
                        size={isMobile ? "72vh" : 420}
                        styles={{
                            body: {
                                padding: 0,
                                display: 'flex',
                                minHeight: 0,
                            },
                        }}
                    >
                        <FloorMapStatusMachinePanel
                            machines={visibleMachines}
                            selectedMachineId={selectedMachineId}
                            isMobile={isMobile}
                            style={{
                                width: '100%',
                                maxWidth: 'none',
                                height: '100%',
                                maxHeight: 'none',
                                border: 'none',
                                borderRadius: 0,
                            }}
                            onSelectMachine={handleSelectMachine}
                        />
                    </Drawer>
                </div>
            ) : (
                <Empty description={t('floorMap.empty.title')} style={{ padding: '80px 0' }} />
            )}

            <MachineTimelineModal
                open={machineDetailModalOpen}
                onClose={() => setMachineDetailModalOpen(false)}
                machine={machineDetailQuery.data ?? null}
                loading={machineDetailQuery.isLoading}
            />
        </>
    );
};

export default FloorMapStatusPage;
