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
    | 'update_info'
    | 'update_plan'
    | 'confirm'
    | 'cancel'
    | 'operator_view'
    | 'manager_review_view'
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
    | 'factory_overview'
    | 'energy'
    | 'industry_config'
    // Machines
    | 'machine_overview'
    | 'machine_monitoring'
    | 'machine_operator_history'
    // Settings
    | 'profile'
    // Operator
    | 'operator_dashboard'
    | 'operator_reviews'
    // QC
    | 'qc_dashboard'
    // Manager
    | 'manager_reviews'
    // RBAC Management
    | 'user'
    | 'role'
    | 'permission'
    // Order Management
    | 'order'
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
    // Maintenance
    | 'incident_report'
    // Factory Operations
    | 'error_group'
    | 'error_detail'
    | 'production_plan'
    | 'mold_code'
    // Special
    | 'all';

export type AppAbility = PureAbility<[Action, Subject]>;
export interface Conditions {
    userId?: string;
    [key: string]: any;
}
