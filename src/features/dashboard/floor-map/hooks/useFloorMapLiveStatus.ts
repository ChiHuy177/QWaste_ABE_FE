import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { SpaceService } from '@/services/SpaceService';
import { IndustryFilter } from '@/types/IndustryFilter';
import { currentStatus, MachineStatusWsMessage, PressMode } from '@/types/Machine';
import { SpaceOverview } from '@/types/Space';

export interface FloorMapMachineLiveState {
    currentStatus?: currentStatus;
    mode?: PressMode | null;
}

type LiveStateMap = Record<string, FloorMapMachineLiveState>;

const floorMapLiveQueryKeys = {
    industryFiltersPicking: ['industryFilters', 'picking'] as const,
    spaceOverview: (spaceId: number | undefined, filterId: number | undefined) =>
        ['spaceOverview', spaceId, filterId] as const,
};

const pickDefaultFilterId = (filters: IndustryFilter[]): number | undefined =>
    (
        filters.find((f) => f.category === 'PERIOD' && f.periodCode === 'TODAY') ??
        filters.find((f) => f.category === 'PERIOD') ??
        filters[0]
    )?.filterId;

const flattenOverview = (space: SpaceOverview): LiveStateMap => {
    const result: LiveStateMap = {};
    const visit = (node: SpaceOverview) => {
        (node.machineChildren ?? []).forEach((machine) => {
            result[machine.machineId] = {
                currentStatus: machine.currentStatus,
                mode: machine.mode ?? null,
            };
        });
        (node.children ?? []).forEach(visit);
    };
    visit(space);
    return result;
};

export function useFloorMapLiveStatus(
    spaceId: number | undefined,
    machineIds: string[],
    enabled: boolean
): LiveStateMap {
    const { wsService, isConnected } = useWebSocketContext();
    const { handleError } = useApiErrorHandler();
    const [deltas, setDeltas] = useState<LiveStateMap>({});
    const wasConnectedRef = useRef(false);
    const hasConnectedRef = useRef(false);

    const filterIdQuery = useQuery({
        queryKey: floorMapLiveQueryKeys.industryFiltersPicking,
        queryFn: () => IndustryFilterService.getIndustryFiltersForPicking(),
        select: pickDefaultFilterId,
        enabled,
    });
    const filterId = filterIdQuery.data;

    const overviewQuery = useQuery({
        queryKey: floorMapLiveQueryKeys.spaceOverview(spaceId, filterId),
        queryFn: () => SpaceService.getSpaceOverview(spaceId!, filterId!),
        select: flattenOverview,
        enabled: enabled && spaceId !== undefined && filterId !== undefined,
    });
    const { refetch: refetchOverview, dataUpdatedAt } = overviewQuery;
    const queryError = filterIdQuery.error ?? overviewQuery.error;

    useEffect(() => {
        if (queryError) {
            handleError(queryError, { fallbackKey: 'floorMap.messages.liveStatusLoadFailed' });
        }
    }, [queryError, handleError]);

    useEffect(() => {
        setDeltas({});
    }, [dataUpdatedAt, spaceId]);

    useEffect(() => {
        if (!isConnected) {
            wasConnectedRef.current = false;
            return;
        }
        const isReconnect = hasConnectedRef.current && !wasConnectedRef.current;
        wasConnectedRef.current = true;
        hasConnectedRef.current = true;
        if (isReconnect && enabled && spaceId !== undefined && filterId !== undefined) {
            refetchOverview();
        }
    }, [isConnected, enabled, spaceId, filterId, refetchOverview]);

    const machineIdsKey = machineIds.join('|');

    useEffect(() => {
        if (!enabled || !isConnected || !machineIdsKey) return;

        const unsubscribes = machineIdsKey.split('|').map((id) =>
            wsService.subscribe<MachineStatusWsMessage>(
                `/topic/machines/status/${id}`,
                (message) => {
                    if (message.type !== 'DATA') return;
                    const { machineId, data } = message.payload;
                    if (!machineId || !data) return;
                    const { newStatus, mode } = data;
                    if (newStatus == null && mode == null) return;

                    setDeltas((prev) => ({
                        ...prev,
                        [machineId]: {
                            ...prev[machineId],
                            ...(newStatus != null && { currentStatus: newStatus }),
                            ...(mode != null && { mode }),
                        },
                    }));
                }
            )
        );

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, [enabled, isConnected, machineIdsKey, wsService]);

    const snapshot = overviewQuery.data;

    return useMemo(() => {
        if (!snapshot) return deltas;
        const merged: LiveStateMap = { ...snapshot };
        Object.entries(deltas).forEach(([machineId, delta]) => {
            merged[machineId] = { ...merged[machineId], ...delta };
        });
        return merged;
    }, [snapshot, deltas]);
}
