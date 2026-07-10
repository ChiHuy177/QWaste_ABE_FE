import { Mold, MoldFormData, MoldUpdateFormData } from '@/types/Mold';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class MoldService {
    /** GET /api/molds/v1 — danh sách đầy đủ KHÔNG phân trang, gồm cả mold đã soft-delete. */
    static async getAllMolds(): Promise<Mold[]> {
        const response = await NetworkService.requestJson<Mold[]>({
            method: 'GET',
            url: ENDPOINTS.MOLDS.BASE,
        });
        return response.result as Mold[];
    }

    static async getMoldById(moldId: string): Promise<Mold> {
        const response = await NetworkService.requestJson<Mold>({
            method: 'GET',
            url: ENDPOINTS.MOLDS.DETAIL(moldId),
        });
        return response.result as Mold;
    }

    static async createMold(data: MoldFormData): Promise<Mold> {
        const response = await NetworkService.requestJson<Mold>({
            method: 'POST',
            url: ENDPOINTS.MOLDS.BASE,
            data,
        });
        return response.result as Mold;
    }

    static async updateMold(data: MoldUpdateFormData): Promise<string> {
        const response = await NetworkService.requestJson<Mold>({
            method: 'PUT',
            url: ENDPOINTS.MOLDS.BASE,
            data,
        });
        return response.message as string;
    }

    static async deleteMold(moldId: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.MOLDS.DETAIL(moldId),
        });
        return response.message as string;
    }

    static async restoreMold(moldId: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.MOLDS.RESTORE(moldId),
        });
        return response.message as string;
    }
}
