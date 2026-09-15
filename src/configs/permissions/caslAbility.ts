import { PureAbility } from '@casl/ability';

/**
 * Single source of truth for valid CASL actions.
 * Action type is derived from this array — add new actions here only.
 */
export const ACTIONS = [
    'view',
    'create',
    'update',
    'delete',
    'manage',
    'restore',
    'overview_view',
    'store',
    'update_sensitive',
    'confirm',
    'decline',
    'reorder',
    'import',
    'incident',
    'move',
    'reset',
] as const;

export type Action = (typeof ACTIONS)[number];

export type Subject =
    | 'work_calendar'
    // Overview
    | 'overview'
    // Categories
    | 'machine_type'
    | 'machine'
    | 'mold'
    | 'operation_type'
    | 'staffing'
    | 'factory'
    | 'space'
    | 'space_level'
    | 'step'
    | 'zone'
    | 'line'
    | 'staff'
    | 'group'
    | 'industry_filter'
    // Factory
    | 'energy'
    | 'industry_config'
    // Machines
    | 'machine_overview'
    | 'machine_monitoring'
    | 'machine_operator_history'
    // Settings
    | 'profile'
    // QC
    | 'qc_dashboard'
    // Manager
    | 'manager_reviews'
    // RBAC Management
    | 'user'
    | 'role'
    | 'permission'
    // Process Management
    | 'process'
    | 'standard_step'
    // Staff Management
    | 'staff'
    // Tasks Management
    | 'tasks'
    | 'production_monitor'
    // Production plan — BE dùng slug production_plan:* (create/import vẫn tạm trên 'product')
    | 'production_plan'
    | 'product'
    // Space
    | 'space_monitoring'
    | 'floor_map'
    // Error & Incident Management
    | 'error_management'
    // Special
    | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;
export interface Conditions {
    userId?: string;
    [key: string]: unknown;
}
