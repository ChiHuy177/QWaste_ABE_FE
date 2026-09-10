'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Table, Modal, Tabs, Spin, Form, Grid } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { UserOutlined, LoadingOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { UserWithRBAC, UserProfile } from '@/types/User';
import { getUserTableColumns, UserTableColumnProps } from './_components/Columns';
import { SearchInput } from '@/components/shared/SearchInput';
import { RoleAssignment } from './_components/RoleAssignment';
import { CustomPermissions } from './_components/CustomPermissions';
import { UserBasicInfo } from './_components/UserBasicInfo';
import { UserService, RoleService } from '@/services';
import { UserPermission } from '@/types/User';
import { Role } from '@/types/Role';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { isRequestCancelled } from '@/utils/apiError';

const UserManagementPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: UserWithRBAC | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<UserWithRBAC[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [customPermissions, setCustomPermissions] = useState<UserPermission[]>([]);
    const [detailedUserData, setDetailedUserData] = useState<UserProfile | null>(null);
    const [loadingUserDetails, setLoadingUserDetails] = useState(false);
    const [finalPermissionSlugs, setFinalPermissionSlugs] = useState<string[]>([]);
    const [grantedPermissionSlugs, setGrantedPermissionSlugs] = useState<string[]>([]);
    const [deniedPermissionSlugs, setDeniedPermissionSlugs] = useState<string[]>([]);
    const [roleForm] = Form.useForm();
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'edit',
        pendingAction: null,
    });
    const screens = Grid.useBreakpoint();
    const isMobileResponsive = !screens.md;

    usePageTitle(t('userManagement.title'));

    useEffect(() => {
        RoleService.getRolesForPicking()
            .then(setAllRoles)
            .catch((error) => {
                console.error('Error fetching roles:', error);
            });
    }, []);

    useEffect(() => {
        let cancelled = false;
        const currentUserId = modalState.data?.userId;

        const fetchUserDetails = async () => {
            if (modalState.open && currentUserId && allRoles.length > 0) {
                setLoadingUserDetails(true);
                try {
                    const [userDetails, rolesPermissionsSummary] = await Promise.all([
                        UserService.getStaffById(currentUserId),
                        UserService.getRolesAndPermissionsSummary(currentUserId),
                    ]);

                    if (cancelled) return;

                    setDetailedUserData(userDetails);

                    if (rolesPermissionsSummary.roles && rolesPermissionsSummary.roles.length > 0) {
                        const roleIds = allRoles
                            .filter((role) => rolesPermissionsSummary.roles.includes(role.roleName))
                            .map((role) => role.roleId)
                            .filter((id): id is number => id !== undefined);

                        setSelectedRoleIds(roleIds);
                        console.log('Mapped role IDs:', roleIds);
                    }

                    if (rolesPermissionsSummary.allTypePermissions?.finalPermissions) {
                        setFinalPermissionSlugs(
                            rolesPermissionsSummary.allTypePermissions.finalPermissions
                        );
                        console.log(
                            'Final Permissions:',
                            rolesPermissionsSummary.allTypePermissions.finalPermissions
                        );
                    }

                    if (rolesPermissionsSummary.allTypePermissions?.grantedPermissions) {
                        setGrantedPermissionSlugs(
                            rolesPermissionsSummary.allTypePermissions.grantedPermissions
                        );
                        console.log(
                            'Granted Permissions:',
                            rolesPermissionsSummary.allTypePermissions.grantedPermissions
                        );
                    }

                    if (rolesPermissionsSummary.allTypePermissions?.deniedPermissions) {
                        setDeniedPermissionSlugs(
                            rolesPermissionsSummary.allTypePermissions.deniedPermissions
                        );
                        console.log(
                            'Denied Permissions:',
                            rolesPermissionsSummary.allTypePermissions.deniedPermissions
                        );
                    }

                    console.log('Roles & Permissions Summary:', rolesPermissionsSummary);
                } catch (error: unknown) {
                    if (cancelled) return;
                    if (isRequestCancelled(error)) {
                        return;
                    }
                    console.error('Error fetching user details:', error);
                    toast.error(t('userManagement.fetchUserError'));
                } finally {
                    if (!cancelled) {
                        setLoadingUserDetails(false);
                    }
                }
            } else if (!modalState.open) {
                setDetailedUserData(null);
                setSelectedRoleIds([]);
                setCustomPermissions([]);
                setFinalPermissionSlugs([]);
                setGrantedPermissionSlugs([]);
                setDeniedPermissionSlugs([]);
            }
        };

        fetchUserDetails();

        return () => {
            cancelled = true;
        };
    }, [modalState.open, modalState.data?.userId, allRoles]);

    // Convert UserProfile to UserWithRBAC
    const mapUserProfileToRBAC = (user: UserProfile): UserWithRBAC => {
        const nameParts = user.fullname?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
            ...user,
            firstName,
            lastName,
            roleIds: user.roles ? [] : [],
            customPermissions: [],
        };
    };

    // Fetch users from API
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await UserService.getAllStaff();
            const activeUsers = data.filter((user) => !user.softDeleteMetaData?.isDeleted);
            const mappedData = activeUsers.map(mapUserProfileToRBAC);
            setUserData(mappedData);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error(t('userManagement.messages.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle Edit Action
    const handleEditUser = useCallback((user: UserWithRBAC) => {
        setModalState({
            open: true,
            mode: 'edit',
            data: user,
        });
        setActiveTab('1');
    }, []);

    // Handle Delete Action
    // const handleDeleteUser = useCallback((user: UserWithRBAC) => {
    //     setConfirmModalState({
    //         open: true,
    //         type: 'delete',
    //         pendingAction: async () => {
    //             try {
    //                 setUserData((prev) => (prev ?? []).filter((u) => u.userId !== user.userId));
    //                 toast.success(t('userManagement.messages.deleteSuccess'));
    //             } catch (error) {
    //                 console.error('Error deleting user:', error);
    //                 toast.error(t('userManagement.messages.deleteError'));
    //                 throw error;
    //             }
    //         },
    //     });
    // }, [t]);

    const columnProps: UserTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditUser,
            // onDelete: handleDeleteUser,
            t,
            isMobileResponsive,
        }),
        // [handleEditUser, handleDeleteUser, t, isMobileResponsive]
        [handleEditUser, t, isMobileResponsive]
    );

    const columns = useMemo(() => getUserTableColumns(columnProps), [columnProps]);

    const filteredUserData = useMemo(() => {
        if (!userData) return [];
        if (!searchTerm.trim()) {
            return userData;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return userData.filter((user) => {
            const username = user.username?.toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const fullname = `${user.firstName} ${user.lastName}`.toLowerCase();

            return (
                username.includes(lowerSearchTerm) ||
                email.includes(lowerSearchTerm) ||
                fullname.includes(lowerSearchTerm)
            );
        });
    }, [userData, searchTerm]);


    const handleCloseModal = () => {
        setModalState({ open: false, mode: 'create', data: null });
        setActiveTab('1');
        setSelectedRoleIds([]);
        setCustomPermissions([]);
        setDetailedUserData(null);
        setLoadingUserDetails(false);
        setFinalPermissionSlugs([]);
        setGrantedPermissionSlugs([]);
        setDeniedPermissionSlugs([]);
    };

    const handleRoleIdsChange = useCallback((roleIds: number[]) => {
        setSelectedRoleIds(roleIds);
    }, []);

    const handleCustomPermissionsChange = useCallback((permissions: UserPermission[]) => {
        setCustomPermissions(permissions);
    }, []);

    // Update roles only (from Tab 2)
    const handleUpdateRoles = useCallback(async () => {
        if (!modalState.data?.userId) return;

        // Validate form before submitting
        try {
            await roleForm.validateFields();
        } catch {
            return; // Validation failed, don't proceed
        }

        setConfirmModalState({
            open: true,
            type: 'edit',
            pendingAction: async () => {
                setLoading(true);
                try {
                    await UserService.updateRolesAndPermissions({
                        userId: modalState.data!.userId,
                        roleIds: selectedRoleIds,
                        deniedPermissionIds: [],
                        grantedPermissionIds: [],
                    });
                    toast.success(t('userManagement.messages.updateSuccess'));
                    await fetchUsers();
                } catch (error) {
                    console.error('Error updating roles:', error);
                    toast.error(t('userManagement.messages.updateError'));
                    throw error;
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [modalState.data?.userId, selectedRoleIds, t, fetchUsers]);

    // Update custom permissions (from Tab 3)
    const handleUpdatePermissions = useCallback(async () => {
        if (!modalState.data?.userId) return;

        const deniedPermissionIds = customPermissions
            .filter((p) => p.permissionType === 'deny')
            .map((p) => p.permissionId);

        const grantedPermissionIds = customPermissions
            .filter((p) => p.permissionType === 'grant')
            .map((p) => p.permissionId);

        setConfirmModalState({
            open: true,
            type: 'edit',
            pendingAction: async () => {
                setLoading(true);
                try {
                    await UserService.updateRolesAndPermissions({
                        userId: modalState.data!.userId,
                        roleIds: selectedRoleIds,
                        deniedPermissionIds,
                        grantedPermissionIds,
                    });
                    toast.success(t('userManagement.messages.updateSuccess'));
                    await fetchUsers();
                } catch (error) {
                    console.error('Error updating permissions:', error);
                    toast.error(t('userManagement.messages.updateError'));
                    throw error;
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [modalState.data?.userId, selectedRoleIds, customPermissions, t, fetchUsers]);

    const handleConfirmAction = async () => {
        if (confirmModalState.pendingAction) {
            try {
                setConfirmModalState((prev) => ({ ...prev, open: false }));
                await confirmModalState.pendingAction();
                setConfirmModalState({
                    open: false,
                    type: 'edit',
                    pendingAction: null,
                });
            } catch {
                setConfirmModalState({
                    open: false,
                    type: 'edit',
                    pendingAction: null,
                });
            }
        }
    };

    const handleCancelConfirm = () => {
        setConfirmModalState({
            open: false,
            type: 'edit',
            pendingAction: null,
        });
    };

    return (
        <>
            <ResponsivePageHeader
                title={t('userManagement.title')}
                icon={<UserOutlined />}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('userManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                    </div>
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
                {userData === null ? (
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
                    <Table<UserWithRBAC>
                        columns={columns}
                        dataSource={filteredUserData}
                        loading={loading}
                        rowKey="userId"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: !isMobileResponsive,
                            simple: isMobileResponsive,
                            showTotal: (total, _range) => !isMobileResponsive ? t('userManagement.pagination.total', { total }) : undefined,
                        }}
                        scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
                        style={{ flex: 1 }}
                    />
                )}
            </Card>

            <Modal
                title={t('userManagement.form.editTitle')}
                open={modalState.open}
                onCancel={handleCloseModal}
                width={'80vw'}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        {t('common.cancel')}
                    </Button>,
                    activeTab === '2' && (
                        <Button
                            key="update-roles"
                            type="primary"
                            onClick={handleUpdateRoles}
                            loading={loading}
                        >
                            {t('common.save')}
                        </Button>
                    ),
                    activeTab === '3' && (
                        <Button
                            key="update-permissions"
                            type="primary"
                            onClick={handleUpdatePermissions}
                            loading={loading}
                        >
                            {t('common.save')}
                        </Button>
                    ),
                ]}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: '1',
                            label: t('userManagement.tabs.basicInfo'),
                            children:
                                loadingUserDetails ||
                                    (modalState.data?.userId && allRoles.length === 0) ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: 400,
                                        }}
                                    >
                                        <Spin
                                            size="large"
                                            tip={t('userManagement.loading.userInfo')}
                                        >
                                            <div style={{ width: 200 }} />
                                        </Spin>
                                    </div>
                                ) : detailedUserData ? (
                                    <UserBasicInfo user={detailedUserData} />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                        <p>{t('userManagement.noUserData')}</p>
                                    </div>
                                ),
                        },
                        {
                            key: '2',
                            label: t('userManagement.tabs.roleAssignment'),
                            children:
                                loadingUserDetails ||
                                    (modalState.data?.userId && allRoles.length === 0) ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: 400,
                                        }}
                                    >
                                        <Spin
                                            size="large"
                                            tip={t('userManagement.loading.roleInfo')}
                                        >
                                            <div style={{ width: 200 }} />
                                        </Spin>
                                    </div>
                                ) : (
                                    <Form form={roleForm} layout="vertical">
                                        <Form.Item
                                            name="roleIds"
                                            rules={[
                                                {
                                                    validator: (_, _value) => {
                                                        if (
                                                            !selectedRoleIds ||
                                                            selectedRoleIds.length === 0
                                                        ) {
                                                            return Promise.reject(
                                                                new Error(
                                                                    t(
                                                                        'userManagement.validation.roleRequired'
                                                                    )
                                                                )
                                                            );
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                },
                                            ]}
                                        >
                                            <RoleAssignment
                                                userId={modalState.data?.userId}
                                                value={selectedRoleIds}
                                                onChange={handleRoleIdsChange}
                                                allRoles={allRoles}
                                            />
                                        </Form.Item>
                                    </Form>
                                ),
                        },
                        {
                            key: '3',
                            label: t('userManagement.tabs.customPermissions'),
                            children:
                                loadingUserDetails ||
                                    (modalState.data?.userId && allRoles.length === 0) ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: 400,
                                        }}
                                    >
                                        <Spin
                                            size="large"
                                            tip={t('userManagement.loading.permissionInfo')}
                                        >
                                            <div style={{ width: 200 }} />
                                        </Spin>
                                    </div>
                                ) : (
                                    <CustomPermissions
                                        userId={modalState.data?.userId}
                                        selectedRoles={selectedRoleIds}
                                        value={customPermissions}
                                        onChange={handleCustomPermissionsChange}
                                        finalPermissionSlugs={finalPermissionSlugs}
                                        grantedPermissionSlugs={grantedPermissionSlugs}
                                        deniedPermissionSlugs={deniedPermissionSlugs}
                                        allRoles={allRoles}
                                    />
                                ),
                        },
                    ]}
                />
            </Modal>

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

export default UserManagementPage;
