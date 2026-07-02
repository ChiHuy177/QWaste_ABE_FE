export type Schedule = [number, number, number, number, number, number, number];

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

export interface ProductionLine {
    id: string;
    name: string;
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
    lineName: string;
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
