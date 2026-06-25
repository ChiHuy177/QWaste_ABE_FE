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
  stats: MachineStats;
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
      value: stats.totalRun,
      icon: PlayCircleOutlined,
      color: token.colorPrimary,
      borderColor: token.colorSuccess,
      backgroundColor: token.colorSuccessBg,
    },
    {
      label: t('machineManagement.stats.totalIdle'),
      value: stats.totalIdle,
      icon: PauseCircleOutlined,
      color: token.colorPrimary,
      borderColor: token.colorWarning,
      backgroundColor: token.colorWarningBg,
    },
    {
      label: t('machineManagement.stats.totalError'),
      value: stats.totalError,
      icon: CloseCircleOutlined,
      color: token.colorPrimary,
      borderColor: token.colorError,
      backgroundColor: token.colorErrorBg,
    },
    {
      label: t('machineManagement.stats.totalEmpty'),
      value: stats.totalEmpty,
      icon: StopOutlined,
      color: token.colorPrimary,
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
                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
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
                      backgroundColor: '#F3F2F3',
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
                      color: token.colorPrimary,
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
                    {stat.value.toLocaleString('en-US')}
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