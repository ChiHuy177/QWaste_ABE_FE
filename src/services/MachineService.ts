import { Machine, MachineFormData, MachineOverview, MachineUpdateFormData, MachinePaginatedParams } from '@/types/Machine';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';
import { PaginatedResult } from '@/types/Common';

export class MachineService {
    static async getMachinesPaginated(
        params: MachinePaginatedParams
    ): Promise<PaginatedResult<Machine>> {
        const queryParams = MachineService.buildPaginatedQueryParams(params);

        const response = await NetworkService.requestJson<PaginatedResult<Machine>>({
            method: 'GET',
            url: `${ENDPOINTS.MACHINE.PAGINATION}?${queryParams.toString()}`,
        });
        return response.result as PaginatedResult<Machine>;
    }

    private static buildPaginatedQueryParams(params: MachinePaginatedParams): URLSearchParams {
        const queryParams = new URLSearchParams({
            page: params.page.toString(),
            size: params.size.toString(),
        });

        MachineService.appendSortParams(queryParams, params.sort);
        MachineService.appendTrimmedParam(queryParams, 'search', params.search);

        if (params.spaceId !== undefined) {
            queryParams.append('spaceId', params.spaceId.toString());
        }

        MachineService.appendTrimmedParam(queryParams, 'machineName', params.machineName);
        MachineService.appendTrimmedParam(queryParams, 'machineCode', params.machineCode);
        MachineService.appendTrimmedParam(queryParams, 'propertyCode', params.propertyCode);
        MachineService.appendTrimmedParam(queryParams, 'topic', params.topic);

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

    static async getAllMachines(): Promise<Machine[]> {
        const response = await NetworkService.requestJson<Machine[]>({
            method: 'GET',
            url: ENDPOINTS.MACHINE.BASE,
        });
        return response.result as Machine[];
    }

    static async getAllMachinesInList(spaceId: number): Promise<Machine[]> {
        const url = `${ENDPOINTS.MACHINE.MACHINE_LIST}?spaceId=${spaceId}`;

        const response = await NetworkService.requestJson<Machine[]>({
            method: 'GET',
            url,
        });

        return response.result as Machine[];
    }

    static async getMachineById(machineId: string): Promise<Machine> {
        const response = await NetworkService.requestJson<Machine>({
            method: 'GET',
            url: ENDPOINTS.MACHINE.DETAIL(machineId),
        });
        return response.result as Machine;
    }

    static async getMachinesWithLogs(
        spaceId: number,
        filterId: number
    ): Promise<MachineOverview[]> {
        const response = await NetworkService.requestJson<MachineOverview[]>({
            method: 'GET',
            url: `${ENDPOINTS.MACHINE.WITH_LOGS}?spaceId=${spaceId}&filterId=${filterId}`,
        });

        return response.result as MachineOverview[];
    }

    static async createMachine(machineData: MachineFormData): Promise<MachineFormData> {
        const response = await NetworkService.requestJson<MachineFormData>({
            method: 'POST',
            url: ENDPOINTS.MACHINE.BASE,
            data: machineData,
        });
        return response.result as MachineFormData;
    }

    static async updateMachine(machineData: MachineUpdateFormData): Promise<MachineUpdateFormData> {
        const response = await NetworkService.requestJson<MachineUpdateFormData>({
            method: 'PUT',
            url: ENDPOINTS.MACHINE.BASE,
            data: machineData,
        });
        return response.result as MachineUpdateFormData;
    }

    static async deleteMachine(machineId: string): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.MACHINE.DETAIL(machineId),
        });
    }

    static async restoreMachine(machineId: string): Promise<void> {
        await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.MACHINE.RESTORE(machineId),
        });
    }
}
