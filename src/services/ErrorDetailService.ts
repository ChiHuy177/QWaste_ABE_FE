import { ErrorDetail, ErrorDetailFormData } from '@/types/ErrorDetail';

let MOCK_ERROR_DETAILS: ErrorDetail[] = [
    {
        errorDetailId: 1,
        errorCodeId: 1,
        errorCode: 'ERR-001',
        errorName: 'Bit Stuck',
        description: 'Drill bit jammed inside workpiece during machining operation',
        status: 'ACTIVE',
        errorGroupId: 1,
        auditMetaData: { createdAt: '2025-01-10T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-10T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorDetailId: 2,
        errorCodeId: 2,
        errorCode: 'ERR-002',
        errorName: 'Bit Broken',
        description: 'Drill bit fractured during operation due to excessive load or worn tooling',
        status: 'ACTIVE',
        errorGroupId: 1,
        auditMetaData: { createdAt: '2025-01-11T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-11T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorDetailId: 3,
        errorCodeId: 3,
        errorCode: 'ERR-003',
        errorName: 'Suction Defective',
        description: 'Vacuum suction system failed to hold the workpiece in position',
        status: 'ACTIVE',
        errorGroupId: 1,
        auditMetaData: { createdAt: '2025-01-12T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-12T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorDetailId: 4,
        errorCodeId: 4,
        errorCode: 'ERR-005',
        errorName: 'Overheated',
        description: 'Machine temperature exceeded safe operating threshold',
        status: 'ACTIVE',
        errorGroupId: 2,
        auditMetaData: { createdAt: '2025-01-13T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-13T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorDetailId: 5,
        errorCodeId: 5,
        errorCode: 'ERR-009',
        errorName: 'Mould Stuck',
        description: 'Mould failed to release from the workpiece after injection cycle',
        status: 'ACTIVE',
        errorGroupId: 4,
        auditMetaData: { createdAt: '2025-01-14T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-14T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorDetailId: 6,
        errorCodeId: 6,
        errorCode: 'ERR-010',
        errorName: 'Spray Gun Clogged',
        description: 'Coating spray nozzle blocked causing uneven application',
        status: 'ACTIVE',
        errorGroupId: 4,
        auditMetaData: { createdAt: '2025-01-15T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-15T08:00:00Z', updatedBy: 'admin' },
    },
    {
        errorDetailId: 7,
        errorCodeId: 7,
        errorCode: 'ERR-008',
        errorName: 'Welding Nozzle Contaminated',
        description: 'Welding torch nozzle contaminated with spatter reducing weld quality',
        status: 'INACTIVE',
        errorGroupId: 4,
        auditMetaData: { createdAt: '2025-01-16T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-17T09:00:00Z', updatedBy: 'admin' },
    },
];

let nextId = 8;

export class ErrorDetailService {
    static async getAllErrorDetails(): Promise<ErrorDetail[]> {
        return Promise.resolve([...MOCK_ERROR_DETAILS]);
    }

    static async createErrorDetail(data: ErrorDetailFormData): Promise<ErrorDetail> {
        const id = nextId++;
        const newItem: ErrorDetail = {
            errorDetailId: id,
            errorCodeId: id,
            ...data,
            auditMetaData: {
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin',
            },
        };
        MOCK_ERROR_DETAILS.push(newItem);
        return Promise.resolve(newItem);
    }

    static async updateErrorDetail(data: ErrorDetail): Promise<string> {
        MOCK_ERROR_DETAILS = MOCK_ERROR_DETAILS.map((item) =>
            item.errorCodeId === data.errorCodeId
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

    static async deleteErrorDetail(errorCodeId: number): Promise<void> {
        MOCK_ERROR_DETAILS = MOCK_ERROR_DETAILS.filter(
            (item) => item.errorCodeId !== errorCodeId
        );
        return Promise.resolve();
    }
}
