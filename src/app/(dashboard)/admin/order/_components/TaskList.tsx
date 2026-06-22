'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Form, Button, Input, InputNumber, Alert, Tooltip, Tag, theme, Card, Row, Col, Flex, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, DeleteOutlined, CarryOutOutlined, HolderOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { OperatorSelector } from './OperatorSelector';
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

const { Text } = Typography;

interface TaskListProps {
    drawingIndex: number;
    stepIndex: number;
    operators: any[];
    isLoadingOperators: boolean;
}

interface SortableTaskItemProps {
    field: any;
    index: number;
    drawingIndex: number;
    stepIndex: number;
    taskNumber: string;
    remove: (name: number) => void;
    getTasksPath: () => (string | number)[];
    isExpanded: boolean;
    toggleTask: (index: number) => void;
    taskIndex: number;
    operators: any[];
    isLoadingOperators: boolean;
    hasError: boolean;
}

interface TaskPreviewProps {
    drawingIndex: number;
    stepIndex: number;
    taskFieldName: number;
}

const TaskNamePreview: React.FC<TaskPreviewProps> = ({ drawingIndex, stepIndex, taskFieldName }) => {
    const { t } = useTranslation();
    const form = Form.useFormInstance();
    const taskName = Form.useWatch(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskFieldName, 'taskName'], form);

    return (
        <Text strong style={{ fontSize: 14, maxWidth: '250px' }} ellipsis={{ tooltip: true }}>
            {taskName || <Text type="secondary">{t('orderManagement.task.namePlaceholder')}</Text>}
        </Text>
    );
};

interface TaskTagsPreviewProps extends TaskPreviewProps {
    isExpanded: boolean;
}

const TaskTagsPreview: React.FC<TaskTagsPreviewProps> = ({ drawingIndex, stepIndex, taskFieldName, isExpanded }) => {
    const { t } = useTranslation();
    const form = Form.useFormInstance();
    const reqQty = Form.useWatch(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskFieldName, 'taskRequestedQuantity'], form);
    const planQty = Form.useWatch(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskFieldName, 'taskPlannedQuantity'], form);
    const operatorIds = Form.useWatch(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskFieldName, 'operatorIds'], form) || [];

    if (isExpanded) return null;
    if (!reqQty && !planQty && operatorIds.length === 0) return null;

    return (
        <Space size={8}>
            {reqQty && (
                <Tag variant="filled" style={{ fontSize: 11 }}>
                    {t('orderManagement.task.reqQtyLabel')}: {reqQty}
                </Tag>
            )}
            {planQty && (
                <Tag variant="filled" color="blue" style={{ fontSize: 11 }}>
                    {t('orderManagement.task.planQtyLabel')}: {planQty}
                </Tag>
            )}
            {operatorIds.length > 0 && (
                <Tag variant="filled" color="green" style={{ fontSize: 11 }}>
                    {operatorIds.length} {t('orderManagement.task.operatorsAssigned', { defaultValue: 'operators' })}
                </Tag>
            )}
        </Space>
    );
};

