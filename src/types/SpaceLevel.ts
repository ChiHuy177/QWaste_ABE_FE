import { AuditMetaData } from "./Metadata";

export interface SpaceLevelsPaginatedParams {
    page: number;
    size: number;
    sort?: string | string[];
    search?: string;
    spaceLevel?: number;
}

export interface SpaceLevelDTO {
    auditMetaData?: AuditMetaData;
    spaceLevelId: number;
    spaceLevel: number;
    spaceLevelName: string;
}

export interface SpaceLevelCreationRequest {
    spaceLevel: number;
    spaceLevelName: string;
}

export interface SpaceLevelUpdationRequest {
    spaceLevelId: number;
    spaceLevel: number;
    spaceLevelName: string;
}
