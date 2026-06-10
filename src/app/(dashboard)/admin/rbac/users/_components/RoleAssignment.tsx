import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Space, Spin, Empty, Collapse, Checkbox, Button, theme, Form, Alert } from 'antd';
import type { CollapseProps } from 'antd';
import { RoleService } from '@/services/RoleService';
import { UserService } from '@/services/UserService';
import { DemoRoleService, USE_MOCK_RBAC } from '@/mockData/admin/rbac';
import { DemoUserService, USE_MOCK_USERS } from '@/mockData/admin/users';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Role, RolePermission } from '@/types/Role';

const { Text } = Typography;
const activeRoleService = USE_MOCK_RBAC ? DemoRoleService : RoleService;
const activeUserService = USE_MOCK_USERS ? DemoUserService : UserService;

const groupPermissionsBySubject = (permissions: RolePermission[]) => {
    const subjects = Array.from(
        new Set(permissions.map((p) => p.slug.split(':')[0]))
    ).sort();

    return subjects.map((subject) => {
        const subjectPermissions = permissions.filter((p) => p.slug.startsWith(`${subject}:`));

        const actionCounts: { [key: string]: number } = {};
        subjectPermissions.forEach((p) => {
            const action = p.slug.split(':')[1];
            if (action) {
                actionCounts[action] = (actionCounts[action] || 0) + 1;
            }
        });

        return {
            subject,
            permissions: subjectPermissions,
            actionCounts,
        };
    });
};

const getActionColor = (action: string): string => {
    switch (action) {
        case 'create':
            return 'green';
        case 'view':
        case 'view-own':
        case 'view-all':
        case 'dashboard':
            return 'blue';
        case 'update':
        case 'config':
        case 'settings':
        case 'assign':
            return 'orange';
        case 'delete':
        case 'cancel':
            return 'red';
        case 'operate':
        case 'approve':
            return 'cyan';
        case 'reset-password':
            return 'purple';
        case 'finance':
        case 'audit-log':
            return 'gold';
        default:
            return 'default';
    }
};

interface RoleAssignmentProps {
    userId?: string;
    value?: number[];
    onChange?: (roleIds: number[]) => void;
    allRoles?: Role[]; // Optional: use parent's allRoles to avoid re-fetch
}

