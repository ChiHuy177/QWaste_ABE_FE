'use client';

import React from 'react';
import { Row, Col, Space, Tag, Alert, Divider, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { OrderResponse } from '@/types/Order';
import { ORDER_STATUS_TAG_COLORS } from '../constants';

const { Text } = Typography;

interface OrderOverviewStatsProps {
    currentOrder: OrderResponse;
}

export const OrderOverviewStats: React.FC<OrderOverviewStatsProps> = ({ currentOrder }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const formatTime = (seconds?: number) => {
        if (!seconds) return 'N/A';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div style={{ marginBottom: 8 }}>
            <Divider titlePlacement="left" styles={{ content: { margin: 0 } }}>
                <Text strong style={{ fontSize: 15, color: token.colorPrimary }}>
                    {t('orderManagement.form.sections.orderOverview')}
                </Text>
            </Divider>
            <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                    <Space orientation="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('orderManagement.form.fields.status')}
                        </Text>
                        <Tag color={ORDER_STATUS_TAG_COLORS[currentOrder.orderStatus] || 'default'}>
                            {currentOrder.orderStatus}
                        </Tag>
                    </Space>
                </Col>
                <Col xs={12} md={6}>
                    <Space orientation="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('orderManagement.form.fields.totalEstimatedLeadtime')}
                        </Text>
                        <Text strong>{formatTime(currentOrder.totalEstimatedLeadtime)}</Text>
                    </Space>
                </Col>
                <Col xs={12} md={4}>
                    <Space orientation="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('orderManagement.form.fields.requestedQuantity')}
                        </Text>
                        <Text strong>{currentOrder.orderRequestedQuantity || 0}</Text>
                    </Space>
                </Col>
                <Col xs={12} md={4}>
                    <Space orientation="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('orderManagement.form.fields.plannedQuantity')}
                        </Text>
                        <Text strong style={{ color: token.colorInfo }}>
                            {currentOrder.orderPlannedQuantity || 0}
                        </Text>
                    </Space>
                </Col>
                <Col xs={12} md={4}>
                    <Space orientation="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('orderManagement.form.fields.actualQuantity')}
                        </Text>
                        <Text strong style={{ color: token.colorSuccess }}>
                            {currentOrder.orderActualQuantity || 0}
                        </Text>
                    </Space>
                </Col>
            </Row>
            {currentOrder.cancellationReason && (
                <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Alert
                            type="error"
                            title={t('orderManagement.form.fields.cancellationReason')}
                            description={currentOrder.cancellationReason}
                            showIcon
                        />
                    </Col>
                </Row>
            )}
        </div>
    );
};
