import { Zone, ZoneFormData } from '@/types/Zone';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ZoneService {
    static async getAllZones(): Promise<Zone[]> {
        const response = await NetworkService.requestJson<Zone[]>({
            method: 'GET',
            url: ENDPOINTS.ZONES.BASE,
        });
        return response.result as Zone[];
    }

    static async getZoneForPicking(): Promise<Zone[]> {
        const response = await NetworkService.requestJson<Zone[]>({
            method: 'GET',
            url: ENDPOINTS.ZONES.PICKING,
        });
        return response.result as Zone[];
    }

    static async getZonesByFactory(factoryId: number): Promise<Zone[]> {
        const response = await NetworkService.requestJson<Zone[]>({
            method: 'GET',
            url: ENDPOINTS.ZONES.BY_FACTORY(factoryId),
        });
        return response.result as Zone[];
    }

    static async getZoneById(zoneId: number): Promise<Zone> {
        const response = await NetworkService.requestJson<Zone>({
            method: 'GET',
            url: ENDPOINTS.ZONES.DETAIL(zoneId),
        });
        return response.result as Zone;
    }

    static async createZone(zoneData: ZoneFormData): Promise<Zone> {
        const response = await NetworkService.requestJson<Zone>({
            method: 'POST',
            url: ENDPOINTS.ZONES.BASE,
            data: zoneData,
        });
        return response.result as Zone;
    }

    static async updateZone(zoneData: Zone): Promise<string> {
        const response = await NetworkService.requestJson<Zone>({
            method: 'PUT',
            url: ENDPOINTS.ZONES.BASE,
            data: zoneData,
        });
        return response.message as string;
    }

    static async deleteZone(zoneId: number): Promise<void> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.ZONES.DETAIL(zoneId),
        });
        return response.result;
    }
}
