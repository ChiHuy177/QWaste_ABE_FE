import { AuditMetaData, SoftDeleteMetaData } from './Metadata';

// ─── Enums (khớp BE model/enums) ─────────────────────────────────────────────

export type ProductionPlanStatus = 'PENDING' | 'RUNNING' | 'PAUSE' | 'PARTIAL' | 'COMPLETE';

export type IncidentReason =
    | 'WAITING_MATERIALS'
    | 'TOOL_ADJUSTMENT'
    | 'SENSOR_CALIBRATION'
    | 'MOLD_DAMAGE'
    | 'MACHINE_BREAKDOWN'
    | 'QUALITY_ISSUE'
    | 'ORDER_CANCELLED'
    | 'PRODUCTION_DISCONTINUED'
    | 'OTHER';

export type ProductionPlanStatusTrigger =
    | 'MQTT_RUN'
    | 'MQTT_ERROR'
    | 'MQTT_OFFLINE'
    | 'MQTT_IDLE'
    | 'AUTO_ADVANCE'
    | 'MANUAL';

export type ImportOption = 'CANCEL' | 'OVERWRITE_ALL' | 'OVERWRITE_RETAIN';

// ─── Responses (khớp BE model/dtos/productionPlan/responses) ─────────────────

export interface ProductionPlanListItem {
    productionPlanId: string;
    productionPlanCode: string;
    productionPlanName: string;
    snapshotMoldCode: string | null;
    plannedQuantity: number;
    status: ProductionPlanStatus;
    sequence: number | null;
    isDeleted: boolean;
}

export interface ProductionPlanDailyMachineGroup {
    machineId: string;
    machineCode: string;
    productionPlans: ProductionPlanListItem[];
}

export interface ProductionPlanWeeklyDay {
    date: string; // yyyy-MM-dd
    productionPlans: ProductionPlanListItem[];
}

export interface ProductionPlanWeeklyMachineGroup {
    machineId: string;
    machineCode: string;
    days: ProductionPlanWeeklyDay[];
}

export interface ProductionPlanDetail {
    productionPlanId: string;
    productionPlanCode: string;
    productionPlanName: string;
    productionPlanParentId: string | null;
    productionPlanParentCode: string | null;
    productionPlanParentName: string | null;
    snapshotMoldCode: string | null;
    snapshotMoldName: string | null;
    snapshotMoldQuantity: number | null;
    snapshotOperationTypeCode: string | null;
    snapshotOperationTypeName: string | null;
    machineId: string;
    machineCode: string;
    plannedQuantity: number;
    actualQuantity: number | null;
    plannedDate: string; // yyyy-MM-dd
    status: ProductionPlanStatus;
    sequence: number | null;
    note: string | null;
    auditMetaData?: AuditMetaData;
    softDeleteMetaData?: SoftDeleteMetaData;
}

export interface ProductionPlanMutationResponse {
    productionPlanId: string;
    productionPlanCode: string;
    productionPlanName: string;
    snapshotMoldCode: string | null;
    plannedQuantity: number;
    status: ProductionPlanStatus;
    sequence: number | null;
    machineId: string;
    machineCode: string;
    isDeleted: boolean;
}

export interface ProductionPlanStatusLog {
    productionPlanStatusLogId: number;
    machineId: string;
    machineCode: string;
    machineName: string | null;
    fromStatus: ProductionPlanStatus | null;
    toStatus: ProductionPlanStatus;
    trigger: ProductionPlanStatusTrigger;
    incidentReason: IncidentReason | null;
    reason: string | null;
    changedBy: string | null;
    timestamp: string; // ISO LocalDateTime
}

// ─── Requests (khớp BE model/dtos/productionPlan/requests) ───────────────────

export interface ProductionPlanFormData {
    productionPlanCode: string;
    productionPlanName: string;
    plannedQuantity: number;
    sequence: number;
    plannedDate: string; // yyyy-MM-dd
    note?: string;
    machineId: string;
    moldId: string;
    productionPlanParentId?: string;
}

export interface ProductionPlanUpdateFormData {
    productionPlanId: string;
    productionPlanCode: string;
    productionPlanName: string;
    plannedQuantity: number;
    moldId?: string;
}

export interface ProductionPlanDailyFilter {
    date: string; // yyyy-MM-dd (bắt buộc)
    machineCode?: string;
    productionPlanCode?: string;
    productionPlanName?: string;
    snapshotMoldCode?: string;
    search?: string;
    page?: number;
    size?: number;
}

export interface ProductionPlanWeeklyFilter {
    startDate: string; // yyyy-MM-dd — phải cùng 1 tuần Mon–Sun với endDate
    endDate: string;
    machineCode?: string;
    productionPlanCode?: string;
    productionPlanName?: string;
    snapshotMoldCode?: string;
    search?: string;
    page?: number;
    size?: number;
}

export interface ProductionPlanReorderItem {
    productionPlanId: string;
    sequence: number;
}

export interface IncidentTerminateRequest {
    incidentReason: IncidentReason;
    reason?: string; // bắt buộc khi incidentReason === 'OTHER'
}

export interface IncidentPauseRequest {
    incidentReason: IncidentReason;
    reason?: string; // bắt buộc khi incidentReason === 'OTHER'
}

export interface IncidentDeferRequest {
    plannedDate: string; // yyyy-MM-dd
    machineId: string;
    moldId: string;
    sequence: number;
    incidentReason: IncidentReason;
    note?: string; // bắt buộc khi incidentReason === 'OTHER'
}

// ─── WebSocket (topic /topic/productionPlans/status/{machineId}) ─────────────

export interface ProductionPlanStatusChangedPayload {
    type: 'ProductionPlan_Status';
    productionPlanId: string;
    machineId: string;
    plannedDate: string;
    fromStatus: ProductionPlanStatus | null;
    toStatus: ProductionPlanStatus;
    trigger: ProductionPlanStatusTrigger;
    incidentReason: IncidentReason | null;
    reason: string | null;
}

// ─── Import ──────────────────────────────────────────────────────────────────

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

export interface ImportConfirmRequest {
    token: string;
    option: ImportOption;
}

/** Số lượng theo 7 ngày Mon..Sun — dùng bởi view-model bảng kế hoạch. */
export type Schedule = [
    mon: number,
    tue: number,
    wed: number,
    thu: number,
    fri: number,
    sat: number,
    sun: number,
];
