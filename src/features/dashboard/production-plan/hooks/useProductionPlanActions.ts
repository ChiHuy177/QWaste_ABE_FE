'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanActions } from '@/stores/ProductionPlanStore';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type {
    ProductionPlanFormData,
    ProductionPlanUpdateFormData,
} from '@/types/ProductionPlan';
import { productionPlanQueryKeys } from './queryKeys';
import type {
    MachineGroupVM,
    PlanFormValues,
    PlanModalState,
    PlanRowTarget,
} from '../components/types';

const DATE_FORMAT = 'YYYY-MM-DD';

const nextSequence = (machineGroups: MachineGroupVM[], machineId: string): number => {
    const group = machineGroups.find((g) => g.machineId === machineId);
    if (!group) return 1;
    const maxSequence = group.products.reduce(
        (max, product) => Math.max(max, product.sequence ?? 0),
        0
    );
    return maxSequence + 1;
};

interface UseProductionPlanActionsParams {
    machineGroups: MachineGroupVM[];
    modalState: PlanModalState;
}

/** CRUD (create/edit/delete/restore) cho production-plan — mutation + Redux modal state. */
export const useProductionPlanActions = ({
    machineGroups,
    modalState,
}: UseProductionPlanActionsParams) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const { handleError } = useApiErrorHandler();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();

    const dirtyMachineIds = useAppSelector((state) => state.productionPlan.dirtyMachineIds);
    const deleteState = useAppSelector((state) => state.productionPlan.deleteState);
    const importModalOpen = useAppSelector((state) => state.productionPlan.importModalOpen);
    const isReorderDirty = dirtyMachineIds.length > 0;

    const canCreate = checkPermissionSilent('create', 'product');
    const canReorder = checkPermissionSilent('reorder', 'production_plan');
    const canImport = checkPermissionSilent('import', 'product');

    const invalidatePlanQueries = () =>
        queryClient.invalidateQueries({ queryKey: productionPlanQueryKeys.all });

    const blockIfReorderDirty = () => {
        if (!isReorderDirty) return false;
        toast.warning(t('productionPlan.reorder.lockedActionHint'));
        return true;
    };

    const openCreateModal = () => {
        if (blockIfReorderDirty()) return;
        if (!checkPermission('create', 'product')) return;
        dispatch(productionPlanActions.openCreateModal());
    };

    const openEditModal = (target: PlanRowTarget) => {
        if (blockIfReorderDirty()) return;
        if (!checkPermission('update', 'production_plan')) return;
        dispatch(
            productionPlanActions.openEditModal({ machineId: target.machineId, row: target.row })
        );
    };

    const closeModal = () => dispatch(productionPlanActions.closeModal());

    const createMutation = useMutation({
        mutationFn: (data: ProductionPlanFormData) => ProductionPlanService.createProductionPlan(data),
        onSuccess: async () => {
            toast.success(t('productionPlan.form.createSuccess'));
            closeModal();
            await invalidatePlanQueries();
        },
        onError: (error) => handleError(error, { fallbackKey: 'productionPlan.form.createError' }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: ProductionPlanUpdateFormData) =>
            ProductionPlanService.updateProductionPlan(data),
        onSuccess: async () => {
            toast.success(t('productionPlan.form.updateSuccess'));
            closeModal();
            await invalidatePlanQueries();
        },
        onError: (error) => handleError(error, { fallbackKey: 'productionPlan.form.updateError' }),
    });

    const handleSubmit = async (values: PlanFormValues) => {
        if (!modalState.open) return;

        if (modalState.mode === 'create') {
            if (!values.machineId || !values.moldId || !values.plannedDate) return;
            const request: ProductionPlanFormData = {
                productionPlanCode: values.code,
                productionPlanName: values.name,
                plannedQuantity: values.plannedQuantity,
                sequence: nextSequence(machineGroups, values.machineId),
                plannedDate: values.plannedDate.format(DATE_FORMAT),
                note: values.note,
                machineId: values.machineId,
                moldId: values.moldId,
            };
            await createMutation.mutateAsync(request);
            return;
        }

        const request: ProductionPlanUpdateFormData = {
            productionPlanId: modalState.row.productionPlanId,
            productionPlanCode: values.code,
            productionPlanName: values.name,
            plannedQuantity: values.plannedQuantity,
            moldId: values.moldId,
            note: values.note,
        };
        await updateMutation.mutateAsync(request);
    };

    const requestDelete = (target: PlanRowTarget) => {
        if (blockIfReorderDirty()) return;
        if (!checkPermission('delete', 'production_plan')) return;
        dispatch(productionPlanActions.setDeleteState(target));
    };

    const deleteMutation = useMutation({
        mutationFn: (productionPlanId: string) =>
            ProductionPlanService.deleteProductionPlan(productionPlanId),
        onSuccess: async (message) => {
            toast.success(message || t('productionPlan.deleteSuccess'));
            dispatch(productionPlanActions.setDeleteState(null));
            await invalidatePlanQueries();
        },
        onError: (error) => handleError(error, { fallbackKey: 'productionPlan.deleteError' }),
    });

    const confirmDelete = () => {
        if (!deleteState) return;
        deleteMutation.mutate(deleteState.row.productionPlanId);
    };

    const restoreMutation = useMutation({
        mutationFn: (productionPlanId: string) =>
            ProductionPlanService.restoreProductionPlan(productionPlanId),
        onSuccess: async (message) => {
            toast.success(message || t('productionPlan.restoreSuccess'));
            await invalidatePlanQueries();
        },
        onError: (error) => handleError(error, { fallbackKey: 'productionPlan.restoreError' }),
    });

    const handleRestore = (target: PlanRowTarget) => {
        if (blockIfReorderDirty()) return;
        if (!checkPermission('restore', 'production_plan')) return;
        restoreMutation.mutate(target.row.productionPlanId);
    };

    return {
        canCreate,
        canReorder,
        canImport,
        isReorderDirty,
        blockIfReorderDirty,
        openCreateModal,
        openEditModal,
        closeModal,
        handleSubmit,
        formSubmitting: createMutation.isPending || updateMutation.isPending,
        deleteState,
        requestDelete,
        confirmDelete,
        deleting: deleteMutation.isPending,
        cancelDelete: () => dispatch(productionPlanActions.setDeleteState(null)),
        handleRestore,
        invalidatePlanQueries,
        importModalOpen,
        openImportModal: () => dispatch(productionPlanActions.setImportModalOpen(true)),
        closeImportModal: () => dispatch(productionPlanActions.setImportModalOpen(false)),
    };
};
