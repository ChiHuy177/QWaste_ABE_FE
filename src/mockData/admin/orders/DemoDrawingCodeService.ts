import type {
    CreateDrawingCodeRequest,
    DrawingCode,
    DrawingCodePickingResponse,
    UpdateDrawingCodeRequest,
} from '@/types/DrawingCode';
import { ProductionType } from '@/types/DrawingCode';
import { MOCK_DRAWING_TEMPLATES } from './orders';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const activeSoftDeleteMetaData = {
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
};

const demoDrawingCodes: DrawingCode[] = MOCK_DRAWING_TEMPLATES.map((template) => ({
    drawingCodeId: template.drawingCodeId,
    drawingCode: template.drawingCode,
    drawingCodeName: template.drawingCodeName,
    description: template.description ?? null,
    pdfLink: template.pdfLink ?? null,
    ofCustomer: template.ofCustomer ?? 'WOODSLAND',
    defaultCompletionTimeSeconds: template.defaultCompletionTimeSeconds ?? null,
    productionType: template.productionType,
    stepTemplates: template.stepTemplates,
    auditMetaData,
    softDeleteMetaData: activeSoftDeleteMetaData,
}));

const getNextDrawingCodeId = () => `dwg-template-${Date.now()}`;

const findDrawingCode = (drawingCodeId: string) => {
    const drawingCode = demoDrawingCodes.find((item) => item.drawingCodeId === drawingCodeId);
    if (!drawingCode) {
        throw new Error('Demo drawing code was not found');
    }

    return drawingCode;
};

const touchDrawingCode = (drawingCode: DrawingCode) => {
    drawingCode.auditMetaData = {
        ...drawingCode.auditMetaData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const syncPickingTemplates = () => {
    MOCK_DRAWING_TEMPLATES.splice(
        0,
        MOCK_DRAWING_TEMPLATES.length,
        ...demoDrawingCodes.map(toPickingResponse)
    );
};

const toPickingResponse = (drawingCode: DrawingCode): DrawingCodePickingResponse => ({
    drawingCodeId: drawingCode.drawingCodeId,
    drawingCode: drawingCode.drawingCode,
    drawingCodeName: drawingCode.drawingCodeName,
    description: drawingCode.description ?? undefined,
    pdfLink: drawingCode.pdfLink ?? undefined,
    ofCustomer: drawingCode.ofCustomer,
    versionNumber: 1,
    defaultCompletionTimeSeconds: drawingCode.defaultCompletionTimeSeconds ?? undefined,
    productionType: drawingCode.productionType,
    stepTemplates: drawingCode.stepTemplates,
});

export class DemoDrawingCodeService {
    static async getAllDrawingCode(): Promise<DrawingCode[]> {
        return clone(demoDrawingCodes);
    }

    static async getDrawingCodeById(drawingCodeId: string): Promise<DrawingCode> {
        return clone(findDrawingCode(drawingCodeId));
    }

    static async createDrawingCode(data: CreateDrawingCodeRequest): Promise<string> {
        const now = new Date().toISOString();
        const drawingCode: DrawingCode = {
            drawingCodeId: getNextDrawingCodeId(),
            drawingCode: data.drawingCode,
            drawingCodeName: data.drawingCodeName,
            description: data.description ?? null,
            pdfLink: data.pdfLink ?? null,
            ofCustomer: data.ofCustomer,
            defaultCompletionTimeSeconds: data.defaultCompletionTimeSeconds ?? null,
            productionType: ProductionType.BATCH,
            stepTemplates: data.stepTemplates,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
            softDeleteMetaData: { ...activeSoftDeleteMetaData },
        };

        demoDrawingCodes.unshift(drawingCode);
        syncPickingTemplates();

        return 'Demo drawing code created';
    }

    static async updateDrawingCode(data: UpdateDrawingCodeRequest): Promise<string> {
        const drawingCode = findDrawingCode(data.drawingCodeId);

        drawingCode.drawingCode = data.drawingCode ?? drawingCode.drawingCode;
        drawingCode.drawingCodeName = data.drawingCodeName ?? drawingCode.drawingCodeName;
        drawingCode.description = data.description ?? null;
        drawingCode.ofCustomer = data.ofCustomer;
        drawingCode.pdfLink = data.pdfLink ?? drawingCode.pdfLink;
        drawingCode.defaultCompletionTimeSeconds =
            data.defaultCompletionTimeSeconds ?? drawingCode.defaultCompletionTimeSeconds;
        drawingCode.productionType = data.productionType ?? drawingCode.productionType;
        drawingCode.stepTemplates = data.stepTemplates ?? drawingCode.stepTemplates;
        touchDrawingCode(drawingCode);
        syncPickingTemplates();

        return 'Demo drawing code updated';
    }

    static async deleteDrawingCode(drawingCodeId: string): Promise<string> {
        const drawingCode = findDrawingCode(drawingCodeId);
        drawingCode.softDeleteMetaData = {
            deletedAt: new Date().toISOString(),
            deletedBy: 'Demo Admin',
            isDeleted: true,
        };
        touchDrawingCode(drawingCode);
        syncPickingTemplates();

        return 'Demo drawing code deleted';
    }

    static async restoreDrawingCode(drawingCodeId: string): Promise<string> {
        const drawingCode = findDrawingCode(drawingCodeId);
        drawingCode.softDeleteMetaData = { ...activeSoftDeleteMetaData };
        touchDrawingCode(drawingCode);
        syncPickingTemplates();

        return 'Demo drawing code restored';
    }

    static async getDrawingCodesForPicking(): Promise<DrawingCodePickingResponse[]> {
        return clone(demoDrawingCodes.filter((item) => !item.softDeleteMetaData.isDeleted).map(toPickingResponse));
    }

    static async createDrawingTemplate(
        payload: CreateDrawingCodeRequest
    ): Promise<DrawingCodePickingResponse> {
        await DemoDrawingCodeService.createDrawingCode(payload);

        return clone(toPickingResponse(demoDrawingCodes[0]));
    }
}
