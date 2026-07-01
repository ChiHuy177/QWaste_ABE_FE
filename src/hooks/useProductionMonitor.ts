'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { ProductionLine, ProductionStatus, ProductionStatusUpdate } from '@/app/(dashboard)/admin/production-plan/_components/types';

const WS_TOPIC_PRODUCTION_STATUS = '/topic/production/status';

export interface MonitorProduct {
    code: string;
    name: string;
    machine: string;
    machineOverrides?: (string | undefined)[];
    lineName: string;
    mold: string;
    time: string;
    pcsMultiplier: number;
    schedule: [number, number, number, number, number, number, number];
    status: ProductionStatus;
    updatedAt: Date | null;
}

interface UseProductionMonitorOptions {
    lines: ProductionLine[];
}

interface UseProductionMonitorReturn {
    products: MonitorProduct[];
    isConnected: boolean;
    lastUpdate: Date | null;
}

export function useProductionMonitor({ lines }: UseProductionMonitorOptions): UseProductionMonitorReturn {
    const { wsService, isConnected } = useWebSocketContext();
    const [statusMap, setStatusMap] = useState<Map<string, { status: ProductionStatus; updatedAt: Date }>>(new Map());
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const subscriptionRef = useRef<(() => void) | null>(null);

    const handleStatusUpdate = useCallback((message: ProductionStatusUpdate) => {
        setStatusMap((prev) => {
            const next = new Map(prev);
            next.set(message.code, { status: message.status, updatedAt: new Date(message.timestamp) });
            return next;
        });
        setLastUpdate(new Date());
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        if (subscriptionRef.current) {
            subscriptionRef.current();
            subscriptionRef.current = null;
        }

        subscriptionRef.current = wsService.subscribe<ProductionStatusUpdate>(
            WS_TOPIC_PRODUCTION_STATUS,
            handleStatusUpdate
        );

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current();
                subscriptionRef.current = null;
            }
        };
    }, [isConnected, wsService, handleStatusUpdate]);

    const products: MonitorProduct[] = lines.flatMap((line) =>
        line.products.map((p) => {
            const entry = statusMap.get(p.code);
            return {
                code: p.code,
                name: p.name,
                machine: p.machine,
                machineOverrides: p.machineOverrides,
                lineName: line.name,
                mold: p.mold,
                time: p.time,
                pcsMultiplier: p.pcsMultiplier,
                schedule: p.schedule,
                status: entry?.status ?? p.status ?? 'TODO',
                updatedAt: entry?.updatedAt ?? null,
            };
        })
    );

    return { products, isConnected, lastUpdate };
}
