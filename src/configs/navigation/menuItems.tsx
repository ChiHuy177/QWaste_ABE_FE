import {
    LaptopOutlined,
    ApartmentOutlined,
    SettingOutlined,
    SafetyOutlined,
    AppstoreOutlined,
    CalendarOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { TFunction } from 'i18next';
import { AppAbility } from '@/configs/permissions/caslAbility';
import Link from 'next/link';

type MenuItem = Required<MenuProps>['items'][number];

const createMenuItem = (key: string, label: string, icon?: React.ReactNode): MenuItem => ({
    key,
    icon,
    label: <Link href={key}>{label}</Link>,
});

export const getMenuItems = (t: TFunction, ability: AppAbility): MenuItem[] => {
    const items: MenuItem[] = [];

    if (ability.can('view', 'space_monitoring')) {
        items.push(
            createMenuItem(
                '/admin/space-monitoring',
                t('permissionSubjects.space_monitoring'),
                <ApartmentOutlined />
            )
        );
    }

    if (ability.can('view', 'machine_overview') || ability.can('update', 'machine_overview')) {
        items.push(
            createMenuItem('/admin/machines', t('sidebar.navigation.machine'), <LaptopOutlined />)
        );
    }

    if (
        ability.can('view', 'error_management') ||
        ability.can('view', 'machine_overview') ||
        ability.can('view', 'machine')
    ) {
        items.push(
            createMenuItem(
                '/admin/error-management',
                t('sidebar.navigation.errorManagement'),
                <WarningOutlined />
            )
        );
    }

    const productionPlanItems: MenuItem[] = [];
    if (ability.can('view', 'production_plan')) {
        productionPlanItems.push(
            createMenuItem('/admin/production-plan', t('sidebar.navigation.productionPlan'))
        );
    }
    if (ability.can('view', 'work_calendar')) {
        productionPlanItems.push(
            createMenuItem('/admin/work-calendar', t('sidebar.navigation.workCalendar'))
        );
    }
    if (ability.can('view', 'production_monitor')) {
        productionPlanItems.push(
            createMenuItem(
                '/admin/production-plan/monitor',
                t('sidebar.navigation.productionMonitor')
            )
        );
    }
    if (productionPlanItems.length > 0) {
        items.push({
            key: 'production_plan_group',
            icon: <CalendarOutlined />,
            label: t('sidebar.navigation.productionPlan'),
            children: productionPlanItems,
        });
    }

    const categoryItems: MenuItem[] = [];

    // Group: Machine Management
    const machineManagementItems: MenuItem[] = [];
    if (ability.can('view', 'machine')) {
        machineManagementItems.push(
            createMenuItem('/admin/categories/machineList', t('sidebar.navigation.machineList'))
        );
    }
    if (ability.can('view', 'mold')) {
        machineManagementItems.push(
            createMenuItem('/admin/categories/mold', t('sidebar.navigation.mold'))
        );
    }
    if (ability.can('view', 'operation_type')) {
        machineManagementItems.push(
            createMenuItem('/admin/categories/operationType', t('sidebar.navigation.operationType'))
        );
    }
    // if (ability.can('view', 'machine_type')) {
    //     machineManagementItems.push(
    //         createMenuItem('/admin/categories/machineType', t('sidebar.navigation.machineType'))
    //     );
    // }
    // if (ability.can('view', 'staffing')) {
    //     machineManagementItems.push(
    //         createMenuItem(
    //             '/admin/categories/machineStaffing',
    //             t('sidebar.navigation.machineStaffing')
    //         )
    //     );
    // }
    if (machineManagementItems.length > 0) {
        categoryItems.push({
            key: 'machine_management',
            label: t('sidebar.navigation.machineManagement'),
            children: machineManagementItems,
        });
    }

    // Group: Space Configuration
    const spaceConfigurationItems: MenuItem[] = [];
    if (ability.can('view', 'space_level')) {
        spaceConfigurationItems.push(
            createMenuItem('/admin/categories/spaceLevel', t('sidebar.navigation.spaceLevel'))
        );
    }
    if (ability.can('view', 'space')) {
        spaceConfigurationItems.push(
            createMenuItem('/admin/categories/space', t('sidebar.navigation.space'))
        );
    }
    // if (ability.can('update', 'floor_map')) {
    //     spaceConfigurationItems.push(
    //         createMenuItem('/admin/floor-map', t('sidebar.navigation.floorMapConfig'))
    //     );
    // }
    if (spaceConfigurationItems.length > 0) {
        categoryItems.push({
            key: 'space_configuration',
            label: t('sidebar.navigation.spaceConfiguration'),
            children: spaceConfigurationItems,
        });
    }

    // Group: Staff & Others
    const staffAndOthersItems: MenuItem[] = [];
    if (ability.can('view', 'staff')) {
        staffAndOthersItems.push(
            createMenuItem('/admin/categories/staffList', t('sidebar.navigation.staffList'))
        );
    }
    if (ability.can('view', 'step')) {
        staffAndOthersItems.push(
            createMenuItem('/admin/categories/step', t('stepManagement.title'))
        );
    }
    if (ability.can('view', 'industry_filter')) {
        staffAndOthersItems.push(
            createMenuItem(
                '/admin/categories/industryFilter',
                t('sidebar.navigation.industryFilter')
            )
        );
    }
    if (staffAndOthersItems.length > 0) {
        categoryItems.push({
            key: 'staff_others',
            label: t('sidebar.navigation.staffOthers'),
            children: staffAndOthersItems,
        });
    }

    if (categoryItems.length > 0) {
        items.push({
            key: 'categories',
            icon: <AppstoreOutlined />,
            label: t('sidebar.navigation.catalog'),
            children: categoryItems,
        });
    }

    const rbacItems: MenuItem[] = [];

    if (ability.can('view', 'permission')) {
        rbacItems.push(
            createMenuItem('/admin/rbac/permissions', t('sidebar.navigation.rbacPermissions'))
        );
    }

    if (ability.can('view', 'role')) {
        rbacItems.push(createMenuItem('/admin/rbac/roles', t('sidebar.navigation.rbacRoles')));
    }

    if (ability.can('view', 'user')) {
        rbacItems.push(createMenuItem('/admin/rbac/users', t('sidebar.navigation.rbacUsers')));
    }

    if (rbacItems.length > 0) {
        items.push({
            key: 'rbac',
            icon: <SafetyOutlined />,
            label: t('sidebar.navigation.rbac'),
            children: rbacItems,
        });
    }

    items.push(
        createMenuItem('/admin/setting', t('sidebar.navigation.settings'), <SettingOutlined />)
    );

    return items;
};
