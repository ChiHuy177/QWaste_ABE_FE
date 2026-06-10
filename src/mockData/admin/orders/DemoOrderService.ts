import type {
    OrderCreationRequest,
    OrderDrawingPlanResponse,
    OrderDrawingSummaryResponse,
    OrderInfoUpdationRequest,
    OrderManagerReviewResponse,
    OrderOperatorReviewResponse,
    OrderOperatorSummaryResponse,
    OrderPlanUpdationRequest,
    OrderResponse,
    OrderSummaryResponse,
    TaskDeclineReason,
    OrderUpdationRequest,
} from '@/types/Order';
import type { TaskResponse } from '@/types';
import type { CreateDrawingCodeRequest } from '@/types/DrawingCode';
import { DemoDrawingCodeService } from './DemoDrawingCodeService';
import {
    buildMockManagerReview,
    buildMockOperatorReview,
    buildMockOperatorSummaries,
    buildMockOrderPlan,
    getMockOrderSummary,
    MOCK_ORDER_DRAWINGS,
    MOCK_ORDER_OPERATORS,
    MOCK_ORDER_TASKS_BY_DRAWING,
    MOCK_ORDERS,
    updateMockOrderStatus,
    updateMockTaskReview,
} from './orders';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const findOrder = (orderId: string) => {
    const order = MOCK_ORDERS.find((item) => item.orderId === orderId);
    if (!order) throw new Error('Demo order not found');
    return order;
};

type DemoOrderInfoPayload = Pick<
    OrderUpdationRequest | OrderInfoUpdationRequest,
    | 'orderName'
    | 'customerName'
    | 'customerPhone'
    | 'customerNote'
    | 'expectedStartDate'
    | 'expectedEndDate'
    | 'orderPriority'
>;

const touchOrder = (order: OrderResponse) => {
    order.auditMetaData = { ...order.auditMetaData, updatedAt: new Date().toISOString() };
};

const applyOrderInfoUpdate = (order: OrderResponse, payload: DemoOrderInfoPayload) => {
    order.orderName = payload.orderName;
    order.customerName = payload.customerName ?? order.customerName;
    order.customerPhone = payload.customerPhone;
    order.customerNote = payload.customerNote;
    order.expectedStartDate = payload.expectedStartDate;
    order.expectedEndDate = payload.expectedEndDate;
    order.orderPriority = payload.orderPriority;
    touchOrder(order);
};

export class DemoOrderService {
    static async getAllOrders(): Promise<OrderSummaryResponse[]> {
        return clone(MOCK_ORDERS.map(getMockOrderSummary));
    }

    static async getOrderById(orderId: string): Promise<OrderResponse> {
        return clone(findOrder(orderId));
    }

    static async getTasksByOrderId(orderId: string): Promise<TaskResponse[]> {
        const drawingIds = (MOCK_ORDER_DRAWINGS[orderId] ?? []).map(
            (drawing) => drawing.orderDrawingId
        );
        return clone(
            drawingIds.flatMap((drawingId) => MOCK_ORDER_TASKS_BY_DRAWING[drawingId] ?? [])
        );
    }

    static async getOrderDrawings(orderId: string): Promise<OrderDrawingSummaryResponse[]> {
        return clone(MOCK_ORDER_DRAWINGS[orderId] ?? []);
    }

    static async getOrderDrawingDetail(
        _orderId: string,
        drawingId: string
    ): Promise<TaskResponse[]> {
        return clone(MOCK_ORDER_TASKS_BY_DRAWING[Number(drawingId)] ?? []);
    }

    static async getOrderPlanForEdit(orderId: string): Promise<OrderDrawingPlanResponse[]> {
        return clone(buildMockOrderPlan(orderId));
    }

    static async getMyReviewingOrders(): Promise<OrderOperatorSummaryResponse[]> {
        return clone(buildMockOperatorSummaries());
    }

    static async getManagerReviewDashboard(orderId: string): Promise<OrderManagerReviewResponse> {
        return clone(buildMockManagerReview(findOrder(orderId)));
    }

