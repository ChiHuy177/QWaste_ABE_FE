import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { AccountRole, PermissionRule } from '@/types/User';
import { Action, Subject, AppAbility } from './caslAbility';

export function defineAbilityFor(roles: AccountRole[], permissions?: PermissionRule[]): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    const normalizedRoles = roles.map((role) => role.toLowerCase());
    const hasOperatorRole = normalizedRoles.some((role) => role === 'operator' || role === 'op');

    if (permissions && permissions.length > 0) {
        const hasManageAll = permissions.some(
            (rule) => rule.action === 'manage' && rule.subject === 'all'
        );

        if (hasManageAll) {
            can('manage', 'all');
        } else {
            permissions.forEach((rule) => {
                can(rule.action, rule.subject, rule.conditions);
            });
        }

        if (hasOperatorRole) {
            can('view', ['operator_dashboard', 'operator_reviews']);
        }

        return build();
    }

    // Fallback to role-based permissions if no custom permissions
    const hasAdminRole = normalizedRoles.some((role) => role === 'admin' || role === 'super_admin');

    if (hasAdminRole) {
        can('manage', 'all');
        return build();
    }

    // Base permissions for all authenticated roles
    can(['view', 'update'], 'profile');

    // Grant access to process, staff, and tasks for all authenticated users
    can('view', ['process', 'staff', 'tasks', 'drawing_code']);

    normalizedRoles.forEach((normalizedRole) => {
        switch (normalizedRole) {
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
                    'drawing_code',
                    'energy',
                    'machine_monitoring',
                    'machine_operator_history',
                    'task_review',
                    'space_monitoring',
                    'floor_map',
                    'standard_step',
                ]);
                can('view', 'space_monitoring');
                can('view', 'machine_overview');
                // All 40 permissions are usually granted via API,
                // but this fallback ensures they have basic view access.
                break;

            case 'operator':
            case 'op':
            case 'qc_staff':
            case 'qc':
            case 'maintenance':
                can(['confirm', 'decline'], 'task_review');
                if (normalizedRole === 'operator' || normalizedRole === 'op') {
                    can('view', ['operator_dashboard', 'operator_reviews']);
                }
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
