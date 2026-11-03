import {
    Mold,
    MoldFormData,
    MoldImportResult,
    MoldPaginatedParams,
    MoldPickingResponse,
    MoldUpdateFormData,
} from '@/types/Mold';
import { ApiResponse } from '@/types/ApiResponse';
import { PaginatedResult } from '@/types/Common';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class MoldService {
    /** GET /api/molds/v1 — danh sách phân trang từ server */
    static async getMoldsPaginated(params: MoldPaginatedParams): Promise<PaginatedResult<Mold>> {
        const queryParams = MoldService.buildPaginatedQueryParams(params);
        const response = await NetworkService.requestJson<PaginatedResult<Mold>>({
            method: 'GET',
            url: `${ENDPOINTS.MOLDS.BASE}?${queryParams.toString()}`,
        });
        return response.result as PaginatedResult<Mold>;
    }

    private static buildPaginatedQueryParams(params: MoldPaginatedParams): URLSearchParams {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            size: params.size.toString(),
        });

        MoldService.appendSortParams(queryParams, params.sort);
        MoldService.appendTrimmedParam(queryParams, 'search', params.search);
        MoldService.appendTrimmedParam(queryParams, 'moldCode', params.moldCode);
        MoldService.appendTrimmedParam(queryParams, 'moldName', params.moldName);

        if (params.operationTypeId !== undefined) {
            queryParams.append('operationTypeId', params.operationTypeId.toString());
        }

        return queryParams;
    }

    private static appendSortParams(queryParams: URLSearchParams, sort?: string | string[]) {
        if (!sort) return;
        const sortParams = Array.isArray(sort) ? sort : [sort];
        sortParams.forEach((sortParam) => queryParams.append('sort', sortParam));
    }

    private static appendTrimmedParam(queryParams: URLSearchParams, key: string, value?: string) {
        const trimmedValue = value?.trim();
        if (trimmedValue) {
            queryParams.append(key, trimmedValue);
        }
    }

    /** GET /api/molds/v1/picking — danh sách rút gọn cho select khuôn (BE đã loại soft-delete). */
    static async getMoldsForPicking(): Promise<MoldPickingResponse[]> {
        const response = await NetworkService.requestJson<
            MoldPickingResponse[] | PaginatedResult<MoldPickingResponse>
        >({
            method: 'GET',
            url: ENDPOINTS.MOLDS.PICKING,
        });
        const result = response.result;
        if (Array.isArray(result)) {
            return result;
        }
        return (result as PaginatedResult<MoldPickingResponse>)?.content ?? [];
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

    static async importMolds(file: File): Promise<ApiResponse<MoldImportResult>> {
        const formData = new FormData();
        formData.append('file', file);
        return await NetworkService.requestFormData<MoldImportResult>({
            method: 'POST',
            url: ENDPOINTS.MOLDS.IMPORT,
            data: formData,
        });
    }
}
