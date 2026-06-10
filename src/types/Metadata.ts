export interface SoftDeleteMetaData {
    deletedAt: string | null;
    deletedBy: string | null;
    isDeleted: boolean;
}
export interface AuditMetaData {
    createdAt: string | null;
    updatedAt: string | null;
    createdBy: string | null;
    updatedBy: string | null;
}
