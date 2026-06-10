'use client';

import { useAppDispatch } from '@/stores/hook';
import { orderActions } from '@/stores/OrderStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
    OrderCreationRequest,
    OrderInfoUpdationRequest,
    OrderPlanUpdationRequest,
} from '@/types/Order';

export const useOrderFormActions = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const createOrder = async (payload: OrderCreationRequest) => {
        const result = await dispatch(orderActions.createOrder(payload));
        if (result.success) {
            toast.success(t('orderManagement.form.messages.createSuccess'));
        } else {
            toast.error(result.error || t('common.server.unknown'));
        }
        return result.success;
    };

    const updateOrderInfo = async (payload: OrderInfoUpdationRequest) => {
        const result = await dispatch(orderActions.updateOrderInfo(payload));
        if (result.success) {
            toast.success(t('orderManagement.form.messages.updateSuccess'));
        } else {
            toast.error(result.error || t('common.server.unknown'));
        }
        return result.success;
    };

    const updateOrderPlan = async (payload: OrderPlanUpdationRequest) => {
        const result = await dispatch(orderActions.updateOrderPlan(payload));
        if (result.success) {
            toast.success(t('orderManagement.form.messages.updateSuccess'));
        } else {
            toast.error(result.error || t('common.server.unknown'));
        }
        return result.success;
    };

    const openOrderForm = (mode: 'create' | 'edit', orderId?: string) => {
        dispatch(orderActions.openOrderForm(mode, orderId));
    };

    const closeOrderForm = () => {
        dispatch(orderActions.closeOrderForm());
    };

    return {
        createOrder,
        updateOrderInfo,
        updateOrderPlan,
        openOrderForm,
        closeOrderForm,
    };
};
