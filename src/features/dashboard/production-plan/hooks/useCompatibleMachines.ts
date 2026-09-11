import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MachineService } from '@/services/MachineService';
import type { Machine } from '@/types/Machine';
import type { SelectOptionVM } from '../components/types';

const machineOptionLabel = (machine: Machine) => {
    const code = machine.machineCode || machine.machineName;
    const space = machine.space?.spaceName;
    return space ? `${code} — ${space}` : code;
};

export interface UseCompatibleMachinesResult {
    machines: Machine[];
    machineOptions: SelectOptionVM[];
    isLoading: boolean;
}

/**
 * Máy tương thích công đoạn khuôn (GET /machines/v1/pickingByOperationType) — dùng chung cho
 * form tạo mới (chọn khuôn trước rồi mới lọc máy) và modal chuyển kế hoạch.
 */
export const useCompatibleMachines = (
    operationTypeId: number | undefined,
    enabled = true
): UseCompatibleMachinesResult => {
    const query = useQuery({
        queryKey: ['machines', 'pickingByOperationType', operationTypeId],
        queryFn: () => MachineService.getMachinesPickingByOperationType(operationTypeId as number),
        enabled: enabled && operationTypeId != null,
    });

    const machines = query.data ?? [];

    const machineOptions = useMemo<SelectOptionVM[]>(
        () =>
            machines.map((machine) => ({
                value: String(machine.machineId),
                label: machineOptionLabel(machine),
            })),
        [machines]
    );

    return { machines, machineOptions, isLoading: query.isLoading };
};
