export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type AlertStatus = 'ACTIVE' | 'REPORTED' | 'RESOLVED';

export interface MachineAlert {
    alertId: string;
    classification: 'MACHINE' | 'MOLD';
    machine?: {
        machineId: string;
        machineName: string;
        machineCode: string;
    };
    mold?: {
        moldId: number;
        moldName: string;
        moldCode: string;
    };
    errorGroup: {
        errorGroupId: number;
        errorGroupName: string;
    };
    errorDetail: {
        errorDetailId: number;
        errorCode: string;
        errorName: string;
        description: string;
    };
    severity: AlertSeverity;
    status: AlertStatus;
    detectedAt: string;
    reportId?: number;
}
