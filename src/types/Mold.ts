import { AuditMetaData } from './Metadata';

export type MoldType = 'PRESS' | 'COMPRESS';
export type MoldStatus = 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';

export interface Mold {
    moldId: number;
    moldCode: string;
    moldName: string;
    quantity: number;
    description?: string;
    moldType: MoldType;
    status: MoldStatus;
    auditMetaData?: AuditMetaData;
}

export interface MoldFormData {
    moldCode: string;
    moldName: string;
    quantity: number;
    description?: string;
    moldType: MoldType;
    status: MoldStatus;
}

export interface MoldUpdateFormData extends MoldFormData {
    moldId: number;
}

export interface MoldPaginatedParams {
    page: number;
    size: number;
    sort?: string | string[];
    search?: string;
    moldCode?: string;
    moldName?: string;
}
