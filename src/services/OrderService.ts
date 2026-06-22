import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import {
    OrderOperatorSummaryResponse,
    OrderOperatorReviewResponse,
} from '@/types/Order';

export class OrderService {
    static async getMyReviewingOrders(): Promise<OrderOperatorSummaryResponse[]> {
        const response = await NetworkService.requestJson<OrderOperatorSummaryResponse[]>({
            method: 'GET',
            url: ENDPOINTS.ORDERS.MY_REVIEWING_ORDERS,
        });
        return response.result as OrderOperatorSummaryResponse[];
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
}
