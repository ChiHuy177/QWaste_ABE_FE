'use client';

import { Card, Row, Col, Flex, Grid, theme } from 'antd';
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { useBreakpoint } = Grid;

interface StaffStatsCardsProps {
    totalTasks: number;
    waitingQC: number;
    completedTasks: number;
    rejectedTasks: number;
}

export const StaffStatsCards = ({
    totalTasks,
    waitingQC,
    completedTasks,
    rejectedTasks,
}: StaffStatsCardsProps) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.md;

    const statsConfig = [
        {
            label: t('staffManagement.stats.totalTasks'),
            value: totalTasks,
            icon: AppstoreOutlined,
            color: token.colorPrimary,
            borderColor: '#1890FF',
            backgroundColor: '#E6F7FF',
        },
        {
            label: t('staffManagement.stats.waitingQC'),
            value: waitingQC,
            icon: ClockCircleOutlined,
            color: token.colorPrimary,
            borderColor: '#FA8C16',
            backgroundColor: '#FFF7E6',
        },
        {
            label: t('staffManagement.stats.completedTasks'),
            value: completedTasks,
            icon: CheckCircleOutlined,
            color: token.colorPrimary,
            borderColor: '#52C41A',
            backgroundColor: '#F6FFED',
        },
        {
            label: t('staffManagement.stats.rejectedTasks'),
            value: rejectedTasks,
            icon: CloseCircleOutlined,
            color: token.colorPrimary,
            borderColor: '#FF4D4F',
            backgroundColor: '#FFF1F0',
        },
    ];

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
                                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
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
                                            backgroundColor: '#F3F2F3',
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
                                        {stat.value.toLocaleString('en-US')}
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
