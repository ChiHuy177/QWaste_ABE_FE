import { Action, Subject } from './caslAbility';

export interface PermissionConfig {
    slug: `${Subject}:${Action}`;
    subject: Subject;
    action: Action;
    routes: string[];
    menuKey?: string;
    description: string;
}

/**
 * Central registry of all permissions and their associated routes/menus
 * This allows easy management and lookup of permission-route mappings
 */
export const PERMISSION_REGISTRY: PermissionConfig[] = [
    // User Management
    {
        slug: 'user:view',
        subject: 'user',
        action: 'view',
        routes: ['/admin/rbac/users'],
        menuKey: 'rbac-users',
        description: 'View user list',
    },
    {
        slug: 'user:create',
        subject: 'user',
        action: 'create',
        routes: ['/admin/rbac/users/create'],
        description: 'Create new user',
    },
    {
        slug: 'user:update',
        subject: 'user',
        action: 'update',
        routes: ['/admin/rbac/users/[id]', '/admin/rbac/users/[id]/edit'],
        description: 'Edit user',
    },
    {
        slug: 'user:delete',
        subject: 'user',
        action: 'delete',
        routes: [],
        description: 'Delete user',
    },

    // Role Management
    {
        slug: 'role:view',
        subject: 'role',
        action: 'view',
        routes: ['/admin/rbac/roles'],
        menuKey: 'rbac-roles',
        description: 'View roles',
    },
    {
        slug: 'role:create',
        subject: 'role',
        action: 'create',
        routes: ['/admin/rbac/roles/create'],
        description: 'Create new role',
    },
    {
        slug: 'role:update',
        subject: 'role',
        action: 'update',
        routes: ['/admin/rbac/roles/[id]', '/admin/rbac/roles/[id]/edit'],
        description: 'Edit role',
    },
    {
        slug: 'role:delete',
        subject: 'role',
        action: 'delete',
        routes: [],
        description: 'Delete role',
    },

    // Permission Management
    {
        slug: 'permission:view',
        subject: 'permission',
        action: 'view',
        routes: ['/admin/rbac/permissions'],
        menuKey: 'rbac-permissions',
        description: 'View permissions',
    },
    {
        slug: 'permission:create',
        subject: 'permission',
        action: 'create',
        routes: ['/admin/rbac/permissions/create'],
        description: 'Create new permission',
    },
    {
        slug: 'permission:update',
        subject: 'permission',
        action: 'update',
        routes: ['/admin/rbac/permissions/[id]'],
        description: 'Edit permission',
    },
    {
        slug: 'permission:delete',
        subject: 'permission',
        action: 'delete',
        routes: [],
        description: 'Delete permission',
    },

    // Space Monitoring
    {
        slug: 'space_monitoring:view',
        subject: 'space_monitoring',
        action: 'view',
        routes: ['/admin/space-monitoring'],
        menuKey: 'space-monitoring',
        description: 'View space monitoring',
    },
    // Production Monitor
    {
        slug: 'production_monitor:view',
        subject: 'production_monitor',
        action: 'view',
        routes: ['/admin/production-plan/monitor'],
        menuKey: 'production-plan-monitor',
        description: 'View production plan monitor',
    },

    // Machine List
    {
        slug: 'machine:view',
        subject: 'machine',
        action: 'view',
        routes: ['/admin/categories/machineList'],
        menuKey: 'machine-list',
        description: 'View machine list',
    },
    {
        slug: 'machine:create',
        subject: 'machine',
        action: 'create',
        routes: [],
        description: 'Create machine',
    },
    {
        slug: 'machine:update',
        subject: 'machine',
        action: 'update',
        routes: [],
        description: 'Update machine',
    },
    {
        slug: 'machine:delete',
        subject: 'machine',
        action: 'delete',
        routes: [],
        description: 'Delete machine',
    },

    // Machine Type
    {
        slug: 'machine_type:view',
        subject: 'machine_type',
        action: 'view',
        routes: ['/admin/categories/machineType'],
        menuKey: 'machine-type',
        description: 'View machine types',
    },
    {
        slug: 'machine_type:create',
        subject: 'machine_type',
        action: 'create',
        routes: ['/admin/categories/machineType/create'],
        description: 'Create machine type',
    },
    {
        slug: 'machine_type:update',
        subject: 'machine_type',
        action: 'update',
        routes: ['/admin/categories/machineType/[id]', '/admin/categories/machineType/[id]/edit'],
        description: 'Edit machine type',
    },
    {
        slug: 'machine_type:delete',
        subject: 'machine_type',
        action: 'delete',
        routes: [],
        description: 'Delete machine type',
    },

    // Mold
    {
        slug: 'mold:view',
        subject: 'mold',
        action: 'view',
        routes: ['/admin/categories/mold'],
        menuKey: 'mold',
        description: 'View mold list',
    },
    {
        slug: 'mold:create',
        subject: 'mold',
        action: 'create',
        routes: [],
        description: 'Create mold',
    },
    {
        slug: 'mold:update',
        subject: 'mold',
        action: 'update',
        routes: [],
        description: 'Update mold',
    },
    {
        slug: 'mold:delete',
        subject: 'mold',
        action: 'delete',
        routes: [],
        description: 'Delete mold',
    },

    // Staffing
    {
        slug: 'staffing:view',
        subject: 'staffing',
        action: 'view',
        routes: ['/admin/categories/machineStaffing'],
        menuKey: 'machine-staffing',
        description: 'View staffing',
    },
    {
        slug: 'staffing:update',
        subject: 'staffing',
        action: 'update',
        routes: [],
        description: 'Update staffing',
    },

    // Factory
    {
        slug: 'factory:view',
        subject: 'factory',
        action: 'view',
        routes: ['/admin/categories/factory'],
        menuKey: 'factory',
        description: 'View factories',
    },
    {
        slug: 'factory:create',
        subject: 'factory',
        action: 'create',
        routes: [],
        description: 'Create factory',
    },
    {
        slug: 'factory:update',
        subject: 'factory',
        action: 'update',
        routes: [],
        description: 'Update factory',
    },
    {
        slug: 'factory:delete',
        subject: 'factory',
        action: 'delete',
        routes: [],
        description: 'Delete factory',
    },

    // Zone
    {
        slug: 'zone:view',
        subject: 'zone',
        action: 'view',
        routes: ['/admin/categories/zone'],
        menuKey: 'zone',
        description: 'View zones',
    },
    {
        slug: 'zone:create',
        subject: 'zone',
        action: 'create',
        routes: [],
        description: 'Create zone',
    },
    {
        slug: 'zone:update',
        subject: 'zone',
        action: 'update',
        routes: [],
        description: 'Update zone',
    },
    {
        slug: 'zone:delete',
        subject: 'zone',
        action: 'delete',
        routes: [],
        description: 'Delete zone',
    },

    // Line
    {
        slug: 'line:view',
        subject: 'line',
        action: 'view',
        routes: ['/admin/categories/line'],
        menuKey: 'line',
        description: 'View lines',
    },
    {
        slug: 'line:create',
        subject: 'line',
        action: 'create',
        routes: [],
        description: 'Create line',
    },
    {
        slug: 'line:update',
        subject: 'line',
        action: 'update',
        routes: [],
        description: 'Update line',
    },
    {
        slug: 'line:delete',
        subject: 'line',
        action: 'delete',
        routes: [],
        description: 'Delete line',
    },

    // Space
    {
        slug: 'space:view',
        subject: 'space',
        action: 'view',
        routes: ['/admin/categories/space'],
        menuKey: 'space',
        description: 'View space hierarchy',
    },
    {
        slug: 'space:create',
        subject: 'space',
        action: 'create',
        routes: [],
        description: 'Create new space',
    },
    {
        slug: 'space:update',
        subject: 'space',
        action: 'update',
        routes: [],
        description: 'Update space details',
    },
    {
        slug: 'space:delete',
        subject: 'space',
        action: 'delete',
        routes: [],
        description: 'Delete a space',
    },

    // Space Level
    {
        slug: 'space_level:view',
        subject: 'space_level',
        action: 'view',
        routes: ['/admin/categories/spaceLevel'],
        menuKey: 'spaceLevel',
        description: 'View space levels',
    },
    {
        slug: 'space_level:create',
        subject: 'space_level',
        action: 'create',
        routes: [],
        description: 'Create space level',
    },
    {
        slug: 'space_level:update',
        subject: 'space_level',
        action: 'update',
        routes: [],
        description: 'Update space level',
    },
    {
        slug: 'space_level:delete',
        subject: 'space_level',
        action: 'delete',
        routes: [],
        description: 'Delete space level',
    },

    // Step
    {
        slug: 'step:view',
        subject: 'step',
        action: 'view',
        routes: ['/admin/categories/step'],
        menuKey: 'step',
        description: 'View steps',
    },
    {
        slug: 'step:create',
        subject: 'step',
        action: 'create',
        routes: [],
        description: 'Create step',
    },
    {
        slug: 'step:update',
        subject: 'step',
        action: 'update',
        routes: [],
        description: 'Update step',
    },
    {
        slug: 'step:delete',
        subject: 'step',
        action: 'delete',
        routes: [],
        description: 'Delete step',
    },

    // Industry Filter
    {
        slug: 'industry_filter:view',
        subject: 'industry_filter',
        action: 'view',
        routes: ['/admin/categories/industryFilter'],
        menuKey: 'industryFilter',
        description: 'View industry filters',
    },
    {
        slug: 'industry_filter:create',
        subject: 'industry_filter',
        action: 'create',
        routes: [],
        description: 'Create industry filter',
    },
    {
        slug: 'industry_filter:update',
        subject: 'industry_filter',
        action: 'update',
        routes: [],
        description: 'Update industry filter',
    },
    {
        slug: 'industry_filter:delete',
        subject: 'industry_filter',
        action: 'delete',
        routes: [],
        description: 'Delete industry filter',
    },

    // Profile
    {
        slug: 'profile:view',
        subject: 'profile',
        action: 'view',
        routes: ['/admin/setting'],
        menuKey: 'settings',
        description: 'View profile settings',
    },
    {
        slug: 'profile:update',
        subject: 'profile',
        action: 'update',
        routes: [],
        description: 'Update profile',
    },

    // Energy
    {
        slug: 'energy:overview_view',
        subject: 'energy',
        action: 'overview_view',
        routes: [],
        description: 'View energy consumption overview',
    },
    // Industry Config
    {
        slug: 'industry_config:view',
        subject: 'industry_config',
        action: 'view',
        routes: [],
        description: 'View industry config',
    },
    {
        slug: 'industry_config:update',
        subject: 'industry_config',
        action: 'update',
        routes: [],
        description: 'Update industry config',
    },
    // Machine Monitoring
    {
        slug: 'machine_monitoring:view',
        subject: 'machine_monitoring',
        action: 'view',
        routes: [],
        description: 'View machine monitoring',
    },
    // Machine Operator History
    {
        slug: 'machine_operator_history:view',
        subject: 'machine_operator_history',
        action: 'view',
        routes: [],
        description: 'View machine operator history',
    },
    {
        slug: 'machine_operator_history:create',
        subject: 'machine_operator_history',
        action: 'create',
        routes: [],
        description: 'Create machine operator history',
    },
    // Machine additional
    {
        slug: 'machine:store',
        subject: 'machine',
        action: 'store',
        routes: [],
        description: 'Store machine',
    },
    {
        slug: 'machine:update_sensitive',
        subject: 'machine',
        action: 'update_sensitive',
        routes: [],
        description: 'Update sensitive machine info',
    },
    // Floor Map
    {
        slug: 'floor_map:update',
        subject: 'floor_map',
        action: 'update',
        routes: ['/admin/floor-map'],
        menuKey: 'floor-map-config',
        description: 'Update floor map',
    },
    // Standard Step
    {
        slug: 'standard_step:view',
        subject: 'standard_step',
        action: 'view',
        routes: [],
        description: 'View standard steps',
    },
    {
        slug: 'standard_step:create',
        subject: 'standard_step',
        action: 'create',
        routes: [],
        description: 'Create standard step',
    },
    {
        slug: 'standard_step:update',
        subject: 'standard_step',
        action: 'update',
        routes: [],
        description: 'Update standard step',
    },
    {
        slug: 'standard_step:delete',
        subject: 'standard_step',
        action: 'delete',
        routes: [],
        description: 'Delete standard step',
    },
    // User additional
    {
        slug: 'user:restore',
        subject: 'user',
        action: 'restore',
        routes: [],
        description: 'Restore user',
    },
];

