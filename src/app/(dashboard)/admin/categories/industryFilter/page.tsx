'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IndustryFilterService } from '@/services/IndustryFilterService';
import { DemoIndustryFilterService, USE_MOCK_FACTORY_OVERVIEW } from '@/mockData/admin/factory';
import { toast } from 'sonner';
import {
    Button,
    Card,
    Table,
    Grid,
    Spin,
    Descriptions,
    Modal,
    Typography,
    Tabs,
} from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    IndustryFilter,
    IndustryFilterFormData,
    IndustryFilterUpdateData,
} from '@/types/IndustryFilter';
import {
    getIndustryFilterTableColumns,
    IndustryFilterTableColumnProps,
} from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getIndustryFilterFormFields } from './_components/industryFilterFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import dayjs from 'dayjs';
import ShiftBreaksContent from './_components/ShiftBreaksContent';

const { useBreakpoint } = Grid;
const activeIndustryFilterService = USE_MOCK_FACTORY_OVERVIEW
    ? DemoIndustryFilterService
    : IndustryFilterService;

const IndustryFilterListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: IndustryFilter | null;
    }>({ open: false, mode: 'create', data: null });

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const ability = useAbility();
    const [loading, setLoading] = useState(true);
    const [industryFilterData, setIndustryFilterData] = useState<IndustryFilter[] | null>(null);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { handleError } = useApiErrorHandler();
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
        data: IndustryFilter | null;
    }>({ open: false, loading: false, data: null });

    const hasShiftBreak = viewModalState.data?.category === 'SHIFT';

    const { Title } = Typography;

    usePageTitle(t('pageTitle.industryFilterList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchIndustryFilterData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await activeIndustryFilterService.getAllIndustryFilters();
            setIndustryFilterData(response);
        } catch (error) {
            handleError(error, { fallbackKey: 'industryFilterManagement.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    const handleCreateIndustryFilter = useCallback(() => {
        if (!checkPermission('create', 'industry_filter')) {
            return;
        }

        setModalState({ open: true, mode: 'create', data: null });
    }, [checkPermission]);

    const handleEditIndustryFilter = useCallback(
        async (filter: IndustryFilter) => {
            if (!checkPermission('update', 'industry_filter')) {
                return;
            }
            setModalState({
                open: true,
                mode: 'edit',
                data: null,
            });
            setIsFormLoading(true);

            try {
                const detailData = await activeIndustryFilterService.getIndustryFilterById(
                    filter.filterId
                );
                setModalState({
                    open: true,
                    mode: 'edit',
                    data: detailData,
                });
            } catch (error) {
                handleError(error, { fallbackKey: 'industryFilterManagement.fetchError' });
            } finally {
                setIsFormLoading(false);
            }
        },
        [checkPermission, handleError]
    );

    const handleDeleteIndustryFilter = useCallback(
        (filter: IndustryFilter) => {
            if (!checkPermission('delete', 'industry_filter')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        const filterId = filter.filterId;
                        await activeIndustryFilterService.deleteIndustryFilter(filterId);
                        toast.success(t('industryFilterManagement.deleteSuccess'));
                        await fetchIndustryFilterData();
                    } catch (error) {
                        handleError(error, { fallbackKey: 'industryFilterManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, fetchIndustryFilterData, checkPermission, handleError]
    );

    const handleViewIndustryFilter = useCallback(
        async (filter: IndustryFilter) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await activeIndustryFilterService.getIndustryFilterById(
                    filter.filterId
                );
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error) {
                handleError(error, { fallbackKey: 'industryFilterManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError]
    );

    const columnProps: IndustryFilterTableColumnProps = useMemo(
        () => ({
            onView: handleViewIndustryFilter,
            onEdit: handleEditIndustryFilter,
            onDelete: handleDeleteIndustryFilter,
            isMobile,
            t,
            ability,
        }),
        [
            handleEditIndustryFilter,
            handleDeleteIndustryFilter,
            handleViewIndustryFilter,
            isMobile,
            t,
            ability,
        ]
    );

    const columns = useMemo(() => getIndustryFilterTableColumns(columnProps), [columnProps]);

    const filteredIndustryFilterData = useMemo(() => {
        if (!industryFilterData) return [];
        if (!searchTerm.trim()) {
            return industryFilterData;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        return industryFilterData.filter((filter) => {
            const displayNameEn = filter.displayNameEn?.toLowerCase() || '';
            const displayNameVi = filter.displayNameVi?.toLowerCase() || '';
            const shortNameEn = filter.shortNameEn?.toLowerCase() || '';
            const category = filter.category?.toLowerCase() || '';
            const periodCode = filter.periodCode?.toLowerCase() || '';

            return (
                displayNameEn.includes(lowerSearchTerm) ||
                displayNameVi.includes(lowerSearchTerm) ||
                shortNameEn.includes(lowerSearchTerm) ||
                category.includes(lowerSearchTerm) ||
                periodCode.includes(lowerSearchTerm)
            );
        });
    }, [industryFilterData, searchTerm]);

    useEffect(() => {
        fetchIndustryFilterData();
    }, [fetchIndustryFilterData]);

    const handleSubmit = async (data: IndustryFilterFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: IndustryFilterFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await activeIndustryFilterService.createIndustryFilter(data);
                toast.success(t('industryFilterManagement.form.createSuccess'));
            } else {
                if (modalState.data?.filterId) {
                    const submitData: IndustryFilterUpdateData = {
                        ...data,
                        filterId: modalState.data.filterId,
                    };
                    await activeIndustryFilterService.updateIndustryFilter(submitData);
                    toast.success(t('industryFilterManagement.updateSuccess'));
                }
            }
            await fetchIndustryFilterData();
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'industryFilterManagement.form.createError'
                        : 'industryFilterManagement.updateError',
            });
            throw error;
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmModalState.pendingAction) {
            return;
        }

        try {
            setConfirmModalState((prev) => ({ ...prev, open: false }));
            await confirmModalState.pendingAction();
            setModalState((prev) => ({ ...prev, open: false }));
        } catch {
            // Error already handled in pending action.
        } finally {
            setConfirmModalState({
                open: false,
                type: 'create',
                pendingAction: null,
            });
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
        () => getIndustryFilterFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    const industryFilterFormInitialData = useMemo<IndustryFilterFormData | null>(() => {
        if (!modalState.data) {
            return null;
        }

        return {
            displayNameEn: modalState.data.displayNameEn,
            displayNameVi: modalState.data.displayNameVi,
            shortNameEn: modalState.data.shortNameEn ?? undefined,
            startTime: modalState.data.startTime,
            endTime: modalState.data.endTime,
            sortOrder: modalState.data.sortOrder,
        };
    }, [modalState.data]);

    return (
        <>
            <ResponsivePageHeader
                title={t('industryFilterManagement.title')}
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
                            placeholder={t('industryFilterManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="industry_filter">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block={isMobile}
                                onClick={handleCreateIndustryFilter}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('industryFilterManagement.addIndustryFilter')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="industry_filter">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={handleCreateIndustryFilter}
                            aria-label={t('industryFilterManagement.addIndustryFilter')}
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        />
                    </Can>
                }
            />

            <Modal
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '90%' : '60%'}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Tabs
                            defaultActiveKey="details"
                            items={[
                                {
                                    key: 'details',
                                    label:
                                        viewModalState.data?.category === 'SHIFT'
                                            ? t('industryFilterManagement.categories.shift')
                                            : viewModalState.data?.category === 'PERIOD'
                                                ? t('industryFilterManagement.categories.period')
                                                : viewModalState.data?.category,
                                    children: (
                                        <>
                                            <Descriptions
                                                column={isMobile ? 1 : 2}
                                                bordered
                                                size="small"
                                            >
                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.displayNameEn'
                                                    )}
                                                >
                                                    {viewModalState.data.displayNameEn || '-'}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.displayNameVi'
                                                    )}
                                                >
                                                    {viewModalState.data.displayNameVi || '-'}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.shortNameEn'
                                                    )}
                                                >
                                                    {viewModalState.data.shortNameEn || '-'}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.periodCode'
                                                    )}
                                                >
                                                    {viewModalState.data.periodCode || '-'}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.shiftNumber'
                                                    )}
                                                >
                                                    {viewModalState.data.shiftNumber || '-'}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.timeRange'
                                                    )}
                                                >
                                                    {viewModalState.data.startTime} -{' '}
                                                    {viewModalState.data.endTime}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.isPrimary'
                                                    )}
                                                >
                                                    {viewModalState.data.isPrimary ? 'Yes' : 'No'}
                                                </Descriptions.Item>

                                                <Descriptions.Item
                                                    label={t(
                                                        'industryFilterManagement.table.headers.sortOrder'
                                                    )}
                                                >
                                                    {viewModalState.data.sortOrder || '-'}
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
                                                            {viewModalState.data.auditMetaData
                                                                .createdAt
                                                                ? dayjs(
                                                                    viewModalState.data
                                                                        .auditMetaData.createdAt
                                                                ).format('DD/MM/YYYY HH:mm:ss')
                                                                : '-'}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item
                                                            label={t('common.auditInfo.createdBy')}
                                                        >
                                                            {viewModalState.data.auditMetaData
                                                                .createdBy || '-'}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item
                                                            label={t('common.auditInfo.updatedAt')}
                                                        >
                                                            {viewModalState.data.auditMetaData
                                                                .updatedAt
                                                                ? dayjs(
                                                                    viewModalState.data
                                                                        .auditMetaData.updatedAt
                                                                ).format('DD/MM/YYYY HH:mm:ss')
                                                                : '-'}
                                                        </Descriptions.Item>
                                                        <Descriptions.Item
                                                            label={t('common.auditInfo.updatedBy')}
                                                        >
                                                            {viewModalState.data.auditMetaData
                                                                .updatedBy || '-'}
                                                        </Descriptions.Item>
                                                    </Descriptions>
                                                </div>
                                            )}
                                        </>
                                    ),
                                },

                                ...(hasShiftBreak
                                    ? [
                                        {
                                            key: 'shiftBreaks',
                                            label: t(
                                                'industryFilterManagement.shiftBreaks.title'
                                            ),
                                            children: (
                                                <ShiftBreaksContent
                                                    filter={viewModalState.data}
                                                    t={t}
                                                    readOnly
                                                />
                                            ),
                                        },
                                    ]
                                    : []),
                            ]}
                        />

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
                {industryFilterData === null ? (
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
                    <Table<IndustryFilter>
                        columns={columns}
                        dataSource={filteredIndustryFilterData}
                        loading={loading}
                        rowKey={(record) => record.filterId}
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

            <EntityFormModal<IndustryFilterFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={industryFilterFormInitialData}
                fields={formFields}
                title={{
                    create: t('industryFilterManagement.form.createTitle'),
                    edit: t('industryFilterManagement.form.editTitle'),
                }}
                description={{
                    create: t('industryFilterManagement.form.createDescription'),
                    edit: t('industryFilterManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('industryFilterManagement.form.buttons.cancel'),
                    create: t('industryFilterManagement.form.buttons.create'),
                    edit: t('industryFilterManagement.form.buttons.update'),
                    saving: t('industryFilterManagement.form.buttons.saving'),
                }}
                width={{ xs: '95%', sm: '80%', md: '80%' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
                loading={isFormLoading}
                layout={
                    modalState.mode === 'edit' && modalState.data?.category === 'SHIFT'
                        ? 'tabs'
                        : 'default'
                }
                children={
                    modalState.mode === 'edit' && modalState.data?.category === 'SHIFT' ? (
                        <ShiftBreaksContent filter={modalState.data} t={t} />
                    ) : null
                }
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

export default IndustryFilterListPage;
