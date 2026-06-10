import {
    DrawingCode,
    CreateDrawingCodeRequest,
    UpdateDrawingCodeRequest,
    DrawingCodePickingResponse,
} from '@/types';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class DrawingCodeService {
    static async getAllDrawingCode(): Promise<DrawingCode[]> {
        const response = await NetworkService.requestJson({
            method: 'GET',
            url: ENDPOINTS.DRAWING_CODES.BASE,
        });
        return response.result;
    }

    static async getDrawingCodeById(drawingCodeId: string): Promise<DrawingCode> {
        const response = await NetworkService.requestJson({
            method: 'GET',
            url: ENDPOINTS.DRAWING_CODES.DETAIL(drawingCodeId),
        });
        return response.result;
    }

    static async createDrawingCode(data: CreateDrawingCodeRequest): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'POST',
            url: ENDPOINTS.DRAWING_CODES.BASE,
            data,
        });
        return response.message as string;
    }

    static async updateDrawingCode(data: UpdateDrawingCodeRequest): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'PUT',
            url: ENDPOINTS.DRAWING_CODES.BASE,
            data,
        });
        return response.message as string;
    }

    static async deleteDrawingCode(drawingCodeId: string): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'DELETE',
            url: ENDPOINTS.DRAWING_CODES.DETAIL(drawingCodeId),
        });
        return response.message as string;
    }

    static async restoreDrawingCode(drawingCodeId: string): Promise<string> {
        const response = await NetworkService.requestJson({
            method: 'PUT',
            url: ENDPOINTS.DRAWING_CODES.RESTORE(drawingCodeId),
        });
        return response.message as string;
    }

    static async getDrawingCodesForPicking(): Promise<DrawingCodePickingResponse[]> {
        const response = await NetworkService.requestJson<DrawingCodePickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.DRAWING_CODES.PICKING,
        });
        return response.result as DrawingCodePickingResponse[];
    }
}
