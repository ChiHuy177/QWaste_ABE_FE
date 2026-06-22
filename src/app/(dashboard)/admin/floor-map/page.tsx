'use client';

import {
    ExclamationCircleOutlined,
    PartitionOutlined,
    ReloadOutlined,
    SaveOutlined,
    UndoOutlined,
} from '@ant-design/icons';
import { Alert, Button, Empty, Grid, Spin, Space, Tag, theme } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    mapSpaceTreeToTreeSelect,
    SpaceTreeSelect,
} from '@/components/shared/filters/SpaceTreeSelect';
import { useAbility } from '@/contexts/AbilityContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FloorMapService } from '@/services/FloorMapService';
import { SpaceService } from '@/services/SpaceService';
import {
    FloorMapMachineResponse,
    MachineFloorPositionRequest,
} from '@/types/FloorMap';
import { FloorMapCanvasShell } from './_components/FloorMapCanvasShell';
import { MachineListPanel } from './_components/MachineListPanel';
import { getDefaultMachinePosition, isMachinePlaced } from './_utils/floorMapRatio';

type DraftPositions = Record<string, MachineFloorPositionRequest>;

const FLOOR_MAP_SPACE_FROM_LEVEL = 1;
const FLOOR_MAP_SPACE_TO_LEVEL = 2;

