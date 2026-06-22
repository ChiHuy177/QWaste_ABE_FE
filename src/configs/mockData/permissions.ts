import { PermissionRule } from '@/types/User';

export const MOCK_PERMISSIONS: Record<string, PermissionRule[]> = {
    super_admin: [{ action: 'manage', subject: 'all' }],

    admin: [{ action: 'manage', subject: 'all' }],

    director: [
        { action: 'view', subject: 'machine' },
        { action: 'view', subject: 'machine_type' },
        { action: 'view', subject: 'staffing' },
        { action: 'view', subject: 'factory' },
        { action: 'view', subject: 'zone' },
        { action: 'view', subject: 'space' },
        { action: 'view', subject: 'space_level' },
        { action: 'view', subject: 'staff' },
        { action: 'view', subject: 'group' },
        { action: 'view', subject: 'space_monitoring' },
        { action: 'view', subject: 'machine_overview' },
        { action: 'view', subject: 'profile' },
        { action: 'update', subject: 'profile' },
        { action: 'view', subject: 'energy' },
        { action: 'view', subject: 'machine_monitoring' },
        { action: 'view', subject: 'machine_operator_history' },
        { action: 'view', subject: 'standard_step' },
    ],

    client: [
        { action: 'view', subject: 'overview' },
        { action: 'view', subject: 'space_monitoring' },
        { action: 'view', subject: 'profile' },
        { action: 'update', subject: 'profile' },
    ],

    manager: [
        { action: 'view', subject: 'machine' },
        { action: 'view', subject: 'machine_type' },
        { action: 'view', subject: 'staffing' },
        { action: 'view', subject: 'factory' },
        { action: 'view', subject: 'zone' },
        { action: 'view', subject: 'space' },
        { action: 'view', subject: 'space_level' },
        { action: 'view', subject: 'staff' },
        { action: 'view', subject: 'group' },
        { action: 'view', subject: 'space_monitoring' },
        { action: 'view', subject: 'machine_overview' },
        { action: 'view', subject: 'profile' },
        { action: 'update', subject: 'profile' },
        { action: 'view', subject: 'energy' },
        { action: 'view', subject: 'machine_monitoring' },
        { action: 'view', subject: 'machine_operator_history' },
        { action: 'view', subject: 'standard_step' },
    ],

    operator: [
        { action: 'view', subject: 'profile' },
        { action: 'update', subject: 'profile' },
    ],

    qc_staff: [
        { action: 'view', subject: 'profile' },
        { action: 'update', subject: 'profile' },
    ],

    maintenance: [
        { action: 'view', subject: 'profile' },
        { action: 'update', subject: 'profile' },
    ],
};

export function getPermissionsForRoles(roles: string[]): PermissionRule[] {
    const permissionsSet = new Set<string>();
    const permissions: PermissionRule[] = [];

    roles.forEach((role) => {
        const rolePermissions = MOCK_PERMISSIONS[role.toLowerCase()];
        if (rolePermissions) {
            rolePermissions.forEach((perm) => {
                const key = `${perm.action}:${perm.subject}`;
                if (!permissionsSet.has(key)) {
                    permissionsSet.add(key);
                    permissions.push(perm);
                }
            });
        }
    });

    return permissions;
}

export function getAllSubjects(): string[] {
    const subjectsSet = new Set<string>();

    Object.values(MOCK_PERMISSIONS).forEach((permissions) => {
        permissions.forEach((perm) => {
            subjectsSet.add(perm.subject);
        });
    });

    return Array.from(subjectsSet).sort();
}

export function getAllPermissions() {
    const permissionsMap = new Map<string, any>();
    let idCounter = 1;

    // Collect all unique permissions from all roles
    Object.values(MOCK_PERMISSIONS).forEach((permissions) => {
        permissions.forEach((permision) => {
            const key = `${permision.action}:${permision.subject}`;
            if (!permissionsMap.has(key)) {
                permissionsMap.set(key, {
                    permissionId: idCounter++,
                    slug: `${permision.subject}:${permision.action}`,
                    permissionName: `${permision.action}_${permision.subject.toLowerCase()}`,
                    description: `Permission to ${permision.action} ${permision.subject}`,
                    auditMetaData: {
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        createdBy: 'System',
                        updatedBy: 'System',
                    },
                });
            }
        });
    });

    return Array.from(permissionsMap.values());
}

export const USE_MOCK_PERMISSIONS = true;
