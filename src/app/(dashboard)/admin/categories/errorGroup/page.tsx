'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorGroupService } from '@/services/ErrorGroupService';
import { toast } from 'sonner';
import { Button, Card, Table, Grid, Spin } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { ErrorGroup, ErrorGroupFormData } from '@/types/ErrorGroup';
import { getErrorGroupTableColumns, ErrorGroupTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getErrorGroupFormFields } from './_components/errorGroupFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const ErrorGroupListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: ErrorGroup | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ErrorGroup[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({ open: false, type: 'create', pendingAction: null });

    usePageTitle(t('pageTitle.errorGroupList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await ErrorGroupService.getAllErrorGroups();
            setData(response);
        } catch (error) {
            toast.error(t('errorGroupManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleEdit = useCallback(
        (item: ErrorGroup) => {
            if (!checkPermission('update', 'error_group')) return;
            setModalState({ open: true, mode: 'edit', data: item });
        },
        [checkPermission]
    );

    const handleView = useCallback((item: ErrorGroup) => {
        setViewModalState({ open: true, data: item });
    }, []);

    const handleDelete = useCallback(
        (item: ErrorGroup) => {
            if (!checkPermission('delete', 'error_group')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await ErrorGroupService.deleteErrorGroup(item.errorGroupId);
                        toast.success(t('errorGroupManagement.deleteSuccess'));
                        fetchData();
                    } catch (error) {
                        handleError(error, { fallbackKey: 'errorGroupManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, fetchData, checkPermission, handleError]
    );

    const columnProps: ErrorGroupTableColumnProps = useMemo(
        () => ({ onEdit: handleEdit, onView: handleView, onDelete: handleDelete, isMobile, t, ability }),
        [handleEdit, handleView, handleDelete, isMobile, t, ability]
    );

    const columns = useMemo(() => getErrorGroupTableColumns(columnProps), [columnProps]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm.trim()) return data;
        const lower = searchTerm.toLowerCase().trim();
        return data.filter((item) => item.errorGroupName?.toLowerCase().includes(lower));
    }, [data, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (formData: ErrorGroupFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(formData, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (formData: ErrorGroupFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await ErrorGroupService.createErrorGroup(formData);
                toast.success(t('errorGroupManagement.form.createSuccess'));
            } else {
                if (modalState.data?.errorGroupId) {
                    await ErrorGroupService.updateErrorGroup({
                        ...formData,
                        errorGroupId: modalState.data.errorGroupId,
                    });
                    toast.success(t('errorGroupManagement.updateSuccess'));
                }
            }
            fetchData();
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'errorGroupManagement.form.createError'
                        : 'errorGroupManagement.updateError',
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
        () => getErrorGroupFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('errorGroupManagement.title')}
                loading={loading}
                rightContent={
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <SearchInput
                            placeholder={t('errorGroupManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="error_group">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('errorGroupManagement.addErrorGroup')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="error_group">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                            aria-label={t('errorGroupManagement.addErrorGroup')}
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
                    <Table<ErrorGroup>
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        rowKey={(record) => record.errorGroupId}
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

            <EntityFormModal<ErrorGroupFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('errorGroupManagement.form.createTitle'),
                    edit: t('errorGroupManagement.form.editTitle'),
                }}
                description={{ create: '', edit: '' }}
                buttonLabels={{
                    cancel: t('errorGroupManagement.form.buttons.cancel'),
                    create: t('errorGroupManagement.form.buttons.create'),
                    edit: t('errorGroupManagement.form.buttons.update'),
                    saving: t('errorGroupManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.errorGroupName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'errorGroupId',
                        label: t('errorGroupManagement.table.headers.id'),
                        children: viewModalState.data?.errorGroupId ?? '-',
                    },
                    {
                        key: 'errorGroupName',
                        label: t('errorGroupManagement.table.headers.errorGroupName'),
                        children: viewModalState.data?.errorGroupName || '-',
                    },
                    {
                        key: 'description',
                        label: t('errorGroupManagement.table.headers.description'),
                        children: viewModalState.data?.description || '-',
                    },
                    {
                        key: 'status',
                        label: t('errorGroupManagement.table.headers.status'),
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

export default ErrorGroupListPage;
