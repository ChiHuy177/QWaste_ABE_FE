'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import type { WebSocketMessage } from '@/types/WebSocket';
import type {
    ProductionPlanStatus,
    ProductionPlanStatusChangedPayload,
} from '@/types/ProductionPlan';

// BE broadcast theo từng máy: WebSocketDestinations.PRODUCTION_PLAN_STATUS + machineId.
const WS_TOPIC_PRODUCTION_PLAN_STATUS = '/topic/productionPlans/status/';

export interface PlanStatusEntry {
    status: ProductionPlanStatus;
    updatedAt: Date;
}

interface UseProductionMonitorOptions {
    /** Máy đang hiển thị — mỗi máy 1 subscription. */
    machineIds: string[];
    /** Ngày đang theo dõi (yyyy-MM-dd) — update khác ngày bị bỏ qua. */
    dateIso: string;
    /**
     * Gọi khi nhận update cho plan chưa có trong danh sách (vd defer tạo child
     * plan mới) — page nên refetch. Được debounce phía hook.
     */
    onUnknownPlan?: () => void;
    /** Id các plan đang hiển thị — dùng để phát hiện plan mới. */
    knownPlanIds: Set<string>;
}

interface UseProductionMonitorReturn {
    /** Status realtime theo productionPlanId — merge đè lên dữ liệu fetch. */
    statusMap: Map<string, PlanStatusEntry>;
    isConnected: boolean;
    lastUpdate: Date | null;
}

const UNKNOWN_PLAN_DEBOUNCE_MS = 2_000;

export function useProductionMonitor({
    machineIds,
    dateIso,
    onUnknownPlan,
    knownPlanIds,
}: UseProductionMonitorOptions): UseProductionMonitorReturn {
    const { wsService, isConnected } = useWebSocketContext();
    const [statusMap, setStatusMap] = useState<Map<string, PlanStatusEntry>>(new Map());
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Ref để callback WS luôn thấy giá trị mới mà không phải resubscribe.
    const knownPlanIdsRef = useRef(knownPlanIds);
    knownPlanIdsRef.current = knownPlanIds;
    const onUnknownPlanRef = useRef(onUnknownPlan);
    onUnknownPlanRef.current = onUnknownPlan;
    const dateIsoRef = useRef(dateIso);
    dateIsoRef.current = dateIso;
    const lastUnknownRefetchRef = useRef(0);

    const handleMessage = useCallback((message: WebSocketMessage) => {
        const payload = message.payload as ProductionPlanStatusChangedPayload | undefined;
        if (!payload || payload.type !== 'ProductionPlan_Status') return;
        if (payload.plannedDate !== dateIsoRef.current) return;

        setStatusMap((prev) => {
            const next = new Map(prev);
            next.set(payload.productionPlanId, {
                status: payload.toStatus,
                updatedAt: new Date(),
            });
            return next;
        });
        setLastUpdate(new Date());

        if (!knownPlanIdsRef.current.has(payload.productionPlanId)) {
            const now = Date.now();
            if (now - lastUnknownRefetchRef.current > UNKNOWN_PLAN_DEBOUNCE_MS) {
                lastUnknownRefetchRef.current = now;
                onUnknownPlanRef.current?.();
            }
        }
    }, []);

    // Đổi ngày theo dõi → status cũ không còn ý nghĩa.
    useEffect(() => {
        setStatusMap(new Map());
    }, [dateIso]);

    const machineIdsKey = [...machineIds].sort().join('|');

    useEffect(() => {
        if (!isConnected || !machineIdsKey) return;

        const unsubscribes = machineIdsKey
            .split('|')
            .map((machineId) =>
                wsService.subscribe<WebSocketMessage>(
                    `${WS_TOPIC_PRODUCTION_PLAN_STATUS}${machineId}`,
                    handleMessage
                )
            );

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, [handleMessage, isConnected, machineIdsKey, wsService]);

    return { statusMap, isConnected, lastUpdate };
}
