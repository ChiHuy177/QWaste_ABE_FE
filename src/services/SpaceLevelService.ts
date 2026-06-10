import {
    SpaceLevelDTO,
    SpaceLevelCreationRequest,
    SpaceLevelUpdationRequest,
    SpaceLevelsPaginatedParams,
} from '@/types/SpaceLevel';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import { PaginatedResult } from '@/types/Common';

export class SpaceLevelService {
    static async getSpaceLevelsPaginated(
        params: SpaceLevelsPaginatedParams
    ): Promise<PaginatedResult<SpaceLevelDTO>> {
        const queryParams = SpaceLevelService.buildPaginatedQueryParams(params);

        const response = await NetworkService.requestJson<PaginatedResult<SpaceLevelDTO>>({
            method: 'GET',
            url: `${ENDPOINTS.SPACE_LEVELS.PAGINATION}?${queryParams.toString()}`,
        });
        return response.result as PaginatedResult<SpaceLevelDTO>;
    }

    private static buildPaginatedQueryParams(params: SpaceLevelsPaginatedParams): URLSearchParams {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            size: params.size.toString(),
        });

        SpaceLevelService.appendSortParams(queryParams, params.sort);
        SpaceLevelService.appendTrimmedParam(queryParams, 'search', params.search);

        if (params.spaceLevel !== undefined) {
            queryParams.append('spaceLevel', params.spaceLevel.toString());
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

    /**
     * GET All Space Levels
     */
    static async getAllSpaceLevels(): Promise<SpaceLevelDTO[]> {
        const response = await NetworkService.requestJson<SpaceLevelDTO[]>({
            method: 'GET',
            url: ENDPOINTS.SPACE_LEVELS.BASE,
        });
        return response.result as SpaceLevelDTO[];
    }

    /**
     * GET Highest Space Level
     */
    static async getHighestSpaceLevel(): Promise<number> {
        const response = await NetworkService.requestJson<number>({
            method: 'GET',
            url: ENDPOINTS.SPACE_LEVELS.HIGHEST,
        });
        return response.result as number;
    }

    /**
     * POST Create Space Level
     */
    static async createSpaceLevel(data: SpaceLevelCreationRequest): Promise<SpaceLevelDTO> {
        const response = await NetworkService.requestJson<SpaceLevelDTO>({
            method: 'POST',
            url: ENDPOINTS.SPACE_LEVELS.BASE,
            data,
        });
        return response.result as SpaceLevelDTO;
    }

    /**
     * PUT Update Space Level
     */
    static async updateSpaceLevel(data: SpaceLevelUpdationRequest): Promise<SpaceLevelDTO> {
        const response = await NetworkService.requestJson<SpaceLevelDTO>({
            method: 'PUT',
            url: ENDPOINTS.SPACE_LEVELS.BASE,
            data,
        });
        return response.result as SpaceLevelDTO;
    }

    /**
     * GET Space Level By ID
     */
    static async getSpaceLevelById(id: number | string): Promise<SpaceLevelDTO> {
        const response = await NetworkService.requestJson<SpaceLevelDTO>({
            method: 'GET',
            url: ENDPOINTS.SPACE_LEVELS.DETAIL(id),
        });
        return response.result as SpaceLevelDTO;
    }

    /**
     * DELETE Space Level
     */
    static async deleteSpaceLevel(id: number | string): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.SPACE_LEVELS.DETAIL(id),
        });
    }
}
