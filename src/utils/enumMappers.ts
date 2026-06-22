import { OrderStatus, TaskReviewStatus } from '@/types/Order';

export const getOrderStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
        REVIEWING: 'Under Review',
        CONFIRMED: 'Confirmed',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        IN_PROGRESS: 'In Progress',
    };
    return labels[status];
};

export const getOrderStatusColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
        REVIEWING: 'blue',
        CONFIRMED: 'green',
        COMPLETED: 'success',
        CANCELLED: 'error',
        IN_PROGRESS: 'green',
    };
    return colors[status];
};

export const getReviewStatusLabel = (status: TaskReviewStatus): string => {
    const labels: Record<TaskReviewStatus, string> = {
        PENDING: 'Pending Review',
        CONFIRMED: 'Confirmed',
        DECLINED: 'Declined',
    };
    return labels[status];
};

export const getReviewStatusColor = (status: TaskReviewStatus): string => {
    const colors: Record<TaskReviewStatus, string> = {
        PENDING: 'warning',
        CONFIRMED: 'success',
        DECLINED: 'error',
    };
    return colors[status];
};
