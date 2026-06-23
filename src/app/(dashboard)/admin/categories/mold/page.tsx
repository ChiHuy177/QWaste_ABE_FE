'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Button,
    Card,
    Descriptions,
    Grid,
    Modal,
    Spin,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { EntityFormModal } from '@/components/shared/FormModal';
import { SearchInput } from '@/components/shared/SearchInput';
import AdvancedFilterPanel, { FilterField } from '@/components/shared/filters/AdvancedFilterPanel';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { MoldService } from '@/services/MoldService';
import { Mold, MoldFormData, MoldStatus, MoldType } from '@/types/Mold';
import { getMoldTableColumns, MoldTableColumnProps } from './_components/Columns';
import { getMoldFormFields } from './_components/moldFormConfig';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const SORT_DEFAULT = 'auditMetaData.createdAt,ASC';
const DEFAULT_PAGE_SIZE = 10;

const MOLD_TYPE_COLOR: Record<MoldType, string> = {
    PRESS: 'blue',
    COMPRESS: 'orange',
};

const MOLD_STATUS_COLOR: Record<MoldStatus, string> = {
    ACTIVE: 'green',
    MAINTENANCE: 'gold',
    RETIRED: 'red',
};

const moldQueryKeys = {
    lists: ['molds', 'list'] as const,
    list: (
        page: number,
        size: number,
        sort: string | string[],
        search: string,
        moldCode: string | undefined,
        moldName: string | undefined
    ) => ['molds', 'list', page, size, sort, search, moldCode, moldName] as const,
    detail: (moldId: number) => ['molds', 'detail', moldId] as const,
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
    const [sort, setSort] = useState<string | string[]>(SORT_DEFAULT);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [tempMoldCode, setTempMoldCode] = useState('');
    const [tempMoldName, setTempMoldName] = useState('');
    const [moldCodeFilter, setMoldCodeFilter] = useState<string | undefined>(undefined);
    const [moldNameFilter, setMoldNameFilter] = useState<string | undefined>(undefined);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleTableChange = useCallback(
        (
            pagination: TablePaginationConfig,
            _filters: Record<string, FilterValue | null>,
            sorter: SorterResult<Mold> | SorterResult<Mold>[]
        ) => {
            if (pagination) {
                setPage((pagination.current ?? 1) - 1);
                setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
            }

            const sorters = Array.isArray(sorter) ? sorter : [sorter];
            const validSorters = sorters
                .filter((s) => s.field && s.order)
                .map((s) => {
                    const field = Array.isArray(s.field) ? s.field.join('.') : String(s.field);
                    const order = s.order === 'ascend' ? 'ASC' : 'DESC';
                    return `${field},${order}`;
                });

            setSort(validSorters.length > 0
                ? (validSorters.length === 1 ? validSorters[0] : validSorters)
                : SORT_DEFAULT
            );
        },
        []
    );

    const moldsQuery = useQuery({
        queryKey: moldQueryKeys.list(
            page,
            pageSize,
            sort,
            debouncedSearch,
            moldCodeFilter,
            moldNameFilter
        ),
        queryFn: () =>
            MoldService.getMoldsPaginated({
                page,
                size: pageSize,
                sort,
                search: debouncedSearch || undefined,
                moldCode: moldCodeFilter,
                moldName: moldNameFilter,
            }),
    });

    const moldData = useMemo(() => moldsQuery.data?.content ?? [], [moldsQuery.data]);
    const totalElements = moldsQuery.data?.totalElements ?? 0;
    const isLoading = moldsQuery.isLoading || moldsQuery.isFetching;

    useEffect(() => {
        if (moldsQuery.error) {
            handleError(moldsQuery.error, { fallbackKey: 'moldManagement.fetchError' });
        }
    }, [moldsQuery.error, handleError]);

    const { mutateAsync: createMold } = useMutation({
        mutationFn: (data: MoldFormData) => MoldService.createMold(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists }),
    });

    const { mutateAsync: updateMold } = useMutation({
        mutationFn: (data: MoldFormData & { moldId: number }) => MoldService.updateMold(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: moldQueryKeys.lists });
            queryClient.invalidateQueries({ queryKey: moldQueryKeys.detail(variables.moldId) });
        },
    });

    const { mutateAsync: deleteMold } = useMutation({
        mutationFn: (moldId: number) => MoldService.deleteMold(moldId),
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
                        await deleteMold(mold.moldId);
                        toast.success(t('moldManagement.deleteSuccess'));
                    } catch (error) {
                        handleError(error, { fallbackKey: 'moldManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [checkPermission, deleteMold, handleError, t]
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
        setMoldCodeFilter(tempMoldCode.trim() || undefined);
        setMoldNameFilter(tempMoldName.trim() || undefined);
        setPage(0);
    }, [tempMoldCode, tempMoldName]);

    const handleResetFilters = useCallback(() => {
        setTempMoldCode('');
        setTempMoldName('');
        setMoldCodeFilter(undefined);
        setMoldNameFilter(undefined);
        setPage(0);
    }, []);

    const columnProps: MoldTableColumnProps = useMemo(
        () => ({
            onView: handleViewMold,
            onEdit: handleEditMold,
            onDelete: handleDeleteMold,
            isMobile,
            t,
            ability,
        }),
        [handleViewMold, handleEditMold, handleDeleteMold, isMobile, t, ability]
    );

    const columns = useMemo(() => getMoldTableColumns(columnProps), [columnProps]);

    const formFields = useMemo(() => getMoldFormFields(t, modalState.mode), [t, modalState.mode]);

    const filterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'moldCode',
                label: t('moldManagement.table.headers.moldCode'),
                placeholder: t('moldManagement.form.placeholders.moldCode'),
                value: tempMoldCode,
                onChange: setTempMoldCode,
                colProps: { xs: 24, sm: 12 },
            },
            {
                key: 'moldName',
                label: t('moldManagement.table.headers.moldName'),
                placeholder: t('moldManagement.form.placeholders.moldName'),
                value: tempMoldName,
                onChange: setTempMoldName,
                colProps: { xs: 24, sm: 12 },
            },
        ],
        [t, tempMoldCode, tempMoldName]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('moldManagement.title')}
                loading={isLoading}
                rightContent={
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <SearchInput
                            placeholder={t('moldManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                            showFilterIcon
                            onFilterClick={() => setShowAdvancedFilters((prev) => !prev)}
                            isFilterActive={showAdvancedFilters}
                        />
                        <Can I="create" a="mold">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                onClick={() => setModalState({ open: true, mode: 'create', data: null })}
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
                    onReset={handleResetFilters}
                    onApply={handleApplyFilters}
                    resetLabel={t('common.reset')}
                    applyLabel={t('common.search')}
                />
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
                            <Descriptions.Item label={t('moldManagement.table.headers.quantity')}>
                                {viewModalState.data.quantity}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('moldManagement.table.headers.moldType')}>
                                <Tag color={MOLD_TYPE_COLOR[viewModalState.data.moldType]}>
                                    {t(`moldManagement.moldType.${viewModalState.data.moldType}`)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('moldManagement.table.headers.status')}>
                                <Tag color={MOLD_STATUS_COLOR[viewModalState.data.status]}>
                                    {t(`moldManagement.status.${viewModalState.data.status}`)}
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
                                            ? dayjs(viewModalState.data.auditMetaData.createdAt).format(
                                                'DD/MM/YYYY HH:mm:ss'
                                            )
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.createdBy')}>
                                        {viewModalState.data.auditMetaData.createdBy || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t('common.auditInfo.updatedAt')}>
                                        {viewModalState.data.auditMetaData.updatedAt
                                            ? dayjs(viewModalState.data.auditMetaData.updatedAt).format(
                                                'DD/MM/YYYY HH:mm:ss'
                                            )
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
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                styles={{
                    body: {
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: isMobile ? 'auto' : 'hidden',
                    },
                }}
            >
                {moldsQuery.isLoading ? (
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
                    <Table<Mold>
                        columns={columns}
                        dataSource={moldData}
                        loading={isLoading}
                        onChange={handleTableChange}
                        rowKey="moldId"
                        pagination={{
                            current: page + 1,
                            pageSize,
                            total: totalElements,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        scroll={{
                            x: 'max-content',
                            y: isMobile ? undefined : 'calc(112vh - 420px)',
                        }}
                        bordered
                    />
                )}
            </Card>

            <EntityFormModal<MoldFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
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
        </>
    );
};

export default MoldListPage;
