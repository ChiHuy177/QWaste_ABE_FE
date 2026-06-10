import { AuditMetaData, SoftDeleteMetaData, TaskResponse } from '.';
import { ProductionType } from './DrawingCode';

export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Spec-compliant order status
export type OrderStatus = 'REVIEWING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';

export type OrderDrawingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskReviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
export type TaskDeclineReason =
    | 'WORKLOAD_FULL'
    | 'SKILL_MISMATCH'
    | 'EQUIPMENT_UNAVAILABLE'
    | 'OTHER';

export interface OrderAttachment {
    orderAttachmentId: number;
    attachmentUrl: string;
    attachmentName: string;
    uploadedAt: string;
}

export interface TaskReview {
    taskReviewId: number;
    operatorId: string;
    operatorFullName: string;
    operatorUserCode: string;
    reviewStatus: TaskReviewStatus;
    declineReason?: TaskDeclineReason;
    declineComment?: string;
    reviewedAt?: string;
}

export interface OrderDrawing {
    orderDrawingId: string;
    drawingCode: string;
    drawingCodeName: string;
    defaultCompletionTimeSeconds: number;
    drawingStatus: OrderDrawingStatus;
    productionTasks: TaskResponse[];
    drawingCodeId?: string;
    productionType?: ProductionType;
    orderDrawingRequestedQuantity?: number;
    orderDrawingPlannedQuantity?: number;
    orderDrawingActualQuantity?: number;
    orderDrawingErrorActualQuantity?: number;
}

export interface OrderSummaryResponse {
    orderId: string;
    orderCode: string;
    orderName: string;
    customerName: string;
    orderPriority: OrderPriority;
    orderStatus: OrderStatus;
    expectedStartDate?: string;
    expectedEndDate?: string;
    auditMetaData: AuditMetaData;
    softDeleteMetaData: SoftDeleteMetaData;
}

export interface OrderResponse extends OrderSummaryResponse {
    customerPhone?: string;
    customerNote?: string;
    orderDrawings: OrderDrawing[];
    expectedStartDate?: string;
    expectedEndDate?: string;
    totalEstimatedLeadtime?: number;
    penaltyAmount?: number;
    cancellationReason?: string;
    orderRequestedQuantity?: number;
    orderPlannedQuantity?: number;
    orderActualQuantity?: number;
    createdByUserId?: string;
    createdByUserCode?: string;
    orderAttachments?: OrderAttachment[];
}

export interface OrderStepRequest {
    orderDrawingStepId?: number;
    stepOrder: number;
    stepName: string;
    requiresQc: boolean;
    description: string;
    defaultCompletionTimeSeconds: number;
    materialName: string;
    tasks: OrderTaskRequest[];
}

export interface OrderDrawingRequest {
    orderDrawingId?: number;
    drawingCodeId: string;
    totalRequestedQuantity?: number;
    productionType: ProductionType;
    orderSteps: OrderStepRequest[];
}

export interface OrderCreationRequest {
    orderCode: string;
    orderName: string;
    orderPriority: OrderPriority;
    orderDrawings: OrderDrawingRequest[];
    customerName: string;
    customerPhone: string;
    customerNote: string;
    expectedStartDate?: string;
    expectedEndDate?: string;
    attachments?: OrderAttachmentRequest[];
}

export interface OrderUpdationRequest {
    orderId: string;
    orderName: string;
    orderPriority: OrderPriority;
    orderDrawings: OrderDrawingRequest[];
    customerName?: string;
    customerPhone?: string;
    customerNote?: string;
    expectedStartDate?: string;
    expectedEndDate?: string;
    penaltyAmount?: number;
    attachments?: OrderAttachmentRequest[];
}

export interface OrderInfoUpdationRequest {
    orderId: string;
    orderCode: string;
    orderName: string;
    customerName?: string;
    customerPhone?: string;
    customerNote?: string;
    expectedStartDate?: string;
    expectedEndDate?: string;
    orderPriority: OrderPriority;
    attachments?: OrderAttachmentRequest[];
}

