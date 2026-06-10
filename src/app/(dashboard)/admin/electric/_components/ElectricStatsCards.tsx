'use client';

import { useMemo } from 'react';
import { Card, Row, Col, Flex, Grid, theme, Tooltip } from 'antd';
import {
    ThunderboltOutlined,
    DollarOutlined,
    ClockCircleOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { useBreakpoint } = Grid;

const formatCompactNumber = (value: number): string =>
    new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value);

const formatFullNumber = (value: number): string =>
    new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(value);

export interface ElectricStats {
    totalComsumption?: number;
    totalCost?: number;
    totalIdleTime?: number;
    totalParts?: number;
}

interface StatsCardsProps {
    stats: ElectricStats | null;
}

export const ElectricStatsCards = ({ stats }: StatsCardsProps) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.md;

    const statsConfig = useMemo(
        () => [
            {
                label: t('electricManagement.stats.totalConsumption'),
                compactValue: formatFullNumber(stats?.totalComsumption ?? 0),
                fullValue: formatFullNumber(stats?.totalComsumption ?? 0),
                icon: ThunderboltOutlined,
                color: token.colorPrimary,
                borderColor: '#1890FF',
                backgroundColor: '#E6F7FF',
            },
            {
                label: t('electricManagement.stats.totalCost'),
                compactValue: formatCompactNumber(stats?.totalCost ?? 0),
                fullValue: formatFullNumber(stats?.totalCost ?? 0),
                icon: DollarOutlined,
                color: token.colorPrimary,
                borderColor: '#52C41A',
                backgroundColor: '#F6FFED',
            },
            {
                label: t('electricManagement.stats.totalIdleTime'),
                compactValue: formatFullNumber(stats?.totalIdleTime ?? 0),
                fullValue: formatFullNumber(stats?.totalIdleTime ?? 0),
                icon: ClockCircleOutlined,
                color: token.colorPrimary,
                borderColor: '#FA8C16',
                backgroundColor: '#FFF7E6',
            },
            {
                label: t('electricManagement.stats.totalParts'),
                compactValue: formatFullNumber(stats?.totalParts ?? 0),
                fullValue: formatFullNumber(stats?.totalParts ?? 0),
                icon: AppstoreOutlined,
                color: token.colorPrimary,
                borderColor: '#722ED1',
                backgroundColor: '#F9F0FF',
            },
        ],
        [stats, t, token.colorPrimary]
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
                                    <Tooltip title={stat.fullValue}>
                                        <div
                                            style={{
                                                color: stat.color,
                                                fontSize: isMobile ? 24 : 32,
                                                fontWeight: 700,
                                                lineHeight: 1,
                                                minWidth: 0,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {stat.compactValue}
                                        </div>
                                    </Tooltip>
                                </Flex>
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};
