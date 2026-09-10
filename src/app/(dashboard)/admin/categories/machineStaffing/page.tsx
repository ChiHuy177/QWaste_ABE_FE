'use client';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button, Card, Table, Select, Grid, Spin, Typography, Modal, Descriptions } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SearchOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    MachineOperatorHistory,
    MachineOperatorHistoryFormData,
} from '@/types/MachineOperatorHistory';
import {
    machineOperatorHistoryTableColumnProps,
    getMachineListTableColumns,
} from './_components/Column';
import { MachineOperatorHistoryService } from '@/services/MachineOperatorHistoryService';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getMachineStaffingFormFields } from './_components/machineStaffingFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { FactoryPickingResponse } from '@/types/Factory';
import { ZonePickingResponse } from '@/types/Zone';
import { useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

const MachineStaffingPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const ability = useAbility();
    const [loading, setLoading] = useState(false);
    const [historyData, setHistoryData] = useState<MachineOperatorHistory[] | null>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { handleError } = useApiErrorHandler();
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({
        open: false,
        type: 'edit',
        pendingAction: null,
    });

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: MachineOperatorHistory | null;
    }>({ open: false, loading: false, data: null });

    const { Title } = Typography;

    // States for factory and zone filters
    const [factories, setFactories] = useState<FactoryPickingResponse[]>([]);
    const [zones, setZones] = useState<ZonePickingResponse[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | undefined>(undefined);
    const [selectedZone, setSelectedZone] = useState<number | undefined>(undefined);
    const [isLoadingFactories, setIsLoadingFactories] = useState(false);

    usePageTitle(t('pageTitle.machineStaffing'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const handleEditRecord = useCallback(
        (record: MachineOperatorHistory) => {
            if (!checkPermission('update', 'staffing')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: {
                    id: record.machineId,
                    zoneId: selectedZone,
                    machineId: record.machineId,
                    machineCode: record.machineCode,
                    machineName: record.machineName,
                    machineDisplay: `${record.machineCode} - ${record.machineName}`,
                    operatorCount: record.operatorCount,
                    notes: record.notes,
                },
            });
        },
        [selectedZone, checkPermission]
    );

    const handleViewMachineStaffing = useCallback(
        async (step: MachineOperatorHistory) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData =
                    await MachineOperatorHistoryService.getMachineOperatorHistoryById(
                        step.machineId
                    );
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error: any) {
                console.error('Error fetching machine staffing details:', error);
                handleError(error, { fallbackKey: 'machineStaffingManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError]
    );

    const columnProps: machineOperatorHistoryTableColumnProps = useMemo(
        () => ({
            onView: handleViewMachineStaffing,
            onEdit: handleEditRecord,
            isMobile,
            t,
            ability,
        }),
        [handleEditRecord, handleViewMachineStaffing, isMobile, t, ability]
    );

    const columns = useMemo(() => getMachineListTableColumns(columnProps), [columnProps]);

    const filteredHistoryData = useMemo(() => {
        if (!historyData) return [];
        if (!searchTerm.trim()) {
            return historyData;
        }
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return historyData.filter((record) => {
            const machineName = record.machineName?.toLowerCase() || '';
            const machineCode = record.machineCode?.toLowerCase() || '';

            return machineName.includes(lowerSearchTerm) || machineCode.includes(lowerSearchTerm);
        });
    }, [historyData, searchTerm]);

    const fetchHistoryData = async (zoneId: number) => {
        try {
            setLoading(true);
            const response =
                await MachineOperatorHistoryService.getAllMachineOperatorHistory(zoneId);
            setHistoryData(response);
        } catch (error) {
            toast.error(t('machineStaffing.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: MachineOperatorHistoryFormData, mode: 'create' | 'edit') => {
        if (mode !== 'edit') {
            throw new Error('Only edit mode is supported');
        }

        setConfirmModalState({
            open: true,
            type: 'edit',
            pendingAction: () => executeSubmit(data),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: MachineOperatorHistoryFormData) => {
        try {
            if (!selectedZone) {
                toast.error('Please select a zone');
                throw new Error('Zone not selected');
            }

            // Use raw machineId from modalState (data.id) instead of formatted display value
            const submitData: MachineOperatorHistoryFormData = {
                machineId: modalState.data?.id || data.machineId, // Use raw ID, not formatted string
                operatorCount: data.operatorCount,
                notes: data.notes,
                zoneId: selectedZone,
            };

            await MachineOperatorHistoryService.createMachineOperatorHistory(submitData);
            toast.success(t('machineStaffing.form.createSuccess'));

            if (selectedZone !== undefined) {
                fetchHistoryData(selectedZone);
            }
        } catch (error) {
            handleError(error, { fallbackKey: 'machineStaffing.form.createError' });
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
                    type: 'edit',
                    pendingAction: null,
                });
            } catch (error) {
                setConfirmModalState({
                    open: false,
                    type: 'edit',
                    pendingAction: null,
                });
            }
        }
    };

    const handleCancelConfirm = () => {
        setConfirmModalState({
            open: false,
            type: 'edit',
            pendingAction: null,
        });
    };

    // Handle search button click
    const handleSearch = useCallback(() => {
        if (selectedZone === undefined) {
            toast.error('Please select a zone');
            return;
        }
        fetchHistoryData(selectedZone);
    }, [selectedZone]);

    const formFields = useMemo(
        () => getMachineStaffingFormFields(t, modalState.data),
        [t, modalState.data]
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
                title={t('machineStaffing.title')}
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
                            placeholder={t('machineStaffing.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Select
                            placeholder="Select Factory"
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
                            style={isMobile ? { width: '100%' } : { width: 160 }}
                            loading={isLoadingFactories}
                            disabled={isLoadingFactories}
                            options={factories.map((factory) => ({
                                label: factory.factoryName,
                                value: factory.factoryId,
                            }))}
                        />
                        <Select
                            placeholder="Select Zone"
                            value={selectedZone}
                            onChange={setSelectedZone}
                            style={isMobile ? { width: '100%' } : { width: 120 }}
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
                            block={isMobile}
                            onClick={handleSearch}
                            loading={loading}
                        >
                            {t('common.search')}
                        </Button>
                    </div>
                }
            />

            <Modal
                title={viewModalState.data?.machineName}
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
                                label={t('machineStaffing.table.headers.machineCode')}
                            >
                                {viewModalState.data.machineCode || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('machineStaffing.table.headers.operatorCount')}
                            >
                                {viewModalState.data.operatorCount || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('machineStaffing.table.headers.notes')}>
                                {viewModalState.data.notes || '-'}
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
                    <Table<MachineOperatorHistory>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredHistoryData}
                        loading={loading}
                        rowKey={(record) => record.machineId}
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
                        scroll={{
                            x: 'max-content',
                            y: tableScrollY,
                        }}
                        style={{ height: '100%' }}
                        sticky
                        bordered
                    />
                </div>
            </Card>

            <EntityFormModal<MachineOperatorHistoryFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('machineStaffing.form.editTitle'),
                    edit: t('machineStaffing.form.editTitle'),
                }}
                description={{
                    create: t('machineStaffing.form.editDescription'),
                    edit: t('machineStaffing.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('machineStaffing.form.buttons.cancel'),
                    create: t('machineStaffing.form.buttons.create'),
                    edit: t('machineStaffing.form.buttons.update'),
                    saving: t('machineStaffing.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
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

export default MachineStaffingPage;
