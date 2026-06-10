'use client';

import React from 'react';
import { Flex, Tag, theme } from 'antd';
import {
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    DesktopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SpaceComputedStats } from '@/types/Space';
import { formatSeconds } from '@/utils/spaceStatsUtils';

interface SpaceStatsBarProps {
    stats: SpaceComputedStats;
    variant: 'full' | 'inline';
}

const SpaceStatsBar: React.FC<SpaceStatsBarProps> = ({ stats, variant }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    if (variant === 'inline') {
        const tagStyle: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: '22px', padding: '2px 8px', borderRadius: 6 };
        return (
            <Flex gap={8} wrap="wrap" align="center">
                <Tag color="success" style={tagStyle}>
                    {t('factoryOverview.zone.run', 'Run')}: <strong>{formatSeconds(stats.runtimeSeconds)}</strong>
                </Tag>
                <Tag color="warning" style={tagStyle}>
                    {t('factoryOverview.zone.stop', 'Stop')}: <strong>{formatSeconds(stats.idleSeconds)}</strong>
                </Tag>
                {stats.errorSeconds > 0 && (
                    <Tag color="error" style={tagStyle}>
                        {t('factoryOverview.zone.error', 'Error')}:{' '}
                        <strong>{formatSeconds(stats.errorSeconds)}</strong>
                    </Tag>
                )}
                <Tag style={tagStyle}>
                    <DesktopOutlined /> <strong>{stats.totalMachines}</strong>
                </Tag>
                {stats.operatorCount > 0 && (
                    <Tag style={tagStyle}>
                        <UserOutlined /> <strong>{stats.operatorCount}</strong>
                    </Tag>
                )}
            </Flex>
        );
    }

    // variant === 'full'
    const items = [
        {
            icon: <ThunderboltOutlined style={{ fontSize: 18, color: token.colorBgBase }} />,
            label: t('machineManagement.timeline.energy', 'Energy'),
            value: `${stats.energyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`,
        },
        {
            icon: <ClockCircleOutlined style={{ fontSize: 18, color: token.colorSuccessText }} />,
            label: t('factoryOverview.zone.run', 'Run'),
            value: formatSeconds(stats.runtimeSeconds),
        },
        {
            icon: <PauseCircleOutlined style={{ fontSize: 18, color: token.colorWarningText }} />,
            label: t('factoryOverview.zone.stop', 'Stop'),
            value: formatSeconds(stats.idleSeconds),
        },
        {
            icon: <CloseCircleOutlined style={{ fontSize: 18, color: token.colorErrorText }} />,
            label: t('factoryOverview.zone.error', 'Error'),
            value: formatSeconds(stats.errorSeconds),
        },
        {
            icon: <UserOutlined style={{ fontSize: 18, color: token.colorBgBase }} />,
            label: t('machineManagement.timeline.operatorCount', 'Operators'),
            value: String(stats.operatorCount),
        },
    ];

    return (
        <Flex gap={24} wrap="wrap">
            {items.map((item) => (
                <Flex align="center" gap={8} key={item.label}>
                    {item.icon}
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorBgBase,
                                opacity: 0.75,
                            }}
                        >
                            {item.label}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{item.value}</div>
                    </div>
                </Flex>
            ))}
        </Flex>
    );
};

export default React.memo(SpaceStatsBar);