// Helper functions

/**
 * Get routes that require a specific permission slug
 */
export function getRoutesForPermission(slug: string): string[] {
    return PERMISSION_REGISTRY.find((p) => p.slug === slug)?.routes ?? [];
}

/**
 * Get permission config for a specific route
 */
export function getPermissionForRoute(route: string): PermissionConfig | undefined {
    return PERMISSION_REGISTRY.find((p) =>
        p.routes.some((r) => route === r || route.startsWith(r.replace('[id]', '')))
    );
}

/**
 * Get permission slug for a specific route
 */
export function getPermissionSlugForRoute(route: string): string | undefined {
    return getPermissionForRoute(route)?.slug;
}

/**
 * Get all permissions for a specific subject
 */
export function getPermissionsForSubject(subject: Subject): PermissionConfig[] {
    return PERMISSION_REGISTRY.filter((p) => p.subject === subject);
}

/**
 * Get menu key for a permission slug
 */
export function getMenuKeyForPermission(slug: string): string | undefined {
    return PERMISSION_REGISTRY.find((p) => p.slug === slug)?.menuKey;
}

/**
 * Check if a permission slug exists in the registry
 */
export function isValidPermission(slug: string): boolean {
    return PERMISSION_REGISTRY.some((p) => p.slug === slug);
}

/**
 * Get all unique subjects from the registry
 */
export function getAllSubjects(): Subject[] {
    const subjects = new Set<Subject>();
    PERMISSION_REGISTRY.forEach((p) => subjects.add(p.subject));
    return Array.from(subjects);
}

/**
 * Get all permission slugs
 */
export function getAllPermissionSlugs(): string[] {
    return PERMISSION_REGISTRY.map((p) => p.slug);
}
