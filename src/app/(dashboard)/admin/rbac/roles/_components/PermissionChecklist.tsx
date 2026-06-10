import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Collapse, Space, Button, Typography, Spin, Tag, Alert, Form } from 'antd';
import type { CollapseProps } from 'antd';
import { Permission } from '@/types/Permission';
import { PermissionService } from '@/services/PermissionService';
import { DemoPermissionService, USE_MOCK_RBAC } from '@/mockData/admin/rbac';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

const { Text } = Typography;
const activePermissionService = USE_MOCK_RBAC ? DemoPermissionService : PermissionService;

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

interface PermissionChecklistProps {
    value?: number[];
    onChange?: (value: number[]) => void;
}

export const PermissionChecklist: React.FC<PermissionChecklistProps> = ({
    value = [],
    onChange,
}) => {
    const { t } = useTranslation();
    const { status, errors } = Form.Item.useStatus();
    const hasError = status === 'error';
    const selectedPermissions = value;
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const { handleError } = useApiErrorHandler();

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const data = await activePermissionService.getAllPermissions();
                setAllPermissions(data);
            } catch (error) {
                handleError(error, { fallbackKey: 'permissionManagement.messages.fetchError' });
            } finally {
                setLoading(false);
            }
        };
        fetchPermissions();
    }, [handleError]);

    const groupedPermissions = useMemo(() => {
        const subjects = Array.from(
            new Set(allPermissions.map((p) => p.slug.split(':')[0]))
        ).sort();

        return subjects.map((subject) => ({
            subject,
            permissions: allPermissions.filter((p) => p.slug.startsWith(`${subject}:`)),
        }));
    }, [allPermissions]);

    const handlePermissionChange = useCallback(
        (permissionId: number, checked: boolean) => {
            const newSelected = checked
                ? [...selectedPermissions, permissionId]
                : selectedPermissions.filter((id) => id !== permissionId);

            onChange?.(newSelected);
        },
        [onChange, selectedPermissions]
    );

    const handleSubjectToggle = useCallback(
        (subjectPermissions: Permission[]) => {
            const subjectIds = subjectPermissions
                .map((p) => p.permissionId)
                .filter((id): id is number => id !== undefined);
            const allSelected = subjectIds.every((id) => selectedPermissions.includes(id));

            let newSelected;
            if (allSelected) {
                newSelected = selectedPermissions.filter((id) => !subjectIds.includes(id));
            } else {
                newSelected = [...new Set([...selectedPermissions, ...subjectIds])];
            }

            onChange?.(newSelected);
        },
        [onChange, selectedPermissions]
    );

    const handleSelectAll = useCallback(() => {
        const allIds = allPermissions
            .map((p) => p.permissionId)
            .filter((id): id is number => id !== undefined);
        onChange?.(allIds);
    }, [onChange, allPermissions]);

    const handleDeselectAll = useCallback(() => {
        onChange?.([]);
    }, [onChange]);

    const collapseItems: CollapseProps['items'] = useMemo(() => {
        return groupedPermissions.map(({ subject, permissions }) => {
            const subjectIds = permissions
                .map((p) => p.permissionId)
                .filter((id): id is number => id !== undefined);

            const selectedCount = subjectIds.filter((id) =>
                selectedPermissions.includes(id)
            ).length;
            const allSelected = selectedCount === subjectIds.length && subjectIds.length > 0;
            const someSelected = selectedCount > 0 && selectedCount < subjectIds.length;

            return {
                key: subject,
                label: (
                    <Space>
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={() => handleSubjectToggle(permissions)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Text strong>
                            {t(`permissionSubjects.${subject}`, {
                                defaultValue: subject
                                    .split('_')
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' '),
                            })}
                        </Text>
                        <Text type="secondary">
                            ({selectedCount}/{permissions.length})
                        </Text>
                    </Space>
                ),
                children: (
                    <Space direction="vertical" style={{ width: '100%', paddingLeft: 24 }}>
                        {permissions.map((permission) => (
                            <Checkbox
                                key={permission.permissionId}
                                checked={
                                    permission.permissionId !== undefined &&
                                    selectedPermissions.includes(permission.permissionId)
                                }
                                onChange={(e) =>
                                    permission.permissionId !== undefined &&
                                    handlePermissionChange(
                                        permission.permissionId,
                                        e.target.checked
                                    )
                                }
                            >
                                <Space>
                                    <Text>{permission.permissionName}</Text>
                                    <Tag color={getActionColor(permission.slug.split(':')[1])}>
                                        {t(`common.${permission.slug.split(':')[1]}`, {
                                            defaultValue: permission.slug.split(':')[1]?.toUpperCase(),
                                        })}
                                    </Tag>
                                </Space>
                            </Checkbox>
                        ))}
                    </Space>
                ),
            };
        });
    }, [groupedPermissions, selectedPermissions, handleSubjectToggle, handlePermissionChange]);

    if (loading) {
        return (
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: '32px 16px' }}>
                <Spin tip={t('common.loading')}>
                    <div />
                </Spin>
            </div>
        );
    }

    return (
        <div
            style={{
                border: `1px solid ${hasError ? '#ff4d4f' : '#d9d9d9'}`,
                borderRadius: 8,
                padding: 16,
                transition: 'border-color 0.3s',
            }}
        >
            {hasError && (
                <Alert
                    type="error"
                    message={errors?.[0] || t('roleManagement.form.permissions.required')}
                    showIcon
                    style={{ marginBottom: 12 }}
                />
            )}

            <Space style={{ marginBottom: 16 }}>
                <Button size="small" onClick={handleSelectAll}>
                    {t('roleManagement.form.permissions.selectAll')}
                </Button>
                <Button size="small" onClick={handleDeselectAll}>
                    {t('roleManagement.form.permissions.deselectAll')}
                </Button>
                <Text type="secondary">
                    {t('roleManagement.form.permissions.selectedCount', {
                        selected: selectedPermissions.length,
                        total: allPermissions.length,
                    })}
                </Text>
            </Space>

            <Collapse
                items={collapseItems}
            />
        </div>
    );
};
