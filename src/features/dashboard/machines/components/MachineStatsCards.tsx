'use client';

import React from 'react';
import { Card, Row, Col, Flex, Grid, theme } from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { MachineStats } from '@/types/Machine';

interface MachineStatsCardsProps {
    stats?: MachineStats;
}

const { useBreakpoint } = Grid;

const MachineStatsCards: React.FC<MachineStatsCardsProps> = ({ stats }) => {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.md;

    const statsConfig = [
        {
            label: t('machineManagement.stats.totalRun'),
            value: stats?.totalRun ?? 0,
            icon: PlayCircleOutlined,
            color: token.colorSuccess,
            borderColor: token.colorSuccess,
            backgroundColor: token.colorSuccessBg,
        },
        {
            label: t('machineManagement.stats.totalIdle'),
            value: stats?.totalIdle ?? 0,
            icon: PauseCircleOutlined,
            color: token.colorWarning,
            borderColor: token.colorWarning,
            backgroundColor: token.colorWarningBg,
        },
        {
            label: t('machineManagement.stats.totalError'),
            value: stats?.totalError ?? 0,
            icon: CloseCircleOutlined,
            color: token.colorError,
            borderColor: token.colorError,
            backgroundColor: token.colorErrorBg,
        },
        {
            label: t('machineManagement.stats.totalOffline'),
            value: stats?.totalOffline ?? 0,
            icon: StopOutlined,
            color: token.colorTextDisabled,
            borderColor: token.colorTextDisabled,
            backgroundColor: token.colorFillQuaternary,
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
                            }}
                        >
                            <Flex align="center" gap={16} wrap="nowrap">
                                <div
                                    style={{
                                        padding: 12,
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 48,
                                        height: 48,
                                        flexShrink: 0,
                                    }}
                                >
                                    <IconComponent
                                        style={{
                                            color: stat.borderColor,
                                            fontSize: 24,
                                            backgroundColor: token.colorBgTextHover,
                                            padding: 10,
                                            borderRadius: 50,
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: stat.color,
                                            marginBottom: 4,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {stat.label}
                                    </div>
                                    <div
                                        style={{
                                            color: stat.color,
                                            fontSize: isMobile ? 24 : 32,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {(stat.value ?? 0).toLocaleString('en-US')}
                                    </div>
                                </div>
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};

export default MachineStatsCards;
