'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Form,
    FormInstance,
    Button,
    Space,
    Typography,
    Select,
    Tag,
    Input,
    InputNumber,
    Timeline,
    Flex,
    Collapse,
    Divider,
    theme,
    Row,
    Col,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
    PlusOutlined,
    DeleteOutlined,
    HolderOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
    NodeIndexOutlined,
    AppstoreAddOutlined,
    AppstoreOutlined,
    ToolOutlined,
    DownOutlined,
    RightOutlined,
} from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { OrderStepList } from './OrderStepList';

const { Text } = Typography;

const StepItem: React.FC<{ step: any; t: any; token: any }> = ({ step, t, token }) => (
    <Flex justify="space-between" align="center" style={{ width: '100%', padding: '8px 12px', background: token.colorBgContainer, borderRadius: 8, border: `1px solid ${token.colorBorderSecondary}` }}>
        <Space size={12} style={{ flex: 1 }}>
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: token.colorBgLayout,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${token.colorBorder}`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: token.colorTextSecondary,
                }}
            >
                {step.stepOrder}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text strong style={{ fontSize: 14, color: token.colorText }}>
                    {step.stepName}
                </Text>
                {step.description && (
                    <Text type="secondary" style={{ fontSize: 11, maxWidth: 300 }} ellipsis>
                        {step.description}
                    </Text>
                )}
            </div>
        </Space>

        <Flex align="center" gap={8}>
            {step.defaultCompletionTimeSeconds && (
                <Tag
                    icon={<ClockCircleOutlined />}
                    style={{
                        margin: 0,
                        border: 'none',
                        background: token.colorBgLayout,
                        color: token.colorTextSecondary,
                        borderRadius: 4,
                        padding: '1px 8px',
                        fontSize: 11,
                    }}
                >
                    {Math.round(step.defaultCompletionTimeSeconds / 60)}{' '}
                    {t('orderManagement.detail.overview.minutes')}
                </Tag>
            )}
            {step.requiresQc && (
                <Tag
                    color="orange"
                    icon={<SafetyCertificateOutlined />}
                    style={{
                        margin: 0,
                        border: 'none',
                        borderRadius: 4,
                        padding: '1px 8px',
                        fontSize: 11,
                    }}
                >
                    QC
                </Tag>
            )}
        </Flex>
    </Flex>
);

const TaskItem: React.FC<{ task: any; t: any; token: any; getStatusColor: (s: string) => string }> = ({ task, t, token, getStatusColor }) => (
    <Flex justify="space-between" align="center" style={{ width: '100%', padding: '4px 0' }}>
        <Space size={12} style={{ flex: 1 }}>
            <Text
                style={{
                    minWidth: 28,
                    color: token.colorTextSecondary,
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'inline-block',
                }}
            >
                #{task.stepOrder}
            </Text>
            <Text strong style={{ fontSize: 14, color: token.colorText }}>
                {task.stepName}
            </Text>
        </Space>

        <Flex align="center" gap={16}>
            {task.taskQuantity > 0 && (
                <Flex align="center" gap={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('orderManagement.list.table.quantity')}:
                    </Text>
                    <Text strong style={{ fontSize: 13, color: token.colorText }}>
                        {task.taskQuantity}
                    </Text>
                </Flex>
            )}
            <Tag
                color={getStatusColor(task.taskStatus)}
                style={{
                    margin: 0,
                    borderRadius: 6,
                    minWidth: 100,
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: 12,
                    padding: '2px 12px',
                    border: 'none',
                }}
            >
                {task.taskStatus === 'LOCKED'
                    ? t('orderManagement.detail.kanban.locked')
                    : task.taskStatus === 'TO_DO'
                        ? t('orderManagement.detail.kanban.todo')
                        : task.taskStatus === 'IN_PROGRESS'
                            ? t('orderManagement.detail.kanban.inProgress')
                            : task.taskStatus === 'PAUSED'
                                ? t('orderManagement.detail.kanban.paused')
                                : task.taskStatus === 'QC_CHECK'
                                    ? t('orderManagement.detail.kanban.qcCheck')
                                    : t('orderManagement.detail.kanban.complete')}
            </Tag>
        </Flex>
    </Flex>
);

interface OrderDrawingListProps {
    form: FormInstance;
    templates: DrawingCodePickingResponse[];
    productionType?: string;
    onQuickCreate: (drawingIndex: number) => void;
    operators: any[];
    isLoadingOperators: boolean;
}

// Component cho từng item có thể drag
interface SortableDrawingItemProps {
    id: string;
    index: number;
    name: number;
    field: any;
    templates: DrawingCodePickingResponse[];
    productionType: string;
    onRemove: () => void;
    onQuickCreate: () => void;
    operators: any[];
    isLoadingOperators: boolean;
    hasError: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}

export const ProductionTasksDisplay: React.FC<{
    drawingCodeId?: string;
    productionTasks?: any[];
    templates: DrawingCodePickingResponse[];
}> = ({ drawingCodeId, productionTasks, templates }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'LOCKED':
                return <LockOutlined style={{ color: token.colorTextQuaternary }} />;
            case 'TO_DO':
                return (
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: token.colorPrimary,
                        }}
                    />
                );
            case 'IN_PROGRESS':
                return <PlayCircleOutlined style={{ color: token.colorPrimary }} />;
            case 'PAUSED':
                return <PauseCircleOutlined style={{ color: token.colorError }} />;
            case 'QC_CHECK':
                return <SafetyCertificateOutlined style={{ color: token.colorWarning }} />;
            case 'COMPLETE':
                return <CheckCircleOutlined style={{ color: token.colorSuccess }} />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'LOCKED':
                return 'default';
            case 'TO_DO':
                return 'blue';
            case 'IN_PROGRESS':
                return 'processing';
            case 'PAUSED':
                return 'error';
            case 'QC_CHECK':
                return 'warning';
            case 'COMPLETE':
                return 'success';
            default:
                return 'default';
        }
    };


    if (productionTasks && productionTasks.length > 0) {
        return (
            <div
                style={{
                    marginTop: 12,
                    padding: '20px',
                    background: token.colorBgLayout,
                    borderRadius: 8,
                    border: `1px solid ${token.colorBorder}`,
                }}
            >
                <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
                    <NodeIndexOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                    <Text
                        strong
                        style={{
                            fontSize: 13,
                            color: token.colorTextSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {t('orderManagement.drawing.productionProgress')}
                    </Text>
                </Flex>
                <Timeline
                    mode="left"
                    style={{ marginLeft: 0 }}
                    items={productionTasks.map((task) => ({
                        dot: getStatusIcon(task.taskStatus),
                        children: <TaskItem task={task} t={t} token={token} getStatusColor={getStatusColor} />,
                        style: { paddingBottom: 12 },
                    }))}
                />
            </div>
        );
    }

    // Nếu chỉ có template (chế độ Create hoặc chưa có tasks)
    if (drawingCodeId) {
        const template = templates.find((t) => t.drawingCodeId === drawingCodeId);
        if (template && template.stepTemplates && template.stepTemplates.length > 0) {
            return (
                <div
                    style={{
                        marginTop: 12,
                        padding: '20px',
                        background: token.colorBgLayout,
                        borderRadius: 8,
                        border: `1px dashed ${token.colorBorder}`,
                    }}
                >
                    <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
                        <NodeIndexOutlined
                            style={{ color: token.colorTextSecondary, fontSize: 16 }}
                        />
                        <Text
                            strong
                            style={{
                                fontSize: 13,
                                color: token.colorTextSecondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {t('orderManagement.drawing.expectedSteps')}
                        </Text>
                    </Flex>
                    <Timeline
                        mode="left"
                        style={{ marginLeft: 0 }}
                        items={template.stepTemplates.map((step) => ({
                            children: <StepItem step={step} t={t} token={token} />,
                            style: { paddingBottom: 12 },
                        }))}
                    />
                </div>
            );
        }
    }

    return null;
};

const SortableDrawingItem: React.FC<SortableDrawingItemProps> = ({
    id,
    index,
    name,
    field,
    templates,
    onRemove,
    onQuickCreate,
    operators,
    isLoadingOperators,
    hasError,
    isExpanded,
    onToggle,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const form = Form.useFormInstance();
    const { key, ...restField } = field;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id,
    });

    const drawingCodeId = Form.useWatch(['orderDrawings', name, 'drawingCodeId'], form);
    const productionTasks = Form.useWatch(['orderDrawings', name, 'productionTasks'], form);

    useEffect(() => {
        const currentOrderSteps = form.getFieldValue(['orderDrawings', name, 'orderSteps']);
        if (drawingCodeId && (!currentOrderSteps || currentOrderSteps.length === 0)) {
            const template = templates.find((t) => t.drawingCodeId === drawingCodeId);
            if (template && template.stepTemplates && template.stepTemplates.length > 0) {
                const orderSteps = template.stepTemplates.map((step, idx) => ({
                    stepOrder: step.stepOrder || idx + 1,
                    stepName: step.stepName,
                    description: step.description,
                    requiresQc: step.requiresQc,
                    defaultCompletionTimeSeconds: step.defaultCompletionTimeSeconds,
                    materialName: step.materialName,
                    tasks: [
                        {
                            taskOrder: 1,
                            taskRequestedQuantity: 1,
                            taskPlannedQuantity: 1,
                        },
                    ],
                }));
                form.setFieldValue(['orderDrawings', name, 'orderSteps'], orderSteps);
            }
        }
    }, [drawingCodeId, templates, form, name]);

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const selectedTemplate = templates.find((t) => t.drawingCodeId === drawingCodeId);

    return (
        <div ref={setNodeRef} style={style}>
            <div
                style={{
                    marginBottom: 24,
                    background: isDragging ? token.colorBgTextHover : token.colorBgLayout,
                    borderRadius: 12,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: hasError ? `2px solid ${token.colorError}` : 'none',
                }}
            >

                {/* Hidden Fields */}
                <Form.Item {...restField} name={[name, 'orderDrawingId']} noStyle>
                    <Input type="hidden" />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'productionTasks']} noStyle>
                    <Input type="hidden" />
                </Form.Item>

                {/* Collapsed Header */}
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={8}
                    style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        background: token.colorBgContainer,
                        borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
                        borderTop: isExpanded ? 'none' : `3px solid ${token.colorPrimary}`,
                    }}
                    onClick={onToggle}
                >
                    <Space size={12} wrap style={{ flex: 1, minWidth: 0 }}>
                        <div
                            {...attributes}
                            {...listeners}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                cursor: 'grab',
                                padding: '4px 8px',
                                color: token.colorTextTertiary,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <HolderOutlined style={{ fontSize: 18 }} />
                        </div>

                        {isExpanded ? (
                            <Space size={4} style={{ color: token.colorTextTertiary }}>
                                <DownOutlined style={{ fontSize: 14 }} />
                            </Space>
                        ) : (
                            <Space size={4} style={{ color: token.colorPrimary }}>
                                <RightOutlined style={{ fontSize: 14 }} />
                                <Text style={{ fontSize: 13, color: token.colorPrimary, fontWeight: 500 }}>
                                    {t('orderManagement.drawing.clickToExpand', { defaultValue: 'Nhấn để mở' })}
                                </Text>
                            </Space>
                        )}

                        <Tag
                            color={token.colorPrimary}
                            style={{
                                fontWeight: 700,
                                fontSize: 14,
                                minWidth: 48,
                                padding: '4px 10px',
                                borderRadius: 6,
                                margin: 0,
                                textAlign: 'center',
                                border: `1px solid ${token.colorPrimary}`,
                            }}
                        >
                            {(index + 1)}.0
                        </Tag>

                        <div style={{ maxWidth: '400px', overflow: 'hidden' }}>
                            <Text strong style={{ fontSize: 16 }}>
                                {selectedTemplate ? (
                                    <>
                                        {selectedTemplate.drawingCode}
                                        <Text type="secondary" style={{ fontSize: 13, marginLeft: 8 }} ellipsis>
                                            {selectedTemplate.drawingCodeName}
                                        </Text>
                                    </>
                                ) : (
                                    <Text type="secondary">{t('orderManagement.drawing.selectPlaceholder')}</Text>
                                )}
                            </Text>
                        </div>

                        {hasError && !isExpanded && (
                            <Tag color="error" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                                {t('orderManagement.drawing.errorTag', { defaultValue: 'Error' })}
                            </Tag>
                        )}

                        {!isExpanded && selectedTemplate && (
                            <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) => {
                                    const prevDrawing = prev?.orderDrawings?.[name];
                                    const currDrawing = curr?.orderDrawings?.[name];
                                    return (
                                        prevDrawing?.productionType !== currDrawing?.productionType ||
                                        prevDrawing?.orderSteps?.length !== currDrawing?.orderSteps?.length
                                    );
                                }}
                            >
                                {({ getFieldValue }) => {
                                    const productionType = getFieldValue(['orderDrawings', name, 'productionType']);
                                    const orderSteps = getFieldValue(['orderDrawings', name, 'orderSteps']) || [];

                                    return (
                                        <Space size={8}>
                                            {productionType && (
                                                <Tag bordered={false} color="blue" style={{ fontSize: 11 }}>
                                                    {productionType === 'BATCH' ? t('orderManagement.list.table.batch') : t('orderManagement.list.table.single')}
                                                </Tag>
                                            )}
                                            {orderSteps && orderSteps.length > 0 && (
                                                <Tag bordered={false} style={{ fontSize: 11 }}>
                                                    {orderSteps.length} {t('orderManagement.drawing.expectedSteps')}
                                                </Tag>
                                            )}
                                        </Space>
                                    );
                                }}
                            </Form.Item>
                        )}
                    </Space>

                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                    >
                        {t('orderManagement.step.delete')}
                    </Button>
                </Flex>

                {/* Expanded Content */}
                <div style={{
                    padding: 'clamp(16px, 3vw, 24px)',
                    background: token.colorBgContainer,
                    borderRadius: '0 0 12px 12px',
                    display: isExpanded ? 'block' : 'none'
                }}>
                    <Space direction="vertical" size={20} style={{ width: '100%' }}>
                        <>
                            {/* Drawing Code Selection */}
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'drawingCodeId']}
                                        label={
                                            <Flex align="center" gap={8}>
                                                <Text strong style={{ fontSize: 13 }}>{t('orderManagement.drawing.selectTitle')}</Text>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<AppstoreAddOutlined style={{ fontSize: 14 }} />}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        onQuickCreate();
                                                    }}
                                                    style={{
                                                        padding: '0 4px',
                                                        height: 'auto',
                                                        color: token.colorPrimary,
                                                    }}
                                                >
                                                    {t('orderManagement.drawing.createNew')}
                                                </Button>
                                            </Flex>
                                        }
                                        rules={[
                                            {
                                                required: true,
                                                message: t('orderManagement.drawing.selectError'),
                                            },
                                        ]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            placeholder={t('orderManagement.drawing.selectPlaceholder')}
                                            showSearch
                                            size="large"
                                            optionFilterProp="label"
                                            optionRender={(option) => {
                                                const template = templates.find(
                                                    (t) => t.drawingCodeId === option.value
                                                );
                                                return (
                                                    <Space direction="vertical" size={4}>
                                                        <Text strong>{template?.drawingCode}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {template?.drawingCodeName}
                                                        </Text>
                                                        <Flex gap={6}>
                                                            <Tag color="blue" style={{ fontSize: 11 }}>
                                                                {template?.stepTemplates?.length || 0} {t('orderManagement.drawing.expectedSteps')}
                                                            </Tag>
                                                        </Flex>
                                                    </Space>
                                                );
                                            }}
                                            options={templates.map((t) => ({
                                                value: t.drawingCodeId,
                                                label: `${t.drawingCode} - ${t.drawingCodeName}`,
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={6}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'totalRequestedQuantity']}
                                        label={<Text strong style={{ fontSize: 13 }}>Total Requested Quantity</Text>}
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please enter total requested quantity',
                                            },
                                            {
                                                type: 'number',
                                                min: 1,
                                                message: 'Must be at least 1',
                                            },
                                        ]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <InputNumber
                                            min={1}
                                            max={2147483647}
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

                                <Col xs={24} md={6}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'productionType']}
                                        label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.drawing.prodTypeLabel')}</Text>}
                                        initialValue="BATCH"
                                        rules={[{ required: true }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            size="large"
                                            options={[
                                                { value: 'BATCH', label: <span><AppstoreOutlined /> {t('orderManagement.list.table.batch')}</span> },
                                                { value: 'SINGLE_PIECE', label: <span><ToolOutlined /> {t('orderManagement.list.table.single')}</span> },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* Drawing Info Display */}
                            {(drawingCodeId) && (
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prev, curr) => {
                                        const prevDrawing = prev?.orderDrawings?.[name];
                                        const currDrawing = curr?.orderDrawings?.[name];

                                        // Update if drawing ID changes or if any step's time changes
                                        if (prevDrawing?.drawingCodeId !== currDrawing?.drawingCodeId) return true;

                                        const prevSteps = prevDrawing?.orderSteps || [];
                                        const currSteps = currDrawing?.orderSteps || [];
                                        if (prevSteps.length !== currSteps.length) return true;

                                        return currSteps.some((step: any, i: number) =>
                                            step?.defaultCompletionTimeSeconds !== prevSteps[i]?.defaultCompletionTimeSeconds
                                        );
                                    }}
                                >
                                    {({ getFieldValue }) => {
                                        const itemData = getFieldValue(['orderDrawings', name]) || {};
                                        const orderStepsData = itemData.orderSteps || [];
                                        const totalTimeSeconds = orderStepsData.reduce((total: number, step: any) => total + (Number(step?.defaultCompletionTimeSeconds) || 0), 0);

                                        const drawingInfo = {
                                            ofCustomer: itemData.ofCustomer || selectedTemplate?.ofCustomer,
                                            versionNumber: itemData.versionNumber || selectedTemplate?.versionNumber,
                                            description: itemData.description || selectedTemplate?.description,
                                            pdfLink: itemData.pdfLink || selectedTemplate?.pdfLink,
                                            defaultCompletionTimeSeconds: itemData.defaultCompletionTimeSeconds || selectedTemplate?.defaultCompletionTimeSeconds,
                                        };

                                        const displayedTimeSeconds = orderStepsData.length > 0 ? totalTimeSeconds : (drawingInfo.defaultCompletionTimeSeconds || 0);

                                        const formatDuration = (totalSeconds: number) => {
                                            const h = Math.floor(totalSeconds / 3600);
                                            const m = Math.floor((totalSeconds % 3600) / 60);
                                            const s = totalSeconds % 60;
                                            const parts = [];
                                            if (h > 0) parts.push(`${h}h`);
                                            if (m > 0) parts.push(`${m}m`);
                                            if (s > 0 || parts.length === 0) parts.push(`${s}s`);
                                            return parts.join(' ');
                                        };

                                        return (
                                            <div style={{
                                                marginTop: 16,
                                                padding: '12px 16px',
                                                background: token.colorFillAlter,
                                                borderRadius: 8,
                                                border: `1px solid ${token.colorBorderSecondary}`
                                            }}>
                                                <Row gutter={[16, 16]}>
                                                    <Col xs={24} sm={12} md={8}>
                                                        <Space direction="vertical" size={2}>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{t('orderManagement.drawing.ofCustomer', { defaultValue: 'Of Customer' })}</Text>
                                                            <Text strong>{drawingInfo.ofCustomer || 'N/A'}</Text>
                                                        </Space>
                                                    </Col>
                                                    <Col xs={24} sm={12} md={8}>
                                                        <Space direction="vertical" size={2}>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{t('orderManagement.drawing.version', { defaultValue: 'Version' })}</Text>
                                                            <Text strong>{drawingInfo.versionNumber || 'N/A'}</Text>
                                                        </Space>
                                                    </Col>
                                                    <Col xs={24} sm={12} md={8}>
                                                        <Space direction="vertical" size={2}>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{t('orderManagement.drawing.totalExpectedTime', { defaultValue: 'Total Expected Time' })}</Text>
                                                            <Text strong style={{ color: token.colorPrimary }}>
                                                                {formatDuration(displayedTimeSeconds)}
                                                            </Text>
                                                        </Space>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{t('orderManagement.drawing.description', { defaultValue: 'Description' })}</Text>
                                                            <Text>{drawingInfo.description || <Text type="secondary" italic>{t('orderManagement.drawing.noDescription', { defaultValue: 'No description provided' })}</Text>}</Text>
                                                        </Space>
                                                    </Col>
                                                    {drawingInfo.pdfLink && (
                                                        <Col span={24}>
                                                            <Space direction="vertical" size={2}>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>{t('orderManagement.drawing.document', { defaultValue: 'Drawing Document' })}</Text>
                                                                <Button
                                                                    type="link"
                                                                    href={drawingInfo.pdfLink}
                                                                    target="_blank"
                                                                    style={{ padding: 0 }}
                                                                >
                                                                    {t('orderManagement.drawing.viewDocument', { defaultValue: 'View Document' })}
                                                                </Button>
                                                            </Space>
                                                        </Col>
                                                    )}
                                                </Row>
                                            </div>
                                        );
                                    }}
                                </Form.Item>
                            )}

                            {/* Show editable steps list or read-only tasks display */}
                            {productionTasks && productionTasks.length > 0 ? (
                                <ProductionTasksDisplay
                                    drawingCodeId={drawingCodeId}
                                    productionTasks={productionTasks}
                                    templates={templates}
                                />
                            ) : (
                                drawingCodeId && (
                                    <div style={{ marginTop: 8 }}>
                                        <Divider style={{ margin: '16px 0' }} />
                                        <OrderStepList
                                            drawingIndex={name}
                                            operators={operators}
                                            isLoadingOperators={isLoadingOperators}
                                        />
                                    </div>
                                )
                            )}
                        </>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export const OrderDrawingList: React.FC<OrderDrawingListProps> = ({
    form,
    templates,
    productionType,
    onQuickCreate,
    operators,
    isLoadingOperators,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [expandedDrawings, setExpandedDrawings] = useState<Record<number, boolean>>({ 0: true });

    const toggleDrawing = (index: number) => {
        setExpandedDrawings((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const orderDrawings = form.getFieldValue('orderDrawings') || [];
            const oldIndex = orderDrawings.findIndex(
                (_: any, idx: number) => `drawing-${idx}` === active.id
            );
            const newIndex = orderDrawings.findIndex(
                (_: any, idx: number) => `drawing-${idx}` === over.id
            );

            const newOrderDrawings = arrayMove(orderDrawings, oldIndex, newIndex);
            form.setFieldsValue({ orderDrawings: newOrderDrawings });
        }
    };

    return (
        <Form.List
            name="orderDrawings"
            rules={[
                {
                    validator: async (_, names) => {
                        if (!names || names.length < 1) {
                            return Promise.reject(
                                new Error(t('orderManagement.form.validation.minOneDrawing'))
                            );
                        }
                    },
                },
            ]}
        >
            {(fields, { add, remove }, { errors }) => {
                const items = fields.map((field, index) => `drawing-${index}`);

                return (
                    <>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                                {fields.map((field, index) => {
                                    const drawingPath = ['orderDrawings', field.name];

                                    // Check drawing-level field errors
                                    const drawingHasError = form.getFieldValue(drawingPath)
                                        ? form.getFieldError([...drawingPath, 'drawingCodeId']).length > 0 ||
                                        form.getFieldError([...drawingPath, 'orderQuantity']).length > 0
                                        : false;

                                    // Check nested step and task errors
                                    const steps = form.getFieldValue([...drawingPath, 'orderSteps']) || [];
                                    const hasNestedErrors = steps.some((_: any, stepIndex: number) => {
                                        const stepPath = [...drawingPath, 'orderSteps', stepIndex];
                                        const stepHasError =
                                            form.getFieldError([...stepPath, 'stepName']).length > 0 ||
                                            form.getFieldError([...stepPath, 'description']).length > 0 ||
                                            form.getFieldError([...stepPath, 'materialName']).length > 0 ||
                                            form.getFieldError([...stepPath, 'defaultCompletionTimeSeconds']).length > 0;

                                        const tasks = form.getFieldValue([...stepPath, 'tasks']) || [];
                                        const hasTaskErrors = tasks.some((_: any, taskIndex: number) => {
                                            const taskPath = [...stepPath, 'tasks', taskIndex];
                                            return (
                                                form.getFieldError([...taskPath, 'taskName']).length > 0 ||
                                                form.getFieldError([...taskPath, 'taskRequestedQuantity']).length > 0 ||
                                                form.getFieldError([...taskPath, 'taskPlannedQuantity']).length > 0
                                            );
                                        });

                                        return stepHasError || hasTaskErrors;
                                    });

                                    const hasError = drawingHasError || hasNestedErrors;

                                    return (
                                        <SortableDrawingItem
                                            key={field.key}
                                            id={`drawing-${index}`}
                                            index={index}
                                            name={field.name}
                                            field={field}
                                            templates={templates}
                                            productionType={productionType || 'BATCH'}
                                            onRemove={() => remove(field.name)}
                                            onQuickCreate={() => onQuickCreate(index)}
                                            operators={operators}
                                            isLoadingOperators={isLoadingOperators}
                                            hasError={hasError}
                                            isExpanded={!!expandedDrawings[field.name]}
                                            onToggle={() => toggleDrawing(field.name)}
                                        />
                                    );
                                })}
                            </SortableContext>
                        </DndContext>

                        <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                            style={{
                                marginTop: fields.length > 0 ? 12 : 0,
                                borderColor: errors.length > 0 ? token.colorError : undefined,
                                color: errors.length > 0 ? token.colorError : undefined,
                            }}
                        >
                            {t('orderManagement.drawing.add')}
                        </Button>

                        <Form.ErrorList errors={errors} />

                        {fields.length === 0 && (
                            <Text
                                type={errors.length > 0 ? 'danger' : 'secondary'}
                                style={{ display: 'block', marginTop: 8 }}
                            >
                                {t('orderManagement.drawing.empty')}
                            </Text>
                        )}
                    </>
                );
            }}
        </Form.List>
    );
};