export interface OrderPlanUpdationRequest {
    orderId: string;
    orderDrawings: OrderDrawingRequest[];
}

export interface OrderTaskRequest {
    taskId?: string;
    taskName: string;
    taskOrder: number;
    taskRequestedQuantity: number;
    taskPlannedQuantity: number;
    operatorIds?: string[];
}

export interface OrderAttachmentRequest {
    attachmentUrl: string;
    attachmentName: string;
}

export interface OrderDrawingSummaryResponse {
    orderDrawingId: number;
    drawingCodeId: string;
    drawingCode: string;
    ofCustomer?: string;
    versionNumber?: number;
    drawingCodeName: string;
    description?: string;
    pdfLink?: string;
    defaultCompletionTimeSeconds: number;
    productionType: ProductionType;
    orderDrawingRequestedQuantity: number;
    orderDrawingPlannedQuantity: number;
    orderDrawingActualQuantity: number;
    orderDrawingErrorActualQuantity: number;
    drawingStatus: OrderDrawingStatus;
}

export interface OrderDrawingResponse extends OrderDrawingSummaryResponse {
    productionTasks: TaskResponse[];
}

export interface OrderManagerReviewTaskReview {
    taskReviewId: number;
    operatorId: string;
    operatorFullName: string;
    operatorUserCode: string;
    reviewStatus: TaskReviewStatus;
    declineReason: TaskDeclineReason | null;
    declineComment: string | null;
    reviewedAt: string | null;
    activityLogs: TaskReviewActivityResponse[];
}

export interface OrderManagerReviewTask {
    taskId: string;
    stepOrder: number;
    stepName: string;
    stepDescription: string | null;
    requiresQc: boolean;
    stepDefaultCompletionTimeSeconds: number;
    materialName: string | null;
    taskName: string;
    taskOrder: number;
    taskType: string;
    taskRequestedQuantity: number;
    taskPlannedQuantity: number;
    taskStatus: string;
    cancelReason: string | null;
    reviews: OrderManagerReviewTaskReview[];
}

export interface OrderManagerReviewDrawing {
    orderDrawingId: number;
    drawingCode: string;
    drawingCodeName: string;
    tasks: OrderManagerReviewTask[];
}

export interface TaskReviewActivityResponse {
    activityLogId: number;
    userFullName: string;
    oldValue: string;
    newValue: string;
    description: string;
    createdAt: string;
}

export interface OrderManagerReviewResponse {
    order: OrderResponse;
    totalTasks: number;
    unassignedTasks: number;
    pendingTasks: number;
    confirmedTasks: number;
    declinedTasks: number;
    allAssignedConfirmed: boolean;
    orderDrawings: OrderManagerReviewDrawing[];
}

export interface OrderOperatorSummaryResponse {
    orderId: string;
    orderCode: string;
    orderName: string;
    orderPriority: OrderPriority;
    expectedStartDate?: string;
    orderStatus: OrderStatus;
    myTotalTasks: number;
    myPendingTasks: number;
    myConfirmedTasks: number;
    myDeclinedTasks: number;
}

export interface OrderOperatorReviewDrawing {
    orderDrawingId: number;
    drawingCodeId: string;
    drawingCode: string;
    drawingCodeName: string;
    productionType: string;
    orderSteps: OrderOperatorReviewStep[];
}

export interface OrderOperatorReviewStep {
    stepOrder: number;
    stepName: string;
    description: string;
    requiresQc: boolean;
    defaultCompletionTimeSeconds: number;
    materialName: string | null;
    tasks: OrderOperatorReviewTask[];
}

export interface OrderOperatorReviewTask {
    taskId: string;
    taskName: string;
    taskOrder: number;
    taskRequestedQuantity: number;
    taskPlannedQuantity: number;
    taskStatus: string;
    myReview: {
        taskReviewId: number;
        operatorId: string;
        operatorFullName: string;
        operatorUserCode: string;
        reviewStatus: TaskReviewStatus;
        declineReason: TaskDeclineReason | null;
        declineComment: string | null;
        reviewedAt: string | null;
    };
}

