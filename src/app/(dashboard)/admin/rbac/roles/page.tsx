'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Table, Spin, Grid } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Role, RoleFormData } from '@/types/Role';
import {
    getRoleTableColumns,
    type RoleTableColumnProps,
    getRoleFormFields,
} from '@/features/dashboard/rbac/roles';
import { EntityFormModal } from '@/components/shared/FormModal';
import { SearchInput } from '@/components/shared/SearchInput';
import AdvancedFilterPanel, {
    FilterField,
} from '@/components/shared/filters/AdvancedFilterPanel';
import { RoleService } from '@/services';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';

const RoleManagementPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: Role | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [roleData, setRoleData] = useState<Role[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [roleNameFilter, setRoleNameFilter] = useState<string | undefined>(undefined);
    const [roleDescriptionFilter, setRoleDescriptionFilter] = useState<string | undefined>(
        undefined
    );

    const activeFilterCount = [roleNameFilter, roleDescriptionFilter].filter(Boolean).length;
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
        setLoading(true);
        try {
            const data = await RoleService.getAllRoles();
            setRoleData(data);
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error(t('roleManagement.messages.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Handle Edit Action
    const handleEditRole = useCallback((role: Role) => {
        setModalState({
            open: true,
            mode: 'edit',
            data: role,
        });
    }, []);

    // Handle Delete Action
    const handleDeleteRole = useCallback(
        (role: Role) => {
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await RoleService.deleteRole(role.roleId!);
                        setRoleData(prev => (prev ?? []).filter(r => r.roleId !== role.roleId));
                        toast.success(t('roleManagement.messages.deleteSuccess'));
                    } catch (error) {
                        console.error('Error deleting role:', error);
                        toast.error(t('roleManagement.messages.deleteError'));
                        throw error;
                    }
                },
            });
        },
        [t]
    );

    const columnProps: RoleTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditRole,
            onDelete: handleDeleteRole,
            t,
            isMobileResponsive,
        }),
        [handleEditRole, handleDeleteRole, t, isMobileResponsive]
    );

    const columns = useMemo(() => getRoleTableColumns(columnProps), [columnProps]);

    const filteredRoleData = useMemo(() => {
        if (!roleData) return [];
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const nameFilter = roleNameFilter?.toLowerCase();
        const descriptionFilter = roleDescriptionFilter?.toLowerCase();
        return roleData.filter((role) => {
            const roleName = role.roleName?.toLowerCase() || '';
            const description = role.description?.toLowerCase() || '';

            const matchesSearch =
                !lowerSearchTerm ||
                roleName.includes(lowerSearchTerm) ||
                description.includes(lowerSearchTerm);
            const matchesName = !nameFilter || roleName.includes(nameFilter);
            const matchesDescription = !descriptionFilter || description.includes(descriptionFilter);
            return matchesSearch && matchesName && matchesDescription;
        });
    }, [roleData, searchTerm, roleNameFilter, roleDescriptionFilter]);

    const filterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'roleName',
                label: t('roleManagement.columns.name'),
                placeholder: t('roleManagement.form.roleName.placeholder'),
                value: roleNameFilter ?? '',
                onChange: (val) => setRoleNameFilter(val.trim() || undefined),
            },
            {
                key: 'description',
                label: t('roleManagement.columns.description'),
                placeholder: t('roleManagement.form.description.placeholder'),
                value: roleDescriptionFilter ?? '',
                onChange: (val) => setRoleDescriptionFilter(val.trim() || undefined),
            },
        ],
        [t, roleNameFilter, roleDescriptionFilter]
    );

    const handleResetFilters = useCallback(() => {
        setRoleNameFilter(undefined);
        setRoleDescriptionFilter(undefined);
    }, []);

    const handleApplyFilters = useCallback(() => {}, []);

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
                const newRole = await RoleService.createRole({
                    roleName: data.roleName,
                    description: data.description,
                    permissionIds: data.permissionIds,
                });
                setRoleData(prev => [...(prev ?? []), newRole]);
                toast.success(t('roleManagement.messages.createSuccess'));
            } else {
                const updatedRole = await RoleService.updateRole({
                    roleId: modalState.data!.roleId,
                    description: data.description,
                    permissionIds: data.permissionIds,
                });
                setRoleData(prev =>
                    (prev ?? []).map(r =>
                        r.roleId === modalState.data?.roleId
                            ? updatedRole
                            : r
                    )
                );
                toast.success(t('roleManagement.messages.updateSuccess'));
            }
        } catch (error) {
            console.error('Error submitting role:', error);
            toast.error(t('roleManagement.messages.saveError'));
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
            permissionIds: role.permissions?.map(p => p.permissionId) || [],
        };
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
                            showFilterIcon
                            onFilterClick={() => setShowAdvancedFilters((prev) => !prev)}
                            isFilterActive={showAdvancedFilters}
                            activeFilterCount={activeFilterCount}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                setModalState({ open: true, mode: 'create', data: null })
                            }
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        >
                            {t('roleManagement.addRole')}
                        </Button>
                    </div>
                }
                rightContentMobile={
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                        aria-label={t('roleManagement.addRole')}
                        style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                    />
                }
            />

            {showAdvancedFilters && (
                <AdvancedFilterPanel
                    fields={filterFields}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    resetLabel={t('common.reset')}
                    applyLabel={t('common.search')}
                    title={t('common.advancedFilters')}
                />
            )}

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
                        <Spin size="large" description={t('common.loading')} indicator={<LoadingOutlined spin />}>
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
                onOpenChange={(open) => setModalState({ ...modalState, open })}
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
