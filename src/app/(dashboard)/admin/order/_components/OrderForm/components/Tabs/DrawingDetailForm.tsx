'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Form,
    FormInstance,
    InputNumber,
    Select,
    Row,
    Col,
    Space,
    Card,
    Typography,
    theme,
    Button,
    Flex,
    Tag,
    Divider,
    Progress,
    Alert,
    Modal,
} from 'antd';
import {
    AppstoreAddOutlined,
    AppstoreOutlined,
    ExportOutlined,
    FileTextOutlined,
    PlusOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { type SelectedNode } from '../../utils/treeMappers';
import {
    getDrawingStepQuantityBalanceSummary,
    getStepTaskRequestedQuantityTotal,
} from '../../utils/validators';

const { Text } = Typography;
const { useToken } = theme;
const SINGLE_PIECE_TASK_WARNING_THRESHOLD = 50;

const getDrawingStatusColor = (status?: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'success';
        case 'IN_PROGRESS':
            return 'processing';
        case 'PENDING':
            return 'warning';
        default:
            return 'default';
    }
};

interface DrawingDetailFormProps {
    drawingIndex: number;
    form: FormInstance;
    drawingTemplates: DrawingCodePickingResponse[];
    onQuickCreate: (drawingIndex: number) => void;
    setSelectedNode: (node: SelectedNode) => void;
    setExpandedKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
}

