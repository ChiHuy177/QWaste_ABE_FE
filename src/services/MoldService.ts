import { Mold, MoldFormData, MoldUpdateFormData, MoldPaginatedParams } from '@/types/Mold';
import { PaginatedResult } from '@/types/Common';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class MoldService {
    static async getAllMolds(): Promise<Mold[]> {
        const response = await NetworkService.requestJson<Mold[]>({
            method: 'GET',
            url: ENDPOINTS.MOLDS.BASE,
        });
        return response.result as Mold[];
    }

    static async getMoldsPaginated(params: MoldPaginatedParams): Promise<PaginatedResult<Mold>> {
        const queryParams = MoldService.buildQueryParams(params);
        const response = await NetworkService.requestJson<PaginatedResult<Mold>>({
            method: 'GET',
            url: `${ENDPOINTS.MOLDS.ALL}?${queryParams.toString()}`,
        });
        return response.result as PaginatedResult<Mold>;
    }

    static async getMoldById(moldId: number): Promise<Mold> {
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

    static async deleteMold(moldId: number): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.MOLDS.DETAIL(moldId),
        });
    }

    private static buildQueryParams(params: MoldPaginatedParams): URLSearchParams {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            size: params.size.toString(),
        });

        MoldService.appendSortParams(queryParams, params.sort);
        MoldService.appendTrimmedParam(queryParams, 'search', params.search);
        MoldService.appendTrimmedParam(queryParams, 'moldCode', params.moldCode);
        MoldService.appendTrimmedParam(queryParams, 'moldName', params.moldName);

        return queryParams;
    }

    private static appendSortParams(queryParams: URLSearchParams, sort?: string | string[]) {
        if (!sort) return;
        const sortParams = Array.isArray(sort) ? sort : [sort];
        sortParams.forEach((s) => queryParams.append('sort', s));
    }

    private static appendTrimmedParam(queryParams: URLSearchParams, key: string, value?: string) {
        const trimmed = value?.trim();
        if (trimmed) queryParams.append(key, trimmed);
    }
}
