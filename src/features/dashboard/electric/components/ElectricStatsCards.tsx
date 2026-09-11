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

    // Không có token semantic cho tím — mix với nền/viền hiện tại của theme (thay vì hex tĩnh)
    // để tự thích ứng dark mode giống 3 chỉ số còn lại.
    const partsAccent = '#722ED1';

    const statsConfig = useMemo(
        () => [
            {
                label: t('electricManagement.stats.totalConsumption'),
                compactValue: formatFullNumber(stats?.totalComsumption ?? 0),
                fullValue: formatFullNumber(stats?.totalComsumption ?? 0),
                icon: ThunderboltOutlined,
                color: token.colorInfo,
                borderColor: token.colorInfo,
                backgroundColor: token.colorInfoBg,
            },
            {
                label: t('electricManagement.stats.totalCost'),
                compactValue: formatCompactNumber(stats?.totalCost ?? 0),
                fullValue: formatFullNumber(stats?.totalCost ?? 0),
                icon: DollarOutlined,
                color: token.colorSuccess,
                borderColor: token.colorSuccess,
                backgroundColor: token.colorSuccessBg,
            },
            {
                label: t('electricManagement.stats.totalIdleTime'),
                compactValue: formatFullNumber(stats?.totalIdleTime ?? 0),
                fullValue: formatFullNumber(stats?.totalIdleTime ?? 0),
                icon: ClockCircleOutlined,
                color: token.colorWarning,
                borderColor: token.colorWarning,
                backgroundColor: token.colorWarningBg,
            },
            {
                label: t('electricManagement.stats.totalParts'),
                compactValue: formatFullNumber(stats?.totalParts ?? 0),
                fullValue: formatFullNumber(stats?.totalParts ?? 0),
                icon: AppstoreOutlined,
                // color = accent thuần cho text/icon/góc trang trí; border/bg mix theo theme.
                color: partsAccent,
                borderColor: `color-mix(in srgb, ${partsAccent} 45%, ${token.colorBorder})`,
                backgroundColor: `color-mix(in srgb, ${partsAccent} 12%, ${token.colorBgContainer})`,
            },
        ],
        [stats, t, token, partsAccent]
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
                                boxShadow: token.boxShadowSecondary,
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
                                    background: `color-mix(in srgb, ${stat.color} 15%, transparent)`,
                                    borderBottomLeftRadius: '100%',
                                }}
                            />

                            <Flex vertical gap={8} style={{ position: 'relative', zIndex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: stat.color,
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
                                            backgroundColor: token.colorBgTextHover,
                                        }}
                                    >
                                        <IconComponent
                                            style={{
                                                color: stat.color,
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
