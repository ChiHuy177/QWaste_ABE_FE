'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanActions } from '@/stores/ProductionPlanStore';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { MachineService } from '@/services/MachineService';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { IncidentDeferRequest, ProductionPlanMoveRequest } from '@/types/ProductionPlan';
import { ReorderErrorHandler } from '../_utils/reorderErrorHandler';
import { mapWeeklyGroups } from '../_utils/planMappers';
import { useMachineOptions } from '../_hooks/useMachineOptions';
import { useMoldOptions } from '../_hooks/useMoldOptions';
import { productionPlanQueryKeys } from '../_hooks/queryKeys';
import type { MachineGroupVM, PlanRowTarget } from '../_components/types';
import type { TransferPayload } from '../_components/TransferGridModal';
import type { RawPlanData } from './useProductionPlanData';

const DATE_FORMAT = 'YYYY-MM-DD';
// BE phân trang theo máy (size mặc định 20) — lấy dư để render toàn bộ lưới tuần (G9).
const MACHINE_PAGE_SIZE = 100;
// BE clamp sequence vượt quá cuối ngày về vị trí hợp lệ cuối cùng — gửi số lớn để luôn
// "chèn cuối hàng đợi" của (machine, plannedDate) đích mà không cần biết trước ngày đó
// đang có bao nhiêu kế hoạch (tránh phải fetch cả lưới tuần chỉ để đếm).
const APPEND_TO_QUEUE_END = 999_999;
// Giới hạn số tuần được phép chuyển tới trước — tránh cho phép nhảy vô hạn về tương lai.
const MAX_GRID_WEEK_OFFSET = 8;

interface UseTransferPlanParams {
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

/** Lưới tuần hợp nhất (hướng 1) — 1 modal duy nhất xử lý chọn máy/ngày (kể cả tuần khác) +
 * lý do sự cố + xác nhận, thay cho popover + modal lưới tách rời trước đây. */
export const useTransferPlan = ({ weekStart, machineCodeById, onMutated }: UseTransferPlanParams) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const { molds } = useMoldOptions();
    const { machineInfoMap } = useMachineOptions();

    const dirtyMachineIds = useAppSelector((state) => state.productionPlan.dirtyMachineIds);
    const isReorderDirty = dirtyMachineIds.length > 0;

    const transferState = useAppSelector((state) => state.productionPlan.transferState);

    // Số tuần lệch so với tuần đang xem ở trang chính (0 = tuần hiện tại, chỉ còn ngày từ
    // todayIndex; >0 = tuần sau, đủ 7 ngày) — reset về 0 mỗi khi mở lượt chuyển mới.
    const [gridWeekOffset, setGridWeekOffset] = useState(0);

    useEffect(() => {
        if (transferState.open) setGridWeekOffset(0);
    }, [transferState]);

    const gridWeekStart = useMemo(
        () => weekStart.add(gridWeekOffset * 7, 'day'),
        [weekStart, gridWeekOffset]
    );

    const shiftGridWeek = (dir: 1 | -1) => {
        setGridWeekOffset((prev) => Math.min(MAX_GRID_WEEK_OFFSET, Math.max(0, prev + dir)));
    };

    const blockIfReorderDirty = () => {
        if (!isReorderDirty) return false;
        toast.warning(t('productionPlan.reorder.lockedActionHint'));
        return true;
    };

    const closeTransfer = () => {
        dispatch(productionPlanActions.setTransferState({ open: false }));
    };

    const openTransfer = (target: PlanRowTarget) => {
        if (blockIfReorderDirty()) return;
        const slug = transferPermissionSlug(target.row.status);
        if (!slug) return;
        if (!checkPermission(slug, 'production_plan')) return;
        dispatch(productionPlanActions.setTransferState({ open: true, ...target }));
    };

    // Công đoạn khuôn của kế hoạch đang chuyển — xác định máy nào tương thích
    // (GET /machines/v1/pickingByOperationType) và moldId cho payload /incident/defer.
    const transferMold = useMemo(
        () =>
            transferState.open
                ? molds.find((m) => m.moldCode === transferState.row.moldCode)
                : undefined,
        [molds, transferState]
    );
    const operationTypeId = transferMold?.operationType?.operationTypeId;

