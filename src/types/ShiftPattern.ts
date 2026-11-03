import { AuditMetaData } from './Metadata';

export interface ShiftPatternResponse {
    patternId: number;
    patternCode: string;
    patternName: string;
    default: boolean;
    auditMetaData?: AuditMetaData;
}

export interface ShiftPatternForPicking {
    patternId: number;
    patternCode: string;
    patternName: string;
    default: boolean;
}

export interface ShiftPatternCreationRequest {
    patternCode: string;
    patternName: string;
}
