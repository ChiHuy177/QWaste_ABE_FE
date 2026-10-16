import { MachineLog, MachineOverview, MachineStats } from '@/types/Machine';

export const getMachineStatus = (machine: MachineOverview): MachineOverview['status'] => {
    if (!machine.currentStatus) return 'empty';

    switch (machine.currentStatus) {
        case 'RUNTIME':
            return 'running';
        case 'IDLE':
            return 'idle';
        case 'ERROR':
            return 'error';
        case 'OFFLINE':
        case 'COMPLETE':
            return 'empty';
        default:
            return 'empty';
    }
};

export const calculateMachineTime = (
    logs: MachineLog[]
): { hours: number; minutes: number; seconds: number } => {
    if (!logs || logs.length === 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
    }

    let totalSeconds = 0;

    logs.forEach((log) => {
        if (log.logStatus === 'RUNTIME') {
            totalSeconds += log.totalLogStateTime;
        }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
};

export const calculateMachineStats = (machines: MachineOverview[]): MachineStats => {
    const stats: MachineStats = {
        totalRun: 0,
        totalIdle: 0,
        totalError: 0,
        totalOffline: 0,
    };

    machines.forEach((machine) => {
        console.log(
            'Calculating status for machine:',
            machine.machineId,
            'with currentStatus:',
            machine.currentStatus
        );
        if (!machine.currentStatus) {
            stats.totalOffline++;
            return;
        }

        switch (machine.currentStatus) {
            case 'RUNTIME':
                stats.totalRun++;
                break;
            case 'IDLE':
                stats.totalIdle++;
                break;
            case 'ERROR':
                stats.totalError++;
                break;
            case 'OFFLINE':
            case 'COMPLETE':
                stats.totalOffline++;
                break;
            default:
                stats.totalOffline++;
        }
    });

    return stats;
};
