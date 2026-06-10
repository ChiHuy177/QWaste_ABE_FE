'use client';

import { ReactNode } from 'react';
import { Card, Col, Flex, Progress, Row, Tag, Typography, theme } from 'antd';
import {
    AlertOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExperimentOutlined,
    FireOutlined,
    ThunderboltOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
    PriorityQueueItem,
    ProductionHealthMetric,
} from '@/mockData/admin/dashboard';

const { Text } = Typography;

interface OperationalOverviewProps {
    loading?: boolean;
    isMockData?: boolean;
    productionHealth: ProductionHealthMetric[];
    priorityQueue: PriorityQueueItem[];
}

const toneColorMap: Record<ProductionHealthMetric['tone'] | PriorityQueueItem['tone'], string> = {
    success: '#458A6D',
    warning: '#C18644',
    error: '#C35256',
    info: '#1890FF',
};

const metricIconMap: Record<string, ReactNode> = {
    oee: <ExperimentOutlined />,
    output: <ThunderboltOutlined />,
    'qc-fail': <CheckCircleOutlined />,
    downtime: <ClockCircleOutlined />,
};

export default function OperationalOverview({
    loading,
    isMockData,
    productionHealth,
    priorityQueue,
}: OperationalOverviewProps) {
    const { token } = theme.useToken();
    const router = useRouter();

    const oeeMetric = productionHealth.find((metric) => metric.key === 'oee');
    const oeeValue = Number(oeeMetric?.value.replace('%', '') || 0);

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} lg={16}>
                <Card
                    variant="borderless"
                    style={{
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                        border: '1px solid rgba(0, 64, 156, 0.1)',
                        height: '100%',
                    }}
                >
                    <Flex justify="space-between" align="center" gap={12} style={{ marginBottom: 16 }}>
                        <Flex align="center" gap={8}>
                            <FireOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                            <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                                Production Health
                            </Text>
                        </Flex>
                        <Tag
                            color={loading ? 'processing' : isMockData ? 'default' : 'success'}
                            style={{ marginInlineEnd: 0 }}
                        >
                            {loading ? 'Loading' : isMockData ? 'Mock data' : 'Live data'}
                        </Tag>
                    </Flex>

                    <Row gutter={[12, 12]} align="stretch">
                        <Col xs={24} md={8}>
                            <Flex
                                vertical
                                justify="space-between"
                                style={{
                                    height: '100%',
                                    minHeight: 172,
                                    padding: 16,
                                    borderRadius: 10,
                                    background: token.colorBgLayout,
                                }}
                            >
                                <Flex vertical gap={4}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        OEE Today
                                    </Text>
                                    <Text strong style={{ fontSize: 34, lineHeight: 1 }}>
                                        {oeeMetric?.value || '--'}
                                    </Text>
                                    <Text style={{ color: toneColorMap[oeeMetric?.tone || 'info'] }}>
                                        {oeeMetric?.trend || '--'} vs yesterday
                                    </Text>
                                </Flex>
                                <Progress
                                    percent={oeeValue}
                                    showInfo={false}
                                    strokeColor={toneColorMap[oeeMetric?.tone || 'info']}
                                    trailColor={token.colorFillSecondary}
                                />
                            </Flex>
                        </Col>

                        <Col xs={24} md={16}>
                            <Row gutter={[12, 12]}>
                                {productionHealth
                                    .filter((metric) => metric.key !== 'oee')
                                    .map((metric) => (
                                        <Col xs={24} sm={8} key={metric.key}>
                                            <Flex
                                                vertical
                                                gap={8}
                                                style={{
                                                    minHeight: 172,
                                                    padding: 14,
                                                    borderRadius: 10,
                                                    background: token.colorBgLayout,
                                                }}
                                            >
                                                <Flex
                                                    align="center"
                                                    justify="center"
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 8,
                                                        color: toneColorMap[metric.tone],
                                                        background: '#FFFFFF',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                                    }}
                                                >
                                                    {metricIconMap[metric.key] || <ExperimentOutlined />}
                                                </Flex>
                                                <Flex vertical gap={2}>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {metric.label}
                                                    </Text>
                                                    <Text strong style={{ fontSize: 21, lineHeight: 1.15 }}>
                                                        {metric.value}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {metric.detail}
                                                    </Text>
                                                </Flex>
                                                {metric.trend && (
                                                    <Tag
                                                        color={metric.tone === 'error' ? 'error' : 'success'}
                                                        style={{ marginInlineEnd: 0, alignSelf: 'flex-start' }}
                                                    >
                                                        {metric.trend}
                                                    </Tag>
                                                )}
                                            </Flex>
                                        </Col>
                                    ))}
                            </Row>
                        </Col>
                    </Row>
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
                    <Flex align="center" justify="space-between" gap={8} style={{ marginBottom: 14 }}>
                        <Flex align="center" gap={8}>
                            <AlertOutlined style={{ color: token.colorWarning, fontSize: 18 }} />
                            <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                                Priority Work Queue
                            </Text>
                        </Flex>
                        <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                            {priorityQueue.length}
                        </Tag>
                    </Flex>

                    <Flex vertical gap={10}>
                        {priorityQueue.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => item.href && router.push(item.href)}
                                style={{
                                    width: '100%',
                                    border: 0,
                                    padding: 0,
                                    background: 'transparent',
                                    textAlign: 'left',
                                    cursor: item.href ? 'pointer' : 'default',
                                }}
                            >
                                <Flex
                                    gap={10}
                                    align="flex-start"
                                    style={{
                                        padding: '11px 12px',
                                        borderRadius: 10,
                                        background: token.colorBgLayout,
                                    }}
                                >
                                    <ToolOutlined
                                        style={{
                                            color: toneColorMap[item.tone],
                                            fontSize: 16,
                                            marginTop: 2,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
                                        <Text strong ellipsis={{ tooltip: item.title }} style={{ fontSize: 13 }}>
                                            {item.title}
                                        </Text>
                                        <Text type="secondary" ellipsis={{ tooltip: item.detail }} style={{ fontSize: 12 }}>
                                            {item.detail}
                                        </Text>
                                        <Flex justify="space-between" align="center" gap={8}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {item.owner}
                                            </Text>
                                            <Tag color={item.tone} style={{ marginInlineEnd: 0 }}>
                                                {item.eta}
                                            </Tag>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </button>
                        ))}
                    </Flex>
                </Card>
            </Col>
        </Row>
    );
}
