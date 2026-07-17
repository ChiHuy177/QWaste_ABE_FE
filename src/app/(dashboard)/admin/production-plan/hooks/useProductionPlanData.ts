'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanActions } from '@/stores/ProductionPlanStore';
import type { ProductionPlanActiveView } from '@/stores/ProductionPlanStore';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type {
    ProductionPlanDailyMachineGroup,
    ProductionPlanWeeklyMachineGroup,
} from '@/types/ProductionPlan';
import { getTodayScheduleIndex } from '../_utils/dateUtils';
import { mapDailyGroups, mapWeeklyGroups } from '../_utils/planMappers';
import { useMachineOptions } from '../_hooks/useMachineOptions';
import { productionPlanQueryKeys } from '../_hooks/queryKeys';
import type { MachineGroupVM } from '../_components/types';

export type RawPlanData =
    | { kind: 'daily'; content: ProductionPlanDailyMachineGroup[] }
    | { kind: 'weekly'; content: ProductionPlanWeeklyMachineGroup[] };

const DATE_FORMAT = 'YYYY-MM-DD';
// BE phân trang theo máy (size mặc định 20) — lấy dư để render toàn bộ (G9).
const MACHINE_PAGE_SIZE = 100;

const getWeekStart = (date: Dayjs) => date.subtract((date.day() + 6) % 7, 'day');

export interface ProductionPlanSummary {
    totalLines: number;
    totalProducts: number;
    dailyPieces: number;
    weeklyPieces: number;
}

export const useProductionPlanData = () => {
    const dispatch = useAppDispatch();
    const activeView = useAppSelector((state) => state.productionPlan.activeView);
    const selectedDateIso = useAppSelector((state) => state.productionPlan.selectedDate);
    const machineFilter = useAppSelector((state) => state.productionPlan.machineFilter);
    const modalState = useAppSelector((state) => state.productionPlan.modalState);

    const { machineInfoMap, isLoading: isMachinesLoading } = useMachineOptions();

    const selectedDate = useMemo(() => dayjs(selectedDateIso), [selectedDateIso]);
    const selectedDateValue = useMemo(() => selectedDate.toDate(), [selectedDate]);
    const todayIndex = useMemo(() => getTodayScheduleIndex(selectedDateValue), [selectedDateValue]);
    const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
    const isDailyView = activeView === 'daily';

    // queryFn chỉ fetch dữ liệu thô — enrich machineName/spaceName qua machineInfoMap được
    // tách sang useMemo bên dưới để không phải nhét Map vào queryKey (không serializable).
    const planQuery = useQuery({
        queryKey: isDailyView
            ? productionPlanQueryKeys.daily(selectedDate.format(DATE_FORMAT))
            : productionPlanQueryKeys.weekly(weekStart.format(DATE_FORMAT)),
        queryFn: async (): Promise<RawPlanData> => {
            if (isDailyView) {
                const page = await ProductionPlanService.getDailyProductionPlans({
                    date: selectedDate.format(DATE_FORMAT),
                    size: MACHINE_PAGE_SIZE,
                });
                return { kind: 'daily', content: page.content };
            }

            const page = await ProductionPlanService.getWeeklyProductionPlans({
                startDate: weekStart.format(DATE_FORMAT),
                endDate: weekStart.add(6, 'day').format(DATE_FORMAT),
                size: MACHINE_PAGE_SIZE,
            });
            return { kind: 'weekly', content: page.content };
        },
        enabled: !isMachinesLoading,
    });

    const queriedMachineGroups = useMemo<MachineGroupVM[]>(() => {
        if (!planQuery.data) return [];
        if (planQuery.data.kind === 'daily') {
            return mapDailyGroups(planQuery.data.content, machineInfoMap, todayIndex);
        }
        return mapWeeklyGroups(
            planQuery.data.content,
            machineInfoMap,
            weekStart.format(DATE_FORMAT)
        );
    }, [planQuery.data, machineInfoMap, todayIndex, weekStart]);

    const editPlanId =
        modalState.open && modalState.mode === 'edit' ? modalState.row.productionPlanId : undefined;

    // Chi tiết fresh từ GET /productionPlans/v1/{id} khi mở edit — PlanRowVM trong bảng
    // có thể lệch (đã fetch từ trước) và không có field note.
    const editDetailQuery = useQuery({
        queryKey: productionPlanQueryKeys.detail(editPlanId ?? ''),
        queryFn: () => ProductionPlanService.getProductionPlanById(editPlanId as string),
        enabled: !!editPlanId,
    });

    const machineGroups = queriedMachineGroups;
    const normalizedMachineFilter = machineFilter.trim().toLowerCase();

    const summary = useMemo<ProductionPlanSummary>(() => {
        const visibleGroups = machineGroups.filter(
            (group) =>
                group.products.length > 0 &&
                (!normalizedMachineFilter ||
                    group.machineCode.toLowerCase().includes(normalizedMachineFilter) ||
                    group.machineName.toLowerCase().includes(normalizedMachineFilter) ||
                    group.spaceName.toLowerCase().includes(normalizedMachineFilter))
        );

        let totalProducts = 0;
        let dailyPieces = 0;
        let weeklyPieces = 0;

        visibleGroups.forEach((group) => {
            group.products
                .filter((product) => !product.isDeleted)
                .forEach((product) => {
                    totalProducts += 1;
                    dailyPieces += product.schedule[todayIndex];
                    weeklyPieces += product.schedule.reduce((sum, qty) => sum + qty, 0);
                });
        });

        return { totalLines: visibleGroups.length, totalProducts, dailyPieces, weeklyPieces };
    }, [machineGroups, normalizedMachineFilter, todayIndex]);

    const setActiveView = (view: ProductionPlanActiveView) =>
        dispatch(productionPlanActions.setActiveView(view));
    const setSelectedDate = (date: Dayjs) =>
        dispatch(productionPlanActions.setSelectedDate(date.format(DATE_FORMAT)));
    const setMachineFilter = (value: string) =>
        dispatch(productionPlanActions.setMachineFilter(value));

    return {
        activeView,
        selectedDate,
        selectedDateValue,
        todayIndex,
        weekStart,
        machineFilter,
        machineGroups,
        isLoading: planQuery.isLoading,
        editDetail: editDetailQuery.data ?? null,
        isFetchingEditDetail: editDetailQuery.isFetching,
        summary,
        setActiveView,
        setSelectedDate,
        setMachineFilter,
    };
};
