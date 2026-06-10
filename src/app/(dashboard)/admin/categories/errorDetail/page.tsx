'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorDetailService } from '@/services/ErrorDetailService';
import { toast } from 'sonner';
import { Button, Card, Table, Grid, Spin } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { ErrorDetail, ErrorDetailFormData } from '@/types/ErrorDetail';
import { getErrorDetailTableColumns, ErrorDetailTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getErrorDetailFormFields } from './_components/errorDetailFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const ErrorDetailListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: ErrorDetail | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ErrorDetail[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({ open: false, type: 'create', pendingAction: null });

    usePageTitle(t('pageTitle.errorDetailList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ErrorDetailService.getAllErrorDetails();
            setData(response);
        } catch (error) {
            toast.error(t('errorDetailManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleEdit = useCallback(
        (item: ErrorDetail) => {
            if (!checkPermission('update', 'error_detail')) return;
            setModalState({ open: true, mode: 'edit', data: item });
        },
        [checkPermission]
    );

    const handleView = useCallback((item: ErrorDetail) => {
        setViewModalState({ open: true, data: item });
    }, []);

    const handleDelete = useCallback(
        (item: ErrorDetail) => {
            if (!checkPermission('delete', 'error_detail')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await ErrorDetailService.deleteErrorDetail(item.errorCodeId);
                        toast.success(t('errorDetailManagement.deleteSuccess'));
                        fetchData();
                    } catch (error) {
                        handleError(error, { fallbackKey: 'errorDetailManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, fetchData, checkPermission, handleError]
    );

    const columnProps: ErrorDetailTableColumnProps = useMemo(
        () => ({ onEdit: handleEdit, onView: handleView, onDelete: handleDelete, isMobile, t, ability }),
        [handleEdit, handleView, handleDelete, isMobile, t, ability]
    );

    const columns = useMemo(() => getErrorDetailTableColumns(columnProps), [columnProps]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm.trim()) return data;
        const lower = searchTerm.toLowerCase().trim();
        return data.filter((item) => item.errorName?.toLowerCase().includes(lower));
    }, [data, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (formData: ErrorDetailFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(formData, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (formData: ErrorDetailFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await ErrorDetailService.createErrorDetail(formData);
                toast.success(t('errorDetailManagement.form.createSuccess'));
            } else {
                if (modalState.data?.errorCodeId) {
                    await ErrorDetailService.updateErrorDetail({
                        ...formData,
                        errorCodeId: modalState.data.errorCodeId,
                        errorDetailId: 0
                    });
                    toast.success(t('errorDetailManagement.updateSuccess'));
                }
            }
            fetchData();
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'errorDetailManagement.form.createError'
                        : 'errorDetailManagement.updateError',
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
        () => getErrorDetailFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('errorDetailManagement.title')}
                loading={loading}
                rightContent={
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <SearchInput
                            placeholder={t('errorDetailManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="error_detail">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('errorDetailManagement.addErrorDetail')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="error_detail">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                            aria-label={t('errorDetailManagement.addErrorDetail')}
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
                    <Table<ErrorDetail>
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        rowKey={(record) => record.errorCodeId}
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

            <EntityFormModal<ErrorDetailFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('errorDetailManagement.form.createTitle'),
                    edit: t('errorDetailManagement.form.editTitle'),
                }}
                description={{ create: '', edit: '' }}
                buttonLabels={{
                    cancel: t('errorDetailManagement.form.buttons.cancel'),
                    create: t('errorDetailManagement.form.buttons.create'),
                    edit: t('errorDetailManagement.form.buttons.update'),
                    saving: t('errorDetailManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.errorName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'errorCodeId',
                        label: t('errorDetailManagement.table.headers.id'),
                        children: viewModalState.data?.errorCodeId ?? '-',
                    },
                    {
                        key: 'errorName',
                        label: t('errorDetailManagement.table.headers.errorName'),
                        children: viewModalState.data?.errorName || '-',
                    },
                    {
                        key: 'description',
                        label: t('errorDetailManagement.table.headers.description'),
                        children: viewModalState.data?.description || '-',
                    },
                    {
                        key: 'status',
                        label: t('errorDetailManagement.table.headers.status'),
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

export default ErrorDetailListPage;
