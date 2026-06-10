'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Form,
    FormInstance,
    Input,
    InputNumber,
    Row,
    Col,
    Space,
    Card,
    Typography,
    theme,
    Badge,
    Empty,
    Flex,
    Tag,
} from 'antd';
import { CarryOutOutlined, UserOutlined } from '@ant-design/icons';
import { OperatorSelector } from '../../../OperatorSelector';
import type { TaskReview } from '@/types/Order';

const { Text } = Typography;
const { useToken } = theme;

const getReviewStatusColor = (status?: string) => {
    switch (status) {
        case 'CONFIRMED':
            return 'success';
        case 'DECLINED':
            return 'error';
        case 'PENDING':
            return 'gold';
        default:
            return 'default';
    }
};

const getReviewStatusLabel = (status: string | undefined, t: any) => {
    switch (status) {
        case 'CONFIRMED':
            return t('managerReview.drawer.stats.confirmed');
        case 'DECLINED':
            return t('managerReview.drawer.stats.declined');
        case 'PENDING':
            return t('managerReview.drawer.stats.pending');
        default:
            return status || '-';
    }
};

const formatReviewedAt = (value?: string) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

interface TaskDetailFormProps {
    drawingIndex: number;
    stepIndex: number;
    taskIndex: number;
    form: FormInstance;
    operators: any[];
    isLoadingOperators: boolean;
    showReviews?: boolean;
}

