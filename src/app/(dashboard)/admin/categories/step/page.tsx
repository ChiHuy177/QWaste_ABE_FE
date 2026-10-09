'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StandardStepService } from '@/services/StepService';
import { toast } from 'sonner';
import { Button, Card, Table, Grid, Spin, Typography, Modal, Descriptions, Tag } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { StepDTO, CreateStepRequest, UpdateStepRequest } from '@/types/Step';
import {
    getStepTableColumns,
    type StepTableColumnProps,
    getStepFormFields,
} from '@/features/dashboard/categories/step';
import { EntityFormModal } from '@/components/shared/FormModal';
import { SearchInput } from '@/components/shared/SearchInput';
import AdvancedFilterPanel, {
    FilterField,
} from '@/components/shared/filters/AdvancedFilterPanel';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const formatDuration = (seconds: number) => {
    const d = dayjs.duration(seconds, 'seconds');
    return `${d.minutes()}m ${d.seconds()}s`;
};

const { useBreakpoint } = Grid;

const StepListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: Partial<StepDTO> | null;
    }>({ open: false, mode: 'create', data: null });

    const [isFormLoading, setIsFormLoading] = useState(false);

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const { handleError } = useApiErrorHandler();
    const ability = useAbility();
    const [loading, setLoading] = useState(true);
    const [stepData, setStepData] = useState<StepDTO[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [stepNameFilter, setStepNameFilter] = useState<string | undefined>(undefined);
    const [stepDescriptionFilter, setStepDescriptionFilter] = useState<string | undefined>(
        undefined
    );

    const activeFilterCount = [stepNameFilter, stepDescriptionFilter].filter(Boolean).length;

    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        loading: boolean;
        data: StepDTO | null;
    }>({ open: false, loading: false, data: null });

    const { Title } = Typography;

    usePageTitle(t('stepManagement.title'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchStepData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await StandardStepService.getAllSteps();
            // Sort conceptually by name or creation time, though no built-in order field exists
            response.sort((a, b) => a.stepName.localeCompare(b.stepName));
            setStepData(response);
        } catch (error) {
            toast.error(t('stepManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleCreateStep = useCallback(async () => {
        setModalState({
            open: true,
            mode: 'create',
            data: { requiresQc: false },
        });
    }, []);

    const handleEditStep = useCallback(
        async (step: StepDTO) => {
            if (!checkPermission('update', 'step')) {
                return;
            }

            setModalState({
                open: true,
                mode: 'edit',
                data: null,
            });
            setIsFormLoading(true);

            try {
                const detailData = await StandardStepService.getStepById(step.standardStepId);
                setModalState({
                    open: true,
                    mode: 'edit',
                    data: detailData,
                });
            } catch (error: unknown) {
                console.error('Error fetching step details:', error);
                handleError(error, { fallbackKey: 'stepManagement.fetchError' });
                setModalState({ open: false, mode: 'create', data: null });
            } finally {
                setIsFormLoading(false);
            }
        },
        [checkPermission, handleError]
    );

    const handleDeleteStep = useCallback(
        async (step: StepDTO) => {
            if (!checkPermission('delete', 'step')) {
                return;
            }
            try {
                await StandardStepService.deleteStep(step.standardStepId);
                toast.success(t('stepManagement.deleteSuccess'));
                fetchStepData();
            } catch (error: unknown) {
                console.error('Error deleting step:', error);
                handleError(error, {
                    fallbackKey: 'stepManagement.deleteError',
                });
            }
        },
        [t, fetchStepData, checkPermission, handleError]
    );

    const handleViewStep = useCallback(
        async (step: StepDTO) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await StandardStepService.getStepById(step.standardStepId);
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error: unknown) {
                console.error('Error fetching step details:', error);
                handleError(error, { fallbackKey: 'stepManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError]
    );

    const columnProps: StepTableColumnProps = useMemo(
        () => ({
            onEdit: handleEditStep,
            onDelete: handleDeleteStep,
            onView: handleViewStep,
            isMobile,
            t,
            ability,
        }),
        [handleEditStep, handleDeleteStep, handleViewStep, isMobile, t, ability]
    );

    const columns = useMemo(() => getStepTableColumns(columnProps), [columnProps]);

    const filteredData = useMemo(() => {
        if (!stepData) return [];
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        const nameFilter = stepNameFilter?.toLowerCase();
        const descriptionFilter = stepDescriptionFilter?.toLowerCase();
        return stepData.filter((step) => {
            const name = step.stepName?.toLowerCase() || '';
            const desc = step.description?.toLowerCase() || '';
            const matchesSearch =
                !lowerSearchTerm ||
                name.includes(lowerSearchTerm) ||
                desc.includes(lowerSearchTerm);
            const matchesName = !nameFilter || name.includes(nameFilter);
            const matchesDescription = !descriptionFilter || desc.includes(descriptionFilter);
            return matchesSearch && matchesName && matchesDescription;
        });
    }, [stepData, searchTerm, stepNameFilter, stepDescriptionFilter]);

    const filterFields: FilterField[] = useMemo(
        () => [
            {
                key: 'stepName',
                label: t('stepManagement.table.headers.stepName'),
                placeholder: t('stepManagement.form.placeholders.stepName'),
                value: stepNameFilter ?? '',
                onChange: (val) => setStepNameFilter(val.trim() || undefined),
            },
            {
                key: 'description',
                label: t('stepManagement.table.headers.description'),
                placeholder: t('stepManagement.form.placeholders.description'),
                value: stepDescriptionFilter ?? '',
                onChange: (val) => setStepDescriptionFilter(val.trim() || undefined),
            },
        ],
        [t, stepNameFilter, stepDescriptionFilter]
    );

    const handleResetFilters = useCallback(() => {
        setStepNameFilter(undefined);
        setStepDescriptionFilter(undefined);
    }, []);

    const handleApplyFilters = useCallback(() => {}, []);

    useEffect(() => {
        fetchStepData();
    }, [fetchStepData]);

    const handleSubmit = async (data: CreateStepRequest, mode: 'create' | 'edit') => {
        await executeSubmit(data, mode);
    };

    const executeSubmit = async (data: CreateStepRequest, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                const payload: CreateStepRequest = {
                    stepName: data.stepName,
                    description: data.description,
                    requiresQc: data.requiresQc ?? false,
                    defaultCompletionTimeSeconds: data.defaultCompletionTimeSeconds,
                    materialName: data.materialName || null,
                };
                await StandardStepService.createStep(payload);
                toast.success(t('stepManagement.form.createSuccess'));
            } else {
                if (modalState.data?.standardStepId) {
                    const submitData: UpdateStepRequest = {
                        standardStepId: modalState.data.standardStepId,
                        stepName: data.stepName,
                        description: data.description,
                        requiresQc: data.requiresQc ?? false,
                        defaultCompletionTimeSeconds: data.defaultCompletionTimeSeconds,
                        materialName: data.materialName || null,
                    };
                    await StandardStepService.updateStep(submitData);
                    toast.success(t('stepManagement.form.updateSuccess'));
                }
            }
            fetchStepData();
        } catch (error: unknown) {
            console.error('Error submitting step:', error);
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'stepManagement.form.createError'
                        : 'stepManagement.form.updateError',
            });
            throw error;
        }
    };

    const formFields = useMemo(() => getStepFormFields(t), [t]);
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
                title={t('stepManagement.title')}
                loading={loading}
                rightContent={
                    <div
                        style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                        <SearchInput
                            placeholder={t('stepManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                            showFilterIcon
                            onFilterClick={() => setShowAdvancedFilters((prev) => !prev)}
                            isFilterActive={showAdvancedFilters}
                            activeFilterCount={activeFilterCount}
                        />
                        <Can I="create" a="step">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreateStep}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('stepManagement.addStep')}
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

            <Modal
                title={viewModalState.data?.stepName}
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
                            <Descriptions.Item label={t('stepManagement.table.headers.stepName')}>
                                {viewModalState.data.stepName}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('stepManagement.table.headers.materialName')}
                            >
                                {viewModalState.data.materialName || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('stepManagement.table.headers.description')}
                            >
                                {viewModalState.data.description || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('stepManagement.table.headers.requiresQc')}>
                                <Tag
                                    color={viewModalState.data.requiresQc ? 'blue' : 'default'}
                                    variant="filled"
                                    style={{ minWidth: 60, textAlign: 'center' }}
                                >
                                    {(viewModalState.data.requiresQc
                                        ? t('common.yes')
                                        : t('common.no')
                                    ).toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('stepManagement.table.headers.defaultTime')}
                            >
                                {viewModalState.data.defaultCompletionTimeSeconds || '-'}
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
                    <Table<StepDTO>
                        className="qw-table-scroll-fill"
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        rowKey="standardStepId"
                        pagination={{
                            defaultPageSize: 10,
                            hideOnSinglePage: false,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            position: ['bottomCenter'],
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

            <EntityFormModal<CreateStepRequest>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('stepManagement.form.createTitle'),
                    edit: t('stepManagement.form.editTitle'),
                }}
                description={{
                    create: t('stepManagement.form.createDescription'),
                    edit: t('stepManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('stepManagement.form.buttons.cancel'),
                    create: t('stepManagement.form.buttons.create'),
                    edit: t('stepManagement.form.buttons.save'),
                    saving: t('stepManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
                loading={isFormLoading}
            />
        </div>
    );
};

export default StepListPage;
