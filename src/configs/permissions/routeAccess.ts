import { Action, Subject, AppAbility } from './caslAbility';
import { PERMISSION_REGISTRY } from './permissionRegistry';

export interface RouteConfig {
    subject: Subject;
    action: Action;
    /** OR-condition: route is also accessible if ability grants this action on the same subject. */
    alternativeAction?: Action;
    alwaysAllow?: boolean;
}

// Routes accessible to all authenticated users without permission check
export const PUBLIC_ROUTES: string[] = [];

/**
 * Route -> required (subject, action) map, derived from PERMISSION_REGISTRY.
 * PERMISSION_REGISTRY.routes is the single source of truth for route ownership;
 * do not hand-maintain a separate route table here.
 */
export const ROUTE_ACCESS: Record<string, RouteConfig> = Object.fromEntries(
    PERMISSION_REGISTRY.flatMap((permission) =>
        permission.routes.map((route) => [
            route,
            {
                subject: permission.subject,
                action: permission.action,
                alternativeAction: permission.alternativeAction,
                alwaysAllow: permission.alwaysShowInMenu,
            },
        ])
    )
);

const DEFAULT_ROUTE_PRIORITY: string[] = [
    '/admin/space-monitoring',
    '/admin/machines',
    '/qc',
    '/admin/categories/machineList',
    '/admin/categories/spaceLevel',
    '/admin/rbac/users',
];

export function getDefaultRoute(ability: AppAbility): string {
    for (const route of DEFAULT_ROUTE_PRIORITY) {
        if (hasRouteAccessWithAbility(route, ability)) {
            return route;
        }
    }
    // Fallback to the primary admin route.
    return '/admin/space-monitoring';
}

export function hasRouteAccessWithAbility(route: string, ability: AppAbility): boolean {
    // Allow access to public routes without permission check (including child routes)
    if (
        PUBLIC_ROUTES.some(
            (publicRoute) => route === publicRoute || route.startsWith(publicRoute + '/')
        )
    ) {
        return true;
    }

    const exactMatch = ROUTE_ACCESS[route];
    if (exactMatch) {
        return canAccessWithConfig(ability, exactMatch);
    }

    const sortedRoutes = Object.entries(ROUTE_ACCESS).sort(([a], [b]) => b.length - a.length);
    const routeConfig = sortedRoutes.find(([configRoute]) => route.startsWith(configRoute));

    if (!routeConfig) {
        return false;
    }

    const [, config] = routeConfig;
    return canAccessWithConfig(ability, config);
}

function canAccessWithConfig(ability: AppAbility, config: RouteConfig): boolean {
    if (config.alwaysAllow) return true;
    if (ability.can(config.action, config.subject)) return true;
    if (config.alternativeAction && ability.can(config.alternativeAction, config.subject)) {
        return true;
    }
    return false;
}

export function getRouteConfig(route: string): RouteConfig | undefined {
    const entry = Object.entries(ROUTE_ACCESS).find(
        ([configRoute]) => route === configRoute || route.startsWith(configRoute)
    );
    return entry?.[1];
}
