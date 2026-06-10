import { OrderDrawingRequest, TaskReview } from '@/types/Order';

export const mapOrderDrawingsToRequest = (orderDrawings: any[]): OrderDrawingRequest[] => {
    return (orderDrawings || []).map((drawing: any) => ({
        orderDrawingId: drawing.orderDrawingId,
        drawingCodeId: drawing.drawingCodeId,
        totalRequestedQuantity: drawing.totalRequestedQuantity,
        productionType: drawing.productionType || 'BATCH',
        orderSteps: (drawing.orderSteps || []).map((step: any) => ({
            orderDrawingStepId: step.orderDrawingStepId,
            stepOrder: step.stepOrder,
            stepName: step.stepName,
            description: step.description,
            requiresQc: step.requiresQc,
            defaultCompletionTimeSeconds: step.defaultCompletionTimeSeconds,
            materialName: step.materialName,
            tasks: (step.tasks || []).map((task: any) => ({
                taskId: task.taskId,
                taskOrder: task.taskOrder,
                taskName: task.taskName,
                taskRequestedQuantity: task.taskRequestedQuantity,
                taskPlannedQuantity: task.taskPlannedQuantity,
                operatorIds: task.operatorIds || [],
            })),
        })),
    }));
};

export const mapPlanDataToFormValues = (planData: any[]): any[] => {
    return planData.map((planDrawing) => {
        const orderSteps = [...(planDrawing.orderDrawingSteps || [])]
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((step) => ({
                orderDrawingStepId: step.orderDrawingStepId,
                stepOrder: step.stepOrder,
                stepName: step.stepName,
                description: step.description ?? '',
                requiresQc: step.requiresQc,
                defaultCompletionTimeSeconds: step.defaultCompletionTimeSeconds,
                materialName: step.materialName,
                tasks: [...(step.productionTasks || [])]
                    .sort((a, b) => a.taskOrder - b.taskOrder)
                    .map((task) => ({
                        taskId: task.taskId,
                        taskOrder: task.taskOrder,
                        taskName: task.taskName,
                        taskRequestedQuantity: task.taskRequestedQuantity ?? 1,
                        taskPlannedQuantity: task.taskPlannedQuantity ?? 1,
                        operatorIds: task.taskReviews?.map((r: TaskReview) => r.operatorId) ?? [],
                        _reviews: task.taskReviews,
                    })),
            }));

        const metadata = {
            drawingStatus: planDrawing.drawingStatus,
            drawingCode: planDrawing.drawingCode,
            ofCustomer: planDrawing.ofCustomer,
            versionNumber: planDrawing.versionNumber,
            drawingCodeName: planDrawing.drawingCodeName,
            description: planDrawing.description,
            pdfLink: planDrawing.pdfLink,
            defaultCompletionTimeSeconds: planDrawing.defaultCompletionTimeSeconds,
        };

        return {
            orderDrawingId: planDrawing.orderDrawingId,
            drawingCodeId: planDrawing.drawingCodeId,
            totalRequestedQuantity:
                planDrawing.totalRequestedQuantity ??
                planDrawing.orderDrawingRequestedQuantity,
            productionType: planDrawing.productionType || 'BATCH',
            orderSteps,
            _metadata: metadata,
        };
    });
};

export const mapAttachmentsToFormValue = (attachments: any[]): any[] => {
    return (
        attachments?.map((att: any) => ({
            attachmentUrl: att.attachmentUrl,
            attachmentName: att.attachmentName,
        })) || []
    );
};
