'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Table, Spin, Grid } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Permission, PermissionFormData } from '@/types/Permission';
import { getPermissionTableColumns, PermissionTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getPermissionFormFields } from './_components/permissionFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { PermissionService } from '@/services';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { getApiErrorMessage } from '@/utils/apiError';

const toSnakeCase = (str: string): string => {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .replace(/^_/, '');
};

const PermissionManagementPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: Permission | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(false);
    const [permissionData, setPermissionData] = useState<Permission[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'create',
        pendingAction: null,
    });
    const screens = Grid.useBreakpoint();
    const isMobileResponsive = !screens.md;

    usePageTitle(t('permissionManagement.title'));

    const fetchPermissions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await PermissionService.getAllPermissions();
            setPermissionData(data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error(t('permissionManagement.messages.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    // Handle Edit Action
    const handleEditPermission = useCallback((permission: Permission) => {
        setModalState({
            open: true,
            mode: 'edit',
            data: permission,
        });
    }, []);

    // Handle Delete Action
    const handleDeletePermission = useCallback(
        (permission: Permission) => {
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await PermissionService.deletePermission(permission.permissionId!);
                        setPermissionData((prev) =>
                            (prev ?? []).filter((p) => p.permissionId !== permission.permissionId)
                        );
                        toast.success(t('permissionManagement.messages.deleteSuccess'));
                    } catch (error) {
                        console.error('Error deleting permission:', error);
                        toast.error(t('permissionManagement.messages.deleteError'));
                        throw error;
                    }
                },
            });
        },
        [t]
    );

    const columnProps: PermissionTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditPermission,
            onDelete: handleDeletePermission,
            t,
            isMobileResponsive,
        }),
        [handleEditPermission, handleDeletePermission, t, isMobileResponsive]
    );

    const columns = useMemo(() => getPermissionTableColumns(columnProps), [columnProps]);

    const filteredPermissionData = useMemo(() => {
        if (!permissionData) return [];
        if (!searchTerm.trim()) {
            return permissionData;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return permissionData.filter((permission) => {
            const permissionName = permission.permissionName?.toLowerCase() || '';
            const slug = permission.slug?.toLowerCase() || '';
            const description = permission.description?.toLowerCase() || '';

            return (
                permissionName.includes(lowerSearchTerm) ||
                slug.includes(lowerSearchTerm) ||
                description.includes(lowerSearchTerm)
            );
        });
    }, [permissionData, searchTerm]);

    const groupedPermissionData = useMemo(() => {
        if (!filteredPermissionData) return [];

        const groups: Record<string, Permission[]> = {};
        filteredPermissionData.forEach((p) => {
            const [subject] = p.slug.split(':');
            // Normalize subject key to ensure TaoNhaMay and tao_nha_may group together
            const subjectKey = toSnakeCase(subject || 'other');
            if (!groups[subjectKey]) groups[subjectKey] = [];
            groups[subjectKey].push(p);
        });

        return Object.entries(groups).map(([subjectKey, permissions]) => {
            // Capitalize subject for display
            const displaySubject = t(`permissionSubjects.${subjectKey}`, { defaultValue: subjectKey.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') });

            // Sort permissions within the group
            const sortedPermissions = [...permissions].sort((a, b) =>
                a.permissionName.localeCompare(b.permissionName)
            );

            return {
                permissionId: `group-${subjectKey}`,
                permissionName: displaySubject,
                slug: `${subjectKey}:*`,
                description: '',
                children: sortedPermissions,
            };
        });
    }, [filteredPermissionData]);

    const handleFormSubmit = async (data: PermissionFormData, mode: 'create' | 'edit') => {
        // Validate action before showing confirmation
        const actions = Array.isArray(data.action) ? data.action : [];
        const hasAction = actions.length > 0 || data.customAction?.trim() || data.action;

        if (!hasAction) {
            toast.error(t('permissionManagement.form.action.required'));
            return;
        }

        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeFormSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeFormSubmit = async (data: PermissionFormData, mode: 'create' | 'edit') => {
        try {
            const actions = Array.isArray(data.action)
                ? data.action
                : [data.customAction?.trim() || (data.action as string) || ''];

            if (mode === 'create') {
                const results: Permission[] = [];
                const errors: string[] = [];

                for (const action of actions) {
                    if (!action) continue;
                    const slug = `${toSnakeCase(data.subject)}:${action}`;

                    // Use user provided name. If multiple actions, append action to make unique.
                    const permissionName =
                        actions.length > 1
                            ? `${data.permissionName} (${t(`common.${action}`)})`
                            : data.permissionName;

                    try {
                        const newPermission = await PermissionService.createPermission({
                            slug,
                            permissionName,
                            description: data.description,
                        });
                        results.push(newPermission);
                    } catch (error: any) {
                        const errorData = error?.response?.data;
                        if (errorData?.code === 2001) {
                            errors.push(getApiErrorMessage(error, slug));
                        } else {
                            throw error;
                        }
                    }
                }

                if (results.length > 0) {
                    setPermissionData((prev) => [...(prev ?? []), ...results]);
                    toast.success(
                        actions.length > 1
                            ? t('permissionManagement.messages.batchCreateSuccess', {
                                count: results.length,
                            })
                            : t('permissionManagement.messages.createSuccess')
                    );
                }

                if (errors.length > 0) {
                    toast.error(errors.join('\n'));
                }
            } else {
                const action = actions[0];
                const slug = `${toSnakeCase(data.subject)}:${action}`;
                const updatedPermission = await PermissionService.updatePermission({
                    ...modalState.data!,
                    slug,
                    permissionName: data.permissionName,
                    description: data.description,
                });
                setPermissionData((prev) =>
                    (prev ?? []).map((p) =>
                        p.permissionId === modalState.data?.permissionId ? updatedPermission : p
                    )
                );
                toast.success(t('permissionManagement.messages.updateSuccess'));
            }
        } catch (error: any) {
            console.error('Error submitting permission:', error);

            // Handle duplicate permission error (code 2001)
            const errorData = (error as any)?.response?.data;
            if (errorData?.code === 2001) {
                const conflictValue = errorData?.result?.conflictValue || '';
                handleError(error, {
                    fallbackKey: 'permissionManagement.messages.duplicateError',
                    customMappings: { 409: `permissionManagement.messages.duplicateError` },
                });
            } else {
                handleError(error, { fallbackKey: 'permissionManagement.messages.saveError' });
            }
            throw error;
        }
    };

    const formFields = useMemo(
        () => getPermissionFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    // Transform Permission to PermissionFormData for editing
    const getInitialFormData = (permission: Permission | null): PermissionFormData | null => {
        if (!permission) return null;

        const [subject, action] = permission.slug.split(':');

        // Predefined actions that appear in the dropdown
        const predefinedActions = ['create', 'view', 'update', 'delete'];
        const isPredefinedAction = predefinedActions.includes(action);

        const formData: PermissionFormData = {
            permissionName: permission.permissionName,
            description: permission.description,
            subject: subject || '',
            action: isPredefinedAction ? action : '',
            customAction: isPredefinedAction ? '' : action,
        };

        return formData;
    };

    const handleConfirmAction = async () => {
        if (confirmModalState.pendingAction) {
            try {
                setConfirmModalState((prev) => ({ ...prev, open: false }));
                await confirmModalState.pendingAction();
                setModalState((prev) => ({ ...prev, open: false }));
                setConfirmModalState({
                    open: false,
                    type: 'create',
                    pendingAction: null,
                });
            } catch {
                setConfirmModalState({
                    open: false,
                    type: 'create',
                    pendingAction: null,
                });
            }
        }
    };

    const handleCancelConfirm = () => {
        setConfirmModalState({
            open: false,
            type: 'create',
            pendingAction: null,
        });
    };

    return (
        <>
            <ResponsivePageHeader
                title={t('permissionManagement.title')}
                icon={<SafetyOutlined />}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('permissionManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Button
                            color="primary"
                            variant="solid"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                setModalState({ open: true, mode: 'create', data: null })
                            }
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        >
                            {t('permissionManagement.addPermission')}
                        </Button>
                    </div>
                }
                rightContentMobile={
                    <Button
                        color="primary"
                        variant="solid"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                        aria-label={t('permissionManagement.addPermission')}
                        style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                    />
                }
            />

            <Card
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                styles={{
                    body: {
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        paddingBottom: 0,
                    },
                }}
            >
                {permissionData === null ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                        }}
                    >
                        <Spin size="large" indicator={<LoadingOutlined spin />} />
                    </div>
                ) : (
                    <Table<any>
                        columns={columns}
                        dataSource={groupedPermissionData}
                        loading={loading}
                        rowKey="permissionId"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: !isMobileResponsive,
                            simple: isMobileResponsive,
                            showTotal: (total) =>
                                !isMobileResponsive ? t('permissionManagement.pagination.total', { total }) : undefined,
                        }}
                        scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
                        style={{ flex: 1 }}
                        onRow={(record) => ({
                            style: record.children
                                ? { backgroundColor: 'var(--ant-color-fill-alter)', fontWeight: 500 }
                                : undefined,
                        })}
                    />
                )}
            </Card>

            <EntityFormModal<PermissionFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleFormSubmit}
                mode={modalState.mode}
                initialData={getInitialFormData(modalState.data)}
                fields={formFields}
                title={{
                    create: t('permissionManagement.form.createTitle'),
                    edit: t('permissionManagement.form.editTitle'),
                }}
                width={700}
                t={t}
                auditMetaData={modalState.data?.auditMetaData}
            />

            <ConfirmModal
                open={confirmModalState.open}
                type={confirmModalState.type}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelConfirm}
                t={t}
            />
        </>
    );
};

export default PermissionManagementPage;
