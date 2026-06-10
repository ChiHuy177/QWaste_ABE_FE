import type { UserForPickingByRole, UserProfile, UserRolesPermissionsSummary } from '@/types/User';
import { DemoPermissionService } from '@/mockData/admin/rbac/DemoPermissionService';
import { DemoRoleService } from '@/mockData/admin/rbac/DemoRoleService';
import { DEMO_ACCESSIBLE_FACTORIES, DEMO_STAFF } from './users';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getNextUserId = () => `demo-staff-${Date.now()}`;

const accountRoleToRoleId: Record<string, number> = {
    super_admin: 1,
    admin: 1,
    director: 2,
    manager: 2,
    operator: 3,
    op: 3,
    qc_staff: 4,
    qc: 4,
    maintenance: 3,
};

const roleNameToAccountRole: Record<string, UserProfile['roles'][number]> = {
    Admin: 'admin',
    Manager: 'manager',
    Operator: 'operator',
    QC: 'qc_staff',
};

const demoUserRoleIds = new Map<string, number[]>(
    DEMO_STAFF.map((staff) => [
        staff.userId,
        Array.from(new Set(staff.roles.map((role) => accountRoleToRoleId[role] ?? 3))),
    ])
);

const demoUserGrantedPermissionIds = new Map<string, number[]>();
const demoUserDeniedPermissionIds = new Map<string, number[]>();

const findStaff = (userId: string) => {
    const staff = DEMO_STAFF.find((item) => item.userId === userId);
    if (!staff) {
        throw new Error('Demo staff was not found');
    }

    return staff;
};

const toRole = (role: unknown): UserProfile['roles'][number] => {
    if (typeof role === 'string') return role.toLowerCase() as UserProfile['roles'][number];

    const roleById: Record<number, UserProfile['roles'][number]> = {
        1: 'admin',
        2: 'director',
        3: 'manager',
        4: 'qc_staff',
        5: 'operator',
        6: 'maintenance',
    };

    return roleById[Number(role)] ?? 'operator';
};

const normalizeRoles = (roles: unknown): UserProfile['roles'] => {
    if (!roles) return ['operator'];
    if (Array.isArray(roles)) return roles.map(toRole);

    return [toRole(roles)];
};

const resolveRoleNames = async (roleIds: number[]) => {
    const roles = await DemoRoleService.getAllRoles();
    const roleById = new Map(roles.map((role) => [role.roleId, role]));

    return roleIds
        .map((roleId) => roleById.get(roleId)?.roleName)
        .filter((roleName): roleName is string => Boolean(roleName));
};

const resolvePermissionSlugs = async (permissionIds: number[]) => {
    const permissions = await DemoPermissionService.getAllPermissions();
    const permissionById = new Map(permissions.map((permission) => [permission.permissionId, permission]));

    return permissionIds
        .map((permissionId) => permissionById.get(permissionId)?.slug)
        .filter((slug): slug is string => Boolean(slug));
};

const resolveFinalPermissionSlugs = async (roleIds: number[], grantedIds: number[], deniedIds: number[]) => {
    const roles = await DemoRoleService.getAllRoles();
    const rolePermissionSlugs = roles
        .filter((role) => roleIds.includes(role.roleId))
        .flatMap((role) => role.permissions.map((permission) => permission.slug));
    const grantedSlugs = await resolvePermissionSlugs(grantedIds);
    const deniedSlugs = new Set(await resolvePermissionSlugs(deniedIds));

    return Array.from(new Set([...rolePermissionSlugs, ...grantedSlugs])).filter(
        (slug) => !deniedSlugs.has(slug)
    );
};

const syncStaffRoles = async (staff: UserProfile, roleIds: number[]) => {
    const roleNames = await resolveRoleNames(roleIds);
    staff.roles = roleNames.map((roleName) => roleNameToAccountRole[roleName] ?? 'operator');
};

const resolveFactories = (factoryIds?: number[]) => {
    if (!factoryIds || factoryIds.length === 0) return DEMO_ACCESSIBLE_FACTORIES;

    return DEMO_ACCESSIBLE_FACTORIES.filter((factory) => factoryIds.includes(factory.factoryId));
};

