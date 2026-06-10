import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Space, Tag, Row, Col, Typography, Card, Spin } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { UserPermission } from '@/types/User';
import { Permission } from '@/types/Permission';
import { PermissionService } from '@/services/PermissionService';
import { RoleService } from '@/services/RoleService';
import {
    DemoPermissionService,
    DemoRoleService,
    USE_MOCK_RBAC,
} from '@/mockData/admin/rbac';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Role } from '@/types/Role';
import { ColumnsType } from 'antd/es/table';
import { SearchInput } from '@/components/shared/SearchInput';

const { Text } = Typography;
const activePermissionService = USE_MOCK_RBAC ? DemoPermissionService : PermissionService;
const activeRoleService = USE_MOCK_RBAC ? DemoRoleService : RoleService;

// Helper to extract subject/action from slug
const getPermissionDetails = (slug: string) => {
    const [subject, action] = slug.split(':');
    return { subject: subject || 'Unknown', action: action || 'Unknown' };
};

interface CustomPermissionsProps {
    userId?: string;
    selectedRoles?: number[]; // Roles from Tab 2
    value?: UserPermission[]; // Custom permissions (grant/deny)
    onChange?: (value: UserPermission[]) => void;
    finalPermissionSlugs?: string[]; // Final permissions from API
    grantedPermissionSlugs?: string[]; // Granted permissions from API
    deniedPermissionSlugs?: string[]; // Denied permissions from API
    allRoles?: Role[]; // Optional: use parent's allRoles to avoid re-fetch
}

