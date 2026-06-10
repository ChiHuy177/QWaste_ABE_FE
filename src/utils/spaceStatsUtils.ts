import { MachineWithStatusLogsSummary } from '@/types/Machine';
import { SpaceComputedStats, SpaceOverview } from '@/types/Space';

const getRuntimeValue = (
    runtimeByStatus: Record<string, number> | Map<string, number> | undefined,
    status: string
): number => {
    if (!runtimeByStatus) return 0;
    if (runtimeByStatus instanceof Map) {
        return runtimeByStatus.get(status) || 0;
    }
    return (runtimeByStatus as Record<string, number>)[status] || 0;
};

export const collectAllMachines = (space: SpaceOverview): MachineWithStatusLogsSummary[] => {
    const machines: MachineWithStatusLogsSummary[] = [...space.machineChildren];
    for (const child of space.children) {
        machines.push(...collectAllMachines(child));
    }
    return machines;
};

export const computeStatsFromMachines = (
    machines: MachineWithStatusLogsSummary[]
): SpaceComputedStats => {
    const stats: SpaceComputedStats = {
        totalMachines: machines.length,
        runtimeSeconds: 0,
        idleSeconds: 0,
        errorSeconds: 0,
        offlineSeconds: 0,
        energyKwh: 0,
        operatorCount: 0,
        totalProductions: 0,
        machinesByStatus: {
            RUNTIME: 0,
            IDLE: 0,
            ERROR: 0,
            OFFLINE: 0,
            COMPLETE: 0,
            TEMPORARY_STOP: 0,
            OPEN_DOOR: 0,
            WARNING: 0,
            UNKNOWN: 0,
        },
    };

    for (const machine of machines) {
        const runtime = getRuntimeValue(machine.runtimeByStatus, 'RUNTIME');
        const idle = getRuntimeValue(machine.runtimeByStatus, 'IDLE');
        const error = getRuntimeValue(machine.runtimeByStatus, 'ERROR');
        const offline = getRuntimeValue(machine.runtimeByStatus, 'OFFLINE');

        stats.runtimeSeconds += runtime;
        stats.idleSeconds += idle;
        stats.errorSeconds += error;
        stats.offlineSeconds += offline;

        // energy = power * activeHours (runtime + idle + error)
        const activeHours = (runtime + idle + error) / 3600;
        stats.energyKwh += (machine.power || 0) * activeHours;

        stats.operatorCount += machine.operatorCount || 0;
        stats.totalProductions += machine.totalProductions || 0;

        // Count machines by current status
        const status = machine.currentStatus;
        if (status && status in stats.machinesByStatus) {
            stats.machinesByStatus[status]++;
        }
    }

    return stats;
};

export const computeSpaceStats = (space: SpaceOverview): SpaceComputedStats => {
    return computeStatsFromMachines(collectAllMachines(space));
};

export const buildMachinePathMap = (
    rootSpace: SpaceOverview
): Map<string, { path: number[]; machineIndex: number }> => {
    const map = new Map<string, { path: number[]; machineIndex: number }>();

    const walk = (space: SpaceOverview, parentPath: number[]) => {
        const currentPath = [...parentPath, space.spaceId];

        space.machineChildren.forEach((machine, idx) => {
            map.set(machine.machineId, { path: currentPath, machineIndex: idx });
        });

        for (const child of space.children) {
            walk(child, currentPath);
        }
    };

    walk(rootSpace, []);
    return map;
};

/**
 * Format seconds to a human-readable time string.
 * e.g. 3720 => "1h2m", 7200 => "2h", 0 => "0h"
 */
export const formatSeconds = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
};

export const updateMachineInTree = (
    rootSpace: SpaceOverview,
    path: number[],
    machineIndex: number,
    updater: (machine: MachineWithStatusLogsSummary) => MachineWithStatusLogsSummary
): SpaceOverview => {
    // path[0] is always rootSpace.spaceId, so we start from path[1]
    if (path.length <= 1) {
        // Machine is directly in this space's machineChildren
        const newMachineChildren = [...rootSpace.machineChildren];
        newMachineChildren[machineIndex] = updater(newMachineChildren[machineIndex]);
        return { ...rootSpace, machineChildren: newMachineChildren };
    }

    // Find the child that matches path[1]
    const nextSpaceId = path[1];
    const newChildren = rootSpace.children.map((child) => {
        if (child.spaceId === nextSpaceId) {
            return updateMachineInTree(child, path.slice(1), machineIndex, updater);
        }
        return child; // structural sharing: unchanged child keeps same reference
    });

    return { ...rootSpace, children: newChildren };
};
