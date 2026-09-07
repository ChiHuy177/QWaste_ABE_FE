'use client';

import React from 'react';
import { Card, Row, Col, Flex, Grid, theme, Tooltip } from 'antd';
import {
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface FactoryStatsCardsProps {
    energyConsumption: number;
    totalRunTime: number;
    totalStopTime: number;
    totalErrorTime: number;
}

const { useBreakpoint } = Grid;

const formatCompactNumber = (value: number): string =>
    new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value);

const formatEnergy = (value: number): string => `${formatCompactNumber(value)} kWh`;

const formatFullEnergy = (value: number): string =>
    `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh`;

const FactoryStatsCards: React.FC<FactoryStatsCardsProps> = ({
    energyConsumption,
    totalRunTime,
    totalStopTime,
    totalErrorTime,
}) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.md;

    // Format decimal hours to "Xh Ym" format
    const formatHoursToHoursMinutes = (decimalHours: number): string => {
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);

        if (hours === 0 && minutes === 0) return '0h';
        if (minutes === 0) return `${hours}h`;
        if (hours === 0) return `${minutes}m`;
        return `${hours}h${minutes}m`;
    };

    const statsConfig = [
        {
            label: t('factoryOverview.stats.energyConsumption'),
            value: formatEnergy(energyConsumption),
            fullValue: formatFullEnergy(energyConsumption),
            icon: ThunderboltOutlined,
            color: token.colorInfo,
            borderColor: token.colorInfo,
            backgroundColor: token.colorInfoBg,
        },
        {
            label: t('factoryOverview.stats.totalRunTime'),
            value: formatHoursToHoursMinutes(totalRunTime),
            fullValue: formatHoursToHoursMinutes(totalRunTime),
            icon: ClockCircleOutlined,
            color: token.colorSuccess,
            borderColor: token.colorSuccess,
            backgroundColor: token.colorSuccessBg,
        },
        {
            label: t('factoryOverview.stats.totalStopTime'),
            value: formatHoursToHoursMinutes(totalStopTime),
            fullValue: formatHoursToHoursMinutes(totalStopTime),
            icon: PauseCircleOutlined,
            color: token.colorWarning,
            borderColor: token.colorWarning,
            backgroundColor: token.colorWarningBg,
        },
        {
            label: t('factoryOverview.stats.totalErrorTime'),
            value: formatHoursToHoursMinutes(totalErrorTime),
            fullValue: formatHoursToHoursMinutes(totalErrorTime),
            icon: CloseCircleOutlined,
            color: token.colorError,
            borderColor: token.colorError,
            backgroundColor: token.colorErrorBg,
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
                                    background: `${stat.borderColor}15`,
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
                                            {stat.value}
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

export default React.memo(FactoryStatsCards);
