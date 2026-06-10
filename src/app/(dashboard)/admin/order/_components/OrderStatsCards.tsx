'use client';

import { Card, Row, Col, Flex, Grid, theme } from 'antd';
import {
    FileTextOutlined,
    EditOutlined,
    SyncOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const { useBreakpoint } = Grid;

interface OrderStatsCardsProps {
    totalOrders: number;
    pendingOrders: number;
    inProductionOrders: number;
    completedOrders: number;
}

export const OrderStatsCards = ({
    totalOrders,
    pendingOrders,
    inProductionOrders,
    completedOrders,
}: OrderStatsCardsProps) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.md;

    const statsConfig = useMemo(
        () => [
            {
                label: t('orderManagement.stats.total'),
                value: totalOrders,
                icon: FileTextOutlined,
                color: token.colorPrimary,
                borderColor: token.colorInfo || token.colorPrimary,
                backgroundColor: `#e6f4ff`,
            },
            {
                label: t('orderManagement.stats.reviewing'),
                value: pendingOrders,
                icon: EditOutlined,
                color: token.colorPrimary,
                borderColor: token.colorWarning,
                backgroundColor: `#fff1b8`,
            },
            {
                label: t('orderManagement.stats.inProduction'),
                value: inProductionOrders,
                icon: SyncOutlined,
                color: token.colorPrimary,
                borderColor: `rgba(114, 46, 209, 1)`,
                backgroundColor: `rgba(114, 46, 209, 0.04)`,
            },
            {
                label: t('orderManagement.stats.completed'),
                value: completedOrders,
                icon: CheckCircleOutlined,
                color: token.colorPrimary,
                borderColor: token.colorSuccess,
                backgroundColor: `rgba(82, 196, 26, 0.04)`,
            },
        ],
        [totalOrders, pendingOrders, inProductionOrders, completedOrders, token.colorPrimary, token.colorWarning, token.colorSuccess, token.colorInfo]
    );

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {statsConfig.map((stat, index) => {
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
                            {/* Decorative corner */}
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

                            <Flex vertical gap={8} style={{ position: 'relative', zIndex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: token.colorPrimary,
                                    }}
                                >
                                    {stat.label}
                                </div>
                                <Flex align="center" gap={12}>
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
                                            fontSize: isMobile ? 24 : 32,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {stat.value.toLocaleString()}
                                    </div>
                                </Flex>
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};
