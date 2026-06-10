'use client';
import { Card, Col, Flex, Grid, Row, Typography, theme } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { IncidentStatus } from '@/types/IncidentReport';

const { useBreakpoint } = Grid;
const { Text } = Typography;

const STATUS_FILTER_KEY: Record<string, IncidentStatus> = {
    all: 'ALL',
    open: 'OPEN',
    inProgress: 'IN_PROGRESS',
    resolved: 'RESOLVED',
};

export interface IncidentStats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
}

interface IncidentStatsCardsProps {
    stats: IncidentStats;
    statusFilter: IncidentStatus;
    onFilterChange: (next: IncidentStatus) => void;
}

export const IncidentStatsCards: React.FC<IncidentStatsCardsProps> = ({
    stats,
    statusFilter,
    onFilterChange,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const pct = (n: number) => (stats.total > 0 ? `${Math.round((n / stats.total) * 100)}%` : '0%');

    const statCards = useMemo(
        () => [
            {
                key: 'total',
                label: t('maintenance.stats.totalReports'),
                value: stats.total,
                icon: FileTextOutlined,
                borderColor: token.colorInfo || token.colorPrimary,
                backgroundColor: token.colorPrimaryBg,
                filterKey: 'all',
            },
            {
                key: 'open',
                label: t('maintenance.stats.open'),
                value: stats.open,
                icon: ExclamationCircleOutlined,
                borderColor: token.colorWarning,
                backgroundColor: token.colorWarningBg,
                filterKey: 'open',
            },
            {
                key: 'inProgress',
                label: t('maintenance.stats.inProgress'),
                value: stats.inProgress,
                icon: SyncOutlined,
                borderColor: token.colorInfo,
                backgroundColor: token.colorInfoBg,
                filterKey: 'inProgress',
            },
            {
                key: 'resolved',
                label: t('maintenance.stats.resolved'),
                value: stats.resolved,
                icon: CheckCircleOutlined,
                borderColor: token.colorSuccess,
                backgroundColor: token.colorSuccessBg,
                filterKey: 'resolved',
            },
        ],
        [stats, token, t]
    );

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {statCards.map((card) => {
                const IconComponent = card.icon;
                const isActive =
                    !!card.filterKey && statusFilter === STATUS_FILTER_KEY[card.filterKey];
                return (
                    <Col xs={24} sm={12} lg={6} key={card.key}>
                        <Card
                            variant="borderless"
                            hoverable={!!card.filterKey}
                            onClick={() => {
                                if (card.filterKey) {
                                    onFilterChange(STATUS_FILTER_KEY[card.filterKey]);
                                }
                            }}
                            style={{
                                borderRadius: 12,
                                boxShadow: isActive
                                    ? `0 0 0 2px ${card.borderColor}, ${token.boxShadow}`
                                    : token.boxShadow,
                                height: '100%',
                                border: `1px solid ${card.borderColor}`,
                                background: card.backgroundColor,
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: card.filterKey ? 'pointer' : 'default',
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
                                    background: `${card.borderColor}15`,
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
                                    {card.label}
                                </div>
                                <Flex align="center" gap={12}>
                                    <div
                                        style={{
                                            padding: 8,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: token.colorBgContainer,
                                        }}
                                    >
                                        <IconComponent
                                            style={{ color: card.borderColor, fontSize: 24 }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            color: token.colorPrimary,
                                            fontSize: isMobile ? 24 : 32,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {card.value.toLocaleString()}
                                    </div>
                                </Flex>
                                {card.filterKey && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {t('maintenance.stats.percentOfTotal', {
                                            percent: pct(card.value),
                                        })}
                                    </Text>
                                )}
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};
