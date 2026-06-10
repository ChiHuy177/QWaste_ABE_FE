'use client';

import { useAbility } from '@/contexts/AbilityContext';
import { useError } from '@/contexts/ErrorContext';
import { Action, Subject } from '@/configs/permissions/caslAbility';
import { useCallback } from 'react';

export function usePermissionCheck() {
    const ability = useAbility();
    const { setError403FromPermission } = useError();

    const checkPermission = useCallback(
        (action: Action, subject: Subject, options?: { showError?: boolean }): boolean => {
            const hasPermission = ability.can(action, subject);

            if (!hasPermission && options?.showError !== false) {
                setError403FromPermission(subject, action);
            }

            return hasPermission;
        },
        [ability, setError403FromPermission]
    );

    const checkPermissionSilent = useCallback(
        (action: Action, subject: Subject): boolean => {
            return ability.can(action, subject);
        },
        [ability]
    );

    return {
        checkPermission,
        checkPermissionSilent,
        can: ability.can.bind(ability),
        cannot: ability.cannot.bind(ability),
    };
}
