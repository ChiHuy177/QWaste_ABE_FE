import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { AccountRole, PermissionRule } from '@/types/User';
import { Action, Subject, AppAbility } from './caslAbility';

/**
 * Module-level constants to avoid object allocation on every render/check
 */
export const CATEGORY_SUBJECTS: Subject[] = [
    'machine',
    'machine_type',
    'mold',
    'operation_type',
    'staffing',
    'factory',
    'zone',
    'line',
    'space',
    'space_level',
    'step',
    'staff',
    'group',
    'industry_filter',
];

const MUTATION_ACTIONS: Action[] = [
    'create',
    'update',
    'delete',
    'manage',
    'restore',
    'store',
    'update_sensitive',
    'import',
];

const RBAC_SUBJECTS: Subject[] = ['user', 'role', 'permission'];

export function defineAbilityFor(roles: AccountRole[], permissions?: PermissionRule[]): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    const normalizedRoles = roles.map((role) => role.toLowerCase());

    // 1. Early exit for Admin / Super Admin
    if (normalizedRoles.some((role) => role === 'admin' || role === 'super_admin')) {
        can('manage', 'all');
        return build();
    }

    // 2. Base permissions for all authenticated roles
    can(['view', 'update'], 'profile');

    // 3. Role-based standard permissions
    normalizedRoles.forEach((normalizedRole) => {
        switch (normalizedRole) {
            case 'planner':
                can('manage', 'all');

                cannot(MUTATION_ACTIONS, RBAC_SUBJECTS);

                cannot(MUTATION_ACTIONS, CATEGORY_SUBJECTS);
                can('view', CATEGORY_SUBJECTS);
                break;

            case 'director':
            case 'manager':
                can('view', [
                    ...CATEGORY_SUBJECTS,
                    'energy',
                    'machine_monitoring',
                    'machine_operator_history',
                    'space_monitoring',
                    'standard_step',
                    'machine_overview',
                    'process',
                    'staff',
                    'tasks',
                    'production_monitor',
                    'work_calendar',
                    'production_plan',
                ]);
                break;

            case 'client':
                can('view', 'space_monitoring');
                break;
        }
    });

    // 4. Custom permissions from API (if present)
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
    }

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
