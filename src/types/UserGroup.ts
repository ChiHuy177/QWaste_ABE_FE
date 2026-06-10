import { AuditMetaData } from './Metadata';

export interface UserGroup {
    groupId: number;
    groupName: string;
    description: string;
    auditMetaData?: AuditMetaData;
}
export interface GroupFormData {
    groupName: string;
    description: string;
}