export const DrawingDetailForm: React.FC<DrawingDetailFormProps> = ({
    drawingIndex,
    form,
    drawingTemplates,
    onQuickCreate,
    setSelectedNode,
    setExpandedKeys,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    Form.useWatch('orderDrawings', form);
    const drawing = form.getFieldValue(['orderDrawings', drawingIndex]) || {};
    const drawingCodeId = drawing.drawingCodeId;
    const totalRequestedQuantity = drawing.totalRequestedQuantity || 0;
    const isSinglePiece = drawing.productionType === 'SINGLE_PIECE';
    const orderSteps = drawing.orderSteps || [];
    const stepQuantityBalance = getDrawingStepQuantityBalanceSummary(drawing);
    const firstMismatchedStepIndex = orderSteps.findIndex(
        (step: any) =>
            Number(totalRequestedQuantity) > 0 &&
            (isSinglePiece
                ? (step?.tasks || []).length !== Number(totalRequestedQuantity)
                : getStepTaskRequestedQuantityTotal(step) !== Number(totalRequestedQuantity))
    );
    const firstMismatchedStep = firstMismatchedStepIndex >= 0
        ? orderSteps[firstMismatchedStepIndex]
        : null;
    const firstMismatchedStepTotal = firstMismatchedStep
        ? getStepTaskRequestedQuantityTotal(firstMismatchedStep)
        : 0;
    const selectedTemplate = drawingTemplates.find((t) => t.drawingCodeId === drawingCodeId);
    const drawingMeta = drawing._metadata || {};
    const drawingCode = selectedTemplate?.drawingCode || drawingMeta.drawingCode;
    const drawingCodeName = selectedTemplate?.drawingCodeName || drawingMeta.drawingCodeName;
    const drawingStatus = drawingMeta.drawingStatus;
    const drawingVersionNumber = selectedTemplate?.versionNumber || drawingMeta.versionNumber;
    const drawingCustomer = selectedTemplate?.ofCustomer || drawingMeta.ofCustomer;
    const drawingCompletionTimeSeconds =
        selectedTemplate?.defaultCompletionTimeSeconds ||
        drawingMeta.defaultCompletionTimeSeconds;
    const drawingDescription = selectedTemplate?.description || drawingMeta.description;
    const drawingPdfLink = selectedTemplate?.pdfLink || drawingMeta.pdfLink;
    const drawingCompletionMinutes = drawingCompletionTimeSeconds
        ? Math.round(drawingCompletionTimeSeconds / 60)
        : null;
    const hasQuantityTarget = Number(totalRequestedQuantity) > 0;
    const isQuantityBalanced =
        hasQuantityTarget &&
        stepQuantityBalance.totalSteps > 0 &&
        stepQuantityBalance.unbalancedSteps === 0;
    const hasQuantityMismatch =
        hasQuantityTarget &&
        stepQuantityBalance.totalSteps > 0 &&
        stepQuantityBalance.unbalancedSteps > 0;
    const quantityPercent = hasQuantityTarget
        ? Math.round(
            (stepQuantityBalance.balancedSteps /
                Math.max(stepQuantityBalance.totalSteps, 1)) *
            100
        )
        : 0;
    const quantityMismatchMessage = t(
        isSinglePiece
            ? 'orderManagement.form.planValidation.singlePieceTaskCountMismatch'
            : 'orderManagement.form.planValidation.stepQuantityMismatch',
        {
            taskCount: firstMismatchedStep?.tasks?.length || 0,
            stepTotal: firstMismatchedStepTotal,
            drawingTotal: totalRequestedQuantity,
        }
    );
    const lastSyncedSinglePieceQuantityRef = React.useRef(Number(totalRequestedQuantity) || 1);
    const pendingSinglePieceWarningKeyRef = React.useRef<string | null>(null);
    const [pendingSinglePieceSync, setPendingSinglePieceSync] = React.useState<{
        targetQuantity: number;
        steps: any[];
        projectedTaskCount: number;
        onCancel?: () => void;
    } | null>(null);
    const [pendingDrawingTemplateChange, setPendingDrawingTemplateChange] = React.useState<{
        nextDrawingCodeId: string;
        template: DrawingCodePickingResponse;
        sourceDrawing: any;
    } | null>(null);

    const createSinglePieceTask = (taskOrder: number, existingTask?: any) => ({
        ...(existingTask || {}),
        taskOrder,
        taskName: existingTask?.taskName || '',
        taskRequestedQuantity: 1,
        taskPlannedQuantity:
            Number(existingTask?.taskPlannedQuantity) >= 1
                ? existingTask.taskPlannedQuantity
                : 1,
        operatorIds: existingTask?.operatorIds || [],
    });

    const createDefaultTask = () => ({
        taskOrder: 1,
        taskName: '',
        taskRequestedQuantity: 1,
        taskPlannedQuantity: 1,
        operatorIds: [],
    });

    const normalizeSinglePieceSteps = (steps: any[], targetQuantity: number) => {
        return (steps || []).map((step: any) => {
            const currentTasks = step?.tasks || [];
            const tasks = Array.from({ length: targetQuantity }, (_, index) =>
                createSinglePieceTask(index + 1, currentTasks[index])
            );

            return {
                ...step,
                tasks,
            };
        });
    };

    const buildOrderStepsFromTemplate = (
        template: DrawingCodePickingResponse,
        sourceDrawing: any
    ) => {
        const targetQuantity = Number(sourceDrawing?.totalRequestedQuantity) || 0;
        const productionType = sourceDrawing?.productionType || template.productionType || 'BATCH';

        return (template.stepTemplates || []).map((step, idx) => ({
            stepOrder: step.stepOrder || idx + 1,
            stepName: step.stepName,
            description: step.description,
            requiresQc: step.requiresQc,
            defaultCompletionTimeSeconds: step.defaultCompletionTimeSeconds,
            materialName: step.materialName,
            tasks:
                productionType === 'SINGLE_PIECE' && targetQuantity > 0
                    ? Array.from({ length: targetQuantity }, (_, index) =>
                        createSinglePieceTask(index + 1)
                    )
                    : [createDefaultTask()],
        }));
    };

    const applyDrawingTemplate = (
        template: DrawingCodePickingResponse,
        sourceDrawing: any,
        options: { selectDrawingNode?: boolean } = {}
    ) => {
        const orderSteps = buildOrderStepsFromTemplate(template, sourceDrawing);

        form.setFieldValue(['orderDrawings', drawingIndex, 'orderSteps'], orderSteps);
        form.setFieldValue(['orderDrawings', drawingIndex, '_metadata'], {
            drawingCode: template.drawingCode,
            ofCustomer: template.ofCustomer,
            versionNumber: template.versionNumber,
            drawingCodeName: template.drawingCodeName,
            description: template.description,
            pdfLink: template.pdfLink,
            defaultCompletionTimeSeconds: template.defaultCompletionTimeSeconds,
        });

        const expandKeys = orderSteps.map((_, sIdx) => `step-${drawingIndex}-${sIdx}`);
        setExpandedKeys((prev) => [
            ...new Set([...prev, `drawing-${drawingIndex}`, ...expandKeys]),
        ]);

        if (options.selectDrawingNode) {
            setSelectedNode({ key: `drawing-${drawingIndex}`, type: 'drawing' });
        }
    };

    const applySelectedDrawingTemplate = (
        template: DrawingCodePickingResponse,
        nextDrawingCodeId: string,
        sourceDrawing: any,
        options: { selectDrawingNode?: boolean } = {}
    ) => {
        const productionType =
            template.productionType ||
            sourceDrawing?.productionType ||
            'BATCH';

        form.setFieldValue(['orderDrawings', drawingIndex, 'drawingCodeId'], nextDrawingCodeId);
        form.setFieldValue(['orderDrawings', drawingIndex, 'productionType'], productionType);
        pendingSinglePieceWarningKeyRef.current = null;
        setPendingSinglePieceSync(null);
        applyDrawingTemplate(
            template,
            {
                ...sourceDrawing,
                drawingCodeId: nextDrawingCodeId,
                productionType,
            },
            options
        );
    };

    const applySinglePieceTaskSync = (targetQuantity: number, steps: any[]) => {
        form.setFieldValue(
            ['orderDrawings', drawingIndex, 'orderSteps'],
            normalizeSinglePieceSteps(steps, targetQuantity)
        );
        lastSyncedSinglePieceQuantityRef.current = targetQuantity;
        pendingSinglePieceWarningKeyRef.current = null;
    };

    const syncSinglePieceTasks = (
        targetQuantity = Number(totalRequestedQuantity),
        options: { onCancel?: () => void } = {}
    ) => {
        const currentDrawing = form.getFieldValue(['orderDrawings', drawingIndex]) || {};
        const currentSteps = currentDrawing.orderSteps || [];

        if (targetQuantity <= 0 || currentSteps.length === 0) return;

        const projectedTaskCount = targetQuantity * currentSteps.length;
        if (projectedTaskCount > SINGLE_PIECE_TASK_WARNING_THRESHOLD) {
            const warningKey = `${drawingIndex}-${targetQuantity}-${currentSteps.length}`;
            if (pendingSinglePieceWarningKeyRef.current === warningKey) return;

            pendingSinglePieceWarningKeyRef.current = warningKey;
            setPendingSinglePieceSync({
                targetQuantity,
                steps: currentSteps,
                projectedTaskCount,
                onCancel: options.onCancel,
            });
            return;
        }

        applySinglePieceTaskSync(targetQuantity, currentSteps);
    };

    // Auto-populate steps from template when drawing selected
    useEffect(() => {
        const drawing = form.getFieldValue(['orderDrawings', drawingIndex]);
        const currentSteps = drawing?.orderSteps;

        if (drawingCodeId && (!currentSteps || currentSteps.length === 0)) {
            const template = drawingTemplates.find((t) => t.drawingCodeId === drawingCodeId);

            if (template?.stepTemplates && template.stepTemplates.length > 0) {
                applyDrawingTemplate(template, drawing);
            }
        }
    }, [drawingCodeId, drawingTemplates, form, drawingIndex, setExpandedKeys, drawing.productionType, drawing.totalRequestedQuantity]);

    useEffect(() => {
        const targetQuantity = Number(totalRequestedQuantity);
        if (!isSinglePiece || targetQuantity <= 0 || orderSteps.length === 0) return;

        const normalizedSteps = normalizeSinglePieceSteps(orderSteps, targetQuantity);
        const isAlreadySynced = orderSteps.every((step: any, stepIndex: number) => {
            const normalizedTasks = normalizedSteps[stepIndex]?.tasks || [];
            const currentTasks = step?.tasks || [];

            return (
                currentTasks.length === normalizedTasks.length &&
                currentTasks.every(
                    (task: any, taskIndex: number) =>
                        task.taskOrder === normalizedTasks[taskIndex].taskOrder &&
                        task.taskRequestedQuantity === 1 &&
                        (Number(task.taskPlannedQuantity) || 0) >= 1
                )
            );
        });

        if (!isAlreadySynced) {
            form.setFieldValue(
                ['orderDrawings', drawingIndex, 'orderSteps'],
                normalizedSteps
            );
        }
    }, [drawingIndex, form, isSinglePiece, orderSteps, totalRequestedQuantity]);

    const handleAddStep = () => {
        const drawing = form.getFieldValue(['orderDrawings', drawingIndex]);

        const newStep = {
            stepOrder: (drawing.orderSteps?.length || 0) + 1,
            stepName: '',
            description: '',
            requiresQc: false,
            materialName: '',
            defaultCompletionTimeSeconds: 0,
            tasks:
                drawing.productionType === 'SINGLE_PIECE' &&
                    Number(drawing.totalRequestedQuantity) > 0
                    ? normalizeSinglePieceSteps(
                        [{ tasks: [] }],
                        Number(drawing.totalRequestedQuantity)
                    )[0].tasks
                    : [
                        {
                            taskOrder: 1,
                            taskName: '',
                            taskRequestedQuantity: 1,
                            taskPlannedQuantity: 1,
                            operatorIds: [],
                        },
                    ],
        };

        const updatedSteps = [...(drawing.orderSteps || []), newStep];
        form.setFieldValue(['orderDrawings', drawingIndex, 'orderSteps'], updatedSteps);

        // Auto-expand and select new step
        const newStepIndex = drawing.orderSteps?.length || 0;
        setExpandedKeys((prev) => [
            ...new Set([...prev, `drawing-${drawingIndex}`, `step-${drawingIndex}-${newStepIndex}`]),
        ]);
        setSelectedNode({ key: `step-${drawingIndex}-${newStepIndex}`, type: 'step' });
    };

    const totalTasks = orderSteps.reduce((sum: number, step: any) => sum + (step.tasks?.length || 0), 0);

    return (
        <>
            <Modal
                open={!!pendingSinglePieceSync}
                title={t('orderManagement.form.planValidation.singlePieceLargeTaskWarningTitle')}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                onOk={() => {
                    if (!pendingSinglePieceSync) return;
                    applySinglePieceTaskSync(
                        pendingSinglePieceSync.targetQuantity,
                        pendingSinglePieceSync.steps
                    );
                    setPendingSinglePieceSync(null);
                }}
                onCancel={() => {
                    pendingSinglePieceWarningKeyRef.current = null;
                    pendingSinglePieceSync?.onCancel?.();
                    setPendingSinglePieceSync(null);
                }}
            >
                {pendingSinglePieceSync && (
                    <Text>
                        {t(
                            'orderManagement.form.planValidation.singlePieceLargeTaskWarningContent',
                            {
                                taskCount: pendingSinglePieceSync.projectedTaskCount,
                                threshold: SINGLE_PIECE_TASK_WARNING_THRESHOLD,
                                quantity: pendingSinglePieceSync.targetQuantity,
                                steps: pendingSinglePieceSync.steps.length,
                            }
                        )}
                    </Text>
                )}
            </Modal>

            <Modal
                open={!!pendingDrawingTemplateChange}
                title={t('orderManagement.form.planValidation.changeDrawingWarningTitle')}
                okText={t('common.confirm')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true }}
                onOk={() => {
                    if (!pendingDrawingTemplateChange) return;
                    applySelectedDrawingTemplate(
                        pendingDrawingTemplateChange.template,
                        pendingDrawingTemplateChange.nextDrawingCodeId,
                        pendingDrawingTemplateChange.sourceDrawing,
                        { selectDrawingNode: true }
                    );
                    setPendingDrawingTemplateChange(null);
                }}
                onCancel={() => {
                    setPendingDrawingTemplateChange(null);
                }}
            >
                <Text>
                    {t('orderManagement.form.planValidation.changeDrawingWarningContent')}
                </Text>
            </Modal>

            <Card
                title={
                    <Flex align="center" gap={8}>
                        <FileTextOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
                        <Text strong>{t('orderManagement.form.plan.drawingDetails')}</Text>
                    </Flex>
                }
                bordered={false}
            >
                <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    <Row gutter={[16, 12]} align="top">
                        <Col xs={24} lg={13}>
                            <Form.Item
                                name={['orderDrawings', drawingIndex, 'drawingCodeId']}
                                label={
                                    <Flex align="center" gap={8} style={{ whiteSpace: 'nowrap' }}>
                                        <Text strong>{t('orderManagement.form.plan.drawingCodeRequired')}</Text>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<AppstoreAddOutlined />}
                                            onClick={() => onQuickCreate(drawingIndex)}
                                            style={{ height: 22, paddingInline: 4 }}
                                        >
                                            {t('common.create')}
                                        </Button>
                                    </Flex>
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: t(
                                            'orderManagement.form.planValidation.selectDrawingCode'
                                        ),
                                    },
                                ]}
                            >
                                <Select
                                    size="large"
                                    placeholder={t('orderManagement.form.plan.selectDrawingCode')}
                                    showSearch
                                    onChange={(value) => {
                                        const template = drawingTemplates.find(
                                            (item) => item.drawingCodeId === value
                                        );
                                        if (template) {
                                            const previousDrawingCodeId = drawingCodeId;
                                            const currentDrawing =
                                                form.getFieldValue(['orderDrawings', drawingIndex]) || {};
                                            const hasExistingPlan =
                                                (currentDrawing.orderSteps || []).length > 0;

                                            if (
                                                previousDrawingCodeId &&
                                                previousDrawingCodeId !== value &&
                                                hasExistingPlan
                                            ) {
                                                form.setFieldValue(
                                                    ['orderDrawings', drawingIndex, 'drawingCodeId'],
                                                    previousDrawingCodeId
                                                );
                                                setPendingDrawingTemplateChange({
                                                    nextDrawingCodeId: value,
                                                    template,
                                                    sourceDrawing: currentDrawing,
                                                });
                                                return;
                                            }

                                            applySelectedDrawingTemplate(
                                                template,
                                                value,
                                                {
                                                    ...currentDrawing,
                                                    drawingCodeId: value,
                                                },
                                                { selectDrawingNode: true }
                                            );
                                        }
                                    }}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={drawingTemplates.map((t) => ({
                                        value: t.drawingCodeId,
                                        label: `${t.drawingCode} - ${t.drawingCodeName}`,
                                    }))}
                                    optionRender={(option) => {
                                        const template = drawingTemplates.find(
                                            (item) => item.drawingCodeId === option.value
                                        );

                                        return (
                                            <Space direction="vertical" size={2}>
                                                <Text strong>{template?.drawingCode}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {template?.drawingCodeName}
                                                </Text>
                                            </Space>
                                        );
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={12} lg={5}>
                            <Form.Item
                                name={['orderDrawings', drawingIndex, 'totalRequestedQuantity']}
                                label={
                                    <Text strong style={{ whiteSpace: 'nowrap' }}>
                                        {t('orderManagement.form.plan.totalRequestedQuantityRequired')}
                                    </Text>
                                }
                                rules={[
                                    {
                                        required: true,
                                        message: t(
                                            'orderManagement.form.planValidation.totalRequestedQuantityRequired'
                                        ),
                                    },
                                    {
                                        type: 'number',
                                        min: 1,
                                        message: t('orderManagement.form.planValidation.minOne'),
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={2147483647}
                                    onChange={(value) => {
                                        if (isSinglePiece) {
                                            syncSinglePieceTasks(Number(value) || 0, {
                                                onCancel: () => {
                                                    form.setFieldValue(
                                                        [
                                                            'orderDrawings',
                                                            drawingIndex,
                                                            'totalRequestedQuantity',
                                                        ],
                                                        lastSyncedSinglePieceQuantityRef.current
                                                    );
                                                },
                                            });
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (['-', '+', '.', 'e', 'E'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    style={{ width: '100%' }}
                                    size="large"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={12} lg={6}>
                            <Form.Item
                                name={['orderDrawings', drawingIndex, 'productionType']}
                                label={<Text strong>{t('orderManagement.form.fields.productionType')}</Text>}
                                initialValue="BATCH"
                            >
                                <Select
                                    size="large"
                                    onChange={(value) => {
                                        if (value === 'SINGLE_PIECE') {
                                            syncSinglePieceTasks(undefined, {
                                                onCancel: () => {
                                                    form.setFieldValue(
                                                        ['orderDrawings', drawingIndex, 'productionType'],
                                                        'BATCH'
                                                    );
                                                },
                                            });
                                        }
                                    }}
                                    options={[
                                        {
                                            value: 'BATCH',
                                            label: (
                                                <>
                                                    <AppstoreOutlined />{' '}
                                                    {t('orderManagement.list.table.batch')}
                                                </>
                                            ),
                                        },
                                        {
                                            value: 'SINGLE_PIECE',
                                            label: (
                                                <>
                                                    <ToolOutlined />{' '}
                                                    {t('orderManagement.list.table.single')}
                                                </>
                                            ),
                                        },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {(selectedTemplate || drawingMeta.drawingCode) && (
                        <div
                            style={{
                                position: 'relative',
                                overflow: 'hidden',
                                padding: '18px 20px',
                                borderRadius: 8,
                                background: token.colorFillAlter,
                                border: `1px solid ${token.colorBorderSecondary}`,
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: 4,
                                    height: '100%',
                                    background: token.colorPrimary,
                                }}
                            />
                            <Flex
                                justify="space-between"
                                align="flex-start"
                                gap={12}
                                wrap="wrap"
                                style={{ marginBottom: 16 }}
                            >
                                <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 220 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {t('orderManagement.form.plan.drawingDetails')}
                                    </Text>
                                    <Flex gap={18} wrap="wrap">
                                        <Flex vertical gap={3} style={{ minWidth: 160 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {t('orderManagement.drawing.code')}
                                            </Text>
                                            <Flex align="center" gap={8} wrap="wrap">
                                                <FileTextOutlined style={{ color: token.colorPrimary }} />
                                                <Text strong style={{ fontSize: 16 }}>
                                                    {drawingCode || '-'}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                        <Flex vertical gap={3} style={{ minWidth: 220 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {t('orderManagement.drawing.name')}
                                            </Text>
                                            <Text strong style={{ color: token.colorText }}>
                                                {drawingCodeName || '-'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Space>
                                {drawingStatus && (
                                    <Tag
                                        color={getDrawingStatusColor(drawingStatus)}
                                        style={{ marginInlineEnd: 0 }}
                                    >
                                        {drawingStatus}
                                    </Tag>
                                )}
                            </Flex>

                            <Row gutter={[12, 12]}>
                                <Col xs={24} md={12}>
                                    <Flex vertical gap={3}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {t('orderManagement.drawing.ofCustomer')}
                                        </Text>
                                        <Text>{drawingCustomer || '-'}</Text>
                                    </Flex>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Flex vertical gap={3}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {t('orderManagement.drawing.version')}
                                        </Text>
                                        <Text>{drawingVersionNumber ? `v${drawingVersionNumber}` : '-'}</Text>
                                    </Flex>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Flex vertical gap={3}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {t('orderManagement.drawing.totalExpectedTime')}
                                        </Text>
                                        <Text>
                                            {drawingCompletionMinutes
                                                ? `${drawingCompletionMinutes} ${t('common.minutes')}`
                                                : '-'}
                                        </Text>
                                    </Flex>
                                </Col>
                            </Row>

                            {(drawingDescription || drawingPdfLink) ? (
                                <div
                                    style={{
                                        marginTop: 16,
                                        paddingTop: 14,
                                        borderTop: `1px solid ${token.colorSplit}`,
                                    }}
                                >
                                    {drawingDescription && (
                                        <Space
                                            direction="vertical"
                                            size={4}
                                            style={{ display: 'flex', marginBottom: drawingPdfLink ? 10 : 0 }}
                                        >
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {t('orderManagement.drawing.description')}
                                            </Text>
                                            <Text>{drawingDescription}</Text>
                                        </Space>
                                    )}
                                    {drawingPdfLink && (
                                        <Flex vertical gap={6}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {t('orderManagement.drawing.pdfLink')}
                                            </Text>
                                            <Button
                                                href={drawingPdfLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="small"
                                                icon={<ExportOutlined />}
                                                style={{ alignSelf: 'flex-start' }}
                                            >
                                                {t('orderManagement.drawing.viewPdfDocument')}
                                            </Button>
                                        </Flex>
                                    )}
                                </div>
                            ) : (
                                null
                            )}
                        </div>
                    )}

                    <Divider style={{ margin: '2px 0' }} />

                    {/* Steps Summary */}
                    <div>
                        <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                            <Text strong style={{ fontSize: 13 }}>
                                {t('orderManagement.form.plan.drawingWorkload')}
                            </Text>
                            <Space size={8} wrap>
                                <Tag color="purple">
                                    {t('orderManagement.form.plan.stepsCount', {
                                        count: orderSteps.length,
                                    })}
                                </Tag>
                                <Tag color="green">
                                    {t('orderManagement.form.plan.tasksCount', { count: totalTasks })}
                                </Tag>
                                <Tag color={isQuantityBalanced ? 'success' : 'warning'}>
                                    {t('orderManagement.form.plan.stepBalanceCount', {
                                        balanced: stepQuantityBalance.balancedSteps,
                                        total: stepQuantityBalance.totalSteps,
                                    })}
                                </Tag>
                            </Space>
                        </Flex>
                        <Progress
                            percent={quantityPercent}
                            status={isQuantityBalanced ? 'success' : hasQuantityMismatch ? 'exception' : 'active'}
                            showInfo={false}
                            style={{ marginTop: 10 }}
                        />
                        {hasQuantityMismatch && (
                            <Alert
                                type="warning"
                                showIcon
                                message={quantityMismatchMessage}
                                description={t(
                                    'orderManagement.form.plan.stepQuantityBalanceDescription'
                                )}
                                style={{ marginTop: 12 }}
                            />
                        )}
                    </div>

                    <Divider />

                    {/* Quick Actions */}
                    <Flex
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        gap={12}
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background: token.colorBgLayout,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        <Text strong>{t('orderManagement.form.plan.quickActions')}</Text>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStep}>
                            {t('orderManagement.form.plan.addStepToDrawing')}
                        </Button>
                    </Flex>
                </Space>
            </Card>
        </>
    );
};
