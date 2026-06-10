'use client';

import React from 'react';
import {
    Form,
    Button,
    Input,
    InputNumber,
    Switch,
    Space,
    Row,
    Col,
    Typography,
    Flex,
    Divider,
    Tag,
    theme,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, DeleteOutlined, DownOutlined, RightOutlined, NodeIndexOutlined, HolderOutlined, CarryOutOutlined } from '@ant-design/icons';
import { TaskList } from './TaskList';
import { DurationPicker } from '@/components/shared/DurationPicker';
import { useState } from 'react';

const { Text } = Typography;

interface OrderStepListProps {
    drawingIndex: number;
    operators: any[];
    isLoadingOperators: boolean;
}

interface OrderStepItemProps {
    field: any;
    index: number;
    drawingIndex: number;
    expandedSteps: Record<number, boolean>;
    toggleStep: (index: number) => void;
    remove: (name: number) => void;
    hasError: boolean;
    stepNumber: string;
    operators: any[];
    isLoadingOperators: boolean;
}

interface StepPreviewProps {
    drawingIndex: number;
    stepFieldName: number;
}

const StepNamePreview: React.FC<StepPreviewProps> = ({ drawingIndex, stepFieldName }) => {
    const { t } = useTranslation();

    return (
        <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => {
                const prevStep = prev?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepFieldName];
                const currStep = curr?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepFieldName];
                return prevStep?.stepName !== currStep?.stepName;
            }}
        >
            {({ getFieldValue }) => {
                const stepName = getFieldValue(['orderDrawings', drawingIndex, 'orderSteps', stepFieldName, 'stepName']);
                return (
                    <Text strong style={{ fontSize: 15, maxWidth: '300px' }} ellipsis={{ tooltip: true }}>
                        {stepName || <Text type="secondary">{t('orderManagement.step.namePlaceholder')}</Text>}
                    </Text>
                );
            }}
        </Form.Item>
    );
};

interface StepTagsPreviewProps {
    drawingIndex: number;
    stepFieldName: number;
    isExpanded: boolean;
}

const StepTagsPreview: React.FC<StepTagsPreviewProps> = ({ drawingIndex, stepFieldName, isExpanded }) => {
    const { t } = useTranslation();

    if (isExpanded) return null;

    return (
        <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => {
                const prevStep = prev?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepFieldName];
                const currStep = curr?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepFieldName];
                if (!prevStep && !currStep) return false;
                return (
                    prevStep?.materialName !== currStep?.materialName ||
                    prevStep?.defaultCompletionTimeSeconds !== currStep?.defaultCompletionTimeSeconds ||
                    prevStep?.requiresQc !== currStep?.requiresQc
                );
            }}
        >
            {({ getFieldValue }) => {
                const stepData = getFieldValue(['orderDrawings', drawingIndex, 'orderSteps', stepFieldName]) || {};
                const materialName = stepData.materialName;
                const timeSeconds = stepData.defaultCompletionTimeSeconds;
                const requiresQc = stepData.requiresQc;

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

                if (!materialName && !timeSeconds && !requiresQc) return null;

                return (
                    <Space size={8}>
                        {materialName && (
                            <Tag bordered={false} style={{ fontSize: 11 }}>
                                {materialName}
                            </Tag>
                        )}
                        {timeSeconds && (
                            <Tag bordered={false} color="blue" style={{ fontSize: 11 }}>
                                {formatDuration(timeSeconds)}
                            </Tag>
                        )}
                        {requiresQc && (
                            <Tag bordered={false} color="orange" style={{ fontSize: 11 }}>
                                QC
                            </Tag>
                        )}
                    </Space>
                );
            }}
        </Form.Item>
    );
};

