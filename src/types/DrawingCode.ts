import { AuditMetaData, SoftDeleteMetaData } from './Metadata';

export enum ProductionType {
    BATCH = 'BATCH',
    SINGLE_PIECE = 'SINGLE_PIECE',
}

export type StepTemplate = {
    stepTemplateId?: string;
    stepOrder: number;
    stepName: string;
    description: string | null;
    requiresQc: boolean;
    defaultCompletionTimeSeconds: number | null;
    materialName: string | null;
};

export type DrawingCode = {
    drawingCodeId: string;
    drawingCode: string;
    drawingCodeName: string;
    description: string | null;
    pdfLink: string | null;
    ofCustomer: string;
    defaultCompletionTimeSeconds: number | null;
    productionType: ProductionType;
    stepTemplates: StepTemplate[];
    auditMetaData: AuditMetaData;
    softDeleteMetaData: SoftDeleteMetaData;
};

export type CreateDrawingCodeRequest = {
    drawingCode: string;
    drawingCodeName: string;
    description?: string;
    pdfLink?: string;
    ofCustomer: string;
    defaultCompletionTimeSeconds?: number;
    // productionType: ProductionType;
    stepTemplates: StepTemplate[];
};

export type UpdateDrawingCodeRequest = {
    drawingCodeId: string;
    drawingCode?: string;
    drawingCodeName?: string;
    description?: string;
    ofCustomer: string;
    pdfLink?: string;
    defaultCompletionTimeSeconds?: number;
    productionType?: ProductionType;
    stepTemplates?: StepTemplate[];
};

export interface DrawingCodePickingResponse {
    drawingCodeId: string;
    drawingCode: string;
    drawingCodeName: string;
    description?: string;
    pdfLink?: string;
    ofCustomer?: string;
    versionNumber?: number;
    defaultCompletionTimeSeconds?: number;
    productionType: ProductionType;
    stepTemplates: StepTemplate[];
}
