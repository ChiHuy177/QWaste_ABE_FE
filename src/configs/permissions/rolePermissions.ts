import { AccountRole, PermissionRule } from '@/types/User';

/**
 * Single source of truth for what a role is granted when the backend does not
 * return explicit permissions (`allTypePermissions`/`permissions`) for the
 * current user. Used both as the real fallback in `defineAbility.ts` and as
 * the mock/dev data source in `AbilityContext` — there is only one table.
 */

const BASE_PERMISSIONS: PermissionRule[] = [
    { action: 'view', subject: 'profile' },
    { action: 'update', subject: 'profile' },
    { action: 'view', subject: 'process' },
    { action: 'view', subject: 'staff' },
    { action: 'view', subject: 'tasks' },
    { action: 'view', subject: 'production_monitor' },
];

const MANAGEMENT_PERMISSIONS: PermissionRule[] = [
    { action: 'view', subject: 'machine' },
    { action: 'view', subject: 'machine_type' },
    { action: 'view', subject: 'staffing' },
    { action: 'view', subject: 'factory' },
    { action: 'view', subject: 'zone' },
    { action: 'view', subject: 'line' },
    { action: 'view', subject: 'space_level' },
    { action: 'view', subject: 'staff' },
    { action: 'view', subject: 'group' },
    { action: 'view', subject: 'space' },
    { action: 'view', subject: 'energy' },
    { action: 'view', subject: 'machine_monitoring' },
    { action: 'view', subject: 'machine_operator_history' },
    { action: 'view', subject: 'space_monitoring' },
    { action: 'view', subject: 'standard_step' },
    { action: 'view', subject: 'work_calendar' },
    { action: 'view', subject: 'production_plan' },
    { action: 'view', subject: 'machine_overview' },
];

const PLANNER_PERMISSIONS: PermissionRule[] = [
    { action: 'view', subject: 'machine' },
    { action: 'view', subject: 'mold' },
    { action: 'view', subject: 'operation_type' },
    { action: 'view', subject: 'space_level' },
    { action: 'view', subject: 'space' },
    { action: 'view', subject: 'step' },
    { action: 'view', subject: 'standard_step' },
    { action: 'view', subject: 'industry_filter' },
    { action: 'view', subject: 'energy' },
    { action: 'view', subject: 'machine_monitoring' },
    { action: 'view', subject: 'machine_operator_history' },
    { action: 'view', subject: 'space_monitoring' },
    { action: 'view', subject: 'machine_overview' },
    { action: 'view', subject: 'production_monitor' },
    { action: 'view', subject: 'production_plan' },
    { action: 'create', subject: 'production_plan' },
    { action: 'update', subject: 'production_plan' },
    { action: 'delete', subject: 'production_plan' },
    { action: 'manage', subject: 'production_plan' },
    { action: 'view', subject: 'work_calendar' },
    { action: 'create', subject: 'work_calendar' },
    { action: 'update', subject: 'work_calendar' },
    { action: 'delete', subject: 'work_calendar' },
    { action: 'manage', subject: 'work_calendar' },
];

const CLIENT_PERMISSIONS: PermissionRule[] = [{ action: 'view', subject: 'space_monitoring' }];

const ROLE_PERMISSIONS: Partial<Record<AccountRole, PermissionRule[]>> = {
    director: MANAGEMENT_PERMISSIONS,
    manager: MANAGEMENT_PERMISSIONS,
    planner: PLANNER_PERMISSIONS,
    client: CLIENT_PERMISSIONS,
};

export function getDefaultPermissionsForRoles(roles: AccountRole[]): PermissionRule[] {
    const normalizedRoles = roles.map((role) => role.toLowerCase() as AccountRole);

    if (normalizedRoles.some((role) => role === 'admin' || role === 'super_admin')) {
        return [{ action: 'manage', subject: 'all' }];
    }

    const merged = new Map<string, PermissionRule>();
    BASE_PERMISSIONS.forEach((rule) => merged.set(`${rule.action}:${rule.subject}`, rule));
    normalizedRoles.forEach((role) => {
        (ROLE_PERMISSIONS[role] ?? []).forEach((rule) =>
            merged.set(`${rule.action}:${rule.subject}`, rule)
        );
    });

    return Array.from(merged.values());
}