export const RoleAssignment: React.FC<RoleAssignmentProps> = ({
    userId,
    value = [],
    onChange,
    allRoles: parentRoles,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { status, errors } = Form.Item.useStatus();
    const hasError = status === 'error';
    const [loading, setLoading] = useState(!parentRoles); // Start loaded if parent provides roles
    const [fetchedRoles, setFetchedRoles] = useState<Role[]>([]);
    const allRoles = parentRoles ?? fetchedRoles; // Use parent roles if available
    const selectedRoleIds = value;
    const { handleError } = useApiErrorHandler();

    // Fetch all roles - only if not provided by parent
    useEffect(() => {
        if (parentRoles) return; // Skip fetch if parent provides roles

        const fetchRoles = async () => {
            setLoading(true);
            try {
                const roles = await activeRoleService.getRolesForPicking();
                setFetchedRoles(roles);
            } catch (error) {
                handleError(error, { fallbackKey: 'roleManagement.messages.fetchError' });
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, [parentRoles, handleError]);

    // Fetch user's current roles when editing
    useEffect(() => {
        if (userId && allRoles.length > 0) {
            const fetchUserRoles = async () => {
                try {
                    const data = await activeUserService.getRolesAndPermissionsSummary(userId);
                    // Map role names to role IDs
                    const roleIds = allRoles
                        .filter((role) => data.roles?.includes(role.roleName))
                        .map((role) => role.roleId);
                    onChange?.(roleIds);
                } catch (error) {
                    handleError(error, { fallbackKey: 'userManagement.fetchUserError' });
                }
            };
            fetchUserRoles();
        }
    }, [userId, allRoles, onChange, handleError]);

    const handleRoleChange = useCallback(
        (roleId: number, checked: boolean) => {
            const newSelected = checked
                ? [...selectedRoleIds, roleId]
                : selectedRoleIds.filter((id) => id !== roleId);
            onChange?.(newSelected);
        },
        [onChange, selectedRoleIds]
    );

    const handleSelectAll = useCallback(() => {
        const allIds = allRoles.map((r) => r.roleId);
        onChange?.(allIds);
    }, [onChange, allRoles]);

    const handleDeselectAll = useCallback(() => {
        onChange?.([]);
    }, [onChange]);

    // Calculate total permissions from selected roles - MUST be before early returns
    const totalPermissions = useMemo(() => {
        return allRoles
            .filter((role) => selectedRoleIds.includes(role.roleId))
            .reduce((sum, role) => sum + (role.permissions?.length || 0), 0);
    }, [allRoles, selectedRoleIds]);

    const collapseItems: CollapseProps['items'] = useMemo(() => {
        return allRoles.map((role) => {
            const isSelected = selectedRoleIds.includes(role.roleId);
            const permissionCount = role.permissions?.length || 0;
            const groupedPermissions = groupPermissionsBySubject(role.permissions || []);

            return {
                key: role.roleId,
                label: (
                    <Space>
                        <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleRoleChange(role.roleId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Text strong>{role.roleName}</Text>
                        <Text type="secondary">
                            ({permissionCount} {t('roleManagement.form.permissions.label')})
                        </Text>
                    </Space>
                ),
                children: (
                    <div
                        style={{
                            paddingLeft: 24,
                            backgroundColor: isSelected ? token.colorFillTertiary : 'transparent',
                        }}
                    >
                        {role.description && (
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                {role.description}
                            </Text>
                        )}
                        {groupedPermissions.length > 0 ? (
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                {groupedPermissions.map(({ subject, actionCounts }) => (
                                    <div key={subject}>
                                        <Text
                                            strong
                                            style={{
                                                textTransform: 'capitalize',
                                                display: 'inline-block',
                                                minWidth: 120,
                                            }}
                                        >
                                            {subject}:
                                        </Text>
                                        <Space wrap style={{ marginLeft: 8 }}>
                                            {Object.entries(actionCounts)
                                                .sort(([a], [b]) => a.localeCompare(b))
                                                .map(([action, count]) => (
                                                    <Tag
                                                        key={action}
                                                        color={getActionColor(action)}
                                                        style={{ margin: '2px 4px' }}
                                                    >
                                                        {action.toUpperCase()} {count > 1 ? `(${count})` : ''}
                                                    </Tag>
                                                ))}
                                        </Space>
                                    </div>
                                ))}
                            </Space>
                        ) : (
                            <Text type="secondary">{t('common.noData')}</Text>
                        )}
                    </div>
                ),
                style: {
                    borderLeft: isSelected ? `3px solid ${token.colorPrimaryBorder}` : '3px solid transparent',
                    marginBottom: 8,
                },
            };
        });
    }, [allRoles, selectedRoleIds, handleRoleChange, t]);

    if (loading) {
        return (
            <div style={{ border: `1px solid ${token.colorBorder}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <Spin />
            </div>
        );
    }

    if (allRoles.length === 0) {
        return <Empty description={t('common.noData')} />;
    }

    return (
        <div style={{ border: `1px solid ${hasError ? '#ff4d4f' : token.colorBorder}`, borderRadius: 8, padding: 16, transition: 'border-color 0.3s' }}>
            {hasError && (
                <Alert
                    type="error"
                    message={errors?.[0] || t('userManagement.validation.roleRequired')}
                    showIcon
                    style={{ marginBottom: 12 }}
                />
            )}

            {/* Summary Card */}
            <div
                style={{
                    background: selectedRoleIds.length > 0 ? token.colorInfoBg : token.colorFillQuaternary,
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 16,
                    border: `1px solid ${token.colorBorder}`,
                }}
            >
                <Space split="|" size="large">
                    <Text>
                        <Text strong>{selectedRoleIds.length}</Text>
                        <Text type="secondary"> / {allRoles.length} {t('userManagement.roleAssignment.roles')}</Text>
                    </Text>
                    <Text>
                        <Text strong>{totalPermissions}</Text>
                        <Text type="secondary"> {t('roleManagement.form.permissions.label')}</Text>
                    </Text>
                </Space>
            </div>

            {/* Action Buttons */}
            <Space style={{ marginBottom: 16 }}>
                <Button size="small" onClick={handleSelectAll}>
                    {t('roleManagement.form.permissions.selectAll')}
                </Button>
                <Button size="small" onClick={handleDeselectAll}>
                    {t('roleManagement.form.permissions.deselectAll')}
                </Button>
            </Space>

            {/* Roles Collapse - Only expand selected roles by default */}
            <Collapse
                defaultActiveKey={allRoles
                    .filter((r) => selectedRoleIds.includes(r.roleId))
                    .map((r) => r.roleId)}
                items={collapseItems}
            />
        </div>
    );
};
