'use client';

import { Flex, Typography, Skeleton, Grid, Button, Tooltip, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { ReactNode } from 'react';

const { Title } = Typography;
const { useBreakpoint } = Grid;

interface PageHeaderProps {
    title: ReactNode;
    icon?: ReactNode;
    onBack?: () => void;
    backTooltip?: string;
    backLabel?: ReactNode;
    loading?: boolean;
    rightContent?: ReactNode;
    rightContentMobile?: ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    icon,
    onBack,
    backTooltip,
    backLabel,
    loading = false,
    rightContent,
    rightContentMobile,
    className,
}: PageHeaderProps) {
    const screens = useBreakpoint();
    const { token } = theme.useToken();
    const isMobile = !screens.md;
    const isTablet = screens.md && !screens.lg;

    if (loading) {
        return (
            <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={isMobile ? 8 : 12}
                style={{
                    marginBottom: isMobile ? 12 : 24,
                    padding: isMobile ? '8px 0' : 0,
                }}
                className={className}
            >
                <Flex align="center" gap={isMobile ? 8 : 12}>
                    {!isMobile && <Skeleton.Avatar active size={isTablet ? 32 : 36} />}
                    <Skeleton.Input
                        active
                        style={{ width: isMobile ? 140 : isTablet ? 160 : 192 }}
                    />
                </Flex>
                <Flex align="center" gap={isMobile ? 6 : 12}>
                    {!isMobile && (
                        <>
                            <Skeleton.Button active style={{ width: isTablet ? 100 : 128 }} />
                            <Skeleton.Button active style={{ width: 96 }} />
                        </>
                    )}
                    {isMobile && (
                        <>
                            <Skeleton.Avatar active size={32} shape="circle" />
                            <Skeleton.Avatar active size={32} shape="circle" />
                        </>
                    )}
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex
            justify="space-between"
            align={isMobile ? 'flex-start' : 'center'}
            wrap={isMobile ? 'wrap' : 'nowrap'}
            gap={isMobile ? 8 : isTablet ? 12 : 16}
            style={{
                marginBottom: isMobile ? 12 : 24,
                padding: isMobile ? '8px 0' : 0,
            }}
            className={className}
        >
            {/* Left Section - Title with Back Button & Icon */}
            <Flex
                align="center"
                gap={isMobile ? 8 : isTablet ? 10 : 12}
                style={{
                    flex: isMobile ? '1 1 100%' : '1 1 auto',
                    minWidth: 0,
                    marginBottom: isMobile && (rightContent || rightContentMobile) ? 8 : 0,
                }}
            >
                {onBack && (
                    <Tooltip title={backTooltip}>
                        <Button
                            type="default"
                            icon={<ArrowLeftOutlined style={{ fontSize: 15 }} />}
                            onClick={onBack}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: isMobile ? 32 : 36,
                                padding: backLabel
                                    ? isMobile
                                        ? '0 10px'
                                        : '0 14px'
                                    : isMobile
                                      ? '0 8px'
                                      : '0 10px',
                                borderRadius: token.borderRadius,
                                fontWeight: 500,
                                flexShrink: 0,
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                            }}
                            aria-label="Back"
                        >
                            {backLabel}
                        </Button>
                    </Tooltip>
                )}
                {icon && (
                    <div
                        style={{
                            fontSize: isMobile ? 18 : isTablet ? 20 : 24,
                            color: 'var(--primary)',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            lineHeight: 1,
                        }}
                    >
                        {icon}
                    </div>
                )}
                <Title
                    level={isMobile ? 4 : 3}
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 18 : isTablet ? 20 : 24,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: isMobile ? 2 : 1,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {title}
                </Title>
            </Flex>

            {/* Right Section - Controls */}
            {(rightContent || rightContentMobile) && (
                <Flex
                    align="center"
                    gap={isMobile ? 6 : 12}
                    style={{
                        flex: isMobile ? '1 1 100%' : '0 0 auto',
                        justifyContent: isMobile ? 'flex-start' : 'flex-end',
                        minWidth: 0,
                    }}
                    wrap="wrap"
                >
                    {isMobile ? rightContentMobile || rightContent : rightContent}
                </Flex>
            )}
        </Flex>
    );
}
