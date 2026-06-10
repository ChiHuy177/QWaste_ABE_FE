import type { AuditMetaData } from './Metadata';

export type MoldStatus = 'ACTIVE' | 'INACTIVE';

export interface Mold {
    moldId: number;
    moldCode: string;
    moldName: string;
    description: string;
    status: MoldStatus;
    auditMetaData?: AuditMetaData;
}

export interface MoldFormData {
    moldCode: string;
    moldName: string;
    description: string;
    status: MoldStatus;
}

export interface MoldUpdateData extends MoldFormData {
    moldId: number;
}
