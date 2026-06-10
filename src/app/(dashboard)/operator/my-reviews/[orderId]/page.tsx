'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    DemoOperatorReviewService,
    USE_MOCK_OPERATOR_REVIEWS,
} from '@/mockData/operator';
import { UtilsService } from '@/services/UtilsService';
import type { TaskDeclineReason as TaskDeclineReasonOption } from '@/services/UtilsService';
import {
    Card,
    Descriptions,
    Button,
    Space,
    Tag,
    Collapse,
    Radio,
    Input,
    message,
    Spin,
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { usePageTitle } from '@/hooks/usePageTitle';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { orderActions } from '@/stores/OrderStore';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import {
    TaskReviewStatus,
    TaskDeclineReason,
    OrderOperatorReviewDrawing,
    OrderOperatorReviewStep,
    OrderOperatorReviewTask,
} from '@/types/Order';

const { Panel } = Collapse;
const { TextArea } = Input;
const activeReviewUtilityService = USE_MOCK_OPERATOR_REVIEWS
    ? DemoOperatorReviewService
    : UtilsService;

interface ReviewDecision {
    taskId: string;
    taskReviewId: number;
    reviewStatus: TaskReviewStatus;
    declineReason?: TaskDeclineReason | null;
    declineComment?: string | null;
}

const OperatorReviewFormPage = () => {
    usePageTitle('Review Order Tasks');
    const params = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const orderId = params.orderId as string;

    const { operatorReviewData, isLoadingReviewData } = useAppSelector((state) => state.order);
    const [reviews, setReviews] = useState<Record<string, ReviewDecision>>({});
    const [declineReasons, setDeclineReasons] = useState<TaskDeclineReasonOption[]>([]);

    useEffect(() => {
        if (orderId) {
            dispatch(orderActions.fetchOperatorReviewForm(orderId));
        }
    }, [dispatch, orderId]);

    useEffect(() => {
        if (operatorReviewData) {
            const initialReviews: Record<string, ReviewDecision> = {};
            operatorReviewData.orderDrawings.forEach((drawing: OrderOperatorReviewDrawing) => {
                drawing.orderSteps.forEach((step: OrderOperatorReviewStep) => {
                    step.tasks.forEach((task: OrderOperatorReviewTask) => {
                        initialReviews[task.taskId] = {
                            taskId: task.taskId,
                            taskReviewId: task.myReview.taskReviewId,
                            reviewStatus: task.myReview.reviewStatus,
                            declineReason: task.myReview.declineReason,
                            declineComment: task.myReview.declineComment,
                        };
                    });
                });
            });
            setReviews(initialReviews);
        }
    }, [operatorReviewData]);

    useEffect(() => {
        let ignoreResult = false;

        const fetchDeclineReasons = async () => {
            try {
                const reasons = await activeReviewUtilityService.getTaskDeclineReasons();
                if (!ignoreResult) {
                    setDeclineReasons(reasons);
                }
            } catch {
                message.error('Failed to load decline reasons');
            }
        };

        fetchDeclineReasons();

        return () => {
            ignoreResult = true;
        };
    }, []);

    const handleReviewChange = (
        taskId: string,
        field: keyof ReviewDecision,
        value: TaskReviewStatus | TaskDeclineReason | string
    ) => {
        setReviews((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async () => {
        const pendingReviews = Object.values(reviews).filter((r) => r.reviewStatus === 'PENDING');
        if (pendingReviews.length > 0) {
            message.warning(`You have ${pendingReviews.length} pending reviews`);
            return;
        }

        const invalidDeclinedReviews = Object.values(reviews).filter(
            (review) => review.reviewStatus === 'DECLINED' && !review.declineReason
        );
        if (invalidDeclinedReviews.length > 0) {
            message.warning('Please select a decline reason before submitting');
            return;
        }

        const success = await dispatch(orderActions.submitOperatorReviews(Object.values(reviews)));
        if (!success) {
            message.error('Failed to submit reviews');
            return;
        }

        message.success('Reviews submitted successfully');
        await dispatch(orderActions.fetchMyReviewingOrders());
        router.push('/operator/my-reviews');
    };

    if (isLoadingReviewData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!operatorReviewData) {
        return <div>No data found</div>;
    }

    const getPendingCount = () => {
        return Object.values(reviews).filter((r) => r.reviewStatus === 'PENDING').length;
    };

    return (
        <>
            <ResponsivePageHeader
                title={`Review: ${operatorReviewData.orderCode}`}
                icon={<CheckCircleOutlined />}
                rightContent={
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push('/operator/my-reviews')}
                        >
                            Back
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSubmit}
                            disabled={getPendingCount() > 0}
                        >
                            Submit Reviews ({getPendingCount()} pending)
                        </Button>
                    </Space>
                }
            />

            <Card style={{ marginBottom: 16 }}>
                <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Order Code">
                        {operatorReviewData.orderCode}
                    </Descriptions.Item>
                    <Descriptions.Item label="Order Name">
                        {operatorReviewData.orderName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                        <Tag
                            color={
                                operatorReviewData.orderPriority === 'HIGH'
                                    ? 'red'
                                    : operatorReviewData.orderPriority === 'MEDIUM'
                                        ? 'orange'
                                        : 'blue'
                            }
                        >
                            {operatorReviewData.orderPriority}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Expected Start">
                        {operatorReviewData.expectedStartDate
                            ? new Date(operatorReviewData.expectedStartDate).toLocaleDateString()
                            : '-'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {operatorReviewData.orderDrawings.map(
                (drawing: OrderOperatorReviewDrawing, drawingIdx: number) => (
                    <Card
                        key={drawingIdx}
                        title={`Drawing: ${drawing.drawingCode}`}
                        style={{ marginBottom: 16 }}
                    >
                        <Collapse defaultActiveKey={['0']}>
                            {drawing.orderSteps.map((step: OrderOperatorReviewStep, stepIdx: number) => (
                                <Panel
                                    header={
                                        <Space>
                                            <span>
                                                Step {step.stepOrder}: {step.stepName}
                                            </span>
                                            {step.requiresQc && <Tag color="blue">QC Required</Tag>}
                                            <Tag>{step.tasks.length} tasks</Tag>
                                        </Space>
                                    }
                                    key={stepIdx}
                                >
                                    {step.tasks.map((task: OrderOperatorReviewTask) => {
                                        const review = reviews[task.taskId];
                                        return (
                                            <Card
                                                key={task.taskId}
                                                size="small"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <div>
                                                        <strong>Task:</strong> {task.taskName}
                                                    </div>
                                                    <div>
                                                        <strong>Status:</strong>{' '}
                                                        <Tag>{task.taskStatus}</Tag>
                                                    </div>

                                                    <div>
                                                        <strong>Your Review:</strong>
                                                        <Radio.Group
                                                            value={review?.reviewStatus}
                                                            onChange={(e) =>
                                                                handleReviewChange(
                                                                    task.taskId,
                                                                    'reviewStatus',
                                                                    e.target.value
                                                                )
                                                            }
                                                            style={{ marginLeft: 16 }}
                                                        >
                                                            <Radio.Button
                                                                value="CONFIRMED"
                                                                style={{ color: '#52c41a' }}
                                                            >
                                                                <CheckCircleOutlined /> Confirm
                                                            </Radio.Button>
                                                            <Radio.Button
                                                                value="DECLINED"
                                                                style={{ color: '#ff4d4f' }}
                                                            >
                                                                <CloseCircleOutlined /> Decline
                                                            </Radio.Button>
                                                        </Radio.Group>
                                                    </div>

                                                    {review?.reviewStatus === 'DECLINED' && (
                                                        <Space direction="vertical" style={{ width: '100%' }}>
                                                            <div>
                                                                <strong>Decline Reason:</strong>
                                                                <Radio.Group
                                                                    value={review.declineReason}
                                                                    onChange={(e) =>
                                                                        handleReviewChange(
                                                                            task.taskId,
                                                                            'declineReason',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    style={{ marginLeft: 16 }}
                                                                >
                                                                    {declineReasons.map((reason) => (
                                                                        <Radio
                                                                            key={reason.name}
                                                                            value={reason.name}
                                                                        >
                                                                            {reason.nameEn}
                                                                        </Radio>
                                                                    ))}
                                                                </Radio.Group>
                                                            </div>
                                                            <div>
                                                                <strong>Comment:</strong>
                                                                <TextArea
                                                                    rows={2}
                                                                    placeholder="Optional comment..."
                                                                    value={review.declineComment || ''}
                                                                    onChange={(e) =>
                                                                        handleReviewChange(
                                                                            task.taskId,
                                                                            'declineComment',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    style={{ marginTop: 8 }}
                                                                />
                                                            </div>
                                                        </Space>
                                                    )}

                                                    {review?.reviewStatus === 'CONFIRMED' && (
                                                        <Tag color="success" icon={<CheckCircleOutlined />}>
                                                            Confirmed
                                                        </Tag>
                                                    )}
                                                </Space>
                                            </Card>
                                        );
                                    })}
                                </Panel>
                            )
                            )}
                        </Collapse>
                    </Card>
                )
            )}
        </>
    );
};

export default OperatorReviewFormPage;
