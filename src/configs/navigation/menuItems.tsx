import {
    LaptopOutlined,
    ApartmentOutlined,
    SettingOutlined,
    SafetyOutlined,
    AppstoreOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { TFunction } from 'i18next';
import { AppAbility } from '@/configs/permissions/caslAbility';
import { PERMISSION_REGISTRY, PermissionConfig } from '@/configs/permissions/permissionRegistry';
import Link from 'next/link';

type MenuItem = Required<MenuProps>['items'][number];

/**
 * Sidebar is built from PERMISSION_REGISTRY (the single source of truth for
 * subject/action -> route/menu mapping). This file only owns presentation
 * concerns that don't belong in a plain-data registry: icons and menu order.
 */
const TOP_LEVEL_ICONS: Record<string, React.ReactNode> = {
    'space-monitoring': <ApartmentOutlined />,
    machines: <LaptopOutlined />,
    settings: <SettingOutlined />,
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
    production_plan: <CalendarOutlined />,
    categories: <AppstoreOutlined />,
    rbac: <SafetyOutlined />,
};

const GROUP_I18N_KEYS: Record<string, string> = {
    production_plan: 'sidebar.navigation.productionPlan',
    categories: 'sidebar.navigation.catalog',
    rbac: 'sidebar.navigation.rbac',
};

const SUB_GROUP_I18N_KEYS: Record<string, string> = {
    machine_management: 'sidebar.navigation.machineManagement',
    space_configuration: 'sidebar.navigation.spaceConfiguration',
    staff_others: 'sidebar.navigation.staffOthers',
};

const TOP_LEVEL_BEFORE_GROUPS = ['space-monitoring', 'machines'];
const PRODUCTION_PLAN_MENU_KEYS = ['production-plan', 'work-calendar', 'production-plan-monitor'];
const SUB_GROUP_ORDER = ['machine_management', 'space_configuration', 'staff_others'] as const;
const RBAC_SUBJECT_ORDER = ['permission', 'role', 'user'] as const;

function canShow(ability: AppAbility, permission: PermissionConfig): boolean {
    if (permission.alwaysShowInMenu) return true;
    if (ability.can(permission.action, permission.subject)) return true;
    if (
        permission.alternativeAction &&
        ability.can(permission.alternativeAction, permission.subject)
    ) {
        return true;
    }
    return false;
}

function createMenuItem(
    t: TFunction,
    permission: PermissionConfig,
    icon?: React.ReactNode
): MenuItem {
    const route = permission.routes[0];
    return {
        key: route,
        icon,
        label: <Link href={route}>{t(permission.i18nKey as string)}</Link>,
    };
}

export const getMenuItems = (t: TFunction, ability: AppAbility): MenuItem[] => {
    const visible = PERMISSION_REGISTRY.filter(
        (p) => p.i18nKey && p.routes.length > 0 && canShow(ability, p)
    );
    const byMenuKey = new Map(visible.map((p) => [p.menuKey, p]));

    const items: MenuItem[] = [];

    TOP_LEVEL_BEFORE_GROUPS.forEach((menuKey) => {
        const permission = byMenuKey.get(menuKey);
        if (permission) items.push(createMenuItem(t, permission, TOP_LEVEL_ICONS[menuKey]));
    });

    const productionPlanItems = PRODUCTION_PLAN_MENU_KEYS.map((menuKey) => byMenuKey.get(menuKey))
        .filter((p): p is PermissionConfig => !!p)
        .map((p) => createMenuItem(t, p));
    if (productionPlanItems.length > 0) {
        items.push({
            key: 'production_plan_group',
            icon: GROUP_ICONS.production_plan,
            label: t(GROUP_I18N_KEYS.production_plan),
            children: productionPlanItems,
        });
    }

    const categoryPermissions = visible.filter((p) => p.group === 'categories');
    const categoryItems: MenuItem[] = [];
    SUB_GROUP_ORDER.forEach((subGroup) => {
        const children = categoryPermissions
            .filter((p) => p.subGroup === subGroup)
            .map((p) => createMenuItem(t, p));
        if (children.length > 0) {
            categoryItems.push({
                key: subGroup,
                label: t(SUB_GROUP_I18N_KEYS[subGroup]),
                children,
            });
        }
    });
    if (categoryItems.length > 0) {
        items.push({
            key: 'categories',
            icon: GROUP_ICONS.categories,
            label: t(GROUP_I18N_KEYS.categories),
            children: categoryItems,
        });
    }

    const rbacPermissions = visible.filter((p) => p.group === 'rbac');
    const rbacItems = RBAC_SUBJECT_ORDER.map((subject) =>
        rbacPermissions.find((p) => p.subject === subject)
    )
        .filter((p): p is PermissionConfig => !!p)
        .map((p) => createMenuItem(t, p));
    if (rbacItems.length > 0) {
        items.push({
            key: 'rbac',
            icon: GROUP_ICONS.rbac,
            label: t(GROUP_I18N_KEYS.rbac),
            children: rbacItems,
        });
    }

    const settings = byMenuKey.get('settings');
    if (settings) items.push(createMenuItem(t, settings, TOP_LEVEL_ICONS.settings));

    return items;
};