    static async getOperatorReviewForm(orderId: string): Promise<OrderOperatorReviewResponse> {
        return clone(buildMockOperatorReview(findOrder(orderId)));
    }

    static async createOrder(payload: OrderCreationRequest): Promise<OrderResponse> {
        const order: OrderResponse = {
            orderId: `order-demo-${Date.now()}`,
            orderCode: payload.orderCode,
            orderName: payload.orderName,
            customerName: payload.customerName,
            customerPhone: payload.customerPhone,
            customerNote: payload.customerNote,
            orderPriority: payload.orderPriority,
            orderStatus: 'REVIEWING',
            expectedStartDate: payload.expectedStartDate,
            expectedEndDate: payload.expectedEndDate,
            orderDrawings: [],
            orderAttachments: payload.attachments?.map((attachment, index) => ({
                orderAttachmentId: index + 1,
                attachmentName: attachment.attachmentName,
                attachmentUrl: attachment.attachmentUrl,
                uploadedAt: new Date().toISOString(),
            })),
            auditMetaData: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
            softDeleteMetaData: {
                deletedAt: null,
                deletedBy: null,
                isDeleted: false,
            },
        };

        MOCK_ORDERS.unshift(order);
        MOCK_ORDER_DRAWINGS[order.orderId] = [];
        return clone(order);
    }

    static async updateOrder(payload: OrderUpdationRequest): Promise<string> {
        const order = findOrder(payload.orderId);
        applyOrderInfoUpdate(order, payload);
        order.penaltyAmount = payload.penaltyAmount;
        return 'Demo order updated';
    }

    static async updateOrderInfo(payload: OrderInfoUpdationRequest): Promise<string> {
        const order = findOrder(payload.orderId);
        applyOrderInfoUpdate(order, payload);
        order.orderCode = payload.orderCode;
        return 'Demo order info updated';
    }

    static async updateOrderPlan(_payload: OrderPlanUpdationRequest): Promise<string> {
        return 'Demo order plan updated';
    }

    static async confirmOrder(orderId: string): Promise<string> {
        updateMockOrderStatus(orderId, 'CONFIRMED');
        return 'Demo order confirmed';
    }

    static async deleteOrder(orderId: string): Promise<void> {
        const order = findOrder(orderId);
        order.softDeleteMetaData = {
            deletedAt: new Date().toISOString(),
            deletedBy: 'Demo Admin',
            isDeleted: true,
        };
    }

    static async cancelOrder(orderId: string, reason: string): Promise<string> {
        const order = findOrder(orderId);
        order.orderStatus = 'CANCELLED';
        order.cancellationReason = reason;
        return 'Demo order cancelled';
    }

    static async restoreOrder(orderId: string): Promise<string> {
        const order = findOrder(orderId);
        order.softDeleteMetaData = {
            deletedAt: null,
            deletedBy: null,
            isDeleted: false,
        };
        return 'Demo order restored';
    }

    static async confirmTaskReview(taskReviewId: number): Promise<void> {
        updateMockTaskReview(taskReviewId, 'CONFIRMED');
    }

    static async declineTaskReview(
        taskReviewId: number,
        data?: { declineReason: string; declineComment?: string | null }
    ): Promise<void> {
        updateMockTaskReview(
            taskReviewId,
            'DECLINED',
            data?.declineReason as TaskDeclineReason | undefined,
            data?.declineComment
        );
    }

    static async exportOrderToExcel(orderId: string): Promise<Blob> {
        const order = findOrder(orderId);
        return new Blob([JSON.stringify(order, null, 2)], {
            type: 'application/json',
        });
    }

    static async getDrawingTemplates() {
        return DemoDrawingCodeService.getDrawingCodesForPicking();
    }

    static async createDrawingTemplate(payload: CreateDrawingCodeRequest) {
        return DemoDrawingCodeService.createDrawingTemplate(payload);
    }

    static async getOperators() {
        return clone(MOCK_ORDER_OPERATORS);
    }
}
