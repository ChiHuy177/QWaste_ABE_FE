'use client';

import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanActions } from '@/stores/ProductionPlanStore';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { ProductionPlanMoveRequest } from '@/types/ProductionPlan';
import { mapWeeklyGroups } from '../_utils/planMappers';
import { ReorderErrorHandler } from '../_utils/reorderErrorHandler';
import { useMachineOptions } from '../_hooks/useMachineOptions';
import { useMoldOptions } from '../_hooks/useMoldOptions';
import { productionPlanQueryKeys } from '../_hooks/queryKeys';
import type {
    MachineGroupVM,
    PlanRowTarget,
} from '../_components/types';
import type { TransferMachinePayload } from '../_components/TransferMachineModal';
import type { TransferSchedulePayload } from '../_components/TransferScheduleModal';
import type { RawPlanData } from './useProductionPlanData';

const DATE_FORMAT = 'YYYY-MM-DD';
const MACHINE_PAGE_SIZE = 100;

interface UseTransferPlanParams {
    machineGroups: MachineGroupVM[];
    selectedDate: Dayjs;
    weekStart: Dayjs;
    machineCodeById: Map<string, string>;
    onMutated: () => void;
}

// PENDING dùng /move (slug production_plan:move), PAUSE dùng /incident/defer
// (slug production_plan:incident) — trạng thái khác không cho phép transfer.
const transferPermissionSlug = (status: PlanRowTarget['row']['status']) => {
    if (status === 'PENDING') return 'move';
    if (status === 'PAUSE') return 'incident';
    return null;
};

const nextSequence = (machineGroups: MachineGroupVM[], machineId: string): number => {
    const group = machineGroups.find((g) => g.machineId === machineId);
    if (!group) return 1;
    const maxSequence = group.products.reduce(
        (max, product) => Math.max(max, product.sequence ?? 0),
        0
    );
    return maxSequence + 1;
};

