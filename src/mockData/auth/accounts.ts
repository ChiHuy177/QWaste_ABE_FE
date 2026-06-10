import type { PermissionRule, UserProfile } from '@/types/User';

export const USE_DEMO_AUTH = true;
export const DEMO_AUTH_STORAGE_KEY = 'qwaste_demo_user_id';
export const DEMO_AUTH_COOKIE_NAME = 'bff_access_token';

export interface DemoAuthAccount {
    username: string;
    email: string;
    password: string;
    profile: UserProfile;
}

const adminPermissions: PermissionRule[] = [{ action: 'manage', subject: 'all' }];

const managerPermissions: PermissionRule[] = [
    { action: 'view', subject: 'factory_overview' },
    { action: 'view', subject: 'machine_overview' },
    { action: 'view', subject: 'machine' },
    { action: 'view', subject: 'staffing' },
    { action: 'view', subject: 'space' },
    { action: 'view', subject: 'space_level' },
    { action: 'view', subject: 'staff' },
    { action: 'view', subject: 'drawing_code' },
    { action: 'view', subject: 'order' },
    { action: 'view', subject: 'profile' },
    { action: 'update', subject: 'profile' },
];

const operatorPermissions: PermissionRule[] = [
    { action: 'view', subject: 'operator_dashboard' },
    { action: 'view', subject: 'operator_reviews' },
    { action: 'confirm', subject: 'task_review' },
    { action: 'decline', subject: 'task_review' },
    { action: 'view', subject: 'profile' },
    { action: 'update', subject: 'profile' },
];

const maintenancePermissions: PermissionRule[] = [
    { action: 'view', subject: 'incident_report' },
    { action: 'create', subject: 'incident_report' },
    { action: 'update', subject: 'incident_report' },
    { action: 'delete', subject: 'incident_report' },
    { action: 'view', subject: 'profile' },
    { action: 'update', subject: 'profile' },
];

const qcPermissions: PermissionRule[] = [
    { action: 'view', subject: 'qc_dashboard' },
    { action: 'confirm', subject: 'task_review' },
    { action: 'decline', subject: 'task_review' },
    { action: 'view', subject: 'profile' },
    { action: 'update', subject: 'profile' },
];

const createProfile = (
    userId: string,
    fullname: string,
    username: string,
    email: string,
    userCode: string,
    roles: UserProfile['roles'],
    permissions: PermissionRule[]
): UserProfile => ({
    userId,
    fullname,
    email,
    username,
    address: 'Demo Factory',
    phoneNumber: '0900000000',
    userCode,
    roles,
    gender: 'other',
    preferences: {
        theme: 'light',
        language: 'vi',
        avatarUrl: '',
    },
    permissions,
    accessibleFactories: [
        {
            factoryId: 1,
            factoryCode: 'DEMO-FACTORY',
            factoryName: 'Demo Factory',
            description: 'Local demo factory',
        },
    ],
});

export const DEMO_AUTH_ACCOUNTS: DemoAuthAccount[] = [
    {
        username: 'admin.demo',
        email: 'admin@demo.local',
        password: 'demo123',
        profile: createProfile(
            'demo-admin-001',
            'Demo Admin',
            'admin.demo',
            'admin@demo.local',
            'ADM-DEMO',
            ['admin'],
            adminPermissions
        ),
    },
    {
        username: 'manager.demo',
        email: 'manager@demo.local',
        password: 'demo123',
        profile: createProfile(
            'demo-manager-001',
            'Demo Manager',
            'manager.demo',
            'manager@demo.local',
            'MGR-DEMO',
            ['manager'],
            managerPermissions
        ),
    },
    {
        username: 'operator.demo',
        email: 'operator@demo.local',
        password: 'demo123',
        profile: createProfile(
            'demo-operator-001',
            'Demo Operator',
            'operator.demo',
            'operator@demo.local',
            'OP-DEMO',
            ['operator'],
            operatorPermissions
        ),
    },
    {
        username: 'qc.demo',
        email: 'qc@demo.local',
        password: 'demo123',
        profile: createProfile(
            'demo-qc-001',
            'Demo QC Staff',
            'qc.demo',
            'qc@demo.local',
            'QC-DEMO',
            ['qc_staff'],
            qcPermissions
        ),
    },
    {
        username: 'maintenance.demo',
        email: 'maintenance@demo.local',
        password: 'demo123',
        profile: createProfile(
            'demo-maintenance-001',
            'Demo Technician',
            'maintenance.demo',
            'maintenance@demo.local',
            'MNT-DEMO',
            ['maintenance'],
            maintenancePermissions
        ),
    },
];
