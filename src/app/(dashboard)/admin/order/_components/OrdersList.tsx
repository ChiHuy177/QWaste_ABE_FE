'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button,
    Input,
    Card,
    Table,
    Space,
    Tag,
    Select,
    Row,
    Col,
    Typography,
    Flex,
    Grid,
    Popconfirm,
    Tooltip,
    theme,
    Modal,
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    FilterOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    DashboardOutlined,
    UndoOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { ColumnsType } from 'antd/es/table';

import { OrderSummaryResponse } from '@/types/Order';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { orderActions } from '@/stores/OrderStore';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ORDER_STATUS_TAG_COLORS: Record<string, string> = {
    REVIEWING: 'blue',
    CONFIRMED: 'green',
    IN_PROGRESS: 'green',
    COMPLETED: 'success',
    CANCELLED: 'error',
};

const PRIORITY_TAG_COLORS: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'gold',
    HIGH: 'orange',
    URGENT: 'red',
};

const getOrderStatusLabel = (status: string, t: (key: string) => string) => {
    const statusLabels: Record<string, string> = {
        REVIEWING: t('orderManagement.stats.reviewing'),
        CONFIRMED: t('orderManagement.stats.inProduction'),
        IN_PROGRESS: t('orderManagement.stats.inProgress'),
        COMPLETED: t('orderManagement.stats.completed'),
        CANCELLED: t('orderManagement.stats.cancelled'),
    };

    return statusLabels[status] || status;
};

const isOrderDeleted = (order: OrderSummaryResponse) =>
    Boolean(
        order.softDeleteMetaData?.isDeleted ||
        (order.softDeleteMetaData as { deleted?: boolean } | undefined)?.deleted
    );

const canUpdateOrderInfo = (status: string) => status !== 'CANCELLED' && status !== 'COMPLETED';

