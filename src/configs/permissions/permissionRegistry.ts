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

    // Factory Overview
    {
        slug: 'factory_overview:view',
        subject: 'factory_overview',
        action: 'view',
        routes: ['/admin/factory-overview'],
        menuKey: 'factory-overview',
        description: 'View factory overview',
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

    // Drawing Code
    {
        slug: 'drawing_code:view',
        subject: 'drawing_code',
        action: 'view',
        routes: ['/admin/categories/drawingCode'],
        menuKey: 'drawingCode',
        description: 'View drawing codes',
    },
    {
        slug: 'drawing_code:create',
        subject: 'drawing_code',
        action: 'create',
        routes: [],
        description: 'Create drawing code',
    },
    {
        slug: 'drawing_code:update',
        subject: 'drawing_code',
        action: 'update',
        routes: [],
        description: 'Update drawing code',
    },
    {
        slug: 'drawing_code:delete',
        subject: 'drawing_code',
        action: 'delete',
        routes: [],
        description: 'Delete drawing code',
    },
    {
        slug: 'drawing_code:restore',
        subject: 'drawing_code',
        action: 'restore',
        routes: [],
        description: 'Restore drawing code',
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
    // Order
    {
        slug: 'order:view',
        subject: 'order',
        action: 'view',
        routes: [],
        description: 'View orders',
    },
    {
        slug: 'order:create',
        subject: 'order',
        action: 'create',
        routes: [],
        description: 'Create orders',
    },
    {
        slug: 'order:update',
        subject: 'order',
        action: 'update',
        routes: [],
        description: 'Edit orders',
    },
    {
        slug: 'order:update_info',
        subject: 'order',
        action: 'update_info',
        routes: [],
        description: 'Update order info',
    },
    {
        slug: 'order:update_plan',
        subject: 'order',
        action: 'update_plan',
        routes: [],
        description: 'Update order plan',
    },
    {
        slug: 'order:confirm',
        subject: 'order',
        action: 'confirm',
        routes: [],
        description: 'Confirm order',
    },
    {
        slug: 'order:cancel',
        subject: 'order',
        action: 'cancel',
        routes: [],
        description: 'Cancel order',
    },
    {
        slug: 'order:operator_view',
        subject: 'order',
        action: 'operator_view',
        routes: [],
        description: 'View orders as operator',
    },
    {
        slug: 'order:manager_review_view',
        subject: 'order',
        action: 'manager_review_view',
        routes: [],
        description: 'View manager reviews',
    },
    {
        slug: 'order:delete',
        subject: 'order',
        action: 'delete',
        routes: [],
        description: 'Delete order',
    },
    {
        slug: 'order:restore',
        subject: 'order',
        action: 'restore',
        routes: [],
        description: 'Restore order',
    },
    // Task Review
    {
        slug: 'task_review:confirm',
        subject: 'task_review',
        action: 'confirm',
        routes: [],
        description: 'Confirm task review',
    },
    {
        slug: 'task_review:decline',
        subject: 'task_review',
        action: 'decline',
        routes: [],
        description: 'Decline task review',
    },
    // Space Monitoring
    {
        slug: 'space_monitoring:view',
        subject: 'space_monitoring',
        action: 'view',
        routes: [],
        description: 'View space monitoring',
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

    // Incident Report (Maintenance)
    {
        slug: 'incident_report:view',
        subject: 'incident_report',
        action: 'view',
        routes: ['/maintenance/incidents'],
        menuKey: 'incident-reports',
        description: 'View incident reports',
    },
    {
        slug: 'incident_report:create',
        subject: 'incident_report',
        action: 'create',
        routes: [],
        description: 'Create incident report',
    },
    {
        slug: 'incident_report:update',
        subject: 'incident_report',
        action: 'update',
        routes: [],
        description: 'Update incident report',
    },
    {
        slug: 'incident_report:delete',
        subject: 'incident_report',
        action: 'delete',
        routes: [],
        description: 'Delete incident report',
    },
    // Error Group
    {
        slug: 'error_group:view',
        subject: 'error_group',
        action: 'view',
        routes: ['/admin/categories/errorGroup'],
        menuKey: 'errorGroup',
        description: 'View error groups',
    },
    {
        slug: 'error_group:create',
        subject: 'error_group',
        action: 'create',
        routes: [],
        description: 'Create error group',
    },
    {
        slug: 'error_group:update',
        subject: 'error_group',
        action: 'update',
        routes: [],
        description: 'Update error group',
    },
    {
        slug: 'error_group:delete',
        subject: 'error_group',
        action: 'delete',
        routes: [],
        description: 'Delete error group',
    },

    // Error Detail
    {
        slug: 'error_detail:view',
        subject: 'error_detail',
        action: 'view',
        routes: ['/admin/categories/errorDetail'],
        menuKey: 'errorDetail',
        description: 'View error details',
    },
    {
        slug: 'error_detail:create',
        subject: 'error_detail',
        action: 'create',
        routes: [],
        description: 'Create error detail',
    },
    {
        slug: 'error_detail:update',
        subject: 'error_detail',
        action: 'update',
        routes: [],
        description: 'Update error detail',
    },
    {
        slug: 'error_detail:delete',
        subject: 'error_detail',
        action: 'delete',
        routes: [],
        description: 'Delete error detail',
    },

    // Production Plan
    {
        slug: 'production_plan:view',
        subject: 'production_plan',
        action: 'view',
        routes: ['/admin/categories/productionPlan'],
        menuKey: 'productionPlan',
        description: 'View production plans',
    },
    {
        slug: 'production_plan:create',
        subject: 'production_plan',
        action: 'create',
        routes: [],
        description: 'Create production plan',
    },
    {
        slug: 'production_plan:update',
        subject: 'production_plan',
        action: 'update',
        routes: [],
        description: 'Update production plan',
    },
    {
        slug: 'production_plan:delete',
        subject: 'production_plan',
        action: 'delete',
        routes: [],
        description: 'Delete production plan',
    },

    // Mold Code
    {
        slug: 'mold_code:view',
        subject: 'mold_code',
        action: 'view',
        routes: ['/admin/categories/moldCode'],
        menuKey: 'moldCode',
        description: 'View mold codes',
    },
    {
        slug: 'mold_code:create',
        subject: 'mold_code',
        action: 'create',
        routes: [],
        description: 'Create mold code',
    },
    {
        slug: 'mold_code:update',
        subject: 'mold_code',
        action: 'update',
        routes: [],
        description: 'Update mold code',
    },
    {
        slug: 'mold_code:delete',
        subject: 'mold_code',
        action: 'delete',
        routes: [],
        description: 'Delete mold code',
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
