'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineService } from '@/services/LineService';
import { FactoryService } from '@/services/FactoryService';
import { toast } from 'sonner';
import { Button, Card, Select, Table, Grid, Spin } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { Line, LineFormData } from '@/types/Line';
import { getLineTableColumns, LineTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getLineFormFields } from './_components/lineFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { FactoryPickingResponse } from '@/types/Factory';
import { ZonePickingResponse } from '@/types/Zone';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const LineListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: Line | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [lineData, setLineData] = useState<Line[] | null>(null);
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

    // States for factory and zone filters
    const [factories, setFactories] = useState<FactoryPickingResponse[]>([]);
    const [zones, setZones] = useState<ZonePickingResponse[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | undefined>(undefined);
    const [selectedZone, setSelectedZone] = useState<number | undefined>(undefined);
    const [appliedZone, setAppliedZone] = useState<number | undefined>(undefined); // Zone đã apply sau khi Search
    const [isLoadingFactories, setIsLoadingFactories] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    usePageTitle(t('pageTitle.lineList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchFactories = async () => {
        try {
            setIsLoadingFactories(true);
            const response = await FactoryService.getFactoriesForPicking();
            setFactories(response);

            if (response.length > 0) {
                const firstFactory = response[0];
                setSelectedFactory(firstFactory.factoryId);
                setZones(firstFactory.zones);

                if (firstFactory.zones.length > 0) {
                    const firstZone = firstFactory.zones[0];
                    setSelectedZone(firstZone.zoneId);
                    setAppliedZone(firstZone.zoneId); // Set appliedZone khi load lần đầu
                    fetchLineData(firstZone.zoneId);
                }
            }
        } catch (error) {
            toast.error(t('lineManagement.fetchDetailsError.factory'));
        } finally {
            setIsLoadingFactories(false);
        }
    };

    const fetchLineData = useCallback(
        async (zoneId: number | undefined) => {
            if (zoneId === undefined) {
                setLineData([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await LineService.getLinesByZone(zoneId);
                setLineData(response);
            } catch (error) {
                console.error('Error fetching line data:', error);
                toast.error(t('lineManagement.fetchError'));
            } finally {
                setLoading(false);
            }
        },
        [t]
    );

    const handleEditLine = useCallback(
        (line: Line) => {
            if (!checkPermission('update', 'line')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: {
                    ...line,
                    zoneId: line.zone?.zoneId,
                },
            });
        },
        [checkPermission]
    );

    const handleViewLine = useCallback((line: Line) => {
        setViewModalState({ open: true, data: line });
    }, []);

    const handleDeleteLine = useCallback(
        (line: Line) => {
            if (!checkPermission('delete', 'line')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const lineId = line.lineId;
                        await LineService.deleteLine(lineId);
                        toast.success(t('lineManagement.deleteSuccess'));
                        fetchLineData(selectedZone);
                    } catch (error) {
                        console.error('Error deleting line:', error);
                        handleError(error, { fallbackKey: 'lineManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, selectedZone, fetchLineData, checkPermission, handleError]
    );

    const columnProps: LineTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditLine,
            onView: handleViewLine,
            onDelete: handleDeleteLine,
            isMobile,
            t,
            ability,
        }),
        [handleEditLine, handleViewLine, handleDeleteLine, isMobile, t, ability]
    );

    const columns = useMemo(() => getLineTableColumns(columnProps), [columnProps]);

    const filteredLineData = useMemo(() => {
        if (!lineData) return [];
        let filtered = lineData;

        // Filter by zone - dùng appliedZone thay vì selectedZone
        if (appliedZone !== null && appliedZone !== undefined) {
            filtered = filtered.filter((line) => line.zone?.zoneId === appliedZone);
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const lowerSearchTerm = searchTerm.toLowerCase().trim();
            filtered = filtered.filter((line) => {
                const lineName = line.lineName?.toLowerCase() || '';
                return lineName.includes(lowerSearchTerm);
            });
        }

        return filtered;
    }, [lineData, searchTerm, appliedZone]);

    // Fetch factories on mount
    useEffect(() => {
        fetchFactories();
    }, []);

    // Handle search button click
    const handleSearch = useCallback(() => {
        if (selectedZone === undefined) {
            toast.error(t('lineManagement.selectZoneFirst'));
            return;
        }
        setAppliedZone(selectedZone); // Lưu zone đã apply
        fetchLineData(selectedZone);
    }, [selectedZone, fetchLineData, t]);

    const handleSubmit = async (data: LineFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: LineFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await LineService.createLine(data);
                toast.success(t('lineManagement.form.createSuccess'));
            } else {
                if (modalState.data?.lineId) {
                    const submitData = {
                        ...data,
                        lineId: modalState.data.lineId,
                    };
                    await LineService.updateLine(submitData as any);
                    toast.success(t('lineManagement.updateSuccess'));
                }
            }
            fetchLineData(selectedZone);
        } catch (error) {
            console.error('Error submitting line:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'lineManagement.form.createError'
                        : 'lineManagement.updateError',
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
        () => getLineFormFields(t, modalState.mode, zones),
        [t, modalState.mode, zones]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('lineManagement.title')}
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
                            placeholder={t('lineManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Select
                            placeholder={t('lineManagement.filterByFactory')}
                            value={selectedFactory}
                            onChange={(value) => {
                                setSelectedFactory(value);
                                const factory = factories.find((f) => f.factoryId === value);
                                if (factory) {
                                    setZones(factory.zones);
                                    if (factory.zones.length > 0) {
                                        setSelectedZone(factory.zones[0].zoneId);
                                    } else {
                                        setSelectedZone(undefined);
                                    }
                                }
                            }}
                            style={{ width: 160 }}
                            loading={isLoadingFactories}
                            disabled={isLoadingFactories}
                            options={factories.map((factory) => ({
                                label: factory.factoryName,
                                value: factory.factoryId,
                            }))}
                        />
                        <Select
                            placeholder={t('lineManagement.filterByZone')}
                            value={selectedZone}
                            onChange={setSelectedZone}
                            style={{ width: 120 }}
                            loading={isLoadingFactories}
                            disabled={zones.length === 0 || selectedFactory === undefined}
                            options={zones.map((zone) => ({
                                label: zone.zoneCode,
                                value: zone.zoneId,
                            }))}
                        />
                        <Button
                            color="primary"
                            variant="outlined"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            loading={loading}
                        >
                            {t('common.search')}
                        </Button>
                        <Can I="create" a="line">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    setModalState({ open: true, mode: 'create', data: null })
                                }
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('lineManagement.addLine')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="line">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                setModalState({ open: true, mode: 'create', data: null })
                            }
                            aria-label={t('lineManagement.addLine')}
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
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingBottom: 0,
                }}
            >
                {lineData === null ? (
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
                    <Table<Line>
                        columns={columns}
                        dataSource={filteredLineData}
                        loading={loading}
                        rowKey={(record) => record.lineId}
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

            <EntityFormModal<LineFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('lineManagement.form.createTitle'),
                    edit: t('lineManagement.form.editTitle'),
                }}
                description={{
                    create: t('lineManagement.form.createDescription'),
                    edit: t('lineManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('lineManagement.form.buttons.cancel'),
                    create: t('lineManagement.form.buttons.create'),
                    edit: t('lineManagement.form.buttons.update'),
                    saving: t('lineManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.lineName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'lineName',
                        label: t('lineManagement.table.headers.lineName'),
                        children: viewModalState.data?.lineName || '-',
                    },
                    {
                        key: 'zoneName',
                        label: t('lineManagement.table.headers.zoneName'),
                        children: viewModalState.data?.zone?.zoneName || '-',
                    },
                    {
                        key: 'displayOrder',
                        label: t('lineManagement.table.headers.order'),
                        children: viewModalState.data?.displayOrder ?? '-',
                    },
                    {
                        key: 'description',
                        label: t('lineManagement.table.headers.description'),
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

export default LineListPage;
