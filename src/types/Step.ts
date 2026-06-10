import { AuditMetaData } from './Metadata';

export type StepDTO = {
    standardStepId: number;
    stepName: string;
    description: string | null;
    requiresQc: boolean;
    defaultCompletionTimeSeconds: number | null;
    materialName: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt: string | null;
    updatedBy: string | null;
    auditMetaData?: AuditMetaData;
};

export type CreateStepRequest = {
    stepName: string;
    description?: string | null;
    requiresQc: boolean;
    defaultCompletionTimeSeconds?: number | null;
    materialName?: string | null;
};

export type UpdateStepRequest = {
    standardStepId: number;
    stepName: string;
    description?: string | null;
    requiresQc: boolean;
    defaultCompletionTimeSeconds?: number | null;
    materialName?: string | null;
};
