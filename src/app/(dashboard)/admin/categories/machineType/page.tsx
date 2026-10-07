'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Descriptions, Grid, Modal, Spin, Table, TableProps, Typography } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ToolOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { MachineType } from '@/types/MachineType';
import {
    type MachineTypeTableColumnProps,
    getMachineTypeTableColumns,
    getMachineTypeFormFields,
} from '@/features/dashboard/categories/machineType';
import { MachineTypeService } from '@/services/MachineTypeService';
import { EntityFormModal } from '@/components/shared/FormModal';
import { MachineTypeFormData } from '@/types/MachineType';
import { SearchInput } from '@/components/shared/SearchInput';
import AdvancedFilterPanel, {
    FilterField,
} from '@/components/shared/filters/AdvancedFilterPanel';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

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
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [machineTypeNameFilter, setMachineTypeNameFilter] = useState<string | undefined>(
        undefined
    );
    const [machineTypeDescriptionFilter, setMachineTypeDescriptionFilter] = useState<
        string | undefined
    >(undefined);

    const activeFilterCount = [machineTypeNameFilter, machineTypeDescriptionFilter].filter(
        Boolean
    ).length;

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: MachineType | null;
    }>({ open: false, loading: false, data: null });

    const { Title } = Typography;
    const { handleError } = useApiErrorHandler();

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    usePageTitle(t('pageTitle.machineTypeList'));

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
            try {
                const machineTypeId = machineType.machineTypeId;
                await MachineTypeService.deleteMachineType(machineTypeId);
                toast.success(t('machineTypeManagement.deleteSuccess'));
                fetchMachineTypeData();
            } catch (error) {
                console.error('Error deleting machine type:', error);
                handleError(error, { fallbackKey: 'machineTypeManagement.deleteError' });
            }
        },
        [t, checkPermission, handleError]
    );

    const handleViewMachineType = useCallback(
        async (step: MachineType) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await MachineTypeService.getMachineTypeById(step.machineTypeId);
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error: unknown) {
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
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const nameFilter = machineTypeNameFilter?.toLowerCase();
        const descriptionFilter = machineTypeDescriptionFilter?.toLowerCase();
        return machineTypeData.filter((machineType) => {
            const machineTypeName = machineType.machineTypeName?.toLowerCase() || '';
            const description = machineType.description?.toLowerCase() || '';

            const matchesSearch = !lowerSearchTerm || machineTypeName.includes(lowerSearchTerm);
            const matchesName = !nameFilter || machineTypeName.includes(nameFilter);
            const matchesDescription = !descriptionFilter || description.includes(descriptionFilter);
            return matchesSearch && matchesName && matchesDescription;
        });
    }, [machineTypeData, searchTerm, machineTypeNameFilter, machineTypeDescriptionFilter]);

    const filterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'machineTypeName',
                label: t('machineTypeManagement.table.headers.machineTypeName'),
                placeholder: t('machineTypeManagement.form.placeholders.machineTypeName'),
                value: machineTypeNameFilter ?? '',
                onChange: (val) => setMachineTypeNameFilter(val.trim() || undefined),
            },
            {
                key: 'description',
                label: t('machineTypeManagement.table.headers.description'),
                placeholder: t('machineTypeManagement.form.placeholders.description'),
                value: machineTypeDescriptionFilter ?? '',
                onChange: (val) => setMachineTypeDescriptionFilter(val.trim() || undefined),
            },
        ],
        [t, machineTypeNameFilter, machineTypeDescriptionFilter]
    );

    const handleResetFilters = useCallback(() => {
        setMachineTypeNameFilter(undefined);
        setMachineTypeDescriptionFilter(undefined);
    }, []);

    const handleApplyFilters = useCallback(() => {}, []);

    const rowSelection: TableProps<MachineType>['rowSelection'] = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
        getCheckboxProps: () => ({
            disabled: true,
        }),
    };

    const fetchMachineTypeData = async () => {
        try {
            setLoading(true);
            const response = await MachineTypeService.getAllMachineTypes();
            setMachineTypeData(response);
        } catch (error) {
            console.error('Error fetching machine type data:', error);
            toast.error(t('machineTypeManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMachineTypeData();
    }, []);

    const executeSubmit = async (data: MachineTypeFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await MachineTypeService.createMachineType(data);
                toast.success(t('machineTypeManagement.form.createSuccess'));
            } else {
                if (modalState.data?.machineTypeId) {
                    const submitData = {
                        ...data,
                        machineTypeId: modalState.data.machineTypeId,
                    };
                    await MachineTypeService.updateMachineType(submitData);
                    toast.success(t('machineTypeManagement.updateSuccess'));
                }
            }
            fetchMachineTypeData();
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
        await executeSubmit(data, mode);
    };

    const formFields = useMemo(
        () => getMachineTypeFormFields(t, modalState.mode),
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
                            showFilterIcon
                            onFilterClick={() => setShowAdvancedFilters((prev) => !prev)}
                            isFilterActive={showAdvancedFilters}
                            activeFilterCount={activeFilterCount}
                        />
                        <Can I="create" a="machine_type">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('machineTypeManagement.addMachineType')}
                            </Button>
                        </Can>
                    </div>
                }
                mobileMenuItems={
                    checkPermissionSilent('create', 'machine_type')
                        ? [
                              {
                                  key: 'add',
                                  label: t('machineTypeManagement.addMachineType'),
                                  icon: <PlusOutlined />,
                                  onClick: () =>
                                      setModalState({ open: true, mode: 'create', data: null }),
                              },
                          ]
                        : []
                }
                rightContentMobile={
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                        aria-label={t('machineTypeManagement.addMachineType')}
                        style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                    />
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
                    <Table<MachineType>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredMachineTypeData}
                        rowSelection={rowSelection}
                        loading={loading}
                        rowKey={(record) => record.machineTypeId}
                        pagination={{
                            defaultPageSize: 10,
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t(
                                    'common.items'
                                )}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            position: ['bottomCenter'],
                        }}
                        scroll={{ x: 'max-content', y: tableScrollY }}
                        style={{ height: '100%' }}
                        sticky
                        bordered
                    />
                </div>
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
        </div>
    );
};

export default MachineTypeListPage;
