'use client';

import React, { useEffect } from 'react';
import {
    Button,
    Badge,
    Card,
    Progress,
    Tabs,
    Drawer,
    Typography,
    Space,
    Flex,
    Spin,
    Tag,
    Popconfirm,
    Descriptions,
    Divider,
    Empty,
    message,
    theme,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
    EditOutlined,
    AimOutlined,
    PlayCircleOutlined,
    UserOutlined,
    PaperClipOutlined,
    DownOutlined,
    CalendarOutlined,
    PhoneOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    DollarOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { orderActions } from '@/stores/OrderStore';
import { TaskAssignment, TaskResponse, OrderDrawingSummaryResponse, OrderAttachment, TaskReview } from '@/types';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { DrawingCodeService, OrderService } from '@/services';
import { DemoOrderService, USE_MOCK_ORDERS } from '@/mockData/admin/orders';


const { Text } = Typography;

const getOrderStatusTagStyle = (status: string, token: any) => {
    const baseStyle = { margin: 0, borderRadius: token.borderRadiusSM };
    switch (status) {
        case 'REVIEWING':
            return { ...baseStyle, color: token.colorInfo, background: token.colorInfoBg, borderColor: token.colorInfoBorder };
        case 'CONFIRMED':
        case 'IN_PROGRESS':
        case 'COMPLETED':
            return { ...baseStyle, color: token.colorSuccess, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder };
        case 'CANCELLED':
            return { ...baseStyle, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder };
        default:
            return { ...baseStyle, color: token.colorTextSecondary, background: token.colorFillTertiary, borderColor: token.colorBorder };
    }
};

const getPriorityTagStyle = (priority: string, token: any) => {
    const baseStyle = { margin: 0, borderRadius: token.borderRadiusSM };
    switch (priority) {
        case 'LOW':
            return { ...baseStyle, color: token.colorSuccess, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder };
        case 'MEDIUM':
            return { ...baseStyle, color: token.colorWarning, background: token.colorWarningBg, borderColor: token.colorWarningBorder };
        case 'HIGH':
        case 'URGENT':
            return { ...baseStyle, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder };
        default:
            return { ...baseStyle, color: token.colorTextSecondary, background: token.colorFillTertiary, borderColor: token.colorBorder };
    }
};

const getTaskStatusTagStyle = (status: string, token: any) => {
    const baseStyle = { margin: 0, borderRadius: token.borderRadiusSM };
    switch (status) {
        case 'TO_DO':
            return { ...baseStyle, color: token.colorInfo, background: token.colorInfoBg, borderColor: token.colorInfoBorder };
        case 'IN_PROGRESS':
            return { ...baseStyle, color: token.colorWarning, background: token.colorWarningBg, borderColor: token.colorWarningBorder };
        case 'COMPLETE':
            return { ...baseStyle, color: token.colorSuccess, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder };
        case 'PAUSED':
        case 'CANCELLED':
            return { ...baseStyle, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder };
        default:
            return { ...baseStyle, color: token.colorTextSecondary, background: token.colorFillTertiary, borderColor: token.colorBorder };
    }
};

const getReviewStatusTagStyle = (status: string, token: any) => {
    if (status === 'CONFIRMED') {
        return { margin: 0, borderRadius: token.borderRadiusSM, color: token.colorSuccess, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder };
    }
    if (status === 'DECLINED') {
        return { margin: 0, borderRadius: token.borderRadiusSM, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder };
    }
    return { margin: 0, borderRadius: token.borderRadiusSM, color: token.colorWarning, background: token.colorWarningBg, borderColor: token.colorWarningBorder };
};

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
        case 'IN_PROGRESS': return t('orderManagement.stats.inProgress');
        case 'COMPLETED': return t('orderManagement.stats.completed');
        case 'CANCELLED': return 'Cancelled';
        default: return status;
    }
};

const getLocalizedPriorityLabel = (priority: string, t: any): string => {
    return t(`orderManagement.form.priorities.${priority.toLowerCase()}`, { defaultValue: priority });
};

const getLocalizedTaskStatus = (status: string, t: any): string => {
    switch (status) {
        case 'LOCKED': return t('orderManagement.detail.kanban.locked');
        case 'TO_DO': return t('orderManagement.detail.kanban.todo');
        case 'IN_PROGRESS': return t('orderManagement.detail.kanban.inProgress');
        case 'PAUSED': return t('orderManagement.detail.kanban.paused');
        case 'QC_CHECK': return t('orderManagement.detail.kanban.qcCheck');
        case 'COMPLETE': return t('orderManagement.detail.kanban.complete');
        default: return status;
    }
};

