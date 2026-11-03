import { ACTIONS, Action, Subject } from './caslAbility';
import { PermissionRule } from '@/types/User';

/**
 * Slug cũ của BE -> slug canonical. BE từng cấp create/import của kế hoạch sản xuất
 * trên subject 'product'; FE giờ chỉ dùng 'production_plan', nên map một chiều ở đây
 * để cả slug cũ lẫn mới đều ra cùng một quyền.
 */
const LEGACY_SLUG_ALIASES: Record<string, string> = {
    'product:create': 'production_plan:create',
    'product:import': 'production_plan:import',
};

export function parsePermissionString(permission: string): PermissionRule | null {
    if (permission === 'sa:all') {
        return {
            subject: 'all' as Subject,
            action: 'manage' as Action,
        };
    }

    const normalized = LEGACY_SLUG_ALIASES[permission] ?? permission;

    const parts = normalized.split(':');
    if (parts.length !== 2) return null;

    const [subject, action] = parts;
    if (!subject || !action) return null;

    if (!ACTIONS.includes(action as Action)) return null;

    return {
        subject: subject as Subject,
        action: action as Action,
    };
}

export function convertApiPermissions(finalPermissions: string[]): PermissionRule[] {
    return finalPermissions
        .map(parsePermissionString)
        .filter((rule): rule is PermissionRule => rule !== null);
}

export function hasPermission(
    finalPermissions: string[],
    subject: string,
    action: string
): boolean {
    return finalPermissions.includes(`${subject}:${action}`);
}

export function getActionsForSubject(finalPermissions: string[], subject: string): Action[] {
    return finalPermissions
        .filter((perm) => perm.startsWith(`${subject}:`))
        .map((perm) => perm.split(':')[1] as Action);
}

export function getSubjectsFromPermissions(finalPermissions: string[]): string[] {
    const subjects = new Set<string>();
    finalPermissions.forEach((perm) => {
        const [subject] = perm.split(':');
        if (subject) subjects.add(subject);
    });
    return Array.from(subjects);
}
