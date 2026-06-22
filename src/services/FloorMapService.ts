import { FloorMapResponse, FloorMapStatusResponse, MachineFloorPositionRequest } from '@/types/FloorMap';
import { ENDPOINTS } from './endpoints';
import { NetworkService } from './NetworkService';

export class FloorMapService {
    static async getFloorMap(spaceId: number | string): Promise<FloorMapResponse> {
        const response = await NetworkService.requestJson<FloorMapResponse>({
            method: 'GET',
            url: ENDPOINTS.FLOOR_MAP.DETAIL(spaceId),
        });

        return response.result as FloorMapResponse;
    }

    static async getFloorMapStatus(spaceId: number | string): Promise<FloorMapStatusResponse> {
        const response = await NetworkService.requestJson<FloorMapStatusResponse>({
            method: 'GET',
            url: ENDPOINTS.FLOOR_MAP.STATUS(spaceId),
        });

        return response.result as FloorMapStatusResponse;
    }

    static async upsertMachinePosition(
        spaceId: number | string,
        machineId: string,
        data: MachineFloorPositionRequest
    ): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.FLOOR_MAP.MACHINE_POSITION(spaceId, machineId),
            data,
        });
    }

    static async deleteMachinePosition(spaceId: number | string, machineId: string): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.FLOOR_MAP.MACHINE_POSITION(spaceId, machineId),
        });
    }
}
