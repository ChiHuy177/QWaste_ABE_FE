'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getStaffFormFields } from './_components/staffFormConfig';
import { UserProfile, StaffFormData } from '@/types/User';
import { UserService } from '@/services/UserService';
import { toast } from 'sonner';
import { getStaffTableColumns, StaffTableColumnProps } from './_components/Columns';
import { Card, Table, Grid, Button } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
    PlusOutlined,
    UserOutlined,
    IdcardOutlined,
    MailOutlined,
    SafetyCertificateOutlined,
    BankOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { SelectOption } from '@/types/Common';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const StaffListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: StaffFormData | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: UserProfile | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermissionSilent } = usePermissionCheck();
    usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [staffData, setStaffData] = useState<UserProfile[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [factoryOptions, setFactoryOptions] = useState<SelectOption[]>([]);
    const [factoryLoading, setFactoryLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'create',
        pendingAction: null,
    });

    usePageTitle(t('pageTitle.staffList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const handleEditStaff = useCallback(
        async (staff: UserProfile) => {
            // Open modal immediately with loading state
            setModalState({
                open: true,
                mode: 'edit',
                data: null,
            });
            setEditLoading(true);

            try {
                const fullStaffData = await UserService.getStaffById(staff.userId);

                const mappedData = {
                    ...fullStaffData,
                    roles: fullStaffData.roles || [],
                    password: '',
                    gender: (fullStaffData as any).gender || '',
                    accessibleFactoryIds:
                        fullStaffData.accessibleFactories?.map((f) => f.factoryId) || [],
                };

                setModalState({
                    open: true,
                    mode: 'edit',
                    data: mappedData,
                });
            } catch (error) {
                console.error('Error fetching staff details:', error);
                toast.error(t('staffManagement.fetchError'));
                // Close modal on error
                setModalState({ open: false, mode: 'edit', data: null });
            } finally {
                setEditLoading(false);
            }
        },
        [t]
    );

    const handleViewStaff = useCallback((staff: UserProfile) => {
        setViewModalState({ open: true, data: staff });
    }, []);

    const handleDeleteStaff = useCallback(
        (staff: UserProfile) => {
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const userId = staff.userId;
                        await UserService.deleteStaff(userId!);
                        toast.success(t('staffManagement.deleteSuccess'));
                        fetchStaffData();
                    } catch (error) {
                        console.error('Error deleting staff:', error);
                        toast.error(t('staffManagement.deleteError'));
                        throw error;
                    }
                },
            });
        },
        [t]
    );

    const handleRestoreStaff = useCallback(
        async (staff: UserProfile) => {
            try {
                const userId = staff.userId;
                await UserService.restoreStaff(userId!);
                toast.success(t('staffManagement.restoreSuccess'));
                fetchStaffData();
            } catch (error) {
                console.error('Error restoring staff:', error);
                toast.error(t('staffManagement.restoreError'));
            }
        },
        [t]
    );

    const columnProps: StaffTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditStaff,
            onView: handleViewStaff,
            onDelete: handleDeleteStaff,
            onRestore: handleRestoreStaff,
            isMobile,
            t,
            ability,
        }),
        [
            handleEditStaff,
            handleViewStaff,
            handleDeleteStaff,
            handleRestoreStaff,
            isMobile,
            t,
            ability,
        ]
    );

    const columns = useMemo(() => getStaffTableColumns(columnProps), [columnProps]);

    const filteredStaffData = useMemo(() => {
        if (!staffData) return [];
        if (!searchTerm.trim()) {
            return staffData;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return staffData.filter((staff) => {
            const fullname = staff.fullname?.toLowerCase() || '';
            const userCode = staff.userCode?.toLowerCase() || '';
            const email = staff.email?.toLowerCase() || '';
            const phone = staff.phoneNumber?.toLowerCase() || '';
            const factory =
                staff.accessibleFactories?.map((factory) => factory.factoryCode.toLowerCase()) ||
                [];
            return (
                fullname.includes(lowerSearchTerm) ||
                userCode.includes(lowerSearchTerm) ||
                email.includes(lowerSearchTerm) ||
                phone.includes(lowerSearchTerm) ||
                factory.some((f) => f.includes(lowerSearchTerm))
            );
        });
    }, [staffData, searchTerm]);

    const fetchStaffData = async () => {
        try {
            setLoading(true);
            const response = await UserService.getAllStaff();
            setStaffData(response);
        } catch (error) {
            console.error('Error fetching staff data:', error);
            toast.error(t('staffManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const fetchFactories = async () => {
        setFactoryLoading(true);
        // API call disabled: FactoryService.getFactoriesSimple();
        setFactoryOptions([]);
        setFactoryLoading(false);
    };

    useEffect(() => {
        fetchStaffData();
    }, []);

    const handleSubmit = async (data: StaffFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: StaffFormData, mode: 'create' | 'edit') => {
        try {
            const roles =
                mode === 'edit' && modalState.data?.roles
                    ? (modalState.data.roles as string[])
                    : Array.isArray(data.roles)
                      ? data.roles
                      : [data.roles];

            const { accessibleFactoryIds, ...restData } = data;
            const submitData: Partial<StaffFormData> & { roles: string[]; factoryIds?: number[] } =
                {
                    ...restData,
                    roles,
                    factoryIds: accessibleFactoryIds,
                };

            if (mode === 'edit' && (!submitData.password || submitData.password.trim() === '')) {
                delete submitData.password;
            }

            if (mode === 'create') {
                await UserService.createStaff(submitData as unknown as Partial<UserProfile>);
                toast.success(t('staffManagement.form.createSuccess'));
            } else {
                if (modalState.data?.userId) {
                    submitData.userId = modalState.data.userId;
                    await UserService.updateStaff(submitData as unknown as UserProfile);
                    toast.success(t('staffManagement.form.updateSuccess'));
                }
            }
            fetchStaffData();
        } catch (error: unknown) {
            console.error('Error submitting staff:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'staffManagement.form.createError'
                        : 'staffManagement.form.updateError',
            });
            throw error;
        }
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
            } catch (error) {
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

    const formFields = useMemo(
        () =>
            getStaffFormFields(t, modalState.mode, {
                factoryOptions,
                factoryLoading,
            }),
        [t, modalState.mode, factoryOptions, factoryLoading]
    );
    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    return (
        <div
            style={{
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Desktop Header */}
            <ResponsivePageHeader
                title={t('staffManagement.title')}
                icon={<UserOutlined />}
                loading={loading}
                rightContent={
                    <div
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <SearchInput
                            placeholder={t('staffManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        {checkPermissionSilent('create', 'staff') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('staffManagement.addStaffMember')}
                            </Button>
                        )}
                    </div>
                }
                rightContentMobile={
                    checkPermissionSilent('create', 'staff') ? (
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                setModalState({ open: true, mode: 'create', data: null })
                            }
                            aria-label={t('staffManagement.addStaffMember')}
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        />
                    ) : undefined
                }
            />

            <Card
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                styles={{
                    body: {
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        paddingBottom: 0,
                    },
                }}
            >
                <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Table<UserProfile>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredStaffData}
                        loading={loading}
                        rowKey={(record) => record.userId}
                        pagination={{
                            pageSize: 10,
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t(
                                    'common.items'
                                )}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            placement: ['bottomCenter'],
                        }}
                        scroll={{
                            x: 'max-content',
                            y: tableScrollY,
                        }}
                        style={{ height: '100%' }}
                        sticky
                        bordered
                    />
                </div>
            </Card>

            <EntityFormModal<StaffFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('staffManagement.form.createTitle'),
                    edit: t('staffManagement.form.editTitle'),
                }}
                description={{
                    create: t('staffManagement.form.createDescription'),
                    edit: t('staffManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('staffManagement.form.buttons.cancel'),
                    create: t('staffManagement.form.buttons.create'),
                    edit: t('staffManagement.form.buttons.update'),
                    saving: t('staffManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
                loading={editLoading}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.fullname || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                sectionLabel={t('staffManagement.viewModal.staffInfo')}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'userCode',
                        icon: <IdcardOutlined />,
                        label: t('staffManagement.table.headers.userCode'),
                        children: viewModalState.data?.userCode || '-',
                    },
                    {
                        key: 'fullname',
                        icon: <UserOutlined />,
                        label: t('staffManagement.table.headers.name'),
                        children: viewModalState.data?.fullname || '-',
                    },
                    {
                        key: 'email',
                        icon: <MailOutlined />,
                        label: t('staffManagement.table.headers.email'),
                        children: viewModalState.data?.email || '-',
                    },
                    {
                        key: 'roles',
                        icon: <SafetyCertificateOutlined />,
                        label: t('staffManagement.table.headers.role'),
                        children: viewModalState.data?.roles?.length
                            ? viewModalState.data.roles.join(', ')
                            : '-',
                    },
                    {
                        key: 'accessibleFactories',
                        icon: <BankOutlined />,
                        label: t('staffManagement.table.headers.accessibleFactories'),
                        children: viewModalState.data?.accessibleFactories?.length
                            ? viewModalState.data.accessibleFactories
                                  .map((factory) => factory.factoryCode)
                                  .join(', ')
                            : '-',
                    },
                    {
                        key: 'phoneNumber',
                        icon: <PhoneOutlined />,
                        label: t('staffManagement.table.headers.phone'),
                        children: viewModalState.data?.phoneNumber || '-',
                    },
                    {
                        key: 'status',
                        icon: <CheckCircleOutlined />,
                        label: t('staffManagement.table.headers.status'),
                        children:
                            viewModalState.data?.softDeleteMetaData?.isDeleted ||
                            (viewModalState.data?.softDeleteMetaData as any)?.deleted
                                ? t('staffManagement.status.notWorking')
                                : t('staffManagement.status.working'),
                    },
                ]}
            />

            <ConfirmModal
                open={confirmModalState.open}
                type={confirmModalState.type}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelConfirm}
                t={t}
            />
        </div>
    );
};

export default StaffListPage;
