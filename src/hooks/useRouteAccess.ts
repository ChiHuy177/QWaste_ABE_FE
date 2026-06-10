'use client';

import { useAuth } from '@/contexts/AuthContext';
import { hasRouteAccessWithAbility } from '@/configs/permissions/routeAccess';
import { useAbility } from '@/contexts/AbilityContext';

export function useRouteAccess() {
    const { user } = useAuth();
    const ability = useAbility();

    const canAccessRoute = (route: string): boolean => {
        if (!user?.roles || user.roles.length === 0) {
            return false;
        }

        return hasRouteAccessWithAbility(route, ability);
    };

    return {
        canAccessRoute,
        userRoles: user?.roles || [],
    };
}
