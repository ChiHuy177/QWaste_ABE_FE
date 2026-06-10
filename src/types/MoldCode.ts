import { AuditMetaData } from './Metadata';

export type MoldCodeStatus = 'ACTIVE' | 'INACTIVE';

export interface MoldCode {
    moldCodeId: number;
    moldCodeName: string;
    description: string;
    status: MoldCodeStatus;
    auditMetaData?: AuditMetaData;
}

export interface MoldCodeFormData {
    moldCodeName: string;
    description: string;
    status: MoldCodeStatus;
}
