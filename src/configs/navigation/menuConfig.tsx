import {
    LaptopOutlined,
    ApartmentOutlined,
    BarChartOutlined,
    SettingOutlined,
    SafetyOutlined,
    ProjectOutlined,
    CheckSquareOutlined,
    AppstoreOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import type { Action, Subject } from '@/configs/permissions/caslAbility';


export interface MenuItemConfig {
    key: string;
    route: string;
    i18nKey: string;
    icon?: React.ReactNode;
    subject: Subject;
    action: Action;
    alternativeAction?: Action; // For items with OR condition (e.g., view OR update)
    group?: 'categories' | 'rbac';
    subGroup?: 'machine_management' | 'space_configuration' | 'staff_others';
    alwaysShow?: boolean; // For items always shown (e.g., settings)
}

export interface GroupConfig {
    key: string;
    i18nKey: string;
    icon?: React.ReactNode;
}


//All menu items configuration
export const MENU_CONFIG: MenuItemConfig[] = [
    // Top-level items
    {
        key: 'space-monitoring',
        route: '/admin/space-monitoring',
        i18nKey: 'permissionSubjects.space_monitoring',
        icon: <ApartmentOutlined />,
        subject: 'space_monitoring',
        action: 'view',
    },
    {
        key: 'machines',
        route: '/admin/machines',
        i18nKey: 'sidebar.navigation.machine',
        icon: <LaptopOutlined />,
        subject: 'machine_overview',
        action: 'view',
        alternativeAction: 'update', // Show if can view OR update
    },
    {
        key: 'process',
        route: '/admin/process',
        i18nKey: 'sidebar.navigation.process',
        icon: <ProjectOutlined />,
        subject: 'process',
        action: 'view',
    },
    {
        key: 'tasks',
        route: '/admin/tasks',
        i18nKey: 'sidebar.navigation.tasks',
        icon: <CheckSquareOutlined />,
        subject: 'tasks',
        action: 'view',
    },
    {
        key: 'production-plan',
        route: '/admin/production-plan',
        i18nKey: 'sidebar.navigation.productionPlan',
        icon: <CalendarOutlined />,
        subject: 'tasks',
        action: 'view',
    },
    {
        key: 'production-overview',
        route: '/admin/production-overview',
        i18nKey: 'permissionSubjects.production_overview',
        icon: <BarChartOutlined />,
        subject: 'production_overview',
        action: 'view',
    },
    {
        key: 'production-plan-monitor',
        route: '/admin/production-plan/monitor',
        i18nKey: 'sidebar.navigation.productionMonitor',
        icon: <CalendarOutlined />,
        subject: 'production_monitor',
        action: 'view',
    },
    {
        key: 'settings',
        route: '/admin/setting',
        i18nKey: 'sidebar.navigation.settings',
        icon: <SettingOutlined />,
        subject: 'profile',
        action: 'view',
        alwaysShow: true, // Always show settings
    },

    // Categories > Machine Management
    {
        key: 'machine-list',
        route: '/admin/categories/machineList',
        i18nKey: 'sidebar.navigation.machineList',
        subject: 'machine',
        action: 'view',
        group: 'categories',
        subGroup: 'machine_management',
    },
    {
        key: 'machine-staffing',
        route: '/admin/categories/machineStaffing',
        i18nKey: 'sidebar.navigation.machineStaffing',
        subject: 'staffing',
        action: 'view',
        group: 'categories',
        subGroup: 'machine_management',
    },

    // Categories > Space Configuration
    {
        key: 'space-level',
        route: '/admin/categories/spaceLevel',
        i18nKey: 'sidebar.navigation.spaceLevel',
        subject: 'space_level',
        action: 'view',
        group: 'categories',
        subGroup: 'space_configuration',
    },
    {
        key: 'space',
        route: '/admin/categories/space',
        i18nKey: 'sidebar.navigation.space',
        subject: 'space',
        action: 'view',
        group: 'categories',
        subGroup: 'space_configuration',
    },

    // Categories > Staff & Others
    {
        key: 'staff-list',
        route: '/admin/categories/staffList',
        i18nKey: 'sidebar.navigation.staffList',
        subject: 'staff',
        action: 'view',
        group: 'categories',
        subGroup: 'staff_others',
    },
    {
        key: 'step',
        route: '/admin/categories/step',
        i18nKey: 'stepManagement.title',
        subject: 'step',
        action: 'view',
        group: 'categories',
        subGroup: 'staff_others',
    },
    {
        key: 'industry-filter',
        route: '/admin/categories/industryFilter',
        i18nKey: 'sidebar.navigation.industryFilter',
        subject: 'industry_filter',
        action: 'view',
        group: 'categories',
        subGroup: 'staff_others',
    },
    // RBAC items
    {
        key: 'rbac-permissions',
        route: '/admin/rbac/permissions',
        i18nKey: 'sidebar.navigation.rbacPermissions',
        subject: 'permission',
        action: 'view',
        group: 'rbac',
    },
    {
        key: 'rbac-roles',
        route: '/admin/rbac/roles',
        i18nKey: 'sidebar.navigation.rbacRoles',
        subject: 'role',
        action: 'view',
        group: 'rbac',
    },
    {
        key: 'rbac-users',
        route: '/admin/rbac/users',
        i18nKey: 'sidebar.navigation.rbacUsers',
        subject: 'user',
        action: 'view',
        group: 'rbac',
    },
];

export const GROUP_CONFIG: Record<string, GroupConfig> = {
    categories: {
        key: 'categories',
        i18nKey: 'sidebar.navigation.catalog',
        icon: <AppstoreOutlined />,
    },
    rbac: {
        key: 'rbac',
        i18nKey: 'sidebar.navigation.rbac',
        icon: <SafetyOutlined />,
    },
};

export const SUB_GROUP_CONFIG: Record<string, GroupConfig> = {
    machine_management: {
        key: 'machine_management',
        i18nKey: 'sidebar.navigation.machineManagement',
    },
    space_configuration: {
        key: 'space_configuration',
        i18nKey: 'sidebar.navigation.spaceConfiguration',
    },
    staff_others: {
        key: 'staff_others',
        i18nKey: 'sidebar.navigation.staffOthers',
    },
};