interface CancelOrderModalProps {
    open: boolean;
    orderId: string | null;
    onConfirm: (orderId: string, reason: string) => Promise<void>;
    onCancel: () => void;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ open, orderId, onConfirm, onCancel }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (open) {
            setReason('');
        }
    }, [open]);

    const handleOk = async () => {
        if (!orderId || !reason.trim()) return;
        setIsSubmitting(true);
        try {
            await onConfirm(orderId, reason);
            onCancel();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={t('orderManagement.list.messages.cancelTitle')}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            confirmLoading={isSubmitting}
            okButtonProps={{ danger: true, disabled: !reason.trim() }}
        >
            <Input.TextArea
                rows={4}
                placeholder={t('orderManagement.list.messages.cancelReasonPlaceholder')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
        </Modal>
    );
};

export const OrdersList: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const { user } = useAuth();
    const { checkPermissionSilent } = usePermissionCheck();
    const isMobile = !screens.md;
    const canViewOrder = checkPermissionSilent('view', 'order');
    const canCreateOrder = checkPermissionSilent('create', 'order');
    const canEditOrder =
        checkPermissionSilent('update', 'order') ||
        checkPermissionSilent('update_info', 'order') ||
        checkPermissionSilent('update_plan', 'order');
    const canDeleteOrder = checkPermissionSilent('delete', 'order');
    const canRestoreOrder = checkPermissionSilent('restore', 'order');
    const isAdmin = user?.roles?.some((role) =>
        ['admin', 'super_admin'].includes(role.toLowerCase())
    );

    // Lấy data từ Redux
    const { orders, isLoadingOrders, ordersViewMode } = useAppSelector((state) => state.order);

    // Local States cho bộ lọc
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    // Local States cho Cancel Order
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

    // 1. Client-side Filtering
    const filteredOrders = useMemo(() => {
        return orders.filter((order: OrderSummaryResponse) => {
            const matchesSearch =
                !searchQuery ||
                order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.orderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
            const matchesPriority =
                priorityFilter === 'all' || order.orderPriority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [orders, searchQuery, statusFilter, priorityFilter]);

    // 2. Handlers
    const handleRefresh = () => dispatch(orderActions.fetchOrders());
    const handleCreateOrder = () => dispatch(orderActions.openOrderForm('create'));

    const handleEditOrder = async (order: OrderSummaryResponse) => {
        if (!canEditOrder) return;
        if (!canUpdateOrderInfo(order.orderStatus)) return;
        // Bật loading để load detail trước khi mở form edit
        try {
            await dispatch(orderActions.fetchOrderDetail(order.orderId));
            dispatch(orderActions.openOrderForm('edit', order.orderId));
        } catch (error) {
            console.error('Failed to prepare order edit form:', error);
        }
    };

    const handleViewOrder = (order: OrderSummaryResponse) => {
        if (!canViewOrder) return;
        dispatch(orderActions.openOrderDetailDrawer(order.orderId));
    };

    const handleOpenReviewDashboard = (order: OrderSummaryResponse) => {
        if (!isAdmin) return;
        dispatch(orderActions.openManagerReviewDrawer(order.orderId));
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!canDeleteOrder) return;
        await dispatch(orderActions.deleteOrder(orderId));
    };

    const handleRestoreOrder = async (orderId: string) => {
        if (!canRestoreOrder) return;
        await dispatch(orderActions.restoreOrder(orderId));
    };

    const handleOpenCancelModal = (orderId: string) => {
        if (!canEditOrder) return;
        setCancellingOrderId(orderId);
        setCancelModalVisible(true);
    };

    const handleConfirmCancel = async (orderId: string, reason: string) => {
        if (!canEditOrder) return;
        await dispatch(orderActions.cancelOrder(orderId, reason));
        setCancelModalVisible(false);
        setCancellingOrderId(null);
    };

    // 3. Cấu hình Cột cho Table
    const columns: ColumnsType<OrderSummaryResponse> = [
        {
            title: t('orderManagement.list.table.orderCode'),
            dataIndex: 'orderCode',
            key: 'orderCode',
            fixed: isMobile ? undefined : 'left',
            width: 140,
            render: (text, record) => {
                const isDeleted = isOrderDeleted(record);
                return (
                    <a
                        onClick={() => canViewOrder && handleViewOrder(record)}
                        style={{ fontSize: 13, fontWeight: 600, color: isDeleted ? token.colorTextDisabled : undefined }}
                    >
                        {text}
                    </a>
                );
            },
        },
        {
            title: t('orderManagement.list.table.orderName'),
            dataIndex: 'orderName',
            key: 'orderName',
            ellipsis: true,
            render: (text, record) => {
                const isDeleted = isOrderDeleted(record);
                return (
                    <div>
                        <Text strong style={{ color: isDeleted ? token.colorTextDisabled : undefined }}>{text}</Text>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}></Text>
                    </div>
                );
            },
        },
        {
            title: t('orderManagement.list.table.customer'),
            dataIndex: 'customerName',
            key: 'customerName',
            responsive: ['md'],
            render: (text, record) => {
                const isDeleted = isOrderDeleted(record);
                return <Text style={{ color: isDeleted ? token.colorTextDisabled : undefined }}>{text}</Text>;
            },
        },
        {
            title: t('orderManagement.list.table.status'),
            dataIndex: 'orderStatus',
            key: 'orderStatus',
            width: 140,
            render: (status: string, record) => {
                const isDeleted = isOrderDeleted(record);
                if (isDeleted) {
                    return <Tag color="error">{t('common.table.headers.deleted', 'Deleted')}</Tag>;
                }
                return (
                    <Tag color={ORDER_STATUS_TAG_COLORS[status] || 'default'}>
                        {getOrderStatusLabel(status, t)}
                    </Tag>
                );
            },
        },
        {
            title: t('orderManagement.list.table.priority'),
            dataIndex: 'orderPriority',
            key: 'orderPriority',
            width: 100,
            responsive: ['lg'],
            render: (priority: string) => {
                const priorityLabels: Record<string, string> = {
                    LOW: t('orderManagement.form.priorities.low'),
                    MEDIUM: t('orderManagement.form.priorities.medium'),
                    HIGH: t('orderManagement.form.priorities.high'),
                    URGENT: t('orderManagement.form.priorities.urgent'),
                };
                return (
                    <Tag color={PRIORITY_TAG_COLORS[priority] || 'default'}>
                        {priorityLabels[priority] || priority}
                    </Tag>
                );
            },
        },
        {
            title: t('orderManagement.list.table.deliveryDate'),
            dataIndex: 'deadline',
            key: 'deadline',
            width: 120,
            responsive: ['md'],
            render: (date) => (date ? format(new Date(date), 'dd/MM/yyyy') : '-'),
        },
        {
            title: t('orderManagement.list.table.actions'),
            key: 'actions',
            align: 'right',
            fixed: isMobile ? undefined : 'right',
            width: 160,
            render: (_, record) => {
                const isDeleted = isOrderDeleted(record);
                return (
                    <Space size="small">
                        {canViewOrder && (
                            <Tooltip title={t('orderManagement.list.tooltips.view')}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handleViewOrder(record)}
                                />
                            </Tooltip>
                        )}
                        {isAdmin && (
                            <Tooltip title={t('managerReview.drawer.title')}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DashboardOutlined />}
                                    onClick={() => handleOpenReviewDashboard(record)}
                                    disabled={isDeleted}
                                />
                            </Tooltip>
                        )}
                        {canEditOrder && (
                            <>
                                <Tooltip
                                    title={
                                        canUpdateOrderInfo(record.orderStatus)
                                            ? t('orderManagement.list.tooltips.edit')
                                            : t(
                                                'orderManagement.list.tooltips.completedCancelledEdit',
                                                'Cannot edit cancelled or completed orders'
                                            )
                                    }
                                >
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEditOrder(record)}
                                        disabled={isDeleted || !canUpdateOrderInfo(record.orderStatus)}
                                    />
                                </Tooltip>
                                <Tooltip title={t('orderManagement.list.tooltips.cancel')}>
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<StopOutlined />}
                                        onClick={() => handleOpenCancelModal(record.orderId)}
                                        disabled={
                                            isDeleted ||
                                            record.orderStatus === 'CANCELLED' ||
                                            record.orderStatus === 'COMPLETED'
                                        }
                                    />
                                </Tooltip>
                            </>
                        )}
                        {isDeleted ? (
                            canRestoreOrder && (
                                <Popconfirm
                                    title={t('orderManagement.list.tooltips.restore')}
                                    description={t('orderManagement.list.messages.restoreConfirm', {
                                        code: record.orderCode,
                                    })}
                                    onConfirm={() => handleRestoreOrder(record.orderId)}
                                    okText={t('common.yes')}
                                    cancelText={t('common.no')}
                                >
                                    <Tooltip title={t('orderManagement.list.tooltips.restore')}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<UndoOutlined />}
                                            style={{ color: '#52c41a' }}
                                        />
                                    </Tooltip>
                                </Popconfirm>
                            )
                        ) : canDeleteOrder && (
                            <Popconfirm
                                title={t('orderManagement.list.tooltips.delete')}
                                description={t('orderManagement.list.messages.deleteConfirm', {
                                    code: record.orderCode,
                                })}
                                onConfirm={() => handleDeleteOrder(record.orderId)}
                                okText={t('common.delete')}
                                cancelText={t('common.cancel')}
                                disabled={record.orderStatus !== 'REVIEWING'}
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={record.orderStatus !== 'REVIEWING'}
                                />
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];

    // 4. Giao diện Card (Mobile View)
    const renderCardView = () => (
        <Row gutter={[16, 16]}>
            {filteredOrders.map((order: OrderSummaryResponse) => {
                const isDeleted = isOrderDeleted(order);
                return (
                    <Col xs={24} sm={12} lg={8} key={order.orderId}>
                        <Card
                            hoverable
                            onClick={() => canViewOrder && handleViewOrder(order)}
                            styles={{ body: { padding: 16 } }}
                        >
                            <Flex
                                justify="space-between"
                                align="flex-start"
                                style={{ marginBottom: 12 }}
                            >
                                <div style={{ maxWidth: '65%' }}>
                                    <Text strong ellipsis style={{ display: 'block', fontSize: 15, color: isDeleted ? token.colorTextDisabled : undefined }}>
                                        {order.orderName}
                                    </Text>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 13 }}
                                    >
                                        {order.orderCode}
                                    </Text>
                                </div>
                                <Space direction="vertical" size={4} align="end">
                                    {isDeleted ? (
                                        <Tag color="default">{t('common.table.headers.deleted', 'Deleted')}</Tag>
                                    ) : (
                                        <Tag
                                            color={ORDER_STATUS_TAG_COLORS[order.orderStatus] || 'default'}
                                            style={{ margin: 0 }}
                                        >
                                            {getOrderStatusLabel(order.orderStatus, t)}
                                        </Tag>
                                    )}
                                    <Tag
                                        color={PRIORITY_TAG_COLORS[order.orderPriority] || 'default'}
                                        style={{ margin: 0 }}
                                    >
                                        {order.orderPriority === 'LOW'
                                            ? t('orderManagement.form.priorities.low')
                                            : order.orderPriority === 'MEDIUM'
                                                ? t('orderManagement.form.priorities.medium')
                                                : order.orderPriority === 'HIGH'
                                                    ? t('orderManagement.form.priorities.high')
                                                    : t('orderManagement.form.priorities.urgent')}
                                    </Tag>
                                </Space>
                            </Flex>

                            <Space
                                direction="vertical"
                                size={2}
                                style={{ width: '100%', marginBottom: 16 }}
                            >
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {t('orderManagement.detail.overview.customer')}:{' '}
                                    <Text strong style={{ color: isDeleted ? token.colorTextDisabled : undefined }}>{order.customerName || '-'}</Text>
                                </Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {t('orderManagement.list.table.productionType')}:{' '}
                                    <Text strong></Text>
                                </Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {t('orderManagement.list.table.deliveryDate')}: <Text strong></Text>
                                </Text>
                            </Space>

                            <Flex
                                gap={8}
                                style={{
                                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                                    paddingTop: 12,
                                }}
                            >
                                <>
                                    {canViewOrder && (
                                        <Button
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewOrder(order);
                                            }}
                                            icon={<EyeOutlined />}
                                            style={{ flex: 1 }}
                                        >
                                            {t('orderManagement.list.tooltips.view')}
                                        </Button>
                                    )}
                                    {isAdmin && (
                                        <Button
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenReviewDashboard(order);
                                            }}
                                            disabled={isDeleted}
                                            icon={<DashboardOutlined />}
                                        />
                                    )}
                                    {canEditOrder && (
                                        <>
                                            <Button
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditOrder(order);
                                                }}
                                                disabled={isDeleted || !canUpdateOrderInfo(order.orderStatus)}
                                                icon={<EditOutlined />}
                                            />
                                            <Button
                                                size="small"
                                                danger
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenCancelModal(order.orderId);
                                                }}
                                                disabled={
                                                    isDeleted ||
                                                    order.orderStatus === 'CANCELLED' ||
                                                    order.orderStatus === 'COMPLETED'
                                                }
                                                icon={<StopOutlined />}
                                            />
                                        </>
                                    )}
                                    {isDeleted ? (
                                        canRestoreOrder && (
                                            <Popconfirm
                                                title={t('orderManagement.list.tooltips.restore')}
                                                description={t('orderManagement.list.messages.restoreConfirm', {
                                                    code: order.orderCode,
                                                })}
                                                onConfirm={(e) => {
                                                    e?.stopPropagation();
                                                    handleRestoreOrder(order.orderId);
                                                }}
                                                okText={t('common.yes')}
                                                cancelText={t('common.no')}
                                                onCancel={(e) => e?.stopPropagation()}
                                            >
                                                <Button
                                                    size="small"
                                                    onClick={(e) => e.stopPropagation()}
                                                    icon={<UndoOutlined />}
                                                    style={{ color: '#52c41a', borderColor: '#52c41a' }}
                                                />
                                            </Popconfirm>
                                        )
                                    ) : (
                                        canDeleteOrder && (
                                            <Popconfirm
                                                title={t('orderManagement.list.tooltips.delete')}
                                                description={t('orderManagement.list.messages.deleteConfirm', {
                                                    code: order.orderCode,
                                                })}
                                                okText={t('common.delete')}
                                                cancelText={t('common.cancel')}
                                                onConfirm={(e) => {
                                                    e?.stopPropagation();
                                                    handleDeleteOrder(order.orderId);
                                                }}
                                                onCancel={(e) => e?.stopPropagation()}
                                            >
                                                <Button
                                                    size="small"
                                                    danger
                                                    onClick={(e) => e.stopPropagation()}
                                                    disabled={order.orderStatus !== 'REVIEWING'}
                                                    icon={<DeleteOutlined />}
                                                />
                                            </Popconfirm>
                                        )
                                    )}
                                </>
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Header Controls */}
            <Flex
                justify="space-between"
                align={isMobile ? 'flex-start' : 'center'}
                wrap="wrap"
                gap={12}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        {t('orderManagement.list.title')}
                    </Title>
                    <Text type="secondary">{t('orderManagement.list.subtitle')}</Text>
                </div>
                <Space>
                    <Button
                        onClick={handleRefresh}
                        loading={isLoadingOrders}
                        icon={<ReloadOutlined />}
                    >
                        {isMobile ? null : t('orderManagement.list.refresh')}
                    </Button>
                    {canCreateOrder && (
                        <Button type="primary" onClick={handleCreateOrder} icon={<PlusOutlined />}>
                            {isMobile ? null : t('orderManagement.list.create')}
                        </Button>
                    )}
                </Space>
            </Flex>

            {/* Filters Bar */}
            <Card styles={{ body: { padding: 16 } }}>
                <Flex align="center" gap={12} wrap="wrap">
                    <div style={{ flex: 1, minWidth: isMobile ? '100%' : 250 }}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder={t('orderManagement.list.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                        />
                    </div>

                    <Flex
                        align="center"
                        gap={8}
                        wrap="wrap"
                        style={{ flex: isMobile ? '1 1 100%' : undefined }}
                    >
                        <FilterOutlined style={{ color: '#bfbfbf' }} />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: isMobile ? 'calc(50% - 16px)' : 140 }}
                            options={[
                                {
                                    value: 'all',
                                    label: t('orderManagement.list.filters.allStatus'),
                                },
                                { value: 'REVIEWING', label: t('orderManagement.stats.reviewing') },
                                {
                                    value: 'CONFIRMED',
                                    label: t('orderManagement.stats.inProduction'),
                                },
                                {
                                    value: 'IN_PROGRESS',
                                    label: t('orderManagement.stats.inProgress'),
                                },
                                { value: 'COMPLETED', label: t('orderManagement.stats.completed') },
                                { value: 'CANCELLED', label: t('orderManagement.stats.cancelled') },
                            ]}
                        />
                        <Select
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                            style={{ width: isMobile ? 'calc(50% - 16px)' : 120 }}
                            options={[
                                {
                                    value: 'all',
                                    label: t('orderManagement.list.filters.allPriority'),
                                },
                                { value: 'LOW', label: t('orderManagement.form.priorities.low') },
                                {
                                    value: 'MEDIUM',
                                    label: t('orderManagement.form.priorities.medium'),
                                },
                                { value: 'HIGH', label: t('orderManagement.form.priorities.high') },
                                {
                                    value: 'URGENT',
                                    label: t('orderManagement.form.priorities.urgent'),
                                },
                            ]}
                        />
                        <Space.Compact>
                            <Button
                                type={ordersViewMode === 'table' ? 'primary' : 'default'}
                                onClick={() => dispatch(orderActions.setOrdersViewMode('table'))}
                                icon={<UnorderedListOutlined />}
                            />
                            <Button
                                type={ordersViewMode === 'card' ? 'primary' : 'default'}
                                onClick={() => dispatch(orderActions.setOrdersViewMode('card'))}
                                icon={<AppstoreOutlined />}
                            />
                        </Space.Compact>
                    </Flex>
                </Flex>
            </Card>

            {/* Data View */}
            {ordersViewMode === 'table' ? (
                <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    rowKey="orderId"
                    loading={isLoadingOrders}
                    scroll={{ x: 'max-content' }}
                    size={isMobile ? 'small' : 'middle'}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            t('common.table.pagination.resultsInfo', {
                                start: range[0],
                                end: range[1],
                                total,
                            }),
                    }}
                />
            ) : (
                renderCardView()
            )}

            {/* Cancel Modal */}
            <CancelOrderModal
                open={cancelModalVisible}
                orderId={cancellingOrderId}
                onConfirm={handleConfirmCancel}
                onCancel={() => {
                    setCancelModalVisible(false);
                    setCancellingOrderId(null);
                }}
            />
        </Space>
    );
};
