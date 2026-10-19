import {
    IndustryFilter,
    IndustryFilterFormData,
    IndustryFilterUpdateData,
} from '@/types/IndustryFilter';
import { PaginatedResult } from '@/types/Common';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class IndustryFilterService {
    static async getAllIndustryFilters(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<
            IndustryFilter[] | PaginatedResult<IndustryFilter>
        >({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.BASE,
        });
        const result = response.result;
        const list = Array.isArray(result) ? result : (result?.content ?? []);
        return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    static async getIndustryFiltersForPicking(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.PICKING,
        });
        const filters = (response.result as IndustryFilter[]) || [];
        return [...filters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    static async getIndustryFilterById(filterId: number): Promise<IndustryFilter> {
        const response = await NetworkService.requestJson<IndustryFilter>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.DETAIL(filterId),
        });
        return response.result as IndustryFilter;
    }

    static async getPrimaryIndustryFilters(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.PRIMARY,
        });
        const filters = (response.result as IndustryFilter[]) || [];
        return [...filters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    static async getShiftFilters(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.SHIFTS,
        });
        const filters = (response.result as IndustryFilter[]) || [];
        return [...filters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    static async createIndustryFilter(filterData: IndustryFilterFormData): Promise<IndustryFilter> {
        const response = await NetworkService.requestJson<IndustryFilter>({
            method: 'POST',
            url: ENDPOINTS.INDUSTRY_FILTER.BASE,
            data: filterData,
        });
        return response.result as IndustryFilter;
    }

    static async updateIndustryFilter(filterData: IndustryFilterUpdateData): Promise<string> {
        const response = await NetworkService.requestJson<IndustryFilter>({
            method: 'PUT',
            url: ENDPOINTS.INDUSTRY_FILTER.BASE,
            data: filterData,
        });
        return response.message as string;
    }

    static async deleteIndustryFilter(filterId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.INDUSTRY_FILTER.DETAIL(filterId),
        });
        return response.result;
    }
}