export const TaskDetailForm: React.FC<TaskDetailFormProps> = ({
    drawingIndex,
    stepIndex,
    taskIndex,
    form,
    operators,
    isLoadingOperators,
    showReviews = true,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    Form.useWatch(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex], form);
    Form.useWatch(['orderDrawings', drawingIndex, 'productionType'], form);

    const task =
        form.getFieldValue(['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex]) ||
        {};
    const drawing = form.getFieldValue(['orderDrawings', drawingIndex]) || {};
    const isSinglePiece = drawing.productionType === 'SINGLE_PIECE';
    const reviews: TaskReview[] = task._reviews || [];
    const confirmedCount = reviews.filter((review) => review.reviewStatus === 'CONFIRMED').length;
    const pendingCount = reviews.filter((review) => review.reviewStatus === 'PENDING').length;
    const declinedCount = reviews.filter((review) => review.reviewStatus === 'DECLINED').length;

    React.useEffect(() => {
        if (!isSinglePiece || task.taskRequestedQuantity === 1) return;

        form.setFieldValue(
            [
                'orderDrawings',
                drawingIndex,
                'orderSteps',
                stepIndex,
                'tasks',
                taskIndex,
                'taskRequestedQuantity',
            ],
            1
        );
    }, [drawingIndex, form, isSinglePiece, stepIndex, task.taskRequestedQuantity, taskIndex]);

    return (
        <Card
            title={
                <Space>
                    <CarryOutOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
                    <Text strong>{t('orderManagement.form.plan.taskDetails')}</Text>
                </Space>
            }
            bordered={false}
        >
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
                {/* Hidden taskOrder field */}
                <Form.Item
                    name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex, 'taskOrder']}
                    initialValue={taskIndex + 1}
                    hidden
                >
                    <Input />
                </Form.Item>

                {/* Task Name */}
                <Form.Item
                    name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex, 'taskName']}
                    label={<Text strong>{t('orderManagement.task.nameLabel')} *</Text>}
                    rules={[
                        {
                            required: true,
                            message: t('orderManagement.form.planValidation.taskNameRequired'),
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
                        placeholder={t('orderManagement.task.namePlaceholder')}
                        maxLength={100}
                    />
                </Form.Item>

                {/* Quantities */}
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex, 'taskRequestedQuantity']}
                            label={
                                <Text strong>
                                    {t('orderManagement.form.plan.requestedQuantityRequired')}
                                </Text>
                            }
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        'orderManagement.form.planValidation.requestedQuantityRequired'
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
                                disabled={isSinglePiece}
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
                            name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex, 'taskPlannedQuantity']}
                            label={
                                <Text strong>
                                    {t('orderManagement.form.plan.plannedQuantityRequired')}
                                </Text>
                            }
                            dependencies={[['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex, 'taskRequestedQuantity']]}
                            rules={[
                                {
                                    required: true,
                                    message: t(
                                        'orderManagement.form.planValidation.plannedQuantityRequired'
                                    ),
                                },
                                {
                                    type: 'number',
                                    min: 1,
                                    message: t('orderManagement.form.planValidation.minOne'),
                                },
                                ({ getFieldValue }) => ({
                                    validator: async (_, value) => {
                                        const requestedQty = getFieldValue([
                                            'orderDrawings',
                                            drawingIndex,
                                            'orderSteps',
                                            stepIndex,
                                            'tasks',
                                            taskIndex,
                                            'taskRequestedQuantity',
                                        ]);
                                        if (value && requestedQty && value < requestedQty) {
                                            throw new Error(
                                                t(
                                                    'orderManagement.form.planValidation.plannedQuantityMinRequested'
                                                )
                                            );
                                        }
                                    },
                                }),
                            ]}
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
                        <Text
                            type="secondary"
                            style={{ fontSize: 12, display: 'block', marginTop: -16 }}
                        >
                            {t('orderManagement.form.plan.plannedQuantityHint')}
                        </Text>
                    </Col>
                </Row>

                {/* Operators */}
                <Form.Item
                    name={['orderDrawings', drawingIndex, 'orderSteps', stepIndex, 'tasks', taskIndex, 'operatorIds']}
                    label={<Text strong>{t('orderManagement.task.assignOperator')}</Text>}
                >
                    <OperatorSelector
                        operators={operators}
                        isLoadingOperators={isLoadingOperators}
                    />
                </Form.Item>

                {showReviews && (
                    <div
                        style={{
                            padding: 16,
                            background: token.colorBgLayout,
                            borderRadius: 8,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                            <Space>
                                <UserOutlined style={{ color: token.colorPrimary }} />
                                <Text strong>
                                    {t('orderManagement.detail.drawing.operatorReviews')}
                                </Text>
                            </Space>
                            <Space size={6} wrap>
                                <Tag>{reviews.length}</Tag>
                                <Tag color="success">
                                    {t('managerReview.drawer.stats.confirmed')}: {confirmedCount}
                                </Tag>
                                <Tag color="gold">
                                    {t('managerReview.drawer.stats.pending')}: {pendingCount}
                                </Tag>
                                <Tag color="error">
                                    {t('managerReview.drawer.stats.declined')}: {declinedCount}
                                </Tag>
                            </Space>
                        </Flex>

                        {reviews.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={t('managerReview.drawer.reviews.noReviews')}
                                style={{ marginBlock: 12 }}
                            />
                        ) : (
                            <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 12 }}>
                                {reviews.map((review, index) => {
                                    const reviewedAt = formatReviewedAt(review.reviewedAt);

                                    return (
                                        <div
                                            key={review.taskReviewId || `${review.operatorId}-${index}`}
                                            style={{
                                                padding: 12,
                                                background: token.colorBgContainer,
                                                borderRadius: 6,
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                            }}
                                        >
                                            <Flex justify="space-between" align="flex-start" gap={12} wrap="wrap">
                                                <Space direction="vertical" size={2}>
                                                    <Space size={6} wrap>
                                                        <Text strong>{review.operatorFullName}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {review.operatorUserCode}
                                                        </Text>
                                                    </Space>
                                                    {reviewedAt && (
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {reviewedAt}
                                                        </Text>
                                                    )}
                                                </Space>
                                                <Tag color={getReviewStatusColor(review.reviewStatus)}>
                                                    {getReviewStatusLabel(review.reviewStatus, t)}
                                                </Tag>
                                            </Flex>

                                            {review.reviewStatus === 'DECLINED' && (
                                                <div
                                                    style={{
                                                        marginTop: 10,
                                                        padding: 10,
                                                        background: token.colorErrorBg,
                                                        borderRadius: 6,
                                                        border: `1px solid ${token.colorErrorBorder}`,
                                                    }}
                                                >
                                                    {review.declineReason && (
                                                        <Text type="danger" strong style={{ display: 'block' }}>
                                                            {t('operatorReview.drawer.declineReason')}: {review.declineReason}
                                                        </Text>
                                                    )}
                                                    {review.declineComment && (
                                                        <Text
                                                            type="secondary"
                                                            italic
                                                            style={{ display: 'block', marginTop: 4 }}
                                                        >
                                                            {review.declineComment}
                                                        </Text>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </Space>
                        )}
                    </div>
                )}

                {/* Summary */}
                <div
                    style={{
                        padding: 16,
                        background: token.colorInfoBg,
                        borderRadius: 8,
                        border: `1px solid ${token.colorInfoBorder}`,
                    }}
                >
                    <Space direction="vertical" size={8}>
                        <Text strong style={{ fontSize: 13 }}>
                            {t('orderManagement.form.plan.taskSummary')}
                        </Text>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, curr) => {
                                const prevTask =
                                    prev?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepIndex]
                                        ?.tasks?.[taskIndex];
                                const currTask =
                                    curr?.orderDrawings?.[drawingIndex]?.orderSteps?.[stepIndex]
                                        ?.tasks?.[taskIndex];

                                return (
                                    prevTask?.taskRequestedQuantity !==
                                    currTask?.taskRequestedQuantity ||
                                    prevTask?.operatorIds !== currTask?.operatorIds
                                );
                            }}
                        >
                            {({ getFieldValue }) => {
                                const task =
                                    getFieldValue([
                                        'orderDrawings',
                                        drawingIndex,
                                        'orderSteps',
                                        stepIndex,
                                        'tasks',
                                        taskIndex,
                                    ]) || {};
                                const taskRequestedQuantity = task.taskRequestedQuantity;
                                const operatorIds = task.operatorIds || [];

                                return (
                                    <>
                                        <Space>
                                            <Badge
                                                status={
                                                    taskRequestedQuantity ? 'success' : 'default'
                                                }
                                            />
                                            <Text>
                                                {taskRequestedQuantity
                                                    ? t('orderManagement.form.plan.requestedUnits', {
                                                        quantity: taskRequestedQuantity,
                                                    })
                                                    : t(
                                                        'orderManagement.form.plan.noRequestedQuantity'
                                                    )}
                                            </Text>
                                            <Text type="secondary">
                                                {t('orderManagement.task.Operators')}:
                                            </Text>
                                            <Text>
                                                {t('orderManagement.form.plan.assignedCount', {
                                                    count: operatorIds.length,
                                                })}
                                            </Text>
                                        </Space>
                                    </>
                                );
                            }}
                        </Form.Item>
                    </Space>
                </div>
            </Space>
        </Card>
    );
};
