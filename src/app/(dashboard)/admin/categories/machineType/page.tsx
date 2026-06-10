'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Descriptions, Grid, Modal, Spin, Table, Typography } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ToolOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { MachineType } from '@/types/MachineType';
import { MachineTypeTableColumnProps, getMachineTypeTableColumns } from './_components/Column';
import { MachineTypeService } from '@/services/MachineTypeService';
import { DemoMachineTypeService, USE_MOCK_FACTORY_OVERVIEW } from '@/mockData/admin/factory';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getMachineTypeFormFields } from './_components/machineTypeFormConfig';
import { MachineTypeFormData } from '@/types/MachineType';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;
const activeMachineTypeService = USE_MOCK_FACTORY_OVERVIEW
    ? DemoMachineTypeService
    : MachineTypeService;

const MachineTypeListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: MachineType | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();

    const [loading, setLoading] = useState(true);
    const [machineTypeData, setMachineTypeData] = useState<MachineType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // ConfirmModal State
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'create',
        pendingAction: null,
    });

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: MachineType | null;
    }>({ open: false, loading: false, data: null });

    const { Title } = Typography;
    const { handleError } = useApiErrorHandler();

    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const canCreateMachineType = checkPermissionSilent('create', 'machine_type');

    usePageTitle(t('pageTitle.machineTypeList'));

    const fetchMachineTypeData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await activeMachineTypeService.getAllMachineTypes();
            setMachineTypeData(response);
        } catch (error) {
            console.error('Error fetching machine type data:', error);
            handleError(error, { fallbackKey: 'machineTypeManagement.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    useEffect(() => {
        fetchMachineTypeData();
    }, [fetchMachineTypeData]);

    const handleEditMachineType = useCallback(
        (machineType: MachineType) => {
            if (!checkPermission('update', 'machine_type')) return;
            setModalState({
                open: true,
                mode: 'edit',
                data: machineType,
            });
        },
        [checkPermission]
    );

    const handleDeleteMachineType = useCallback(
        async (machineType: MachineType) => {
            if (!checkPermission('delete', 'machine_type')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const machineTypeId = machineType.machineTypeId;
                        await activeMachineTypeService.deleteMachineType(machineTypeId);
                        toast.success(t('machineTypeManagement.deleteSuccess'));
                        await fetchMachineTypeData();
                    } catch (error) {
                        console.error('Error deleting machine type:', error);
                        handleError(error, { fallbackKey: 'machineTypeManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, checkPermission, fetchMachineTypeData, handleError]
    );

    const handleViewMachineType = useCallback(
        async (step: MachineType) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await activeMachineTypeService.getMachineTypeById(
                    step.machineTypeId
                );
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error: any) {
                console.error('Error fetching machine type details:', error);
                handleError(error, { fallbackKey: 'machineTypeManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError]
    );

    const columnProps: MachineTypeTableColumnProps = useMemo(
        () => ({
            onView: handleViewMachineType,
            onEdit: handleEditMachineType,
            onDelete: handleDeleteMachineType,
            t,
            ability,
        }),
        [handleEditMachineType, handleDeleteMachineType, handleViewMachineType, t, ability]
    );

    const columns = useMemo(() => getMachineTypeTableColumns(columnProps), [columnProps]);

    const filteredMachineTypeData = useMemo(() => {
        if (!searchTerm.trim()) {
            return machineTypeData;
        }
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return machineTypeData.filter((machineType) => {
            const machineTypeName = machineType.machineTypeName?.toLowerCase() || '';

            return machineTypeName.includes(lowerSearchTerm);
        });
    }, [machineTypeData, searchTerm]);

    const executeSubmit = async (data: MachineTypeFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await activeMachineTypeService.createMachineType(data);
                toast.success(t('machineTypeManagement.form.createSuccess'));
            } else {
                if (modalState.data?.machineTypeId) {
                    const submitData = {
                        ...data,
                        machineTypeId: modalState.data.machineTypeId,
                    };
                    await activeMachineTypeService.updateMachineType(submitData);
                    toast.success(t('machineTypeManagement.updateSuccess'));
                }
            }
            await fetchMachineTypeData();
        } catch (error) {
            console.error('Error submitting machine type:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'machineTypeManagement.form.createError'
                        : 'machineTypeManagement.updateError',
            });
            throw error;
        }
    };

    const handleSubmit = async (data: MachineTypeFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const handleCreateMachineType = useCallback(() => {
        if (!checkPermission('create', 'machine_type')) return;

        setModalState({ open: true, mode: 'create', data: null });
    }, [checkPermission]);

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
        setConfirmModalState({ open: false, type: 'create', pendingAction: null });
    };

    const formFields = useMemo(
        () => getMachineTypeFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('machineTypeManagement.title')}
                icon={<ToolOutlined />}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('machineTypeManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="machine_type">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreateMachineType}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('machineTypeManagement.addMachineType')}
                            </Button>
                        </Can>
                    </div>
                }
                mobileMenuItems={
                    canCreateMachineType
                        ? [
                            {
                                key: 'add',
                                label: t('machineTypeManagement.addMachineType'),
                                icon: <PlusOutlined />,
                                onClick: handleCreateMachineType,
                            },
                        ]
                        : []
                }
                rightContentMobile={
                    canCreateMachineType ? (
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={handleCreateMachineType}
                            aria-label={t('machineTypeManagement.addMachineType')}
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        />
                    ) : null
                }
            />

            <Modal
                title={viewModalState.data?.machineTypeName}
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '90%' : 600}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Descriptions column={isMobile ? 1 : 2} bordered size="small">
                            <Descriptions.Item
                                label={t('machineTypeManagement.table.headers.machineTypeName')}
                            >
                                {viewModalState.data.machineTypeName || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('machineTypeManagement.table.headers.description')}
                            >
                                {viewModalState.data.description || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                        {viewModalState.data.auditMetaData && (
                            <div style={{ marginTop: 16 }}>
                                <Title level={5} style={{ marginBottom: 8 }}>
                                    {t('common.auditInfo.title')}
                                </Title>
                                <Descriptions column={isMobile ? 1 : 2} size="small" bordered>
                                    <Descriptions.Item label={t('common.auditInfo.createdAt')}>
                                        {viewModalState.data.auditMetaData.createdAt
                                            ? dayjs(
                                                viewModalState.data.auditMetaData.createdAt
                                            ).format('DD/MM/YYYY HH:mm:ss')
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.createdBy')}>
                                        {viewModalState.data.auditMetaData.createdBy || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.updatedAt')}>
                                        {viewModalState.data.auditMetaData.updatedAt
                                            ? dayjs(
                                                viewModalState.data.auditMetaData.updatedAt
                                            ).format('DD/MM/YYYY HH:mm:ss')
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.updatedBy')}>
                                        {viewModalState.data.auditMetaData.updatedBy || '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <Button
                                onClick={() =>
                                    setViewModalState({ open: false, loading: false, data: null })
                                }
                            >
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>{t('common.notAvailable')}</div>
                )}
            </Modal>

            <Card
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                bodyStyle={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: 0,
                }}
            >
                <Table<MachineType>
                    columns={columns}
                    dataSource={filteredMachineTypeData}
                    loading={loading}
                    rowKey={(record) => record.machineTypeId}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t(
                                'common.items'
                            )}`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        position: ['bottomCenter'],
                    }}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
                    sticky
                    bordered
                />
            </Card>

            <EntityFormModal<MachineTypeFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('machineTypeManagement.form.createTitle'),
                    edit: t('machineTypeManagement.form.editTitle'),
                }}
                description={{
                    create: t('machineTypeManagement.form.createDescription'),
                    edit: t('machineTypeManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('machineTypeManagement.form.buttons.cancel'),
                    create: t('machineTypeManagement.form.buttons.create'),
                    edit: t('machineTypeManagement.form.buttons.update'),
                    saving: t('machineTypeManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: 550, md: 650 }}
                auditMetaData={modalState.data?.auditMetaData}
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

export default MachineTypeListPage;
