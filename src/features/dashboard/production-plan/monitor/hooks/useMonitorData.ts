'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useProductionMonitor, type PlanStatusEntry } from '@/hooks/useProductionMonitor';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { ProductionPlanDailyMachineGroup } from '@/types/ProductionPlan';
import { mapDailyGroups } from '../../_utils/planMappers';
import { useMachineOptions } from '../../_hooks/useMachineOptions';
import { productionPlanQueryKeys } from '../../_hooks/queryKeys';
import type { MonitorRowVM } from '../../_components/types';

const DATE_FORMAT = 'YYYY-MM-DD';
const MACHINE_PAGE_SIZE = 100;

export const useMonitorData = () => {
    const { handleError } = useApiErrorHandler();
    const queryClient = useQueryClient();
    const { machineInfoMap, isLoading: isMachinesLoading } = useMachineOptions();

    // Monitor luôn nhìn hôm nay.
    const todayIso = useMemo(() => dayjs().format(DATE_FORMAT), []);

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

    const mergeCacheRef = useRef(
        new Map<string, { entry: PlanStatusEntry; row: MonitorRowVM; merged: MonitorRowVM }>()
    );

    // Merge status realtime đè lên dữ liệu fetch.
    const products = useMemo<MonitorRowVM[]>(() => {
        const cache = mergeCacheRef.current;
        return baseRows.map((row) => {
            const entry = statusMap.get(row.productionPlanId);
            if (!entry) return row;

            const cached = cache.get(row.productionPlanId);
            if (cached && cached.entry === entry && cached.row === row) {
                return cached.merged;
            }

            const merged: MonitorRowVM = {
                ...row,
                status: entry.status ?? row.status,
                updatedAt: entry.updatedAt,
                trigger: entry.trigger ?? row.trigger,
                incidentReason: entry.incidentReason ?? row.incidentReason,
                reason: entry.reason ?? row.reason,
                actualQuantity: entry.actualQuantity ?? row.actualQuantity,
            };
            cache.set(row.productionPlanId, { entry, row, merged });
            return merged;
        });
    }, [baseRows, statusMap]);

    return {
        products,
        isLoading: baseRowsQuery.isLoading || baseRowsQuery.isFetching,
        refresh,
        isConnected,
        lastUpdate,
    };
};
