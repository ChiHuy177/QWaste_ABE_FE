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

export interface ProductionStatusUpdate {
    code: string;
    machine: string;
    status: ProductionStatus;
    timestamp: string;
}

export interface ProductionLine {
    id: string;
    name: string;
    products: ProductionProduct[];
}

export interface ProductPosition {
    lineIndex: number;
    productIndex: number;
}

export type TransferMachineModalState =
    | { open: false }
    | { open: true; lineIndex: number; productIndex: number };

export type TransferScheduleModalState =
    | { open: false }
    | { open: true; lineIndex: number; productIndex: number };

export type PlanModalState =
    | {
        open: false;
    }
    | {
        open: true;
        mode: 'create' | 'edit';
        lineIndex: number;
        productIndex?: number;
    };
