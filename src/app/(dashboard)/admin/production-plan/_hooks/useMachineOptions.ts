import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MachineService } from '@/services/MachineService';
import type { Machine } from '@/types/Machine';
import { buildMachineInfoMap, type MachineInfoMap } from '../_utils/planMappers';
import type { SelectOptionVM } from '../_components/types';
import { machineQueryKeys } from './queryKeys';

const STALE_TIME = 5 * 60_000; // 5 minutes

const machineOptionLabel = (machine: Machine) => {
    const code = machine.machineCode || machine.machineName;
    const space = machine.space?.spaceName;
    return space ? `${code} — ${space}` : code;
};

export interface UseMachineOptionsResult {
    machines: Machine[];
    machineInfoMap: MachineInfoMap;
    machineOptions: SelectOptionVM[];
    machineCodeById: Map<string, string>;
    isLoading: boolean;
}

/** Danh sách máy đầy đủ (picker + enrich machineName/spaceName) — dùng chung cho cả 2 trang. */
export const useMachineOptions = (): UseMachineOptionsResult => {
    const query = useQuery({
        queryKey: machineQueryKeys.all,
        queryFn: () => MachineService.getAllMachines(),
        staleTime: STALE_TIME,
    });

    const machines = query.data ?? [];

    const machineInfoMap = useMemo(() => buildMachineInfoMap(machines), [machines]);

    const machineOptions = useMemo<SelectOptionVM[]>(
        () =>
            machines.map((machine) => ({
                value: String(machine.machineId),
                label: machineOptionLabel(machine),
            })),
        [machines]
    );

    const machineCodeById = useMemo(
        () =>
            new Map(
                machines.map((machine) => [String(machine.machineId), machine.machineCode ?? ''])
            ),
        [machines]
    );

    return {
        machines,
        machineInfoMap,
        machineOptions,
        machineCodeById,
        isLoading: query.isLoading,
    };
};
