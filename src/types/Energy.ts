export interface EnergyStats {
    totalComsumption: number;
    totalCost: number;
    totalIdleTime: number;
    totalParts: number;
}

export type TimePeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type ExtendedTimePeriod = TimePeriod | 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3';

export interface ElectricFilters {
    timePeriod: TimePeriod;
    dateRange: [string, string] | null;
    zoneId: string | null;
}

export interface EnergyDataPoint {
    label: string;
    totalConsumption: number;
}

export interface EnergyDataTotal {
    totalAllConsumption: number;
    dateConsumption: EnergyDataPoint[];
}

export interface EnergyConsumption {
    entityId: string;
    entityName: string;
    currentConsumption: string;
    filterConsumptionResult: EnergyDataTotal;
}
