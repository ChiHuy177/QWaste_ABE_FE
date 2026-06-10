import { AuditMetaData } from './Metadata';

export type IndustryFilterCategory = 'PERIOD' | 'SHIFT';

export interface IndustryFilter {
    filterId: number;
    category: IndustryFilterCategory;
    periodCode: string | null;
    shiftNumber: number | null;
    startTime: string;
    endTime: string;
    crossesMidnight: boolean;
    displayNameEn: string;
    displayNameVi: string;
    shortNameEn: string | null;
    isPrimary: boolean;
    sortOrder: number;
    auditMetaData?: AuditMetaData;
}

export interface IndustryFilterFormData {
    displayNameEn: string;
    displayNameVi: string;
    shortNameEn?: string;
    startTime: string;
    endTime: string;
    sortOrder?: number;
}

export interface IndustryFilterUpdateData extends IndustryFilterFormData {
    filterId: number;
}