export const CustomPermissions: React.FC<CustomPermissionsProps> = ({
    userId,
    selectedRoles = [],
    value = [],
    onChange,
    finalPermissionSlugs: _finalPermissionSlugs = [],
    grantedPermissionSlugs = [],
    deniedPermissionSlugs = [],
    allRoles: parentRoles,
}) => {
    const { t } = useTranslation();
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [fetchedRoles, setFetchedRoles] = useState<Role[]>([]);
    const allRoles = parentRoles ?? fetchedRoles; // Use parent roles if available
    const [loading, setLoading] = useState(true);
    const [rolePermSearch, setRolePermSearch] = useState('');
    const [availablePermSearch, setAvailablePermSearch] = useState('');
    const [finalPermSearch, setFinalPermSearch] = useState('');
    const { handleError } = useApiErrorHandler();

    const filterPermissions = useCallback((permissions: Permission[], searchTerm: string) => {
        if (!searchTerm.trim()) return permissions;
        const lower = searchTerm.toLowerCase().trim();
        return permissions.filter(p => {
            const { subject, action } = getPermissionDetails(p.slug);
            return (
                p.permissionName?.toLowerCase().includes(lower) ||
                subject.toLowerCase().includes(lower) ||
                action.toLowerCase().includes(lower)
            );
        });
    }, []);

    // Fetch all permissions (and roles if not provided by parent)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (parentRoles) {
                    // Only fetch permissions if parent provides roles
                    const permissions = await activePermissionService.getAllPermissions();
                    setAllPermissions(permissions);
                } else {
                    // Fetch both if no parent roles
                    const [permissions, roles] = await Promise.all([
                        activePermissionService.getAllPermissions(),
                        activeRoleService.getRolesForPicking(),
                    ]);
                    setAllPermissions(permissions);
                    setFetchedRoles(roles);
                }
            } catch (error) {
                handleError(error, { fallbackKey: 'permissionManagement.messages.fetchError' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [parentRoles, handleError]);

    // Get permissions from selected roles
    const rolePermissions = useMemo(() => {
        const permissionIds = new Set<number>();
        selectedRoles.forEach(roleId => {
            const role = allRoles.find(r => r.roleId === roleId);
            if (role) {
                role.permissions?.forEach(p => {
                    if (p.permissionId) {
                        permissionIds.add(p.permissionId);
                    }
                });
            }
        });
        return allPermissions.filter(p => p.permissionId && permissionIds.has(p.permissionId));
    }, [selectedRoles, allRoles, allPermissions]);

    // Get available permissions (not in roles)
    const availablePermissions = useMemo(() => {
        const rolePermissionIds = new Set(
            rolePermissions.map(p => p.permissionId).filter((id): id is number => id !== undefined)
        );
        return allPermissions.filter(p => p.permissionId && !rolePermissionIds.has(p.permissionId));
    }, [rolePermissions, allPermissions]);

    const filteredRolePermissions = useMemo(
        () => filterPermissions(rolePermissions, rolePermSearch),
        [rolePermissions, rolePermSearch, filterPermissions]
    );

    const filteredAvailablePermissions = useMemo(
        () => filterPermissions(availablePermissions, availablePermSearch),
        [availablePermissions, availablePermSearch, filterPermissions]
    );

    // Initialize value from API slugs once permissions are loaded
    useEffect(() => {
        if (!loading && allPermissions.length > 0 && value.length === 0) {
            const initialCustomPermissions: UserPermission[] = [];

            // Map granted slugs to IDs
            grantedPermissionSlugs.forEach(slug => {
                const permission = allPermissions.find(p => p.slug === slug);
                if (permission?.permissionId) {
                    initialCustomPermissions.push({
                        userPermissionId: 0, // Temp ID
                        userId: userId || '',
                        permissionId: permission.permissionId,
                        permissionType: 'grant',
                        createdAt: new Date().toISOString()
                    });
                }
            });

            // Map denied slugs to IDs
            deniedPermissionSlugs.forEach(slug => {
                const permission = allPermissions.find(p => p.slug === slug);
                if (permission?.permissionId) {
                    initialCustomPermissions.push({
                        userPermissionId: 0, // Temp ID
                        userId: userId || '',
                        permissionId: permission.permissionId,
                        permissionType: 'deny',
                        createdAt: new Date().toISOString()
                    });
                }
            });

            if (initialCustomPermissions.length > 0) {
                onChange?.(initialCustomPermissions);
            }
        }
    }, [loading, allPermissions, grantedPermissionSlugs, deniedPermissionSlugs, userId]); // Removed value dependency to prevent loops

    // Calculate final permissions
    const finalPermissions = useMemo(() => {
        const result = new Map<number, { permission: Permission; source: string; type?: 'grant' | 'deny' }>();

        // 1. Add all Role Permissions
        rolePermissions.forEach(p => {
            if (p.permissionId) {
                result.set(p.permissionId, {
                    permission: p,
                    source: t('userManagement.customPermissions.tags.role')
                });
            }
        });

        // 2. Remove Denied Permissions (Roles - Denied)
        value.forEach(up => {
            if (up.permissionType === 'deny' && up.permissionId) {
                result.delete(up.permissionId);
            }
        });

        // 3. Add Granted Permissions (+ Available Granted)
        value.forEach(up => {
            if (up.permissionType === 'grant' && up.permissionId) {
                const permission = allPermissions.find(p => p.permissionId === up.permissionId);
                if (permission) {
                    result.set(up.permissionId, {
                        permission: permission,
                        source: t('userManagement.customPermissions.tags.customGrant'),
                        type: 'grant'
                    });
                }
            }
        });

        return Array.from(result.values());
    }, [rolePermissions, value, allPermissions, t]);

    const filteredFinalPermissions = useMemo(() => {
        if (!finalPermSearch.trim()) return finalPermissions;
        const lower = finalPermSearch.toLowerCase().trim();
        return finalPermissions.filter(item => {
            const { subject, action } = getPermissionDetails(item.permission.slug);
            return (
                item.permission.permissionName?.toLowerCase().includes(lower) ||
                subject.toLowerCase().includes(lower) ||
                action.toLowerCase().includes(lower)
            );
        });
    }, [finalPermissions, finalPermSearch]);

    const handleGrant = (permission: Permission) => {
        if (!permission.permissionId) return;

        const newPermission: UserPermission = {
            userPermissionId: Math.max(...value.map(p => p.userPermissionId), 0) + 1,
            userId: userId || 'temp-user',
            permissionId: permission.permissionId,
            permissionType: 'grant',
            reason: 'Granted via UI',
            grantedBy: 'current-admin',
            grantedByName: 'Current Admin',
            createdAt: new Date().toISOString(),
        };
        onChange?.([...value, newPermission]);
    };

    const handleDeny = (permission: Permission) => {
        if (!permission.permissionId) return;

        const newPermission: UserPermission = {
            userPermissionId: Math.max(...value.map(p => p.userPermissionId), 0) + 1,
            userId: userId || 'temp-user',
            permissionId: permission.permissionId,
            permissionType: 'deny',
            reason: 'Denied via UI',
            grantedBy: 'current-admin',
            grantedByName: 'Current Admin',
            createdAt: new Date().toISOString(),
        };
        onChange?.([...value, newPermission]);
    };

    const handleRemoveCustom = (permissionId: number) => {
        onChange?.(value.filter(p => p.permissionId !== permissionId));
    };

    // Check if permission has custom override
    const getCustomPermission = (permissionId: number) => {
        return value.find(p => p.permissionId === permissionId);
    };

    // Columns for Role Permissions (Bảng 1)
    const rolePermissionColumns: ColumnsType<Permission> = [
        {
            title: t('userManagement.customPermissions.columns.permissionName'),
            dataIndex: 'permissionName',
            key: 'permissionName',
            width: '30%',
        },
        {
            title: t('userManagement.customPermissions.columns.subject'),
            key: 'subject',
            width: '15%',
            render: (_, record) => getPermissionDetails(record.slug).subject,
        },
        {
            title: t('userManagement.customPermissions.columns.action'),
            key: 'action',
            width: '12%',
            render: (_, record) => (
                <Tag color="blue">{getPermissionDetails(record.slug).action.toUpperCase()}</Tag>
            ),
        },
        {
            title: t('userManagement.customPermissions.columns.source'),
            key: 'source',
            width: '15%',
            render: (_: any, record: Permission) => {
                if (!record.permissionId) return null;
                // Find which roles contain this permission
                const rolesWithPermission = selectedRoles
                    .map(roleId => allRoles.find(r => r.roleId === roleId))
                    .filter(role =>
                        role && role.permissions?.some(p => p.permissionId === record.permissionId)
                    )
                    .map(role => role!.roleName);

                return (
                    <Space size={[0, 4]} wrap>
                        {rolesWithPermission.map(roleName => (
                            <Tag key={roleName} color="green">{roleName}</Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: t('userManagement.customPermissions.columns.status'),
            key: 'status',
            width: '10%',
            render: (_: any, record: Permission) => {
                const custom = getCustomPermission(record.permissionId!);

                // Only show DENIED if user explicitly denied this role permission
                if (custom?.permissionType === 'deny') {
                    return <Tag color="red">{t('userManagement.customPermissions.tags.denied')}</Tag>;
                }

                return null;
            },
        },
        {
            title: t('userManagement.customPermissions.columns.actions'),
            key: 'actions',
            width: '18%',
            render: (_: any, record: Permission) => {
                if (!record.permissionId) return null;
                const custom = getCustomPermission(record.permissionId);

                // If denied, show Grant button which effectively removes the deny
                if (custom?.permissionType === 'deny') {
                    return (
                        <Button
                            size="small"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleRemoveCustom(record.permissionId!)}
                        >
                            {t('userManagement.customPermissions.actions.grant')}
                        </Button>
                    );
                }

                // Default: show deny button
                return (
                    <Button
                        size="small"
                        danger
                        icon={<MinusOutlined />}
                        onClick={() => handleDeny(record)}
                    >
                        {t('userManagement.customPermissions.actions.deny')}
                    </Button>
                );
            },
        },
    ];

    // Columns for Available Permissions (Bảng 2)
    const availablePermissionColumns: ColumnsType<Permission> = [
        {
            title: t('userManagement.customPermissions.columns.permissionName'),
            dataIndex: 'permissionName',
            key: 'permissionName',
            width: '30%',
        },
        {
            title: t('userManagement.customPermissions.columns.subject'),
            key: 'subject',
            width: '15%',
            render: (_, record) => getPermissionDetails(record.slug).subject,
        },
        {
            title: t('userManagement.customPermissions.columns.action'),
            key: 'action',
            width: '12%',
            render: (_, record) => (
                <Tag color="blue">{getPermissionDetails(record.slug).action.toUpperCase()}</Tag>
            ),
        },
        {
            title: t('userManagement.customPermissions.columns.status'),
            key: 'status',
            width: '10%',
            render: (_: any, record: Permission) => {
                const custom = getCustomPermission(record.permissionId!);

                // Only show GRANTED if user explicitly granted this available permission
                if (custom?.permissionType === 'grant') {
                    return <Tag color="green">{t('userManagement.customPermissions.tags.granted')}</Tag>;
                }

                return null;
            },
        },
        {
            title: t('userManagement.customPermissions.columns.actions'),
            key: 'actions',
            width: '33%',
            render: (_: any, record: Permission) => {
                if (!record.permissionId) return null;
                const custom = getCustomPermission(record.permissionId);

                // If granted, show Remove button
                if (custom?.permissionType === 'grant') {
                    return (
                        <Button
                            size="small"
                            onClick={() => handleRemoveCustom(record.permissionId!)}
                        >
                            {t('userManagement.customPermissions.actions.remove')}
                        </Button>
                    );
                }

                // Default: show Grant button
                return (
                    <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleGrant(record)}
                    >
                        {t('userManagement.customPermissions.actions.grant')}
                    </Button>
                );
            },
        },
    ];

    // Columns for Final Permissions (Bảng 3)
    const finalPermissionColumns: ColumnsType<{ permission: Permission; source: string; type?: 'grant' | 'deny' }> = [
        {
            title: t('userManagement.customPermissions.columns.permissionName'),
            key: 'permissionName',
            width: '35%',
            render: (_, record) => record.permission.permissionName,
        },
        {
            title: t('userManagement.customPermissions.columns.subject'),
            key: 'subject',
            width: '20%',
            render: (_, record) => getPermissionDetails(record.permission.slug).subject,
        },
        {
            title: t('userManagement.customPermissions.columns.action'),
            key: 'action',
            width: '15%',
            render: (_, record) => (
                <Tag color="blue">{getPermissionDetails(record.permission.slug).action.toUpperCase()}</Tag>
            ),
        },
        {
            title: t('userManagement.customPermissions.columns.source'),
            key: 'source',
            width: '30%',
            render: (_, record) => {
                const isFromRole = rolePermissions.some(p => p.slug === record.permission.slug);
                const isGranted = grantedPermissionSlugs.includes(record.permission.slug);

                // Determine source type
                if (isFromRole && isGranted) {
                    return <Tag color="purple">{t('userManagement.customPermissions.tags.roleAndGranted')}</Tag>;
                } else if (isGranted) {
                    return <Tag color="green">{t('userManagement.customPermissions.tags.explicitlyGranted')}</Tag>;
                } else if (isFromRole) {
                    return <Tag color="blue">{t('userManagement.customPermissions.tags.fromRole')}</Tag>;
                }

                // Fallback to original logic
                return (
                    <Tag color={record.source === t('userManagement.customPermissions.tags.role') ? 'blue' : 'orange'}>
                        {record.source}
                    </Tag>
                );
            },
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
                {/* Bảng 1: Role Permissions */}
                <Col xs={24} md={12}>
                    <Card size="small" title={
                        <Space>
                            <Text strong>{t('userManagement.customPermissions.rolePermissionsTitle')}</Text>
                            <Tag color="blue">{rolePermissions.length}</Tag>
                        </Space>
                    }>
                        <div style={{ marginBottom: 12 }}>
                            <SearchInput
                                placeholder={t('userManagement.customPermissions.searchPlaceholder')}
                                value={rolePermSearch}
                                onChange={setRolePermSearch}
                                width="100%"
                            />
                        </div>
                        <Table
                            columns={rolePermissionColumns}
                            dataSource={filteredRolePermissions}
                            rowKey={(record) => record.permissionId ?? record.slug}
                            pagination={{ pageSize: 5, size: 'small' }}
                            size="small"
                            scroll={{ x: 'max-content', y: 250 }}
                        />
                    </Card>
                </Col>

                {/* Bảng 2: Available Permissions */}
                <Col xs={24} md={12}>
                    <Card size="small" title={
                        <Space>
                            <Text strong>{t('userManagement.customPermissions.availablePermissionsTitle')}</Text>
                            <Tag color="orange">{availablePermissions.length}</Tag>
                        </Space>
                    }>
                        <div style={{ marginBottom: 12 }}>
                            <SearchInput
                                placeholder={t('userManagement.customPermissions.searchPlaceholder')}
                                value={availablePermSearch}
                                onChange={setAvailablePermSearch}
                                width="100%"
                            />
                        </div>
                        <Table
                            columns={availablePermissionColumns}
                            dataSource={filteredAvailablePermissions}
                            rowKey={(record) => record.permissionId ?? record.slug}
                            pagination={{ pageSize: 5, size: 'small' }}
                            size="small"
                            scroll={{ x: 'max-content', y: 250 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Bảng 3: Final Permissions Summary */}
            <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card size="small" title={
                        <Space>
                            <Text strong>{t('userManagement.customPermissions.finalPermissionsTitle')}</Text>
                            <Tag color="purple">{finalPermissions.length} {t('common.total')}</Tag>
                        </Space>
                    }>
                        <div style={{ marginBottom: 12 }}>
                            <SearchInput
                                placeholder={t('userManagement.customPermissions.searchPlaceholder')}
                                value={finalPermSearch}
                                onChange={setFinalPermSearch}
                                width="100%"
                            />
                        </div>
                        <Table
                            columns={finalPermissionColumns}
                            dataSource={filteredFinalPermissions}
                            rowKey={(record) => record.permission.permissionId ?? record.permission.slug}
                            pagination={{ pageSize: 8, size: 'small' }}
                            size="small"
                            scroll={{ x: 'max-content', y: 300 }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
