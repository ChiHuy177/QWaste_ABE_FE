'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FormInstance } from 'antd';
import { OrderService } from '@/services';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { mapPlanDataToFormValues } from '../utils/mappers';

interface UseOrderPlanDataProps {
    isEditing: boolean;
    selectedOrderId?: string;
    isOrderFormOpen: boolean;
    activeEditTab: 'info' | 'plan';
    planForm: FormInstance;
    currentOrder?: any;
    isLoadingOperators: boolean;
}

export const useOrderPlanData = ({
    isEditing,
    selectedOrderId,
    isOrderFormOpen,
    activeEditTab,
    planForm,
    currentOrder,
    isLoadingOperators,
}: UseOrderPlanDataProps) => {
    const { t } = useTranslation();
    const [isLoadingPlanData, setIsLoadingPlanData] = useState(false);
    const planFormDataFetchedForOrderId = useRef<string | null>(null);

    useEffect(() => {
        const loadPlanData = async () => {
            if (!isEditing || !selectedOrderId || !isOrderFormOpen || activeEditTab !== 'plan') {
                return;
            }

            // Tránh fetch duplicate
            if (planFormDataFetchedForOrderId.current === selectedOrderId) {
                return;
            }

            // Đợi operators load xong trước
            if (isLoadingOperators) {
                return;
            }

            setIsLoadingPlanData(true);
            try {
                const planData = await OrderService.getOrderPlanForEdit(selectedOrderId);
                const mappedDrawings = mapPlanDataToFormValues(planData);

                planForm.setFieldsValue({
                    productionType: currentOrder?.productionType || 'BATCH',
                    orderDrawings: mappedDrawings,
                });

                // Đánh dấu đã fetch
                planFormDataFetchedForOrderId.current = selectedOrderId;
            } catch (error) {
                console.error('Error loading plan data:', error);
                toast.error(t('orderManagement.form.messages.fetchDrawingDetailsError'));
            } finally {
                setIsLoadingPlanData(false);
            }
        };

        loadPlanData();
    }, [
        isEditing,
        selectedOrderId,
        isOrderFormOpen,
        activeEditTab,
        planForm,
        currentOrder,
        t,
        isLoadingOperators,
    ]);

    // Reset cache khi cần fetch lại
    const resetPlanDataCache = useCallback(() => {
        planFormDataFetchedForOrderId.current = null;
    }, []);

    return {
        isLoadingPlanData,
        resetPlanDataCache,
    };
};
