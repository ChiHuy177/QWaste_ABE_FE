/**
 * Production Overview Interfaces & Types
 * Dedicated types for the Production Overview dashboard and single-machine details.
 */

export type TimelineGranularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface KpiSummaryData {
    oee: {
        current: number;
        target: number;
        yesterdayDiff: number;
        statusTag: string;
    };
    maxCapacity?: {
        current: number;
        unit?: string;
        target?: number;
        periodLabel?: string;
        seconds?: number;
        hours?: number;
        minutes?: number;
    };
    maxCapacitySeconds?: number;
    downtimeMinutes: {
        current: number;
        overTargetMinutes: number;
    };
    downtimeHours?: {
        current: number;
        overTargetHours: number;
    };
    runtimeSeconds?: number;
    runtimeMinutes?: {
        current: number;
    };
    runtimeHours?: {
        current: number;
    };
    actualCapacity?: {
        current?: number;
        unit?: string;
        rateVsMax?: number;
        periodLabel?: string;
    };
    yieldRate: {
        current: number;
        targetText: string;
    };
    actualProduction: {
        current: number;
        target: number;
        unit: string;
    };
}

export interface MachineOeeData {
    machineCode: string;
    oee: number;
    target: number;
}

export interface MachineOutputData {
    machineCode: string;
    planned: number;
    actual: number;
}

export interface ProductOutputData {
    productCode: string;
    planned: number;
    actual: number;
}

export interface OutputTimelinePoint {
    label: string;
    actual: number;
    planned?: number;
    stoppageNote?: string;
}

export interface DailyEfficiencyPoint {
    date: string;
    efficiency: number;
    target?: number;
    maxCapacityHours?: number;
    actualOperatingHours?: number;
    downtimeHours?: number;
}

export interface MachineDetailInfo {
    machineCode: string;
    machineName: string;
    lineName?: string;
    status?: 'RUNNING' | 'STOPPED' | string;
    operatorName?: string;
    shiftTime?: string;
    updatedAt?: string;
    runningSku?: string;
    stoppageReason?: string;
    stoppageTimeAccumulated?: number;
}
