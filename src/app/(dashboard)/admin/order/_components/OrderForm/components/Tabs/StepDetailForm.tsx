'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Form,
    FormInstance,
    Input,
    Switch,
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
    Alert,
} from 'antd';
import { NodeIndexOutlined, PlusOutlined } from '@ant-design/icons';
import { DurationPicker } from '@/components/shared/DurationPicker';
import { type SelectedNode } from '../../utils/treeMappers';

const { Text } = Typography;
const { useToken } = theme;

interface StepDetailFormProps {
    drawingIndex: number;
    stepIndex: number;
    form: FormInstance;
    setSelectedNode: (node: SelectedNode) => void;
    setExpandedKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
}

export const StepDetailForm: React.FC<StepDetailFormProps> = ({
    drawingIndex,
    stepIndex,
    form,
    setSelectedNode,
    setExpandedKeys,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    Form.useWatch(['orderDrawings', drawingIndex, 'productionType'], form);
    Form.useWatch(['orderDrawings', drawingIndex, 'totalRequestedQuantity'], form);
    Form.useWatch(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks'], form);
    const drawing = form.getFieldValue(['orderDrawings', drawingIndex]) || {};
    const step = form.getFieldValue(['orderDrawings', drawingIndex, 'orderSteps', stepIndex]) || {};
    const isSinglePiece = drawing.productionType === 'SINGLE_PIECE';
    const drawingTotalRequestedQuantity = Number(drawing.totalRequestedQuantity) || 0;
    const stepTaskRequestedQuantityTotal = (step.tasks || []).reduce(
        (total: number, task: any) => total + (Number(task?.taskRequestedQuantity) || 0),
        0
    );
    const batchQuantityDelta =
        drawingTotalRequestedQuantity - stepTaskRequestedQuantityTotal;
    const hasBatchQuantityMismatch =
        !isSinglePiece &&
        drawingTotalRequestedQuantity > 0 &&
        (step.tasks || []).length > 0 &&
        batchQuantityDelta !== 0;

    const handleAddTask = () => {
        const currentStep =
            form.getFieldValue(['orderDrawings', drawingIndex, 'orderSteps', stepIndex]) || {};

        const newTask = {
            taskOrder: (currentStep.tasks?.length || 0) + 1,
            taskName: '',
            taskRequestedQuantity: 1,
            taskPlannedQuantity: 1,
            operatorIds: [],
        };

        const updatedTasks = [...(currentStep.tasks || []), newTask];
        form.setFieldValue(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks'], updatedTasks);

        // Auto-expand and select new task
        const newTaskIndex = currentStep.tasks?.length || 0;
        setExpandedKeys((prev) => [
            ...new Set([
                ...prev,
                `drawing-${drawingIndex}`,
                `step-${drawingIndex}-${stepIndex}`,
                `task-${drawingIndex}-${stepIndex}-${newTaskIndex}`,
            ]),
        ]);
        setSelectedNode({
            key: `task-${drawingIndex}-${stepIndex}-${newTaskIndex}`,
            type: 'task',
        });
    };

    return (
        <Card
            title={
                <Flex align="center" gap={8}>
                    <NodeIndexOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
                    <Text strong>{t('orderManagement.form.plan.stepDetails')}</Text>
                </Flex>
            }
            bordered={false}
        >
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                {/* Hidden stepOrder field */}
                <Form.Item
                    name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'stepOrder']}
                    initialValue={stepIndex + 1}
                    hidden
                >
                    <Input />
                </Form.Item>

                {/* Step Name */}
                <Form.Item
                    name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'stepName']}
                    label={<Text strong>{t('orderManagement.step.nameLabel')} *</Text>}
                    rules={[
                        {
                            required: true,
                            message: t('orderManagement.form.planValidation.stepNameRequired'),
                        },
                        {
                            max: 100,
                            message: t('orderManagement.form.validation.maxCharacters', {
                                count: 100,
                            }),
                        },
                    ]}
                >
                    <Input
                        size="large"
                        placeholder={t('orderManagement.step.namePlaceholder')}
                        maxLength={100}
                    />
                </Form.Item>

                {/* Description */}
                <Form.Item
                    name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'description']}
                    label={<Text strong>{t('orderManagement.step.descriptionLabel')} *</Text>}
                    rules={[
                        {
                            required: true,
                            message: t(
                                'orderManagement.form.planValidation.stepDescriptionRequired'
                            ),
                        },
                        {
                            max: 2000,
                            message: t('orderManagement.form.validation.maxCharacters', {
                                count: 2000,
                            }),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={t('orderManagement.step.descriptionPlaceholder')}
                        rows={3}
                        maxLength={2000}
                    />
                </Form.Item>

                {/* Material, Time, QC */}
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'materialName']}
                            label={<Text strong>{t('orderManagement.step.materialLabel')} *</Text>}
                            rules={[
                                {
                                    required: true,
                                    message: t('orderManagement.form.planValidation.materialRequired'),
                                },
                                { max: 2000 },
                            ]}
                        >
                            <Input
                                placeholder={t('orderManagement.step.materialPlaceholder')}
                                maxLength={2000}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'defaultCompletionTimeSeconds']}
                            label={<Text strong>{t('orderManagement.form.plan.estimatedTimeRequired')}</Text>}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        'orderManagement.form.planValidation.estimatedTimeRequired'
                                    ),
                                },
                                {
                                    validator: async (_, value) => {
                                        if (value !== null && value !== undefined && value <= 0) {
                                            throw new Error(
                                                t(
                                                    'orderManagement.form.planValidation.timeGreaterThanZero'
                                                )
                                            );
                                        }
                                    },
                                },
                            ]}
                        >
                            <DurationPicker size="large" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                        <Form.Item
                            name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'requiresQc']}
                            label={<Text strong>{t('orderManagement.step.qcLabel')}</Text>}
                            valuePropName="checked"
                            initialValue={false}
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider style={{ margin: '4px 0' }} />

                {/* Tasks Summary */}
                <div>
                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                        {t('orderManagement.form.plan.tasksInStep')}
                    </Text>
                    {hasBatchQuantityMismatch && (
                        <Alert
                            type="warning"
                            showIcon
                            message={t(
                                'orderManagement.form.planValidation.stepQuantityMismatch',
                                {
                                    stepTotal: stepTaskRequestedQuantityTotal,
                                    drawingTotal: drawingTotalRequestedQuantity,
                                }
                            )}
                            description={
                                batchQuantityDelta > 0
                                    ? t(
                                        'orderManagement.form.planValidation.quantityAllocatedMissing',
                                        {
                                            allocated: stepTaskRequestedQuantityTotal,
                                            total: drawingTotalRequestedQuantity,
                                            missing: batchQuantityDelta,
                                        }
                                    )
                                    : t(
                                        'orderManagement.form.planValidation.quantityAllocatedOver',
                                        {
                                            allocated: stepTaskRequestedQuantityTotal,
                                            total: drawingTotalRequestedQuantity,
                                            over: Math.abs(batchQuantityDelta),
                                        }
                                    )
                            }
                            style={{ marginBottom: 12 }}
                        />
                    )}
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => {
                            const prevTasks =
                                prev?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepIndex]?.tasks;
                            const currTasks =
                                curr?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepIndex]?.tasks;

                            return prevTasks?.length !== currTasks?.length;
                        }}
                    >
                        {({ getFieldValue }) => {
                            const tasks =
                                getFieldValue([
                                    'orderDrawings',
                                    drawingIndex,
                                    'orderSteps',
                                    stepIndex,
                                    'tasks',
                                ]) || [];

                            return (
                                <Tag color="blue">
                                    {t('orderManagement.form.plan.tasksCount', {
                                        count: tasks.length,
                                    })}
                                </Tag>
                            );
                        }}
                    </Form.Item>
                </div>

                <Divider />

                {/* Quick Actions */}
                <Card bordered={false} style={{ background: token.colorBgLayout }}>
                    <Flex justify="space-between" align="center">
                        <Text strong>{t('orderManagement.form.plan.quickActions')}</Text>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddTask}
                            disabled={isSinglePiece}
                        >
                            {t('orderManagement.form.plan.addTaskToStep')}
                        </Button>
                    </Flex>
                </Card>
            </Space>
        </Card>
    );
};
