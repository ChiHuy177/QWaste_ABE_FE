import type { AccessibleFactory, UserProfile } from '@/types/User';
import { DEMO_AUTH_ACCOUNTS } from '@/mockData/auth';

export const USE_MOCK_USERS = true;

export const DEMO_ACCESSIBLE_FACTORIES: AccessibleFactory[] = [
    {
        factoryId: 1,
        factoryCode: 'FACTORY-A',
        factoryName: 'Factory A',
        description: 'Demo production factory',
    },
];

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const activeSoftDeleteMetaData = {
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
};

const createDemoStaff = (
    userId: string,
    fullname: string,
    email: string,
    username: string,
    userCode: string,
    roles: UserProfile['roles'],
    phoneNumber: string,
    gender: string
): UserProfile => ({
    userId,
    fullname,
    email,
    username,
    address: 'Factory A, Demo Industrial Park',
    phoneNumber,
    userCode,
    roles,
    gender,
    preferences: {
        theme: 'light',
        language: 'vi',
        avatarUrl: '',
    },
    accessibleFactories: DEMO_ACCESSIBLE_FACTORIES,
    auditMetaData,
    softDeleteMetaData: activeSoftDeleteMetaData,
});

export const DEMO_STAFF: UserProfile[] = [
    ...DEMO_AUTH_ACCOUNTS.map((account) => ({
        ...account.profile,
        accessibleFactories: DEMO_ACCESSIBLE_FACTORIES,
        auditMetaData,
        softDeleteMetaData: activeSoftDeleteMetaData,
    })),
    createDemoStaff(
        'demo-operator-002',
        'Nguyen Van An',
        'operator.an@demo.local',
        'operator.an',
        'OP002',
        ['operator'],
        '0902233445',
        'MALE'
    ),
    createDemoStaff(
        'demo-maint-001',
        'Tran Bao Minh',
        'maintenance@demo.local',
        'maintenance.demo',
        'MT001',
        ['maintenance'],
        '0903344556',
        'MALE'
    ),
];
