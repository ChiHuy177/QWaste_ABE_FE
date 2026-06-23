export type Schedule = [number, number, number, number, number, number, number];

export interface ProductionProduct {
    code: string;
    name: string;
    machine: string;
    mold: string;
    time: string;
    pcsMultiplier: number;
    schedule: Schedule;
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
