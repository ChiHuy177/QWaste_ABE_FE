import { currentStatus } from '@/types/Machine';

/**
 * Hex fill colors for machine nodes on the Konva canvas, mapped by currentStatus.
 * Values sourced from statusColors.light (antdTheme.ts) and MachineCard color mapping.
 */
export const MACHINE_STATUS_FILL: Record<currentStatus, string> = {
    RUNTIME: '#1F7A4D',
    COMPLETE: '#1F7A4D',
    IDLE: '#A96500',
    TEMPORARY_STOP: '#A96500',
    ERROR: '#B42318',
    WARNING: '#faad14',
    OPEN_DOOR: '#1677ff',
    OFFLINE: '#8C8C8C',
    UNKNOWN: '#8C8C8C',
};

export const MACHINE_STATUS_FILL_LIGHT: Record<currentStatus, string> = {
    RUNTIME: '#2d9e65',
    COMPLETE: '#2d9e65',
    IDLE: '#d47d00',
    TEMPORARY_STOP: '#d47d00',
    ERROR: '#d4362a',
    WARNING: '#ffc53d',
    OPEN_DOOR: '#4096ff',
    OFFLINE: '#b0b0b0',
    UNKNOWN: '#b0b0b0',
};

export const MACHINE_STATUS_STROKE: Record<currentStatus, string> = {
    RUNTIME: '#15613d',
    COMPLETE: '#15613d',
    IDLE: '#865000',
    TEMPORARY_STOP: '#865000',
    ERROR: '#8c1a12',
    WARNING: '#d48806',
    OPEN_DOOR: '#0958d9',
    OFFLINE: '#6b6b6b',
    UNKNOWN: '#6b6b6b',
};

export const getMachineStatusFill = (status?: currentStatus): string =>
    status ? MACHINE_STATUS_FILL[status] : '#8C8C8C';

export const getMachineStatusFillLight = (status?: currentStatus): string =>
    status ? MACHINE_STATUS_FILL_LIGHT[status] : '#b0b0b0';

export const getMachineStatusStroke = (status?: currentStatus): string =>
    status ? MACHINE_STATUS_STROKE[status] : '#6b6b6b';
