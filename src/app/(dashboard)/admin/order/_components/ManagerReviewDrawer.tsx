import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Descriptions, Tag, Button, Spin, theme, Drawer, Table, Typography, Space, Empty, Collapse, Flex, Timeline, Segmented } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { orderActions } from '@/stores/OrderStore';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { OrderManagerReviewTask, OrderManagerReviewDrawing } from '@/types';

const { Text, Title } = Typography;
type ReviewTaskFilter = 'ALL' | 'DECLINED' | 'PENDING' | 'UNASSIGNED' | 'CONFIRMED';

const formatLeadtime = (seconds?: number): string => {
    if (seconds === undefined || seconds === null) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h === 0) parts.push(`${m}m`);
    return parts.join(' ');
};

const getLocalizedStatusLabel = (status: string, t: any): string => {
    switch (status) {
        case 'REVIEWING': return t('orderManagement.stats.draft');
        case 'CONFIRMED': return t('orderManagement.stats.inProduction');
        case 'COMPLETED': return t('orderManagement.stats.completed') || 'Completed';
        case 'CANCELLED': return t('orderManagement.stats.cancelled') || 'Cancelled';
        default: return status;
    }
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'REVIEWING': return 'blue';
        case 'CONFIRMED': return 'green';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'error';
        default: return 'default';
    }
};

const getProductionStatusLabel = (status: string, t: any): string => {
    switch (status) {
        case 'LOCKED': return t('orderManagement.detail.kanban.locked') || 'Locked';
        case 'TO_DO': return t('orderManagement.detail.kanban.todo') || 'To Do';
        case 'IN_PROGRESS': return t('orderManagement.detail.kanban.inProgress') || 'In Progress';
        case 'PAUSED': return t('orderManagement.detail.kanban.paused') || 'Paused';
        case 'QC_CHECK': return t('orderManagement.detail.kanban.qcCheck') || 'QC Check';
        case 'COMPLETE': return t('orderManagement.detail.kanban.complete') || 'Completed';
        default: return status;
    }
};

const getProductionStatusColor = (status: string): string => {
    switch (status) {
        case 'LOCKED': return 'default';
        case 'TO_DO': return 'blue';
        case 'IN_PROGRESS': return 'processing';
        case 'PAUSED': return 'error';
        case 'QC_CHECK': return 'warning';
        case 'COMPLETE': return 'success';
        default: return 'default';
    }
};

