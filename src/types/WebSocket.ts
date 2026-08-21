import { EnergyConsumption, TimePeriod } from '@/types/Energy';

export enum ConnectionState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    ERROR = 'ERROR',
}

export type EnergyMessageType =
    'ZONES_CURRENT_POWER' | 'ZONES_FULL_POWER' | 'MACHINES_CURRENT_POWER' | 'MACHINES_FULL_POWER';

interface BaseEnergyMessage {
    type: EnergyMessageType;
    timestamp: number;
}

export interface ZonesCurrentPowerMessage extends BaseEnergyMessage {
    type: 'ZONES_CURRENT_POWER';
    zones: Record<number, number>; // { zoneId: currentPower }
}

export interface ZonesFullOverviewMessage extends BaseEnergyMessage {
    type: 'ZONES_FULL_POWER';
    data: EnergyConsumption[];
    periodFilter: TimePeriod;
}

export interface MachinesCurrentPowerMessage extends BaseEnergyMessage {
    type: 'MACHINES_CURRENT_POWER';
    zoneId: number;
    machines: Record<string, number>; // { machineId: currentPower }
}

export interface MachinesFullOverviewMessage extends BaseEnergyMessage {
    type: 'MACHINES_FULL_POWER';
    zoneId: number;
    zoneName: string;
    data: EnergyConsumption[];
    periodFilter: TimePeriod;
}

export type EnergyUpdateMessage =
    | ZonesCurrentPowerMessage
    | ZonesFullOverviewMessage
    | MachinesCurrentPowerMessage
    | MachinesFullOverviewMessage;

// WebSocket error codes (WEBSOCKET domain starts at 800)
export enum WebSocketErrorCode {
    // Fatal auth errors (801-804) - session is dead, stop reconnecting
    WS_CONNECTION_FAILED = 801,
    WS_AUTHENTICATION_FAILED = 802,
    WS_SESSION_INVALID = 803,
    WS_SESSION_EXPIRED = 804,

    // Non-fatal errors - retry allowed
    WS_MESSAGE_SEND_FAILED = 805,
    WS_INVALID_MESSAGE_FORMAT = 806,
    WS_MESSAGE_TOO_LARGE = 807,
    WS_RATE_LIMIT_EXCEEDED = 808,
    WS_TOO_MANY_CONNECTIONS = 809,
    WS_UNAUTHORIZED_SUBSCRIPTION = 810,
    WS_UNAUTHORIZED_ACTION = 811,
    WS_INSUFFICIENT_PERMISSIONS = 812,
    WS_INTERNAL_ERROR = 813,
    WS_DISCONNECTED = 814,
    WS_RECONNECTION_REQUIRED = 815,
}

export interface WebSocketErrorMessage {
    type: 'ERROR';
    severity: 'ERROR';
    code: number;
    message: string;
    title?: string;
    content?: string;
    metadata?: {
        [key: string]: any;
    };
    timestamp: number;
}

export const isFatalAuthError = (code: number): boolean => {
    return code >= 801 && code <= 804;
};

export interface WebSocketConfig {
    url: string;
    debug?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

// ─── New unified message format from backend NotificationService ─────────────

export type WebSocketMessageType = 'NOTIFICATION' | 'DATA' | 'EVENT' | 'ALERT' | 'COMMAND';

export interface WebSocketMessage {
    type: WebSocketMessageType;
    title?: string;
    titleKey?: string;
    titleArgs?: unknown[];
    content?: string;
    contentKey?: string;
    contentArgs?: unknown[];
    payload?: Record<string, any>;
    metadata?: Record<string, any> | null;
    timestamp: string; // ISO-8601 e.g. "2026-05-15T10:30:00"
}
