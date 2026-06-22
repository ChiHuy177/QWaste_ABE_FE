import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtilsService } from '@/services';
import {
    Card,
    Button,
    Space,
    Tag,
    Radio,
    Input,
    message,
    Spin,
    Drawer,
    Typography,
    Badge,
    Divider,
    theme,
    Alert,
    Segmented,
    Empty,
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    PictureOutlined,
    SafetyCertificateOutlined,
    ClockCircleOutlined,
    ExperimentOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { orderActions } from '@/stores/OrderStore';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import {
    TaskReviewStatus,
    TaskDeclineReason,
    OrderOperatorReviewDrawing,
    OrderOperatorReviewStep,
    OrderOperatorReviewTask,
} from '@/types/Order';

const { TextArea } = Input;
const { Text } = Typography;

type ReviewFilter = 'ALL' | TaskReviewStatus;

interface ReviewDecision {
    taskId: string;
    taskReviewId: number;
    reviewStatus: TaskReviewStatus;
    declineReason?: TaskDeclineReason | null;
    declineComment?: string | null;
}

export const OperatorReviewDrawer = () => {
    const dispatch = useAppDispatch();
    const { token } = theme.useToken();

    const {
        isOperatorReviewDrawerOpen,
        selectedOperatorReviewOrderId,
        operatorReviewData,
        isLoadingReviewData,
    } = useAppSelector((state) => state.order);

    const { t } = useTranslation('common');

    const [reviews, setReviews] = useState<Record<string, ReviewDecision>>({});
    const [declineReasons, setDeclineReasons] = useState<any[]>([]);
    const [submittingTasks, setSubmittingTasks] = useState<Record<string, boolean>>({});
    const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('PENDING');

    useEffect(() => {
        if (isOperatorReviewDrawerOpen && declineReasons.length === 0) {
            UtilsService.getTaskDeclineReasons().then(setDeclineReasons).catch(console.error);
        }
    }, [isOperatorReviewDrawerOpen]);

    useEffect(() => {
        if (isOperatorReviewDrawerOpen && selectedOperatorReviewOrderId) {
            dispatch(orderActions.fetchOperatorReviewForm(selectedOperatorReviewOrderId));
        }
    }, [dispatch, isOperatorReviewDrawerOpen, selectedOperatorReviewOrderId]);

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

    const handleClose = () => {
        dispatch(orderActions.closeOperatorReviewDrawer());
        setReviews({});
        setSubmittingTasks({});
        setReviewFilter('PENDING');
    };

    const handleReviewChange = (
        taskId: string,
        field: keyof ReviewDecision,
        value: TaskReviewStatus | TaskDeclineReason | string | null
    ) => {
        setReviews((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value,
            },
        }));
    };

    const handleConfirmSingle = async (taskId: string, taskReviewId: number) => {
        if (!selectedOperatorReviewOrderId) return;
        setSubmittingTasks((prev) => ({ ...prev, [taskId]: true }));
        try {
            const success = await dispatch(
                orderActions.submitSingleOperatorReview({
                    taskReviewId,
                    reviewStatus: 'CONFIRMED',
                })
            );
            if (success) {
                message.success(t('operatorReview.drawer.allTasksReviewed'));
                dispatch(orderActions.fetchOperatorReviewForm(selectedOperatorReviewOrderId));
                dispatch(orderActions.fetchMyReviewingOrders());
            } else {
                message.error('Failed to confirm task');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingTasks((prev) => ({ ...prev, [taskId]: false }));
        }
    };

    const handleDeclineSingle = async (taskId: string, taskReviewId: number) => {
        if (!selectedOperatorReviewOrderId) return;
        const review = reviews[taskId];
        if (!review || !review.declineReason) {
            message.error(t('operatorReview.drawer.pleaseSelectReason'));
            return;
        }
        setSubmittingTasks((prev) => ({ ...prev, [taskId]: true }));
        try {
            const success = await dispatch(
                orderActions.submitSingleOperatorReview({
                    taskReviewId,
                    reviewStatus: 'DECLINED',
                    declineReason: review.declineReason,
                    declineComment: review.declineComment || null,
                })
            );
            if (success) {
                message.success(t('operatorReview.drawer.allTasksReviewed'));
                dispatch(orderActions.fetchOperatorReviewForm(selectedOperatorReviewOrderId));
                dispatch(orderActions.fetchMyReviewingOrders());
            } else {
                message.error('Failed to decline task');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingTasks((prev) => ({ ...prev, [taskId]: false }));
        }
    };

    const getDbReviewCounts = () => {
        if (!operatorReviewData) return { pending: 0, confirmed: 0, declined: 0, total: 0 };
        let pending = 0;
        let confirmed = 0;
        let declined = 0;
        let total = 0;
        operatorReviewData.orderDrawings.forEach((drawing: OrderOperatorReviewDrawing) => {
            drawing.orderSteps.forEach((step: OrderOperatorReviewStep) => {
                step.tasks.forEach((task: OrderOperatorReviewTask) => {
                    total++;
                    if (task.myReview.reviewStatus === 'PENDING') {
                        pending++;
                    } else if (task.myReview.reviewStatus === 'CONFIRMED') {
                        confirmed++;
                    } else if (task.myReview.reviewStatus === 'DECLINED') {
                        declined++;
                    }
                });
            });
        });
        return { pending, confirmed, declined, total };
    };

    const getTasksFromSteps = (steps: OrderOperatorReviewStep[]) =>
        steps.flatMap((step) => step.tasks.map((task) => ({ task, step })));

    const getStatusToken = (status?: TaskReviewStatus) => {
        if (status === 'CONFIRMED') {
            return {
                icon: <CheckCircleOutlined />,
                color: token.colorSuccess,
                background: token.colorSuccessBg,
                border: token.colorSuccessBorder,
                text: t('operatorReview.drawer.confirm'),
            };
        }
        if (status === 'DECLINED') {
            return {
                icon: <CloseCircleOutlined />,
                color: token.colorError,
                background: token.colorErrorBg,
                border: token.colorErrorBorder,
                text: t('operatorReview.drawer.decline'),
            };
        }
        return {
            icon: <ClockCircleOutlined />,
            color: token.colorWarning,
            background: token.colorWarningBg,
            border: token.colorWarningBorder,
            text: t('operatorReview.page.pendingReviews'),
        };
    };

    const getPriorityToken = () => {
        if (!operatorReviewData) return token.colorInfo;
        if (operatorReviewData.orderPriority === 'URGENT' || operatorReviewData.orderPriority === 'HIGH') {
            return token.colorError;
        }
        if (operatorReviewData.orderPriority === 'MEDIUM') return token.colorWarning;
        return token.colorInfo;
    };

    const shouldShowTask = (task: OrderOperatorReviewTask) => {
        if (reviewFilter === 'ALL') return true;
        return task.myReview.reviewStatus === reviewFilter;
    };

    const reviewCounts = getDbReviewCounts();
    const hasVisibleReviewTasks =
        !!operatorReviewData &&
        operatorReviewData.orderDrawings.some((drawing: OrderOperatorReviewDrawing) =>
            getTasksFromSteps(drawing.orderSteps).some(({ task }) => shouldShowTask(task))
        );

    return (
        <Drawer
            title={
                <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                        <CheckCircleOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
                        <Text strong style={{ fontSize: 16 }}>
                            {t('operatorReview.drawer.title')}
                        </Text>
                    </Space>
                    {operatorReviewData && (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {operatorReviewData.orderCode} • {operatorReviewData.orderName}
                        </Text>
                    )}
                </Space>
            }
            placement="right"
            size={1000}
            onClose={handleClose}
            open={isOperatorReviewDrawerOpen}
            styles={{
                header: {
                    background: token.colorBgContainer,
                    borderBottom: `2px solid ${token.colorBorder}`,
                    padding: '20px 24px',
                },
                body: { padding: 0, background: token.colorBgLayout },
            }}
            footer={
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 24px',
                        background: token.colorBgContainer,
                        borderTop: `2px solid ${token.colorBorder}`,
                    }}
                >
                    <Space size={16}>
                        {reviewCounts.pending > 0 ? (
                            <Alert
                                title={t('operatorReview.drawer.tasksNeedReview', {
                                    count: reviewCounts.pending,
                                })}
                                type="warning"
                                showIcon
                                style={{ margin: 0, padding: '4px 12px' }}
                            />
                        ) : (
                            <Alert
                                title={t('operatorReview.drawer.allTasksReviewed')}
                                type="success"
                                showIcon
                                style={{ margin: 0, padding: '4px 12px' }}
                            />
                        )}
                    </Space>
                    <Space size={12}>
                        <Button size="large" onClick={handleClose} type="primary">
                            {t('drawingCodeManagement.form.buttons.close')}
                        </Button>
                    </Space>
                </div>
            }
        >
            {isLoadingReviewData ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 400,
                        background: token.colorBgContainer,
                    }}
                >
                    <Spin size="large" />
                    <Text type="secondary" style={{ marginTop: 16 }}>
                        {t('operatorReview.drawer.loadingData')}
                    </Text>
                </div>
            ) : !operatorReviewData ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 400,
                        background: token.colorBgContainer,
                    }}
                >
                    <Text type="secondary">{t('operatorReview.drawer.noData')}</Text>
                </div>
            ) : (
                <div>
                    <div
                        style={{
                            background: token.colorBgContainer,
                            padding: '16px 24px',
                            borderBottom: `1px solid ${token.colorBorder}`,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Space orientation="vertical" size={6} style={{ minWidth: 0 }}>
                                <Space size={8} wrap>
                                    <Text code>{operatorReviewData.orderCode}</Text>
                                    <Tag
                                        style={{
                                            marginInlineEnd: 0,
                                            color: getPriorityToken(),
                                            borderColor: getPriorityToken(),
                                            background: token.colorBgContainer,
                                        }}
                                    >
                                        {operatorReviewData.orderPriority}
                                    </Tag>
                                </Space>
                                <Text strong style={{ fontSize: 18 }}>
                                    {operatorReviewData.orderName}
                                </Text>
                            </Space>

                            <Space size={8} wrap>
                                {[
                                    {
                                        label: t('operatorReview.page.pendingReviews'),
                                        value: reviewCounts.pending,
                                        token: token.colorWarning,
                                    },
                                    {
                                        label: t('operatorReview.drawer.confirm'),
                                        value: reviewCounts.confirmed,
                                        token: token.colorSuccess,
                                    },
                                    {
                                        label: t('operatorReview.drawer.decline'),
                                        value: reviewCounts.declined,
                                        token: token.colorError,
                                    },
                                ].map((item) => (
                                    <Tag
                                        key={item.label}
                                        style={{
                                            marginInlineEnd: 0,
                                            color: item.token,
                                            borderColor: token.colorBorderSecondary,
                                            background: token.colorBgContainer,
                                            padding: '3px 8px',
                                        }}
                                    >
                                        {item.label}: <Text strong style={{ color: item.token }}>{item.value}</Text>
                                    </Tag>
                                ))}
                            </Space>
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            padding: '12px 24px',
                            background: token.colorBgContainer,
                            borderBottom: `1px solid ${token.colorBorder}`,
                        }}
                    >
                        <Segmented
                            value={reviewFilter}
                            onChange={(value) => setReviewFilter(value as ReviewFilter)}
                            options={[
                                { label: t('operatorReview.page.pendingReviews'), value: 'PENDING' },
                                {
                                    label: t('operatorReview.page.totalOrders', {
                                        defaultValue: 'Total Orders',
                                    }),
                                    value: 'ALL',
                                },
                                { label: t('operatorReview.drawer.confirm'), value: 'CONFIRMED' },
                                { label: t('operatorReview.drawer.decline'), value: 'DECLINED' },
                            ]}
                        />
                    </div>

                    <div style={{ padding: 24 }}>
                        {!hasVisibleReviewTasks ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={t('operatorReview.drawer.noData')}
                                style={{ padding: '48px 0' }}
                            />
                        ) : (
                            operatorReviewData.orderDrawings.map(
                                (drawing: OrderOperatorReviewDrawing) => {
                                    const drawingTasks = getTasksFromSteps(drawing.orderSteps);
                                    const drawingVisibleTasks = drawingTasks.filter(({ task }) =>
                                        shouldShowTask(task)
                                    );

                                    if (drawingVisibleTasks.length === 0) return null;

                                    return (
                                        <div key={drawing.orderDrawingId} style={{ marginBottom: 20 }}>
                                            <div
                                                style={{
                                                    padding: '10px 14px',
                                                    background: token.colorBgContainer,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                    borderRadius: token.borderRadius,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <Space size={8} wrap>
                                                    <PictureOutlined style={{ color: token.colorTextSecondary }} />
                                                    <Text strong>{drawing.drawingCode}</Text>
                                                    <Text type="secondary">{drawing.drawingCodeName}</Text>
                                                    <Tag style={{ marginInlineEnd: 0 }}>{drawing.productionType}</Tag>
                                                </Space>
                                            </div>

                                            {drawing.orderSteps.map(
                                                (step: OrderOperatorReviewStep, stepIdx: number) => (
                                                    <div key={stepIdx} style={{ marginBottom: 24 }}>
                                                        {step.tasks.some((task) => shouldShowTask(task)) && (
                                                            <>
                                                                <div
                                                                    style={{
                                                                        padding: '10px 14px',
                                                                        background: token.colorFillQuaternary,
                                                                        border: `1px solid ${token.colorBorderSecondary}`,
                                                                        borderRadius: token.borderRadius,
                                                                        marginBottom: 12,
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            flexWrap: 'wrap',
                                                                            gap: 12,
                                                                        }}
                                                                    >
                                                                        <Space>
                                                                            <Badge
                                                                                count={step.stepOrder}
                                                                                style={{
                                                                                    backgroundColor:
                                                                                        token.colorTextSecondary,
                                                                                }}
                                                                            />
                                                                            <Text strong>{step.stepName}</Text>
                                                                            {step.requiresQc && (
                                                                                <Tag
                                                                                    icon={
                                                                                        <SafetyCertificateOutlined />
                                                                                    }
                                                                                    style={{
                                                                                        color: token.colorWarning,
                                                                                        borderColor: token.colorWarningBorder,
                                                                                        background: token.colorWarningBg,
                                                                                    }}
                                                                                >
                                                                                    QC
                                                                                </Tag>
                                                                            )}
                                                                        </Space>
                                                                        <Space size={16}>
                                                                            {step.materialName && (
                                                                                <Space size={4}>
                                                                                    <ExperimentOutlined
                                                                                        style={{
                                                                                            color: token.colorTextSecondary,
                                                                                        }}
                                                                                    />
                                                                                    <Text
                                                                                        type="secondary"
                                                                                        style={{ fontSize: 13 }}
                                                                                    >
                                                                                        {step.materialName}
                                                                                    </Text>
                                                                                </Space>
                                                                            )}
                                                                        </Space>
                                                                    </div>
                                                                </div>

                                                                <div style={{ paddingLeft: 16 }}>
                                                                    {step.tasks.map(
                                                                        (task: OrderOperatorReviewTask) => {
                                                                            if (!shouldShowTask(task)) return null;
                                                                            const review = reviews[task.taskId];
                                                                            const statusToken = getStatusToken(review?.reviewStatus);

                                                                            return (
                                                                                <Card
                                                                                    key={task.taskId}
                                                                                    size="small"
                                                                                    style={{
                                                                                        marginBottom: 12,
                                                                                        borderLeft: `4px solid ${statusToken.color}`,
                                                                                        borderColor: statusToken.border,
                                                                                        background: token.colorBgContainer,
                                                                                    }}
                                                                                    styles={{
                                                                                        body: {
                                                                                            padding: '12px 16px',
                                                                                        },
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            display: 'grid',
                                                                                            gridTemplateColumns: 'minmax(220px, 1fr) auto',
                                                                                            gap: 12,
                                                                                            alignItems: 'center',
                                                                                        }}
                                                                                    >
                                                                                        <Space orientation="vertical" size={4} style={{ minWidth: 0 }}>
                                                                                            <Space size={8} wrap>
                                                                                                <Tag style={{ marginInlineEnd: 0 }}>
                                                                                                    #{task.taskOrder}
                                                                                                </Tag>
                                                                                                <Text strong>
                                                                                                    {task.taskName}
                                                                                                </Text>
                                                                                            </Space>
                                                                                            <Space size={8} wrap>
                                                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                                                    {t('operatorReview.drawer.qty')}: {task.taskPlannedQuantity}/{task.taskRequestedQuantity}
                                                                                                </Text>
                                                                                                <Tag style={{ marginInlineEnd: 0 }}>
                                                                                                    {task.taskStatus}
                                                                                                </Tag>
                                                                                            </Space>
                                                                                        </Space>

                                                                                        <Tag
                                                                                            icon={statusToken.icon}
                                                                                            style={{
                                                                                                marginInlineEnd: 0,
                                                                                                color: statusToken.color,
                                                                                                borderColor: statusToken.border,
                                                                                                background: statusToken.background,
                                                                                            }}
                                                                                        >
                                                                                            {statusToken.text}
                                                                                        </Tag>
                                                                                    </div>
                                                                                    <Divider style={{ margin: '12px 0' }} />

                                                                                    <div style={{ marginTop: 12 }}>
                                                                                        {/* CASE 1: DB is CONFIRMED and local is CONFIRMED (Static finalized view) */}
                                                                                        {task.myReview.reviewStatus === 'CONFIRMED' && review?.reviewStatus === 'CONFIRMED' && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                                <Alert
                                                                                                    title={t('operatorReview.drawer.readyForProduction')}
                                                                                                    type="success"
                                                                                                    showIcon
                                                                                                    style={{ flex: 1, marginRight: 16 }}
                                                                                                />
                                                                                                <Button
                                                                                                    type="link"
                                                                                                    size="small"
                                                                                                    onClick={() => handleReviewChange(task.taskId, 'reviewStatus', 'PENDING')}
                                                                                                    disabled={submittingTasks[task.taskId]}
                                                                                                >
                                                                                                    {t('operatorReview.drawer.reEvaluate') || 'Đánh giá lại'}
                                                                                                </Button>
                                                                                            </div>
                                                                                        )}

                                                                                        {/* CASE 2: DB is DECLINED and local is DECLINED (Static finalized view) */}
                                                                                        {task.myReview.reviewStatus === 'DECLINED' && review?.reviewStatus === 'DECLINED' && (
                                                                                            <div style={{
                                                                                                padding: 12,
                                                                                                background: token.colorErrorBg,
                                                                                                border: `1px solid ${token.colorErrorBorder}`,
                                                                                                borderRadius: 4,
                                                                                                display: 'flex',
                                                                                                flexDirection: 'column',
                                                                                                gap: 8
                                                                                            }}>
                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                                                    <Space orientation="vertical" size={2}>
                                                                                                        <Text strong style={{ fontSize: 13, color: token.colorError }}>
                                                                                                            {t('operatorReview.drawer.decline')}: {
                                                                                                                declineReasons.find(r => r.name === task.myReview.declineReason)?.nameVi ||
                                                                                                                task.myReview.declineReason
                                                                                                            }
                                                                                                        </Text>
                                                                                                        {task.myReview.declineComment && (
                                                                                                            <Text type="secondary" style={{ fontSize: 13 }}>
                                                                                                                {t('operatorReview.drawer.comments')}: {task.myReview.declineComment}
                                                                                                            </Text>
                                                                                                        )}
                                                                                                    </Space>
                                                                                                    <Button
                                                                                                        type="link"
                                                                                                        size="small"
                                                                                                        danger
                                                                                                        onClick={() => handleReviewChange(task.taskId, 'reviewStatus', 'PENDING')}
                                                                                                        disabled={submittingTasks[task.taskId]}
                                                                                                    >
                                                                                                        {t('operatorReview.drawer.reEvaluate') || 'Đánh giá lại'}
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}

                                                                                        {/* CASE 3: Local status is PENDING (Editable view showing actions) */}
                                                                                        {review?.reviewStatus === 'PENDING' && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                                                                <Text type="secondary" style={{ fontSize: 13 }}>
                                                                                                    {t('operatorReview.drawer.reviewDecision')}
                                                                                                </Text>
                                                                                                <Space size={12}>
                                                                                                    <Button
                                                                                                        type="primary"
                                                                                                        ghost
                                                                                                        style={{
                                                                                                            borderColor: token.colorSuccess,
                                                                                                            color: token.colorSuccess,
                                                                                                        }}
                                                                                                        icon={<CheckCircleOutlined />}
                                                                                                        onClick={() => handleConfirmSingle(task.taskId, task.myReview.taskReviewId)}
                                                                                                        loading={submittingTasks[task.taskId]}
                                                                                                        disabled={Object.values(submittingTasks).some(Boolean)}
                                                                                                    >
                                                                                                        {t('operatorReview.drawer.confirm')}
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        danger
                                                                                                        ghost
                                                                                                        icon={<CloseCircleOutlined />}
                                                                                                        onClick={() => handleReviewChange(task.taskId, 'reviewStatus', 'DECLINED')}
                                                                                                        loading={submittingTasks[task.taskId]}
                                                                                                        disabled={Object.values(submittingTasks).some(Boolean)}
                                                                                                    >
                                                                                                        {t('operatorReview.drawer.decline')}
                                                                                                    </Button>
                                                                                                </Space>
                                                                                            </div>
                                                                                        )}

                                                                                        {/* CASE 4: DB is not DECLINED but Local status is DECLINED (Currently filling/updating the decline form) */}
                                                                                        {task.myReview.reviewStatus !== 'DECLINED' && review?.reviewStatus === 'DECLINED' && (
                                                                                            <div
                                                                                                style={{
                                                                                                    padding: 12,
                                                                                                    background: token.colorErrorBg,
                                                                                                    border: `1px solid ${!review?.declineReason ? token.colorError : token.colorErrorBorder}`,
                                                                                                    borderRadius: 4,
                                                                                                }}
                                                                                            >
                                                                                                <div style={{ marginBottom: 12 }}>
                                                                                                    <Text
                                                                                                        strong
                                                                                                        style={{
                                                                                                            fontSize: 12,
                                                                                                            display: 'block',
                                                                                                            marginBottom: 8,
                                                                                                            color: !review?.declineReason ? token.colorError : 'inherit',
                                                                                                        }}
                                                                                                    >
                                                                                                        {t('operatorReview.drawer.declineReason')}{' '}
                                                                                                        {!review?.declineReason && (
                                                                                                            <span style={{ color: token.colorError, fontWeight: 'normal', marginLeft: 4 }}>
                                                                                                                * {t('operatorReview.drawer.required')}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </Text>
                                                                                                    <Radio.Group
                                                                                                        value={review?.declineReason}
                                                                                                        onChange={(e) => handleReviewChange(task.taskId, 'declineReason', e.target.value)}
                                                                                                    >
                                                                                                        <Space orientation="vertical">
                                                                                                            {declineReasons.map((reason) => (
                                                                                                                <Radio key={reason.name} value={reason.name}>
                                                                                                                    {reason.nameVi} ({reason.nameEn})
                                                                                                                </Radio>
                                                                                                            ))}
                                                                                                        </Space>
                                                                                                    </Radio.Group>
                                                                                                    {!review?.declineReason && (
                                                                                                        <div style={{ marginTop: 8, color: token.colorError, fontSize: 12 }}>
                                                                                                            <InfoCircleOutlined style={{ marginRight: 4 }} />
                                                                                                            {t('operatorReview.drawer.pleaseSelectReason')}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>

                                                                                                <div style={{ marginBottom: 16 }}>
                                                                                                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                                                                                                        {t('operatorReview.drawer.comments')}
                                                                                                    </Text>
                                                                                                    <TextArea
                                                                                                        rows={2}
                                                                                                        placeholder={t('operatorReview.drawer.provideDetails')}
                                                                                                        value={review?.declineComment || ''}
                                                                                                        onChange={(e) => handleReviewChange(task.taskId, 'declineComment', e.target.value)}
                                                                                                        size="small"
                                                                                                    />
                                                                                                </div>

                                                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                                                                    <Button
                                                                                                        size="small"
                                                                                                        onClick={() => {
                                                                                                            handleReviewChange(task.taskId, 'reviewStatus', 'PENDING');
                                                                                                            handleReviewChange(task.taskId, 'declineReason', null);
                                                                                                            handleReviewChange(task.taskId, 'declineComment', null);
                                                                                                        }}
                                                                                                        disabled={submittingTasks[task.taskId]}
                                                                                                    >
                                                                                                        {t('operatorReview.drawer.cancel')}
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        type="primary"
                                                                                                        danger
                                                                                                        size="small"
                                                                                                        onClick={() => handleDeclineSingle(task.taskId, task.myReview.taskReviewId)}
                                                                                                        loading={submittingTasks[task.taskId]}
                                                                                                    >
                                                                                                        {t('operatorReview.drawer.confirmDecline')}
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </Card>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    );
                                }
                            )
                        )}
                    </div>
                </div>
            )}
        </Drawer>
    );
};
