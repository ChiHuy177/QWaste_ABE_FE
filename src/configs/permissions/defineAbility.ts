import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { AccountRole, PermissionRule } from '@/types/User';
import { Action, Subject, AppAbility } from './caslAbility';

export function defineAbilityFor(roles: AccountRole[], permissions?: PermissionRule[]): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    const normalizedRoles = roles.map((role) => role.toLowerCase());

    if (permissions && permissions.length > 0) {
        const hasManageAll = permissions.some(
            (rule) => rule.action === 'manage' && rule.subject === 'all'
        );

        if (hasManageAll) {
            can('manage', 'all');
            return build();
        } else {
            permissions.forEach((rule) => {
                can(rule.action, rule.subject, rule.conditions);
            });
        }
    }

    // Fallback to role-based permissions if no custom permissions
    const hasAdminRole = normalizedRoles.some((role) => role === 'admin' || role === 'super_admin');

    if (hasAdminRole) {
        can('manage', 'all');
        return build();
    }

    // Base permissions for all authenticated roles
    can(['view', 'update'], 'profile');

    // Grant access to process, staff, tasks, and error_management for all authenticated users
    can('view', ['process', 'staff', 'tasks', 'production_monitor', 'error_management']);
    can(['create', 'update'], 'error_management');

    normalizedRoles.forEach((normalizedRole) => {
        switch (normalizedRole) {
            case 'planner':
                can('view', [
                    'machine',
                    'mold',
                    'operation_type',
                    'space_level',
                    'space',
                    'step',
                    'standard_step',
                    'industry_filter',
                    'energy',
                    'machine_monitoring',
                    'machine_operator_history',
                    'space_monitoring',
                    'machine_overview',
                    'production_monitor',
                    'production_plan',
                    'work_calendar',
                ]);
                can('view', 'space_monitoring');
                can('view', 'machine_overview');
                can('view', 'production_monitor');
                can(['view', 'create', 'update', 'delete', 'manage'], 'work_calendar');
                can(['view', 'create', 'update', 'delete', 'manage'], 'production_plan');
                break;

            case 'director':
            case 'manager':
                can('view', [
                    'machine',
                    'machine_type',
                    'staffing',
                    'factory',
                    'zone',
                    'line',
                    'space_level',
                    'staff',
                    'group',
                    'space',
                    'energy',
                    'machine_monitoring',
                    'machine_operator_history',
                    'space_monitoring',
                    'standard_step',
                    'work_calendar',
                    'production_plan',
                ]);
                can('view', 'space_monitoring');
                can('view', 'machine_overview');
                // All 40 permissions are usually granted via API,
                // but this fallback ensures they have basic view access.
                break;

            case 'client':
                can('view', 'space_monitoring');
                break;
        }
    });

    return build();
}

export function checkAbility(
    roles: AccountRole[],
    action: Action,
    subject: Subject,
    permissions?: PermissionRule[]
): boolean {
    const ability = defineAbilityFor(roles, permissions);
    return ability.can(action, subject);
}