const touchStaff = (staff: UserProfile) => {
    staff.auditMetaData = {
        ...(staff.auditMetaData ?? {
            createdAt: new Date().toISOString(),
            createdBy: 'Demo Admin',
        }),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const toPickingUser = (staff: UserProfile): UserForPickingByRole => ({
    userId: staff.userId,
    fullname: staff.fullname,
    userCode: staff.userCode,
});

export class DemoUserService {
    static async getStaffById(userId: string): Promise<UserProfile> {
        return clone(findStaff(userId));
    }

    static async getAllStaff(): Promise<UserProfile[]> {
        return clone(DEMO_STAFF);
    }

    static async createStaff(userData: Partial<UserProfile> & { factoryIds?: number[] }): Promise<UserProfile> {
        const now = new Date().toISOString();
        const staff: UserProfile = {
            userId: getNextUserId(),
            fullname: userData.fullname ?? 'Demo Staff',
            email: userData.email ?? `staff-${Date.now()}@demo.local`,
            username: userData.username ?? `staff.${Date.now()}`,
            address: userData.address ?? 'Factory A, Demo Industrial Park',
            phoneNumber: userData.phoneNumber ?? '0900000000',
            userCode: userData.userCode ?? `S${Date.now().toString().slice(-6)}`,
            roles: normalizeRoles(userData.roles),
            gender: userData.gender ?? 'MALE',
            preferences: {
                theme: 'light',
                language: 'vi',
                avatarUrl: '',
            },
            permissions: userData.permissions ?? [],
            accessibleFactories: resolveFactories(userData.factoryIds),
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
            softDeleteMetaData: {
                deletedAt: null,
                deletedBy: null,
                isDeleted: false,
            },
        };

        DEMO_STAFF.unshift(staff);
        demoUserRoleIds.set(staff.userId, Array.from(new Set(staff.roles.map((role) => accountRoleToRoleId[role] ?? 3))));

        return clone(staff);
    }

    static async getMe(): Promise<UserProfile> {
        return clone(DEMO_STAFF[0]);
    }

    static async updateStaff(userData: UserProfile & { factoryIds?: number[] }): Promise<UserProfile> {
        const staff = findStaff(userData.userId);

        staff.fullname = userData.fullname;
        staff.email = userData.email;
        staff.address = userData.address;
        staff.phoneNumber = userData.phoneNumber;
        staff.gender = userData.gender;
        staff.roles = normalizeRoles(userData.roles);
        staff.accessibleFactories = resolveFactories(userData.factoryIds);
        touchStaff(staff);

        return clone(staff);
    }

    static async deleteStaff(userId: string): Promise<void> {
        const staff = findStaff(userId);
        staff.softDeleteMetaData = {
            deletedAt: new Date().toISOString(),
            deletedBy: 'Demo Admin',
            isDeleted: true,
        };
        touchStaff(staff);
    }

    static async restoreStaff(userId: string): Promise<void> {
        const staff = findStaff(userId);
        staff.softDeleteMetaData = {
            deletedAt: null,
            deletedBy: null,
            isDeleted: false,
        };
        touchStaff(staff);
    }

    static async getRolesAndPermissionsSummary(userId: string): Promise<UserRolesPermissionsSummary> {
        const staff = findStaff(userId);
        const roleIds = demoUserRoleIds.get(userId) ?? [];
        const grantedPermissionIds = demoUserGrantedPermissionIds.get(userId) ?? [];
        const deniedPermissionIds = demoUserDeniedPermissionIds.get(userId) ?? [];
        const [roles, grantedPermissions, deniedPermissions, finalPermissions] = await Promise.all([
            resolveRoleNames(roleIds),
            resolvePermissionSlugs(grantedPermissionIds),
            resolvePermissionSlugs(deniedPermissionIds),
            resolveFinalPermissionSlugs(roleIds, grantedPermissionIds, deniedPermissionIds),
        ]);

        return clone({
            userId: staff.userId,
            fullname: staff.fullname,
            email: staff.email,
            username: staff.username,
            address: staff.address,
            phoneNumber: staff.phoneNumber,
            userCode: staff.userCode,
            roles,
            allTypePermissions: {
                grantedPermissions,
                deniedPermissions,
                finalPermissions,
            },
        });
    }

    static async updateRolesAndPermissions(data: {
        userId: string;
        roleIds: number[];
        deniedPermissionIds: number[];
        grantedPermissionIds: number[];
    }): Promise<void> {
        const staff = findStaff(data.userId);
        demoUserRoleIds.set(data.userId, data.roleIds);
        demoUserGrantedPermissionIds.set(data.userId, data.grantedPermissionIds);
        demoUserDeniedPermissionIds.set(data.userId, data.deniedPermissionIds);
        await syncStaffRoles(staff, data.roleIds);
        const [grantedPermissions, deniedPermissions, finalPermissions] = await Promise.all([
            resolvePermissionSlugs(data.grantedPermissionIds),
            resolvePermissionSlugs(data.deniedPermissionIds),
            resolveFinalPermissionSlugs(
                data.roleIds,
                data.grantedPermissionIds,
                data.deniedPermissionIds
            ),
        ]);
        staff.allTypePermissions = {
            grantedPermissions,
            deniedPermissions,
            finalPermissions,
        };
        touchStaff(staff);
    }

    static async getOperators(): Promise<UserProfile[]> {
        return clone(
            DEMO_STAFF.filter(
                (staff) =>
                    !staff.softDeleteMetaData?.isDeleted &&
                    (staff.roles.includes('operator') || staff.roles.includes('op'))
            )
        );
    }

    static async getUsersByRole(roleName: string): Promise<UserForPickingByRole[]> {
        const normalizedRole = roleName.toLowerCase();

        return clone(
            DEMO_STAFF.filter(
                (staff) =>
                    !staff.softDeleteMetaData?.isDeleted &&
                    staff.roles.some((role) => role.toLowerCase().includes(normalizedRole))
            ).map(toPickingUser)
        );
    }
}
