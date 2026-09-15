import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { AccountRole, PermissionRule } from '@/types/User';
import { Action, Subject, AppAbility } from './caslAbility';
import { getDefaultPermissionsForRoles } from './rolePermissions';

export function defineAbilityFor(roles: AccountRole[], permissions?: PermissionRule[]): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

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

        // Backend permissions are the source of truth here — no role-based
        // patching on top of them.
        return build();
    }

    // No permissions from the backend: fall back to role defaults.
    getDefaultPermissionsForRoles(roles).forEach((rule) => {
        can(rule.action, rule.subject, rule.conditions);
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
