export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type OrderStatus = 'REVIEWING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';

export type TaskReviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';
export type TaskDeclineReason =
    | 'WORKLOAD_FULL'
    | 'SKILL_MISMATCH'
    | 'EQUIPMENT_UNAVAILABLE'
    | 'OTHER';

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
