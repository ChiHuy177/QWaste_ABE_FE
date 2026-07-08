import { SpacePickingResponse } from './Space';

export type Schedule = [
    mon: number,
    tue: number,
    wed: number,
    thu: number,
    fri: number,
    sat: number,
    sun: number,
];

export type ProductionStatus = 'TODO' | 'IN_PROGRESS' | 'PAUSE' | 'COMPLETE';

export interface ProductionProduct {
    code: string;
    name: string;
    machine: string;
    machineOverrides?: (string | undefined)[];
    mold: string;
    time: string;
    pcsMultiplier: number;
    schedule: Schedule;
    status?: ProductionStatus;
}

export interface ProductionLine extends Omit<SpacePickingResponse, 'displayOrder' | 'spaceLevel'> {
    products: ProductionProduct[];
}

export interface ProductionStatusUpdate {
    code: string;
    machine: string;
    status: ProductionStatus;
    timestamp: string;
}

export interface MonitorProduct {
    code: string;
    name: string;
    machine: string;
    machineOverrides?: (string | undefined)[];
    spaceName: string;
    mold: string;
    time: string;
    pcsMultiplier: number;
    schedule: Schedule;
    status: ProductionStatus;
    updatedAt: Date | null;
}

export interface SkippedDay {
    date: string;
    reason: string;
}

export interface ImportRowError {
    rowIndex: number;
    dayLabel: string;
    column: string;
    message: string;
}

export interface ImportResult {
    requiresConfirmation: boolean;
    sessionToken: string;
    totalInserted: number;
    importedDays: string[];
    deferredDays: string[];
    skippedDays: SkippedDay[];
    errors: ImportRowError[];
}
