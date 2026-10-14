import { Action, Subject } from './caslAbility';

export interface PermissionConfig {
    slug: `${Subject}:${Action}`;
    subject: Subject;
    action: Action;
    routes: string[];
    menuKey?: string;
    description: string;
    /** i18n key for the sidebar label. Only set when this permission has a sidebar entry. */
    i18nKey?: string;
    /** Top-level sidebar group this item belongs to, if any. */
    group?: 'categories' | 'rbac' | 'production_plan';
    /** Sub-group within `group`, if any. */
    subGroup?: 'machine_management' | 'space_configuration' | 'staff_others';
    /** AND-condition: ability must also grant this action on the same subject. */
    alsoRequiresAction?: Action;
    /** OR-condition: ability granting this action on the same subject is enough too (e.g. machine_overview view OR update). */
    alternativeAction?: Action;
    /** Sidebar item shown regardless of ability (e.g. settings). */
    alwaysShowInMenu?: boolean;
    /** Temporarily hide this entry from the sidebar while keeping routes/permissions intact (direct URL access still works). */
    hideFromMenu?: boolean;
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
        i18nKey: 'sidebar.navigation.rbacUsers',
        group: 'rbac',
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
        i18nKey: 'sidebar.navigation.rbacRoles',
        group: 'rbac',
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
        i18nKey: 'sidebar.navigation.rbacPermissions',
        group: 'rbac',
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
        i18nKey: 'permissionSubjects.space_monitoring',
    },
    // Production Overview
    {
        slug: 'production_overview:view',
        subject: 'production_overview',
        action: 'view',
        routes: ['/admin/production-overview'],
        menuKey: 'production-overview',
        description: 'View production overview',
        i18nKey: 'permissionSubjects.production_overview',
    },
    // Production Monitor
    {
        slug: 'production_monitor:view',
        subject: 'production_monitor',
        action: 'view',
        routes: ['/admin/production-plan/monitor'],
        menuKey: 'production-plan-monitor',
        description: 'View production plan monitor',
        i18nKey: 'sidebar.navigation.productionMonitor',
        group: 'production_plan',
    },

    // Production Plan (BE đổi slug family sang production_plan:* — xem ProductionPlanConstants.Permissions.
    // create/import chưa có bằng chứng BE đổi nên tạm giữ trên subject 'product' cũ.)
    {
        slug: 'production_plan:view',
        subject: 'production_plan',
        action: 'view',
        routes: ['/admin/production-plan'],
        menuKey: 'production-plan',
        description: 'View production plans',
        i18nKey: 'sidebar.navigation.productionPlan',
        group: 'production_plan',
    },
    {
        slug: 'product:create',
        subject: 'product',
        action: 'create',
        routes: [],
        description: 'Create production plan',
    },
    {
        slug: 'production_plan:update',
        subject: 'production_plan',
        action: 'update',
        routes: [],
        description: 'Update production plan fields',
    },
    {
        slug: 'production_plan:incident',
        subject: 'production_plan',
        action: 'incident',
        routes: [],
        description: 'Terminate/pause/defer production plan (incident actions)',
    },
    {
        slug: 'production_plan:move',
        subject: 'production_plan',
        action: 'move',
        routes: [],
        description: 'Move a PENDING production plan to another machine/date',
    },
    {
        slug: 'production_plan:delete',
        subject: 'production_plan',
        action: 'delete',
        routes: [],
        description: 'Delete production plan',
    },
    {
        slug: 'production_plan:restore',
        subject: 'production_plan',
        action: 'restore',
        routes: [],
        description: 'Restore deleted production plan',
    },
    {
        slug: 'production_plan:reorder',
        subject: 'production_plan',
        action: 'reorder',
        routes: [],
        description: 'Reorder production plans',
    },
    {
        slug: 'product:import',
        subject: 'product',
        action: 'import',
        routes: [],
        description: 'Import production plans from Excel',
    },

    // Machine List
    {
        slug: 'machine:view',
        subject: 'machine',
        action: 'view',
        routes: ['/admin/categories/machineList'],
        menuKey: 'machine-list',
        description: 'View machine list',
        i18nKey: 'sidebar.navigation.machineList',
        group: 'categories',
        subGroup: 'machine_management',
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
        i18nKey: 'sidebar.navigation.mold',
        group: 'categories',
        subGroup: 'machine_management',
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
    {
        slug: 'mold:restore',
        subject: 'mold',
        action: 'restore',
        routes: [],
        description: 'Restore deleted mold',
    },
    {
        slug: 'mold:import',
        subject: 'mold',
        action: 'import',
        routes: [],
        description: 'Import mold catalog from Excel',
    },

    // Operation Type
    {
        slug: 'operation_type:view',
        subject: 'operation_type',
        action: 'view',
        routes: ['/admin/categories/operationType'],
        menuKey: 'operation-type',
        description: 'View operation type list',
        i18nKey: 'sidebar.navigation.operationType',
        group: 'categories',
        subGroup: 'machine_management',
    },
    {
        slug: 'operation_type:create',
        subject: 'operation_type',
        action: 'create',
        routes: [],
        description: 'Create operation type',
    },
    {
        slug: 'operation_type:update',
        subject: 'operation_type',
        action: 'update',
        routes: [],
        description: 'Update operation type',
    },
    {
        slug: 'operation_type:delete',
        subject: 'operation_type',
        action: 'delete',
        routes: [],
        description: 'Delete operation type',
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
        i18nKey: 'sidebar.navigation.space',
        group: 'categories',
        subGroup: 'space_configuration',
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
        i18nKey: 'sidebar.navigation.spaceLevel',
        group: 'categories',
        subGroup: 'space_configuration',
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
    // TEMP: hideFromMenu removes "Step" from the sidebar only; routes/ability
    // are untouched so direct URL access (/admin/categories/step) still works.
    // Remove hideFromMenu to re-enable the sidebar entry.
    {
        slug: 'step:view',
        subject: 'step',
        action: 'view',
        routes: ['/admin/categories/step'],
        menuKey: 'step',
        description: 'View steps',
        i18nKey: 'stepManagement.title',
        group: 'categories',
        subGroup: 'staff_others',
        hideFromMenu: true,
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
        i18nKey: 'sidebar.navigation.industryFilter',
        group: 'categories',
        subGroup: 'staff_others',
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
        i18nKey: 'sidebar.navigation.settings',
        alwaysShowInMenu: true,
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
    // Work Calendar
    {
        slug: 'work_calendar:view',
        subject: 'work_calendar',
        action: 'view',
        routes: ['/admin/work-calendar'],
        menuKey: 'work-calendar',
        description: 'View work calendar',
        i18nKey: 'sidebar.navigation.workCalendar',
        group: 'production_plan',
    },
    {
        slug: 'work_calendar:update',
        subject: 'work_calendar',
        action: 'update',
        routes: [],
        description: 'Batch update work calendar',
    },
    {
        slug: 'work_calendar:reset',
        subject: 'work_calendar',
        action: 'reset',
        routes: [],
        description: 'Reset work calendar to default',
    },

    // Staff Management
    {
        slug: 'staff:view',
        subject: 'staff',
        action: 'view',
        routes: ['/admin/categories/staffList'],
        menuKey: 'staff-list',
        description: 'View staff list',
        i18nKey: 'sidebar.navigation.staffList',
        group: 'categories',
        subGroup: 'staff_others',
    },
    {
        slug: 'staff:create',
        subject: 'staff',
        action: 'create',
        routes: [],
        description: 'Create staff',
    },
    {
        slug: 'staff:update',
        subject: 'staff',
        action: 'update',
        routes: [],
        description: 'Update staff',
    },
    {
        slug: 'staff:delete',
        subject: 'staff',
        action: 'delete',
        routes: [],
        description: 'Delete staff',
    },

    // Machine Overview
    {
        slug: 'machine_overview:view',
        subject: 'machine_overview',
        action: 'view',
        routes: ['/admin/machines'],
        menuKey: 'machines',
        description: 'View machine overview',
        i18nKey: 'sidebar.navigation.machine',
        alternativeAction: 'update',
    },
    {
        slug: 'machine_overview:update',
        subject: 'machine_overview',
        action: 'update',
        routes: [],
        description: 'Update machine overview',
    },

    // Process Management
    {
        slug: 'process:view',
        subject: 'process',
        action: 'view',
        routes: ['/admin/process'],
        description: 'View process management',
    },

    // Tasks Management
    {
        slug: 'tasks:view',
        subject: 'tasks',
        action: 'view',
        routes: ['/admin/tasks'],
        description: 'View tasks management',
    },

    // QC
    {
        slug: 'qc_dashboard:view',
        subject: 'qc_dashboard',
        action: 'view',
        routes: ['/qc'],
        description: 'View QC dashboard',
    },

    // Manager
    {
        slug: 'manager_reviews:view',
        subject: 'manager_reviews',
        action: 'view',
        routes: ['/manager/review-dashboard'],
        description: 'View manager review dashboard',
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
