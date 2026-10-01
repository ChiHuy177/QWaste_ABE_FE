import { AuditMetaData, SoftDeleteMetaData } from './Metadata';
import { Action, Subject } from '@/configs/permissions/caslAbility';
import { SpaceDTO, AccessibleSpace } from './Space';

export type { SpaceDTO, AccessibleSpace };

export interface UserSettings {
    id: string;
    accountId: string;
    theme: ThemeOption;
    language: LanguageOption;
    status: string;
    createdTime: number;
    updatedTime: number | null;
}

export interface AccessibleFactory {
    factoryId: number;
    factoryCode: string;
    factoryName: string;
    description?: string;
}

export interface PermissionRule {
    action: Action;
    subject: Subject;
    conditions?: Record<string, unknown>;
}

export interface AllTypePermissions {
    grantedPermissions: string[];
    deniedPermissions: string[];
    finalPermissions: string[];
    superAdmin?: boolean;
}

export interface UserQueryParams {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    fullname?: string;
    email?: string;
    username?: string;
    userCode?: string;
}

export interface UserListResponse {
    userId: string;
    fullname: string;
    email: string;
    username: string;
    address: string;
    phoneNumber: string;
    userCode: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
    isDeleted: boolean;
}

export interface UserDetailResponse {
    userId: string;
    fullname: string;
    email: string;
    username: string;
    address: string;
    phoneNumber: string;
    userCode: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
    roles: string[];
    accessibleSpaces: SpaceDTO[];
    auditMetaData: AuditMetaData;
    softDeleteMetaData: SoftDeleteMetaData;
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
    accessibleSpaces?: SpaceDTO[];
    accessibleFactories?: AccessibleFactory[];
    accessibleFactoryIds?: number[];
    spaceIds?: number[];
    isDeleted?: boolean;
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
    spaceIds?: number[];
    accessibleFactoryIds?: number[];
    accessibleSpaceIds?: number[];
    accessibleSpaces?: SpaceDTO[];
    auditMetaData?: AuditMetaData;
}

export interface UserCreationRequest {
    fullname: string;
    email: string;
    username: string;
    password?: string;
    address: string;
    phoneNumber: string;
    userCode: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
    roles?: string[];
    spaceIds?: number[];
}

export interface UserUpdationRequest {
    userId: string;
    fullname: string;
    email: string;
    username?: string;
    address: string;
    phoneNumber: string;
    userCode: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
    roles?: string[];
    spaceIds?: number[];
}

export interface UserRolesAndPermissionsUpdationRequest {
    userId: string;
    roleIds: number[];
    grantedPermissionIds?: number[];
    deniedPermissionIds?: number[];
}

export interface PasswordChangeVerificationRequest {
    currentPassword: string;
}

export interface PasswordChangeWithCodeRequest {
    verificationCode: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface UserRegistrationRequest {
    fullname: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    userCode: string;
    gender: 'MALE' | 'FEMALE';
    address: string;
    spaceId: number;
    lang?: 'en' | 'vi';
}

export interface RegistrationVerificationRequest {
    email: string;
    verificationCode: string;
}

export interface RegistrationResendResponse {
    cooldownSeconds: number;
    expiresInSeconds: number;
    resendsRemaining: number;
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
    | 'planner'
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
