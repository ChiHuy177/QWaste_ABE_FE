import { ErrorGroup, ErrorGroupFormData } from '@/types/ErrorGroup';

let MOCK_ERROR_GROUPS: ErrorGroup[] = [
    {
        errorGroupId: 1,
        errorGroupName: 'Mechanical Failure',
        description: 'Errors related to mechanical components such as gears, belts, and bearings',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-10T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-10T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorGroupId: 2,
        errorGroupName: 'Electrical Fault',
        description: 'Errors caused by electrical system issues including wiring and power supply',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-11T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-11T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorGroupId: 3,
        errorGroupName: 'Software / Control Error',
        description: 'Errors caused by CNC or PLC control software malfunctions',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-12T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-12T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorGroupId: 4,
        errorGroupName: 'Operator Error',
        description: 'Incidents caused by incorrect machine operation or setup',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-13T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-13T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorGroupId: 5,
        errorGroupName: 'Material Defect',
        description: 'Errors resulting from defective or out-of-spec raw materials',
        status: 'INACTIVE',
        auditMetaData: { createdAt: '2025-01-14T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-15T09:00:00Z', updatedBy: 'admin' },
    },
];

let nextId = 6;

export class ErrorGroupService {
    static async getAllErrorGroups(): Promise<ErrorGroup[]> {
        return Promise.resolve([...MOCK_ERROR_GROUPS]);
    }

    static async createErrorGroup(data: ErrorGroupFormData): Promise<ErrorGroup> {
        const newItem: ErrorGroup = {
            errorGroupId: nextId++,
            ...data,
            auditMetaData: {
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin',
            },
        };
        MOCK_ERROR_GROUPS.push(newItem);
        return Promise.resolve(newItem);
    }

    static async updateErrorGroup(data: ErrorGroup): Promise<string> {
        MOCK_ERROR_GROUPS = MOCK_ERROR_GROUPS.map((item) =>
            item.errorGroupId === data.errorGroupId
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

    static async deleteErrorGroup(errorGroupId: number): Promise<void> {
        MOCK_ERROR_GROUPS = MOCK_ERROR_GROUPS.filter(
            (item) => item.errorGroupId !== errorGroupId
        );
        return Promise.resolve();
    }
}
