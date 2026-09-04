'use client';

import React from 'react';
import { Flex, Tag, Typography, theme } from 'antd';
import { ClockCircleOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ErrorSummaryStats } from '@/types/ErrorManagement';

const { Text } = Typography;

interface ErrorInfoBarProps {
    totalIncidents: number;
    displayedIncidents: number;
    stats: ErrorSummaryStats;
    isFiltered?: boolean;
}

export const ErrorInfoBar: React.FC<ErrorInfoBarProps> = ({
    totalIncidents,
    displayedIncidents,
    stats,
    isFiltered = false,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    const formatDowntime = (totalMinutes: number) => {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    };

    return (
        <Flex
            align="center"
            wrap="wrap"
            gap={16}
            style={{
                padding: '10px 16px',
                background: token.colorFillQuaternary,
                borderRadius: 8,
                marginBottom: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            <Flex align="center" gap={8}>
                <WarningOutlined
                    style={{
                        fontSize: 16,
                        color: token.colorWarning,
                    }}
                />
                <Text
                    strong
                    style={{
                        fontSize: 14,
                        color: token.colorText,
                    }}
                >
                    {t('errorManagement.kpi.totalIncidents')}:{' '}
                    <span style={{ color: token.colorPrimary, fontWeight: 700 }}>
                        {displayedIncidents}
                    </span>
                    {isFiltered && (
                        <span style={{ fontSize: 13, color: token.colorTextSecondary }}>
                            {' '}
                            / {totalIncidents}
                        </span>
                    )}
                </Text>
            </Flex>

            {stats.ongoingIncidents > 0 && (
                <Tag
                    color="warning"
                    style={{
                        margin: 0,
                        borderRadius: token.borderRadiusSM,
                        padding: '2px 8px',
                        fontWeight: 500,
                    }}
                >
                    <SyncOutlined spin style={{ marginRight: 4 }} />
                    {stats.ongoingIncidents} {t('errorManagement.header.activeIncidents')}
                </Tag>
            )}

            <Flex align="center" gap={6}>
                <ClockCircleOutlined style={{ fontSize: 14, color: token.colorError }} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {t('errorManagement.kpi.totalDowntime')}:{' '}
                    <Text strong style={{ color: token.colorError, fontFamily: 'monospace' }}>
                        {formatDowntime(stats.totalDowntimeMinutes)}
                    </Text>
                </Text>
            </Flex>
        </Flex>
    );
};
