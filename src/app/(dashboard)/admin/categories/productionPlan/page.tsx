'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import { toast } from 'sonner';
import { Button, Card, Col, DatePicker, Form, InputNumber, Row, Select, Table, Grid, Spin } from 'antd';
import dayjs from 'dayjs';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { ProductionPlan, ProductionPlanFormData } from '@/types/ProductionPlan';
import {
    getProductionPlanTableColumns,
    ProductionPlanTableColumnProps,
} from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getProductionPlanFormFields } from './_components/productionPlanFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const ProductionPlanListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: ProductionPlan | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ProductionPlan[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({ open: false, type: 'create', pendingAction: null });

    usePageTitle(t('pageTitle.productionPlanList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ProductionPlanService.getAllProductionPlans();
            setData(response);
        } catch (error) {
            toast.error(t('productionPlanManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleEdit = useCallback(
        (item: ProductionPlan) => {
            if (!checkPermission('update', 'production_plan')) return;
            // Convert stored ISO strings back to dayjs for DatePicker
            const editData: any = { ...item };
            if (item.filterId === 'DAY' && item.planDate) {
                editData.planDate = dayjs(item.planDate);
            } else if (item.filterId === 'WEEK' && item.planWeekStart && item.planWeekEnd) {
                editData.planDate = [dayjs(item.planWeekStart), dayjs(item.planWeekEnd)];
            }
            setModalState({ open: true, mode: 'edit', data: editData });
        },
        [checkPermission]
    );

    const handleView = useCallback((item: ProductionPlan) => {
        setViewModalState({ open: true, data: item });
    }, []);

    const handleDelete = useCallback(
        (item: ProductionPlan) => {
            if (!checkPermission('delete', 'production_plan')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await ProductionPlanService.deleteProductionPlan(item.planId);
                        toast.success(t('productionPlanManagement.deleteSuccess'));
                        fetchData();
                    } catch (error) {
                        handleError(error, {
                            fallbackKey: 'productionPlanManagement.deleteError',
                        });
                        throw error;
                    }
                },
            });
        },
        [t, fetchData, checkPermission, handleError]
    );

    const columnProps: ProductionPlanTableColumnProps = useMemo(
        () => ({ onEdit: handleEdit, onView: handleView, onDelete: handleDelete, isMobile, t, ability }),
        [handleEdit, handleView, handleDelete, isMobile, t, ability]
    );

    const columns = useMemo(() => getProductionPlanTableColumns(columnProps), [columnProps]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm.trim()) return data;
        const lower = searchTerm.trim();
        return data.filter((item) => String(item.machineId).includes(lower));
    }, [data, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (formData: ProductionPlanFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(formData, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (rawData: ProductionPlanFormData, mode: 'create' | 'edit') => {
        // Serialize dayjs planDate to ISO string(s)
        const formData: ProductionPlanFormData = { ...rawData };
        const rawPlanDate = (rawData as any).planDate;
        if (rawPlanDate) {
            if (rawData.filterId === 'DAY') {
                formData.planDate = rawPlanDate.format('YYYY-MM-DD');
            } else if (rawData.filterId === 'WEEK' && Array.isArray(rawPlanDate)) {
                const [start, end] = rawPlanDate;
                formData.planWeekStart = start.format('YYYY-MM-DD');
                formData.planWeekEnd = end.format('YYYY-MM-DD');
                delete formData.planDate;
            }
        }
        try {
            if (mode === 'create') {
                await ProductionPlanService.createProductionPlan(formData);
                toast.success(t('productionPlanManagement.form.createSuccess'));
            } else {
                if (modalState.data?.planId) {
                    await ProductionPlanService.updateProductionPlan({
                        ...formData,
                        planId: modalState.data.planId,
                    });
                    toast.success(t('productionPlanManagement.updateSuccess'));
                }
            }
            fetchData();
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'productionPlanManagement.form.createError'
                        : 'productionPlanManagement.updateError',
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
                setConfirmModalState({ open: false, type: 'create', pendingAction: null });
            } catch {
                setConfirmModalState({ open: false, type: 'create', pendingAction: null });
            }
        }
    };

    const handleCancelConfirm = () => {
        setConfirmModalState({ open: false, type: 'create', pendingAction: null });
    };

    const formFields = useMemo(
        () => getProductionPlanFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('productionPlanManagement.title')}
                loading={loading}
                rightContent={
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <SearchInput
                            placeholder={t('productionPlanManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="production_plan">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('productionPlanManagement.addProductionPlan')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="production_plan">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                            aria-label={t('productionPlanManagement.addProductionPlan')}
                            style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                        />
                    </Can>
                }
            />
            <Card
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
            >
                {data === null ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                        <Spin size="large" indicator={<LoadingOutlined spin />} />
                    </div>
                ) : (
                    <Table<ProductionPlan>
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        rowKey={(record) => record.planId}
                        pagination={{
                            defaultPageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            position: ['bottomCenter'],
                        }}
                        scroll={{ x: 'max-content', y: isMobile ? 'calc(100vh - 280px)' : 'calc(112vh - 420px)' }}
                        sticky
                        bordered
                    />
                )}
            </Card>

            <EntityFormModal<ProductionPlanFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('productionPlanManagement.form.createTitle'),
                    edit: t('productionPlanManagement.form.editTitle'),
                }}
                description={{ create: '', edit: '' }}
                buttonLabels={{
                    cancel: t('productionPlanManagement.form.buttons.cancel'),
                    create: t('productionPlanManagement.form.buttons.create'),
                    edit: t('productionPlanManagement.form.buttons.update'),
                    saving: t('productionPlanManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            >
                {/* Rows 2-3: layout switches based on whether a Period is selected */}
                <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.filterId !== curr.filterId}
                >
                    {({ getFieldValue }) => {
                        const filterId = getFieldValue('filterId');

                        const statusCol = (
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label={t('productionPlanManagement.form.fields.status')}
                                    name="status"
                                    rules={[{
                                        required: true,
                                        message: t('productionPlanManagement.form.validation.required'),
                                    }]}
                                >
                                    <Select
                                        placeholder={t('productionPlanManagement.form.placeholders.status')}
                                        options={[
                                            { label: 'ACTIVE', value: 'ACTIVE' },
                                            { label: 'INACTIVE', value: 'INACTIVE' },
                                        ]}
                                    />
                                </Form.Item>
                            </Col>
                        );

                        const plannedQtyCol = (
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label={t('productionPlanManagement.form.fields.plannedQuantity')}
                                    name="plannedQuantity"
                                    rules={[
                                        { required: true, message: t('productionPlanManagement.form.validation.required') },
                                        { type: 'number', min: 1, message: t('productionPlanManagement.form.validation.minValue', { min: 1 }) },
                                    ]}
                                >
                                    <InputNumber
                                        placeholder={t('productionPlanManagement.form.placeholders.plannedQuantity')}
                                        style={{ width: '100%' }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                        );

                        if (!filterId) {
                            // No period selected: Row 2 = Planned Quantity | Status
                            return (
                                <Row gutter={16}>
                                    {plannedQtyCol}
                                    {statusCol}
                                </Row>
                            );
                        }

                        const isDay = filterId === 'DAY';
                        return (
                            <>
                                {/* Row 2: Date/Week picker | Status */}
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item
                                            label={isDay ? 'Date' : 'Week Range'}
                                            name="planDate"
                                            rules={[{
                                                required: true,
                                                message: isDay ? 'Please select a date' : 'Please select a start and end date',
                                            }]}
                                        >
                                            {isDay ? (
                                                <DatePicker style={{ width: '100%' }} placeholder="Select a date" />
                                            ) : (
                                                <DatePicker.RangePicker
                                                    style={{ width: '100%' }}
                                                    placeholder={['Start date', 'End date']}
                                                    format="DD/MM/YYYY"
                                                />
                                            )}
                                        </Form.Item>
                                    </Col>
                                    {statusCol}
                                </Row>
                                {/* Row 3: Planned Quantity | empty */}
                                <Row gutter={16}>
                                    {plannedQtyCol}
                                </Row>
                            </>
                        );
                    }}
                </Form.Item>
            </EntityFormModal>

            <CategoryViewModal
                open={viewModalState.open}
                title={`Plan #${viewModalState.data?.planId || ''}`}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'planId',
                        label: t('productionPlanManagement.table.headers.id'),
                        children: viewModalState.data?.planId ?? '-',
                    },
                    {
                        key: 'filterId',
                        label: t('productionPlanManagement.table.headers.filterId'),
                        children: viewModalState.data?.filterId || '-',
                    },
                    {
                        key: 'dateRange',
                        label: 'Date / Week',
                        children: (() => {
                            const d = viewModalState.data;
                            if (!d) return '-';
                            if (d.filterId === 'DAY' && d.planDate)
                                return dayjs(d.planDate).format('DD/MM/YYYY');
                            if (d.filterId === 'WEEK' && d.planWeekStart && d.planWeekEnd)
                                return `${dayjs(d.planWeekStart).format('DD/MM/YYYY')} – ${dayjs(d.planWeekEnd).format('DD/MM/YYYY')}`;
                            return '—';
                        })(),
                    },
                    {
                        key: 'machineId',
                        label: t('productionPlanManagement.table.headers.machineId'),
                        children: viewModalState.data?.machineId ?? '-',
                    },
                    {
                        key: 'plannedQuantity',
                        label: t('productionPlanManagement.table.headers.plannedQuantity'),
                        children: viewModalState.data?.plannedQuantity ?? '-',
                    },
                    {
                        key: 'status',
                        label: t('productionPlanManagement.table.headers.status'),
                        children: viewModalState.data?.status || '-',
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

export default ProductionPlanListPage;
