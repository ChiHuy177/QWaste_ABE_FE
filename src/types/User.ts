import { AuditMetaData, SoftDeleteMetaData } from './Metadata';
import { Action, Subject } from '@/configs/permissions/caslAbility';

export interface UserSettings {
    id: string;
    accountId: string;
    theme: ThemeOption;
    language: LanguageOption;
    status: string;
    createdTime: number;
    updatedTime: number | null;
}

export interface StaffFormData {
    userId?: string;
    fullname: string;
    email: string;
    username: string;
    password?: string;
    phoneNumber: string;
    userCode: string;
    address: string;
    roles: string | string[];
    gender: string;
    accessibleFactoryIds?: number[];
    auditMetaData?: AuditMetaData;
}

export interface PermissionRule {
    action: Action;
    subject: Subject;
    conditions?: Record<string, any>;
}

export interface AllTypePermissions {
    grantedPermissions: string[];
    deniedPermissions: string[];
    finalPermissions: string[];
}

export interface AccessibleFactory {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
    description?: string;
}

export interface UserProfile {
    userId: string;
    fullname: string;
    email: string;
    username: string;
    address: string;
    phoneNumber: string;
    userCode: string;
    roles: AccountRole[];
    gender: string;
    preferences: UserPreference;
    auditMetaData?: AuditMetaData;
    softDeleteMetaData?: SoftDeleteMetaData;
    permissions?: PermissionRule[];
    allTypePermissions?: AllTypePermissions;
    accessibleFactories?: AccessibleFactory[];
}

export interface UserPreference {
    theme: ThemeOption;
    language: LanguageOption;
    avatarUrl: string;
}

export type AccountRole =
    | 'super_admin'
    | 'admin'
    | 'director'
    | 'manager'
    | 'operator'
    | 'qc_staff'
    | 'maintenance'
    | 'client'
    | 'op' // legacy
    | 'qc'; // legacy
export type ThemeOption = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: Array<{
    value: ThemeOption;
    label: string;
    icon: string;
}> = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
    ];

export type LanguageOption = 'en' | 'vi';

export const LANGUAGE_OPTIONS: Array<{
    value: LanguageOption;
    label: string;
    flag: string;
    nativeName: string;
}> = [
        { value: 'en', label: 'English', flag: '🇺🇸', nativeName: 'English' },
        { value: 'vi', label: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
    ];
export interface ValidationErrors {
    [fieldName: string]: string;
}

// RBAC User Permission Types
export interface UserPermission {
    userPermissionId: number;
    userId: string;
    permissionId: number;
    permissionType: 'grant' | 'deny';
    reason?: string;
    grantedBy?: string;
    grantedByName?: string;
    createdAt: string;
}

export interface UserPermissionFormData {
    permissionId: number;
    permissionType: 'grant' | 'deny';
    reason?: string;
}

export interface UserWithRBAC extends UserProfile {
    firstName?: string;
    lastName?: string;
    roleIds?: number[];
    customPermissions?: UserPermission[];
}

export interface UserRolesPermissionsSummary {
    userId: string;
    fullname: string;
    email: string;
    username: string;
    address: string;
    phoneNumber: string;
    userCode: string;
    roles: string[];
    allTypePermissions: AllTypePermissions;
}

export interface UserForPickingByRole {
    userId: string;
    fullname: string;
    userCode: string;
}
