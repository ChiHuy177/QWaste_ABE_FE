import {
    FactoryPickingResponse,
    FactoryPickingSimple,
    FactoryOverviewResponse,
    Factory,
    FactoryFormData,
} from '@/types/Factory';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import { WOODSLAND_FILTER } from '@/configs/WoodslandConfig';

export class FactoryService {
    static async getAllFactories(): Promise<Factory[]> {
        const response = await NetworkService.requestJson<Factory[]>({
            method: 'GET',
            url: ENDPOINTS.FACTORY.BASE,
        });
        return response.result as Factory[];
    }

    static async getAllFactoriesPickingForRegister(): Promise<FactoryPickingResponse[]> {
        const response = await NetworkService.requestJson({
            method: 'GET',
            url: ENDPOINTS.FACTORY.PICKING_FOR_REGISTER,
        });

        return response.result;
    }

    static async getFactoryById(factoryId: number): Promise<Factory> {
        const response = await NetworkService.requestJson<Factory>({
            method: 'GET',
            url: ENDPOINTS.FACTORY.DETAIL(factoryId),
        });
        return response.result as Factory;
    }

    static async createFactory(factoryData: FactoryFormData): Promise<Factory> {
        const response = await NetworkService.requestJson<Factory>({
            method: 'POST',
            url: ENDPOINTS.FACTORY.BASE,
            data: factoryData,
        });
        return response.result as Factory;
    }

    static async updateFactory(factoryData: Factory): Promise<string> {
        const response = await NetworkService.requestJson<Factory>({
            method: 'PUT',
            url: ENDPOINTS.FACTORY.BASE,
            data: factoryData,
        });
        return response.message as string;
    }

    static async deleteFactory(factoryId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.FACTORY.DETAIL(factoryId),
        });
        return response.result;
    }

    static async getFactoriesSimple(): Promise<FactoryPickingSimple[]> {
        const response = await NetworkService.requestJson<FactoryPickingSimple[]>({
            method: 'GET',
            url: ENDPOINTS.FACTORY.PICKING,
        });
        return response.result as FactoryPickingSimple[];
    }

    static async getFactoriesForPicking(): Promise<FactoryPickingResponse[]> {
        const response = await NetworkService.requestJson<FactoryPickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.FACTORY.PICKING_WITH_ZONES,
        });
        return response.result as FactoryPickingResponse[];
    }

    static async getFactoriesForPickingWithLines(): Promise<FactoryPickingResponse[]> {
        const response = await NetworkService.requestJson<FactoryPickingResponse[]>({
            method: 'GET',
            url: ENDPOINTS.FACTORY.PICKING_WITH_ZONES_AND_LINES,
        });
        return response.result as FactoryPickingResponse[];
    }

    static async getFactoryOverview(
        factoryId: number,
        datePeriod: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3'
    ): Promise<FactoryOverviewResponse> {
        const response = await NetworkService.requestJson<FactoryOverviewResponse>({
            method: 'GET',
            url: `${ENDPOINTS.FACTORY.OVERVIEW_BY_FILTER}?factoryId=${factoryId}&datePeriod=${datePeriod}${WOODSLAND_FILTER}`,
        });
        return response.result as FactoryOverviewResponse;
    }

    static async getFactoryOverviewByDateRange(
        factoryId: number,
        startDate: string,
        endDate: string,
        shift?: 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3'
    ): Promise<FactoryOverviewResponse> {
        let url = `${ENDPOINTS.FACTORY.OVERVIEW_BY_DATE_RANGE}?factoryId=${factoryId}&startDate=${startDate}&endDate=${endDate}`;
        if (shift) {
            url += `&shift=${shift}`;
        }
        const response = await NetworkService.requestJson<FactoryOverviewResponse>({
            method: 'GET',
            url,
        });
        return response.result as FactoryOverviewResponse;
    }
}
