import type { Role } from '@/types/Role';
import { DemoPermissionService } from './DemoPermissionService';
import { MOCK_RBAC_PERMISSIONS } from './permissions';

type RoleDraft = {
    roleId: number;
    roleName: string;
    description?: string;
    permissionIds: number[];
    auditMetaData: Role['auditMetaData'];
};

type RoleUpdatePayload = Pick<Role, 'roleId' | 'description' | 'permissionIds'>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const getPermissionIdsBySlugs = (slugs: string[]) =>
    MOCK_RBAC_PERMISSIONS.filter((permission) => slugs.includes(permission.slug))
        .map((permission) => permission.permissionId)
        .filter((permissionId): permissionId is number => permissionId !== undefined);

const demoRoles: RoleDraft[] = [
    {
        roleId: 1,
        roleName: 'Admin',
        description: 'Full demo access for administrators',
        permissionIds: MOCK_RBAC_PERMISSIONS.map((permission) => permission.permissionId).filter(
            (permissionId): permissionId is number => permissionId !== undefined
        ),
        auditMetaData,
    },
    {
        roleId: 2,
        roleName: 'Manager',
        description: 'Manage orders, machines, dashboard, and staff review workflows',
        permissionIds: getPermissionIdsBySlugs([
            'overview:view',
            'factory_overview:view',
            'machine:view',
            'machine:update',
            'order:view',
            'order:create',
            'order:update',
            'order:confirm',
            'order:cancel',
            'drawing_code:view',
            'step:view',
            'staff:view',
            'user:view',
        ]),
        auditMetaData,
    },
    {
        roleId: 3,
        roleName: 'Operator',
        description: 'Operate assigned tasks and submit operator reviews',
        permissionIds: getPermissionIdsBySlugs([
            'operator_dashboard:view',
            'operator_reviews:view',
            'order:operator_view',
            'task_review:confirm',
            'task_review:decline',
        ]),
        auditMetaData,
    },
    {
        roleId: 4,
        roleName: 'QC',
        description: 'Quality control role for reviewing task results',
        permissionIds: getPermissionIdsBySlugs([
            'operator_reviews:view',
            'order:manager_review_view',
            'task_review:confirm',
            'task_review:decline',
            'drawing_code:view',
        ]),
        auditMetaData,
    },
];

const getNextRoleId = () => Math.max(...demoRoles.map((role) => role.roleId), 0) + 1;

const findRole = (roleId: number) => {
    const role = demoRoles.find((item) => item.roleId === roleId);
    if (!role) {
        throw new Error('Demo role was not found');
    }

    return role;
};

const touchRole = (role: RoleDraft) => {
    role.auditMetaData = {
        ...role.auditMetaData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const toRole = async (role: RoleDraft): Promise<Role> => {
    const permissions = await DemoPermissionService.getAllPermissions();
    const permissionById = new Map(permissions.map((permission) => [permission.permissionId, permission]));
    const resolvedPermissions = role.permissionIds
        .map((permissionId) => permissionById.get(permissionId))
        .filter((permission): permission is NonNullable<typeof permission> => permission !== undefined)
        .map((permission) => ({
            permissionId: permission.permissionId!,
            slug: permission.slug,
            permissionName: permission.permissionName,
            description: permission.description,
        }));

    return {
        roleId: role.roleId,
        roleName: role.roleName,
        description: role.description,
        permissions: resolvedPermissions,
        permissionIds: role.permissionIds,
        auditMetaData: role.auditMetaData,
    };
};

export class DemoRoleService {
    static async getAllRoles(): Promise<Role[]> {
        const roles = await Promise.all(
            [...demoRoles]
                .sort((left, right) => left.roleId - right.roleId)
                .map((role) => toRole(role))
        );

        return clone(roles);
    }

    static async getRolesForPicking(): Promise<Role[]> {
        return DemoRoleService.getAllRoles();
    }

    static async getRoleById(roleId: number): Promise<Role> {
        return clone(await toRole(findRole(roleId)));
    }

    static async createRole(roleData: Partial<Role>): Promise<Role> {
        if (!roleData.roleName) {
            throw new Error('Demo role name is required');
        }

        const role: RoleDraft = {
            roleId: getNextRoleId(),
            roleName: roleData.roleName,
            description: roleData.description,
            permissionIds: roleData.permissionIds ?? [],
            auditMetaData: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };

        demoRoles.push(role);

        return clone(await toRole(role));
    }

    static async updateRole(roleData: RoleUpdatePayload): Promise<Role> {
        const role = findRole(roleData.roleId);

        role.description = roleData.description;
        role.permissionIds = roleData.permissionIds ?? [];
        touchRole(role);

        return clone(await toRole(role));
    }

    static async deleteRole(roleId: number): Promise<void> {
        const targetIndex = demoRoles.findIndex((role) => role.roleId === roleId);
        if (targetIndex === -1) {
            throw new Error('Demo role was not found');
        }

        demoRoles.splice(targetIndex, 1);
    }
}
