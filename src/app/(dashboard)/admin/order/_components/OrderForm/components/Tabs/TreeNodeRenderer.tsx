'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Flex, FormInstance, Tag, theme } from 'antd';
import {
    CheckCircleOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    MoreOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import {
    getNodeValidationStatus,
    parseNodeKey,
    type SelectedNode,
} from '../../utils/treeMappers';

const { useToken } = theme;

interface TreeNodeRendererProps {
    nodeData: any;
    form: FormInstance;
    isSelected: boolean;
    setSelectedNode: (node: SelectedNode | null) => void;
    setExpandedKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
}

export const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
    nodeData,
    form,
    isSelected,
    setSelectedNode,
    setExpandedKeys,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();

    const status = getNodeValidationStatus(nodeData.key, form);
    const { type, indices } = parseNodeKey(nodeData.key);
    const isSinglePieceStep =
        type === 'step' &&
        form.getFieldValue(['orderDrawings', indices[0], 'productionType']) === 'SINGLE_PIECE';
    const isSinglePieceTask =
        type === 'task' &&
        form.getFieldValue(['orderDrawings', indices[0], 'productionType']) === 'SINGLE_PIECE';

    const refreshOrderDrawings = (orderDrawings: any[]) => {
        form.setFieldValue('orderDrawings', orderDrawings);
    };

    const addStep = (drawingIndex: number) => {
        const orderDrawings = form.getFieldValue('orderDrawings') || [];
        const drawing = orderDrawings[drawingIndex];
        const stepIndex = drawing?.orderSteps?.length || 0;
        const newStep = {
            stepOrder: stepIndex + 1,
            stepName: '',
            description: '',
            requiresQc: false,
            materialName: '',
            defaultCompletionTimeSeconds: 0,
            tasks: [
                {
                    taskOrder: 1,
                    taskName: '',
                    taskRequestedQuantity: 1,
                    taskPlannedQuantity: 1,
                    operatorIds: [],
                },
            ],
        };

        const updatedDrawings = orderDrawings.map((item: any, index: number) =>
            index === drawingIndex
                ? { ...item, orderSteps: [...(item.orderSteps || []), newStep] }
                : item
        );
        const newKey = `step-${drawingIndex}-${stepIndex}`;

        refreshOrderDrawings(updatedDrawings);
        setExpandedKeys((prev) => [...new Set([...prev, `drawing-${drawingIndex}`, newKey])]);
        setSelectedNode({ key: newKey, type: 'step' });
    };

    const addTask = (drawingIndex: number, stepIndex: number) => {
        const orderDrawings = form.getFieldValue('orderDrawings') || [];
        const step = orderDrawings[drawingIndex]?.orderSteps?.[stepIndex];
        const taskIndex = step?.tasks?.length || 0;
        const newTask = {
            taskOrder: taskIndex + 1,
            taskName: '',
            taskRequestedQuantity: 1,
            taskPlannedQuantity: 1,
            operatorIds: [],
        };

        const updatedDrawings = orderDrawings.map((drawing: any, dIdx: number) => {
            if (dIdx !== drawingIndex) return drawing;

            return {
                ...drawing,
                orderSteps: (drawing.orderSteps || []).map((item: any, sIdx: number) =>
                    sIdx === stepIndex
                        ? { ...item, tasks: [...(item.tasks || []), newTask] }
                        : item
                ),
            };
        });
        const newKey = `task-${drawingIndex}-${stepIndex}-${taskIndex}`;

        refreshOrderDrawings(updatedDrawings);
        setExpandedKeys((prev) => [
            ...new Set([...prev, `drawing-${drawingIndex}`, `step-${drawingIndex}-${stepIndex}`, newKey]),
        ]);
        setSelectedNode({ key: newKey, type: 'task' });
    };

    const deleteDrawing = (drawingIndex: number) => {
        const orderDrawings = form.getFieldValue('orderDrawings') || [];
        refreshOrderDrawings(orderDrawings.filter((_: any, index: number) => index !== drawingIndex));
        setSelectedNode(null);
    };

    const deleteStep = (drawingIndex: number, stepIndex: number) => {
        const orderDrawings = form.getFieldValue('orderDrawings') || [];
        const updatedDrawings = orderDrawings.map((drawing: any, dIdx: number) => {
            if (dIdx !== drawingIndex) return drawing;

            const orderSteps = (drawing.orderSteps || [])
                .filter((_: any, index: number) => index !== stepIndex)
                .map((step: any, index: number) => ({ ...step, stepOrder: index + 1 }));

            return { ...drawing, orderSteps };
        });

        refreshOrderDrawings(updatedDrawings);
        setSelectedNode({ key: `drawing-${drawingIndex}`, type: 'drawing' });
    };

    const deleteTask = (drawingIndex: number, stepIndex: number, taskIndex: number) => {
        const orderDrawings = form.getFieldValue('orderDrawings') || [];
        const updatedDrawings = orderDrawings.map((drawing: any, dIdx: number) => {
            if (dIdx !== drawingIndex) return drawing;

            return {
                ...drawing,
                orderSteps: (drawing.orderSteps || []).map((step: any, sIdx: number) => {
                    if (sIdx !== stepIndex) return step;

                    const tasks = (step.tasks || [])
                        .filter((_: any, index: number) => index !== taskIndex)
                        .map((task: any, index: number) => ({ ...task, taskOrder: index + 1 }));

                    return { ...step, tasks };
                }),
            };
        });

        refreshOrderDrawings(updatedDrawings);
        setSelectedNode({ key: `step-${drawingIndex}-${stepIndex}`, type: 'step' });
    };

    const handleMenuClick = ({ key, domEvent }: any) => {
        domEvent.stopPropagation();

        if (type === 'drawing') {
            const [drawingIndex] = indices;
            if (key === 'add-step') addStep(drawingIndex);
            if (key === 'delete') deleteDrawing(drawingIndex);
        }

        if (type === 'step') {
            const [drawingIndex, stepIndex] = indices;
            if (key === 'add-task') addTask(drawingIndex, stepIndex);
            if (key === 'delete') deleteStep(drawingIndex, stepIndex);
        }
    };

    const renderActions = () => {
        if (type === 'task') {
            const [drawingIndex, stepIndex, taskIndex] = indices;

            return (
                <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={isSinglePieceTask}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (isSinglePieceTask) return;
                        deleteTask(drawingIndex, stepIndex, taskIndex);
                    }}
                />
            );
        }

        return (
            <Dropdown
                trigger={['click']}
                menu={{
                    onClick: handleMenuClick,
                    items:
                        type === 'drawing'
                            ? [
                                {
                                    key: 'add-step',
                                    icon: <PlusOutlined />,
                                    label: t('orderManagement.form.plan.addStep'),
                                },
                                {
                                    key: 'delete',
                                    icon: <DeleteOutlined />,
                                    label: t('orderManagement.form.plan.deleteDrawing'),
                                    danger: true,
                                },
                            ]
                            : [
                                {
                                    key: 'add-task',
                                    icon: <PlusOutlined />,
                                    label: t('orderManagement.form.plan.addTask'),
                                    disabled: isSinglePieceStep,
                                },
                                {
                                    key: 'delete',
                                    icon: <DeleteOutlined />,
                                    label: t('orderManagement.form.plan.deleteStep'),
                                    danger: true,
                                },
                            ],
                }}
            >
                <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    onClick={(event) => event.stopPropagation()}
                />
            </Dropdown>
        );
    };

    return (
        <Flex
            align="center"
            gap={8}
            style={{
                padding: '4px 8px',
                borderRadius: 4,
                background: isSelected ? token.colorPrimaryBg : 'transparent',
                transition: 'all 0.2s',
                minWidth: 0,
                width: '100%',
            }}
        >
            <span style={{ flex: '0 0 auto', display: 'inline-flex' }}>{nodeData.icon}</span>
            <span
                title={nodeData.title}
                style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    width: '100%',
                }}
            >
                {nodeData.title}
            </span>
            <Flex
                align="center"
                gap={4}
                style={{
                    flex: '0 0 auto',
                    marginLeft: 'auto',
                }}
            >
                {status === 'incomplete' && (
                    <ExclamationCircleOutlined
                        style={{ color: token.colorWarning, fontSize: 14 }}
                        title={t('orderManagement.form.plan.incompleteTooltip')}
                    />
                )}
                {status === 'complete' && (
                    <CheckCircleOutlined
                        style={{ color: token.colorSuccess, fontSize: 14 }}
                        title={t('orderManagement.form.plan.completeTooltip')}
                    />
                )}
                {status === 'new' && (
                    <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                        {t('orderManagement.form.plan.newTag')}
                    </Tag>
                )}
                {renderActions()}
            </Flex>
        </Flex>
    );
};
