'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ZoneService } from '@/services/ZoneService';
import { FactoryService } from '@/services/FactoryService';
import { toast } from 'sonner';
import { Button, Card, Select, Table, Grid, Spin } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Zone, ZoneFormData } from '@/types/Zone';
import { getZoneTableColumns, ZoneTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getZoneFormFields } from './_components/zoneFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { SelectOption } from '@/types/Common';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const ZoneListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: Zone | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [zoneData, setZoneData] = useState<Zone[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
    const [tempSelectedFactory, setTempSelectedFactory] = useState<number | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'create',
        pendingAction: null,
    });

    // States for dropdown options
    const [factoryOptions, setFactoryOptions] = useState<SelectOption[]>([]);
    const [isLoadingFactories, setIsLoadingFactories] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    usePageTitle(t('pageTitle.zoneList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    // Fetch factories for dropdown using picking API
    const fetchFactories = async () => {
        try {
            setIsLoadingFactories(true);
            const response = await FactoryService.getFactoriesForPicking();
            const options = response.map((factory) => ({
                value: factory.factoryId,
                label: `${factory.factoryCode} - ${factory.factoryName}`,
            }));
            setFactoryOptions(options);

            // Auto-select the first factory if available
            if (options.length > 0 && selectedFactory === null) {
                setSelectedFactory(options[0].value);
                setTempSelectedFactory(options[0].value);
            }
        } catch (error) {
            console.error('Error fetching factories:', error);
            toast.error(t('zoneManagement.fetchDetailsError.factory'));
        } finally {
            setIsLoadingFactories(false);
        }
    };

    const fetchZoneData = useCallback(
        async (factoryId: number | null) => {
            if (factoryId === null) {
                setZoneData([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await ZoneService.getZonesByFactory(factoryId);
                setZoneData(response);
            } catch (error) {
                console.error('Error fetching zone data:', error);
                toast.error(t('zoneManagement.fetchError'));
            } finally {
                setLoading(false);
            }
        },
        [t]
    );

    const handleEditZone = useCallback(
        (zone: Zone) => {
            if (!checkPermission('update', 'zone')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: {
                    ...zone,
                    factoryId: zone.factory?.factoryId,
                },
            });
        },
        [checkPermission]
    );

    const handleViewZone = useCallback((zone: Zone) => {
        setViewModalState({ open: true, data: zone });
    }, []);

    const handleDeleteZone = useCallback(
        (zone: Zone) => {
            if (!checkPermission('delete', 'zone')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const zoneId = zone.zoneId;
                        await ZoneService.deleteZone(zoneId);
                        toast.success(t('zoneManagement.deleteSuccess'));
                        fetchZoneData(selectedFactory);
                    } catch (error) {
                        console.error('Error deleting zone:', error);
                        handleError(error, { fallbackKey: 'zoneManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, selectedFactory, fetchZoneData, checkPermission, handleError]
    );

    const columnProps: ZoneTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditZone,
            onView: handleViewZone,
            onDelete: handleDeleteZone,
            isMobile,
            t,
            ability,
        }),
        [handleEditZone, handleViewZone, handleDeleteZone, isMobile, t, ability]
    );

    const columns = useMemo(() => getZoneTableColumns(columnProps), [columnProps]);

    const filteredZoneData = useMemo(() => {
        if (!zoneData) return [];
        let filtered = zoneData;

        // Filter by factory
        if (selectedFactory !== null) {
            filtered = filtered.filter((zone) => zone.factory?.factoryId === selectedFactory);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();
            filtered = filtered.filter((zone) => {
                const zoneName = zone.zoneName?.toLowerCase() || '';
                const zoneCode = zone.zoneCode?.toLowerCase() || '';
                return zoneName.includes(lowerSearchTerm) || zoneCode.includes(lowerSearchTerm);
            });
        }

        return filtered;
    }, [zoneData, searchTerm, selectedFactory]);

    // Fetch factories on mount
    useEffect(() => {
        fetchFactories();
    }, []);

    // Fetch zones when factory changes
    useEffect(() => {
        if (selectedFactory !== null) {
            fetchZoneData(selectedFactory);
        }
    }, [selectedFactory, fetchZoneData]);

    const handleSubmit = async (data: ZoneFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: ZoneFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await ZoneService.createZone(data);
                toast.success(t('zoneManagement.form.createSuccess'));
            } else {
                if (modalState.data?.zoneId) {
                    const submitData = {
                        ...data,
                        zoneId: modalState.data.zoneId,
                    };
                    await ZoneService.updateZone(submitData as any);
                    toast.success(t('zoneManagement.updateSuccess'));
                }
            }
            fetchZoneData(selectedFactory);
        } catch (error) {
            console.error('Error submitting zone:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'zoneManagement.form.createError'
                        : 'zoneManagement.updateError',
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
        () => getZoneFormFields(t, modalState.mode, factoryOptions, isLoadingFactories),
        [t, modalState.mode, factoryOptions, isLoadingFactories]
    );
    return (
        <>
            <ResponsivePageHeader
                title={t('zoneManagement.title')}
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
                            placeholder={t('zoneManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Select
                            placeholder={t('zoneManagement.filterByFactory')}
                            value={selectedFactory}
                            onChange={setSelectedFactory}
                            loading={isLoadingFactories}
                            style={{ width: 200 }}
                        >
                            {factoryOptions.map((option) => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                        <Can I="create" a="zone">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('zoneManagement.addZone')}
                            </Button>
                        </Can>
                    </div>
                }
                mobileSearch={{
                    text: searchTerm,
                    onChange: setSearchTerm,
                    placeholder: t('zoneManagement.searchPlaceholder'),
                }}
                mobileMenuItems={
                    checkPermissionSilent('create', 'zone')
                        ? [
                            {
                                key: 'add',
                                label: t('zoneManagement.addZone'),
                                icon: <PlusOutlined />,
                                onClick: () =>
                                    setModalState({
                                        open: true,
                                        mode: 'create',
                                        data: null,
                                    }),
                            },
                        ]
                        : []
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
                {zoneData === null ? (
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
                    <Table<Zone>
                        columns={columns}
                        dataSource={filteredZoneData}
                        loading={loading}
                        rowKey={(record) => record.zoneId}
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

            <EntityFormModal<ZoneFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('zoneManagement.form.createTitle'),
                    edit: t('zoneManagement.form.editTitle'),
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
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.zoneName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'zoneCode',
                        label: t('zoneManagement.table.headers.zoneCode'),
                        children: viewModalState.data?.zoneCode || '-',
                    },
                    {
                        key: 'zoneName',
                        label: t('zoneManagement.table.headers.zoneName'),
                        children: viewModalState.data?.zoneName || '-',
                    },
                    {
                        key: 'factoryName',
                        label: t('zoneManagement.table.headers.factoryName'),
                        children: viewModalState.data?.factory?.factoryName || '-',
                    },
                    {
                        key: 'displayOrder',
                        label: t('zoneManagement.table.headers.order'),
                        children: viewModalState.data?.displayOrder ?? '-',
                    },
                    {
                        key: 'description',
                        label: t('zoneManagement.table.headers.description'),
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

export default ZoneListPage;
