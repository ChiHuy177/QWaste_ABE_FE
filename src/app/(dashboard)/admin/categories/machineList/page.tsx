'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Badge,
    Button,
    Card,
    Flex,
    Table,
    Grid,
    Spin,
    Modal,
    Descriptions,
    Row,
    Col,
    Image,
    Typography,
    Tag,
} from 'antd';
import dayjs from 'dayjs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { FilterOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Machine } from '@/types/Machine';
import { MachineTableColumnProps, getMachineListTableColumns } from './_components/Column';
import { MachineService } from '@/services/MachineService';
import { OperationTypeService } from '@/services/OperationTypeService';
import { EntityFormModal } from '@/components/shared/FormModal';
import { compressImage } from '@/components/shared/FormModal/fieldRenderers';
import {
    getMachineListFormFields,
    toOperationTypeOptions,
} from './_components/machineListFormConfig';
import { MachineFormData, MachineUpdateFormData } from '@/types/Machine';
import { SearchInput } from '@/components/shared/SearchInput';
import { useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import { SpaceWithChildrenResponse } from '@/types/Space';
import {
    mapSpaceTreeToTreeSelect,
    SpaceTreeSelect,
} from '@/components/shared/filters/SpaceTreeSelect';
import { SpaceService } from '@/services';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import MachineFilterInfo from '@/app/(dashboard)/admin/machines/_components/MachineFilterInfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FilterField } from '@/components/shared/filters/AdvancedFilterPanel';
import FilterDrawer from '@/components/shared/filters/FilterDrawer';
import { useUploadThing } from '@/utils/uploadthing';

const { useBreakpoint } = Grid;
const { Title } = Typography;
const SORT_DEFAULT = 'auditMetaData.createdAt,DESC';
const DEFAULT_PAGE_SIZE = 10;

const machineQueryKeys = {
    lists: ['machines', 'list'] as const,
    list: (
        spaceId: number | undefined,
        page: number,
        size: number,
        sort: string | string[],
        search: string,
        name: string | undefined,
        code: string | undefined,
        topic: string | undefined
    ) => ['machines', 'list', spaceId, page, size, sort, search, name, code, topic] as const,
    detail: (machineId: string) => ['machines', 'detail', machineId] as const,
};

const spaceQueryKeys = {
    levelWithChildren: (level: number) => ['spaces', 'level-with-children', level] as const,
    tree: ['spaces', 'tree'] as const,
};

const operationTypeQueryKeys = {
    lists: ['operationTypes', 'list'] as const,
};

const isLocalFile = (value: unknown): value is File => {
    return typeof File !== 'undefined' && value instanceof File;
};

const MachineListPageContent = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const deepLinkConsumedRef = useRef(false);
    const queryClient = useQueryClient();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const { startUpload } = useUploadThing('imageUploader');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'create',
        pendingAction: null,
    });
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | undefined>(undefined);
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: Machine | null;
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
    const [machineNameFilter, setMachineNameFilter] = useState<string | undefined>(undefined);
    const [machineCodeFilter, setMachineCodeFilter] = useState<string | undefined>(undefined);
    const [mqttTopicFilter, setMqttTopicFilter] = useState<string | undefined>(undefined);
    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    const activeFilterCount = [machineNameFilter, machineCodeFilter, mqttTopicFilter].filter(
        Boolean
    ).length;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        if (pagination) {
            setPage(pagination.current - 1);
            setPageSize(pagination.pageSize);
        }

        if (sorter) {
            const sorters = Array.isArray(sorter) ? sorter : [sorter];
            const validSorters = sorters
                .filter((s) => s.field && s.order)
                .map((s) => {
                    const field = Array.isArray(s.field) ? s.field.join('.') : s.field;
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

    const machinesQuery = useQuery({
        queryKey: machineQueryKeys.list(
            selectedSpaceId,
            page,
            pageSize,
            sort,
            debouncedSearch,
            machineNameFilter,
            machineCodeFilter,
            mqttTopicFilter
        ),
        queryFn: async () =>
            MachineService.getMachinesPaginated({
                page,
                size: pageSize,
                sort,
                search: debouncedSearch,
                spaceId: selectedSpaceId,
                machineName: machineNameFilter,
                machineCode: machineCodeFilter,
                topic: mqttTopicFilter,
            }),
        enabled: selectedSpaceId !== undefined,
    });
    const machineData = useMemo(() => {
        const rawData = machinesQuery.data;
        return Array.isArray(rawData) ? rawData : (rawData?.content ?? []);
    }, [machinesQuery.data]);

    const totalElements = useMemo(() => {
        const rawData = machinesQuery.data;
        return Array.isArray(rawData) ? rawData.length : (rawData?.totalElements ?? 0);
    }, [machinesQuery.data]);
    const loading = machinesQuery.isLoading;

    usePageTitle(t('pageTitle.machineList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const handleEditMachine = useCallback(
        async (machine: Machine) => {
            if (!checkPermission('update', 'machine')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: {
                    ...machine,
                    spaceId: machine.space?.spaceId ?? undefined,
                },
            });
            setIsFormLoading(true);

            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: machineQueryKeys.detail(machine.machineId),
                    queryFn: () => MachineService.getMachineById(machine.machineId),
                });
                setModalState({
                    open: true,
                    mode: 'edit',
                    data: {
                        ...detailData,
                        spaceId: detailData.space?.spaceId ?? undefined,
                    },
                });
            } catch (error: any) {
                console.error('Error fetching machine details:', error);
                handleError(error, { fallbackKey: 'machineListManagement.fetchError' });
                setModalState({ open: false, mode: 'create', data: null });
            } finally {
                setIsFormLoading(false);
            }
        },
        [checkPermission, handleError, queryClient]
    );

    const { mutateAsync: createMachine } = useMutation({
        mutationFn: (data: MachineFormData) => MachineService.createMachine(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.lists,
            });
        },
    });

    const { mutateAsync: updateMachine } = useMutation({
        mutationFn: (data: MachineUpdateFormData) => MachineService.updateMachine(data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.lists,
            });
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.detail(variables.machineId),
            });
        },
    });

    const { mutateAsync: deleteMachine } = useMutation({
        mutationFn: (machineId: string) => MachineService.deleteMachine(machineId),
        onSuccess: (_data, machineId) => {
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.lists,
            });
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.detail(machineId),
            });
        },
    });

    const { mutateAsync: restoreMachine } = useMutation({
        mutationFn: (machineId: string) => MachineService.restoreMachine(machineId),
        onSuccess: (_data, machineId) => {
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.lists,
            });
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.detail(machineId),
            });
        },
    });

    const levelOneSpacesQuery = useQuery({
        queryKey: spaceQueryKeys.levelWithChildren(1),
        queryFn: () => SpaceService.getSpacesByLevelWithChildren(1),
    });

    const spacesTreeQuery = useQuery({
        queryKey: spaceQueryKeys.tree,
        queryFn: () => SpaceService.getAllSpacesTree(),
    });

    const spacesTree = spacesTreeQuery.data ?? [];

    const spaceTreeSelectData = useMemo(() => mapSpaceTreeToTreeSelect(spacesTree), [spacesTree]);

    const operationTypesQuery = useQuery({
        queryKey: operationTypeQueryKeys.lists,
        queryFn: () => OperationTypeService.getAllOperationTypes(),
    });

    const operationTypeOptions = useMemo(
        () => toOperationTypeOptions(operationTypesQuery.data ?? []),
        [operationTypesQuery.data]
    );

    useEffect(() => {
        if (selectedSpaceId !== undefined) return;

        const firstSpace = levelOneSpacesQuery.data?.[0];
        if (firstSpace) {
            setSelectedSpaceId(firstSpace.spaceId);
        }
    }, [selectedSpaceId, levelOneSpacesQuery.data]);

    // Deep-link from floor-map: /admin/categories/machineList?createForSpaceId=123 filters the
    // list to that space and opens the create modal with the space preselected. The param is
    // consumed once (ref guard + URL cleanup) so refresh/back does not reopen the modal.
    useEffect(() => {
        if (deepLinkConsumedRef.current) return;

        const createForSpaceIdParam = searchParams.get('createForSpaceId');
        if (!createForSpaceIdParam) return;

        deepLinkConsumedRef.current = true;
        window.history.replaceState(null, '', window.location.pathname);

        const createForSpaceId = Number(createForSpaceIdParam);
        if (Number.isNaN(createForSpaceId) || !checkPermissionSilent('create', 'machine')) {
            return;
        }

        setSelectedSpaceId(createForSpaceId);
        setModalState({ open: true, mode: 'create', data: { spaceId: createForSpaceId } });
    }, [checkPermissionSilent, searchParams]);

    useEffect(() => {
        if (machinesQuery.error) {
            handleError(machinesQuery.error, { fallbackKey: 'machineListManagement.fetchError' });
        }
    }, [machinesQuery.error, handleError]);

    useEffect(() => {
        if (levelOneSpacesQuery.error || spacesTreeQuery.error) {
            handleError(levelOneSpacesQuery.error || spacesTreeQuery.error, {
                fallbackKey: 'spaceManagement.fetchError',
            });
        }
    }, [levelOneSpacesQuery.error, spacesTreeQuery.error, handleError]);

    const handleDeleteMachine = useCallback(
        (machine: Machine) => {
            if (!checkPermission('delete', 'machine')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const machineId = machine.machineId;
                        await deleteMachine(machineId);
                        toast.success(t('machineListManagement.deleteSuccess'));
                    } catch (error) {
                        console.error('Error deleting machine:', error);
                        handleError(error, { fallbackKey: 'machineListManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, checkPermission, deleteMachine, handleError]
    );

    const handleRestoreMachine = useCallback(
        async (machine: Machine) => {
            try {
                const machineId = machine.machineId;
                await restoreMachine(machineId);
                toast.success(t('machineListManagement.restoreSuccess'));
            } catch (error) {
                console.error('Error restoring machine:', error);
                handleError(error, { fallbackKey: 'machineListManagement.restoreError' });
            }
        },
        [t, restoreMachine, handleError]
    );

    const handleViewMachine = useCallback(
        async (machine: Machine) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: machineQueryKeys.detail(machine.machineId),
                    queryFn: () => MachineService.getMachineById(machine.machineId),
                });
                setViewModalState((prev) => ({ ...prev, data: detailData }));
            } catch (error) {
                console.error('Error fetching machine details for view:', error);
                handleError(error, { fallbackKey: 'machineListManagement.fetchError' });
                setViewModalState((prev) => ({ ...prev, open: false }));
            } finally {
                setViewModalState((prev) => ({ ...prev, loading: false }));
            }
        },
        [handleError, queryClient]
    );

    const columnProps: MachineTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditMachine,
            onView: handleViewMachine,
            onDelete: handleDeleteMachine,
            onRestore: handleRestoreMachine,
            isMobile,
            t,
            ability,
        }),
        [
            handleEditMachine,
            handleDeleteMachine,
            handleRestoreMachine,
            handleViewMachine,
            isMobile,
            t,
            ability,
        ]
    );

    const columns = useMemo(() => getMachineListTableColumns(columnProps), [columnProps]);

    const filteredMachineData = useMemo(() => {
        return machineData;
    }, [machineData]);

    const handleSpaceChange = (value: number | undefined) => {
        setSelectedSpaceId(value);
        setPage(0);
    };

    const handleSubmit = async (data: MachineFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const uploadMachineImageIfNeeded = async (value: unknown): Promise<string> => {
        if (!value) return '';
        if (!isLocalFile(value)) return String(value);

        const shouldPreserveOriginal =
            value.type === 'image/svg+xml' || value.name.toLowerCase().endsWith('.svg');
        const uploadFile = shouldPreserveOriginal ? value : await compressImage(value);
        const uploadResults = await startUpload([uploadFile]);
        const uploadResult = uploadResults?.[0];
        const imageUrl = uploadResult?.ufsUrl || uploadResult?.url;

        if (!imageUrl) {
            throw new Error('Image upload failed');
        }

        return imageUrl;
    };

    const executeSubmit = async (data: MachineFormData, mode: 'create' | 'edit') => {
        try {
            const machineImage = await uploadMachineImageIfNeeded((data as any).machineImage);
            const submitValues = { ...data, machineImage };

            if (mode === 'create') {
                await createMachine(submitValues as MachineFormData);
                try {
                    const spaceDetail = await SpaceService.getSpaceById(submitValues.spaceId);
                    toast.success(
                        t('machineListManagement.form.createSuccessWithSpace', {
                            spaceName: spaceDetail.spaceName,
                        })
                    );
                } catch {
                    toast.success(t('machineListManagement.form.createSuccess'));
                }

                if (selectedSpaceId !== submitValues.spaceId) {
                    handleSpaceChange(submitValues.spaceId);
                    return;
                }
            } else {
                if (modalState.data?.machineId) {
                    const submitData = {
                        ...submitValues,
                        machineId: modalState.data.machineId,
                    };
                    await updateMachine(submitData as MachineUpdateFormData);
                    toast.success(t('machineListManagement.updateSuccess'));

                    if (selectedSpaceId !== submitValues.spaceId) {
                        handleSpaceChange(submitValues.spaceId);
                        return;
                    }
                }
            }
        } catch (error: any) {
            console.error('Error submitting machine:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'machineListManagement.form.createError'
                        : 'machineListManagement.updateError',
            });
            throw error;
        }
    };

    const handleConfirmAction = async () => {
        if (confirmModalState.pendingAction) {
            try {
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
        () =>
            getMachineListFormFields(
                t,
                modalState.mode,
                operationTypeOptions,
                operationTypesQuery.isLoading
            ),
        [t, modalState.mode, operationTypeOptions, operationTypesQuery.isLoading]
    );

    // Form field tên 'operationTypeId' (phẳng) nhưng Machine trả 'operationType' (nested) —
    // map lại để EntityFormModal.setFieldsValue điền đúng Select khi edit.
    const machineFormInitialData = useMemo(() => {
        if (!modalState.data) return modalState.data;
        return {
            ...modalState.data,
            operationTypeId: modalState.data.operationType?.operationTypeId,
        };
    }, [modalState.data]);

    const machineFilterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'machineName',
                label: t('machineListManagement.table.headers.machineName'),
                placeholder: t('machineListManagement.filters.namePlaceholder'),
                value: machineNameFilter ?? '',
            },
            {
                key: 'machineCode',
                label: t('machineListManagement.table.headers.machineCode'),
                placeholder: t('machineListManagement.filters.machineCodePlaceholder'),
                value: machineCodeFilter ?? '',
            },
            {
                key: 'mqttTopic',
                label: t('machineListManagement.form.fields.topic'),
                placeholder: t('machineListManagement.filters.topicPlaceholder'),
                value: mqttTopicFilter ?? '',
            },
        ],
        [t, machineNameFilter, machineCodeFilter, mqttTopicFilter]
    );

    const findSpacePath = (
        tree: SpaceWithChildrenResponse[],
        targetId: number,
        currentPath: string[] = []
    ): string[] | null => {
        for (const node of tree) {
            const nextPath = [...currentPath, node.spaceName];
            if (node.spaceId === targetId) return nextPath;
            if (node.children) {
                const found = findSpacePath(node.children, targetId, nextPath);
                if (found) return found;
            }
        }
        return null;
    };

    const currentSpacePath = useMemo(() => {
        if (selectedSpaceId === undefined || spacesTree.length === 0) return undefined;
        return findSpacePath(spacesTree, selectedSpaceId) || undefined;
    }, [selectedSpaceId, spacesTree]);

    const handleResetFilters = useCallback(() => {
        setMachineNameFilter(undefined);
        setMachineCodeFilter(undefined);
        setMqttTopicFilter(undefined);
        setPage(0);
    }, []);

    const handleApplyFilters = useCallback((values: Record<string, string>) => {
        setMachineNameFilter(values.machineName?.trim() || undefined);
        setMachineCodeFilter(values.machineCode?.trim() || undefined);
        setMqttTopicFilter(values.mqttTopic?.trim() || undefined);
        setPage(0);
    }, []);

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
                title={t('machineListManagement.title')}
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
                            placeholder={t('machineListManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <FilterDrawer
                            open={showAdvancedFilters}
                            onClose={() => setShowAdvancedFilters(false)}
                            fields={machineFilterFields}
                            onReset={handleResetFilters}
                            onApply={handleApplyFilters}
                            resetLabel={t('common.reset')}
                            applyLabel={t('common.search')}
                            title={t('common.advancedFilters')}
                        >
                            <Badge count={activeFilterCount} size="small" offset={[-6, 4]}>
                                <Button
                                    icon={<FilterOutlined />}
                                    type={showAdvancedFilters ? 'primary' : 'default'}
                                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                />
                            </Badge>
                        </FilterDrawer>

                        <SpaceTreeSelect
                            value={selectedSpaceId}
                            onChange={handleSpaceChange}
                            treeData={spaceTreeSelectData}
                            style={isMobile ? { width: '100%' } : { width: 300 }}
                        />
                        {checkPermissionSilent('create', 'machine') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('machineListManagement.addMachine')}
                            </Button>
                        )}
                    </div>
                }
            />

            <Modal
                title={viewModalState.data?.machineName}
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '95%' : 720}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Row gutter={[16, 16]}>
                            {viewModalState.data.machineImage && (
                                <Col xs={24} sm={8} md={6}>
                                    <Image
                                        src={viewModalState.data.machineImage}
                                        alt={viewModalState.data.machineName || 'machine'}
                                        style={{ width: '100%', borderRadius: 6 }}
                                        preview
                                    />
                                </Col>
                            )}

                            <Col
                                xs={24}
                                sm={viewModalState.data.machineImage ? 16 : 24}
                                md={viewModalState.data.machineImage ? 18 : 24}
                            >
                                <Descriptions column={isMobile ? 1 : 2} size="small" bordered>
                                    <Descriptions.Item
                                        label={t('machineListManagement.table.headers.machineCode')}
                                    >
                                        {viewModalState.data.machineCode || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label={t('machineListManagement.table.headers.space')}
                                    >
                                        {viewModalState.data.space?.spaceName || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label={t('machineListManagement.table.headers.power')}
                                    >
                                        {viewModalState.data.power
                                            ? `${viewModalState.data.power} kW`
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label={t(
                                            'machineListManagement.table.headers.operationType'
                                        )}
                                    >
                                        {viewModalState.data.operationType?.operationTypeName ??
                                            '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label={t('machineListManagement.table.headers.status')}
                                    >
                                        {viewModalState.data.softDeleteMetaData?.isDeleted ? (
                                            <Tag color="red">
                                                {t('machineListManagement.status.inactive')}
                                            </Tag>
                                        ) : (
                                            <Tag color="green">
                                                {t('machineListManagement.status.active')}
                                            </Tag>
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label={t('machineListManagement.table.headers.description')}
                                        span={2}
                                    >
                                        <div style={{ whiteSpace: 'pre-wrap' }}>
                                            {viewModalState.data.description || '-'}
                                        </div>
                                    </Descriptions.Item>
                                </Descriptions>

                                {viewModalState.data.auditMetaData && (
                                    <div style={{ marginTop: 16 }}>
                                        <Title level={5} style={{ marginBottom: 8 }}>
                                            {t('common.auditInfo.title')}
                                        </Title>
                                        <Descriptions
                                            column={isMobile ? 1 : 2}
                                            size="small"
                                            bordered
                                        >
                                            <Descriptions.Item
                                                label={t('common.auditInfo.createdAt')}
                                            >
                                                {viewModalState.data.auditMetaData.createdAt
                                                    ? dayjs(
                                                          viewModalState.data.auditMetaData
                                                              .createdAt
                                                      ).format('DD/MM/YYYY HH:mm:ss')
                                                    : '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={t('common.auditInfo.createdBy')}
                                            >
                                                {viewModalState.data.auditMetaData.createdBy || '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={t('common.auditInfo.updatedAt')}
                                            >
                                                {viewModalState.data.auditMetaData.updatedAt
                                                    ? dayjs(
                                                          viewModalState.data.auditMetaData
                                                              .updatedAt
                                                      ).format('DD/MM/YYYY HH:mm:ss')
                                                    : '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={t('common.auditInfo.updatedBy')}
                                            >
                                                {viewModalState.data.auditMetaData.updatedBy || '-'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </div>
                                )}
                            </Col>
                        </Row>

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

            <MachineFilterInfo
                totalMachines={totalElements}
                displayedMachines={filteredMachineData.length}
                spacePath={currentSpacePath}
                isFiltered={searchTerm.trim().length > 0}
            />

            {activeFilterCount > 0 && (
                <Flex gap={8} align="center" wrap style={{ marginBottom: 12 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <FilterOutlined style={{ marginRight: 4 }} />
                        {t('common.activeFilters')}:
                    </Typography.Text>
                    {machineNameFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setMachineNameFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('machineListManagement.table.headers.machineName')}:{' '}
                            {machineNameFilter}
                        </Tag>
                    )}
                    {machineCodeFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setMachineCodeFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('machineListManagement.table.headers.machineCode')}:{' '}
                            {machineCodeFilter}
                        </Tag>
                    )}
                    {mqttTopicFilter && (
                        <Tag
                            closable
                            onClose={() => {
                                setMqttTopicFilter(undefined);
                                setPage(0);
                            }}
                        >
                            {t('machineListManagement.form.fields.topic')}: {mqttTopicFilter}
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
                <div
                    ref={tableContainerRef}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                    }}
                >
                    <Table<Machine>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredMachineData}
                        loading={loading}
                        onChange={handleTableChange}
                        rowKey={(record) => record.machineId}
                        pagination={{
                            current: page + 1,
                            pageSize: pageSize,
                            total: totalElements,
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
                            x: 1670,
                            y: tableScrollY,
                        }}
                        style={{ height: '100%' }}
                        sticky
                        bordered
                    />
                </div>
            </Card>

            <EntityFormModal<MachineFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={machineFormInitialData}
                fields={formFields}
                title={{
                    create: t('machineListManagement.form.createTitle'),
                    edit: t('machineListManagement.form.editTitle'),
                }}
                description={{
                    create: t('machineListManagement.form.createDescription'),
                    edit: t('machineListManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('machineListManagement.form.buttons.cancel'),
                    create: t('machineListManagement.form.buttons.create'),
                    edit: t('machineListManagement.form.buttons.update'),
                    saving: t('machineListManagement.form.buttons.saving'),
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

// useSearchParams requires a Suspense boundary for static prerendering.
const MachineListPage = () => (
    <Suspense fallback={null}>
        <MachineListPageContent />
    </Suspense>
);

export default MachineListPage;
