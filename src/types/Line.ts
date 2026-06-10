import { AuditMetaData } from '@/types/Metadata';
import { MachineInFactoryOverview } from './Zone';

export interface Line {
    lineId: number;
    zone: {
        zoneId: number;
        zoneName: string;
        zoneCode: string;
        displayOrder: number;
        description: string;
    };
    lineName: string;
    description?: string;
    displayOrder: number;
    auditMetaData?: AuditMetaData;
}

export interface LineFormData {
    zoneId: number;
    lineName: string;
    description?: string;
    displayOrder: number;
}

export interface LineInFactoryOverview {
    lineId: number;
    lineName: string;
    lineDisplayOrder: number;
    machines: MachineInFactoryOverview[];
}

export interface LinePickingResponse {
    lineId: number;
    lineName: string;
    displayOrder: number;
}
