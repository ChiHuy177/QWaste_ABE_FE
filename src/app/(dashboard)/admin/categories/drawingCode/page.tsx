'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Button,
    Card,
    Table,
    Space,
    Grid,
    Modal,
    Descriptions,
    Spin,
    Typography,
    Tag,
    Popover,
} from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CodeOutlined, FilePdfOutlined, PlusOutlined } from '@ant-design/icons';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import {
    DrawingCode,
    StepTemplate,
    CreateDrawingCodeRequest,
    UpdateDrawingCodeRequest,
} from '@/types/DrawingCode';
import { DrawingCodeTableColumnProps, getDrawingCodeTableColumns } from './_components/Columns';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getDrawingCodeFormFields } from './_components/drawingCodeFormConfig';
import { StepBuilder } from './_components/StepBuilder';
import { PDFPreviewModal } from '@/components/shared/PDFPreviewModal';
import { DrawingCodeService } from '@/services/DrawingCodeService';
import { DemoDrawingCodeService, USE_MOCK_ORDERS } from '@/mockData/admin/orders';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmModal, ConfirmationType } from '@/components/shared/ConfirmModal';
import { useUploadThing } from '@/utils/uploadthing';
import { useAbility } from '@/contexts/AbilityContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import dayjs from 'dayjs';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

const { useBreakpoint } = Grid;
const activeDrawingCodeService = USE_MOCK_ORDERS ? DemoDrawingCodeService : DrawingCodeService;

