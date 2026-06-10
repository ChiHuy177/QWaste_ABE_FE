'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Row, Col, } from 'antd';
import { FileTextOutlined, } from '@ant-design/icons';
import { usePageTitle } from '@/hooks/usePageTitle';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { OrderStatsCards } from './_components/OrderStatsCards';
import { OrdersList } from './_components/OrdersList';
import { OrderForm } from './_components/OrderForm';
import { orderActions } from '@/stores/OrderStore';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { OrderDetailDrawer } from './_components/OrderDetailDrawer';
import { ManagerReviewDrawer } from './_components/ManagerReviewDrawer';
import { OrderSummaryResponse } from '@/types/Order';
import { useAuth } from '@/contexts/AuthContext';


const OrderPage = () => {
    const { t } = useTranslation();
    usePageTitle(t('pageTitle.orderManagement'));

    const dispatch = useAppDispatch();
    const { user } = useAuth();

    const { orders } = useAppSelector((state) => state.order);
    const isAdmin = user?.roles?.some((role) =>
        ['admin', 'super_admin'].includes(role.toLowerCase())
    );

    // Load initial data
    useEffect(() => {
        dispatch(orderActions.fetchOrders());
    }, [dispatch]);

    const orderStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: OrderSummaryResponse) => o.orderStatus === 'REVIEWING')
            .length,
        inProductionOrders: orders.filter(
            (o: OrderSummaryResponse) =>
                o.orderStatus === 'CONFIRMED' || o.orderStatus === 'IN_PROGRESS'
        ).length,
        completedOrders: orders.filter((o: OrderSummaryResponse) => o.orderStatus === 'COMPLETED')
            .length,
    };

    return (
        <>
            <ResponsivePageHeader
                title={t('orderManagement.page.title')}
                icon={<FileTextOutlined />}
            />

            <OrderStatsCards
                totalOrders={orderStats.totalOrders}
                pendingOrders={orderStats.pendingOrders}
                completedOrders={orderStats.completedOrders}
                inProductionOrders={orderStats.inProductionOrders}
            />

            <Row gutter={[16, 16]}>
                <Col xs={24}>
                    <Card style={{ borderRadius: 8 }}>
                        <OrdersList />
                    </Card>
                </Col>
            </Row>

            <OrderForm />
            <OrderDetailDrawer />
            {isAdmin && <ManagerReviewDrawer />}

        </>
    );
};

export default OrderPage;