export interface OrderOperatorReviewResponse {
    orderId: string;
    orderCode: string;
    orderName: string;
    orderPriority: OrderPriority;
    expectedStartDate?: string;
    orderDrawings: OrderOperatorReviewDrawing[];
}

export interface OperatorReviewSubmitPayload {
    taskReviewId: number;
    reviewStatus: TaskReviewStatus;
    declineReason?: TaskDeclineReason | null;
    declineComment?: string | null;
}

// Plan For Edit API Response Types
export interface TaskOperatorReviewResponse {
    taskReviewId: number;
    operatorId: string;
    operatorFullName: string;
    operatorUserCode: string;
    reviewStatus: TaskReviewStatus;
    declineReason: TaskDeclineReason | null;
    declineComment: string | null;
    reviewedAt: string | null;
}

export interface OrderTaskPlanResponse {
    taskId: string;
    taskName: string;
    taskOrder: number;
    taskRequestedQuantity: number;
    taskPlannedQuantity: number;
    taskReviews: TaskOperatorReviewResponse[];
}

export interface OrderDrawingStepPlanResponse {
    orderDrawingStepId: number;
    stepOrder: number;
    stepName: string;
    description: string;
    requiresQc: boolean;
    defaultCompletionTimeSeconds: number;
    materialName: string;
    productionTasks: OrderTaskPlanResponse[];
}

export interface OrderDrawingPlanResponse {
    orderDrawingId: number;
    drawingCodeId: string;
    totalRequestedQuantity?: number;
    orderDrawingRequestedQuantity?: number;
    drawingCode: string;
    ofCustomer: string;
    versionNumber: number;
    drawingCodeName: string;
    description: string;
    pdfLink: string;
    defaultCompletionTimeSeconds: number;
    productionType: ProductionType;
    drawingStatus: OrderDrawingStatus;
    orderDrawingSteps: OrderDrawingStepPlanResponse[];
}

export interface Operator {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    skills: string[];
    hourlyRate: number;
    isActive: boolean;
    availability: 'available' | 'busy' | 'offline';
    currentTaskIds: string[];
    completedTasksCount: number;
    averageRating: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProcessStep {
    id: string;
    drawingCodeId: string;
    stepNumber: number;
    name: string;
    description: string;
    estimatedMinutes: number;
    requiredSkills: string[];
    equipment: string[];
    materials?: string[];
    qualityCheckpoints: string[];
    isOptional: boolean;
    dependencies: string[];
}

export interface MockDrawingCode {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    unitPrice: number;
    estimatedHoursPerUnit: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    steps: ProcessStep[];
}

export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface StepProgress {
    id: string;
    taskId: string;
    stepId: string;
    step: ProcessStep;
    status: StepStatus;
    startedAt?: Date;
    completedAt?: Date;
    actualMinutes?: number;
    operatorId?: string;
    operator?: Operator;
    notes?: string;
    qualityPassed?: boolean;
    qualityNotes?: string;
}

export interface Task {
    id: string;
    orderId: string;
    title: string;
    description: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high';
    drawingCodeId: string;
    drawingCode: MockDrawingCode;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    assignedOperatorId?: string;
    assignedOperator?: Operator;
    estimatedHours: number;
    actualHours: number;
    currentStepIndex: number;
    completedSteps: number;
    totalSteps: number;
    progressPercentage: number;
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
    stepProgresses: StepProgress[];
}

export interface Order {
    id: string;
    orderNumber: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    customerId: string;
    customerName: string;
    expectedDeliveryDate: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    assignedTo: string[];
    totalTasks: number;
    completedTasks: number;
    progressPercentage: number;
    estimatedHours: number;
    actualHours: number;
    budget: number;
    notes: string;
    tasks: Task[];
}
