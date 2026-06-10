import type { ErrorDetail, ErrorDetailFormData, ErrorDetailUpdateData } from '@/types/ErrorDetail';
import { DEMO_SPACE_AUDIT } from '../admin/factory/spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const demoErrorDetails: ErrorDetail[] = [
    // Group 1: Mechanical Failure
    {
        errorDetailId: 1,
        errorCodeId: 1,
        errorCode: 'ERR-001',
        errorName: 'Bit Stuck',
        description: 'Cutting bit is jammed and unable to rotate or move.',
        status: 'ACTIVE',
        errorGroupId: 1,
        errorGroupName: 'Mechanical Failure',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 2,
        errorCodeId: 2,
        errorCode: 'ERR-002',
        errorName: 'Bit Broken',
        description: 'Cutting bit fractured during machining operation.',
        status: 'ACTIVE',
        errorGroupId: 1,
        errorGroupName: 'Mechanical Failure',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 3,
        errorCodeId: 3,
        errorCode: 'ERR-003',
        errorName: 'Suction Defective',
        description: 'Vacuum suction system is not generating sufficient pressure.',
        status: 'ACTIVE',
        errorGroupId: 1,
        errorGroupName: 'Mechanical Failure',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 4,
        errorCodeId: 4,
        errorCode: 'ERR-004',
        errorName: 'Low Gas Flow Rate',
        description: 'Insufficient assist gas pressure detected during cutting process.',
        status: 'ACTIVE',
        errorGroupId: 1,
        errorGroupName: 'Mechanical Failure',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    // Group 2: Electrical Issue
    {
        errorDetailId: 5,
        errorCodeId: 5,
        errorCode: 'ERR-005',
        errorName: 'Overheated',
        description: 'Machine or motor component reached critical temperature threshold.',
        status: 'ACTIVE',
        errorGroupId: 2,
        errorGroupName: 'Electrical Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 6,
        errorCodeId: 6,
        errorCode: 'ERR-006',
        errorName: 'Power Supply Failure',
        description: 'Unexpected power cut or input voltage drop detected.',
        status: 'ACTIVE',
        errorGroupId: 2,
        errorGroupName: 'Electrical Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    // Group 3: Software / Control Error
    {
        errorDetailId: 7,
        errorCodeId: 7,
        errorCode: 'ERR-007',
        errorName: 'Program Fault',
        description: 'CNC program or PLC logic encountered an unexpected runtime fault.',
        status: 'ACTIVE',
        errorGroupId: 3,
        errorGroupName: 'Software / Control Error',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    // Group 4: Tooling & Mold Issue
    {
        errorDetailId: 8,
        errorCodeId: 8,
        errorCode: 'ERR-008',
        errorName: 'Welding Nozzle Contaminated',
        description: 'Welding nozzle is blocked or contaminated by residue.',
        status: 'ACTIVE',
        errorGroupId: 4,
        errorGroupName: 'Tooling & Mold Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 9,
        errorCodeId: 9,
        errorCode: 'ERR-009',
        errorName: 'Mould Stuck',
        description: 'Mold cannot be opened or closed properly due to jamming.',
        status: 'ACTIVE',
        errorGroupId: 4,
        errorGroupName: 'Tooling & Mold Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 10,
        errorCodeId: 10,
        errorCode: 'ERR-010',
        errorName: 'Spray Gun Clogged',
        description: 'Coating spray gun nozzle is blocked, preventing uniform coverage.',
        status: 'ACTIVE',
        errorGroupId: 4,
        errorGroupName: 'Tooling & Mold Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 11,
        errorCodeId: 11,
        errorCode: 'ERR-011',
        errorName: 'Laser Optics Contaminated',
        description: 'Laser lens or mirror is dirty, reducing beam quality and cut accuracy.',
        status: 'ACTIVE',
        errorGroupId: 4,
        errorGroupName: 'Tooling & Mold Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 12,
        errorCodeId: 12,
        errorCode: 'ERR-012',
        errorName: 'Refill Coat Material',
        description: 'Coating material reservoir is depleted and requires refill.',
        status: 'ACTIVE',
        errorGroupId: 4,
        errorGroupName: 'Tooling & Mold Issue',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    // Group 5: Operator Error
    {
        errorDetailId: 13,
        errorCodeId: 13,
        errorCode: 'ERR-013',
        errorName: 'Incorrect Placement',
        description: 'Workpiece was loaded or placed incorrectly on the machine fixture.',
        status: 'ACTIVE',
        errorGroupId: 5,
        errorGroupName: 'Operator Error',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorDetailId: 14,
        errorCodeId: 14,
        errorCode: 'ERR-014',
        errorName: 'Material Mixing',
        description: 'Wrong material type was fed into the production process.',
        status: 'ACTIVE',
        errorGroupId: 5,
        errorGroupName: 'Operator Error',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
];

const getNextErrorDetailId = () =>
    Math.max(...demoErrorDetails.map((d) => d.errorDetailId), 0) + 1;

const touchErrorDetail = (detail: ErrorDetail) => {
    detail.auditMetaData = {
        ...(detail.auditMetaData ?? DEMO_SPACE_AUDIT),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const findErrorDetail = (errorDetailId: number) => {
    const detail = demoErrorDetails.find((d) => d.errorDetailId === errorDetailId);
    if (!detail) throw new Error('Demo error detail was not found');
    return detail;
};

export class DemoErrorDetailService {
    static async getAllErrorDetails(): Promise<ErrorDetail[]> {
        return clone(demoErrorDetails);
    }

    static async getErrorDetailsByGroup(errorGroupId: number): Promise<ErrorDetail[]> {
        return clone(
            demoErrorDetails.filter(
                (d) => d.errorGroupId === errorGroupId && d.status === 'ACTIVE'
            )
        );
    }

    static async getErrorDetailById(errorDetailId: number): Promise<ErrorDetail> {
        return clone(findErrorDetail(errorDetailId));
    }

    static async createErrorDetail(data: ErrorDetailFormData): Promise<ErrorDetail> {
        const now = new Date().toISOString();
        const nextId = getNextErrorDetailId();
        const newDetail: ErrorDetail = {
            errorDetailId: nextId,
            errorCodeId: nextId,
            errorCode: data.errorCode,
            errorName: data.errorName,
            description: data.description,
            status: data.status,
            errorGroupId: data.errorGroupId,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };
        demoErrorDetails.push(newDetail);
        return clone(newDetail);
    }

    static async updateErrorDetail(data: ErrorDetailUpdateData): Promise<ErrorDetail> {
        const detail = findErrorDetail(data.errorDetailId);
        detail.errorCode = data.errorCode;
        detail.errorName = data.errorName;
        detail.description = data.description;
        detail.status = data.status;
        detail.errorGroupId = data.errorGroupId;
        touchErrorDetail(detail);
        return clone(detail);
    }

    static async deleteErrorDetail(errorDetailId: number): Promise<void> {
        const index = demoErrorDetails.findIndex((d) => d.errorDetailId === errorDetailId);
        if (index === -1) throw new Error('Demo error detail was not found');
        demoErrorDetails.splice(index, 1);
    }

    static findSync(id: number) {
        return demoErrorDetails.find((d) => d.errorDetailId === id) ?? null;
    }
}
