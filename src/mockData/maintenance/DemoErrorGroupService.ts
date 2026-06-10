import type { ErrorGroup, ErrorGroupFormData, ErrorGroupUpdateData } from '@/types/ErrorGroup';
import { DEMO_SPACE_AUDIT } from '../admin/factory/spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const demoErrorGroups: ErrorGroup[] = [
    {
        errorGroupId: 1,
        errorGroupName: 'Mechanical Failure',
        description: 'Failures related to physical or mechanical components of the machine.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorGroupId: 2,
        errorGroupName: 'Electrical Issue',
        description: 'Issues caused by electrical systems, wiring, or power supply.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorGroupId: 3,
        errorGroupName: 'Software / Control Error',
        description: 'Errors in machine control software, CNC programs, or PLC logic.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorGroupId: 4,
        errorGroupName: 'Tooling & Mold Issue',
        description: 'Problems with cutting tools, molds, nozzles, or jigs.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        errorGroupId: 5,
        errorGroupName: 'Operator Error',
        description: 'Incidents caused by incorrect operation or human mistake.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
];

const getNextErrorGroupId = () =>
    Math.max(...demoErrorGroups.map((g) => g.errorGroupId), 0) + 1;

const touchErrorGroup = (group: ErrorGroup) => {
    group.auditMetaData = {
        ...(group.auditMetaData ?? DEMO_SPACE_AUDIT),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const findErrorGroup = (errorGroupId: number) => {
    const group = demoErrorGroups.find((g) => g.errorGroupId === errorGroupId);
    if (!group) throw new Error('Demo error group was not found');
    return group;
};

export class DemoErrorGroupService {
    static async getAllErrorGroups(): Promise<ErrorGroup[]> {
        return clone(demoErrorGroups);
    }

    static async getActiveErrorGroups(): Promise<ErrorGroup[]> {
        return clone(demoErrorGroups.filter((g) => g.status === 'ACTIVE'));
    }

    static async getErrorGroupById(errorGroupId: number): Promise<ErrorGroup> {
        return clone(findErrorGroup(errorGroupId));
    }

    static async createErrorGroup(data: ErrorGroupFormData): Promise<ErrorGroup> {
        const now = new Date().toISOString();
        const newGroup: ErrorGroup = {
            errorGroupId: getNextErrorGroupId(),
            errorGroupName: data.errorGroupName,
            description: data.description,
            status: data.status,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };
        demoErrorGroups.push(newGroup);
        return clone(newGroup);
    }

    static async updateErrorGroup(data: ErrorGroupUpdateData): Promise<ErrorGroup> {
        const group = findErrorGroup(data.errorGroupId);
        group.errorGroupName = data.errorGroupName;
        group.description = data.description;
        group.status = data.status;
        touchErrorGroup(group);
        return clone(group);
    }

    static async deleteErrorGroup(errorGroupId: number): Promise<void> {
        const index = demoErrorGroups.findIndex((g) => g.errorGroupId === errorGroupId);
        if (index === -1) throw new Error('Demo error group was not found');
        demoErrorGroups.splice(index, 1);
    }

    static findSync(id: number) {
        return demoErrorGroups.find((g) => g.errorGroupId === id) ?? null;
    }
}