const OrderStepItem: React.FC<OrderStepItemProps> = ({
    field,
    index,
    drawingIndex,
    expandedSteps,
    toggleStep,
    remove,
    hasError,
    stepNumber,
    operators,
    isLoadingOperators,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const form = Form.useFormInstance();
    const { key, ...restField } = field;

    return (
        <div>
            <div
                style={{
                    marginLeft: 24,
                    background: token.colorBgLayout,
                    border: `2px solid ${token.colorPrimary}`,
                    borderRadius: 8,
                    marginBottom: 16,
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
                        padding: '14px 18px',
                        cursor: 'pointer',
                        background: token.colorBgContainer,
                        borderRadius: expandedSteps[index] ? '8px 8px 0 0' : '8px',
                    }}
                    onClick={() => toggleStep(index)}
                >
                    <Space size={12} wrap style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                padding: '4px',
                                color: token.colorTextTertiary,
                                display: 'flex',
                                alignItems: 'center',
                                visibility: 'hidden', // Keep layout spacing but hide icon since no drag
                                width: 24, // Fixed width to match what the drag icon used
                            }}
                        >
                            <HolderOutlined style={{ fontSize: 16 }} />
                        </div>

                        {expandedSteps[index] ? (
                            <DownOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                        ) : (
                            <RightOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                        )}

                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: token.colorPrimary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        >
                            <NodeIndexOutlined style={{ fontSize: 16 }} />
                        </div>

                        <Tag
                            color={token.colorPrimary}
                            style={{
                                fontWeight: 700,
                                fontSize: 12,
                                padding: '2px 8px',
                                borderRadius: 4,
                                margin: 0,
                            }}
                        >
                            {stepNumber}
                        </Tag>

                        <StepNamePreview drawingIndex={drawingIndex} stepFieldName={field.name} />

                        {hasError && !expandedSteps[index] && (
                            <Tag color="error" style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                                {t('orderManagement.step.errorTag')}
                            </Tag>
                        )}

                        <StepTagsPreview
                            drawingIndex={drawingIndex}
                            stepFieldName={field.name}
                            isExpanded={!!expandedSteps[index]}
                        />
                    </Space>

                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            remove(field.name);
                        }}
                    >
                        {t('orderManagement.step.delete')}
                    </Button>
                </Flex>

                {/* Expanded Content */}
                <div style={{
                    padding: 'clamp(16px, 3vw, 24px)',
                    background: token.colorBgContainer,
                    borderRadius: '0 0 8px 8px',
                    display: expandedSteps[index] ? 'block' : 'none'
                }}>
                    <Form.Item
                        {...restField}
                        name={[field.name, 'stepOrder']}
                        initialValue={index + 1}
                        hidden
                    >
                        <InputNumber />
                    </Form.Item>

                    <Space direction="vertical" size={20} style={{ width: '100%' }}>
                        {/* Step Name */}
                        <Form.Item
                            {...restField}
                            name={[field.name, 'stepName']}
                            label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.step.stepLabel')}</Text>}
                            rules={[
                                {
                                    required: true,
                                    message: t('orderManagement.step.nameRequired'),
                                },
                                { max: 100 }
                            ]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input
                                placeholder={t('orderManagement.step.namePlaceholder')}
                                maxLength={100}
                                size="large"
                            />
                        </Form.Item>

                        {/* Description */}
                        <Form.Item
                            {...restField}
                            name={[field.name, 'description']}
                            label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.step.descriptionLabel')}</Text>}
                            rules={[
                                { required: true, message: t('orderManagement.step.descriptionRequired') },
                                { max: 2000 }
                            ]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input.TextArea
                                placeholder={t('orderManagement.step.descriptionPlaceholder')}
                                maxLength={2000}
                                rows={2}
                            />
                        </Form.Item>

                        {/* Material, Time, QC */}
                        <Row gutter={16}>
                            <Col xs={24} sm={12} md={8}>
                                <Form.Item
                                    {...restField}
                                    name={[field.name, 'materialName']}
                                    label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.step.materialLabel')}</Text>}
                                    rules={[
                                        { required: true, message: t('orderManagement.step.materialRequired') },
                                        { max: 2000 }
                                    ]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input placeholder={t('orderManagement.step.materialPlaceholder')} maxLength={2000} />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12} md={8}>
                                <Form.Item
                                    {...restField}
                                    name={[field.name, 'defaultCompletionTimeSeconds']}
                                    label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.step.timeLabel')}</Text>}
                                    rules={[
                                        { required: true, message: t('orderManagement.step.timeRequired') },
                                        {
                                            validator: async (_, value) => {
                                                if (
                                                    value !== null &&
                                                    value !== undefined &&
                                                    value <= 0
                                                ) {
                                                    throw new Error(t('orderManagement.step.timeMinError'));
                                                }
                                            },
                                        },
                                    ]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <DurationPicker size="large" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12} md={8}>
                                <Form.Item
                                    {...restField}
                                    name={[field.name, 'requiresQc']}
                                    label={<Text strong style={{ fontSize: 13 }}>{t('orderManagement.step.qcLabel')}</Text>}
                                    valuePropName="checked"
                                    initialValue={false}
                                    rules={[{ required: true, message: t('orderManagement.step.qcRequired') }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Tasks Section */}
                        <div style={{ marginTop: 8 }}>
                            <Divider style={{ margin: '16px 0' }} />
                            <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                                <CarryOutOutlined style={{ fontSize: 14, color: token.colorPrimary }} />
                                <Text strong style={{ fontSize: 14 }}>
                                    {t('orderManagement.step.taskListTitle')}
                                </Text>
                            </Flex>
                            <TaskList
                                drawingIndex={drawingIndex}
                                stepIndex={field.name}
                                operators={operators}
                                isLoadingOperators={isLoadingOperators}
                            />
                        </div>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export const OrderStepList: React.FC<OrderStepListProps> = ({ drawingIndex, operators, isLoadingOperators }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const form = Form.useFormInstance();
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

    const toggleStep = (index: number) => {
        setExpandedSteps((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    return (
        <Form.List
            name={[drawingIndex, 'orderSteps']}
            rules={[
                {
                    validator: async (_, steps) => {
                        if (!steps || steps.length < 1) {
                            return Promise.reject(new Error(t('orderManagement.step.minOneStep')));
                        }
                    },
                },
            ]}
        >
            {(fields, { add, remove }, { errors }) => (
                <div style={{ marginTop: 16, position: 'relative' }}>
                    {/* Vertical Connector Line */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 40,
                            top: 24,
                            bottom: 60,
                            width: 2,
                            background: `linear-gradient(to bottom, ${token.colorPrimary} 0%, ${token.colorBorderSecondary} 100%)`,
                            opacity: 0.5,
                            zIndex: 0,
                        }}
                    />
                    <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
                        {fields.map((field, index) => {
                            const stepPath = ['orderDrawings', drawingIndex, 'orderSteps', field.name];

                            // Check step-level field errors
                            const stepHasError =
                                form.getFieldError([...stepPath, 'stepName']).length > 0 ||
                                form.getFieldError([...stepPath, 'description']).length > 0 ||
                                form.getFieldError([...stepPath, 'materialName']).length > 0 ||
                                form.getFieldError([...stepPath, 'defaultCompletionTimeSeconds']).length > 0;

                            // Check nested task errors
                            const tasks = form.getFieldValue([...stepPath, 'tasks']) || [];
                            const hasTaskErrors = tasks.some((_: any, taskIndex: number) => {
                                const taskPath = [...stepPath, 'tasks', taskIndex];
                                return (
                                    form.getFieldError([...taskPath, 'taskName']).length > 0 ||
                                    form.getFieldError([...taskPath, 'taskRequestedQuantity']).length > 0 ||
                                    form.getFieldError([...taskPath, 'taskPlannedQuantity']).length > 0
                                );
                            });

                            const hasError = stepHasError || hasTaskErrors;
                            const stepNumber = `${drawingIndex + 1}.${index + 1}`;

                            return (
                                <OrderStepItem
                                    key={field.key}
                                    field={field}
                                    index={index}
                                    drawingIndex={drawingIndex}
                                    expandedSteps={expandedSteps}
                                    toggleStep={toggleStep}
                                    remove={remove}
                                    hasError={stepHasError || hasTaskErrors}
                                    stepNumber={stepNumber}
                                    operators={operators}
                                    isLoadingOperators={isLoadingOperators}
                                />
                            );
                        })}
                    </div>

                    <Button
                        type="dashed"
                        onClick={() => {
                            const newIndex = fields.length;
                            add({
                                stepOrder: newIndex + 1,
                                stepName: '',
                                requiresQc: false,
                                tasks: [
                                    {
                                        taskOrder: 1,
                                        taskRequestedQuantity: 1,
                                        taskPlannedQuantity: 1,
                                    },
                                ],
                            });
                            // Auto-expand newly added step
                            setExpandedSteps((prev) => ({ ...prev, [newIndex]: true }));
                        }}
                        icon={<PlusOutlined />}
                        block
                        style={{ marginTop: 16 }}
                    >
                        {t('orderManagement.step.addStep')}
                    </Button>

                    <Form.ErrorList errors={errors} />
                </div>
            )}
        </Form.List>
    );
};
