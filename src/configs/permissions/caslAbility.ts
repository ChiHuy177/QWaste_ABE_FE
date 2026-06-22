import { PureAbility } from '@casl/ability';

export type Action =
    | 'view'
    | 'create'
    | 'update'
    | 'delete'
    | 'manage'
    | 'restore'
    | 'overview_view'
    | 'store'
    | 'update_sensitive'
    | 'confirm'
    | 'decline';

export type Subject =
    // Overview
    | 'overview'
    // Categories
    | 'machine_type'
    | 'machine'
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
    | 'drawing_code'
    // Factory
    | 'energy'
    | 'industry_config'
    // Machines
    | 'machine_overview'
    | 'machine_monitoring'
    | 'machine_operator_history'
    // Settings
    | 'profile'
    // Operator
    | 'operator_reviews'
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
    | 'task_review'
    // Space
    | 'space_monitoring'
    | 'floor_map'
    // Special
    | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;
export interface Conditions {
    userId?: string;
    [key: string]: any;
}
