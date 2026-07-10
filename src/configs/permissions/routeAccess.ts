import { Action, Subject, AppAbility } from './caslAbility';

export interface RouteConfig {
    subject: Subject;
    action: Action;
}

// Routes accessible to all authenticated users without permission check
export const PUBLIC_ROUTES: string[] = [];

export const ROUTE_ACCESS: Record<string, RouteConfig> = {
    // Categories
    '/admin/categories/machineList': {
        subject: 'machine',
        action: 'view',
    },
    '/admin/categories/machineStaffing': {
        subject: 'staffing',
        action: 'view',
    },
    '/admin/categories/factory': {
        subject: 'factory',
        action: 'view',
    },
    '/admin/categories/zone': {
        subject: 'zone',
        action: 'view',
    },
    '/admin/categories/line': {
        subject: 'line',
        action: 'view',
    },
    '/admin/categories/staffList': {
        subject: 'staff',
        action: 'view',
    },
    '/admin/categories/space': {
        subject: 'space',
        action: 'view',
    },
    '/admin/categories/spaceLevel': {
        subject: 'space_level',
        action: 'view',
    },
    '/admin/categories/mold': {
        subject: 'mold',
        action: 'view',
    },
    '/admin/categories/step': {
        subject: 'step',
        action: 'view',
    },
    '/admin/setting': {
        subject: 'profile',
        action: 'view',
    },

    // Space monitoring
    '/admin/space-monitoring': {
        subject: 'space_monitoring',
        action: 'view',
    },

    '/admin/floor-map': {
        subject: 'floor_map',
        action: 'update',
    },

    // Machines
    '/admin/machines': {
        subject: 'machine_overview',
        action: 'view',
    },

    // RBAC Management
    '/admin/rbac/users': {
        subject: 'user',
        action: 'view',
    },
    '/admin/rbac/roles': {
        subject: 'role',
        action: 'view',
    },
    '/admin/rbac/permissions': {
        subject: 'permission',
        action: 'view',
    },

    // Manager
    '/manager/review-dashboard': {
        subject: 'manager_reviews',
        action: 'view',
    },

    // QC
    '/qc': {
        subject: 'qc_dashboard',
        action: 'view',
    },

    // Process Management
    '/admin/process': {
        subject: 'process',
        action: 'view',
    },

    // Tasks Management
    '/admin/tasks': {
        subject: 'tasks',
        action: 'view',
    },
    '/admin/production-plan': {
        subject: 'product',
        action: 'view',
    },
    '/admin/production-plan/monitor': {
        subject: 'production_monitor',
        action: 'view',
    },
};

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
        return ability.can(exactMatch.action, exactMatch.subject);
    }

    const sortedRoutes = Object.entries(ROUTE_ACCESS).sort(([a], [b]) => b.length - a.length);
    const routeConfig = sortedRoutes.find(([configRoute]) => route.startsWith(configRoute));

    if (!routeConfig) {
        return false;
    }

    const [, config] = routeConfig;
    return ability.can(config.action, config.subject);
}

export function getRouteConfig(route: string): RouteConfig | undefined {
    const entry = Object.entries(ROUTE_ACCESS).find(
        ([configRoute]) => route === configRoute || route.startsWith(configRoute)
    );
    return entry?.[1];
}
