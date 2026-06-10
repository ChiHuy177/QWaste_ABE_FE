
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Spin, Tabs, Steps, Form, Button, Space, Flex, theme } from 'antd';
import {
    PlusOutlined,
    SaveOutlined,
    CloseOutlined,
    FileTextOutlined,
    NodeIndexOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    OrderCreationRequest,
    OrderInfoUpdationRequest,
    OrderPlanUpdationRequest,
    OrderStatus,
} from '@/types/Order';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { QuickCreateDrawingCodeModal } from '../QuickCreateDrawingCodeModal';
import {
    useOrderFormData,
    useOrderFormSteps,
    useOrderFormTabs,
    useOrderFormActions,
    useQuickCreateDrawing,
} from './hooks';
import {
    UnsavedChangesModal,
    BasicInfoStep,
    DrawingConfigStep,
    ReviewStep,
    InfoTab,
    PlanTab,
} from './components';
import { WIZARD_STEPS, DEFAULT_FORM_VALUES } from './constants';
import { mapOrderDrawingsToRequest, mapAttachmentsToFormValue } from './utils/mappers';
import { PlanTreeValidationError, validateOrderDrawingsTree } from './utils/validators';
import { fieldPathToNodeKey } from './utils/treeMappers';
import { useOrderAttachmentUpload } from './hooks/useOrderAttachmentUpload';
import { useOrderPlanData } from './hooks/useOrderPlanData';

const { useToken } = theme;

const canUpdateOrderInfo = (status?: OrderStatus) =>
    status !== 'CANCELLED' && status !== 'COMPLETED';

const canUpdateOrderPlan = (status?: OrderStatus) => status === 'REVIEWING';

