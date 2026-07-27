import { CursorPage, PaginatedResult } from '@/types/Common';
import {
    ImportConfirmRequest,
    ImportResult,
    IncidentDeferRequest,
    IncidentPauseRequest,
    IncidentTerminateRequest,
    ProductionPlanDailyFilter,
    ProductionPlanDailyMachineGroup,
    ProductionPlanDeferResponse,
    ProductionPlanDetail,
    ProductionPlanFormData,
    ProductionPlanMoveRequest,
    ProductionPlanMutationResponse,
    ProductionPlanReorderDayGroup,
    ProductionPlanReorderDayResponse,
    ProductionPlanStatusLog,
    ProductionPlanStatusLogFilter,
    ProductionPlanUpdateFormData,
    ProductionPlanWeeklyFilter,
    ProductionPlanWeeklyMachineGroup,
} from '@/types/ProductionPlan';
import { NetworkService } from './NetworkService';
import { ENDPOINTS } from './endpoints';

export class ProductionPlanService {
    static async getDailyProductionPlans(
        filter: ProductionPlanDailyFilter
    ): Promise<PaginatedResult<ProductionPlanDailyMachineGroup>> {
        const response = await NetworkService.requestJson<
            PaginatedResult<ProductionPlanDailyMachineGroup>
        >({
            method: 'GET',
            url: ENDPOINTS.PRODUCTION_PLANS.DAILY,
            data: filter,
        });

        return response.result as PaginatedResult<ProductionPlanDailyMachineGroup>;
    }

    static async getWeeklyProductionPlans(
        filter: ProductionPlanWeeklyFilter
    ): Promise<PaginatedResult<ProductionPlanWeeklyMachineGroup>> {
        const response = await NetworkService.requestJson<
            PaginatedResult<ProductionPlanWeeklyMachineGroup>
        >({
            method: 'GET',
            url: ENDPOINTS.PRODUCTION_PLANS.WEEKLY,
            data: filter,
        });

        return response.result as PaginatedResult<ProductionPlanWeeklyMachineGroup>;
    }

    static async getProductionPlanById(productionPlanId: string): Promise<ProductionPlanDetail> {
        const response = await NetworkService.requestJson<ProductionPlanDetail>({
            method: 'GET',
            url: ENDPOINTS.PRODUCTION_PLANS.DETAIL(productionPlanId),
        });

        return response.result as ProductionPlanDetail;
    }

    static async getProductionPlanStatusLogs(
        productionPlanId: string,
        filter?: ProductionPlanStatusLogFilter
    ): Promise<CursorPage<ProductionPlanStatusLog>> {
        const response = await NetworkService.requestJson<CursorPage<ProductionPlanStatusLog>>({
            method: 'GET',
            url: ENDPOINTS.PRODUCTION_PLANS.STATUS_LOGS(productionPlanId),
            data: filter,
        });

        return response.result as CursorPage<ProductionPlanStatusLog>;
    }

    static async createProductionPlan(
        planData: ProductionPlanFormData
    ): Promise<ProductionPlanMutationResponse> {
        const response = await NetworkService.requestJson<ProductionPlanMutationResponse>({
            method: 'POST',
            url: ENDPOINTS.PRODUCTION_PLANS.BASE,
            data: planData,
        });

        return response.result as ProductionPlanMutationResponse;
    }

    static async updateProductionPlan(
        planData: ProductionPlanUpdateFormData
    ): Promise<ProductionPlanMutationResponse> {
        const response = await NetworkService.requestJson<ProductionPlanMutationResponse>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.BASE,
            data: planData,
        });

        return response.result as ProductionPlanMutationResponse;
    }

    static async deleteProductionPlan(productionPlanId: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'DELETE',
            url: ENDPOINTS.PRODUCTION_PLANS.DETAIL(productionPlanId),
        });

        return response.message as string;
    }

    static async restoreProductionPlan(productionPlanId: string): Promise<string> {
        const response = await NetworkService.requestJson<void>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.RESTORE(productionPlanId),
        });

        return response.message as string;
    }

    static async reorderProductionPlans(
        days: ProductionPlanReorderDayGroup[]
    ): Promise<ProductionPlanReorderDayResponse[]> {
        const response = await NetworkService.requestJson<ProductionPlanReorderDayResponse[]>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.REORDER,
            data: { days },
        });

        return response.result as ProductionPlanReorderDayResponse[];
    }

    static async moveProductionPlan(
        productionPlanId: string,
        request: ProductionPlanMoveRequest
    ): Promise<ProductionPlanMutationResponse> {
        const response = await NetworkService.requestJson<ProductionPlanMutationResponse>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.MOVE(productionPlanId),
            data: request,
        });

        return response.result as ProductionPlanMutationResponse;
    }

    static async terminateProductionPlan(
        productionPlanId: string,
        request: IncidentTerminateRequest
    ): Promise<ProductionPlanMutationResponse> {
        const response = await NetworkService.requestJson<ProductionPlanMutationResponse>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.INCIDENT_TERMINATE(productionPlanId),
            data: request,
        });

        return response.result as ProductionPlanMutationResponse;
    }

    static async deferProductionPlan(
        productionPlanId: string,
        request: IncidentDeferRequest
    ): Promise<ProductionPlanDeferResponse> {
        const response = await NetworkService.requestJson<ProductionPlanDeferResponse>({
            method: 'POST',
            url: ENDPOINTS.PRODUCTION_PLANS.INCIDENT_DEFER(productionPlanId),
            data: request,
        });

        return response.result as ProductionPlanDeferResponse;
    }

    static async pauseProductionPlan(
        productionPlanId: string,
        request: IncidentPauseRequest
    ): Promise<ProductionPlanMutationResponse> {
        const response = await NetworkService.requestJson<ProductionPlanMutationResponse>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.INCIDENT_PAUSE(productionPlanId),
            data: request,
        });

        return response.result as ProductionPlanMutationResponse;
    }

    static async completeProductionPlan(
        productionPlanId: string
    ): Promise<ProductionPlanMutationResponse> {
        const response = await NetworkService.requestJson<ProductionPlanMutationResponse>({
            method: 'PUT',
            url: ENDPOINTS.PRODUCTION_PLANS.COMPLETE(productionPlanId),
        });

        return response.result as ProductionPlanMutationResponse;
    }

    static async importFromFile(file: File): Promise<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await NetworkService.requestFormData<ImportResult>({
            method: 'POST',
            url: ENDPOINTS.PRODUCTION_PLANS.IMPORT,
            data: formData,
        });

        return response.result as ImportResult;
    }

    static async confirmImport(request: ImportConfirmRequest): Promise<ImportResult> {
        const response = await NetworkService.requestJson<ImportResult>({
            method: 'POST',
            url: ENDPOINTS.PRODUCTION_PLANS.IMPORT_CONFIRM,
            data: request,
        });

        return response.result as ImportResult;
    }
}
