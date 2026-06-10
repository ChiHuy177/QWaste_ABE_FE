import { AuditMetaData } from './Metadata';
import { ZonePickingResponse, ZoneInFactoryOverview } from './Zone';

export interface Factory {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
    displayOrder: number;
    address: string;
    description: string;
    auditMetaData?: AuditMetaData;
}

export interface FactoryFormData {
    factoryCode: string;
    factoryName: string;
    displayOrder: number;
    address: string;
    description: string;
}

export interface FactoryPickingSimple {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
}

export interface FactoryPickingResponse {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
    zones: ZonePickingResponse[];
}

export interface FactoryAndLinePickingResponse {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
    zones: ZonePickingResponse[];
}

export interface FactoryOverviewResponse {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
    zones: ZoneInFactoryOverview[];
}
