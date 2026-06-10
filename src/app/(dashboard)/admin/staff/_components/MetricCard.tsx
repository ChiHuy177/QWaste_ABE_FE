'use client';

import { Card, Flex, theme } from 'antd';
import { memo } from 'react';

export interface Metric {
    title: string;
    value: number | string;
    icon?: React.ComponentType<{ style?: React.CSSProperties }>;
    color?: string;
    borderColor?: string;
    backgroundColor?: string;
}

export interface MetricCardProps {
    title: string;
    value: number | string;
    icon?: React.ComponentType<{ style?: React.CSSProperties }>;
    color?: string;
    borderColor?: string;
    backgroundColor?: string;
}

export const MetricCard = memo(
    ({
        title,
        value,
        icon: IconComponent,
        color,
        borderColor = '#D46B08',
        backgroundColor = '#FFFAF5',
    }: MetricCardProps) => {
        const { token } = theme.useToken();
        const displayColor = color || token.colorPrimary;

        return (
            <Card
                variant="borderless"
                hoverable
                style={{
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0, 64, 156, 0.08)',
                    height: '100%',
                    border: `1px solid ${borderColor}`,
                    background: backgroundColor,
                    position: 'relative',
                    overflow: 'hidden',
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
                        background: `${borderColor}15`,
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
                        {title}
                    </div>
                    <Flex align="center" gap={12}>
                        {IconComponent && (
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
                                        color: borderColor,
                                        fontSize: 24,
                                    }}
                                />
                            </div>
                        )}
                        <div
                            style={{
                                color: displayColor,
                                fontSize: 32,
                                fontWeight: 700,
                                lineHeight: 1,
                            }}
                        >
                            {typeof value === 'number' ? value.toLocaleString('en-US') : value}
                        </div>
                    </Flex>
                </Flex>
            </Card>
        );
    }
);

MetricCard.displayName = 'MetricCard';
