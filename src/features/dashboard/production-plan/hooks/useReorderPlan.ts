'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanActions } from '@/stores/ProductionPlanStore';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import { getErrorStatus } from '@/utils/apiError';
import type {
    ProductionPlanReorderDayGroup,
    ProductionPlanReorderMachineGroup,
} from '@/types/ProductionPlan';
import { ReorderErrorHandler } from '../utils/reorderErrorHandler';
import { productionPlanQueryKeys } from './queryKeys';
import type { MachineGroupVM, PlanRowVM } from '../components/types';
import type { RawPlanData } from './useProductionPlanData';

const moveArrayItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
};

// BE /reorder chỉ cho phép đổi sequence của plan PENDING/PAUSE — plan status khác
// phải giữ nguyên vị trí tuyệt đối, chỉ hoán vị các plan PENDING/PAUSE với nhau.
const isReorderableStatus = (status: PlanRowVM['status']) =>
    status === 'PENDING' || status === 'PAUSE';

const reorderActiveProducts = (
    activeProducts: PlanRowVM[],
    activeRowKey: string,
    overRowKey: string
) => {
    const reorderableIndices: number[] = [];
    activeProducts.forEach((product, index) => {
        if (isReorderableStatus(product.status)) reorderableIndices.push(index);
    });

    const reorderableItems = reorderableIndices.map((index) => activeProducts[index]);
    const fromIndex = reorderableItems.findIndex((product) => product.rowKey === activeRowKey);
    const toIndex = reorderableItems.findIndex((product) => product.rowKey === overRowKey);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null;

    const reordered = moveArrayItem(reorderableItems, fromIndex, toIndex);
    const nextActiveProducts = [...activeProducts];
    reorderableIndices.forEach((index, i) => {
        nextActiveProducts[index] = reordered[i];
    });
    return nextActiveProducts;
};

interface UseReorderPlanParams {
    machineGroups: MachineGroupVM[];
    selectedDateFormatted: string;
    machineCodeById: Map<string, string>;
}

/**
 * Reorder theo trigger: kéo-thả chỉ cập nhật optimistic (staged) + đánh dấu dirty,
 * API PUT /reorder chỉ gọi khi bấm "Lưu thứ tự" (gộp mọi máy đã đổi).
 */
export const useReorderPlan = ({
    machineGroups,
    selectedDateFormatted,
    machineCodeById,
}: UseReorderPlanParams) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();

    const dirtyMachineIds = useAppSelector((state) => state.productionPlan.dirtyMachineIds);
    const isReorderDirty = dirtyMachineIds.length > 0;

    // Staged local copy trong lúc kéo-thả chưa lưu — machineGroups (query data) vẫn là baseline gốc.
    const [stagedGroups, setStagedGroups] = useState<MachineGroupVM[] | null>(null);
    const displayedGroups = stagedGroups ?? machineGroups;

    const handleReorderProducts = useCallback(
        (machineId: string, activeRowKey: string, overRowKey: string) => {
            if (!checkPermission('reorder', 'production_plan')) return;

            const baseGroups = stagedGroups ?? machineGroups;
            const group = baseGroups.find((g) => g.machineId === machineId);
            if (!group) return;

            const activeProducts = group.products.filter((product) => !product.isDeleted);
            const reordered = reorderActiveProducts(activeProducts, activeRowKey, overRowKey);
            if (!reordered) return;

            const nextGroups = baseGroups.map((currentGroup) => {
                if (currentGroup.machineId !== machineId) return currentGroup;
                const deletedProducts = currentGroup.products.filter((p) => p.isDeleted);
                return { ...currentGroup, products: [...reordered, ...deletedProducts] };
            });

            setStagedGroups(nextGroups);
            dispatch(productionPlanActions.markMachineDirty(machineId));
        },
        [checkPermission, dispatch, machineGroups, stagedGroups]
    );

    const buildReorderDays = useCallback((): ProductionPlanReorderDayGroup[] => {
        const machines: ProductionPlanReorderMachineGroup[] = [];

        displayedGroups.forEach((group) => {
            if (!dirtyMachineIds.includes(group.machineId)) return;

            const baselineGroup = machineGroups.find((g) => g.machineId === group.machineId);
            const baselineSequenceById = new Map(
                (baselineGroup?.products.filter((product) => !product.isDeleted) ?? []).map(
                    (product, index) => [product.productionPlanId, index + 1]
                )
            );

            const productionPlans = group.products
                .filter((product) => !product.isDeleted)
                .map((product, index) => ({
                    productionPlanId: product.productionPlanId,
                    sequence: index + 1,
                }))
                .filter((item) => baselineSequenceById.get(item.productionPlanId) !== item.sequence);

            if (productionPlans.length > 0) {
                machines.push({ machineId: group.machineId, productionPlans });
            }
        });

        return machines.length === 0 ? [] : [{ plannedDate: selectedDateFormatted, machines }];
    }, [dirtyMachineIds, displayedGroups, machineGroups, selectedDateFormatted]);

    const handleDiscardReorder = useCallback(() => {
        setStagedGroups(null);
        dispatch(productionPlanActions.clearDirtyMachines());
    }, [dispatch]);

    const {
        mutateAsync: saveReorderAsync,
        isPending: savingReorder,
    } = useMutation({
        mutationFn: (days: ProductionPlanReorderDayGroup[]) =>
            ProductionPlanService.reorderProductionPlans(days),
        onSuccess: (response) => {
            // BE là nguồn sự thật sau reorder — vá lại đúng các machine group dirty vào cache
            // thô (RawPlanData) của daily query, các nhóm không đổi giữ nguyên. useProductionPlanData
            // sẽ tự map lại VM qua useMemo khi cache đổi — không cần refetch.
            const updatedByMachineId = new Map(
                response.flatMap((day) => day.machines).map((group) => [group.machineId, group])
            );

            queryClient.setQueryData<RawPlanData>(
                productionPlanQueryKeys.daily(selectedDateFormatted),
                (current) => {
                    if (!current || current.kind !== 'daily') return current;
                    return {
                        kind: 'daily',
                        content: current.content.map(
                            (group) => updatedByMachineId.get(group.machineId) ?? group
                        ),
                    };
                }
            );
            setStagedGroups(null);
            dispatch(productionPlanActions.clearDirtyMachines());
            toast.success(t('productionPlan.reorder.saveSuccess'));
        },
        onError: (error) => {
            // Lỗi 400 riêng của /reorder (trùng entry, set mismatch, sequence conflict,
            // hoặc wrapper multi-error 80026) hiển thị chi tiết qua ReorderErrorHandler.
            // Các status khác (401/403/404/409/500...) vẫn dùng handleError toàn cục.
            if (getErrorStatus(error) === 400) {
                ReorderErrorHandler.notify(error, {
                    t,
                    machineCodeById,
                    fallbackKey: 'productionPlan.reorderError',
                });
            } else {
                handleError(error, { fallbackKey: 'productionPlan.reorderError' });
            }
        },
    });

    const handleSaveReorder = useCallback(async () => {
        const days = buildReorderDays();
        if (days.length === 0) {
            setStagedGroups(null);
            dispatch(productionPlanActions.clearDirtyMachines());
            return;
        }
        await saveReorderAsync(days);
    }, [buildReorderDays, dispatch, saveReorderAsync]);

    return {
        isReorderDirty,
        machineGroups: displayedGroups,
        handleReorderProducts,
        handleDiscardReorder,
        handleSaveReorder,
        savingReorder,
    };
};
