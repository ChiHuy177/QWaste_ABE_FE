'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FactoryService } from '@/services/FactoryService';
import { toast } from 'sonner';
import { Button, Card, Table, Grid, Spin } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Factory, FactoryFormData } from '@/types/Factory';
import { getFactoryTableColumns, FactoryTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getFactoryFormFields } from './_components/factoryFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const FactoryListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: Factory | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [factoryData, setFactoryData] = useState<Factory[] | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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

    usePageTitle(t('pageTitle.factoryList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchFactoryData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await FactoryService.getAllFactories();
            setFactoryData(response);
        } catch (error) {
            toast.error(t('factoryManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleEditFactory = useCallback(
        (factory: Factory) => {
            if (!checkPermission('update', 'factory')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: factory,
            });
        },
        [checkPermission]
    );

    const handleViewFactory = useCallback((factory: Factory) => {
        setViewModalState({ open: true, data: factory });
    }, []);

    const handleDeleteFactory = useCallback(
        (factory: Factory) => {
            if (!checkPermission('delete', 'factory')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const factoryId = factory.factoryId;
                        await FactoryService.deleteFactory(factoryId);
                        toast.success(t('factoryManagement.deleteSuccess'));
                        fetchFactoryData();
                    } catch (error) {
                        console.error('Error deleting factory:', error);
                        handleError(error, { fallbackKey: 'factoryManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, fetchFactoryData, checkPermission, handleError]
    );

    const columnProps: FactoryTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditFactory,
            onView: handleViewFactory,
            onDelete: handleDeleteFactory,
            isMobile,
            t,
            ability,
        }),
        [handleEditFactory, handleViewFactory, handleDeleteFactory, isMobile, t, ability]
    );

    const columns = useMemo(() => getFactoryTableColumns(columnProps), [columnProps]);

    const filteredFactoryData = useMemo(() => {
        if (!factoryData) return [];
        if (!searchTerm.trim()) {
            return factoryData;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return factoryData.filter((factory) => {
            const factoryCode = factory.factoryCode?.toLowerCase() || '';
            const factoryName = factory.factoryName?.toLowerCase() || '';

            return factoryCode.includes(lowerSearchTerm) || factoryName.includes(lowerSearchTerm);
        });
    }, [factoryData, searchTerm]);

    useEffect(() => {
        fetchFactoryData();
    }, [fetchFactoryData]);

    const handleSubmit = async (data: FactoryFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: FactoryFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await FactoryService.createFactory(data);
                toast.success(t('factoryManagement.form.createSuccess'));
            } else {
                if (modalState.data?.factoryId) {
                    const submitData = {
                        ...data,
                        factoryId: modalState.data.factoryId,
                    };
                    await FactoryService.updateFactory(submitData as any);
                    toast.success(t('factoryManagement.updateSuccess'));
                }
            }
            fetchFactoryData();
        } catch (error) {
            console.error('Error submitting factory:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'factoryManagement.form.createError'
                        : 'factoryManagement.updateError',
            });
            throw error;
        }
    };

    const handleConfirmAction = async () => {
        if (confirmModalState.pendingAction) {
            try {
                setConfirmModalState((prev) => ({ ...prev, open: false }));
                await confirmModalState.pendingAction();
                setModalState((prev) => ({ ...prev, open: false })); // Close form modal
                setConfirmModalState({
                    open: false,
                    type: 'create',
                    pendingAction: null,
                });
            } catch (error) {
                // Reset state on error
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
        () => getFactoryFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('factoryManagement.title')}
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
                            placeholder={t('factoryManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="factory">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('factoryManagement.addFactory')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="factory">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                setModalState({ open: true, mode: 'create', data: null })
                            }
                            aria-label={t('factoryManagement.addFactory')}
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
                bodyStyle={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: 0,
                }}
            >
                {factoryData === null ? (
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
                    <Table<Factory>
                        columns={columns}
                        dataSource={filteredFactoryData}
                        loading={loading}
                        rowKey={(record) => record.factoryId}
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
                        scroll={{
                            x: 'max-content',
                            y: isMobile ? 'calc(100vh - 280px)' : 'calc(112vh - 420px)',
                        }}
                        sticky
                        bordered
                    />
                )}
            </Card>

            <EntityFormModal<FactoryFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('factoryManagement.form.createTitle'),
                    edit: t('factoryManagement.form.editTitle'),
                }}
                description={{
                    create: t('factoryManagement.form.createDescription'),
                    edit: t('factoryManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('factoryManagement.form.buttons.cancel'),
                    create: t('factoryManagement.form.buttons.create'),
                    edit: t('factoryManagement.form.buttons.update'),
                    saving: t('factoryManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.factoryName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'factoryCode',
                        label: t('factoryManagement.table.headers.factoryCode'),
                        children: viewModalState.data?.factoryCode || '-',
                    },
                    {
                        key: 'factoryName',
                        label: t('factoryManagement.table.headers.factoryName'),
                        children: viewModalState.data?.factoryName || '-',
                    },
                    {
                        key: 'displayOrder',
                        label: t('factoryManagement.table.headers.order'),
                        children: viewModalState.data?.displayOrder ?? '-',
                    },
                    {
                        key: 'address',
                        label: t('factoryManagement.table.headers.address'),
                        children: viewModalState.data?.address || '-',
                    },
                    {
                        key: 'description',
                        label: t('factoryManagement.table.headers.description'),
                        children: viewModalState.data?.description || '-',
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
        </>
    );
};

export default FactoryListPage;
