import type {
    OrderDrawingPlanResponse,
    OrderDrawingSummaryResponse,
    OrderManagerReviewResponse,
    OrderOperatorReviewResponse,
    OrderOperatorSummaryResponse,
    OrderResponse,
    OrderStatus,
    TaskDeclineReason,
    OrderSummaryResponse,
    TaskReviewStatus,
} from '@/types/Order';
import type { TaskResponse, UserForPickingByRole } from '@/types';
import type { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { ProductionType } from '@/types/DrawingCode';

export const USE_MOCK_ORDERS = true;

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const activeSoftDeleteMetaData = {
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
};

const deletedSoftDeleteMetaData = {
    deletedAt: '2026-05-28T09:10:00.000Z',
    deletedBy: 'Demo Admin',
    isDeleted: true,
};

export const MOCK_ORDER_OPERATORS: UserForPickingByRole[] = [
    { userId: 'demo-operator-001', fullname: 'Demo Operator', userCode: 'OP-DEMO' },
    { userId: 'demo-operator-002', fullname: 'Nguyen Van An', userCode: 'OP-002' },
    { userId: 'demo-qc-001', fullname: 'Demo QC Staff', userCode: 'QC-DEMO' },
];

export const MOCK_DRAWING_TEMPLATES: DrawingCodePickingResponse[] = [
    {
        drawingCodeId: 'dwg-template-001',
        drawingCode: 'DWG-2026-118',
        drawingCodeName: 'CNC surface bracket',
        description: 'Main bracket with surface milling and threaded holes.',
        pdfLink: 'https://example.com/demo/dwg-2026-118.pdf',
        ofCustomer: 'IIC Components',
        versionNumber: 3,
        defaultCompletionTimeSeconds: 12600,
        productionType: ProductionType.BATCH,
        stepTemplates: [
            {
                stepTemplateId: 'step-template-001',
                stepOrder: 1,
                stepName: 'Surface milling',
                description: 'First-pass milling on CNC machine.',
                requiresQc: true,
                defaultCompletionTimeSeconds: 7200,
                materialName: 'Aluminum 6061',
            },
            {
                stepTemplateId: 'step-template-002',
                stepOrder: 2,
                stepName: 'Thread drilling',
                description: 'Drill and tap mounting holes.',
                requiresQc: true,
                defaultCompletionTimeSeconds: 5400,
                materialName: 'Aluminum 6061',
            },
        ],
    },
    {
        drawingCodeId: 'dwg-template-002',
        drawingCode: 'DWG-2026-132',
        drawingCodeName: 'Heat treatment cover plate',
        description: 'Cover plate prepared for cutting and heat treatment.',
        pdfLink: 'https://example.com/demo/dwg-2026-132.pdf',
        ofCustomer: 'Eastern Precision',
        versionNumber: 1,
        defaultCompletionTimeSeconds: 10800,
        productionType: ProductionType.BATCH,
        stepTemplates: [
            {
                stepTemplateId: 'step-template-003',
                stepOrder: 1,
                stepName: 'Laser cutting',
                description: 'Cut cover plate profile.',
                requiresQc: false,
                defaultCompletionTimeSeconds: 3600,
                materialName: 'Steel S45C',
            },
            {
                stepTemplateId: 'step-template-004',
                stepOrder: 2,
                stepName: 'Heat treatment',
                description: 'Run batch heat treatment.',
                requiresQc: true,
                defaultCompletionTimeSeconds: 7200,
                materialName: 'Steel S45C',
            },
        ],
    },
];

export const MOCK_ORDERS: OrderResponse[] = [
    {
        orderId: 'order-demo-001',
        orderCode: 'ORD-2026-1042',
        orderName: 'CNC bracket production batch',
        customerName: 'IIC Components',
        customerPhone: '0901122334',
        customerNote: 'Prioritize the first 20 pieces for customer inspection.',
        orderPriority: 'HIGH',
        orderStatus: 'REVIEWING',
        expectedStartDate: '2026-05-28',
        expectedEndDate: '2026-06-04',
        totalEstimatedLeadtime: 25200,
        orderRequestedQuantity: 120,
        orderPlannedQuantity: 120,
        orderActualQuantity: 0,
        penaltyAmount: 0,
        auditMetaData,
        softDeleteMetaData: activeSoftDeleteMetaData,
        orderAttachments: [
            {
                orderAttachmentId: 1,
                attachmentName: 'customer-requirements.pdf',
                attachmentUrl: 'https://example.com/demo/customer-requirements.pdf',
                uploadedAt: '2026-05-20T08:15:00.000Z',
            },
        ],
        orderDrawings: [
            {
                orderDrawingId: '1001',
                drawingCodeId: 'dwg-template-001',
                drawingCode: 'DWG-2026-118',
                drawingCodeName: 'CNC surface bracket',
                defaultCompletionTimeSeconds: 12600,
                drawingStatus: 'PENDING',
                productionType: ProductionType.BATCH,
                orderDrawingRequestedQuantity: 120,
                orderDrawingPlannedQuantity: 120,
                orderDrawingActualQuantity: 0,
                orderDrawingErrorActualQuantity: 0,
                productionTasks: [],
            },
        ],
    },
    {
        orderId: 'order-demo-002',
        orderCode: 'ORD-2026-1048',
        orderName: 'Cover plate cutting and heat treatment',
        customerName: 'Eastern Precision',
        customerPhone: '0904455667',
        customerNote: 'Heat treatment certificate required.',
        orderPriority: 'MEDIUM',
        orderStatus: 'IN_PROGRESS',
        expectedStartDate: '2026-05-24',
        expectedEndDate: '2026-06-01',
        totalEstimatedLeadtime: 21600,
        orderRequestedQuantity: 80,
        orderPlannedQuantity: 80,
        orderActualQuantity: 48,
        penaltyAmount: 0,
        auditMetaData,
        softDeleteMetaData: activeSoftDeleteMetaData,
        orderAttachments: [],
        orderDrawings: [
            {
                orderDrawingId: '1002',
                drawingCodeId: 'dwg-template-002',
                drawingCode: 'DWG-2026-132',
                drawingCodeName: 'Heat treatment cover plate',
                defaultCompletionTimeSeconds: 10800,
                drawingStatus: 'IN_PROGRESS',
                productionType: ProductionType.BATCH,
                orderDrawingRequestedQuantity: 80,
                orderDrawingPlannedQuantity: 80,
                orderDrawingActualQuantity: 48,
                orderDrawingErrorActualQuantity: 2,
                productionTasks: [],
            },
        ],
    },
    {
        orderId: 'order-demo-003',
        orderCode: 'ORD-2026-1028',
        orderName: 'Shaft turning lot',
        customerName: 'North Star Parts',
        customerPhone: '0907788991',
        customerNote: '',
        orderPriority: 'LOW',
        orderStatus: 'COMPLETED',
        expectedStartDate: '2026-05-18',
        expectedEndDate: '2026-05-26',
        totalEstimatedLeadtime: 28800,
        orderRequestedQuantity: 60,
        orderPlannedQuantity: 60,
        orderActualQuantity: 60,
        penaltyAmount: 0,
        auditMetaData,
        softDeleteMetaData: activeSoftDeleteMetaData,
        orderAttachments: [],
        orderDrawings: [
            {
                orderDrawingId: '1003',
                drawingCodeId: 'dwg-template-001',
                drawingCode: 'DWG-2026-073',
                drawingCodeName: 'Completed shaft turning',
                defaultCompletionTimeSeconds: 14400,
                drawingStatus: 'COMPLETED',
                productionType: ProductionType.SINGLE_PIECE,
                orderDrawingRequestedQuantity: 60,
                orderDrawingPlannedQuantity: 60,
                orderDrawingActualQuantity: 60,
                orderDrawingErrorActualQuantity: 1,
                productionTasks: [],
            },
        ],
    },
    {
        orderId: 'order-demo-004',
        orderCode: 'ORD-2026-1034',
        orderName: 'Dimensional inspection fixtures',
        customerName: 'Bright Tooling',
        customerPhone: '0905566778',
        customerNote: 'Cancelled by customer before production start.',
        orderPriority: 'URGENT',
        orderStatus: 'CANCELLED',
        expectedStartDate: '2026-05-22',
        expectedEndDate: '2026-05-30',
        totalEstimatedLeadtime: 18000,
        penaltyAmount: 1500000,
        cancellationReason: 'Customer changed fixture design after quotation approval.',
        orderRequestedQuantity: 24,
        orderPlannedQuantity: 24,
        orderActualQuantity: 0,
        auditMetaData,
        softDeleteMetaData: deletedSoftDeleteMetaData,
        orderAttachments: [],
        orderDrawings: [],
    },
];

export const MOCK_ORDER_DRAWINGS: Record<string, OrderDrawingSummaryResponse[]> = {
    'order-demo-001': [
        {
            orderDrawingId: 1001,
            drawingCodeId: 'dwg-template-001',
            drawingCode: 'DWG-2026-118',
            drawingCodeName: 'CNC surface bracket',
            description: 'Main bracket with two production steps.',
            pdfLink: 'https://example.com/demo/dwg-2026-118.pdf',
            ofCustomer: 'IIC Components',
            versionNumber: 3,
            defaultCompletionTimeSeconds: 12600,
            productionType: ProductionType.BATCH,
            orderDrawingRequestedQuantity: 120,
            orderDrawingPlannedQuantity: 120,
            orderDrawingActualQuantity: 0,
            orderDrawingErrorActualQuantity: 0,
            drawingStatus: 'PENDING',
        },
    ],
    'order-demo-002': [
        {
            orderDrawingId: 1002,
            drawingCodeId: 'dwg-template-002',
            drawingCode: 'DWG-2026-132',
            drawingCodeName: 'Heat treatment cover plate',
            description: 'Cover plate profile and heat treatment batch.',
            pdfLink: 'https://example.com/demo/dwg-2026-132.pdf',
            ofCustomer: 'Eastern Precision',
            versionNumber: 1,
            defaultCompletionTimeSeconds: 10800,
            productionType: ProductionType.BATCH,
            orderDrawingRequestedQuantity: 80,
            orderDrawingPlannedQuantity: 80,
            orderDrawingActualQuantity: 48,
            orderDrawingErrorActualQuantity: 2,
            drawingStatus: 'IN_PROGRESS',
        },
    ],
    'order-demo-003': [
        {
            orderDrawingId: 1003,
            drawingCodeId: 'dwg-template-001',
            drawingCode: 'DWG-2026-073',
            drawingCodeName: 'Completed shaft turning',
            description: 'Shaft turning operation completed.',
            pdfLink: 'https://example.com/demo/dwg-2026-073.pdf',
            ofCustomer: 'North Star Parts',
            versionNumber: 2,
            defaultCompletionTimeSeconds: 14400,
            productionType: ProductionType.SINGLE_PIECE,
            orderDrawingRequestedQuantity: 60,
            orderDrawingPlannedQuantity: 60,
            orderDrawingActualQuantity: 60,
            orderDrawingErrorActualQuantity: 1,
            drawingStatus: 'COMPLETED',
        },
    ],
    'order-demo-004': [],
};

export const MOCK_ORDER_TASKS_BY_DRAWING: Record<number, TaskResponse[]> = {
    1001: [
        {
            taskId: 'task-demo-001',
            taskName: 'Machine surface milling',
            taskOrder: 1,
            stepOrder: 1,
            stepName: 'Surface milling',
            stepDescription: 'First-pass milling on CNC machine.',
            requiresQc: true,
            stepDefaultCompletionTimeSeconds: 7200,
            materialName: 'Aluminum 6061',
            taskType: 'NORMAL',
            taskRequestedQuantity: 120,
            taskPlannedQuantity: 120,
            taskActualQuantity: 0,
            taskErrorActualQuantity: 0,
            taskStatus: 'LOCKED',
            parentTaskId: null,
            taskAssignments: [],
            taskReviews: [
                {
                    taskReviewId: 9001,
                    operatorId: 'demo-operator-001',
                    operatorFullName: 'Demo Operator',
                    operatorUserCode: 'OP-DEMO',
                    reviewStatus: 'PENDING',
                },
            ],
        },
        {
            taskId: 'task-demo-002',
            taskName: 'Drill threaded mounting holes',
            taskOrder: 2,
            stepOrder: 2,
            stepName: 'Thread drilling',
            stepDescription: 'Drill and tap mounting holes.',
            requiresQc: true,
            stepDefaultCompletionTimeSeconds: 5400,
            materialName: 'Aluminum 6061',
            taskType: 'NORMAL',
            taskRequestedQuantity: 120,
            taskPlannedQuantity: 120,
            taskActualQuantity: 0,
            taskErrorActualQuantity: 0,
            taskStatus: 'LOCKED',
            parentTaskId: null,
            taskAssignments: [],
            taskReviews: [],
        },
    ],
    1002: [
        {
            taskId: 'task-demo-003',
            taskName: 'Laser cut cover plate',
            taskOrder: 1,
            stepOrder: 1,
            stepName: 'Laser cutting',
            stepDescription: 'Cut cover plate profile.',
            requiresQc: false,
            stepDefaultCompletionTimeSeconds: 3600,
            materialName: 'Steel S45C',
            taskType: 'NORMAL',
            taskRequestedQuantity: 80,
            taskPlannedQuantity: 80,
            taskActualQuantity: 48,
            taskErrorActualQuantity: 2,
            taskStatus: 'IN_PROGRESS',
            parentTaskId: null,
            taskAssignments: [
                {
                    taskAssignmentId: 7001,
                    operatorId: 'demo-operator-001',
                    operatorFullName: 'Demo Operator',
                    operatorUserCode: 'OP-DEMO',
                    machineId: 'machine-demo-001',
                    machineName: 'Laser Cutting 01',
                    machineCode: 'CUT-01',
                    startedAt: '2026-05-27T08:00:00.000Z',
                    endedAt: null,
                    assignedByUserId: 'demo-admin-001',
                    assignedByFullName: 'Demo Admin',
                    assignedAt: '2026-05-26T15:00:00.000Z',
                },
            ],
            taskReviews: [
                {
                    taskReviewId: 9002,
                    operatorId: 'demo-operator-001',
                    operatorFullName: 'Demo Operator',
                    operatorUserCode: 'OP-DEMO',
                    reviewStatus: 'CONFIRMED',
                    reviewedAt: '2026-05-26T16:00:00.000Z',
                },
            ],
        },
    ],
    1003: [
        {
            taskId: 'task-demo-004',
            taskName: 'Completed shaft turning',
            taskOrder: 1,
            stepOrder: 1,
            stepName: 'Turning',
            stepDescription: 'Run turning operation on CNC lathe.',
            requiresQc: true,
            stepDefaultCompletionTimeSeconds: 14400,
            materialName: 'Steel S45C',
            taskType: 'NORMAL',
            taskRequestedQuantity: 60,
            taskPlannedQuantity: 60,
            taskActualQuantity: 60,
            taskErrorActualQuantity: 1,
            taskStatus: 'COMPLETE',
            parentTaskId: null,
            completedAt: '2026-05-26T10:00:00.000Z',
            taskAssignments: [],
            taskReviews: [
                {
                    taskReviewId: 9003,
                    operatorId: 'demo-operator-002',
                    operatorFullName: 'Nguyen Van An',
                    operatorUserCode: 'OP-002',
                    reviewStatus: 'CONFIRMED',
                    reviewedAt: '2026-05-19T09:20:00.000Z',
                },
            ],
        },
    ],
};

export const getMockOrderSummary = (order: OrderResponse): OrderSummaryResponse => ({
    orderId: order.orderId,
    orderCode: order.orderCode,
    orderName: order.orderName,
    customerName: order.customerName,
    orderPriority: order.orderPriority,
    orderStatus: order.orderStatus,
    expectedStartDate: order.expectedStartDate,
    expectedEndDate: order.expectedEndDate,
    auditMetaData: order.auditMetaData,
    softDeleteMetaData: order.softDeleteMetaData,
});

export const buildMockOrderPlan = (orderId: string): OrderDrawingPlanResponse[] =>
    (MOCK_ORDER_DRAWINGS[orderId] ?? []).map((drawing) => ({
        orderDrawingId: drawing.orderDrawingId,
        drawingCodeId: drawing.drawingCodeId,
        totalRequestedQuantity: drawing.orderDrawingRequestedQuantity,
        orderDrawingRequestedQuantity: drawing.orderDrawingRequestedQuantity,
        drawingCode: drawing.drawingCode,
        ofCustomer: drawing.ofCustomer ?? '',
        versionNumber: drawing.versionNumber ?? 1,
        drawingCodeName: drawing.drawingCodeName,
        description: drawing.description ?? '',
        pdfLink: drawing.pdfLink ?? '',
        defaultCompletionTimeSeconds: drawing.defaultCompletionTimeSeconds,
        productionType: drawing.productionType,
        drawingStatus: drawing.drawingStatus,
        orderDrawingSteps: (MOCK_ORDER_TASKS_BY_DRAWING[drawing.orderDrawingId] ?? []).map((task) => ({
            orderDrawingStepId: Number(`${drawing.orderDrawingId}${task.stepOrder}`),
            stepOrder: task.stepOrder,
            stepName: task.stepName,
            description: task.stepDescription ?? '',
            requiresQc: task.requiresQc,
            defaultCompletionTimeSeconds: task.stepDefaultCompletionTimeSeconds ?? 0,
            materialName: task.materialName ?? '',
            productionTasks: [
                {
                    taskId: task.taskId,
                    taskName: task.taskName ?? '',
                    taskOrder: task.taskOrder ?? 1,
                    taskRequestedQuantity: task.taskRequestedQuantity ?? 1,
                    taskPlannedQuantity: task.taskPlannedQuantity ?? 1,
                    taskReviews: task.taskReviews?.map((review) => ({
                        taskReviewId: review.taskReviewId,
                        operatorId: review.operatorId,
                        operatorFullName: review.operatorFullName,
                        operatorUserCode: review.operatorUserCode,
                        reviewStatus: review.reviewStatus,
                        declineReason: review.declineReason ?? null,
                        declineComment: review.declineComment ?? null,
                        reviewedAt: review.reviewedAt ?? null,
                    })) ?? [],
                },
            ],
        })),
    }));

export const buildMockManagerReview = (order: OrderResponse): OrderManagerReviewResponse => {
    const drawings = (MOCK_ORDER_DRAWINGS[order.orderId] ?? []).map((drawing) => ({
        orderDrawingId: drawing.orderDrawingId,
        drawingCode: drawing.drawingCode,
        drawingCodeName: drawing.drawingCodeName,
        tasks: (MOCK_ORDER_TASKS_BY_DRAWING[drawing.orderDrawingId] ?? []).map((task) => ({
            taskId: task.taskId,
            stepOrder: task.stepOrder,
            stepName: task.stepName,
            stepDescription: task.stepDescription ?? null,
            requiresQc: task.requiresQc,
            stepDefaultCompletionTimeSeconds: task.stepDefaultCompletionTimeSeconds ?? 0,
            materialName: task.materialName ?? null,
            taskName: task.taskName ?? '',
            taskOrder: task.taskOrder ?? 1,
            taskType: task.taskType,
            taskRequestedQuantity: task.taskRequestedQuantity ?? 0,
            taskPlannedQuantity: task.taskPlannedQuantity ?? 0,
            taskStatus: task.taskStatus,
            cancelReason: null,
            reviews: task.taskReviews?.map((review) => ({
                taskReviewId: review.taskReviewId,
                operatorId: review.operatorId,
                operatorFullName: review.operatorFullName,
                operatorUserCode: review.operatorUserCode,
                reviewStatus: review.reviewStatus,
                declineReason: review.declineReason ?? null,
                declineComment: review.declineComment ?? null,
                reviewedAt: review.reviewedAt ?? null,
                activityLogs: review.reviewedAt
                    ? [
                          {
                              activityLogId: review.taskReviewId,
                              userFullName: review.operatorFullName,
                              oldValue: 'PENDING',
                              newValue: review.reviewStatus,
                              description: 'Demo review status update',
                              createdAt: review.reviewedAt,
                          },
                      ]
                    : [],
            })) ?? [],
        })),
    }));

    const tasks = drawings.flatMap((drawing) => drawing.tasks);
    const allReviews = tasks.flatMap((task) => task.reviews);

    return {
        order,
        totalTasks: tasks.length,
        unassignedTasks: tasks.filter((task) => task.reviews.length === 0).length,
        pendingTasks: allReviews.filter((review) => review.reviewStatus === 'PENDING').length,
        confirmedTasks: allReviews.filter((review) => review.reviewStatus === 'CONFIRMED').length,
        declinedTasks: allReviews.filter((review) => review.reviewStatus === 'DECLINED').length,
        allAssignedConfirmed:
            tasks.length > 0 &&
            tasks.every(
                (task) =>
                    task.reviews.length > 0 &&
                    task.reviews.every((review) => review.reviewStatus === 'CONFIRMED')
            ),
        orderDrawings: drawings,
    };
};

export const buildMockOperatorReview = (order: OrderResponse): OrderOperatorReviewResponse => ({
    orderId: order.orderId,
    orderCode: order.orderCode,
    orderName: order.orderName,
    orderPriority: order.orderPriority,
    expectedStartDate: order.expectedStartDate,
    orderDrawings: (MOCK_ORDER_DRAWINGS[order.orderId] ?? []).map((drawing) => ({
        orderDrawingId: drawing.orderDrawingId,
        drawingCodeId: drawing.drawingCodeId,
        drawingCode: drawing.drawingCode,
        drawingCodeName: drawing.drawingCodeName,
        productionType: drawing.productionType,
        orderSteps: (MOCK_ORDER_TASKS_BY_DRAWING[drawing.orderDrawingId] ?? [])
            .filter((task) => (task.taskReviews?.length ?? 0) > 0)
            .map((task) => {
                const review = task.taskReviews?.[0];

                return {
                    stepOrder: task.stepOrder,
                    stepName: task.stepName,
                    description: task.stepDescription ?? '',
                    requiresQc: task.requiresQc,
                    defaultCompletionTimeSeconds: task.stepDefaultCompletionTimeSeconds ?? 0,
                    materialName: task.materialName ?? null,
                    tasks: [
                        {
                            taskId: task.taskId,
                            taskName: task.taskName ?? '',
                            taskOrder: task.taskOrder ?? 1,
                            taskRequestedQuantity: task.taskRequestedQuantity ?? 0,
                            taskPlannedQuantity: task.taskPlannedQuantity ?? 0,
                            taskStatus: task.taskStatus,
                            myReview: {
                                taskReviewId: review?.taskReviewId ?? 0,
                                operatorId: review?.operatorId ?? 'demo-operator-001',
                                operatorFullName: review?.operatorFullName ?? 'Demo Operator',
                                operatorUserCode: review?.operatorUserCode ?? 'OP-DEMO',
                                reviewStatus: review?.reviewStatus ?? 'PENDING',
                                declineReason: review?.declineReason ?? null,
                                declineComment: review?.declineComment ?? null,
                                reviewedAt: review?.reviewedAt ?? null,
                            },
                        },
                    ],
                };
            }),
    })),
});

export const buildMockOperatorSummaries = (): OrderOperatorSummaryResponse[] =>
    MOCK_ORDERS.filter((order) => order.orderStatus === 'REVIEWING').map((order) => {
        const tasks = (MOCK_ORDER_DRAWINGS[order.orderId] ?? []).flatMap(
            (drawing) => MOCK_ORDER_TASKS_BY_DRAWING[drawing.orderDrawingId] ?? []
        );
        const reviews = tasks.flatMap((task) => task.taskReviews ?? []);

        return {
            orderId: order.orderId,
            orderCode: order.orderCode,
            orderName: order.orderName,
            orderPriority: order.orderPriority,
            expectedStartDate: order.expectedStartDate,
            orderStatus: order.orderStatus,
            myTotalTasks: reviews.length,
            myPendingTasks: reviews.filter((review) => review.reviewStatus === 'PENDING').length,
            myConfirmedTasks: reviews.filter((review) => review.reviewStatus === 'CONFIRMED').length,
            myDeclinedTasks: reviews.filter((review) => review.reviewStatus === 'DECLINED').length,
        };
    }).filter((summary) => summary.myTotalTasks > 0);

export const updateMockTaskReview = (
    taskReviewId: number,
    status: TaskReviewStatus,
    declineReason?: TaskDeclineReason | null,
    declineComment?: string | null
) => {
    Object.values(MOCK_ORDER_TASKS_BY_DRAWING).forEach((tasks) => {
        tasks.forEach((task) => {
            task.taskReviews?.forEach((review) => {
                if (review.taskReviewId === taskReviewId) {
                    review.reviewStatus = status;
                    review.reviewedAt = new Date().toISOString();
                    if (status === 'DECLINED') {
                        review.declineReason = declineReason ?? 'OTHER';
                        review.declineComment = declineComment ?? undefined;
                    } else {
                        delete review.declineReason;
                        delete review.declineComment;
                    }
                }
            });
        });
    });
};

export const updateMockOrderStatus = (orderId: string, status: OrderStatus) => {
    const order = MOCK_ORDERS.find((item) => item.orderId === orderId);
    if (order) {
        order.orderStatus = status;
        order.auditMetaData = { ...order.auditMetaData, updatedAt: new Date().toISOString() };
    }
};