const SortableTaskItemComponent: React.FC<SortableTaskItemProps> = ({
    field,
    index,
    drawingIndex,
    stepIndex,
    taskNumber,
    remove,
    getTasksPath,
    isExpanded,
    toggleTask,
    taskIndex,
    operators,
    isLoadingOperators,
    hasError,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const form = Form.useFormInstance();
    const { key, ...restField } = field;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `task-${index}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const handleToggle = useCallback(() => {
        toggleTask(taskIndex);
    }, [toggleTask, taskIndex]);

    const handleRemove = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        remove(field.name);
    }, [remove, field.name]);

    return (
        <div ref={setNodeRef} style={style}>
            <div
                style={{
                    background: isDragging ? token.colorBgTextHover : token.colorBgLayout,
                    border: isDragging
                        ? `1.5px dashed ${token.colorPrimary}`
                        : hasError
                            ? `2px solid ${token.colorError}`
                            : `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: 8,
                    marginBottom: 12,
                    transition: 'all 0.2s ease',
                }}
            >
                {/* Collapsed Header */}
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={8}
                    style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: token.colorBgContainer,
                        borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
                    }}
                    onClick={handleToggle}
                >
                    <Space size={12} wrap style={{ flex: 1, minWidth: 0 }}>
                        <div
                            {...attributes}
                            {...listeners}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                cursor: 'grab',
                                padding: '4px',
                                color: token.colorTextTertiary,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <HolderOutlined style={{ fontSize: 14 }} />
                        </div>

                        {isExpanded ? (
                            <DownOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                        ) : (
                            <RightOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                        )}

                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                background: token.colorInfoBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: token.colorInfo,
                                border: `1px solid ${token.colorInfoBorder}`,
                            }}
                        >
                            <CarryOutOutlined style={{ fontSize: 12 }} />
                        </div>

                        <Tag
                            color={token.colorPrimary}
                            style={{
                                fontWeight: 600,
                                fontSize: 11,
                                padding: '1px 6px',
                                borderRadius: 4,
                                margin: 0,
                            }}
                        >
                            {taskNumber}
                        </Tag>

                        <TaskNamePreview
                            drawingIndex={drawingIndex}
                            stepIndex={stepIndex}
                            taskFieldName={field.name}
                        />

                        {hasError && !isExpanded && (
                            <Tag color="error" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                                {t('orderManagement.task.errorTag', { defaultValue: 'Error' })}
                            </Tag>
                        )}

                        <TaskTagsPreview
                            drawingIndex={drawingIndex}
                            stepIndex={stepIndex}
                            taskFieldName={field.name}
                            isExpanded={isExpanded}
                        />
                    </Space>

                    <Tooltip title={t('orderManagement.task.deleteTooltip')}>
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                            onClick={handleRemove}
                        />
                    </Tooltip>
                </Flex>

                {/* Expanded Content */}
                <div style={{
                    padding: 'clamp(16px, 3vw, 20px) clamp(16px, 3vw, 24px)',
                    background: token.colorBgContainer,
                    borderRadius: '0 0 8px 8px',
                    display: isExpanded ? 'block' : 'none'
                }}>
                    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                        <Form.Item
                                {...restField}
                                name={[field.name, 'taskName']}
                                label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.task.nameLabel')}</Text>}
                                rules={[
                                    { required: true, message: t('orderManagement.task.nameRequired') },
                                    { max: 100 }
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    placeholder={t('orderManagement.task.namePlaceholder')}
                                    maxLength={100}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                {...restField}
                                name={[field.name, 'taskOrder']}
                                initialValue={index + 1}
                                hidden
                            >
                                <InputNumber />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        {...restField}
                                        name={[field.name, 'taskRequestedQuantity']}
                                        label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.task.reqQtyLabel')}</Text>}
                                        rules={[
                                            { required: true, message: t('orderManagement.task.qtyRequired') },
                                            { type: 'number', min: 1 },
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
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        {...restField}
                                        name={[field.name, 'taskPlannedQuantity']}
                                        label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.task.planQtyLabel')}</Text>}
                                        dependencies={[...getTasksPath(), field.name, 'taskRequestedQuantity']}
                                        rules={[
                                            { required: true, message: t('orderManagement.task.qtyRequired') },
                                            { type: 'number', min: 1 },
                                            ({ getFieldValue }) => ({
                                                validator: async (_, value) => {
                                                    const requestedQty = getFieldValue([
                                                        ...getTasksPath(),
                                                        field.name,
                                                        'taskRequestedQuantity',
                                                    ]);
                                                    if (value && requestedQty && value < requestedQty) {
                                                        throw new Error(t('orderManagement.task.qtyMinError'));
                                                    }
                                                },
                                            }),
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
                            </Row>

                            <Form.Item
                                {...restField}
                                name={[field.name, 'operatorIds']}
                                label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.task.assignOperator')}</Text>}
                                style={{ marginBottom: 0 }}
                            >
                                <OperatorSelector
                                    placeholder={t('orderManagement.task.selectOperatorPlaceholder')}
                                    operators={operators}
                                    isLoadingOperators={isLoadingOperators}
                                />
                            </Form.Item>
                        </Space>
                    </div>
            </div>
        </div>
    );
};

// Memoize to prevent re-renders when other tasks change
const SortableTaskItem = React.memo(SortableTaskItemComponent);

export const TaskList: React.FC<TaskListProps> = ({ drawingIndex, stepIndex, operators, isLoadingOperators }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const form = Form.useFormInstance();
    const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getTasksPath = useCallback(
        () => ['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks'],
        [drawingIndex, stepIndex]
    );

    const toggleTask = useCallback((index: number) => {
        setExpandedTasks((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    }, []);

    const stableRemove = useCallback((name: number) => {
        // This will be called by child - we need the Form.List remove
        // We'll pass the actual remove from Form.List below
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const orderDrawings = form.getFieldValue('orderDrawings') || [];
            const currentSteps = orderDrawings[drawingIndex]?.orderSteps || [];
            const currentTasks = currentSteps[stepIndex]?.tasks || [];

            const oldIndex = parseInt(active.id.toString().split('-')[1]);
            const newIndex = parseInt(over.id.toString().split('-')[1]);

            const reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex).map((task: any, idx: number) => ({
                ...task,
                taskOrder: idx + 1,
            }));

            const newOrderDrawings = [...orderDrawings];
            const newSteps = [...currentSteps];
            newSteps[stepIndex] = {
                ...newSteps[stepIndex],
                tasks: reorderedTasks,
            };
            newOrderDrawings[drawingIndex] = {
                ...newOrderDrawings[drawingIndex],
                orderSteps: newSteps,
            };

            form.setFieldsValue({ orderDrawings: newOrderDrawings });
        }
    };

    return (
        <Form.List
            name={[stepIndex, 'tasks']}
            rules={[
                {
                    validator: async (_, tasks) => {
                        if (!tasks || tasks.length < 1) {
                            return Promise.reject(new Error(t('orderManagement.task.minOneTask')));
                        }
                    },
                },
            ]}
        >
            {(fields, { add, remove }, { errors }) => (
                <div style={{ marginTop: 12 }}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={fields.map((_, index) => `task-${index}`)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div style={{ marginBottom: 16 }}>
                                {fields.map((field, index) => {
                                    const taskNumber = `${drawingIndex + 1}.${stepIndex + 1}.${index + 1}`;

                                    // Check individual field errors within task
                                    const taskPath = ['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', field.name];
                                    const hasError =
                                        form.getFieldError([...taskPath, 'taskName']).length > 0 ||
                                        form.getFieldError([...taskPath, 'taskRequestedQuantity']).length > 0 ||
                                        form.getFieldError([...taskPath, 'taskPlannedQuantity']).length > 0;

                                    return (
                                        <SortableTaskItem
                                            key={field.key}
                                            field={field}
                                            index={index}
                                            drawingIndex={drawingIndex}
                                            stepIndex={stepIndex}
                                            taskNumber={taskNumber}
                                            remove={remove}
                                            getTasksPath={getTasksPath}
                                            isExpanded={expandedTasks[index] || false}
                                            toggleTask={toggleTask}
                                            taskIndex={index}
                                            operators={operators}
                                            isLoadingOperators={isLoadingOperators}
                                            hasError={hasError}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <div>
                        <Button
                            type="dashed"
                            onClick={() => {
                                const newIndex = fields.length;
                                add({
                                    taskOrder: newIndex + 1,
                                    taskRequestedQuantity: 1,
                                    taskPlannedQuantity: 1,
                                });
                                // Auto-expand newly added task
                                setExpandedTasks((prev) => ({ ...prev, [newIndex]: true }));
                            }}
                            icon={<PlusOutlined />}
                            size="small"
                            block
                        >
                            {t('orderManagement.task.addTask')}
                        </Button>
                        {errors.length > 0 && (
                            <Alert
                                title={errors[0]}
                                type="error"
                                showIcon
                                style={{ marginTop: 8 }}
                            />
                        )}
                    </div>
                </div>
            )}
        </Form.List>
    );
};
