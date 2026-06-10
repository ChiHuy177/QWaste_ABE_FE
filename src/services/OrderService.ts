import { TaskResponse } from '@/types';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import { TaskService } from './TaskService';
import {
    OrderSummaryResponse,
    OrderResponse,
    OrderCreationRequest,
    OrderUpdationRequest,
    OrderInfoUpdationRequest,
    OrderPlanUpdationRequest,
    OrderDrawingSummaryResponse,
    OrderOperatorSummaryResponse,
    OrderManagerReviewResponse,
    OrderOperatorReviewResponse,
    OrderDrawingPlanResponse,
} from '@/types/Order';

export class OrderService {
    static async getAllOrders(): Promise<OrderSummaryResponse[]> {
        const response = await NetworkService.requestJson<OrderSummaryResponse[]>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.BASE,
        });
        return response.result as OrderSummaryResponse[];
    }

    static async getOrderById(orderId: string): Promise<OrderResponse> {
        const response = await NetworkService.requestJson<OrderResponse>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.DETAIL(orderId),
        });
        return response.result as OrderResponse;
    }

    static async createOrder(orderData: OrderCreationRequest): Promise<OrderResponse> {
        const response = await NetworkService.requestJson<OrderResponse>({
            method: 'POST',
            url: ENDPOINTS.ORDERS.BASE,
            data: orderData,
        });
        return response.result as OrderResponse;
    }

    static async updateOrder(orderData: OrderUpdationRequest): Promise<string> {
        const response = await NetworkService.requestJson<OrderResponse>({
            method: 'PUT',
            url: ENDPOINTS.ORDERS.DETAIL(orderData.orderId),
            data: orderData,
        });
        return response.message as string;
    }

    static async updateOrderInfo(orderData: OrderInfoUpdationRequest): Promise<string> {
        const response = await NetworkService.requestJson<OrderResponse>({
            method: 'PUT',
            url: ENDPOINTS.ORDERS.UPDATE_INFO,
            data: orderData,
        });
        return response.message as string;
    }

    static async updateOrderPlan(orderData: OrderPlanUpdationRequest): Promise<string> {
        const response = await NetworkService.requestJson<OrderResponse>({
            method: 'PUT',
            url: ENDPOINTS.ORDERS.UPDATE_PLAN,
            data: orderData,
        });
        return response.message as string;
    }

    static async confirmOrder(orderId: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.ORDERS.CONFIRM(orderId),
        });
        return response.message as string;
    }

    static async deleteOrder(orderId: string): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.ORDERS.DETAIL(orderId),
        });
        return response.result;
    }
    static async getTasksByOrderId(orderId: string): Promise<TaskResponse[]> {
        return TaskService.getTasksByOrderId(orderId);
    }

    static async getOrderDrawings(orderId: string): Promise<OrderDrawingSummaryResponse[]> {
        const response = await NetworkService.requestJson<OrderDrawingSummaryResponse[]>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.DRAWINGS(orderId),
        });
        return response.result as OrderDrawingSummaryResponse[];
    }

    static async getOrderDrawingDetail(
        orderId: string,
        drawingId: string
    ): Promise<TaskResponse[]> {
        const response = await NetworkService.requestJson<TaskResponse[]>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.DRAWING_DETAIL(orderId, drawingId),
        });
        return response.result as TaskResponse[];
    }

    static async getOrderPlanForEdit(orderId: string): Promise<OrderDrawingPlanResponse[]> {
        const response = await NetworkService.requestJson<OrderDrawingPlanResponse[]>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.PLAN_FOR_EDIT(orderId),
        });
        return response.result as OrderDrawingPlanResponse[];
    }

    static async getMyReviewingOrders(): Promise<OrderOperatorSummaryResponse[]> {
        const response = await NetworkService.requestJson<OrderOperatorSummaryResponse[]>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.MY_REVIEWING_ORDERS,
        });
        return response.result as OrderOperatorSummaryResponse[];
    }

    static async getManagerReviewDashboard(orderId: string): Promise<OrderManagerReviewResponse> {
        const response = await NetworkService.requestJson<OrderManagerReviewResponse>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.MANAGER_REVIEW(orderId),
        });
        return response.result as OrderManagerReviewResponse;
    }

    static async getOperatorReviewForm(orderId: string): Promise<OrderOperatorReviewResponse> {
        const response = await NetworkService.requestJson<OrderOperatorReviewResponse>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.OPERATOR_REVIEW(orderId),
        });
        return response.result as OrderOperatorReviewResponse;
    }

    static async confirmTaskReview(taskReviewId: number): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'POST',
            url: ENDPOINTS.TASK_REVIEWS.CONFIRM(taskReviewId),
        });
    }

    static async declineTaskReview(
        taskReviewId: number,
        data: { declineReason: string; declineComment?: string }
    ): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'POST',
            url: ENDPOINTS.TASK_REVIEWS.DECLINE(taskReviewId),
            data,
        });
    }

    static async cancelOrder(orderId: string, reason: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.ORDERS.CANCEL(orderId),
            data: { cancellationReason: reason },
        });
        return response.message as string;
    }

    static async restoreOrder(orderId: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.ORDERS.RESTORE(orderId),
        });
        return response.message as string;
    }

    static async exportOrderToExcel(orderId: string): Promise<Blob> {
        return await NetworkService.requestBlob({
            method: 'GET',
            url: ENDPOINTS.ORDERS.EXPORT(orderId),
        });
    }
}
