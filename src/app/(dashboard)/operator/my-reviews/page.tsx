'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Tag, Button, Row, Col, theme } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileTextOutlined, AppstoreOutlined } from '@ant-design/icons';
import { usePageTitle } from '@/hooks/usePageTitle';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { orderActions } from '@/stores/OrderStore';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { OrderOperatorSummaryResponse } from '@/types/Order';
import type { ColumnsType } from 'antd/es/table';
import { OperatorReviewDrawer } from './_components/OperatorReviewDrawer';

const MyReviewsPage = () => {
    const { t } = useTranslation('common');
    usePageTitle(t('operatorReview.page.title'));
    const dispatch = useAppDispatch();
    const { token } = theme.useToken();

    const { myReviewingOrders, isLoadingOrders } = useAppSelector((state) => state.order);

    useEffect(() => {
        dispatch(orderActions.fetchMyReviewingOrders());
    }, [dispatch]);

    const stats = {
        totalOrders: myReviewingOrders.length,
        totalTasks: myReviewingOrders.reduce(
            (sum: number, o: OrderOperatorSummaryResponse) => sum + o.myTotalTasks,
            0
        ),
        pendingTasks: myReviewingOrders.reduce(
            (sum: number, o: OrderOperatorSummaryResponse) => sum + o.myPendingTasks,
            0
        ),
        confirmedTasks: myReviewingOrders.reduce(
            (sum: number, o: OrderOperatorSummaryResponse) => sum + o.myConfirmedTasks,
            0
        ),
        declinedTasks: myReviewingOrders.reduce(
            (sum: number, o: OrderOperatorSummaryResponse) => sum + o.myDeclinedTasks,
            0
        ),
    };

    const columns: ColumnsType<OrderOperatorSummaryResponse> = [
        {
            title: t('operatorReview.page.columns.code'),
            dataIndex: 'orderCode',
            key: 'orderCode',
            fixed: 'left',
            width: 150,
        },
        {
            title: t('operatorReview.page.columns.orderName'),
            dataIndex: 'orderName',
            key: 'orderName',
            width: 200,
        },
        {
            title: t('operatorReview.page.columns.priority'),
            dataIndex: 'orderPriority',
            key: 'orderPriority',
            width: 120,
            render: (priority: string) => {
                const colors: Record<string, string> = {
                    HIGH: 'red',
                    MEDIUM: 'orange',
                    LOW: 'blue',
                };
                return <Tag color={colors[priority]}>{priority}</Tag>;
            },
        },
        {
            title: t('operatorReview.page.columns.expectedStart'),
            dataIndex: 'expectedStartDate',
            key: 'expectedStartDate',
            width: 150,
            render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '-'),
        },
        {
            title: t('operatorReview.page.columns.tasks'),
            key: 'myTasks',
            width: 120,
            align: 'center',
            render: (_, record) => record.myTotalTasks,
        },
        {
            title: t('operatorReview.page.pendingReviews'),
            dataIndex: 'myPendingTasks',
            key: 'myPendingTasks',
            width: 100,
            align: 'center',
            render: (count: number) => (
                <Tag color="warning" icon={<ClockCircleOutlined />}>
                    &nbsp;{count}
                </Tag>
            ),
        },
        {
            title: t('operatorReview.drawer.confirm'),
            dataIndex: 'myConfirmedTasks',
            key: 'myConfirmedTasks',
            width: 100,
            align: 'center',
            render: (count: number) => (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                    &nbsp;{count}
                </Tag>
            ),
        },
        {
            title: t('operatorReview.drawer.decline'),
            dataIndex: 'myDeclinedTasks',
            key: 'myDeclinedTasks',
            width: 100,
            align: 'center',
            render: (count: number) => (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                    &nbsp;{count}
                </Tag>
            ),
        },
        {
            title: t('operatorReview.page.columns.action'),
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={() => dispatch(orderActions.openOperatorReviewDrawer(record.orderId))}
                    // disabled={record.myPendingTasks === 0}
                >
                    {t('operatorReview.page.reviewAction')}
                </Button>
            ),
        },
    ];

    return (
        <>
            <ResponsivePageHeader title={t('operatorReview.page.title')} icon={<CheckCircleOutlined />} />

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {[
                    {
                        label: t('orderManagement.stats.total'),
                        value: stats.totalOrders,
                        icon: FileTextOutlined,
                        color: token.colorPrimary,
                        borderColor: token.colorInfo || token.colorPrimary,
                        backgroundColor: `rgba(24, 144, 255, 0.04)`,
                    },
                    {
                        label: t('operatorReview.page.columns.tasks'),
                        value: stats.totalTasks,
                        icon: AppstoreOutlined,
                        color: token.colorPrimary,
                        borderColor: `rgba(114, 46, 209, 1)`,
                        backgroundColor: `rgba(114, 46, 209, 0.04)`,
                    },
                    {
                        label: t('operatorReview.page.pendingReviews'),
                        value: stats.pendingTasks,
                        icon: ClockCircleOutlined,
                        color: token.colorPrimary,
                        borderColor: token.colorWarning,
                        backgroundColor: `rgba(250, 173, 20, 0.04)`,
                    },
                    {
                        label: t('operatorReview.page.confirmedTasks'),
                        value: stats.confirmedTasks,
                        icon: CheckCircleOutlined,
                        color: token.colorPrimary,
                        borderColor: token.colorSuccess,
                        backgroundColor: `rgba(82, 196, 26, 0.04)`,
                    },
                ].map((stat, index) => {
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

            <Card
                style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 0 } }}
            >
                <Table
                    columns={columns}
                    dataSource={myReviewingOrders}
                    rowKey="orderId"
                    loading={isLoadingOrders}
                    scroll={{ x: 1200, y: 'calc(100vh - 420px)' }}
                    sticky
                    bordered
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        position: ['bottomCenter'],
                    }}
                />
            </Card>

            <OperatorReviewDrawer />
        </>
    );
};

export default MyReviewsPage;
