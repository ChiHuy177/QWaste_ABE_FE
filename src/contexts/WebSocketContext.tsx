'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WebSocketService, getWebSocketService } from '@/services/WebSocketService';
import type { AccountRole } from '@/types/User';

interface WebSocketContextValue {
    wsService: WebSocketService;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const WS_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`;
const isDev = process.env.NODE_ENV === 'development';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const wsServiceRef = useRef<WebSocketService | null>(null);
    const roleUnsubscribersRef = useRef<(() => void)[]>([]);

    const subscribeToRoleTopics = (service: WebSocketService, roles: AccountRole[]) => {
        // Unsubscribe tất cả role subscription cũ trước
        roleUnsubscribersRef.current.forEach((fn) => fn());
        roleUnsubscribersRef.current = [];

        roles.forEach((role) => {
            const backendRole = `${role.toUpperCase()}`;
            const destination = `/topic/role/${backendRole}`;

            const unsub = service.subscribe(destination, (msg: unknown) => {
                if (isDev) console.log(`[WebSocket] Role broadcast [${backendRole}]:`, msg);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent('wsRoleBroadcast', {
                            detail: { role: backendRole, message: msg },
                        })
                    );
                }
            });

            roleUnsubscribersRef.current.push(unsub);
        });
    };

    useEffect(() => {
        if (!isAuthenticated) {
            // Disconnect when user logs out
            if (wsServiceRef.current?.connected) {
                wsServiceRef.current.disconnect();
            }
            roleUnsubscribersRef.current.forEach((fn) => fn());
            roleUnsubscribersRef.current = [];
            setIsConnected(false);
            return;
        }

        const service = getWebSocketService();
        wsServiceRef.current = service;

        // Sync if already connected (e.g. re-mount from React Strict Mode)
        if (service.connected) {
            setIsConnected(true);
            if (user?.roles?.length) {
                subscribeToRoleTopics(service, user.roles);
            }
        }

        const unsubscribeConnection = service.onConnectionChange((connected) => {
            if (isDev) console.log('[WebSocketProvider] Connection changed:', connected);
            setIsConnected(connected);

            if (connected && user?.roles?.length) {
                subscribeToRoleTopics(service, user.roles);
            } else if (!connected) {
                // Clear role subs on disconnect — will re-subscribe on reconnect
                roleUnsubscribersRef.current.forEach((fn) => fn());
                roleUnsubscribersRef.current = [];
            }
        });

        const unsubscribeError = service.onError((error) => {
            console.error('[WebSocketProvider] Error:', error);
        });

        // Connect only if not already connected/connecting
        if (!service.connected && !service.connecting) {
            if (isDev) console.log('[WebSocketProvider] Connecting...');
            service.connect({
                url: WS_URL,
                debug: isDev,
                reconnectInterval: 3000,
                maxReconnectAttempts: 5,
            }).catch((err) => {
                console.error('[WebSocketProvider] Connection failed:', err);
            });
        }

        return () => {
            unsubscribeConnection();
            unsubscribeError();
            roleUnsubscribersRef.current.forEach((fn) => fn());
            roleUnsubscribersRef.current = [];
        };
    }, [isAuthenticated, user?.roles]);

    // Don't render context until service is available (client-side only)
    const value = React.useMemo<WebSocketContextValue | null>(() => {
        if (typeof window === 'undefined') return null;
        return {
            wsService: getWebSocketService(),
            isConnected,
        };
    }, [isConnected]);

    if (!value) return <>{children}</>;

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within WebSocketProvider');
    }
    return context;
}
