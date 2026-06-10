
'use client';
import React from 'react';
import { Card, Flex, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { theme } from 'antd';

const { Text, Title } = Typography;

interface EmptyStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    showRetry?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'No Data Available',
    description = 'There is no data to display at the moment. Try adjusting your filters or check back later.',
    onRetry,
    showRetry = true,
}) => {
    const { token } = theme.useToken();

    return (
        <Card
            style={{
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                border: '1px solid rgba(0, 64, 156, 0.1)',
                minHeight: 400,
            }}
        >
            <Flex
                vertical
                align="center"
                justify="center"
                gap={24}
                style={{ padding: '60px 20px' }}
            >
                {/* Illustration SVG */}
                <svg
                    width="200"
                    height="200"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="100" cy="100" r="80" fill={token.colorBgLayout} />
                    <path
                        d="M100 60V100L120 120"
                        stroke={token.colorPrimary}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="60"
                        stroke={token.colorPrimary}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                    />
                </svg>

                <Flex vertical align="center" gap={8}>
                    <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
                        {title}
                    </Title>
                    <Text
                        type="secondary"
                        style={{
                            textAlign: 'center',
                            maxWidth: 400,
                            fontSize: 14,
                        }}
                    >
                        {description}
                    </Text>
                </Flex>

                {showRetry && onRetry && (
                    <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
                        Retry
                    </Button>
                )}
            </Flex>
        </Card>
    );
};

export default EmptyState;