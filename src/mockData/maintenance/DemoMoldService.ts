import type { Mold, MoldFormData, MoldUpdateData } from '@/types/Mold';
import { DEMO_SPACE_AUDIT } from '../admin/factory/spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const demoMolds: Mold[] = [
    {
        moldId: 1,
        moldCode: 'MOLD-A01',
        moldName: 'Injection Mold A01',
        description: 'Single-cavity injection mold for housing cover parts.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        moldId: 2,
        moldCode: 'MOLD-B02',
        moldName: 'Compression Mold B02',
        description: 'Multi-cavity compression mold for rubber gasket production.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        moldId: 3,
        moldCode: 'MOLD-C03',
        moldName: 'Transfer Mold C03',
        description: 'Transfer mold used for precision electronic component encapsulation.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        moldId: 4,
        moldCode: 'MOLD-D04',
        moldName: 'Blow Mold D04',
        description: 'Blow mold for hollow plastic container production.',
        status: 'ACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        moldId: 5,
        moldCode: 'MOLD-E05',
        moldName: 'Die Cast Mold E05',
        description: 'Aluminum die cast mold for structural bracket parts.',
        status: 'INACTIVE',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
];

const getNextMoldId = () =>
    Math.max(...demoMolds.map((m) => m.moldId), 0) + 1;

const touchMold = (mold: Mold) => {
    mold.auditMetaData = {
        ...(mold.auditMetaData ?? DEMO_SPACE_AUDIT),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const findMold = (moldId: number) => {
    const mold = demoMolds.find((m) => m.moldId === moldId);
    if (!mold) throw new Error('Demo mold was not found');
    return mold;
};

export class DemoMoldService {
    static async getAllMolds(): Promise<Mold[]> {
        return clone(demoMolds);
    }

    static async getActiveMolds(): Promise<Mold[]> {
        return clone(demoMolds.filter((m) => m.status === 'ACTIVE'));
    }

    static async getMoldById(moldId: number): Promise<Mold> {
        return clone(findMold(moldId));
    }

    static async createMold(data: MoldFormData): Promise<Mold> {
        const now = new Date().toISOString();
        const newMold: Mold = {
            moldId: getNextMoldId(),
            moldCode: data.moldCode,
            moldName: data.moldName,
            description: data.description,
            status: data.status,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };
        demoMolds.push(newMold);
        return clone(newMold);
    }

    static async updateMold(data: MoldUpdateData): Promise<Mold> {
        const mold = findMold(data.moldId);
        mold.moldCode = data.moldCode;
        mold.moldName = data.moldName;
        mold.description = data.description;
        mold.status = data.status;
        touchMold(mold);
        return clone(mold);
    }

    static async deleteMold(moldId: number): Promise<void> {
        const index = demoMolds.findIndex((m) => m.moldId === moldId);
        if (index === -1) throw new Error('Demo mold was not found');
        demoMolds.splice(index, 1);
    }

    static findSync(id: number) {
        return demoMolds.find((m) => m.moldId === id) ?? null;
    }
}