export const OrderDetailDrawer: React.FC = () => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const dispatch = useAppDispatch();

    // Lấy UI state từ Redux OrderStore
    const {
        isDetailDrawerOpen: isOrderDetailDrawerOpen,
        selectedOrderId,
        activeDetailTab: orderDetailActiveTab,
    } = useAppSelector((state) => state.order);

    // Redux Store Data
    const {
        currentOrder,
        orderDrawings,
        isLoadingDetail,
        isLoadingDrawings,
        isSubmitting
    } = useAppSelector(
        (state) => state.order
    );

    const [, setDrawingTemplates] = React.useState<DrawingCodePickingResponse[]>([]);

    // State phục vụ Lazy Load cho Tab 2
    const [loadedDrawingDetails, setLoadedDrawingDetails] = React.useState<Record<string, TaskResponse[]>>({});
    const [loadingDrawingsMap, setLoadingDrawingsMap] = React.useState<Record<string, boolean>>({});
    const [expandedDrawingIds, setExpandedDrawingIds] = React.useState<number[]>([]);

    // Clear state khi Drawer đóng
    useEffect(() => {
        if (!isOrderDetailDrawerOpen) {
            setLoadedDrawingDetails({});
            setLoadingDrawingsMap({});
            setExpandedDrawingIds([]);
        }
    }, [isOrderDetailDrawerOpen]);

    // 1. Fetch Data & Lắng nghe WebSocket
    useEffect(() => {
        if (selectedOrderId && isOrderDetailDrawerOpen) {
            let isMounted = true;
            // Load detail, drawings
            dispatch(orderActions.fetchOrderDetail(selectedOrderId));
            dispatch(orderActions.fetchOrderDrawings(selectedOrderId));

            // Load templates if needed (for DRAFT orders)
            const loadDrawingTemplates = async () => {
                try {
                    const templates = USE_MOCK_ORDERS
                        ? await DemoOrderService.getDrawingTemplates()
                        : await DrawingCodeService.getDrawingCodesForPicking();
                    if (isMounted) {
                        setDrawingTemplates(templates);
                    }
                } catch (error) {
                    console.error('Failed to load drawing templates:', error);
                }
            };

            loadDrawingTemplates();

            return () => {
                isMounted = false;
                dispatch(orderActions.clearCurrentOrder());
            };
        }
    }, [selectedOrderId, isOrderDetailDrawerOpen, dispatch]);

    // 2. Handlers
    const handleToggleDrawingDetail = async (orderDrawingId: number) => {
        if (!selectedOrderId) return;

        const isExpanded = expandedDrawingIds.includes(orderDrawingId);
        if (isExpanded) {
            setExpandedDrawingIds(prev => prev.filter(id => id !== orderDrawingId));
            return;
        }

        // Mở rộng trước
        setExpandedDrawingIds(prev => [...prev, orderDrawingId]);

        // Nếu đã load rồi thì bỏ qua không gọi API nữa
        if (loadedDrawingDetails[orderDrawingId]) return;

        // Gọi API tải chi tiết
        setLoadingDrawingsMap(prev => ({ ...prev, [orderDrawingId]: true }));
        try {
            const detail = USE_MOCK_ORDERS
                ? await DemoOrderService.getOrderDrawingDetail(selectedOrderId, String(orderDrawingId))
                : await OrderService.getOrderDrawingDetail(selectedOrderId, String(orderDrawingId));
            setLoadedDrawingDetails(prev => ({ ...prev, [orderDrawingId]: detail }));
        } catch (error) {
            console.error('Error fetching drawing detail:', error);
            message.error(t('orderManagement.form.messages.fetchTemplatesError'));
        } finally {
            setLoadingDrawingsMap(prev => ({ ...prev, [orderDrawingId]: false }));
        }
    };

    const handleClose = () => dispatch(orderActions.closeOrderDetailDrawer());

    const handleEdit = () => {
        if (
            currentOrder &&
            currentOrder.orderStatus !== 'CANCELLED' &&
            currentOrder.orderStatus !== 'COMPLETED'
        ) {
            dispatch(orderActions.openOrderForm('edit', currentOrder.orderId));
        }
    };

    const handleConfirmOrder = async () => {
        if (!currentOrder) return;
        const success = await dispatch(orderActions.confirmOrder(currentOrder.orderId));
        if (success) {
            message.success(t('orderManagement.detail.messages.confirmSuccess'));
        }
    };

    // 3. Render Overview Tab
    const renderOrderOverview = () => (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Order Basic Info */}
            <Card
                title={
                    <Space>
                        <FileTextOutlined style={{ color: token.colorPrimary }} />
                        <Text strong>{t('orderManagement.form.sections.orderInfo')}</Text>
                    </Space>
                }
                style={{ borderRadius: 12 }}
                styles={{ body: { padding: '16px 24px' } }}
            >
                <Descriptions
                    column={{ xs: 1, sm: 2, md: 3 }}
                    size="middle"
                    labelStyle={{ color: token.colorTextSecondary, fontWeight: 500, fontSize: 13 }}
                    contentStyle={{ fontWeight: 600, fontSize: 13 }}
                >
                    <Descriptions.Item label={t('orderManagement.list.table.orderCode')}>
                        <Text strong style={{ color: token.colorPrimary }}>{currentOrder?.orderCode}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.orderName')}>
                        {currentOrder?.orderName || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.priority')}>
                        {currentOrder?.orderPriority && (
                            <Tag style={getPriorityTagStyle(currentOrder.orderPriority, token)}>
                                {getLocalizedPriorityLabel(currentOrder.orderPriority, t)}
                            </Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.task.reqQtyLabel')}>
                        {currentOrder?.orderRequestedQuantity ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.task.planQtyLabel')}>
                        {currentOrder?.orderPlannedQuantity ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.actualQty', { defaultValue: 'Actual Qty' })}>
                        <span style={{ color: token.colorSuccess }}>{currentOrder?.orderActualQuantity ?? 0}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.list.table.status')}>
                        {currentOrder && (
                            <Tag style={getOrderStatusTagStyle(currentOrder.orderStatus, token)}>
                                {getLocalizedStatusLabel(currentOrder.orderStatus, t)}
                            </Tag>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Schedule & Timeline */}
            <Card
                title={
                    <Space>
                        <CalendarOutlined style={{ color: token.colorPrimary }} />
                        <Text strong>{t('orderManagement.detail.overview.expectedStartDate', { defaultValue: 'Schedule & Timeline' })}</Text>
                    </Space>
                }
                style={{ borderRadius: 12 }}
                styles={{ body: { padding: '16px 24px' } }}
            >
                <Descriptions
                    column={{ xs: 1, sm: 2, md: 3 }}
                    size="middle"
                    labelStyle={{ color: token.colorTextSecondary, fontWeight: 500, fontSize: 13 }}
                    contentStyle={{ fontWeight: 600, fontSize: 13 }}
                >
                    <Descriptions.Item label={t('orderManagement.detail.overview.expectedStartDate')}>
                        {currentOrder?.expectedStartDate
                            ? format(new Date(currentOrder.expectedStartDate), 'dd/MM/yyyy')
                            : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.expectedEndDate')}>
                        {currentOrder?.expectedEndDate
                            ? format(new Date(currentOrder.expectedEndDate), 'dd/MM/yyyy')
                            : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.totalEstimatedLeadtime')}>
                        {formatLeadtime(currentOrder?.totalEstimatedLeadtime)}
                    </Descriptions.Item>
                </Descriptions>

                {/* Penalty & Cancellation */}
                {(currentOrder?.penaltyAmount || currentOrder?.cancellationReason) && (
                    <>
                        <Divider style={{ margin: '12px 0' }} />
                        <Descriptions
                            column={{ xs: 1, sm: 2 }}
                            size="middle"
                            labelStyle={{ color: token.colorTextSecondary, fontWeight: 500, fontSize: 13 }}
                            contentStyle={{ fontWeight: 600, fontSize: 13 }}
                        >
                            {currentOrder.penaltyAmount !== undefined && currentOrder.penaltyAmount !== null && currentOrder.penaltyAmount > 0 && (
                                <Descriptions.Item label={t('orderManagement.detail.overview.penaltyAmount')}>
                                    <Text type="danger" strong>
                                        <DollarOutlined style={{ marginRight: 4 }} />
                                        {currentOrder.penaltyAmount.toLocaleString('vi-VN')} VND
                                    </Text>
                                </Descriptions.Item>
                            )}
                            {currentOrder.cancellationReason && (
                                <Descriptions.Item label={t('orderManagement.detail.overview.cancellationReason')} span={2}>
                                    <Text type="danger">
                                        <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                                        {currentOrder.cancellationReason}
                                    </Text>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </>
                )}
            </Card>

            {/* Customer Info */}
            <Card
                title={
                    <Space>
                        <UserOutlined style={{ color: token.colorPrimary }} />
                        <Text strong>{t('orderManagement.form.sections.customerInfo')}</Text>
                    </Space>
                }
                style={{ borderRadius: 12 }}
                styles={{ body: { padding: '16px 24px' } }}
            >
                <Descriptions
                    column={{ xs: 1, sm: 2, md: 3 }}
                    size="middle"
                    labelStyle={{ color: token.colorTextSecondary, fontWeight: 500, fontSize: 13 }}
                    contentStyle={{ fontWeight: 600, fontSize: 13 }}
                >
                    <Descriptions.Item label={t('orderManagement.detail.overview.customer')}>
                        {currentOrder?.customerName || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.phone')}>
                        {currentOrder?.customerPhone ? (
                            <Space>
                                <PhoneOutlined />
                                {currentOrder.customerPhone}
                            </Space>
                        ) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('orderManagement.detail.overview.deadline')}>
                        {currentOrder?.expectedEndDate
                            ? format(new Date(currentOrder.expectedEndDate), 'dd/MM/yyyy')
                            : '-'}
                    </Descriptions.Item>
                </Descriptions>

                {currentOrder?.customerNote && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: 12,
                            background: token.colorWarningBg,
                            border: `1px solid ${token.colorWarningBorder}`,
                            borderRadius: 8,
                        }}
                    >
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                            <FileTextOutlined style={{ marginRight: 4 }} />
                            {t('orderManagement.detail.overview.noteLabel')}
                        </Text>
                        <Text>{currentOrder.customerNote}</Text>
                    </div>
                )}
            </Card>

            {/* Attachments */}
            {currentOrder?.orderAttachments && currentOrder.orderAttachments.length > 0 && (
                <Card
                    title={
                        <Space>
                            <PaperClipOutlined style={{ color: token.colorPrimary }} />
                            <Text strong>{t('orderManagement.detail.overview.attachments')}</Text>
                            <Tag bordered={false} style={{ margin: 0 }}>{currentOrder.orderAttachments.length}</Tag>
                        </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: '16px 24px' } }}
                >
                    <Space wrap size="small">
                        {currentOrder.orderAttachments.map((att: OrderAttachment) => (
                            <Card
                                key={att.orderAttachmentId}
                                size="small"
                                hoverable
                                style={{
                                    background: token.colorBgLayout,
                                    borderRadius: 8,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                }}
                                styles={{ body: { padding: '8px 14px' } }}
                            >
                                <Space>
                                    <PaperClipOutlined style={{ color: token.colorPrimary }} />
                                    <a
                                        href={att.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: 13, fontWeight: 500, color: token.colorPrimary }}
                                    >
                                        {att.attachmentName}
                                    </a>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {att.uploadedAt ? format(new Date(att.uploadedAt), 'dd/MM/yyyy') : ''}
                                    </Text>
                                </Space>
                            </Card>
                        ))}
                    </Space>
                </Card>
            )}

            {/* Audit Metadata */}
            {currentOrder?.auditMetaData && (
                <Card
                    title={
                        <Space>
                            <ClockCircleOutlined style={{ color: token.colorTextTertiary }} />
                            <Text type="secondary" strong>{t('orderManagement.detail.overview.createdAt', { defaultValue: 'Audit Trail' })}</Text>
                        </Space>
                    }
                    style={{ borderRadius: 12, borderColor: token.colorBorderSecondary }}
                    styles={{ body: { padding: '12px 24px' }, header: { background: token.colorBgLayout } }}
                >
                    <Descriptions
                        column={{ xs: 1, sm: 2, md: 4 }}
                        size="small"
                        labelStyle={{ color: token.colorTextTertiary, fontSize: 12 }}
                        contentStyle={{ fontSize: 12 }}
                    >
                        <Descriptions.Item label={t('orderManagement.detail.overview.createdAt')}>
                            {currentOrder.auditMetaData.createdAt
                                ? format(new Date(currentOrder.auditMetaData.createdAt), 'dd/MM/yyyy HH:mm')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.detail.overview.createdBy')}>
                            {currentOrder.auditMetaData.createdBy || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.detail.overview.updatedAt')}>
                            {currentOrder.auditMetaData.updatedAt
                                ? format(new Date(currentOrder.auditMetaData.updatedAt), 'dd/MM/yyyy HH:mm')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('orderManagement.detail.overview.updatedBy')}>
                            {currentOrder.auditMetaData.updatedBy || '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}
        </Space>
    );

    // 4. Render Kế hoạch Quy trình & Bản vẽ Tab (Lazy Loaded Drawing details)
    const renderDrawingStepsSection = (tasks: TaskResponse[]) => {
        if (!tasks || tasks.length === 0) {
            return <Empty description={t('orderManagement.detail.kanban.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }

        // Group tasks by stepOrder
        const stepMap = new Map<number, TaskResponse[]>();
        tasks.forEach((task) => {
            const stepOrder = task.stepOrder;
            if (!stepMap.has(stepOrder)) stepMap.set(stepOrder, []);
            stepMap.get(stepOrder)!.push(task);
        });

        const sortedSteps = Array.from(stepMap.entries()).sort((a, b) => a[0] - b[0]);

        return (
            <Space direction="vertical" style={{ width: '100%', paddingTop: 8 }} size="middle">
                {sortedSteps.map(([stepOrder, stepTasks]) => {
                    const firstTask = stepTasks[0];
                    return (
                        <div key={stepOrder}>
                            {/* Step Header */}
                            <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                                <Tag color={token.colorPrimary} style={{ fontWeight: 700, fontSize: 11, margin: 0, borderRadius: 4 }}>
                                    {t('orderManagement.step.stepLabel')} {stepOrder}
                                </Tag>
                                <Text strong style={{ fontSize: 14 }}>{firstTask.stepName}</Text>
                                {firstTask.requiresQc && (
                                    <Tag style={{ borderRadius: token.borderRadiusXS, margin: 0, fontSize: token.fontSizeSM, color: token.colorWarning, background: token.colorWarningBg, borderColor: token.colorWarningBorder }}>
                                        {t('orderManagement.detail.kanban.requiresQc')}
                                    </Tag>
                                )}
                                {firstTask.stepDefaultCompletionTimeSeconds && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <ClockCircleOutlined style={{ marginRight: 2 }} />
                                        {formatLeadtime(firstTask.stepDefaultCompletionTimeSeconds)}
                                    </Text>
                                )}
                                {firstTask.materialName && (
                                    <Tag bordered={false} style={{ margin: 0, fontSize: 11 }}>
                                        {firstTask.materialName}
                                    </Tag>
                                )}
                            </Flex>
                            {firstTask.stepDescription && (
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, paddingLeft: 8 }}>
                                    {firstTask.stepDescription}
                                </Text>
                            )}

                            {/* Tasks in this step */}
                            <Space direction="vertical" style={{ width: '100%', paddingLeft: 12 }} size="small">
                                {stepTasks.sort((a, b) => (a.taskOrder || 0) - (b.taskOrder || 0)).map((task) => (
                                    <div
                                        key={task.taskId}
                                        style={{
                                            padding: '10px 16px',
                                            background: token.colorBgContainer,
                                            borderRadius: 8,
                                            border: `1px solid ${token.colorBorderSecondary}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Space direction="vertical" size={2}>
                                            <Space size={8}>
                                                <Text strong style={{ fontSize: 13 }}>
                                                    {task.taskName || `${t('orderManagement.task.taskLabel')} ${task.taskOrder || ''}`}
                                                </Text>
                                                {task.taskType === 'REWORK' && (
                                                    <Tag bordered={false} style={{ margin: 0, fontSize: token.fontSizeSM, color: token.colorError, background: token.colorErrorBg }}>
                                                        {t('orderManagement.detail.kanban.rework')}
                                                    </Tag>
                                                )}
                                            </Space>
                                            <Space size="middle" style={{ marginTop: 2 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {t('orderManagement.task.reqQtyLabel')}: <span style={{ fontWeight: 600, color: token.colorText }}>{task.taskRequestedQuantity ?? task.taskQuantity}</span>
                                                </Text>
                                                {task.taskPlannedQuantity !== undefined && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {t('orderManagement.task.planQtyLabel')}: <span style={{ fontWeight: 600, color: token.colorText }}>{task.taskPlannedQuantity}</span>
                                                    </Text>
                                                )}
                                                {task.taskActualQuantity !== undefined && task.taskActualQuantity > 0 && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Actual: <span style={{ fontWeight: 600, color: token.colorSuccess }}>{task.taskActualQuantity}</span>
                                                    </Text>
                                                )}
                                                {task.taskErrorActualQuantity !== undefined && task.taskErrorActualQuantity > 0 && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Error: <span style={{ fontWeight: 600, color: token.colorError }}>{task.taskErrorActualQuantity}</span>
                                                    </Text>
                                                )}
                                                {task.taskAssignments && task.taskAssignments.length > 0 && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        <UserOutlined style={{ marginRight: 2 }} />
                                                        {task.taskAssignments.length} {t('orderManagement.task.operators')}
                                                    </Text>
                                                )}
                                            </Space>
                                        </Space>
                                        <Tag style={getTaskStatusTagStyle(task.taskStatus, token)}>
                                            {getLocalizedTaskStatus(task.taskStatus, t)}
                                        </Tag>
                                    </div>
                                ))}
                            </Space>
                        </div>
                    );
                })}
            </Space>
        );
    };

    const renderDrawingAssignmentsSection = (tasks: TaskResponse[]) => {
        if (!tasks) return null;
        // Gom danh sách phân công từ tất cả task
        const allAssignments: { taskName: string; stepOrder: number; assignment: TaskAssignment }[] = [];

        tasks.forEach((task) => {
            if (task.taskAssignments && task.taskAssignments.length > 0) {
                task.taskAssignments.forEach((assign) => {
                    allAssignments.push({
                        taskName: task.stepName,
                        stepOrder: task.stepOrder,
                        assignment: assign,
                    });
                });
            }
        });

        if (allAssignments.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Text type="secondary" italic>{t('orderManagement.detail.drawing.noAssignments')}</Text>
                </div>
            );
        }

        return (
            <div style={{ paddingTop: 8, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: `2px solid ${token.colorBorderSecondary}`, textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.step.stepLabel')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.detail.drawing.operator')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.detail.drawing.machine')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.detail.drawing.startedAt')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.detail.drawing.endedAt')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allAssignments.map((item, idx) => {
                            const assign = item.assignment;
                            return (
                                <tr key={assign.taskAssignmentId || idx} style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                                    <td style={{ padding: '10px 12px' }}>
                                        <Text strong>{t('orderManagement.step.stepLabel')} {item.stepOrder}:</Text> {item.taskName}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <Tag icon={<UserOutlined />} style={{ borderRadius: token.borderRadiusSM, fontWeight: token.fontWeightStrong, margin: 0, color: token.colorInfo, background: token.colorInfoBg, borderColor: token.colorInfoBorder }}>
                                            {assign.operatorFullName}
                                        </Tag>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {assign.machineName ? (
                                            <Tag style={{ borderRadius: token.borderRadiusSM, margin: 0, color: token.colorPrimary, background: token.colorPrimaryBg, borderColor: token.colorPrimaryBorder }}>{assign.machineName}</Tag>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: token.colorTextSecondary }}>
                                        {assign.startedAt ? format(new Date(assign.startedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {assign.endedAt ? (
                                            <span style={{ color: token.colorTextSecondary }}>{format(new Date(assign.endedAt), 'dd/MM/yyyy HH:mm')}</span>
                                        ) : (
                                            <Badge status="processing" text={t('orderManagement.detail.kanban.inProgress')} />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderDrawingReviewsSection = (tasks: TaskResponse[]) => {
        if (!tasks) return null;
        const allReviews: { taskName: string; stepName: string; stepOrder: number; review: TaskReview }[] = [];
        const unassignedTasks = tasks.filter((task) => !task.taskReviews || task.taskReviews.length === 0).length;

        tasks.forEach((task) => {
            if (task.taskReviews && task.taskReviews.length > 0) {
                task.taskReviews.forEach((rev) => {
                    allReviews.push({
                        taskName: task.taskName || task.stepName,
                        stepName: task.stepName,
                        stepOrder: task.stepOrder,
                        review: rev,
                    });
                });
            }
        });
        const confirmedReviews = allReviews.filter((item) => item.review.reviewStatus === 'CONFIRMED').length;
        const pendingReviews = allReviews.filter((item) => item.review.reviewStatus === 'PENDING').length;
        const declinedReviews = allReviews.filter((item) => item.review.reviewStatus === 'DECLINED').length;

        if (allReviews.length === 0) {
            return (
                <Space direction="vertical" size={12} style={{ width: '100%', paddingTop: 8 }}>
                    <Space wrap size={[8, 8]}>
                        <Tag style={{ margin: 0 }}>{t('managerReview.drawer.stats.totalTasks')}: {tasks.length}</Tag>
                        <Tag color="warning" style={{ margin: 0 }}>
                            {t('managerReview.drawer.stats.unassigned')}: {unassignedTasks}
                        </Tag>
                    </Space>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Text type="secondary" italic>{t('orderManagement.detail.drawing.noReviews')}</Text>
                    </div>
                </Space>
            );
        }

        return (
            <div style={{ paddingTop: 8, overflowX: 'auto' }}>
                <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                    <Tag style={{ margin: 0 }}>{t('managerReview.drawer.stats.totalTasks')}: {tasks.length}</Tag>
                    <Tag color="blue" style={{ margin: 0 }}>
                        {t('orderManagement.detail.drawing.operatorReviews')}: {allReviews.length}
                    </Tag>
                    <Tag color="success" style={{ margin: 0 }}>
                        {t('managerReview.drawer.stats.confirmed')}: {confirmedReviews}
                    </Tag>
                    <Tag color="gold" style={{ margin: 0 }}>
                        {t('managerReview.drawer.stats.pending')}: {pendingReviews}
                    </Tag>
                    <Tag color="error" style={{ margin: 0 }}>
                        {t('managerReview.drawer.stats.declined')}: {declinedReviews}
                    </Tag>
                    <Tag color="warning" style={{ margin: 0 }}>
                        {t('managerReview.drawer.stats.unassigned')}: {unassignedTasks}
                    </Tag>
                </Space>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: `2px solid ${token.colorBorderSecondary}`, textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.step.stepLabel')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.detail.drawing.operator')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.list.table.status')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('operatorReview.drawer.declineReason')}</th>
                            <th style={{ padding: '8px 12px', fontWeight: 600, color: token.colorTextSecondary }}>{t('orderManagement.detail.overview.createdAt')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allReviews.map((item, idx) => {
                            const rev = item.review;
                            return (
                                <tr key={rev.taskReviewId || idx} style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                                    <td style={{ padding: '10px 12px' }}>
                                        <Text strong>{item.taskName}</Text>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                            {t('orderManagement.step.stepLabel')} {item.stepOrder}: {item.stepName}
                                        </Text>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <Text strong>{rev.operatorFullName}</Text>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{rev.operatorUserCode}</Text>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <Tag style={getReviewStatusTagStyle(rev.reviewStatus, token)}>
                                            {rev.reviewStatus === 'CONFIRMED' ? t('managerReview.drawer.stats.confirmed')
                                                : rev.reviewStatus === 'DECLINED' ? t('managerReview.drawer.stats.declined')
                                                    : rev.reviewStatus === 'PENDING' ? t('managerReview.drawer.stats.pending')
                                                        : rev.reviewStatus}
                                        </Tag>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {rev.declineReason ? (
                                            <div>
                                                <Tag style={{ borderRadius: token.borderRadiusXS, margin: 0, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder }}>{rev.declineReason}</Tag>
                                                {rev.declineComment && (
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                                        "{rev.declineComment}"
                                                    </Text>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: token.colorTextSecondary }}>
                                        {rev.reviewedAt ? format(new Date(rev.reviewedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderDrawingExpandedDetail = (tasks: TaskResponse[]) => {
        const nestedTabs = [
            {
                key: 'steps',
                label: 'Quy trình & Nhiệm vụ',
                children: renderDrawingStepsSection(tasks),
            },
            {
                key: 'assignments',
                label: t('orderManagement.detail.drawing.assignments'),
                children: renderDrawingAssignmentsSection(tasks),
            },
            {
                key: 'reviews',
                label: t('orderManagement.detail.drawing.operatorReviews'),
                children: renderDrawingReviewsSection(tasks),
            },
        ];

        return (
            <Tabs
                size="small"
                type="line"
                items={nestedTabs}
                style={{ marginTop: -8 }}
            />
        );
    };

    const renderDrawingPlanTab = () => {
        if (isLoadingDrawings) {
            return (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin />
                </div>
            );
        }

        if (!orderDrawings || orderDrawings.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Text type="secondary">{t('orderManagement.drawing.empty')}</Text>
                </div>
            );
        }

        const drawingCount = orderDrawings.length;
        const totalPlanned = orderDrawings.reduce(
            (sum: number, drawing: OrderDrawingSummaryResponse) => sum + (drawing.orderDrawingPlannedQuantity || 0),
            0
        );
        const totalActual = orderDrawings.reduce(
            (sum: number, drawing: OrderDrawingSummaryResponse) => sum + (drawing.orderDrawingActualQuantity || 0),
            0
        );
        const totalError = orderDrawings.reduce(
            (sum: number, drawing: OrderDrawingSummaryResponse) => sum + (drawing.orderDrawingErrorActualQuantity || 0),
            0
        );
        const completedDrawingCount = orderDrawings.filter(
            (drawing: OrderDrawingSummaryResponse) => drawing.drawingStatus === 'COMPLETED'
        ).length;

        return (
            <Space direction="vertical" size="middle" style={{ width: '100%', paddingTop: 12 }}>
                <Card
                    size="small"
                    style={{ borderRadius: token.borderRadiusLG, borderColor: token.colorBorderSecondary }}
                    styles={{ body: { padding: token.paddingSM } }}
                >
                    <Space wrap size={[8, 8]}>
                        <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorPrimary, background: token.colorInfoBg, borderColor: token.colorPrimaryBorder }}>
                            {t('orderManagement.detail.tabs.drawingPlan')}: {drawingCount}
                        </Tag>
                        <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorInfo, background: token.colorInfoBg, borderColor: token.colorInfoBorder }}>
                            {t('orderManagement.task.planQtyLabel')}: {totalPlanned}
                        </Tag>
                        <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorSuccess, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder }}>
                            {t('orderManagement.detail.overview.actualQty', { defaultValue: 'Actual Qty' })}: {totalActual}
                        </Tag>
                        <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder }}>
                            Error: {totalError}
                        </Tag>
                        <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorTextSecondary, background: token.colorFillTertiary, borderColor: token.colorBorder }}>
                            {t('orderManagement.stats.completed')}: {completedDrawingCount}/{drawingCount}
                        </Tag>
                    </Space>
                </Card>

                {orderDrawings.map((drawing: OrderDrawingSummaryResponse) => {
                    const isExpanded = expandedDrawingIds.includes(drawing.orderDrawingId);
                    const isDrawingLoading = loadingDrawingsMap[drawing.orderDrawingId];
                    const drawingDetail = loadedDrawingDetails[drawing.orderDrawingId];
                    const requestedQty = drawing.orderDrawingRequestedQuantity || 0;
                    const plannedQty = drawing.orderDrawingPlannedQuantity || 0;
                    const actualQty = drawing.orderDrawingActualQuantity || 0;
                    const errorQty = drawing.orderDrawingErrorActualQuantity || 0;
                    const targetQty = plannedQty || requestedQty;
                    const completionPercent = targetQty > 0 ? Math.min(100, Math.round((actualQty / targetQty) * 100)) : 0;

                    return (
                        <Card
                            key={drawing.orderDrawingId}
                            style={{
                                borderRadius: 8,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                boxShadow: token.boxShadowTertiary,
                            }}
                            bodyStyle={{ padding: token.padding }}
                        >
                            {/* Thanh Header của mỗi Bản vẽ */}
                            <Flex justify="space-between" align="center" style={{ cursor: 'pointer' }} onClick={() => handleToggleDrawingDetail(drawing.orderDrawingId)}>
                                <Space size="middle">
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: token.borderRadius,
                                            background: token.colorInfoBg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: token.colorInfo,
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        <AimOutlined />
                                    </div>
                                    <Space direction="vertical" size={4}>
                                        <Text strong style={{ fontSize: token.fontSizeLG }}>
                                            {drawing.drawingCode} - {drawing.drawingCodeName}
                                        </Text>
                                        <Space wrap size={[6, 6]}>
                                            {drawing.ofCustomer && (
                                                <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorInfo, background: token.colorInfoBg, borderColor: token.colorInfoBorder }}>
                                                    {t('orderManagement.drawing.ofCustomer')}: {drawing.ofCustomer}
                                                </Tag>
                                            )}
                                            {drawing.versionNumber && (
                                                <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorTextSecondary, background: token.colorFillTertiary, borderColor: token.colorBorder }}>
                                                    {t('orderManagement.drawing.version')}: v{drawing.versionNumber}
                                                </Tag>
                                            )}
                                            <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorTextSecondary, background: token.colorFillTertiary, borderColor: token.colorBorder }}>
                                                {t('orderManagement.detail.overview.productionType')}:{' '}
                                                {drawing.productionType === 'BATCH'
                                                    ? t('orderManagement.form.productionTypes.batch')
                                                    : t('orderManagement.form.productionTypes.single')}
                                            </Tag>
                                            <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorInfo, background: token.colorInfoBg, borderColor: token.colorInfoBorder }}>
                                                {t('orderManagement.task.reqQtyLabel')}: {requestedQty}
                                            </Tag>
                                            <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorPrimary, background: token.colorInfoBg, borderColor: token.colorPrimaryBorder }}>
                                                {t('orderManagement.task.planQtyLabel')}: {plannedQty}
                                            </Tag>
                                            <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorSuccess, background: token.colorSuccessBg, borderColor: token.colorSuccessBorder }}>
                                                <CheckCircleOutlined style={{ marginRight: 4 }} />
                                                Actual: {actualQty}
                                            </Tag>
                                            <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorError, background: token.colorErrorBg, borderColor: token.colorErrorBorder }}>
                                                <WarningOutlined style={{ marginRight: 4 }} />
                                                Error: {errorQty}
                                            </Tag>
                                            {drawing.defaultCompletionTimeSeconds && (
                                                <Tag style={{ margin: 0, borderRadius: token.borderRadiusSM, color: token.colorPrimary, background: token.colorInfoBg, borderColor: token.colorPrimaryBorder }}>
                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                    {formatLeadtime(drawing.defaultCompletionTimeSeconds)}
                                                </Tag>
                                            )}
                                        </Space>
                                        {(drawing.description || drawing.pdfLink) && (
                                            <Space direction="vertical" size={8} style={{ marginTop: 8 }}>
                                                {drawing.description && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {drawing.description}
                                                    </Text>
                                                )}
                                                {drawing.pdfLink && (
                                                    <Button
                                                        href={drawing.pdfLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        size="small"
                                                        icon={<ExportOutlined />}
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        {t('orderManagement.drawing.viewPdfDocument')}
                                                    </Button>
                                                )}
                                            </Space>
                                        )}
                                    </Space>
                                </Space>

                                <Space>
                                    <Tag style={getTaskStatusTagStyle(drawing.drawingStatus, token)}>
                                        {drawing.drawingStatus === 'COMPLETED'
                                            ? t('orderManagement.stats.completed')
                                            : drawing.drawingStatus === 'IN_PROGRESS'
                                                ? t('orderManagement.detail.kanban.inProgress')
                                                : drawing.drawingStatus}
                                    </Tag>
                                    <Button
                                        type="text"
                                        shape="circle"
                                        icon={
                                            <DownOutlined
                                                style={{
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s',
                                                    color: token.colorTextSecondary,
                                                }}
                                            />
                                        }
                                    />
                                </Space>
                            </Flex>
                            <div style={{ marginTop: token.marginSM }}>
                                <Progress
                                    percent={completionPercent}
                                    size="small"
                                    showInfo
                                    strokeColor={token.colorPrimary}
                                    trailColor={token.colorFillSecondary}
                                    format={(percent) =>
                                        `${percent}% (${actualQty}/${targetQty || 0})`
                                    }
                                />
                            </div>

                            {/* Khối Chi tiết mở rộng khi Click */}
                            {isExpanded && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        paddingTop: 16,
                                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                >
                                    {isDrawingLoading ? (
                                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                            <Spin tip={t('common.loading')} size="small" />
                                        </div>
                                    ) : drawingDetail ? (
                                        renderDrawingExpandedDetail(drawingDetail)
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                            <Text type="secondary">{t('orderManagement.detail.messages.notFound')}</Text>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </Space>
        );
    };

    const tabItems = [
        {
            key: 'overview',
            label: t('orderManagement.detail.tabs.orderDetail'),
            children: renderOrderOverview(),
        },
        {
            key: 'drawingPlan',
            label: t('orderManagement.detail.tabs.drawingPlan'),
            children: renderDrawingPlanTab(),
        },
    ];

    return (
        <Drawer
            title={
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <div style={{ flex: 1, minWidth: 0, maxWidth: '400px' }}>
                        <Text strong style={{ fontSize: 16, marginRight: 8 }} ellipsis={{ tooltip: true }}>
                            {currentOrder?.orderName || t('orderManagement.list.table.actions')}
                        </Text>
                    </div>
                    <Space align="center" size={12} wrap>
                        {/* Tag Trạng thái */}
                        {currentOrder && (
                            <Tag style={getOrderStatusTagStyle(currentOrder.orderStatus, token)}>
                                {currentOrder.orderStatus === 'REVIEWING'
                                    ? t('orderManagement.stats.draft')
                                    : getLocalizedStatusLabel(currentOrder.orderStatus, t)}
                            </Tag>
                        )}

                        {/* Priority Tag */}
                        {currentOrder?.orderPriority && (
                            <Tag style={getPriorityTagStyle(currentOrder.orderPriority, token)}>
                                {getLocalizedPriorityLabel(currentOrder.orderPriority, t)}
                            </Tag>
                        )}
                        <Button
                            onClick={handleEdit}
                            disabled={
                                !currentOrder ||
                                currentOrder.orderStatus === 'CANCELLED' ||
                                currentOrder.orderStatus === 'COMPLETED'
                            }
                            icon={<EditOutlined />}
                        >
                            {t('common.edit')}
                        </Button>

                        {currentOrder?.orderStatus === 'REVIEWING' && (
                            <Popconfirm
                                title={t(
                                    'orderManagement.detail.actions.confirmProductionPopTitle'
                                )}
                                description={t(
                                    'orderManagement.detail.actions.confirmProductionPopDesc'
                                )}
                                onConfirm={handleConfirmOrder}
                                okText={t('common.confirm')}
                                cancelText={t('common.cancel')}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    loading={isSubmitting}
                                >
                                    {t('orderManagement.detail.actions.confirmProduction')}
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                </Flex>
            }
            open={isOrderDetailDrawerOpen}
            onClose={handleClose}
            width={900}
            styles={{
                header: { borderBottom: `1px solid ${token.colorBorderSecondary}` },
                body: { background: token.colorBgLayout, padding: '16px 24px' }
            }}
        >
            {isLoadingDetail ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 50,
                    }}
                >
                    <Spin size="large" />
                    <Text type="secondary" style={{ marginTop: 16 }}>{t('common.loading')}</Text>
                </div>
            ) : !currentOrder ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                    <Empty description={t('orderManagement.detail.messages.notFound')} />
                </div>
            ) : (
                <Tabs
                    activeKey={orderDetailActiveTab}
                    onChange={(key) => dispatch(orderActions.setActiveDetailTab(key as any))}
                    items={tabItems}
                />
            )}
        </Drawer>
    );
};
