'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Table, Spin, Grid } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Role, RoleFormData } from '@/types/Role';
import { getRoleTableColumns, RoleTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getRoleFormFields } from './_components/roleFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { RoleService } from '@/services/RoleService';
import { DemoRoleService, USE_MOCK_RBAC } from '@/mockData/admin/rbac';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

const activeRoleService = USE_MOCK_RBAC ? DemoRoleService : RoleService;

const RoleManagementPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: Role | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const { handleError } = useApiErrorHandler();
    const ability = useAbility();
    const { checkPermission } = usePermissionCheck();
    const [loading, setLoading] = useState(false);
    const [roleData, setRoleData] = useState<Role[] | null>(null);
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

    usePageTitle(t('roleManagement.title'));

    const fetchRoles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await activeRoleService.getAllRoles();
            setRoleData(data);
        } catch (error) {
            handleError(error, { fallbackKey: 'roleManagement.messages.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleCreateRole = useCallback(() => {
        if (!checkPermission('create', 'role')) {
            return;
        }

        setModalState({ open: true, mode: 'create', data: null });
    }, [checkPermission]);

    const handleEditRole = useCallback((role: Role) => {
        if (!checkPermission('update', 'role')) {
            return;
        }

        setModalState({
            open: true,
            mode: 'edit',
            data: role,
        });
    }, [checkPermission]);

    const handleDeleteRole = useCallback(
        (role: Role) => {
            if (!checkPermission('delete', 'role')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await activeRoleService.deleteRole(role.roleId);
                        setRoleData((prev) => (prev ?? []).filter((r) => r.roleId !== role.roleId));
                        toast.success(t('roleManagement.messages.deleteSuccess'));
                    } catch (error) {
                        handleError(error, { fallbackKey: 'roleManagement.messages.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [checkPermission, handleError, t]
    );

    const columnProps: RoleTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditRole,
            onDelete: handleDeleteRole,
            t,
            isMobileResponsive,
            ability,
        }),
        [handleEditRole, handleDeleteRole, t, isMobileResponsive, ability]
    );

    const columns = useMemo(() => getRoleTableColumns(columnProps), [columnProps]);

    const filteredRoleData = useMemo(() => {
        if (!roleData) return [];
        if (!searchTerm.trim()) {
            return roleData;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return roleData.filter((role) => {
            const roleName = role.roleName?.toLowerCase() || '';
            const description = role.description?.toLowerCase() || '';

            return roleName.includes(lowerSearchTerm) || description.includes(lowerSearchTerm);
        });
    }, [roleData, searchTerm]);

    const handleFormSubmit = async (data: RoleFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeFormSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeFormSubmit = async (data: RoleFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                const newRole = await activeRoleService.createRole({
                    roleName: data.roleName,
                    description: data.description,
                    permissionIds: data.permissionIds,
                });
                setRoleData((prev) => [...(prev ?? []), newRole]);
                toast.success(t('roleManagement.messages.createSuccess'));
            } else {
                const updatedRole = await activeRoleService.updateRole({
                    roleId: modalState.data!.roleId,
                    description: data.description,
                    permissionIds: data.permissionIds,
                });
                setRoleData((prev) =>
                    (prev ?? []).map((role) =>
                        role.roleId === modalState.data?.roleId ? updatedRole : role
                    )
                );
                toast.success(t('roleManagement.messages.updateSuccess'));
            }
        } catch (error) {
            handleError(error, { fallbackKey: 'roleManagement.messages.saveError' });
            throw error;
        }
    };

    const formFields = useMemo(
        () => getRoleFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    // Convert Role to RoleFormData for the form
    const getInitialFormData = (role: Role | null): RoleFormData | null => {
        if (!role) return null;
        return {
            roleName: role.roleName,
            description: role.description,
            permissionIds: role.permissions?.map((permission) => permission.permissionId) || [],
        };
    };

    const handleConfirmAction = async () => {
        if (!confirmModalState.pendingAction) {
            return;
        }

        try {
            setConfirmModalState((prev) => ({ ...prev, open: false }));
            await confirmModalState.pendingAction();
            setModalState((prev) => ({ ...prev, open: false }));
        } catch {
            // Error already handled in pending action.
        } finally {
            setConfirmModalState({
                open: false,
                type: 'create',
                pendingAction: null,
            });
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
                title={t('roleManagement.title')}
                icon={<TeamOutlined />}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('roleManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="role">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreateRole}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('roleManagement.addRole')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="role">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={handleCreateRole}
                            aria-label={t('roleManagement.addRole')}
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        />
                    </Can>
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
                {roleData === null ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                            width: '100%',
                        }}
                    >
                        <Spin size="large" tip={t('common.loading')} indicator={<LoadingOutlined spin />}>
                            <div />
                        </Spin>
                    </div>
                ) : (
                    <Table<Role>
                        columns={columns}
                        dataSource={filteredRoleData}
                        loading={loading}
                        rowKey="roleId"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: !isMobileResponsive,
                            simple: isMobileResponsive,
                            showTotal: (total) => !isMobileResponsive ? t('roleManagement.pagination.total', { total }) : undefined,
                        }}
                        scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
                        style={{ flex: 1 }}
                    />
                )}
            </Card>

            <EntityFormModal<RoleFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
                onSubmit={handleFormSubmit}
                mode={modalState.mode}
                initialData={getInitialFormData(modalState.data)}
                fields={formFields}
                title={{
                    create: t('roleManagement.form.createTitle'),
                    edit: t('roleManagement.form.editTitle'),
                }}
                width={900}
                t={t}
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

export default RoleManagementPage;
