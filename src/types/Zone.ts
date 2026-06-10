import { AuditMetaData } from '@/types/Metadata';
import { LineInFactoryOverview, LinePickingResponse } from './Line';

export interface Zone {
    zoneId: number;
    factory: {
        factoryId: number;
        factoryCode: string;
        factoryName: string;
        description?: string;
    };
    zoneName: string;
    zoneCode: string;
    description?: string;
    displayOrder: number;
    auditMetaData?: AuditMetaData;
}

export interface ZoneFormData {
    factoryId: number;
    zoneName: string;
    zoneCode: string;
    description?: string;
    displayOrder: number;
}

export interface ZonePickingResponse {
    zoneId: number;
    zoneName: string;
    zoneCode: string;
    lines: LinePickingResponse[];
}

export interface MachineInFactoryOverview {
    machineId: string;
    machineCode: string;
    machineName: string;
    power: number;
    machineDisplayOrder: number;
    currentStatus: string;
    currentEnergyConsumption?: number;
    operatorCount?: number;
    totalProductions: number;
    runtimeByStatus: Map<string, number>;
}

export interface ZoneInFactoryOverview {
    zoneId: number;
    zoneCode: string;
    zoneName: string;
    totalEnergyConsumption: number;
    lines: LineInFactoryOverview[];
}