const DrawingCodeListPage = () => {
    const [modalState, setModalState] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        data: DrawingCode | null;
    }>({ open: false, mode: 'create', data: null });

    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

    const { t } = useTranslation();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();
    const ability = useAbility();
    const { handleError } = useApiErrorHandler();
    const [loading, setLoading] = useState(true);
    const [drawingCodeData, setDrawingCodeData] = useState<DrawingCode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormLoading, setIsFormLoading] = useState(false);
    const { startUpload } = useUploadThing('imageUploader');
    const [pdfPreviewState, setPdfPreviewState] = useState<{
        open: boolean;
        url: string;
        title: string;
    }>({
        open: false,
        url: '',
        title: '',
    });
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
        data: DrawingCode | null;
    }>({ open: false, loading: false, data: null });

    const { Title } = Typography;

    usePageTitle(t('pageTitle.drawingCodeList'));

    const fetchDrawingCodeData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await activeDrawingCodeService.getAllDrawingCode();
            setDrawingCodeData(response);
        } catch (error) {
            console.error('Error fetching drawing code data:', error);
            handleError(error, { fallbackKey: 'drawingCodeManagement.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    const handleEditDrawingCode = useCallback(
        async (drawingCode: DrawingCode) => {
            if (!checkPermission('update', 'drawing_code')) {
                return;
            }

            setModalState({ open: true, mode: 'edit', data: drawingCode });
            setIsFormLoading(true);

            try {
                const detailData = await activeDrawingCodeService.getDrawingCodeById(
                    drawingCode.drawingCodeId
                );
                setModalState({ open: true, mode: 'edit', data: detailData });
            } catch (error) {
                console.error('Error fetching drawing code data:', error);
                handleError(error, { fallbackKey: 'drawingCodeManagement.fetchError' });
                setModalState({ open: false, mode: 'create', data: null });
            } finally {
                setIsFormLoading(false);
            }
        },
        [checkPermission, handleError]
    );

    const handleDeleteDrawingCode = useCallback(
        async (drawingCode: DrawingCode) => {
            if (!checkPermission('delete', 'drawing_code')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'delete',
                pendingAction: async () => {
                    try {
                        await activeDrawingCodeService.deleteDrawingCode(drawingCode.drawingCodeId);
                        toast.success(t('drawingCodeManagement.deleteSuccess'));
                        await fetchDrawingCodeData();
                    } catch (error) {
                        handleError(error, { fallbackKey: 'drawingCodeManagement.deleteError' });
                        throw error;
                    }
                },
            });
        },
        [t, checkPermission, fetchDrawingCodeData, handleError]
    );

    const handleRestoreDrawingCode = useCallback(
        async (drawingCode: DrawingCode) => {
            if (!checkPermission('update', 'drawing_code')) {
                return;
            }

            setConfirmModalState({
                open: true,
                type: 'restore',
                pendingAction: async () => {
                    try {
                        await activeDrawingCodeService.restoreDrawingCode(
                            drawingCode.drawingCodeId
                        );
                        toast.success(t('drawingCodeManagement.restoreSuccess'));
                        await fetchDrawingCodeData();
                    } catch (error) {
                        handleError(error, { fallbackKey: 'drawingCodeManagement.restoreError' });
                        throw error;
                    }
                },
            });
        },
        [t, checkPermission, fetchDrawingCodeData, handleError]
    );

    const handlePreviewPDF = useCallback((drawingCode: DrawingCode) => {
        if (!drawingCode.pdfLink) return;
        setPdfPreviewState({
            open: true,
            url: drawingCode.pdfLink,
            title: drawingCode.drawingCodeName,
        });
    }, []);

    const handleViewDrawCoding = useCallback(
        async (drawing_code: DrawingCode) => {
            setViewModalState({ open: true, loading: true, data: null });
            try {
                const detailData = await activeDrawingCodeService.getDrawingCodeById(
                    drawing_code.drawingCodeId
                );
                setViewModalState({ open: true, loading: false, data: detailData });
            } catch (error) {
                console.error('Error fetching machine details for view:', error);
                handleError(error, { fallbackKey: 'drawingCodeManagement.fetchError' });
                setViewModalState({ open: false, loading: false, data: null });
            }
        },
        [handleError]
    );

    const columnProps: DrawingCodeTableColumnProps = useMemo(
        () => ({
            onView: handleViewDrawCoding,
            onEdit: handleEditDrawingCode,
            onDelete: handleDeleteDrawingCode,
            onRestore: handleRestoreDrawingCode,
            onPreview: handlePreviewPDF,
            t,
            ability,
        }),
        [
            handleViewDrawCoding,
            handleEditDrawingCode,
            handleDeleteDrawingCode,
            handleRestoreDrawingCode,
            handlePreviewPDF,
            t,
            ability,
        ]
    );

    const columns = useMemo(() => getDrawingCodeTableColumns(columnProps), [columnProps]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return drawingCodeData;
        const lower = searchTerm.toLowerCase().trim();
        return drawingCodeData.filter(
            (dc) =>
                dc.drawingCode.toLowerCase().includes(lower) ||
                dc.drawingCodeName.toLowerCase().includes(lower)
        );
    }, [drawingCodeData, searchTerm]);

    useEffect(() => {
        fetchDrawingCodeData();
    }, [fetchDrawingCodeData]);

    const handleSubmit = async (data: any, mode: 'create' | 'edit') => {
        setConfirmModalState({
            open: true,
            type: mode,
            pendingAction: () => executeSubmit(data, mode),
        });
        throw new Error('CONFIRMATION_PENDING');
    };

    const executeSubmit = async (data: any, mode: 'create' | 'edit') => {
        const stepTemplates: StepTemplate[] = (data.stepTemplates || []).map(
            (step: any, index: number) => ({
                ...step,
                stepOrder: index + 1,
            })
        );

        if (mode === 'create') {
            // Upload PDF if it's a File object
            let pdfUrl = data.pdfLink;
            if (data.pdfLink instanceof File) {
                try {
                    if (USE_MOCK_ORDERS) {
                        pdfUrl = URL.createObjectURL(data.pdfLink);
                    } else {
                        const result = await startUpload([data.pdfLink]);
                        if (result && result[0]) {
                            pdfUrl = result[0].ufsUrl || result[0].url;
                        } else {
                            throw new Error('Failed to upload PDF');
                        }
                    }
                } catch (error) {
                    toast.error(
                        t('common.upload.pdf.uploadFailed', {
                            defaultValue: 'Failed to upload PDF',
                        })
                    );
                    throw error;
                }
            }

            const payload: CreateDrawingCodeRequest = {
                drawingCode: data.drawingCode?.toUpperCase(),
                drawingCodeName: data.drawingCodeName,
                description: data.description || undefined,
                pdfLink: pdfUrl || undefined,
                ofCustomer: data.ofCustomer || 'WOODSLAND',
                stepTemplates: stepTemplates,
            };
            await activeDrawingCodeService.createDrawingCode(payload);
            toast.success(t('drawingCodeManagement.form.createSuccess'));
        } else {
            const payload: UpdateDrawingCodeRequest = {
                drawingCodeId: modalState.data!.drawingCodeId,
                drawingCode: data.drawingCode?.toUpperCase(),
                drawingCodeName: data.drawingCodeName,
                description: data.description || undefined,
                ofCustomer: data.ofCustomer || 'WOODSLAND',
                stepTemplates: stepTemplates.length > 0 ? stepTemplates : undefined,
            };
            await activeDrawingCodeService.updateDrawingCode(payload);
            toast.success(t('drawingCodeManagement.updateSuccess'));
        }
        await fetchDrawingCodeData();
    };

    const handleCreateDrawingCode = useCallback(() => {
        if (!checkPermission('create', 'drawing_code')) {
            return;
        }

        setModalState({ open: true, mode: 'create', data: null });
    }, [checkPermission]);

    const handleConfirmAction = async () => {
        if (confirmModalState.pendingAction) {
            try {
                await confirmModalState.pendingAction();
                setConfirmModalState({
                    open: false,
                    type: 'create',
                    pendingAction: null,
                });
                setModalState((prev) => ({ ...prev, open: false }));
            } catch (error) {
                // If it is our special error, don't close the modal yet
                if (error instanceof Error && error.message === 'CONFIRMATION_PENDING') {
                    return;
                }
                setConfirmModalState((prev) => ({ ...prev, open: false }));
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

    const initialData = useMemo(() => {
        if (!modalState.data) return null;
        return {
            drawingCode: modalState.data.drawingCode,
            drawingCodeName: modalState.data.drawingCodeName,
            description: modalState.data.description,
            ofCustomer: modalState.data.ofCustomer,
            pdfLink: modalState.data.pdfLink,
            stepTemplates: modalState.data.stepTemplates || [],
        };
    }, [modalState.data]);

    const formFields = useMemo(
        () => getDrawingCodeFormFields(t, modalState.mode),
        [t, modalState.mode]
    );

    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <>
            <ResponsivePageHeader
                title={t('drawingCodeManagement.title')}
                icon={<CodeOutlined />}
                loading={loading}
                rightContent={
                    <Space wrap direction={isMobile ? 'vertical' : 'horizontal'}>
                        <SearchInput
                            placeholder={t('drawingCodeManagement.searchPlaceholder')}
                            value={searchTerm}
                            onChange={setSearchTerm}
                            width={260}
                        />
                        {checkPermissionSilent('create', 'drawing_code') && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreateDrawingCode}
                            >
                                {t('drawingCodeManagement.addDrawingCode')}
                            </Button>
                        )}
                    </Space>
                }
                rightContentMobile={
                    checkPermissionSilent('create', 'drawing_code') ? (
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            block={isMobile}
                            onClick={handleCreateDrawingCode}
                            aria-label={t('drawingCodeManagement.addDrawingCode')}
                        />
                    ) : null
                }
            />

            <Modal
                title={viewModalState.data?.drawingCode}
                open={viewModalState.open}
                onCancel={() => setViewModalState({ open: false, loading: false, data: null })}
                footer={null}
                width={isMobile ? '90%' : '80%'}
            >
                {viewModalState.loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : viewModalState.data ? (
                    <div>
                        <Descriptions column={isMobile ? 1 : 2} bordered size="small">
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.drawingCode')}
                            >
                                {viewModalState.data.drawingCode || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.drawingCodeName')}
                            >
                                {viewModalState.data.drawingCodeName || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.description')}
                            >
                                {viewModalState.data.description || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.pdfLink')}
                            >
                                {viewModalState.data?.pdfLink ? (
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<FilePdfOutlined />}
                                        onClick={() => setPdfPreviewOpen(true)}
                                    >
                                        PDF
                                    </Button>
                                ) : (
                                    '-'
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.ofCustomer')}
                            >
                                {viewModalState.data.ofCustomer || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.stepsCount')}
                            >
                                {viewModalState.data?.stepTemplates?.length ? (
                                    <Space wrap>
                                        {viewModalState.data.stepTemplates.map((step) => (
                                            <Popover
                                                key={step.stepTemplateId || step.stepOrder}
                                                title={`Step ${step.stepOrder}`}
                                                trigger="click"
                                                content={
                                                    <div style={{ minWidth: 250 }}>
                                                        <p>
                                                            <strong>Step Name:</strong>{' '}
                                                            {step.stepName || '-'}
                                                        </p>
                                                        <p>
                                                            <strong>Material Name:</strong>{' '}
                                                            {step.materialName || '-'}
                                                        </p>
                                                        <p>
                                                            <strong>Description:</strong>{' '}
                                                            {step.description || '-'}
                                                        </p>
                                                        <p>
                                                            <strong>Completion Time:</strong>{' '}
                                                            {step.defaultCompletionTimeSeconds ??
                                                                '-'}{' '}
                                                            seconds
                                                        </p>
                                                    </div>
                                                }
                                            >
                                                <Button size="small">Step {step.stepOrder}</Button>
                                            </Popover>
                                        ))}
                                    </Space>
                                ) : (
                                    '-'
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('drawingCodeManagement.table.headers.status')}
                            >
                                {viewModalState.data.softDeleteMetaData?.isDeleted ? (
                                    <Tag color="red">
                                        {t('drawingCodeManagement.table.deleted')}
                                    </Tag>
                                ) : (
                                    <Tag color="green">
                                        {t('drawingCodeManagement.table.active')}
                                    </Tag>
                                )}
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
            <Modal
                open={pdfPreviewOpen}
                onCancel={() => setPdfPreviewOpen(false)}
                footer={null}
                width={1000}
                centered
                destroyOnClose
            >
                <iframe
                    src={viewModalState.data?.pdfLink ?? undefined}
                    width="100%"
                    height="550"
                    style={{
                        padding: '0 20px',
                        border: 'none',
                        borderRadius: 8,
                    }}
                    title="PDF Preview"
                />
            </Modal>

            <Card
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                styles={{
                    body: { flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 0 },
                }}
            >
                <Table<DrawingCode>
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey={(record) => record.drawingCodeId}
                    rowClassName={(record) =>
                        record.softDeleteMetaData?.isDeleted ? 'ant-table-row-deleted' : ''
                    }
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} ${t('common.of')} ${total} ${t('common.items')}`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        position: ['bottomCenter'],
                    }}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
                    sticky
                    bordered
                />
            </Card>

            {/* Create / Edit Modal */}
            <EntityFormModal<any>
                open={modalState.open}
                onOpenChange={(open) => {
                    setModalState((prev) => ({ ...prev, open }));
                }}
                onSubmit={handleSubmit}
                mode={modalState.mode}
                initialData={initialData}
                fields={formFields}
                title={{
                    create: t('drawingCodeManagement.form.createTitle'),
                    edit: t('drawingCodeManagement.form.editTitle'),
                }}
                description={{
                    create: t('drawingCodeManagement.form.createDescription'),
                    edit: t('drawingCodeManagement.form.editDescription'),
                }}
                buttonLabels={{
                    cancel: t('drawingCodeManagement.form.buttons.cancel'),
                    create: t('drawingCodeManagement.form.buttons.create'),
                    edit: t('drawingCodeManagement.form.buttons.update'),
                    saving: t('drawingCodeManagement.form.buttons.saving'),
                }}
                width={{ xs: '95%', sm: '80vh', md: '80vh' }}
                t={t}
                loading={isFormLoading}
            >
                {/* Step Builder injected inside the modal */}
                <StepBuilder t={t} />
            </EntityFormModal>

            {/* Detail / Edit Modal */}

            {/* PDF Preview Modal */}
            <PDFPreviewModal
                open={pdfPreviewState.open}
                onClose={() => setPdfPreviewState((prev) => ({ ...prev, open: false }))}
                pdfUrl={pdfPreviewState.url}
                title={pdfPreviewState.title}
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

export default DrawingCodeListPage;
