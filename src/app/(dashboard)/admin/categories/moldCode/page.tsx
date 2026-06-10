'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoldCodeService } from '@/services/MoldCodeService';
import { toast } from 'sonner';
import { Button, Card, Table, Grid, Spin } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { MoldCode, MoldCodeFormData } from '@/types/MoldCode';
import { getMoldCodeTableColumns, MoldCodeTableColumnProps } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getMoldCodeFormFields } from './_components/moldCodeFormConfig';
import { SearchInput } from '@/components/shared/SearchInput';
import { Can, useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { CategoryViewModal } from '../_components/CategoryViewModal';

const { useBreakpoint } = Grid;

const MoldCodeListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: any | null;
    }>({ open: false, mode: 'create', data: null });
    const [viewModalState, setViewModalState] = useState<{
        open: boolean;
        data: MoldCode | null;
    }>({ open: false, data: null });

    const { t } = useTranslation();
    const { checkPermission } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MoldCode[] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModalState, setConfirmModalState] = useState<{
        open: boolean;
        type: ConfirmationType;
        pendingAction: (() => Promise<void>) | null;
    }>({ open: false, type: 'create', pendingAction: null });

    usePageTitle(t('pageTitle.moldCodeList'));

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await MoldCodeService.getAllMoldCodes();
            setData(response);
        } catch (error) {
            toast.error(t('moldCodeManagement.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const handleEdit = useCallback(
        (item: MoldCode) => {
            if (!checkPermission('update', 'mold_code')) return;
            setModalState({ open: true, mode: 'edit', data: item });
        },
        [checkPermission]
    );

    const handleView = useCallback((item: MoldCode) => {
        setViewModalState({ open: true, data: item });
    }, []);

    const handleDelete = useCallback(
        (item: MoldCode) => {
            if (!checkPermission('delete', 'mold_code')) return;
            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await MoldCodeService.deleteMoldCode(item.moldCodeId);
                        toast.success(t('moldCodeManagement.deleteSuccess'));
                        fetchData();
                    } catch (error) {
                        handleError(error, { fallbackKey: 'moldCodeManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, fetchData, checkPermission, handleError]
    );

    const columnProps: MoldCodeTableColumnProps = useMemo(
        () => ({ onEdit: handleEdit, onView: handleView, onDelete: handleDelete, isMobile, t, ability }),
        [handleEdit, handleView, handleDelete, isMobile, t, ability]
    );

    const columns = useMemo(() => getMoldCodeTableColumns(columnProps), [columnProps]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm.trim()) return data;
        const lower = searchTerm.toLowerCase().trim();
        return data.filter((item) => item.moldCodeName?.toLowerCase().includes(lower));
    }, [data, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (formData: MoldCodeFormData, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(formData, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (formData: MoldCodeFormData, mode: 'create' | 'edit') => {
        try {
            if (mode === 'create') {
                await MoldCodeService.createMoldCode(formData);
                toast.success(t('moldCodeManagement.form.createSuccess'));
            } else {
                if (modalState.data?.moldCodeId) {
                    await MoldCodeService.updateMoldCode({
                        ...formData,
                        moldCodeId: modalState.data.moldCodeId,
                    });
                    toast.success(t('moldCodeManagement.updateSuccess'));
                }
            }
            fetchData();
        } catch (error) {
            handleError(error, {
                fallbackKey:
                    mode === 'create'
                        ? 'moldCodeManagement.form.createError'
                        : 'moldCodeManagement.updateError',
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
        () => getMoldCodeFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('moldCodeManagement.title')}
                loading={loading}
                rightContent={
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <SearchInput
                            placeholder={t('moldCodeManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={250}
                        />
                        <Can I="create" a="mold_code">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                                style={{ transition: 'box-shadow 0.2s, background-color 0.2s' }}
                            >
                                {t('moldCodeManagement.addMoldCode')}
                            </Button>
                        </Can>
                    </div>
                }
                rightContentMobile={
                    <Can I="create" a="mold_code">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => setModalState({ open: true, mode: 'create', data: null })}
                            aria-label={t('moldCodeManagement.addMoldCode')}
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
                    <Table<MoldCode>
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        rowKey={(record) => record.moldCodeId}
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

            <EntityFormModal<MoldCodeFormData>
                open={modalState.open}
                onOpenChange={(open) => setModalState({ ...modalState, open })}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={modalState.data}
                fields={formFields}
                title={{
                    create: t('moldCodeManagement.form.createTitle'),
                    edit: t('moldCodeManagement.form.editTitle'),
                }}
                description={{ create: '', edit: '' }}
                buttonLabels={{
                    cancel: t('moldCodeManagement.form.buttons.cancel'),
                    create: t('moldCodeManagement.form.buttons.create'),
                    edit: t('moldCodeManagement.form.buttons.update'),
                    saving: t('moldCodeManagement.form.buttons.saving'),
                }}
                width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                auditMetaData={modalState.data?.auditMetaData}
                t={t}
            />

            <CategoryViewModal
                open={viewModalState.open}
                title={viewModalState.data?.moldCodeName || t('common.view')}
                onClose={() => setViewModalState({ open: false, data: null })}
                t={t}
                auditMetaData={viewModalState.data?.auditMetaData}
                items={[
                    {
                        key: 'moldCodeId',
                        label: t('moldCodeManagement.table.headers.id'),
                        children: viewModalState.data?.moldCodeId ?? '-',
                    },
                    {
                        key: 'moldCodeName',
                        label: t('moldCodeManagement.table.headers.moldCodeName'),
                        children: viewModalState.data?.moldCodeName || '-',
                    },
                    {
                        key: 'description',
                        label: t('moldCodeManagement.table.headers.description'),
                        children: viewModalState.data?.description || '-',
                    },
                    {
                        key: 'status',
                        label: t('moldCodeManagement.table.headers.status'),
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

export default MoldCodeListPage;
