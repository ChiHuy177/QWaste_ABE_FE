import { UserPermission } from '@/types/User';

export const MOCK_USER_PERMISSIONS: UserPermission[] = [
    // User with extra permission granted
    {
        userPermissionId: 1,
        userId: 'user-001',
        permissionId: 1, // create_factory
        permissionType: 'grant',
        reason: 'Temporary access for Q1 2024 factory expansion project',
        grantedBy: 'admin-001',
        grantedByName: 'Super Admin',
        createdAt: '2024-01-20T10:00:00Z',
    },
    // User with permission denied
    {
        userPermissionId: 2,
        userId: 'user-002',
        permissionId: 4, // delete_factory
        permissionType: 'deny',
        reason: 'Safety restriction - prevent accidental deletion during training period',
        grantedBy: 'admin-001',
        grantedByName: 'Super Admin',
        createdAt: '2024-01-21T14:30:00Z',
    },
    // Another grant example
    {
        userPermissionId: 3,
        userId: 'user-003',
        permissionId: 19, // create_staff
        permissionType: 'grant',
        reason: 'HR coordinator role - needs to create staff accounts',
        grantedBy: 'admin-001',
        grantedByName: 'Super Admin',
        createdAt: '2024-01-25T09:15:00Z',
    },
];

// Helper to get user permissions by userId
export const getUserPermissionsByUserId = (userId: string): UserPermission[] => {
    return MOCK_USER_PERMISSIONS.filter((up) => up.userId === userId);
};
