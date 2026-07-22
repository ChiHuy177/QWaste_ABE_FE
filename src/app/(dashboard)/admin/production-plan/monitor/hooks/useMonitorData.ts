'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useProductionMonitor } from '@/hooks/useProductionMonitor';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { ProductionPlanDailyMachineGroup } from '@/types/ProductionPlan';
import { mapDailyGroups } from '../../_utils/planMappers';
import { useMachineOptions } from '../../_hooks/useMachineOptions';
import { productionPlanQueryKeys } from '../../_hooks/queryKeys';
import type { MonitorRowVM } from '../../_components/types';

const DATE_FORMAT = 'YYYY-MM-DD';
const MACHINE_PAGE_SIZE = 100;

/** Dữ liệu monitor hôm nay: fetch daily plans (TanStack) merge status realtime (WebSocket). */
export const useMonitorData = () => {
    const { handleError } = useApiErrorHandler();
    const queryClient = useQueryClient();
    const { machineInfoMap, isLoading: isMachinesLoading } = useMachineOptions();

    // Monitor luôn nhìn hôm nay.
    const todayIso = useMemo(() => dayjs().format(DATE_FORMAT), []);

    // queryFn chỉ fetch dữ liệu thô — enrich machineName/spaceName qua machineInfoMap tách
    // sang useMemo bên dưới để không phải nhét Map vào queryKey (không serializable).
    const baseRowsQuery = useQuery({
        queryKey: productionPlanQueryKeys.monitorDaily(todayIso),
        queryFn: async (): Promise<ProductionPlanDailyMachineGroup[]> => {
            const page = await ProductionPlanService.getDailyProductionPlans({
                date: todayIso,
                size: MACHINE_PAGE_SIZE,
            });
            return page.content;
        },
        enabled: !isMachinesLoading,
    });

    useEffect(() => {
        if (baseRowsQuery.error) {
            handleError(baseRowsQuery.error, { fallbackKey: 'productionPlan.fetchError' });
        }
    }, [baseRowsQuery.error, handleError]);

    const baseRows = useMemo<MonitorRowVM[]>(() => {
        const groups = mapDailyGroups(baseRowsQuery.data ?? [], machineInfoMap, 0);
        return groups.flatMap((group) =>
            group.products
                .filter((product) => !product.isDeleted)
                .map((product) => ({
                    productionPlanId: product.productionPlanId,
                    code: product.code,
                    name: product.name,
                    machineId: group.machineId,
                    machineCode: group.machineCode,
                    spaceName: group.spaceName,
                    moldCode: product.moldCode,
                    plannedQuantity: product.schedule[0],
                    actualQuantity: product.actualQuantity,
                    status: product.status,
                    updatedAt: null,
                }))
        );
    }, [baseRowsQuery.data, machineInfoMap]);

    const refresh = useCallback(
        () =>
            queryClient.invalidateQueries({
                queryKey: productionPlanQueryKeys.monitorDaily(todayIso),
            }),
        [queryClient, todayIso]
    );

    const machineIds = useMemo(
        () => Array.from(new Set(baseRows.map((row) => row.machineId))),
        [baseRows]
    );
    const knownPlanIds = useMemo(
        () => new Set(baseRows.map((row) => row.productionPlanId)),
        [baseRows]
    );

    const { statusMap, isConnected, lastUpdate } = useProductionMonitor({
        machineIds,
        dateIso: todayIso,
        knownPlanIds,
        onUnknownPlan: refresh,
    });

    // Merge status realtime đè lên dữ liệu fetch.
    const products = useMemo<MonitorRowVM[]>(
        () =>
            baseRows.map((row) => {
                const entry = statusMap.get(row.productionPlanId);
                if (!entry) return row;
                return {
                    ...row,
                    status: entry.status,
                    updatedAt: entry.updatedAt,
                    trigger: entry.trigger,
                    incidentReason: entry.incidentReason,
                    reason: entry.reason,
                };
            }),
        [baseRows, statusMap]
    );

    return {
        products,
        isLoading: baseRowsQuery.isLoading || baseRowsQuery.isFetching,
        refresh,
        isConnected,
        lastUpdate,
    };
};
