'use client';

import { useMemo } from 'react';
import { Card, Row, Col, Flex, Grid, theme, Typography } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    CheckSquareOutlined,
    TeamOutlined,
    ExperimentOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

const { useBreakpoint } = Grid;
const { Text } = Typography;

export interface DashboardStats {
    machinesRunning: number;
    machinesTotal: number;
    machinesError: number;
    ordersInProgress: number;
    ordersOverdue: number;
    tasksInProgress: number;
    tasksQcPending: number;
    staffActive: number;
    staffWorking: number;
    processProgress: number;
    energyToday: number;
    energyTrend: number;
}

interface DashboardStatsCardsProps {
    stats: DashboardStats;
}

interface StatConfig {
    label: string;
    value: string;
    subLabel: string;
    subColor: string;
    subBg: string;
    icon: React.ComponentType<{ style?: React.CSSProperties }>;
    borderColor: string;
    backgroundColor: string;
    href: string;
}

export default function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const router = useRouter();
    const isMobile = !screens.md;

    const statsConfig: StatConfig[] = useMemo(
        () => [
            {
                label: t('sidebar.navigation.machine'),
                value: `${stats.machinesRunning} / ${stats.machinesTotal}`,
                subLabel: stats.machinesError > 0
                    ? `${stats.machinesError} ${t('machineManagement.statuses.error').toLowerCase()}`
                    : t('machineManagement.status.running'),
                subColor: stats.machinesError > 0 ? '#C35256' : '#458A6D',
                subBg: stats.machinesError > 0 ? '#FFF1F0' : '#F6FFED',
                icon: DashboardOutlined,
                borderColor: '#458A6D',
                backgroundColor: '#F6FFED',
                href: '/admin/machines',
            },
            {
                label: t('sidebar.navigation.order'),
                value: String(stats.ordersInProgress),
                subLabel: stats.ordersOverdue > 0
                    ? `${stats.ordersOverdue} ${t('adminPage.stats.nearDeadline')}`
                    : t('adminPage.stats.onSchedule'),
                subColor: stats.ordersOverdue > 0 ? '#C35256' : '#458A6D',
                subBg: stats.ordersOverdue > 0 ? '#FFF1F0' : '#F6FFED',
                icon: ShoppingOutlined,
                borderColor: '#1890FF',
                backgroundColor: '#E6F7FF',
                href: '/admin/order',
            },
            {
                label: t('sidebar.navigation.taskBoard'),
                value: String(stats.tasksInProgress),
                subLabel: stats.tasksQcPending > 0
                    ? `${stats.tasksQcPending} ${t('adminPage.stats.waitingQC')}`
                    : t('adminPage.stats.noPendingTasks'),
                subColor: stats.tasksQcPending > 0 ? '#C18644' : '#458A6D',
                subBg: stats.tasksQcPending > 0 ? '#FFF7E6' : '#F6FFED',
                icon: CheckSquareOutlined,
                borderColor: '#722ED1',
                backgroundColor: '#F9F0FF',
                href: '/admin/tasks',
            },
            {
                label: t('sidebar.navigation.staff'),
                value: String(stats.staffActive),
                subLabel: `${stats.staffWorking} ${t('adminPage.stats.working')}`,
                subColor: '#458A6D',
                subBg: '#F6FFED',
                icon: TeamOutlined,
                borderColor: '#13C2C2',
                backgroundColor: '#E6FFFB',
                href: '/admin/staff',
            },
            {
                label: t('sidebar.navigation.process'),
                value: `${stats.processProgress}%`,
                subLabel: t('adminPage.stats.productionProgress'),
                subColor: '#1890FF',
                subBg: '#E6F7FF',
                icon: ExperimentOutlined,
                borderColor: '#C18644',
                backgroundColor: '#FFF7E6',
                href: '/admin/process',
            },
            {
                label: t('sidebar.navigation.electric'),
                value: stats.energyToday.toLocaleString('en-US'),
                subLabel: stats.energyTrend < 0
                    ? `↓ ${Math.abs(stats.energyTrend)}% ${t('adminPage.stats.vsYesterday')}`
                    : `↑ ${stats.energyTrend}% ${t('adminPage.stats.vsYesterday')}`,
                subColor: stats.energyTrend <= 0 ? '#458A6D' : '#C35256',
                subBg: stats.energyTrend <= 0 ? '#F6FFED' : '#FFF1F0',
                icon: ThunderboltOutlined,
                borderColor: '#C18644',
                backgroundColor: '#FFF7E6',
                href: '/admin/electric',
            },
        ],
        [stats, t]
    );

    return (
        <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
            {statsConfig.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                    <Col xs={12} sm={8} lg={4} key={index}>
                        <Card
                            variant="borderless"
                            hoverable
                            onClick={() => router.push(stat.href)}
                            style={{
                                borderRadius: 12,
                                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                                height: '100%',
                                border: `1px solid ${stat.borderColor}`,
                                background: stat.backgroundColor,
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
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
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: token.colorPrimary,
                                    }}
                                >
                                    {stat.label}
                                </div>
                                <Flex align="center" gap={10}>
                                    <div
                                        style={{
                                            padding: 8,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#F3F2F3',
                                        }}
                                    >
                                        <IconComponent
                                            style={{
                                                color: stat.borderColor,
                                                fontSize: isMobile ? 18 : 22,
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            color: token.colorPrimary,
                                            fontSize: isMobile ? 20 : 26,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {stat.value}
                                    </div>
                                </Flex>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: stat.subColor,
                                        background: stat.subBg,
                                        padding: '2px 8px',
                                        borderRadius: 99,
                                        alignSelf: 'flex-start',
                                    }}
                                >
                                    {stat.subLabel}
                                </Text>
                            </Flex>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
}