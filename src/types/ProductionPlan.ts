import { AuditMetaData } from './Metadata';

export type ProductionPlanFilterId = 'DAY' | 'WEEK';
export type ProductionPlanStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductionPlan {
    planId: number;
    filterId: ProductionPlanFilterId;
    machineId: number;
    plannedQuantity: number;
    status: ProductionPlanStatus;
    planDate?: string;
    planWeekStart?: string;
    planWeekEnd?: string;
    auditMetaData?: AuditMetaData;
}

export interface ProductionPlanFormData {
    filterId: ProductionPlanFilterId;
    machineId: number;
    plannedQuantity: number;
    status: ProductionPlanStatus;
    planDate?: string;
    planWeekStart?: string;
    planWeekEnd?: string;
}