const FloorMapPage = () => {
    const { t } = useTranslation();
    const screens = Grid.useBreakpoint();
    const { token } = theme.useToken();
    const router = useRouter();
    const ability = useAbility();
    const queryClient = useQueryClient();
    const title = t('floorMap.title');
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | undefined>();
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [draftPositions, setDraftPositions] = useState<DraftPositions>({});

    usePageTitle(title);

    const floorMapQuery = useQuery({
        queryKey: ['floor-map', selectedSpaceId],
        queryFn: () => FloorMapService.getFloorMap(selectedSpaceId!),
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

    const invalidateFloorMap = () =>
        queryClient.invalidateQueries({ queryKey: ['floor-map', selectedSpaceId] });

    const saveDraftMutation = useMutation({
        mutationFn: ({ spaceId, positions }: { spaceId: number; positions: DraftPositions }) =>
            Promise.all(
                Object.entries(positions).map(([machineId, position]) =>
                    FloorMapService.upsertMachinePosition(spaceId, machineId, position)
                )
            ),
        onSuccess: async (_data, variables) => {
            if (selectedSpaceId === variables.spaceId) {
                setDraftPositions({});
            }
            await queryClient.invalidateQueries({ queryKey: ['floor-map', variables.spaceId] });
            toast.success(t('floorMap.messages.positionsSaved'));
        },
        onError: () => {
            toast.error(t('floorMap.messages.positionSaveFailed'));
        },
    });

    const deletePositionMutation = useMutation({
        mutationFn: (machineId: string) =>
            FloorMapService.deleteMachinePosition(selectedSpaceId!, machineId),
        onSuccess: async (_data, machineId) => {
            setDraftPositions((prev) => {
                const next = { ...prev };
                delete next[machineId];
                return next;
            });
            if (selectedMachineId === machineId) {
                setSelectedMachineId(null);
            }
            await invalidateFloorMap();
            toast.success(t('floorMap.messages.positionRemoved'));
        },
        onError: () => {
            toast.error(t('floorMap.messages.positionRemoveFailed'));
        },
    });

    const floorMap = floorMapQuery.data;
    const spaceTree = spaceTreeQuery.data ?? [];
    const spaceTreeSelectData = useMemo(() => mapSpaceTreeToTreeSelect(spaceTree), [spaceTree]);
    const displayedMachines = useMemo(
        () =>
            floorMap?.machines.map((machine) => {
                const draftPosition = draftPositions[machine.machineId];

                return draftPosition ? { ...machine, ...draftPosition } : machine;
            }) ?? [],
        [draftPositions, floorMap?.machines]
    );
    const displayedFloorMap = useMemo(
        () => (floorMap ? { ...floorMap, machines: displayedMachines } : undefined),
        [displayedMachines, floorMap]
    );
    const placedCount = useMemo(
        () => displayedMachines.filter(isMachinePlaced).length,
        [displayedMachines]
    );
    const draftCount = useMemo(() => Object.keys(draftPositions).length, [draftPositions]);
    const hasDraftChanges = draftCount > 0;
    const isMobile = !screens.md;
    const canManageSpaces = ability.can('view', 'space');
    const canManageMachines = ability.can('view', 'machine');

    const handleSpaceChange = (spaceId: number | string | undefined | null) => {
        setSelectedSpaceId(spaceId != null ? Number(spaceId) : undefined);
        setSelectedMachineId(null);
        setDraftPositions({});
    };

    const handlePlaceMachine = (machine: FloorMapMachineResponse) => {
        if (selectedSpaceId === undefined) return;

        setSelectedMachineId(machine.machineId);
        setDraftPositions((prev) => ({
            ...prev,
            [machine.machineId]: getDefaultMachinePosition(placedCount),
        }));
    };

    const handleUpdateMachine = (machineId: string, position: MachineFloorPositionRequest) => {
        if (selectedSpaceId === undefined) return;

        setSelectedMachineId(machineId);
        setDraftPositions((prev) => ({
            ...prev,
            [machineId]: position,
        }));
    };

    const handleSaveDrafts = () => {
        if (selectedSpaceId === undefined || !hasDraftChanges) return;

        saveDraftMutation.mutate({
            spaceId: selectedSpaceId,
            positions: { ...draftPositions },
        });
    };

    const handleResetDrafts = () => {
        const originalSelectedMachine = floorMap?.machines.find(
            (machine) => machine.machineId === selectedMachineId
        );

        if (!originalSelectedMachine || !isMachinePlaced(originalSelectedMachine)) {
            setSelectedMachineId(null);
        }

        setDraftPositions({});
    };

    const handleRemoveMachine = (machine: FloorMapMachineResponse) => {
        if (selectedSpaceId === undefined) return;

        const originalMachine = floorMap?.machines.find(
            (item) => item.machineId === machine.machineId
        );

        if (!originalMachine || !isMachinePlaced(originalMachine)) {
            setDraftPositions((prev) => {
                const next = { ...prev };
                delete next[machine.machineId];
                return next;
            });

            if (selectedMachineId === machine.machineId) {
                setSelectedMachineId(null);
            }
            return;
        }

        deletePositionMutation.mutate(machine.machineId);
    };

    const headerActions = (
        <Space
            orientation={isMobile ? 'vertical' : 'horizontal'}
            size={8}
            style={{ width: isMobile ? '100%' : undefined }}
        >
            <Space wrap style={{ width: isMobile ? '100%' : undefined }}>
                <SpaceTreeSelect
                    autoSelectFirst
                    autoSelectFirstChild
                    treeData={spaceTreeSelectData}
                    value={selectedSpaceId}
                    onChange={handleSpaceChange}
                    placeholder={t('floorMap.filters.selectSpace')}
                    disabled={spaceTreeQuery.isLoading}
                    style={{ width: isMobile ? '100%' : 280 }}
                />
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => floorMapQuery.refetch()}
                    loading={floorMapQuery.isFetching}
                    disabled={selectedSpaceId === undefined || saveDraftMutation.isPending}
                >
                    {t('common.refresh')}
                </Button>
            </Space>

            <Space
                wrap
                size={8}
                style={{
                    width: isMobile ? '100%' : undefined,
                    justifyContent: isMobile ? 'flex-end' : undefined,
                }}
            >
                {hasDraftChanges && (
                    <Tag
                        icon={<ExclamationCircleOutlined />}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: isMobile ? 'center' : undefined,
                            gap: 6,
                            width: isMobile ? '100%' : undefined,
                            height: 32,
                            marginInlineEnd: 0,
                            padding: '0 10px',
                            borderColor: token.colorWarningBorder,
                            borderRadius: token.borderRadiusSM,
                            background: token.colorWarningBg,
                            color: token.colorWarning,
                            fontWeight: 500,
                            lineHeight: '30px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {t('floorMap.draft.unsavedChanges', { count: draftCount })}
                    </Tag>
                )}
                <Button
                    icon={<UndoOutlined />}
                    onClick={handleResetDrafts}
                    disabled={!hasDraftChanges || saveDraftMutation.isPending}
                    style={{ flex: isMobile ? '1 1 140px' : undefined }}
                >
                    {t('floorMap.actions.resetChanges')}
                </Button>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveDrafts}
                    loading={saveDraftMutation.isPending}
                    disabled={!hasDraftChanges || selectedSpaceId === undefined}
                    style={{ flex: isMobile ? '1 1 140px' : undefined }}
                >
                    {t('floorMap.actions.saveChanges')}
                </Button>
            </Space>
        </Space>
    );

    const removingMachineId = deletePositionMutation.isPending
        ? deletePositionMutation.variables ?? null
        : null;

    return (
        <>
            <ResponsivePageHeader
                title={title}
                icon={<PartitionOutlined />}
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
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 12 : 16,
                        height: isMobile ? 'auto' : 'calc(100vh - 180px)',
                        minHeight: isMobile ? undefined : 540,
                        minWidth: 0,
                    }}
                >
                    <MachineListPanel
                        machines={displayedMachines}
                        selectedMachineId={selectedMachineId}
                        placingMachineId={null}
                        removingMachineId={removingMachineId}
                        isMobile={isMobile}
                        style={{ order: isMobile ? 2 : 2 }}
                        emptyAction={
                            canManageMachines ? (
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() =>
                                        router.push(
                                            `/admin/categories/machineList?createForSpaceId=${selectedSpaceId}`
                                        )
                                    }
                                >
                                    {t('floorMap.machines.goToMachineList')}
                                </Button>
                            ) : undefined
                        }
                        onSelectMachine={setSelectedMachineId}
                        onPlaceMachine={handlePlaceMachine}
                        onRemoveMachine={handleRemoveMachine}
                    />

                    <main
                        style={{
                            flex: isMobile ? 'none' : 1,
                            order: isMobile ? 1 : 1,
                            width: '100%',
                            height: isMobile ? '56vh' : '100%',
                            minHeight: isMobile ? 340 : undefined,
                            minWidth: 0,
                        }}
                    >
                        {displayedFloorMap?.floorPlanImageUrl ? (
                            <FloorMapCanvasShell
                                floorMap={displayedFloorMap}
                                selectedMachineId={selectedMachineId}
                                savingMachineId={
                                    saveDraftMutation.isPending ? selectedMachineId : null
                                }
                                initialZoom={1.3}
                                minHeight={isMobile ? 340 : 420}
                                onSelectMachine={setSelectedMachineId}
                                onUpdateMachine={handleUpdateMachine}
                                onDropMachine={handleUpdateMachine}
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
                                >
                                    {canManageSpaces && (
                                        <Button
                                            type="primary"
                                            onClick={() =>
                                                router.push(
                                                    `/admin/categories/space?editSpaceId=${selectedSpaceId}`
                                                )
                                            }
                                        >
                                            {t('floorMap.empty.goToSpaceConfig')}
                                        </Button>
                                    )}
                                </Empty>
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <Empty description={t('floorMap.empty.title')} style={{ padding: '80px 0' }} />
            )}
        </>
    );
};

export default FloorMapPage;
