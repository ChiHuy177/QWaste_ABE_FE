'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { orderActions } from '@/stores/OrderStore';

export const useOrderFormData = () => {
    const dispatch = useAppDispatch();
    const {
        currentOrder,
        orderDrawings: storeOrderDrawings,
        drawingTemplates,
        operators,
        isSubmitting,
        isFormOpen: isOrderFormOpen,
        formMode: orderFormMode,
        selectedOrderId,
        isLoadingDrawings,
        isLoadingTemplates,
        isLoadingOperators,
    } = useAppSelector((state) => state.order);

    useEffect(() => {
        if (isOrderFormOpen) {
            dispatch(orderActions.fetchDrawingTemplates());
            dispatch(orderActions.fetchOperators());
        }
    }, [isOrderFormOpen, dispatch]);

    const refreshDrawingTemplates = () => {
        dispatch(orderActions.refreshDrawingTemplates());
    };

    return {
        currentOrder,
        storeOrderDrawings,
        drawingTemplates,
        operators,
        isSubmitting,
        isOrderFormOpen,
        orderFormMode,
        selectedOrderId,
        isLoadingDrawings,
        isLoadingTemplates,
        isLoadingOperators,
        refreshDrawingTemplates,
    };
};
