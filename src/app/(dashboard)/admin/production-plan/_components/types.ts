export type {
    Schedule,
    ProductionStatus,
    ProductionProduct,
    ProductionLine,
    ProductionStatusUpdate,
} from '@/types/ProductionPlan';

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
