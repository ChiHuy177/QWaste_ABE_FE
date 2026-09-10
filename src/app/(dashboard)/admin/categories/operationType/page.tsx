'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Descriptions, Grid, Modal, Spin, Table, Typography } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { EntityFormModal } from '@/components/shared/FormModal';
import { SearchInput } from '@/components/shared/SearchInput';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { OperationTypeService } from '@/services/OperationTypeService';
import { OperationType, OperationTypeFormData } from '@/types/OperationType';
import { getOperationTypeTableColumns, OperationTypeTableColumnProps } from './_components/Columns';
import { getOperationTypeFormFields } from './_components/operationTypeFormConfig';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const operationTypeQueryKeys = {
    lists: ['operationTypes', 'list'] as const,
    detail: (operationTypeId: number) => ['operationTypes', 'detail', operationTypeId] as const,
};

const OperationTypeListPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const ability = useAbility();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    usePageTitle(t('pageTitle.operationTypeList'));

    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: OperationType | null;
    }>({ open: false, mode: 'create', data: null });

    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({ open: false, type: 'create', pendingAction: null });

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: OperationType | null;
    }>({ open: false, loading: false, data: null });

    const [searchTerm, setSearchTerm] = useState('');

    // BE chỉ có GET /v1 không phân trang — search/sort/phân trang chạy client-side.
    const operationTypesQuery = useQuery({
        queryKey: operationTypeQueryKeys.lists,
        queryFn: () => OperationTypeService.getAllOperationTypes(),
    });

    const operationTypeData = useMemo(() => {
        const all = operationTypesQuery.data ?? [];
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return all;
        return all.filter(
            (operationType) =>
                operationType.operationTypeCode.toLowerCase().includes(keyword) ||
                operationType.operationTypeName.toLowerCase().includes(keyword)
        );
    }, [operationTypesQuery.data, searchTerm]);

    const isLoading = operationTypesQuery.isLoading || operationTypesQuery.isFetching;

    const { mutateAsync: createOperationType } = useMutation({
        mutationFn: (data: OperationTypeFormData) => OperationTypeService.createOperationType(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: operationTypeQueryKeys.lists }),
    });

    const { mutateAsync: updateOperationType } = useMutation({
        mutationFn: (data: OperationTypeFormData & { operationTypeId: number }) =>
            OperationTypeService.updateOperationType(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: operationTypeQueryKeys.lists });
            queryClient.invalidateQueries({
                queryKey: operationTypeQueryKeys.detail(variables.operationTypeId),
            });
        },
    });

    const { mutateAsync: deleteOperationType } = useMutation({
        mutationFn: (operationTypeId: number) =>
            OperationTypeService.deleteOperationType(operationTypeId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: operationTypeQueryKeys.lists }),
    });

    const handleViewOperationType = useCallback(
        async (operationType: OperationType) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detail = await queryClient.fetchQuery({
                    queryKey: operationTypeQueryKeys.detail(operationType.operationTypeId),
                    queryFn: () =>
                        OperationTypeService.getOperationTypeById(operationType.operationTypeId),
                });
                setViewModalState({ open: true, loading: false, data: detail });
            } catch (error) {
                handleError(error, { fallbackKey: 'operationTypeManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError, queryClient]
    );

    const handleEditOperationType = useCallback(
        (operationType: OperationType) => {
            if (!checkPermission('update', 'operation_type')) return;
            setModalState({ open: true, mode: 'edit', data: operationType });
        },
        [checkPermission]
    );

    const handleDeleteOperationType = useCallback(
        (operationType: OperationType) => {
            if (!checkPermission('delete', 'operation_type')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const message = await deleteOperationType(operationType.operationTypeId);
                        toast.success(message || t('operationTypeManagement.deleteSuccess'));
                    } catch (error) {
                        handleError(error, { fallbackKey: 'operationTypeManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [checkPermission, deleteOperationType, handleError, t]
    );

    const executeSubmit = async (data: OperationTypeFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await createOperationType(data);
                toast.success(t('operationTypeManagement.form.createSuccess'));
            } else if (modalState.data?.operationTypeId != null) {
                await updateOperationType({
                    ...data,
                    operationTypeId: modalState.data.operationTypeId,
                });
                toast.success(t('operationTypeManagement.updateSuccess'));
            }
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'operationTypeManagement.form.createError'
                        : 'operationTypeManagement.updateError',
            });
            throw error;
        }
    };

    const handleSubmit = async (data: OperationTypeFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const handleConfirmAction = async () => {
        if (!confirmModalState.pendingAction) return;
        try {
            setConfirmModalState((prev) => ({ ...prev, open: false }));
            await confirmModalState.pendingAction();
            setModalState((prev) => ({ ...prev, open: false }));
        } catch {
            // Error already handled in pendingAction
        } finally {
            setConfirmModalState({ open: false, type: 'create', pendingAction: null });
        }
    };

    const handleCancelConfirm = () => {
        setConfirmModalState({ open: false, type: 'create', pendingAction: null });
    };

    const columnProps: OperationTypeTableColumnProps = useMemo(
        () => ({
            onView: handleViewOperationType,
            onEdit: handleEditOperationType,
            onDelete: handleDeleteOperationType,
            isMobile,
            t,
            ability,
        }),
        [
            handleViewOperationType,
            handleEditOperationType,
            handleDeleteOperationType,
            isMobile,
            t,
            ability,
        ]
    );

    const columns = useMemo(() => getOperationTypeTableColumns(columnProps), [columnProps]);

    const formFields = useMemo(
        () => getOperationTypeFormFields(t, modalState.mode),
        [t, modalState.mode]
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
            <ResponsivePageHeader
                title={t('operationTypeManagement.title')}
                loading={isLoading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('operationTypeManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="operation_type">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('operationTypeManagement.addOperationType')}
                            </Button>
                        </Can>
                    </div>
                }
            />

            <Modal
                title={viewModalState.data?.operationTypeName}
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '90%' : 600}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin indicator={<LoadingOutlined spin />} size="large" />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Descriptions column={isMobile ? 1 : 2} bordered size="small">
                            <Descriptions.Item
                                label={t('operationTypeManagement.table.headers.operationTypeCode')}
                            >
                                <Text strong>{viewModalState.data.operationTypeCode}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('operationTypeManagement.table.headers.operationTypeName')}
                            >
                                {viewModalState.data.operationTypeName}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('operationTypeManagement.table.headers.description')}
                                span={2}
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
                    },
                }}
            >
                <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Table<OperationType>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={operationTypeData}
                        loading={isLoading}
                        rowKey="operationTypeId"
                        pagination={{
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            defaultPageSize: 10,
                            placement: ['bottomCenter'],
                        }}
                        scroll={{
                            x: 'max-content',
                            y: tableScrollY,
                        }}
                        style={{ height: '100%' }}
                        bordered
                    />
                </div>
            </Card>

            <EntityFormModal<OperationTypeFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('operationTypeManagement.form.createTitle'),
                    edit: t('operationTypeManagement.form.editTitle'),
                }}
                description={{
                    create: t('operationTypeManagement.form.createDescription'),
                    edit: t('operationTypeManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('operationTypeManagement.form.buttons.cancel'),
                    create: t('operationTypeManagement.form.buttons.create'),
                    edit: t('operationTypeManagement.form.buttons.save'),
                    saving: t('operationTypeManagement.form.buttons.saving'),
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
        </div>
    );
};

export default OperationTypeListPage;
