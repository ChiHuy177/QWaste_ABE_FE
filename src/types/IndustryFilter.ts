import { AuditMetaData } from './Metadata';
import { TimeGrain } from './Chart';

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
    // Only present on PERIOD rows (from /utils/v1/filters/allPrimary); absent on SHIFT rows.
    defaultGrain?: TimeGrain;
    allowedGrains?: TimeGrain[];
    auditMetaData?: AuditMetaData;
}

export interface IndustryFilterFormData {
    displayNameEn: string;
    displayNameVi: string;
    shortNameEn?: string | null;
    startTime: string;
    endTime: string;
    sortOrder?: number;
}

export interface IndustryFilterUpdateData extends IndustryFilterFormData {
    filterId: number;
}
