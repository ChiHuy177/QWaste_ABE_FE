'use client';

import { createContext, useContext, useMemo } from 'react';
import { createContextualCan } from '@casl/react';
import { createMongoAbility } from '@casl/ability';
import { useAuth } from './AuthContext';
import { defineAbilityFor } from '@/configs/permissions/defineAbility';
import { AppAbility } from '@/configs/permissions/caslAbility';
import { AccountRole } from '@/types';
import { USE_MOCK_PERMISSIONS, getPermissionsForRoles } from '@/configs/mockData/permissions';
import { convertApiPermissions } from '@/configs/permissions/permissionParser';

const defaultAbility = createMongoAbility() as AppAbility;

const AbilityContext = createContext<AppAbility>(defaultAbility);

export const Can = createContextualCan(AbilityContext.Consumer);
export type { AppAbility };

export function AbilityProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    const ability = useMemo(() => {
        if (!user?.roles || user.roles.length === 0) {
            return defaultAbility;
        }

        const validRoles = user.roles.filter((role) =>
            [
                'super_admin',
                'admin',
                'director',
                'manager',
                'planner',
                'operator',
                'qc_staff',
                'maintenance',
                'client',
                'op',
                'qc',
            ].includes(role.toLowerCase())
        );

        if (validRoles.length === 0) {
            return defaultAbility;
        }

        const normalizeRole = user.roles.map((role) => role.toLowerCase() as AccountRole);

        const finalPermissions = user.allTypePermissions?.finalPermissions;
        if (finalPermissions && finalPermissions.length > 0) {
            const permissions = convertApiPermissions(finalPermissions);
            return defineAbilityFor(normalizeRole, permissions);
        }

        if (user.permissions && user.permissions.length > 0) {
            return defineAbilityFor(normalizeRole, user.permissions);
        }

        if (USE_MOCK_PERMISSIONS) {
            const mockPermissions = getPermissionsForRoles(normalizeRole);
            if (mockPermissions && mockPermissions.length > 0) {
                return defineAbilityFor(normalizeRole, mockPermissions);
            }
        }

        return defineAbilityFor(normalizeRole);
    }, [user?.roles, user?.permissions, user?.allTypePermissions]);

    return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

export function useAbility(): AppAbility {
    return useContext(AbilityContext);
}