    const compatibleMachinesQuery = useQuery({
        queryKey: ['machines', 'pickingByOperationType', operationTypeId],
        queryFn: () => MachineService.getMachinesPickingByOperationType(operationTypeId as number),
        enabled: transferState.open && operationTypeId != null,
    });

    // Lưới tuần của modal chuyển — chia sẻ cache thô (RawPlanData) với view weekly chính khi
    // trùng tuần đang xem (cùng queryKey); đổi sang tuần khác thì fetch riêng theo tuần đó.
    const weeklyGridQuery = useQuery({
        queryKey: productionPlanQueryKeys.weekly(gridWeekStart.format(DATE_FORMAT)),
        queryFn: async (): Promise<RawPlanData> => {
            const page = await ProductionPlanService.getWeeklyProductionPlans({
                startDate: gridWeekStart.format(DATE_FORMAT),
                endDate: gridWeekStart.add(6, 'day').format(DATE_FORMAT),
                size: MACHINE_PAGE_SIZE,
            });
            return { kind: 'weekly', content: page.content };
        },
        enabled: transferState.open,
    });

    // BE /weekly chỉ trả máy đã có plan trong khoảng ngày đó — 1 tuần chưa có kế hoạch nào sẽ
    // trả rỗng. Dùng danh sách máy tương thích (pickingByOperationType) làm nguồn danh sách
    // dòng của lưới (luôn hiện đủ), rồi lấy dữ liệu lịch từ /weekly để lấp vào từng dòng.
    const transferWeeklyGroups = useMemo(() => {
        const groupsByMachineId = new Map<string, MachineGroupVM>();
        if (weeklyGridQuery.data && weeklyGridQuery.data.kind === 'weekly') {
            mapWeeklyGroups(
                weeklyGridQuery.data.content,
                machineInfoMap,
                gridWeekStart.format(DATE_FORMAT)
            ).forEach((group) => groupsByMachineId.set(group.machineId, group));
        }

        return (compatibleMachinesQuery.data ?? []).map((machine): MachineGroupVM => {
            const machineId = String(machine.machineId);
            return (
                groupsByMachineId.get(machineId) ?? {
                    machineId,
                    machineCode: machine.machineCode || machine.machineName,
                    machineName: machine.machineName,
                    spaceName: machine.space?.spaceName ?? '',
                    products: [],
                }
            );
        });
    }, [weeklyGridQuery.data, machineInfoMap, gridWeekStart, compatibleMachinesQuery.data]);

    // PAUSE — BE /incident/defer (chốt PARTIAL + tạo kế hoạch con nối tiếp).
    const deferMutation = useMutation({
        mutationFn: (args: { target: PlanRowTarget; payload: IncidentDeferRequest }) =>
            ProductionPlanService.deferProductionPlan(args.target.row.productionPlanId, args.payload),
        onSuccess: async () => {
            toast.success(t('productionPlan.transfer.success'));
            onMutated();
        },
        onError: (error) => {
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

    const handleTransferConfirm = (payload: TransferPayload) => {
        if (!transferState.open) return;
        const target: PlanRowTarget = transferState;
        const plannedDate = gridWeekStart.add(payload.dayIndex, 'day').format(DATE_FORMAT);

        if (target.row.status === 'PAUSE') {
            const moldId = transferMold?.moldId;
            if (!moldId) {
                toast.error(t('productionPlan.transfer.detailNotReady'));
                return;
            }
            if (!payload.incidentReason) return;
            deferMutation.mutate(
                {
                    target,
                    payload: {
                        plannedDate,
                        machineId: payload.machineId,
                        moldId,
                        sequence: APPEND_TO_QUEUE_END,
                        incidentReason: payload.incidentReason,
                        note: payload.note,
                    },
                },
                { onSuccess: closeTransfer }
            );
            return;
        }

        moveMutation.mutate(
            {
                target,
                payload: { plannedDate, machineId: payload.machineId, sequence: APPEND_TO_QUEUE_END },
            },
            { onSuccess: closeTransfer }
        );
    };

    return {
        transferState,
        transferSubmitting,
        transferWeeklyGroups,
        transferGridLoading: weeklyGridQuery.isLoading || compatibleMachinesQuery.isLoading,
        gridWeekStart,
        gridWeekOffset,
        shiftGridWeek,
        openTransfer,
        closeTransfer,
        handleTransferConfirm,
    };
};
