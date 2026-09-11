'use client';

import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { EnergyConsumption } from '@/types';
import {
    EnergyUpdateMessage,
    MachinesCurrentPowerMessage,
    MachinesFullOverviewMessage,
    ZonesCurrentPowerMessage,
    ZonesFullOverviewMessage,
} from '@/types/WebSocket';

interface EnergyWebSocketFrame {
    payload?: EnergyUpdateMessage;
}
import { useEffect, useState, useCallback, useRef } from 'react';

const isDev = process.env.NODE_ENV === 'development';

interface UseEnergyWebSocketOptions {
    selectedZoneId?: string | null;
}

interface UseEnergyWebSocketReturn {
    energyData: EnergyConsumption[];
    isConnected: boolean;
    lastUpdate: Date | null;
    setInitialData: (data: EnergyConsumption[]) => void;
}

export function useEnergyWebSocket(
    options: UseEnergyWebSocketOptions = {}
): UseEnergyWebSocketReturn {
    const { selectedZoneId = null } = options;
    const { wsService, isConnected } = useWebSocketContext();

    const [energyData, setEnergyData] = useState<EnergyConsumption[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const subscriptionRef = useRef<(() => void) | null>(null);

    const handleEnergyUpdate = useCallback((message: EnergyWebSocketFrame) => {
        if (isDev) console.log('[useEnergyWebSocket] Message type:', message.payload?.type);

        switch (message.payload?.type) {
            case 'ZONES_CURRENT_POWER':
                handleZonesCurrentPower(message.payload);
                break;
            case 'ZONES_FULL_POWER':
                setEnergyData((message.payload as ZonesFullOverviewMessage).data);
                setLastUpdate(new Date());
                break;
            case 'MACHINES_CURRENT_POWER':
                handleMachinesCurrentPower(message.payload);
                break;
            case 'MACHINES_FULL_POWER':
                setEnergyData((message.payload as MachinesFullOverviewMessage).data);
                setLastUpdate(new Date());
                break;
        }
    }, []);

    const handleZonesCurrentPower = useCallback((payload: ZonesCurrentPowerMessage) => {
        setEnergyData((prevData) => {
            if (!prevData || prevData.length === 0) return prevData;

            return prevData.map((zone) => {
                const zoneIdAsNumber = Number(zone.entityId);
                if (Number.isNaN(zoneIdAsNumber)) return zone;

                const newPower = payload.zones[zoneIdAsNumber];
                if (newPower !== undefined) {
                    return { ...zone, currentConsumption: String(newPower) };
                }
                return zone;
            });
        });
        setLastUpdate(new Date());
    }, []);

    const handleMachinesCurrentPower = useCallback((payload: MachinesCurrentPowerMessage) => {
        setEnergyData((prevData) =>
            prevData.map((machine) => {
                const newPower = payload.machines[machine.entityId];
                if (newPower !== undefined) {
                    return { ...machine, currentConsumption: String(newPower) };
                }
                return machine;
            })
        );
        setLastUpdate(new Date());
    }, []);

    // Subscribe to energy topic when connected
    useEffect(() => {
        if (!isConnected) return;

        // Cleanup previous subscription
        if (subscriptionRef.current) {
            subscriptionRef.current();
            subscriptionRef.current = null;
        }

        const topic =
            selectedZoneId === null
                ? '/topic/energy/zones'
                : `/topic/energy/zone/${selectedZoneId}`;

        if (isDev) console.log('[useEnergyWebSocket] Subscribing to:', topic);

        subscriptionRef.current = wsService.subscribe<EnergyWebSocketFrame>(topic, handleEnergyUpdate);

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current();
                subscriptionRef.current = null;
            }
        };
    }, [isConnected, selectedZoneId, wsService, handleEnergyUpdate]);

    const setInitialData = useCallback((data: EnergyConsumption[]) => {
        setEnergyData(data);
    }, []);

    return {
        energyData,
        isConnected,
        lastUpdate,
        setInitialData,
    };
}
