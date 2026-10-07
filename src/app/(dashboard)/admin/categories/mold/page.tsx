'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Descriptions, Flex, Grid, Modal, Spin, Table, Tag, Typography } from 'antd';
import { FilterOutlined, LoadingOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
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
import AdvancedFilterPanel, { FilterField } from '@/components/shared/filters/AdvancedFilterPanel';

import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { MoldService } from '@/services/MoldService';
import { OperationTypeService } from '@/services/OperationTypeService';
import { Mold, MoldFormData } from '@/types/Mold';
import {
    getMoldTableColumns,
    type MoldTableColumnProps,
    getMoldFormFields,
    toOperationTypeOptions,
    MoldImportModal,
} from '@/features/dashboard/categories/mold';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 10;

const moldQueryKeys = {
    lists: ['molds', 'list'] as const,
    detail: (moldId: string) => ['molds', 'detail', moldId] as const,
};

const operationTypeQueryKeys = {
    lists: ['operationTypes', 'list'] as const,
};

const MoldListPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const ability = useAbility();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    usePageTitle(t('pageTitle.moldList'));

    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: Mold | null;
    }>({ open: false, mode: 'create', data: null });

    const [importModalOpen, setImportModalOpen] = useState(false);

    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({ open: false, type: 'create', pendingAction: null });

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: Mold | null;
    }>({ open: false, loading: false, data: null });

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [moldCodeFilter, setMoldCodeFilter] = useState<string | undefined>(undefined);
    const [moldNameFilter, setMoldNameFilter] = useState<string | undefined>(undefined);

    const activeFilterCount = [moldCodeFilter, moldNameFilter].filter(Boolean).length;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // BE chỉ có GET /v1 không phân trang (đã cache Caffeine) — search/lọc/sort/phân trang client-side.
    const moldsQuery = useQuery({
        queryKey: moldQueryKeys.lists,
        queryFn: () => MoldService.getAllMolds(),
    });

    const moldData = useMemo(() => {
        const allMolds = moldsQuery.data ?? [];
        const keyword = debouncedSearch.trim().toLowerCase();
        const codeFilter = moldCodeFilter?.toLowerCase();
        const nameFilter = moldNameFilter?.toLowerCase();

        return allMolds.filter((mold) => {
            if (
                keyword &&
                !mold.moldCode.toLowerCase().includes(keyword) &&
                !mold.moldName.toLowerCase().includes(keyword)
            ) {
                return false;
            }
            if (codeFilter && !mold.moldCode.toLowerCase().includes(codeFilter)) return false;
            if (nameFilter && !mold.moldName.toLowerCase().includes(nameFilter)) return false;
            return true;
        });
    }, [moldsQuery.data, debouncedSearch, moldCodeFilter, moldNameFilter]);

    const totalElements = moldData.length;
    const isLoading = moldsQuery.isLoading || moldsQuery.isFetching;

    useEffect(() => {
        if (moldsQuery.error) {
            handleError(moldsQuery.error, { fallbackKey: 'moldManagement.fetchError' });
        }
    }, [moldsQuery.error, handleError]);

    const operationTypesQuery = useQuery({
        queryKey: operationTypeQueryKeys.lists,
        queryFn: () => OperationTypeService.getAllOperationTypes(),
    });

    const operationTypeOptions = useMemo(
        () => toOperationTypeOptions(operationTypesQuery.data ?? []),
        [operationTypesQuery.data]
    );

    const { mutateAsync: createMold } = useMutation({
        mutationFn: (data: MoldFormData) => MoldService.createMold(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists }),
    });

    const { mutateAsync: updateMold } = useMutation({
        mutationFn: (data: MoldFormData & { moldId: string }) => MoldService.updateMold(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists });
            queryClient.invalidateQueries({ queryKey: moldQueryKeys.detail(variables.moldId) });
        },
    });

    const { mutateAsync: deleteMold } = useMutation({
        mutationFn: (moldId: string) => MoldService.deleteMold(moldId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists }),
    });

    const { mutateAsync: restoreMold } = useMutation({
        mutationFn: (moldId: string) => MoldService.restoreMold(moldId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists }),
    });

    const handleViewMold = useCallback(
        async (mold: Mold) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detail = await queryClient.fetchQuery({
                    queryKey: moldQueryKeys.detail(mold.moldId),
                    queryFn: () => MoldService.getMoldById(mold.moldId),
                });
                setViewModalState({ open: true, loading: false, data: detail });
            } catch (error) {
                handleError(error, { fallbackKey: 'moldManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError, queryClient]
    );

    const handleEditMold = useCallback(
        (mold: Mold) => {
            if (!checkPermission('update', 'mold')) return;
            setModalState({ open: true, mode: 'edit', data: mold });
        },
        [checkPermission]
    );

    const handleDeleteMold = useCallback(
        (mold: Mold) => {
            if (!checkPermission('delete', 'mold')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const message = await deleteMold(mold.moldId);
                        toast.success(message || t('moldManagement.deleteSuccess'));
                    } catch (error) {
                        handleError(error, { fallbackKey: 'moldManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [checkPermission, deleteMold, handleError, t]
    );

    const handleRestoreMold = useCallback(
        async (mold: Mold) => {
            if (!checkPermission('restore', 'mold')) return;
            try {
                const message = await restoreMold(mold.moldId);
                toast.success(message || t('moldManagement.restoreSuccess'));
            } catch (error) {
                handleError(error, { fallbackKey: 'moldManagement.restoreError' });
            }
        },
        [checkPermission, handleError, restoreMold, t]
    );

    const executeSubmit = async (data: MoldFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await createMold(data);
                toast.success(t('moldManagement.form.createSuccess'));
            } else {
                if (modalState.data?.moldId) {
                    await updateMold({ ...data, moldId: modalState.data.moldId });
                    toast.success(t('moldManagement.updateSuccess'));
                }
            }
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'moldManagement.form.createError'
                        : 'moldManagement.updateError',
            });
            throw error;
        }
    };

    const handleSubmit = async (data: MoldFormData, mode: 'create' | 'edit') => {
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

    const handleApplyFilters = useCallback(() => {
        setPage(0);
    }, []);

    const handleResetFilters = useCallback(() => {
        setMoldCodeFilter(undefined);
        setMoldNameFilter(undefined);
        setPage(0);
    }, []);

    const columnProps: MoldTableColumnProps = useMemo(
        () => ({
            onView: handleViewMold,
            onEdit: handleEditMold,
            onDelete: handleDeleteMold,
            onRestore: handleRestoreMold,
            isMobile,
            t,
            ability,
        }),
        [handleViewMold, handleEditMold, handleDeleteMold, handleRestoreMold, isMobile, t, ability]
    );

    const columns = useMemo(() => getMoldTableColumns(columnProps), [columnProps]);

    const formFields = useMemo(
        () =>
            getMoldFormFields(
                t,
                modalState.mode,
                operationTypeOptions,
                operationTypesQuery.isLoading
            ),
        [t, modalState.mode, operationTypeOptions, operationTypesQuery.isLoading]
    );

    // Form field tên 'operationTypeId' (phẳng) nhưng Mold trả 'operationType' (nested) —
    // map lại để EntityFormModal.setFieldsValue điền đúng Select khi edit.
    const moldFormInitialData = useMemo(() => {
        if (!modalState.data) return null;
        return {
            ...modalState.data,
            operationTypeId: modalState.data.operationType.operationTypeId,
        };
    }, [modalState.data]);

    const filterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'moldCode',
                label: t('moldManagement.table.headers.moldCode'),
                placeholder: t('moldManagement.form.placeholders.moldCode'),
                value: moldCodeFilter ?? '',
                onChange: (val) => setMoldCodeFilter(val.trim() || undefined),
                colProps: { xs: 24, sm: 12 },
            },
            {
                key: 'moldName',
                label: t('moldManagement.table.headers.moldName'),
                placeholder: t('moldManagement.form.placeholders.moldName'),
                value: moldNameFilter ?? '',
                onChange: (val) => setMoldNameFilter(val.trim() || undefined),
                colProps: { xs: 24, sm: 12 },
            },
        ],
        [t, moldCodeFilter, moldNameFilter]
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
                title={t('moldManagement.title')}
                loading={isLoading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('moldManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                            showFilterIcon
                            onFilterClick={() => setShowAdvancedFilters((prev) => !prev)}
                            isFilterActive={showAdvancedFilters}
                            activeFilterCount={activeFilterCount}
                        />
                        <Can I="import" a="mold">
                            <Button
                                icon={<UploadOutlined />}
                                block={isMobile}
                                onClick={() => setImportModalOpen(true)}
                            >
                                {t('moldManagement.import.button')}
                            </Button>
                        </Can>
                        <Can I="create" a="mold">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('moldManagement.addMold')}
                            </Button>
                        </Can>
                    </div>
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

            {activeFilterCount > 0 && (
                <Flex gap={8} align="center" wrap style={{ marginBottom: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <FilterOutlined style={{ marginRight: 4 }} />
                        {t('common.activeFilters')}:
                    </Typography.Text>
                    {moldCodeFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setMoldCodeFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('moldManagement.table.headers.moldCode')}: {moldCodeFilter}
                        </Tag>
                    )}
                    {moldNameFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setMoldNameFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('moldManagement.table.headers.moldName')}: {moldNameFilter}
                        </Tag>
                    )}
                </Flex>
            )}

            <Modal
                title={viewModalState.data?.moldName}
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '90%' : 680}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin indicator={<LoadingOutlined spin />} size="large" />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Descriptions column={isMobile ? 1 : 2} bordered size="small">
                            <Descriptions.Item label={t('moldManagement.table.headers.moldCode')}>
                                <Text strong>{viewModalState.data.moldCode}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('moldManagement.table.headers.moldName')}>
                                {viewModalState.data.moldName}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('moldManagement.table.headers.outputPerShot')}
                            >
                                {viewModalState.data.outputPerShot}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('moldManagement.table.headers.operationType')}
                            >
                                <Tag color="blue">
                                    {viewModalState.data.operationType.operationTypeName}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('moldManagement.table.headers.description')}
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
                    <Table<Mold>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={moldData}
                        loading={isLoading}
                        rowKey="moldId"
                        pagination={{
                            current: page + 1,
                            pageSize,
                            total: totalElements,
                            onChange: (current, size) => {
                                setPage(current - 1);
                                setPageSize(size ?? DEFAULT_PAGE_SIZE);
                            },
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
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

            <EntityFormModal<MoldFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={moldFormInitialData}
                fields={formFields}
                title={{
                    create: t('moldManagement.form.createTitle'),
                    edit: t('moldManagement.form.editTitle'),
                }}
                description={{
                    create: t('moldManagement.form.createDescription'),
                    edit: t('moldManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('moldManagement.form.buttons.cancel'),
                    create: t('moldManagement.form.buttons.create'),
                    edit: t('moldManagement.form.buttons.save'),
                    saving: t('moldManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: 620, md: 700 }}
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

            <MoldImportModal
                open={importModalOpen}
                onCancel={() => setImportModalOpen(false)}
                onSuccess={() => {
                    setImportModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists });
                }}
            />
        </div>
    );
};

export default MoldListPage;