/** Transfer máy/lịch (BE incident defer/move — G6). */
export const useTransferPlan = ({
    machineGroups,
    selectedDate,
    weekStart,
    machineCodeById,
    onMutated,
}: UseTransferPlanParams) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const { molds } = useMoldOptions();
    const { machineInfoMap } = useMachineOptions();

    const dirtyMachineIds = useAppSelector((state) => state.productionPlan.dirtyMachineIds);
    const isReorderDirty = dirtyMachineIds.length > 0;

    const transferMachineState = useAppSelector(
        (state) => state.productionPlan.transferMachineState
    );
    const transferScheduleState = useAppSelector(
        (state) => state.productionPlan.transferScheduleState
    );

    const blockIfReorderDirty = () => {
        if (!isReorderDirty) return false;
        toast.warning(t('productionPlan.reorder.lockedActionHint'));
        return true;
    };

    const closeTransferMachineModal = () =>
        dispatch(productionPlanActions.setTransferMachineState({ open: false }));
    const closeTransferScheduleModal = () =>
        dispatch(productionPlanActions.setTransferScheduleState({ open: false }));

    const openTransferMachineModal = (target: PlanRowTarget) => {
        if (blockIfReorderDirty()) return;
        const slug = transferPermissionSlug(target.row.status);
        if (!slug) return;
        if (!checkPermission(slug, 'production_plan')) return;
        dispatch(productionPlanActions.setTransferMachineState({ open: true, ...target }));
    };

    const openTransferScheduleModal = (target: PlanRowTarget) => {
        if (blockIfReorderDirty()) return;
        const slug = transferPermissionSlug(target.row.status);
        if (!slug) return;
        if (!checkPermission(slug, 'production_plan')) return;
        dispatch(productionPlanActions.setTransferScheduleState({ open: true, ...target }));
    };

    // Weekly grid cho TransferScheduleModal — chia sẻ cache thô (RawPlanData) với view weekly
    // chính (cùng queryKey); enrich machineName/spaceName tách sang useMemo bên dưới.
    const weeklyGridQuery = useQuery({
        queryKey: productionPlanQueryKeys.weekly(weekStart.format(DATE_FORMAT)),
        queryFn: async (): Promise<RawPlanData> => {
            const page = await ProductionPlanService.getWeeklyProductionPlans({
                startDate: weekStart.format(DATE_FORMAT),
                endDate: weekStart.add(6, 'day').format(DATE_FORMAT),
                size: MACHINE_PAGE_SIZE,
            });
            return { kind: 'weekly', content: page.content };
        },
        enabled: transferScheduleState.open,
    });
    const transferWeeklyGroups = useMemo(() => {
        if (!weeklyGridQuery.data || weeklyGridQuery.data.kind !== 'weekly') return [];
        return mapWeeklyGroups(
            weeklyGridQuery.data.content,
            machineInfoMap,
            weekStart.format(DATE_FORMAT)
        );
    }, [weeklyGridQuery.data, machineInfoMap, weekStart]);

    // BE detail response không có moldId — resolve từ mold list qua snapshotMoldCode.
    // Tra trên toàn bộ list (kể cả mold hết ACTIVE) vì plan cũ vẫn giữ khuôn cũ.
    const resolveMoldId = (moldCode: string | null) => {
        if (!moldCode) return undefined;
        return molds.find((m) => m.moldCode === moldCode)?.moldId;
    };

    // PAUSE — BE /incident/defer (chốt PARTIAL + tạo kế hoạch con nối tiếp).
    const deferMutation = useMutation({
        mutationFn: (args: {
            target: PlanRowTarget;
            payload: {
                plannedDate: string;
                machineId: string;
                incidentReason: TransferMachinePayload['incidentReason'];
                note?: string;
            };
            sequence: number;
        }) => {
            const moldId = resolveMoldId(args.target.row.moldCode);
            if (!moldId) throw new Error('MOLD_NOT_READY');
            if (!args.payload.incidentReason) throw new Error('MISSING_INCIDENT_REASON');
            return ProductionPlanService.deferProductionPlan(args.target.row.productionPlanId, {
                plannedDate: args.payload.plannedDate,
                machineId: args.payload.machineId,
                moldId,
                sequence: args.sequence,
                incidentReason: args.payload.incidentReason,
                note: args.payload.note,
            });
        },
        onSuccess: async () => {
            toast.success(t('productionPlan.transfer.success'));
            onMutated();
        },
        onError: (error) => {
            if (error instanceof Error && error.message === 'MOLD_NOT_READY') {
                toast.error(t('productionPlan.transfer.detailNotReady'));
                return;
            }
            if (error instanceof Error && error.message === 'MISSING_INCIDENT_REASON') {
                toast.error(t('productionPlan.transfer.error'));
                return;
            }
            handleError(error, { fallbackKey: 'productionPlan.transfer.error' });
        },
    });

    // PENDING — BE /move (chỉ máy/ngày/sequence, không cần lý do sự cố).
    const moveMutation = useMutation({
        mutationFn: (args: { target: PlanRowTarget; payload: ProductionPlanMoveRequest }) =>
            ProductionPlanService.moveProductionPlan(args.target.row.productionPlanId, args.payload),
        onSuccess: async () => {
            toast.success(t('productionPlan.transfer.success'));
            onMutated();
        },
        onError: (error) => {
            ReorderErrorHandler.notify(error, {
                t,
                machineCodeById,
                fallbackKey: 'productionPlan.reorderError',
            });
        },
    });

    const transferSubmitting = deferMutation.isPending || moveMutation.isPending;

    const runTransfer = (
        target: PlanRowTarget,
        plannedDate: string,
        machineId: string,
        sequence: number,
        incidentReason: TransferMachinePayload['incidentReason'],
        note: string | undefined,
        onDone: () => void
    ) => {
        if (target.row.status === 'PAUSE') {
            deferMutation.mutate(
                { target, payload: { plannedDate, machineId, incidentReason, note }, sequence },
                { onSuccess: onDone }
            );
        } else {
            moveMutation.mutate(
                { target, payload: { plannedDate, machineId, sequence } },
                { onSuccess: onDone }
            );
        }
    };

    const handleTransferMachine = (payload: TransferMachinePayload) => {
        if (!transferMachineState.open) return;
        const target: PlanRowTarget = transferMachineState;
        const plannedDate = selectedDate.format(DATE_FORMAT);
        const sequence = nextSequence(machineGroups, payload.machineId);

        runTransfer(
            target,
            plannedDate,
            payload.machineId,
            sequence,
            payload.incidentReason,
            payload.note,
            closeTransferMachineModal
        );
    };

    const handleTransferSchedule = (payload: TransferSchedulePayload) => {
        if (!transferScheduleState.open) return;
        const target: PlanRowTarget = transferScheduleState;

        const targetGroup = transferWeeklyGroups.find(
            (group) => group.machineId === payload.machineId
        );
        const plansOnTargetDay =
            targetGroup?.products.filter(
                (product) => !product.isDeleted && product.schedule[payload.dayIndex] > 0
            ).length ?? 0;
        const plannedDate = weekStart.add(payload.dayIndex, 'day').format(DATE_FORMAT);
        const sequence = plansOnTargetDay + 1;

        runTransfer(
            target,
            plannedDate,
            payload.machineId,
            sequence,
            payload.incidentReason,
            payload.note,
            closeTransferScheduleModal
        );
    };

    return {
        transferMachineState,
        transferScheduleState,
        transferWeeklyGroups,
        transferGridLoading: weeklyGridQuery.isLoading,
        transferSubmitting,
        openTransferMachineModal,
        openTransferScheduleModal,
        closeTransferMachineModal,
        closeTransferScheduleModal,
        handleTransferMachine,
        handleTransferSchedule,
    };
};
