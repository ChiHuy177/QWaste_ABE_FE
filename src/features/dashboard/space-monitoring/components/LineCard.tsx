'use client';

import React from 'react';
import { Typography, theme } from 'antd';
import {
    DownOutlined,
    ThunderboltOutlined,
    ClockCircleOutlined,
    PauseCircleOutlined,
    PoweroffOutlined,
    CloseCircleOutlined,
    DoubleRightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SpaceOverview } from '@/types/Space';
import { computeSpaceStats, formatSeconds } from '@/utils/spaceStatsUtils';
import styles from './LineCard.module.css';

const { Text } = Typography;

interface LineCardProps {
    line: SpaceOverview;
    isExpanded: boolean;
    onToggle: () => void;
}

const LineCard: React.FC<LineCardProps> = ({ line, isExpanded, onToggle }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const stats = computeSpaceStats(line);
    const machineCount = line.machineChildren.length;
    const energyValue =
        stats.energyKwh > 0
            ? `${stats.energyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`
            : '--';

    const metrics = [
        {
            key: 'energy',
            label: t('machineManagement.timeline.energy', 'Energy'),
            mobileLabel: t('machineManagement.timeline.energy', 'Energy'),
            value: energyValue,
            icon: ThunderboltOutlined,
            color: token.colorInfo,
            bg: token.colorInfoBg,
        },
        {
            key: 'measured',
            label: t('machineManagement.timeline.measuredEnergy', 'Measured Energy'),
            mobileLabel: 'M. Energy',
            value: '--',
            icon: ThunderboltOutlined,
            color: token.colorWarning,
            bg: token.colorWarningBg,
        },
        {
            key: 'run',
            label: t('factoryOverview.zone.run', 'Run'),
            mobileLabel: t('factoryOverview.zone.run', 'Run'),
            value: formatSeconds(stats.runtimeSeconds),
            icon: ClockCircleOutlined,
            color: token.colorSuccess,
            bg: token.colorSuccessBg,
        },
        {
            key: 'idle',
            label: t('factoryOverview.zone.stop', 'Stop'),
            mobileLabel: t('factoryOverview.zone.stop', 'Stop'),
            value: formatSeconds(stats.idleSeconds),
            icon: PauseCircleOutlined,
            color: token.colorWarning,
            bg: token.colorWarningBg,
        },
        {
            key: 'offline',
            label: t('factoryOverview.zone.offline', 'Offline'),
            mobileLabel: t('factoryOverview.zone.offline', 'Offline'),
            value: formatSeconds(stats.offlineSeconds),
            icon: PoweroffOutlined,
            color: token.colorPrimary,
            bg: token.colorPrimaryBg,
        },
        {
            key: 'error',
            label: t('factoryOverview.zone.error', 'Error'),
            mobileLabel: t('factoryOverview.zone.error', 'Error'),
            value: formatSeconds(stats.errorSeconds),
            icon: CloseCircleOutlined,
            color: token.colorError,
            bg: token.colorErrorBg,
        },
    ];

    return (
        <div
            className={styles.card}
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onToggle();
                }
            }}
            style={{
                minWidth: 320,
                flexShrink: 0,
                borderRadius: 16,
                overflow: 'hidden',
                border: isExpanded
                    ? `1.5px solid ${token.colorPrimary}`
                    : `1px solid ${token.colorBorderSecondary}`,
                borderLeft: `4px solid ${token.colorPrimary}`,
                background: token.colorBgContainer,
                boxShadow: isExpanded ? token.boxShadowSecondary : token.boxShadowTertiary,
                /* removed hover effect - compatibility fix */
                cursor: 'pointer',
            }}
        >
            {/* ── Header row (both desktop + mobile) ── */}
            <div className={styles.header}>
                {/* Chevron */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: token.colorFillSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorPrimary,
                        flexShrink: 0,
                    }}
                >
                    <DownOutlined
                        style={{
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    />
                </div>

                {/* Name + machine count */}
                <div className={styles.nameSection}>
                    <Text
                        strong
                        style={{
                            fontSize: 16,
                            color: token.colorText,
                            display: 'block',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {line.spaceName}
                    </Text>
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                        {machineCount} {t('factoryOverview.zone.machines', 'machines')}
                    </Text>
                </div>

                {/* Vertical divider — hidden on mobile via CSS */}
                <div
                    className={styles.divider}
                    style={{ background: token.colorBorderSecondary }}
                />

                {/* Desktop metrics — hidden on mobile via CSS */}
                <div className={styles.desktopMetrics}>
                    {metrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <div className={styles.metricItem} key={metric.key}>
                                <div
                                    className={styles.metricIconWrap}
                                    style={{ background: metric.bg, color: metric.color }}
                                >
                                    <Icon />
                                </div>
                                <div>
                                    <span
                                        className={styles.metricLabel}
                                        style={{ color: token.colorTextSecondary }}
                                    >
                                        {metric.label}
                                    </span>
                                    <span
                                        className={styles.metricValue}
                                        style={{ color: metric.color }}
                                    >
                                        {metric.value}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Arrow — hidden on mobile via CSS */}
                <div
                    className={styles.arrowCircle}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: token.colorFillSecondary,
                        color: token.colorPrimary,
                    }}
                >
                    <DoubleRightOutlined />
                </div>
            </div>

            {/* ── Mobile metric pills (2-column grid) — hidden on desktop via CSS ── */}
            <div className={styles.mobileMetricGrid}>
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div
                            className={styles.mobilePill}
                            key={metric.key}
                            style={{ background: metric.bg }}
                        >
                            <div
                                className={styles.mobilePillIcon}
                                style={{
                                    background: `${metric.color}20`,
                                    color: metric.color,
                                }}
                            >
                                <Icon />
                            </div>
                            <div>
                                <span
                                    className={styles.mobilePillLabel}
                                    style={{ color: token.colorTextSecondary }}
                                >
                                    {metric.mobileLabel}
                                </span>
                                <span
                                    className={styles.mobilePillValue}
                                    style={{ color: metric.color }}
                                >
                                    {metric.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(LineCard);
