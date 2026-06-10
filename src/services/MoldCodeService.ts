import { MoldCode, MoldCodeFormData } from '@/types/MoldCode';

let MOCK_MOLD_CODES: MoldCode[] = [
    {
        moldCodeId: 1,
        moldCodeName: 'MLD-A001',
        description: 'Standard injection mould for housing component A — cavity count: 4',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-10T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-10T08:00:00Z', updatedBy: 'admin' },
    },
    {
        moldCodeId: 2,
        moldCodeName: 'MLD-B002',
        description: 'Compression mould for rubber seal B — high temperature resistant',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-11T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-11T08:00:00Z', updatedBy: 'admin' },
    },
    {
        moldCodeId: 3,
        moldCodeName: 'MLD-C003',
        description: 'Blow mould for plastic bottle C — 500ml variant',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-12T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-12T08:00:00Z', updatedBy: 'admin' },
    },
    {
        moldCodeId: 4,
        moldCodeName: 'MLD-D004',
        description: 'Die casting mould for aluminium bracket D',
        status: 'ACTIVE',
        auditMetaData: { createdAt: '2025-01-13T08:00:00Z', createdBy: 'admin', updatedAt: '2025-01-13T08:00:00Z', updatedBy: 'admin' },
    },
    {
        moldCodeId: 5,
        moldCodeName: 'MLD-E005',
        description: 'Prototype mould E — decommissioned, kept for reference only',
        status: 'INACTIVE',
        auditMetaData: { createdAt: '2025-01-14T08:00:00Z', createdBy: 'admin', updatedAt: '2025-02-01T09:00:00Z', updatedBy: 'admin' },
    },
];

let nextId = 6;

export class MoldCodeService {
    static async getAllMoldCodes(): Promise<MoldCode[]> {
        return Promise.resolve([...MOCK_MOLD_CODES]);
    }

    static async createMoldCode(data: MoldCodeFormData): Promise<MoldCode> {
        const newItem: MoldCode = {
            moldCodeId: nextId++,
            ...data,
            auditMetaData: {
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                updatedAt: new Date().toISOString(),
                updatedBy: 'admin',
            },
        };
        MOCK_MOLD_CODES.push(newItem);
        return Promise.resolve(newItem);
    }

    static async updateMoldCode(data: MoldCode): Promise<string> {
        MOCK_MOLD_CODES = MOCK_MOLD_CODES.map((item) =>
            item.moldCodeId === data.moldCodeId
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

    static async deleteMoldCode(moldCodeId: number): Promise<void> {
        MOCK_MOLD_CODES = MOCK_MOLD_CODES.filter((item) => item.moldCodeId !== moldCodeId);
        return Promise.resolve();
    }
}