export const OrderFormContainer: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useToken();

    const [form] = Form.useForm();
    const [infoForm] = Form.useForm();
    const [planForm] = Form.useForm();
    const [createPlanFocusNodeKey, setCreatePlanFocusNodeKey] = useState<string | null>(null);
    const [editPlanFocusNodeKey, setEditPlanFocusNodeKey] = useState<string | null>(null);
    const [createPlanValidationVersion, setCreatePlanValidationVersion] = useState(0);
    const [editPlanValidationVersion, setEditPlanValidationVersion] = useState(0);
    const [createPlanRootError, setCreatePlanRootError] = useState<string | null>(null);
    const [editPlanRootError, setEditPlanRootError] = useState<string | null>(null);

    const {
        currentOrder,
        drawingTemplates,
        operators,
        isSubmitting,
        isOrderFormOpen,
        orderFormMode,
        selectedOrderId,
        isLoadingDrawings,
        isLoadingTemplates,
        isLoadingOperators,
        refreshDrawingTemplates,
    } = useOrderFormData();

    // Redux actions
    const { createOrder, updateOrderInfo, updateOrderPlan, closeOrderForm } =
        useOrderFormActions();

    const applyTreeErrorsAfterFocus = useCallback(
        (
            targetForm: typeof form,
            treeErrors: PlanTreeValidationError[],
            setFocusNodeKey: React.Dispatch<React.SetStateAction<string | null>>,
            bumpValidationVersion: React.Dispatch<React.SetStateAction<number>>
        ) => {
            const fieldErrors = treeErrors.map((error) => ({
                name: error.name,
                errors: [error.message],
            }));
            const firstNodeKey = treeErrors.find((error) => error.nodeKey)?.nodeKey;

            if (firstNodeKey) {
                setFocusNodeKey(firstNodeKey);
            }

            window.setTimeout(() => {
                targetForm.setFields(fieldErrors);
                bumpValidationVersion((version) => version + 1);
                targetForm.scrollToField(treeErrors[0].name, {
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 50);
        },
        [form]
    );

    const validateCreatePlanStep = useCallback(async () => {
        const values = form.getFieldsValue(true);
        const currentTreeErrors = form
            .getFieldsError()
            .filter((field) => field.name[0] === 'orderDrawings');

        if (currentTreeErrors.length > 0) {
            form.setFields(currentTreeErrors.map((field) => ({ name: field.name, errors: [] })));
        }

        const treeErrors = validateOrderDrawingsTree(values.orderDrawings || [], t);

        if (treeErrors.length > 0) {
            setCreatePlanRootError(
                treeErrors[0].name[0] === 'orderDrawings' && treeErrors[0].name.length === 1
                    ? treeErrors[0].message
                    : null
            );
            applyTreeErrorsAfterFocus(
                form,
                treeErrors,
                setCreatePlanFocusNodeKey,
                setCreatePlanValidationVersion
            );

            throw {
                errorFields: treeErrors.map((error) => ({
                    name: error.name,
                    errors: [error.message],
                })),
            };
        }

        setCreatePlanRootError(null);
        await form.validateFields();
    }, [applyTreeErrorsAfterFocus, form, t]);

    // Wizard steps (local state)
    const {
        currentStep,
        setCurrentStep,
        allowSubmit,
        setAllowSubmit,
        stepErrorIndex,
        setStepErrorIndex,
        handleNext,
        handleBack,
        handleStepChange,
        resetStep,
        isFirstStep,
        isLastStep,
    } = useOrderFormSteps({
        form,
        totalSteps: WIZARD_STEPS.length,
        validateDrawingStep: validateCreatePlanStep,
    });

    // Edit tabs (local state)
    const {
        activeEditTab,
        pendingTabSwitch,
        setInfoFormDirty,
        setPlanFormDirty,
        handleTabSwitch,
        confirmTabSwitch,
        cancelTabSwitch,
        resetTabState,
    } = useOrderFormTabs();

    // Upload
    const { uploadLocalAttachments, isUploadingAttachments } = useOrderAttachmentUpload();

    // Plan data loading
    const { isLoadingPlanData, resetPlanDataCache } = useOrderPlanData({
        isEditing: orderFormMode === 'edit' && !!selectedOrderId,
        selectedOrderId,
        isOrderFormOpen,
        activeEditTab,
        planForm,
        currentOrder,
        isLoadingOperators,
    });

    // Quick create
    const { quickCreateState, handleQuickCreateOpen, handleQuickCreateClose, handleQuickCreated } =
        useQuickCreateDrawing(orderFormMode === 'edit' ? planForm : form);

    const isEditing = orderFormMode === 'edit' && !!selectedOrderId;
    const editingOrder =
        isEditing && currentOrder?.orderId === selectedOrderId ? currentOrder : null;
    const canEditInfoTab = isEditing
        ? Boolean(editingOrder && canUpdateOrderInfo(editingOrder.orderStatus))
        : true;
    const canEditPlanTab = isEditing
        ? Boolean(editingOrder && canUpdateOrderPlan(editingOrder.orderStatus))
        : true;
    const productionType = Form.useWatch('productionType', form);
    const planProductionType = Form.useWatch('productionType', planForm);

    // Populate Info Form khi edit
    useEffect(() => {
        if (!isEditing || !currentOrder || currentOrder.orderId !== selectedOrderId) return;

        infoForm.setFieldsValue({
            ...currentOrder,
            attachments: mapAttachmentsToFormValue(currentOrder.orderAttachments),
            expectedStartDate: currentOrder.expectedStartDate
                ? dayjs(currentOrder.expectedStartDate)
                : undefined,
            expectedEndDate: currentOrder.expectedEndDate
                ? dayjs(currentOrder.expectedEndDate)
                : undefined,
        });
    }, [isEditing, currentOrder, selectedOrderId, infoForm]);

    // Reset wizard form khi open create mode
    useEffect(() => {
        if (isOrderFormOpen && !isEditing) {
            form.resetFields();
        }
    }, [isOrderFormOpen, isEditing, form]);

    // Handle form close/cancel
    const handleCancel = () => {
        closeOrderForm();
        form.resetFields();
        infoForm.resetFields();
        planForm.resetFields();
        resetStep();
        setAllowSubmit(false);
        resetTabState();
        resetPlanDataCache();
        setCreatePlanFocusNodeKey(null);
        setEditPlanFocusNodeKey(null);
        setCreatePlanValidationVersion(0);
        setEditPlanValidationVersion(0);
        setCreatePlanRootError(null);
        setEditPlanRootError(null);
        setStepErrorIndex(null);
    };

    // Tab switching with unsaved changes
    const handleSaveAndSwitch = async () => {
        try {
            if (activeEditTab === 'info') {
                await onFinishInfo();
                setInfoFormDirty(false);
            } else {
                await onFinishPlan();
                setPlanFormDirty(false);
            }
            confirmTabSwitch();
        } catch (_error) {
            // Error already handled in onFinish functions
        }
    };

    const handleDiscardAndSwitch = () => {
        if (activeEditTab === 'info' && currentOrder) {
            infoForm.setFieldsValue({
                ...currentOrder,
                attachments: mapAttachmentsToFormValue(currentOrder.orderAttachments),
                expectedStartDate: currentOrder.expectedStartDate
                    ? dayjs(currentOrder.expectedStartDate)
                    : undefined,
                expectedEndDate: currentOrder.expectedEndDate
                    ? dayjs(currentOrder.expectedEndDate)
                    : undefined,
            });
            setInfoFormDirty(false);
        } else if (activeEditTab === 'plan') {
            setPlanFormDirty(false);
        }
        confirmTabSwitch();
    };

    // Create order (wizard)
    const onFinish = async () => {
        if (!allowSubmit) {
            setAllowSubmit(false);
            return;
        }
        setAllowSubmit(false);

        const values = form.getFieldsValue(true);
        const treeErrors = validateOrderDrawingsTree(values.orderDrawings || [], t);

        if (treeErrors.length > 0) {
            setCreatePlanRootError(
                treeErrors[0].name[0] === 'orderDrawings' && treeErrors[0].name.length === 1
                    ? treeErrors[0].message
                    : null
            );
            setCurrentStep(1);
            applyTreeErrorsAfterFocus(
                form,
                treeErrors,
                setCreatePlanFocusNodeKey,
                setCreatePlanValidationVersion
            );
            setStepErrorIndex(1);
            toast.error(treeErrors[0].message);
            return;
        }

        const { expectedStartDate, expectedEndDate, attachments, orderQuantity, productionType, penaltyAmount, ...rest } = values;

        let finalAttachments: { attachmentUrl: string; attachmentName: string }[] = [];
        try {
            finalAttachments = await uploadLocalAttachments(attachments || []);
        } catch (uploadError) {
            return;
        }

        const payload: OrderCreationRequest = {
            ...rest,
            expectedStartDate: expectedStartDate
                ? expectedStartDate.format('YYYY-MM-DD')
                : undefined,
            expectedEndDate: expectedEndDate ? expectedEndDate.format('YYYY-MM-DD') : undefined,
            orderDrawings: mapOrderDrawingsToRequest(values.orderDrawings || []),
            attachments: finalAttachments,
        } as OrderCreationRequest;

        const success = await createOrder(payload);
        if (success) {
            handleCancel();
        }
    };

    // Update order info (edit mode - info tab)
    const onFinishInfo = async () => {
        if (!editingOrder || !canUpdateOrderInfo(editingOrder.orderStatus)) {
            toast.warning(
                t(
                    'orderManagement.form.messages.infoEditNotAllowed',
                    'Cannot update order information when the order is cancelled or completed.'
                )
            );
            return;
        }

        const values = await infoForm.validateFields();
        const { expectedStartDate, expectedEndDate, attachments, ...rest } = values;

        let finalAttachments: { attachmentUrl: string; attachmentName: string }[] = [];
        try {
            finalAttachments = await uploadLocalAttachments(attachments || []);
        } catch (uploadError) {
            return;
        }

        const payload: OrderInfoUpdationRequest = {
            ...rest,
            orderId: selectedOrderId!,
            expectedStartDate: expectedStartDate
                ? expectedStartDate.format('YYYY-MM-DD')
                : undefined,
            expectedEndDate: expectedEndDate ? expectedEndDate.format('YYYY-MM-DD') : undefined,
            attachments: finalAttachments,
        } as OrderInfoUpdationRequest;

        const success = await updateOrderInfo(payload);
        if (success) {
            setInfoFormDirty(false);
        }
    };

    // Update order plan (edit mode - plan tab)
    const onFinishPlan = async () => {
        if (!editingOrder || !canUpdateOrderPlan(editingOrder.orderStatus)) {
            toast.warning(t('orderManagement.form.messages.onlyDraftEditWarning'));
            return;
        }

        try {
            await planForm.validateFields();
        } catch (error: any) {
            const firstErrorField = error?.errorFields?.[0]?.name;
            const firstNodeKey = fieldPathToNodeKey(firstErrorField);

            if (firstNodeKey) {
                setEditPlanFocusNodeKey(firstNodeKey);
                window.setTimeout(() => {
                    planForm.scrollToField(firstErrorField, {
                        behavior: 'smooth',
                        block: 'center',
                    });
                }, 50);
            }

            throw error;
        }

        const values = planForm.getFieldsValue(true);
        const treeErrors = validateOrderDrawingsTree(values.orderDrawings || [], t);

        if (treeErrors.length > 0) {
            setEditPlanRootError(
                treeErrors[0].name[0] === 'orderDrawings' && treeErrors[0].name.length === 1
                    ? treeErrors[0].message
                    : null
            );
            applyTreeErrorsAfterFocus(
                planForm,
                treeErrors,
                setEditPlanFocusNodeKey,
                setEditPlanValidationVersion
            );
            toast.error(treeErrors[0].message);
            return;
        }

        setEditPlanRootError(null);
        const payload: OrderPlanUpdationRequest = {
            orderId: selectedOrderId!,
            orderDrawings: mapOrderDrawingsToRequest(values.orderDrawings || []),
        };

        const success = await updateOrderPlan(payload);
        if (success) {
            setPlanFormDirty(false);
            resetPlanDataCache();
        }
    };

    // Handle quick create success
    const handleQuickCreatedWrapper = (newDrawingCode: DrawingCodePickingResponse) => {
        refreshDrawingTemplates();
        handleQuickCreated(newDrawingCode);
    };

    return (
        <>
            <Modal
                open={isOrderFormOpen}
                onCancel={handleCancel}
                title={
                    <Flex align="center" gap={8}>
                        {isEditing ? <SaveOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
                        <span>
                            {isEditing
                                ? t('orderManagement.form.editTitle')
                                : t('orderManagement.form.createTitle')}
                        </span>
                    </Flex>
                }
                width="95%"
                style={{ maxWidth: 1500 }}
                footer={null}
                destroyOnHidden
                maskClosable={false}
            >
                <Spin
                    spinning={
                        isLoadingTemplates ||
                        isSubmitting ||
                        isLoadingDrawings ||
                        isLoadingPlanData ||
                        isUploadingAttachments
                    }
                >
                    {isEditing ? (
                        <>
                            {/* EDIT MODE - TABS */}
                            <Tabs
                                activeKey={activeEditTab}
                                onChange={(key) => handleTabSwitch(key as 'info' | 'plan')}
                                type="card"
                                style={{ marginTop: 16 }}
                                items={[
                                    {
                                        key: 'info',
                                        label: (
                                            <Space>
                                                <FileTextOutlined />
                                                {t('orderManagement.form.tabs.basicInfo')}
                                            </Space>
                                        ),
                                        children: (
                                            <InfoTab
                                                form={infoForm}
                                                currentOrder={currentOrder}
                                                isSubmitting={isSubmitting}
                                                disabled={!canEditInfoTab}
                                                onFinish={onFinishInfo}
                                                onCancel={handleCancel}
                                                onValuesChange={() =>
                                                    canEditInfoTab && setInfoFormDirty(true)
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        key: 'plan',
                                        label: (
                                            <Space>
                                                <NodeIndexOutlined />
                                                {t('orderManagement.form.tabs.planInfo')}
                                            </Space>
                                        ),
                                        children: (
                                            <PlanTab
                                                form={planForm}
                                                drawingTemplates={drawingTemplates}
                                                operators={operators}
                                                isLoadingOperators={isLoadingOperators}
                                                isSubmitting={isSubmitting}
                                                disabled={!canEditPlanTab}
                                                productionType={planProductionType}
                                                onFinish={onFinishPlan}
                                                onCancel={handleCancel}
                                                onValuesChange={() =>
                                                    canEditPlanTab && setPlanFormDirty(true)
                                                }
                                                onQuickCreate={handleQuickCreateOpen}
                                                focusNodeKey={editPlanFocusNodeKey}
                                                onFocusNodeHandled={() => setEditPlanFocusNodeKey(null)}
                                                onValidationFocus={setEditPlanFocusNodeKey}
                                                validationVersion={editPlanValidationVersion}
                                                showTaskReviews
                                                rootError={editPlanRootError}
                                            />
                                        ),
                                    },
                                ]}
                            />

                            {/* Unsaved Changes Modal */}
                            <UnsavedChangesModal
                                open={pendingTabSwitch !== null}
                                onCancel={cancelTabSwitch}
                                onDiscard={handleDiscardAndSwitch}
                                onSave={handleSaveAndSwitch}
                                isSubmitting={isSubmitting}
                            />
                        </>
                    ) : (
                        <>
                            {/* CREATE MODE - WIZARD */}
                            <Steps
                                current={currentStep}
                                onChange={handleStepChange}
                                items={WIZARD_STEPS.map((step, index) => ({
                                    title: t(step.titleKey),
                                    status:
                                        stepErrorIndex === index
                                            ? 'error'
                                            : currentStep === index
                                                ? 'process'
                                                : undefined,
                                }))}
                                style={{ marginBottom: 16, marginTop: 24 }}
                                size="small"
                            />

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                initialValues={DEFAULT_FORM_VALUES}
                            >
                                <div style={{ minHeight: 400 }}>
                                    {currentStep === 0 && <BasicInfoStep isEditMode={false} />}
                                    {currentStep === 1 && (
                                        <DrawingConfigStep
                                            form={form}
                                            drawingTemplates={drawingTemplates}
                                            productionType={productionType}
                                            operators={operators}
                                            isLoadingOperators={isLoadingOperators}
                                            onQuickCreate={handleQuickCreateOpen}
                                            focusNodeKey={createPlanFocusNodeKey}
                                            onFocusNodeHandled={() => setCreatePlanFocusNodeKey(null)}
                                            validationVersion={createPlanValidationVersion}
                                            showTaskReviews={false}
                                            rootError={createPlanRootError}
                                        />
                                    )}
                                    {currentStep === 2 && (
                                        <ReviewStep
                                            form={form}
                                            drawingTemplates={drawingTemplates}
                                            operators={operators}
                                            onEditStep={setCurrentStep}
                                        />
                                    )}
                                </div>

                                {/* Footer Buttons */}
                                <Flex
                                    justify="space-between"
                                    style={{
                                        marginTop: 24,
                                        paddingTop: 16,
                                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                >
                                    <Button
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                        icon={<CloseOutlined />}
                                    >
                                        {t('common.buttons.cancel')}
                                    </Button>
                                    <Space>
                                        {!isFirstStep && (
                                            <Button onClick={handleBack} disabled={isSubmitting}>
                                                {t('common.buttons.back')}
                                            </Button>
                                        )}
                                        {!isLastStep ? (
                                            <Button
                                                type="primary"
                                                onClick={handleNext}
                                                disabled={isSubmitting}
                                            >
                                                {t('common.buttons.next')}
                                            </Button>
                                        ) : (
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={isSubmitting}
                                                icon={<PlusOutlined />}
                                                onClick={() => setAllowSubmit(true)}
                                            >
                                                {t('orderManagement.form.buttons.submitCreate')}
                                            </Button>
                                        )}
                                    </Space>
                                </Flex>
                            </Form>
                        </>
                    )}
                </Spin>
            </Modal>

            {/* Quick Create Drawing Modal */}
            <QuickCreateDrawingCodeModal
                open={quickCreateState.open}
                onClose={handleQuickCreateClose}
                onCreated={handleQuickCreatedWrapper}
            />
        </>
    );
};
