import {
    OperationType,
    OperationTypeFormData,
    OperationTypePaginatedParams,
    OperationTypePickingResponse,
    OperationTypeUpdateFormData,
} from '@/types/OperationType';
import { PaginatedResult } from '@/types/Common';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class OperationTypeService {
    /** Authenticated picking list; the full unpaged endpoint requires Super Admin. */
    static async getOperationTypesForPicking(): Promise<OperationTypePickingResponse[]> {
        const response = await NetworkService.requestJson<OperationTypePickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.OPERATION_TYPES.PICKING,
        });
        return response.result ?? [];
    }

    /** GET /api/operationTypes/v1 — danh sách phân trang từ server */
    static async getOperationTypesPaginated(
        params: OperationTypePaginatedParams
    ): Promise<PaginatedResult<OperationType>> {
        const queryParams = OperationTypeService.buildPaginatedQueryParams(params);
        const response = await NetworkService.requestJson<PaginatedResult<OperationType>>({
            method: 'GET',
            url: `${ENDPOINTS.OPERATION_TYPES.BASE}?${queryParams.toString()}`,
        });
        return response.result as PaginatedResult<OperationType>;
    }

    private static buildPaginatedQueryParams(
        params: OperationTypePaginatedParams
    ): URLSearchParams {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            size: params.size.toString(),
        });

        OperationTypeService.appendSortParams(queryParams, params.sort);
        OperationTypeService.appendTrimmedParam(queryParams, 'search', params.search);
        OperationTypeService.appendTrimmedParam(
            queryParams,
            'operationTypeCode',
            params.operationTypeCode
        );
        OperationTypeService.appendTrimmedParam(
            queryParams,
            'operationTypeName',
            params.operationTypeName
        );

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

    static async getOperationTypeById(operationTypeId: number): Promise<OperationType> {
        const response = await NetworkService.requestJson<OperationType>({
            method: 'GET',
            url: ENDPOINTS.OPERATION_TYPES.DETAIL(operationTypeId),
        });
        return response.result as OperationType;
    }

    static async createOperationType(data: OperationTypeFormData): Promise<OperationType> {
        const response = await NetworkService.requestJson<OperationType>({
            method: 'POST',
            url: ENDPOINTS.OPERATION_TYPES.BASE,
            data,
        });
        return response.result as OperationType;
    }

    static async updateOperationType(data: OperationTypeUpdateFormData): Promise<string> {
        const response = await NetworkService.requestJson<OperationType>({
            method: 'PUT',
            url: ENDPOINTS.OPERATION_TYPES.BASE,
            data,
        });
        return response.message as string;
    }

    static async deleteOperationType(operationTypeId: number): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.OPERATION_TYPES.DETAIL(operationTypeId),
        });
        return response.message as string;
    }
}
