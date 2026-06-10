import { ProductionPlan, ProductionPlanFormData } from '@/types/ProductionPlan';

let MOCK_PRODUCTION_PLANS: ProductionPlan[] = [
    {
        planId: 1,
        filterId: 'DAY',
        machineId: 101,
        plannedQuantity: 500,
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-10T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-10T08:00:00Z', updatedBy: 'admin' },
    },
    {
        planId: 2,
        filterId: 'WEEK',
        machineId: 101,
        plannedQuantity: 2800,
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-10T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-10T08:00:00Z', updatedBy: 'admin' },
    },
    {
        planId: 3,
        filterId: 'DAY',
        machineId: 102,
        plannedQuantity: 350,
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-11T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-11T08:00:00Z', updatedBy: 'admin' },
    },
    {
        planId: 4,
        filterId: 'WEEK',
        machineId: 102,
        plannedQuantity: 1800,
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-11T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-11T08:00:00Z', updatedBy: 'admin' },
    },
    {
        planId: 5,
        filterId: 'DAY',
        machineId: 103,
        plannedQuantity: 600,
        status: 'INACTIVE',
        auditMetaData: { createdAt: '2025-01-12T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-13T09:00:00Z', updatedBy: 'admin' },
    },
];

let nextId = 6;

export class ProductionPlanService {
    static async getAllProductionPlans(): Promise<ProductionPlan[]> {
        return Promise.resolve([...MOCK_PRODUCTION_PLANS]);
    }

    static async createProductionPlan(data: ProductionPlanFormData): Promise<ProductionPlan> {
        const newItem: ProductionPlan = {
            planId: nextId++,
            ...data,
            auditMetaData: {
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin',
            },
        };
        MOCK_PRODUCTION_PLANS.push(newItem);
        return Promise.resolve(newItem);
    }

    static async updateProductionPlan(data: ProductionPlan): Promise<string> {
        MOCK_PRODUCTION_PLANS = MOCK_PRODUCTION_PLANS.map((item) =>
            item.planId === data.planId
                ? {
                      ...item,
                      ...data,
                      auditMetaData: {
                          createdAt: item.auditMetaData?.createdAt ?? null,
                          createdBy: item.auditMetaData?.createdBy ?? null,
                          updatedAt: new Date().toISOString(),
                          updatedBy: 'admin',
                      },
                  }
                : item
        );
        return Promise.resolve('Updated successfully');
    }

    static async deleteProductionPlan(planId: number): Promise<void> {
        MOCK_PRODUCTION_PLANS = MOCK_PRODUCTION_PLANS.filter((item) => item.planId !== planId);
        return Promise.resolve();
    }
}
