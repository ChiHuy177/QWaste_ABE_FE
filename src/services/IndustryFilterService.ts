import {
    IndustryFilter,
    IndustryFilterFormData,
    IndustryFilterUpdateData,
} from '@/types/IndustryFilter';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class IndustryFilterService {
    static async getAllIndustryFilters(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.BASE,
        });
        return response.result as IndustryFilter[];
    }

    static async getIndustryFiltersForPicking(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.PICKING,
        });
        return response.result as IndustryFilter[];
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
        return response.result as IndustryFilter[];
    }

    static async getShiftFilters(): Promise<IndustryFilter[]> {
        const response = await NetworkService.requestJson<IndustryFilter[]>({
            method: 'GET',
            url: ENDPOINTS.INDUSTRY_FILTER.SHIFTS,
        });
        return response.result as IndustryFilter[];
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
