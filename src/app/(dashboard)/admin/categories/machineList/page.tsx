'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Button,
    Card,
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
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Machine } from '@/types/Machine';
import { MachineTableColumnProps, getMachineListTableColumns } from './_components/Column';
import { MachineService } from '@/services/MachineService';
import {
    DemoMachineService,
    DemoSpaceService,
    USE_MOCK_FACTORY_OVERVIEW,
} from '@/mockData/admin/factory';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getMachineListFormFields } from './_components/machineListFormConfig';
import { MachineFormData, MachineUpdateFormData } from '@/types/Machine';
import { SearchInput } from '@/components/shared/SearchInput';
import { useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { SpaceWithChildrenResponse } from '@/types/Space';
import {
    mapSpaceTreeToTreeSelect,
    SpaceTreeSelect,
} from '@/components/shared/filters/SpaceTreeSelect';
import { SpaceService } from '@/services/SpaceService';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import MachineFilterInfo from '@/app/(dashboard)/admin/machines/_components/MachineFilterInfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdvancedFilterPanel, { FilterField } from '@/components/shared/filters/AdvancedFilterPanel';

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
        code: string | undefined,
        name: string | undefined,
        prop: string | undefined,
        topic: string | undefined
    ) => ['machines', 'list', spaceId, page, size, sort, search, code, name, prop, topic] as const,
    detail: (machineId: string) => ['machines', 'detail', machineId] as const,
};

const spaceQueryKeys = {
    levelWithChildren: (level: number) => ['spaces', 'level-with-children', level] as const,
    tree: ['spaces', 'tree'] as const,
};

const activeMachineService = USE_MOCK_FACTORY_OVERVIEW ? DemoMachineService : MachineService;
const activeSpaceService = USE_MOCK_FACTORY_OVERVIEW ? DemoSpaceService : SpaceService;

const MachineListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
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
    const [tempMachineCode, setTempMachineCode] = useState('');
    const [tempMachineName, setTempMachineName] = useState('');
    const [tempPropertyCode, setTempPropertyCode] = useState('');
    const [tempMqttTopic, setTempMqttTopic] = useState('');

    const [machineCodeFilter, setMachineCodeFilter] = useState<string | undefined>(undefined);
    const [machineNameFilter, setMachineNameFilter] = useState<string | undefined>(undefined);
    const [propertyCodeFilter, setPropertyCodeFilter] = useState<string | undefined>(undefined);
    const [mqttTopicFilter, setMqttTopicFilter] = useState<string | undefined>(undefined);

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
            machineCodeFilter,
            machineNameFilter,
            propertyCodeFilter,
            mqttTopicFilter
        ),
        queryFn: async () => activeMachineService.getMachinesPaginated({
            page,
            size: pageSize,
            sort,
            search: debouncedSearch,
            spaceId: selectedSpaceId,
            machineCode: machineCodeFilter,
            machineName: machineNameFilter,
            propertyCode: propertyCodeFilter,
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
    const loading = machinesQuery.isLoading || machinesQuery.isFetching;

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
                    spaceId: machine.space.spaceId,
                },
            });
            setIsFormLoading(true);

            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: machineQueryKeys.detail(machine.machineId),
                    queryFn: () => activeMachineService.getMachineById(machine.machineId),
                });
                setModalState({
                    open: true,
                    mode: 'edit',
                    data: detailData,
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
        mutationFn: (data: MachineFormData) => activeMachineService.createMachine(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.lists,
            });
        },
    });

    const { mutateAsync: updateMachine } = useMutation({
        mutationFn: (data: MachineUpdateFormData) => activeMachineService.updateMachine(data),
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
        mutationFn: (machineId: string) => activeMachineService.deleteMachine(machineId),
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
        mutationFn: (machineId: string) => activeMachineService.restoreMachine(machineId),
        onSuccess: (_data, machineId) => {
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.lists,
            });
            queryClient.invalidateQueries({
                queryKey: machineQueryKeys.detail(machineId),
            });
        },
    });

    const levelThreeSpacesQuery = useQuery({
        queryKey: spaceQueryKeys.levelWithChildren(3),
        queryFn: () => activeSpaceService.getSpacesByLevelWithChildren(3),
    });

    const spacesTreeQuery = useQuery({
        queryKey: spaceQueryKeys.tree,
        queryFn: () => activeSpaceService.getAllSpacesTree(),
    });

    const spacesTree = spacesTreeQuery.data ?? [];

    const spaceTreeSelectData = useMemo(
        () => mapSpaceTreeToTreeSelect(spacesTree),
        [spacesTree]
    );

    useEffect(() => {
        if (selectedSpaceId !== undefined) return;

        const firstSpace = levelThreeSpacesQuery.data?.[0];
        if (firstSpace) {
            setSelectedSpaceId(firstSpace.spaceId);
        }
    }, [selectedSpaceId, levelThreeSpacesQuery.data]);

    useEffect(() => {
        if (machinesQuery.error) {
            handleError(machinesQuery.error, { fallbackKey: 'machineListManagement.fetchError' });
        }
    }, [machinesQuery.error, handleError]);

    useEffect(() => {
        if (levelThreeSpacesQuery.error || spacesTreeQuery.error) {
            handleError(levelThreeSpacesQuery.error || spacesTreeQuery.error, {
                fallbackKey: 'spaceManagement.fetchError',
            });
        }
    }, [levelThreeSpacesQuery.error, spacesTreeQuery.error, handleError]);

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
            if (!checkPermission('update', 'machine')) {
                return;
            }

            try {
                const machineId = machine.machineId;
                await restoreMachine(machineId);
                toast.success(t('machineListManagement.restoreSuccess'));
            } catch (error) {
                console.error('Error restoring machine:', error);
                handleError(error, { fallbackKey: 'machineListManagement.restoreError' });
            }
        },
        [t, checkPermission, restoreMachine, handleError]
    );

    const handleViewMachine = useCallback(
        async (machine: Machine) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await queryClient.fetchQuery({
                    queryKey: machineQueryKeys.detail(machine.machineId),
                    queryFn: () => activeMachineService.getMachineById(machine.machineId),
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

    const handleCreateMachine = useCallback(() => {
        if (!checkPermission('create', 'machine')) {
            return;
        }

        setModalState({ open: true, mode: 'create', data: null });
    }, [checkPermission]);

    const handleSubmit = async (data: MachineFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: MachineFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await createMachine(data as MachineFormData);
                try {
                    const spaceDetail = await activeSpaceService.getSpaceById(data.spaceId);
                    toast.success(
                        t('machineListManagement.form.createSuccessWithSpace', {
                            spaceName: spaceDetail.spaceName,
                        })
                    );
                } catch {
                    toast.success(t('machineListManagement.form.createSuccess'));
                }

                if (selectedSpaceId !== data.spaceId) {
                    handleSpaceChange(data.spaceId);
                    return;
                }
            } else {
                if (modalState.data?.machineId) {
                    const submitData = {
                        ...data,
                        machineId: modalState.data.machineId,
                    };
                    await updateMachine(submitData as MachineUpdateFormData);
                    toast.success(t('machineListManagement.updateSuccess'));

                    if (selectedSpaceId !== data.spaceId) {
                        handleSpaceChange(data.spaceId);
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

    const spaceFormOptions = useMemo(() => {
        const options: { value: number; label: string }[] = [];

        const collectOptions = (
            spaces: SpaceWithChildrenResponse[],
            parentPath: string = ''
        ) => {
            spaces.forEach((space) => {
                const label = parentPath ? `${parentPath} / ${space.spaceName}` : space.spaceName;
                options.push({ value: space.spaceId, label });
                collectOptions(space.children ?? [], label);
            });
        };

        collectOptions(spacesTree);

        return options;
    }, [spacesTree]);

    const formFields = useMemo(() => {
        const fields = getMachineListFormFields(t, modalState.mode);

        if (!USE_MOCK_FACTORY_OVERVIEW) return fields;

        return fields.map((field) =>
            field.name === 'spaceId'
                ? {
                    ...field,
                    type: 'select' as const,
                    options: spaceFormOptions,
                }
                : field
        );
    }, [t, modalState.mode, spaceFormOptions]);

    const machineFilterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'machineCode',
                label: t('machineListManagement.table.headers.machineCode'),
                placeholder: t('machineListManagement.filters.codePlaceholder'),
                value: tempMachineCode,
                onChange: setTempMachineCode,
            },
            {
                key: 'machineName',
                label: t('machineListManagement.table.headers.machineName'),
                placeholder: t('machineListManagement.filters.namePlaceholder'),
                value: tempMachineName,
                onChange: setTempMachineName,
            },
            {
                key: 'propertyCode',
                label: t('machineListManagement.table.headers.propertyCode'),
                placeholder: t('machineListManagement.filters.propertyPlaceholder'),
                value: tempPropertyCode,
                onChange: setTempPropertyCode,
            },
            {
                key: 'mqttTopic',
                label: t('machineListManagement.form.fields.topic'),
                placeholder: t('machineListManagement.filters.topicPlaceholder'),
                value: tempMqttTopic,
                onChange: setTempMqttTopic,
            },
        ],
        [t, tempMachineCode, tempMachineName, tempPropertyCode, tempMqttTopic]
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
        setTempMachineCode('');
        setTempMachineName('');
        setTempPropertyCode('');
        setTempMqttTopic('');
        setMachineCodeFilter(undefined);
        setMachineNameFilter(undefined);
        setPropertyCodeFilter(undefined);
        setMqttTopicFilter(undefined);
        setPage(0);
    }, []);

    const handleApplyFilters = useCallback(() => {
        setMachineCodeFilter(tempMachineCode || undefined);
        setMachineNameFilter(tempMachineName || undefined);
        setPropertyCodeFilter(tempPropertyCode || undefined);
        setMqttTopicFilter(tempMqttTopic || undefined);
        setPage(0);
    }, [tempMachineCode, tempMachineName, tempPropertyCode, tempMqttTopic]);

    return (
        <>
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
                            showFilterIcon={true}
                            onFilterClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            isFilterActive={showAdvancedFilters}
                        />

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
                                onClick={handleCreateMachine}
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
                                        label={t(
                                            'machineListManagement.table.headers.propertyCode'
                                        )}
                                    >
                                        {viewModalState.data.propertyCode || '-'}
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

            {showAdvancedFilters && (
                <AdvancedFilterPanel
                    fields={machineFilterFields}
                    onReset={handleResetFilters}
                    onApply={handleApplyFilters}
                    resetLabel={t('common.reset')}
                    applyLabel={t('common.search')}
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
                        display: 'flex',
                        flexDirection: 'column',
                        paddingBottom: 0,
                    }
                }}
            >
                {machinesQuery.isLoading ? (
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
                    <Table<Machine>
                        columns={columns}
                        dataSource={filteredMachineData}
                        loading={loading}
                        onChange={handleTableChange}
                        rowKey={(record) => record.machineId}
                        pagination={{
                            current: page + 1,
                            pageSize: pageSize,
                            total: totalElements,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t(
                                    'common.items'
                                )}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            position: ['bottomCenter'],
                        }}
                        scroll={{
                            x: 1520,
                            y: isMobile ? 'calc(100vh - 280px)' : 'calc(109vh - 420px)',
                        }}
                        sticky
                        bordered
                    />
                )}
            </Card>

            <EntityFormModal<MachineFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
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
        </>
    );
};

export default MachineListPage;
