import { Line, LineFormData } from '@/types/Line';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class LineService {
    static async getAllLines(): Promise<Line[]> {
        const response = await NetworkService.requestJson<Line[]>({
            method: 'GET',
            url: ENDPOINTS.LINES.BASE,
        });
        return response.result as Line[];
    }

    static async getLinesByZone(zoneId: number): Promise<Line[]> {
        const response = await NetworkService.requestJson<Line[]>({
            method: 'GET',
            url: ENDPOINTS.LINES.BY_ZONE(zoneId),
        });
        return response.result as Line[];
    }

    static async getLineById(lineId: number): Promise<Line> {
        const response = await NetworkService.requestJson<Line>({
            method: 'GET',
            url: ENDPOINTS.LINES.DETAIL(lineId),
        });
        return response.result as Line;
    }

    static async createLine(lineData: LineFormData): Promise<Line> {
        const response = await NetworkService.requestJson<Line>({
            method: 'POST',
            url: ENDPOINTS.LINES.BASE,
            data: lineData,
        });
        return response.result as Line;
    }

    static async updateLine(lineData: Line): Promise<string> {
        const response = await NetworkService.requestJson<Line>({
            method: 'PUT',
            url: ENDPOINTS.LINES.BASE,
            data: lineData,
        });
        return response.message as string;
    }

    static async deleteLine(lineId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.LINES.DETAIL(lineId),
        });
        return response.result;
    }
}
