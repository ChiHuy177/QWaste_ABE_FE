'use client';

import { Card, Col, Flex, Progress, Row, Typography, theme, Button, Timeline } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExperimentOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { DashboardStats } from './DashboardStatsCards';

const { Text } = Typography;

interface DashboardSnapshotPanelsProps {
    stats: DashboardStats;
    topErrorMachine?: {
        machineName: string;
        errorCount: number;
    };
}

export default function DashboardSnapshotPanels({
    stats,
    topErrorMachine,
}: DashboardSnapshotPanelsProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const router = useRouter();

    const activityItems = [
        {
            color: token.colorError,
            children: (
                <Flex vertical>
                    <Text strong style={{ fontSize: 13 }}>
                        {topErrorMachine
                            ? `${topErrorMachine.machineName} ${t(
                                'adminPage.activity.errorSpike',
                                'has the most errors'
                            )}`
                            : t('adminPage.recentActivity.maintenanceStarted')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {topErrorMachine
                            ? `${topErrorMachine.errorCount} ${t(
                                'adminPage.errorTimeline.yAxis',
                                'errors'
                            )}`
                            : t('adminPage.recentActivity.maintenanceDescription')}
                    </Text>
                </Flex>
            ),
        },
        {
            color: token.colorWarning,
            children: (
                <Flex vertical>
                    <Text strong style={{ fontSize: 13 }}>
                        {stats.tasksQcPending} {t('adminPage.stats.waitingQC')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('adminPage.activity.qcQueue', 'Quality queue needs review')}
                    </Text>
                </Flex>
            ),
        },
        {
            color: token.colorSuccess,
            children: (
                <Flex vertical>
                    <Text strong style={{ fontSize: 13 }}>
                        {stats.staffWorking} {t('adminPage.stats.working')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('adminPage.activity.staffCoverage', 'Active staffing coverage')}
                    </Text>
                </Flex>
            ),
        },
    ];

    return (
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col xs={24} lg={8}>
                <Card
                    variant="borderless"
                    style={{
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                        border: '1px solid rgba(0, 64, 156, 0.1)',
                        height: '100%',
                    }}
                >
                    <Flex align="center" gap={8} style={{ marginBottom: 18 }}>
                        <ExperimentOutlined style={{ color: '#C18644', fontSize: 18 }} />
                        <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                            {t('adminPage.production.title', 'Production Snapshot')}
                        </Text>
                    </Flex>

                    <Flex vertical gap={14}>
                        <Flex justify="space-between" align="center">
                            <Text type="secondary">{t('sidebar.navigation.order')}</Text>
                            <Text strong>{stats.ordersInProgress}</Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Text type="secondary">{t('adminPage.stats.nearDeadline')}</Text>
                            <Text strong style={{ color: stats.ordersOverdue > 0 ? '#C35256' : '#458A6D' }}>
                                {stats.ordersOverdue}
                            </Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Text type="secondary">{t('sidebar.navigation.taskBoard')}</Text>
                            <Text strong>{stats.tasksInProgress}</Text>
                        </Flex>
                        <Progress
                            percent={stats.processProgress}
                            strokeColor="#458A6D"
                            trailColor={token.colorFillSecondary}
                            size="small"
                        />
                    </Flex>
                </Card>
            </Col>

            <Col xs={24} lg={8}>
                <Card
                    variant="borderless"
                    style={{
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                        border: '1px solid rgba(0, 64, 156, 0.1)',
                        height: '100%',
                    }}
                >
                    <Flex align="center" justify="space-between" gap={8} style={{ marginBottom: 18 }}>
                        <Flex align="center" gap={8}>
                            <ThunderboltOutlined style={{ color: '#C18644', fontSize: 18 }} />
                            <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                                {t('adminPage.energy.title', 'Energy Snapshot')}
                            </Text>
                        </Flex>
                        <Button
                            size="small"
                            onClick={() => router.push('/admin/electric')}
                            style={{ borderRadius: 8 }}
                        >
                            {t('common.view')}
                        </Button>
                    </Flex>

                    <Flex vertical gap={14}>
                        <Flex justify="space-between" align="center">
                            <Text type="secondary">{t('adminPage.energy.today', 'Today')}</Text>
                            <Text strong>{stats.energyToday.toLocaleString('en-US')} kWh</Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                            <Text type="secondary">{t('adminPage.stats.vsYesterday')}</Text>
                            <Text
                                strong
                                style={{ color: stats.energyTrend <= 0 ? '#458A6D' : '#C35256' }}
                            >
                                {stats.energyTrend > 0 ? '+' : ''}
                                {stats.energyTrend}%
                            </Text>
                        </Flex>
                        <Flex
                            align="center"
                            gap={10}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                background: token.colorBgLayout,
                            }}
                        >
                            <CheckCircleOutlined style={{ color: '#458A6D' }} />
                            <Text style={{ fontSize: 13 }}>
                                {t(
                                    'adminPage.energy.insight',
                                    'Energy trend is within the operating target.'
                                )}
                            </Text>
                        </Flex>
                    </Flex>
                </Card>
            </Col>

            <Col xs={24} lg={8}>
                <Card
                    variant="borderless"
                    style={{
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                        border: '1px solid rgba(0, 64, 156, 0.1)',
                        height: '100%',
                    }}
                >
                    <Flex align="center" gap={8} style={{ marginBottom: 18 }}>
                        <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                        <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                            {t('adminPage.recentActivity.title')}
                        </Text>
                    </Flex>

                    <Timeline items={activityItems} style={{ marginBottom: 0 }} />
                </Card>
            </Col>
        </Row>
    );
}
