import { Action, Subject } from './caslAbility';
import { PermissionRule } from '@/types/User';

export function parsePermissionString(permission: string): PermissionRule | null {
    if (permission === 'sa:all') {
        return {
            subject: 'all' as Subject,
            action: 'manage' as Action,
        };
    }

    const parts = permission.split(':');
    if (parts.length !== 2) return null;

    const [subject, action] = parts;
    if (!subject || !action) return null;

    // Validate action
    const validActions: Action[] = [
        'view',
        'create',
        'update',
        'delete',
        'manage',
        'restore',
        'overview_view',
        'store',
        'update_sensitive',
        'update_info',
        'update_plan',
        'confirm',
        'cancel',
        'operator_view',
        'manager_review_view',
        'decline',
    ];
    if (!validActions.includes(action as Action)) return null;

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
