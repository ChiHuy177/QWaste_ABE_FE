'use client';

import React from 'react';
import { Flex, Tag, theme } from 'antd';
import {
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    CloseCircleOutlined,
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
        // Labels are identical across sibling rows, so fixing the value box
        // width is what keeps each pill column the same size regardless of
        // value length ('61h8m' vs '205h57m') or label language.
        const tagStyle: React.CSSProperties = {
            margin: 0,
            fontSize: 13,
            lineHeight: '22px',
            padding: '2px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            minWidth: 132,
            textAlign: 'center',
        };
        const timeValueStyle: React.CSSProperties = {
            display: 'inline-block',
            minWidth: 62,
            textAlign: 'left',
        };
        const countValueStyle: React.CSSProperties = {
            display: 'inline-block',
            minWidth: 24,
            textAlign: 'left',
        };
        return (
            <Flex gap={8} wrap="wrap" align="center">
                <Tag color="success" style={tagStyle}>
                    {t('factoryOverview.onlineTime', 'Online time')}:{' '}
                    <strong style={timeValueStyle}>
                        {formatSeconds(
                            stats.runtimeSeconds + stats.idleSeconds + stats.errorSeconds
                        )}
                    </strong>
                </Tag>
                <Tag color="warning" style={tagStyle}>
                    {t('factoryOverview.zone.stop', 'Stop')}:{' '}
                    <strong style={timeValueStyle}>{formatSeconds(stats.idleSeconds)}</strong>
                </Tag>
                <Tag color="error" style={tagStyle}>
                    {t('factoryOverview.zone.error', 'Error')}:{' '}
                    <strong style={timeValueStyle}>{formatSeconds(stats.errorSeconds)}</strong>
                </Tag>
                <Tag style={tagStyle}>
                    <DesktopOutlined />{' '}
                    <strong style={countValueStyle}>{stats.totalMachines}</strong>
                </Tag>
                <Tag style={tagStyle}>
                    <ClockCircleOutlined />{' '}
                    <span>{t('factoryOverview.machine.lastUpdate', 'Last update')}: </span>
                    <strong style={timeValueStyle}>{stats.lastUpdate || '--'}</strong>
                </Tag>
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
            label: t('factoryOverview.onlineTime', 'Online time'),
            value: formatSeconds(stats.runtimeSeconds + stats.idleSeconds + stats.errorSeconds),
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
            icon: <ClockCircleOutlined style={{ fontSize: 18, color: token.colorBgBase }} />,
            label: t('factoryOverview.machine.lastUpdate', 'Last update'),
            value: stats.lastUpdate || '--',
        },
    ];

    // Fixed widths: Energy 130px, Run 110px, Stop 110px, Error 110px, Last Update 130px
    const columnWidths = [130, 110, 110, 110, 130];

    return (
        <div style={{ display: 'flex' }}>
            {items.map((item, index) => (
                <div
                    key={item.label}
                    style={{
                        width: columnWidths[index],
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    {item.icon}
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 12,
                                color: token.colorBgBase,
                                opacity: 0.75,
                            }}
                        >
                            {item.label}
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {item.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default React.memo(SpaceStatsBar);
