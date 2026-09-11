import { EnergyConsumption, TimePeriod } from '@/types';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ElectricService {
    static async getElectricByDateAndZone(
        date: TimePeriod,
        zoneId = ''
    ): Promise<EnergyConsumption[]> {
        const response = await NetworkService.requestJson<EnergyConsumption[]>({
            method: 'GET',
            url: `${ENDPOINTS.ENERGY.OVERVIEW_BY_FILTER}?datePeriod=${date}&spaceId=36`,
        });
        return response.result!;
    }

    static async getElectricByDateRange(
        startDate: string,
        endDate: string,
        zoneId = ''
    ): Promise<EnergyConsumption[]> {
        const response = await NetworkService.requestJson<EnergyConsumption[]>({
            method: 'GET',
            url: `${ENDPOINTS.ENERGY.OVERVIEW_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}&zoneId=${zoneId}`,
        });
        return response.result!;
    }
}