export const ManagerReviewDrawer = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { token } = theme.useToken();
    const [reviewTaskFilters, setReviewTaskFilters] = useState<Record<number, ReviewTaskFilter>>({});

    const {
        isManagerReviewDrawerOpen,
        selectedManagerReviewOrderId,
        managerReviewData,
        isManagerReviewLoading,
    } = useAppSelector((state) => state.order);

    useEffect(() => {
        if (isManagerReviewDrawerOpen && selectedManagerReviewOrderId) {
            dispatch(orderActions.fetchManagerReviewDashboard(selectedManagerReviewOrderId));
        }
    }, [isManagerReviewDrawerOpen, selectedManagerReviewOrderId, dispatch]);

    const handleClose = () => {
        dispatch(orderActions.closeManagerReviewDrawer());
    };

    const getFilteredReviewTasks = (
        tasks: OrderManagerReviewTask[],
        filter: ReviewTaskFilter
    ) => {
        switch (filter) {
            case 'DECLINED':
                return tasks.filter((task) =>
                    task.reviews.some((review) => review.reviewStatus === 'DECLINED')
                );
            case 'PENDING':
                return tasks.filter((task) =>
                    task.reviews.some((review) => review.reviewStatus === 'PENDING')
                );
            case 'UNASSIGNED':
                return tasks.filter((task) => task.reviews.length === 0);
            case 'CONFIRMED':
                return tasks.filter(
                    (task) =>
                        task.reviews.length > 0 &&
                        task.reviews.every((review) => review.reviewStatus === 'CONFIRMED')
                );
            default:
                return tasks;
        }
    };

    const renderExpandedRow = (record: OrderManagerReviewTask) => {
        if (!record.reviews || record.reviews.length === 0) {
            return (
                <div style={{ padding: '8px 24px' }}>
                    <Empty description={t('managerReview.drawer.reviews.noReviews') || 'Chưa có lượt đánh giá nào'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            );
        }

        return (
            <div style={{ padding: '16px 24px', background: token.colorBgContainer, borderRadius: 8, margin: '8px 0', border: `1px solid ${token.colorBorderSecondary}` }}>
                <Title level={5} style={{ marginBottom: 16 }}>
                    {t('managerReview.drawer.reviews.detailTitle') || 'Chi tiết Đánh giá & Lịch sử Hoạt động'}
                </Title>

                <Row gutter={[16, 16]}>
                    {record.reviews.map((review) => (
                        <Col span={24} key={review.taskReviewId}>
                            <Card
                                size="small"
                                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                                styles={{ header: { background: 'rgba(0,0,0,0.01)' } }}
                                title={
                                    <Flex justify="space-between" align="center">
                                        <Space>
                                            <UserOutlined style={{ color: token.colorPrimary }} />
                                            <Text strong>{review.operatorFullName}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>({review.operatorUserCode})</Text>
                                        </Space>
                                        <Space>
                                            {review.reviewedAt && (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(review.reviewedAt).format('DD/MM/YYYY HH:mm')}
                                                </Text>
                                            )}
                                            <Tag color={
                                                review.reviewStatus === 'CONFIRMED' ? 'success' :
                                                    review.reviewStatus === 'DECLINED' ? 'error' :
                                                        review.reviewStatus === 'PENDING' ? 'gold' : 'default'
                                            }>
                                                {review.reviewStatus === 'CONFIRMED' ? t('managerReview.drawer.stats.confirmed') :
                                                    review.reviewStatus === 'DECLINED' ? t('managerReview.drawer.stats.declined') :
                                                        review.reviewStatus === 'PENDING' ? t('managerReview.drawer.stats.pending') : review.reviewStatus}
                                            </Tag>
                                        </Space>
                                    </Flex>
                                }
                            >
                                {review.reviewStatus === 'DECLINED' && (
                                    <div style={{ marginBottom: 16, padding: 12, background: 'rgba(255, 77, 79, 0.02)', borderRadius: 6, border: '1px solid rgba(255, 77, 79, 0.1)' }}>
                                        <Text type="danger" strong style={{ fontSize: 13, display: 'block' }}>
                                            {t('operatorReview.drawer.declineReason')}: {review.declineReason}
                                        </Text>
                                        {review.declineComment && (
                                            <Text type="secondary" italic style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                                "{review.declineComment}"
                                            </Text>
                                        )}
                                    </div>
                                )}

                                <div style={{ marginTop: 8 }}>
                                    <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                                        {t('managerReview.drawer.reviews.activityLog') || 'Lịch sử hoạt động'}
                                    </Text>

                                    {!review.activityLogs || review.activityLogs.length === 0 ? (
                                        <Text type="secondary" italic style={{ fontSize: 12 }}>{t('managerReview.drawer.reviews.noLogs') || 'Không có bản ghi hoạt động nào'}</Text>
                                    ) : (
                                        <Timeline
                                            items={review.activityLogs.map((log) => {
                                                const isChange = log.oldValue !== undefined && log.newValue !== undefined;
                                                return {
                                                    color: log.newValue === 'CONFIRMED' ? 'green' :
                                                        log.newValue === 'DECLINED' ? 'red' :
                                                            log.newValue === 'PENDING' ? 'gold' : 'blue',
                                                    children: (
                                                        <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                                                            <Flex justify="space-between" align="center">
                                                                <Text strong style={{ fontSize: 12 }}>{log.description}</Text>
                                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                                    {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                                                                </Text>
                                                            </Flex>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                {t('managerReview.drawer.reviews.performedBy') || 'Thực hiện bởi'}: <Text strong style={{ fontSize: 11 }}>{log.userFullName}</Text>
                                                            </Text>
                                                            {isChange && log.oldValue && log.newValue && (
                                                                <Space style={{ fontSize: 11, background: token.colorBgLayout, padding: '4px 8px', borderRadius: 4, marginTop: 2, alignItems: 'center' }}>
                                                                    <Tag variant="filled" color="default" style={{ margin: 0 }}>
                                                                        <Text delete type="secondary" style={{ fontSize: 11 }}>{log.oldValue}</Text>
                                                                    </Tag>
                                                                    <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                                                                    <Tag variant="filled" color={
                                                                        log.newValue === 'CONFIRMED' ? 'success' :
                                                                            log.newValue === 'DECLINED' ? 'error' :
                                                                                log.newValue === 'PENDING' ? 'warning' : 'processing'
                                                                    } style={{ margin: 0 }}>
                                                                        {log.newValue}
                                                                    </Tag>
                                                                </Space>
                                                            )}
                                                        </Space>
                                                    )
                                                };
                                            })}
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };

    if (isManagerReviewLoading) {
        return (
            <Drawer
                title={t('managerReview.drawer.title')}
                placement="right"
                size="75%"
                onClose={handleClose}
                open={isManagerReviewDrawerOpen}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <Spin size="large" />
                    <Text type="secondary" style={{ marginTop: 16 }}>{t('common.loading')}</Text>
                </div>
            </Drawer>
        );
    }

    if (!managerReviewData) {
        return (
            <Drawer
                title={t('managerReview.drawer.title')}
                placement="right"
                size="75%"
                onClose={handleClose}
                open={isManagerReviewDrawerOpen}
            >
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <Empty description={t('common.noData')} />
                </div>
            </Drawer>
        );
    }

    const {
        order,
        totalTasks,
        confirmedTasks,
        allAssignedConfirmed,
        declinedTasks,
        pendingTasks,
        unassignedTasks,
        orderDrawings
    } = managerReviewData;

    const completionPercentage = totalTasks
        ? Math.round((confirmedTasks / totalTasks) * 100)
        : 0;

    const getReviewStatusColor = (): string => {
        if (allAssignedConfirmed) return '#52c41a';
        if (declinedTasks > 0) return '#ff4d4f';
        if (pendingTasks > 0) return '#faad14';
        return '#1890ff';
    };

    return (
        <Drawer
            title={`${t('managerReview.drawer.title')}: ${order.orderCode}`}
            placement="right"
            size="75%"
            onClose={handleClose}
            open={isManagerReviewDrawerOpen}
            styles={{
                header: { borderBottom: `1px solid ${token.colorBorderSecondary}` },
                body: { background: token.colorBgLayout, padding: '16px 24px' }
            }}
            extra={
                <Button onClick={handleClose}>
                    {t('managerReview.drawer.close')}
                </Button>
            }
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                .review-row-declined { background-color: rgba(255, 77, 79, 0.02) !important; }
                .review-row-unassigned { background-color: rgba(250, 173, 20, 0.02) !important; }
                .review-row-declined:hover > td { background-color: rgba(255, 77, 79, 0.05) !important; }
                .review-row-unassigned:hover > td { background-color: rgba(250, 173, 20, 0.05) !important; }
                .review-row-pending { background-color: rgba(216, 154, 0, 0.01) !important; }
                .review-row-pending:hover > td { background-color: rgba(216, 154, 0, 0.04) !important; }
            `}} />
            <Card style={{ marginBottom: 16, borderRadius: 12 }}>
                <Descriptions column={{ xs: 1, sm: 2, md: 3, lg: 4 }} bordered={false} size="middle">
                    <Descriptions.Item label={t('orderManagement.list.table.orderCode')}>
                        <Text strong style={{ fontFamily: 'monospace' }}>{order.orderCode}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.orderName')}>{order.orderName}</Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.customer')}>{order.customerName}</Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.status')}>
                        <Tag color={getStatusColor(order.orderStatus)}>
                            {getLocalizedStatusLabel(order.orderStatus, t)}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.priority')}>
                        <Tag
                            color={
                                order.orderPriority === 'URGENT' ? 'red' :
                                    order.orderPriority === 'HIGH' ? 'orange' :
                                        order.orderPriority === 'MEDIUM' ? 'blue' : 'green'
                            }
                        >
                            {t(`orderManagement.form.priorities.${order.orderPriority.toLowerCase()}`)}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.expectedStartDate')}>
                        {order.expectedStartDate ? dayjs(order.expectedStartDate).format('DD/MM/YYYY') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.expectedEndDate')}>
                        {order.expectedEndDate ? dayjs(order.expectedEndDate).format('DD/MM/YYYY') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.totalEstimatedLeadtime')}>
                        {formatLeadtime(order.totalEstimatedLeadtime)}
                    </Descriptions.Item>
                    {order.cancellationReason && (
                        <Descriptions.Item label={t('orderManagement.detail.overview.cancellationReason')} span={2}>
                            <Text type="danger">{order.cancellationReason}</Text>
                        </Descriptions.Item>
                    )}
                    {order.penaltyAmount !== undefined && order.penaltyAmount !== null && order.penaltyAmount > 0 && (
                        <Descriptions.Item label={t('orderManagement.detail.overview.penaltyAmount')}>
                            <Text type="danger" strong>{order.penaltyAmount.toLocaleString('vi-VN')} VND</Text>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12, height: '100%' }}>
                        <Statistic
                            title={t('managerReview.drawer.stats.completion')}
                            value={completionPercentage}
                            suffix="%"
                            styles={{ content: { color: getReviewStatusColor(), fontWeight: 700 } }}
                        />
                        <Progress
                            percent={completionPercentage}
                            strokeColor={getReviewStatusColor()}
                            status="active"
                            style={{ marginTop: 16 }}
                        />
                        {allAssignedConfirmed && (
                            <Tag
                                color="success"
                                icon={<CheckCircleOutlined />}
                                style={{ marginTop: 16, borderRadius: 4 }}
                            >
                                {t('managerReview.drawer.stats.allConfirmed')}
                            </Tag>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card style={{ borderRadius: 12, height: '100%' }}>
                        <Statistic
                            title={t('managerReview.drawer.stats.totalTasks')}
                            value={totalTasks}
                            prefix={<UserOutlined style={{ color: token.colorPrimary }} />}
                            styles={{ content: { fontWeight: 700 } }}
                        />
                        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Tag color="processing">{confirmedTasks} {t('managerReview.drawer.stats.confirmed')}</Tag>
                            <Tag color="warning">{pendingTasks} {t('managerReview.drawer.stats.pending')}</Tag>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {[
                    {
                        label: t('managerReview.drawer.stats.unassigned'),
                        value: unassignedTasks,
                        icon: WarningOutlined,
                        color: unassignedTasks > 0 ? token.colorError : token.colorPrimary,
                        borderColor: unassignedTasks > 0 ? token.colorError : token.colorTextQuaternary,
                        backgroundColor: unassignedTasks > 0 ? `rgba(255, 77, 79, 0.04)` : `rgba(0, 0, 0, 0.02)`,
                    },
                    {
                        label: t('managerReview.drawer.stats.pending'),
                        value: pendingTasks,
                        icon: ClockCircleOutlined,
                        color: token.colorPrimary,
                        borderColor: token.colorWarning,
                        backgroundColor: `rgba(250, 173, 20, 0.04)`,
                    },
                    {
                        label: t('managerReview.drawer.stats.confirmed'),
                        value: confirmedTasks,
                        icon: CheckCircleOutlined,
                        color: token.colorPrimary,
                        borderColor: token.colorSuccess,
                        backgroundColor: `rgba(82, 196, 26, 0.04)`,
                    },
                    {
                        label: t('managerReview.drawer.stats.declined'),
                        value: declinedTasks,
                        icon: CloseCircleOutlined,
                        color: declinedTasks > 0 ? token.colorError : token.colorPrimary,
                        borderColor: declinedTasks > 0 ? token.colorError : token.colorTextQuaternary,
                        backgroundColor: declinedTasks > 0 ? `rgba(255, 77, 79, 0.04)` : `rgba(0, 0, 0, 0.02)`,
                    },
                ].map((stat: {
                    label: string;
                    value: number;
                    icon: any;
                    color: string;
                    borderColor: string;
                    backgroundColor: string;
                }, index: number) => {
                    const IconComponent = stat.icon;
                    return (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card
                                variant="borderless"
                                hoverable
                                style={{
                                    borderRadius: 12,
                                    boxShadow: token.boxShadow,
                                    height: '100%',
                                    border: `1px solid ${stat.borderColor}`,
                                    background: stat.backgroundColor,
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: 80,
                                        height: 80,
                                        background: `${stat.borderColor}15`,
                                        borderBottomLeftRadius: '100%',
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: token.colorPrimary,
                                        }}
                                    >
                                        {stat.label}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: token.colorBgContainer,
                                            }}
                                        >
                                            <IconComponent
                                                style={{
                                                    color: stat.borderColor,
                                                    fontSize: 24,
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                color: stat.color,
                                                fontSize: 32,
                                                fontWeight: 700,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {stat.value.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {declinedTasks > 0 && (
                <Card
                    title={t('managerReview.drawer.actions.required')}
                    style={{ marginTop: 16, borderColor: token.colorError, borderRadius: 12 }}
                    styles={{ header: { background: `rgba(255, 77, 79, 0.05)` } }}
                >
                    <Space orientation="vertical" style={{ width: '100%' }}>
                        <Tag color="error" icon={<WarningOutlined />} style={{ padding: '4px 8px' }}>
                            {t('managerReview.drawer.actions.declinedWarning', { count: declinedTasks })}
                        </Tag>
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            {t('managerReview.drawer.actions.declinedHint')}
                        </Text>
                    </Space>
                </Card>
            )}

            {unassignedTasks > 0 && (
                <Card
                    title={t('managerReview.drawer.actions.required')}
                    style={{ marginTop: 16, borderColor: token.colorWarning, borderRadius: 12 }}
                    styles={{ header: { background: `#fff1b8` } }}
                >
                    <Space orientation="vertical" style={{ width: '100%' }}>
                        <Tag color="warning" icon={<WarningOutlined />} style={{ padding: '4px 8px' }}>
                            {t('managerReview.drawer.actions.unassignedWarning', { count: unassignedTasks })}
                        </Tag>
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            {t('managerReview.drawer.actions.unassignedHint')}
                        </Text>
                    </Space>
                </Card>
            )}

            {/* Complete Drawings Details */}
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
                {t('orderManagement.detail.overview.drawingList')}
            </Title>

            <Collapse
                style={{ marginBottom: 32, borderRadius: 12, overflow: 'hidden' }}
                expandIconPlacement="start"
                defaultActiveKey={orderDrawings.map((d: OrderManagerReviewDrawing) => String(d.orderDrawingId))}
                items={orderDrawings.map((drawing: OrderManagerReviewDrawing) => {
                    const drawingTasks = drawing.tasks;
                    const total = drawingTasks.length;
                    const unassigned = drawingTasks.filter(t => t.reviews.length === 0).length;
                    const declined = drawingTasks.filter(t => t.reviews.some(r => r.reviewStatus === 'DECLINED')).length;
                    const pending = drawingTasks.filter(t => t.reviews.some(r => r.reviewStatus === 'PENDING')).length;
                    const confirmed = drawingTasks.filter(t => t.reviews.some(r => r.reviewStatus === 'CONFIRMED')).length;
                    const activeFilter = reviewTaskFilters[drawing.orderDrawingId] || 'ALL';
                    const filteredTasks = getFilteredReviewTasks(drawingTasks, activeFilter);

                    const label = (
                        <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 8 }} wrap="wrap" gap={8}>
                            <Space size={12}>
                                <Text strong style={{ fontSize: 15 }}>{drawing.drawingCode}</Text>
                                <Text type="secondary">{drawing.drawingCodeName}</Text>
                            </Space>
                            <Space size={8} wrap>
                                <Tag color="blue" style={{ margin: 0 }}>
                                    {t('managerReview.drawer.stats.totalTasks')}: {total}
                                </Tag>
                                {declined > 0 && (
                                    <Tag color="error" style={{ margin: 0 }}>
                                        {t('managerReview.drawer.stats.declined')}: {declined}
                                    </Tag>
                                )}
                                {unassigned > 0 && (
                                    <Tag color="warning" style={{ margin: 0 }}>
                                        {t('managerReview.drawer.stats.unassigned')}: {unassigned}
                                    </Tag>
                                )}
                                {pending > 0 && (
                                    <Tag color="gold" style={{ margin: 0 }}>
                                        {t('managerReview.drawer.stats.pending')}: {pending}
                                    </Tag>
                                )}
                                {confirmed > 0 && (
                                    <Tag color="success" style={{ margin: 0 }}>
                                        {t('managerReview.drawer.stats.confirmed')}: {confirmed}
                                    </Tag>
                                )}
                            </Space>
                        </Flex>
                    );

                    return {
                        key: String(drawing.orderDrawingId),
                        label: label,
                        children: (
                            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                                <Flex justify="space-between" align="center" gap={12} wrap="wrap">
                                    <Segmented
                                        size="small"
                                        value={activeFilter}
                                        onChange={(value) =>
                                            setReviewTaskFilters((prev) => ({
                                                ...prev,
                                                [drawing.orderDrawingId]: value as ReviewTaskFilter,
                                            }))
                                        }
                                        options={[
                                            {
                                                label: `${t('common.all', { defaultValue: 'All' })} (${total})`,
                                                value: 'ALL',
                                            },
                                            {
                                                label: `${t('managerReview.drawer.stats.declined')} (${declined})`,
                                                value: 'DECLINED',
                                            },
                                            {
                                                label: `${t('managerReview.drawer.stats.pending')} (${pending})`,
                                                value: 'PENDING',
                                            },
                                            {
                                                label: `${t('managerReview.drawer.stats.unassigned')} (${unassigned})`,
                                                value: 'UNASSIGNED',
                                            },
                                            {
                                                label: `${t('managerReview.drawer.stats.confirmed')} (${confirmed})`,
                                                value: 'CONFIRMED',
                                            },
                                        ]}
                                    />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {filteredTasks.length}/{total}
                                    </Text>
                                </Flex>
                                <Table
                                    dataSource={filteredTasks}
                                    rowKey="taskId"
                                    pagination={false}
                                    size="small"
                                    rowClassName={(record) => {
                                        const isDeclined = record.reviews.some(r => r.reviewStatus === 'DECLINED');
                                        const isUnassigned = record.reviews.length === 0;
                                        const isPending = record.reviews.some(r => r.reviewStatus === 'PENDING');
                                        if (isDeclined) return 'review-row-declined';
                                        if (isUnassigned) return 'review-row-unassigned';
                                        if (isPending) return 'review-row-pending';
                                        return '';
                                    }}
                                    expandable={{
                                        expandedRowRender: renderExpandedRow,
                                        rowExpandable: (record) => record.reviews && record.reviews.length > 0,
                                    }}
                                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('managerReview.drawer.taskList.empty')} /> }}
                                    columns={[
                                    {
                                        title: t('orderManagement.detail.tasks.taskName'),
                                        key: 'taskName',
                                        render: (_: any, record: OrderManagerReviewTask) => (
                                            <Space size={12}>
                                                <div
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        background: token.colorBgLayout,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: `1px solid ${token.colorBorder}`,
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        color: token.colorTextSecondary,
                                                    }}
                                                >
                                                    {record.stepOrder}
                                                </div>
                                                <Space orientation="vertical" size={0}>
                                                    <Text strong>{record.taskName}</Text>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {t('orderManagement.drawing.item')} {record.stepOrder}: {record.stepName}
                                                    </Text>
                                                </Space>
                                            </Space>
                                        )
                                    },
                                    {
                                        title: t('orderManagement.list.table.status') + ' (Sản xuất)',
                                        key: 'taskStatus',
                                        width: 160,
                                        render: (_: any, record: OrderManagerReviewTask) => (
                                            <Tag color={getProductionStatusColor(record.taskStatus)} style={{ fontWeight: 500, margin: 0 }}>
                                                {getProductionStatusLabel(record.taskStatus, t)}
                                            </Tag>
                                        )
                                    },
                                    {
                                        title: 'Trạng thái Duyệt',
                                        key: 'status',
                                        width: 150,
                                        render: (_: any, record: OrderManagerReviewTask) => {
                                            const isDeclined = record.reviews.some(r => r.reviewStatus === 'DECLINED');
                                            const isUnassigned = record.reviews.length === 0;
                                            const isPending = record.reviews.some(r => r.reviewStatus === 'PENDING');

                                            if (isDeclined) return <Tag color="error" style={{ margin: 0 }}>{t('managerReview.drawer.stats.declined')}</Tag>;
                                            if (isUnassigned) return <Tag color="warning" style={{ margin: 0 }}>{t('managerReview.drawer.stats.unassigned')}</Tag>;
                                            if (isPending) return <Tag color="gold" style={{ margin: 0 }}>{t('managerReview.drawer.stats.pending')}</Tag>;
                                            return <Tag color="success" style={{ margin: 0 }}>{t('managerReview.drawer.stats.confirmed')}</Tag>;
                                        }
                                    },
                                    {
                                        title: t('operatorReview.page.operator'),
                                        key: 'operator',
                                        width: 180,
                                        render: (_: any, record: OrderManagerReviewTask) => {
                                            const operatorNames = record.reviews.map(r => r.operatorFullName).join(', ');
                                            return (
                                                <Space size={6}>
                                                    <UserOutlined style={{ color: token.colorTextTertiary, fontSize: 12 }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{operatorNames || t('orderManagement.detail.kanban.unassigned')}</Text>
                                                </Space>
                                            );
                                        }
                                    },
                                    {
                                        title: t('operatorReview.drawer.declineReason') + ' / Ghi chú',
                                        key: 'comments',
                                        render: (_: any, record: OrderManagerReviewTask) => {
                                            const declinedReview = record.reviews.find(r => r.reviewStatus === 'DECLINED');
                                            const hasComment = record.reviews.some(r => r.declineComment);
                                            if (!declinedReview && !hasComment) return <Text type="secondary" italic style={{ fontSize: 12 }}>-</Text>;
                                            return (
                                                <Space orientation="vertical" size={2}>
                                                    {declinedReview && (
                                                        <Tag color="red" style={{ border: 'none', margin: 0, padding: '0 4px', fontSize: 11 }}>
                                                            {declinedReview.declineReason}
                                                        </Tag>
                                                    )}
                                                    {record.reviews.map((r, i) => r.declineComment && (
                                                        <Text key={i} type="secondary" italic style={{ fontSize: 11, display: 'block' }}>
                                                            {r.operatorFullName}: "{r.declineComment}"
                                                        </Text>
                                                    ))}
                                                </Space>
                                            );
                                        }
                                    }
                                    ]}
                                />
                            </Space>
                        )
                    };
                })}
            />
        </Drawer>
    );
};
