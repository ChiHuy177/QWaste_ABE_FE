'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import type { WebSocketMessage } from '@/types/WebSocket';
import type {
    IncidentReason,
    ProductionPlanStatus,
    ProductionPlanStatusTrigger,
    ProductionPlanWsPayload,
} from '@/types/ProductionPlan';

// Topic mang 2 loại bản tin, phân biệt bằng payload.type: ProductionPlan_Status (đổi trạng
// thái) và ProductionPlan_Production (nhịp sản lượng MQTT quy về plan RUNNING).
const WS_TOPIC_PRODUCTION_PLAN_STATUS = '/topic/productionPlans/status/';

export interface PlanStatusEntry {
    status?: ProductionPlanStatus;
    updatedAt: Date;
    trigger?: ProductionPlanStatusTrigger;
    incidentReason?: IncidentReason | null;
    reason?: string | null;
    actualQuantity?: number;
}

interface UseProductionMonitorOptions {
    machineIds: string[];
    dateIso: string;

    onUnknownPlan?: () => void;
    knownPlanIds: Set<string>;
}

interface UseProductionMonitorReturn {
    statusMap: Map<string, PlanStatusEntry>;
    isConnected: boolean;
    lastUpdate: Date | null;
}

const UNKNOWN_PLAN_DEBOUNCE_MS = 2_000;
// Gom các tick MQTT (Production ticks có thể dội vài lần/giây khi nhiều máy chạy song song)
// trong 1 cửa sổ ngắn trước khi apply vào state — tick mới nhất của mỗi plan đè tick cũ.
const FLUSH_INTERVAL_MS = 500;

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

    // Buffer các payload chờ flush — key = productionPlanId, value = payload mới nhất nhận được.
    const pendingRef = useRef<Map<string, ProductionPlanWsPayload>>(new Map());
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flush = useCallback(() => {
        flushTimerRef.current = null;
        const pending = pendingRef.current;
        if (pending.size === 0) return;
        pendingRef.current = new Map();

        setStatusMap((prev) => {
            const next = new Map(prev);
            pending.forEach((payload, planId) => {
                const existing = next.get(planId);
                // Bỏ qua payload có actualQuantity nhỏ hơn giá trị hiện tại để tránh nhận ngược thứ tự WS
                if (
                    payload.type === 'ProductionPlan_Production' &&
                    existing?.actualQuantity != null &&
                    payload.actualQuantity < existing.actualQuantity
                ) {
                    return;
                }

                next.set(planId, {
                    ...existing,
                    updatedAt: new Date(),
                    ...(payload.type === 'ProductionPlan_Status'
                        ? {
                              status: payload.toStatus,
                              trigger: payload.trigger,
                              incidentReason: payload.incidentReason,
                              reason: payload.reason,
                          }
                        : { actualQuantity: payload.actualQuantity }),
                });
            });
            return next;
        });
        setLastUpdate(new Date());
    }, []);

    const handleMessage = useCallback(
        (message: WebSocketMessage) => {
            const payload = message.payload as ProductionPlanWsPayload | undefined;
            if (!payload) return;
            if (
                payload.type !== 'ProductionPlan_Status' &&
                payload.type !== 'ProductionPlan_Production'
            )
                return;
            if (payload.plannedDate !== dateIsoRef.current) return;

            // Bỏ qua payload đến sau nhưng có sản lượng nhỏ hơn payload đang chờ flush
            if (payload.type === 'ProductionPlan_Production') {
                const pending = pendingRef.current.get(payload.productionPlanId);
                if (
                    pending?.type === 'ProductionPlan_Production' &&
                    payload.actualQuantity < pending.actualQuantity
                ) {
                    return;
                }
            }

            // Tick mới nhất của cùng 1 plan đè tick cũ trong cửa sổ chưa flush.
            pendingRef.current.set(payload.productionPlanId, payload);
            if (flushTimerRef.current == null) {
                flushTimerRef.current = setTimeout(flush, FLUSH_INTERVAL_MS);
            }

            if (!knownPlanIdsRef.current.has(payload.productionPlanId)) {
                const now = Date.now();
                if (now - lastUnknownRefetchRef.current > UNKNOWN_PLAN_DEBOUNCE_MS) {
                    lastUnknownRefetchRef.current = now;
                    onUnknownPlanRef.current?.();
                }
            }
        },
        [flush]
    );

    // Đổi ngày theo dõi → status cũ không còn ý nghĩa; huỷ tick đang chờ flush của ngày cũ.
    useEffect(() => {
        pendingRef.current = new Map();
        if (flushTimerRef.current != null) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
        }
        setStatusMap(new Map());
    }, [dateIso]);

    // Unmount — huỷ timer đang chờ để tránh setState trên component đã gỡ.
    useEffect(() => {
        return () => {
            if (flushTimerRef.current != null) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
            }
        };
    }, []);

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
