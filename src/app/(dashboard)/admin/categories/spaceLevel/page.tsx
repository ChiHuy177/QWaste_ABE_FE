'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceLevelService } from '@/services/SpaceLevelService';
import { toast } from 'sonner';
import { Button, Card, Flex, Table, Grid, Spin, Modal, Descriptions, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FilterOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    SpaceLevelDTO,
    SpaceLevelCreationRequest,
    SpaceLevelUpdationRequest,
} from '@/types/SpaceLevel';
import {
    getSpaceLevelTableColumns,
    type SpaceLevelTableColumnProps,
    getSpaceLevelFormFields,
} from '@/features/dashboard/categories/spaceLevel';
import { EntityFormModal } from '@/components/shared/FormModal';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdvancedFilterPanel, { FilterField } from '@/components/shared/filters/AdvancedFilterPanel';
import { UtilsService } from '@/services/UtilsService';

const { useBreakpoint } = Grid;
const { Title } = Typography;

interface SpaceLevelFormData {
    spaceLevel?: number;
    spaceLevelName?: string;
}

const SORT_DEFAULT = 'spaceLevel,ASC';
const DEFAULT_PAGE_SIZE = 10;

const spaceLevelQueryKeys = {
    lists: ['space-levels', 'list'] as const,
    list: (
        page: number,
        size: number,
        sort: string | string[],
        search: string,
        spaceLevel: number | undefined,
        spaceLevelName: string | undefined
    ) => ['space-levels', 'list', page, size, sort, search, spaceLevel, spaceLevelName] as const,
    highest: ['space-levels', 'highest'] as const,
    detail: (spaceLevelId: number | string) => ['space-levels', 'detail', spaceLevelId] as const,
};

const SpaceLevelListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: Partial<SpaceLevelDTO> | null;
    }>({ open: false, mode: 'create', data: null });

    const [isFormLoading, setIsFormLoading] = useState(false);

    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const ability = useAbility();
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
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: SpaceLevelDTO | null;
    }>({
        open: false,
        loading: false,
        data: null,
    });

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sort, setSort] = useState<string | string[]>(SORT_DEFAULT);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [spaceLevelFilter, setSpaceLevelFilter] = useState<number | undefined>(undefined);
    const [spaceLevelNameFilter, setSpaceLevelNameFilter] = useState<string | undefined>(undefined);

    const activeFilterCount = [spaceLevelFilter, spaceLevelNameFilter].filter(Boolean).length;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleTableChange = (
        pagination: TablePaginationConfig,
        _filters: Record<string, FilterValue | null>,
        sorter: SorterResult<SpaceLevelDTO> | SorterResult<SpaceLevelDTO>[]
    ) => {
        if (pagination) {
            setPage((pagination.current ?? 1) - 1);
            setPageSize(pagination.pageSize ?? 10);
        }

        if (sorter) {
            const sorters = Array.isArray(sorter) ? sorter : [sorter];
            const validSorters = sorters
                .filter((s) => s.field && s.order)
                .map((s) => {
                    const field = Array.isArray(s.field) ? s.field.join('.') : String(s.field);
                    const order = s.order === 'ascend' ? 'ASC' : 'DESC';
                    return `${field},${order}`;
                });
            if (validSorters.length > 0) {
                setSort(validSorters.length === 1 ? validSorters[0] : validSorters);
            } else {
                setSort(SORT_DEFAULT);
            }
        } else {
            setSort(SORT_DEFAULT);
        }
    };

    usePageTitle(t('pageTitle.spaceLevelList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const spaceLevelsQuery = useQuery({
        queryKey: spaceLevelQueryKeys.list(
            page,
            pageSize,
            sort,
            debouncedSearch,
            spaceLevelFilter,
            spaceLevelNameFilter
        ),
        queryFn: async () =>
            SpaceLevelService.getSpaceLevelsPaginated({
                page,
                size: pageSize,
                sort,
                spaceLevel: spaceLevelFilter,
                search: spaceLevelNameFilter || debouncedSearch, // use exact filter if specified, fallback to global
            }),
    });

    const levelData = useMemo(() => {
        const rawData = spaceLevelsQuery.data;
        return Array.isArray(rawData) ? rawData : (rawData?.content ?? []);
    }, [spaceLevelsQuery.data]);

    const totalElements = useMemo(() => {
        const rawData = spaceLevelsQuery.data;
        return Array.isArray(rawData) ? rawData.length : (rawData?.totalElements ?? 0);
    }, [spaceLevelsQuery.data]);
    const loading = spaceLevelsQuery.isLoading || spaceLevelsQuery.isFetching;

    useEffect(() => {
        if (spaceLevelsQuery.error) {
            handleError(spaceLevelsQuery.error, { fallbackKey: 'spaceLevelManagement.fetchError' });
        }
    }, [spaceLevelsQuery.error, handleError]);

    const handleCreateLevel = useCallback(async () => {
        try {
            setIsFormLoading(true);
            const highestLevel = await queryClient.fetchQuery({
                queryKey: spaceLevelQueryKeys.highest,
                queryFn: () => UtilsService.getHighestSpaceLevel(),
            });

            setModalState({
                open: true,
                mode: 'create',
                data: { spaceLevel: highestLevel + 1 },
            });
        } catch (error) {
            console.error('Failed to fetch highest level', error);
            handleError(error, { fallbackKey: 'spaceLevelManagement.fetchError' });
        } finally {
            setIsFormLoading(false);
        }
    }, [handleError, queryClient]);

    const handleEditLevel = useCallback(
        async (level: SpaceLevelDTO) => {
            if (!checkPermission('update', 'space_level')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: null,
            });
            setIsFormLoading(true);

            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: spaceLevelQueryKeys.detail(level.spaceLevelId),
                    queryFn: () => SpaceLevelService.getSpaceLevelById(level.spaceLevelId),
                });
                setModalState({
                    open: true,
                    mode: 'edit',
                    data: detailData,
                });
            } catch (error) {
                console.error('Error fetching space level details:', error);
                handleError(error, { fallbackKey: 'spaceLevelManagement.fetchError' });
                setModalState({ open: false, mode: 'create', data: null });
            } finally {
                setIsFormLoading(false);
            }
        },
        [checkPermission, handleError, queryClient]
    );

    const { mutateAsync: createSpaceLevel } = useMutation({
        mutationFn: (data: SpaceLevelCreationRequest) => SpaceLevelService.createSpaceLevel(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: spaceLevelQueryKeys.lists });
            queryClient.invalidateQueries({ queryKey: spaceLevelQueryKeys.highest });
        },
    });

    const { mutateAsync: updateSpaceLevel } = useMutation({
        mutationFn: (data: SpaceLevelUpdationRequest) => SpaceLevelService.updateSpaceLevel(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: spaceLevelQueryKeys.lists });
            queryClient.invalidateQueries({
                queryKey: spaceLevelQueryKeys.detail(variables.spaceLevelId),
            });
        },
    });

    const { mutateAsync: deleteSpaceLevel } = useMutation({
        mutationFn: (spaceLevelId: number | string) =>
            SpaceLevelService.deleteSpaceLevel(spaceLevelId),
        onSuccess: (_data, spaceLevelId) => {
            queryClient.invalidateQueries({ queryKey: spaceLevelQueryKeys.lists });
            queryClient.invalidateQueries({ queryKey: spaceLevelQueryKeys.highest });
            queryClient.invalidateQueries({ queryKey: spaceLevelQueryKeys.detail(spaceLevelId) });
        },
    });

    const handleDeleteLevel = useCallback(
        (level: SpaceLevelDTO) => {
            if (!checkPermission('delete', 'space_level')) {
                return;
            }
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await deleteSpaceLevel(level.spaceLevelId);
                        toast.success(t('spaceLevelManagement.deleteSuccess'));
                    } catch (error) {
                        console.error('Error deleting space level:', error);
                        handleError(error, {
                            fallbackKey: 'spaceLevelManagement.deleteError',
                        });
                        throw error;
                    }
                },
            });
        },
        [t, checkPermission, deleteSpaceLevel, handleError]
    );

    const handleViewLevel = useCallback(
        async (level: SpaceLevelDTO) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: spaceLevelQueryKeys.detail(level.spaceLevelId),
                    queryFn: () => SpaceLevelService.getSpaceLevelById(level.spaceLevelId),
                });
                setViewModalState((prev) => ({ ...prev, data: detailData }));
            } catch (error) {
                console.error('Error fetching space level details for view:', error);
                handleError(error, { fallbackKey: 'spaceLevelManagement.fetchError' });
                setViewModalState((prev) => ({ ...prev, open: false }));
            } finally {
                setViewModalState((prev) => ({ ...prev, loading: false }));
            }
        },
        [handleError, queryClient]
    );

    const columnProps: SpaceLevelTableColumnProps = useMemo(
        () => ({
            onView: handleViewLevel,
            onEdit: handleEditLevel,
            onDelete: handleDeleteLevel,
            isMobile,
            t,
            ability,
        }),
        [handleEditLevel, handleDeleteLevel, handleViewLevel, isMobile, t, ability]
    );

    const columns = useMemo(() => getSpaceLevelTableColumns(columnProps), [columnProps]);

    const filteredData = levelData;

    const handleSubmit = async (data: SpaceLevelFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: SpaceLevelFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                const payload: SpaceLevelCreationRequest = {
                    spaceLevel: data.spaceLevel ?? 0,
                    spaceLevelName: data.spaceLevelName || '',
                };
                await createSpaceLevel(payload);
                toast.success(t('spaceLevelManagement.form.createSuccess'));
            } else {
                if (modalState.data?.spaceLevelId) {
                    const submitData: SpaceLevelUpdationRequest = {
                        spaceLevelId: modalState.data.spaceLevelId,
                        spaceLevel: data.spaceLevel ?? 0,
                        spaceLevelName: data.spaceLevelName || '',
                    };
                    await updateSpaceLevel(submitData);
                    toast.success(t('spaceLevelManagement.form.updateSuccess'));
                }
            }
        } catch (error) {
            console.error('Error submitting space level:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'spaceLevelManagement.form.createError'
                        : 'spaceLevelManagement.form.updateError',
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

    const formFields = useMemo(
        () => getSpaceLevelFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    const spaceLevelFilterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'spaceLevel',
                label: t('spaceLevelManagement.table.headers.spaceLevel'),
                placeholder: t('spaceLevelManagement.form.placeholders.level'),
                value: spaceLevelFilter !== undefined ? String(spaceLevelFilter) : '',
                onChange: (val) => {
                    const trimmed = val.trim();
                    const levelNum = trimmed ? Number(trimmed) : undefined;
                    setSpaceLevelFilter(
                        levelNum !== undefined && !isNaN(levelNum) ? levelNum : undefined
                    );
                },
                colProps: { xs: 24, sm: 12, md: 12 },
            },
            {
                key: 'spaceLevelName',
                label: t('spaceLevelManagement.table.headers.spaceLevelName'),
                placeholder: t('spaceLevelManagement.form.placeholders.levelName'),
                value: spaceLevelNameFilter ?? '',
                onChange: (val) => setSpaceLevelNameFilter(val.trim() || undefined),
                colProps: { xs: 24, sm: 12, md: 12 },
            },
        ],
        [t, spaceLevelFilter, spaceLevelNameFilter]
    );

    const handleResetFilters = useCallback(() => {
        setSpaceLevelFilter(undefined);
        setSpaceLevelNameFilter(undefined);
        setPage(0);
    }, []);

    const handleApplyFilters = useCallback(() => {
        setPage(0);
    }, []);
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
                title={t('spaceLevelManagement.title')}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('spaceLevelManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                            showFilterIcon
                            onFilterClick={() => setShowAdvancedFilters((prev) => !prev)}
                            isFilterActive={showAdvancedFilters}
                            activeFilterCount={activeFilterCount}
                        />
                        <Can I="create" a="space_level">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                onClick={handleCreateLevel}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('spaceLevelManagement.addLevel')}
                            </Button>
                        </Can>
                    </div>
                }
            />

            {showAdvancedFilters && (
                <AdvancedFilterPanel
                    fields={spaceLevelFilterFields}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    resetLabel={t('common.reset')}
                    applyLabel={t('common.search')}
                    title={t('common.advancedFilters')}
                />
            )}

            <Modal
                title={
                    <div style={{ marginTop: '20px' }}>{viewModalState.data?.spaceLevelName}</div>
                }
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
                                label={t('spaceLevelManagement.table.headers.spaceLevel')}
                            >
                                {viewModalState.data.spaceLevel || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('spaceLevelManagement.table.headers.spaceLevelName')}
                            >
                                {viewModalState.data.spaceLevelName || '-'}
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
            {activeFilterCount > 0 && (
                <Flex gap={8} align="center" wrap style={{ marginBottom: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <FilterOutlined style={{ marginRight: 4 }} />
                        {t('common.activeFilters')}:
                    </Typography.Text>
                    {spaceLevelFilter !== undefined && (
                        <Tag
                            closable
                            onClose={() => {
                                setSpaceLevelFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('spaceLevelManagement.table.headers.spaceLevel')}: {spaceLevelFilter}
                        </Tag>
                    )}
                    {spaceLevelNameFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setSpaceLevelNameFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('spaceLevelManagement.table.headers.spaceLevelName')}:{' '}
                            {spaceLevelNameFilter}
                        </Tag>
                    )}
                </Flex>
            )}

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
                    <Table<SpaceLevelDTO>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        onChange={handleTableChange}
                        rowKey="spaceLevelId"
                        pagination={{
                            current: page + 1,
                            pageSize: pageSize,
                            total: totalElements,
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

            <EntityFormModal<SpaceLevelFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('spaceLevelManagement.form.createTitle'),
                    edit: t('spaceLevelManagement.form.editTitle'),
                }}
                description={{
                    create: t('spaceLevelManagement.form.createDescription'),
                    edit: t('spaceLevelManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('spaceLevelManagement.form.buttons.cancel'),
                    create: t('spaceLevelManagement.form.buttons.create'),
                    edit: t('spaceLevelManagement.form.buttons.save'),
                    saving: t('spaceLevelManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
                loading={isFormLoading}
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

export default SpaceLevelListPage;
