'use client';
import { theme } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import { Card, Flex, Typography } from 'antd';
import { ThunderboltOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { EnergyConsumption } from '@/types';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface ZoneConsumptionCardsProps {
    zones: EnergyConsumption[];
}

const ZoneConsumptionCards: React.FC<ZoneConsumptionCardsProps> = ({ zones }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(false);
    const [showScrollButtons, setShowScrollButtons] = useState(false);

    // Check scroll position to show/hide shadows
    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftShadow(scrollLeft > 0);
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    // Check if content overflows to show scroll buttons
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkOverflow = () => {
            const hasOverflow = container.scrollWidth > container.clientWidth;
            setShowScrollButtons(hasOverflow);
            setShowRightShadow(hasOverflow);
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [zones]);

    // Scroll functions
    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = 400;
        const targetScroll =
            direction === 'left'
                ? container.scrollLeft - scrollAmount
                : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth',
        });
    };

    if (zones.length === 0) {
        return null;
    }

    return (
        <div style={{ position: 'relative', marginBottom: 24 }}>
            {/* Left Shadow Indicator */}
            {showLeftShadow && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 40,
                        background: `linear-gradient(to right, ${token.colorBgContainer}, transparent)`,
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Right Shadow Indicator */}
            {showRightShadow && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 40,
                        background: `linear-gradient(to left, ${token.colorBgContainer}, transparent)`,
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Left Scroll Button */}
            {showScrollButtons && showLeftShadow && (
                <div
                    onClick={() => scroll('left')}
                    style={{
                        position: 'absolute',
                        left: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: token.colorBgContainer,
                        boxShadow: token.boxShadow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: `1px solid ${token.colorBorder}`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = token.colorPrimaryBg;
                        e.currentTarget.style.borderColor = token.colorPrimary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = token.colorBgContainer;
                        e.currentTarget.style.borderColor = token.colorBorder;
                    }}
                >
                    <LeftOutlined style={{ fontSize: 14, color: token.colorText }} />
                </div>
            )}

            {/* Right Scroll Button */}
            {showScrollButtons && showRightShadow && (
                <div
                    onClick={() => scroll('right')}
                    style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: token.colorBgContainer,
                        boxShadow: token.boxShadow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: `1px solid ${token.colorBorder}`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = token.colorPrimaryBg;
                        e.currentTarget.style.borderColor = token.colorPrimary;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = token.colorBgContainer;
                        e.currentTarget.style.borderColor = token.colorBorder;
                    }}
                >
                    <RightOutlined style={{ fontSize: 14, color: token.colorText }} />
                </div>
            )}

            {/* Scrollable Container */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                    display: 'flex',
                    gap: 16,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollBehavior: 'smooth',
                    paddingBottom: 8,
                    // Hide scrollbar by default, show on hover
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${token.colorBorder} transparent`,
                }}
                className="zone-scroll-container"
            >
                {zones.map((zone) => (
                    <Card
                        key={zone.entityId}
                        variant="borderless"
                        hoverable
                        style={{
                            minWidth: 320,
                            maxWidth: 320,
                            borderRadius: 12,
                            boxShadow: '0 6px 16px rgba(0, 64, 156, 0.18)',
                            border: '1px solid rgba(0, 64, 156, 0.1)',
                            flexShrink: 0,
                        }}
                    >
                        <Flex vertical gap={16}>
                            <Flex align="center" justify="space-between">
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: token.colorPrimary,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {zone.entityName} (kWh)
                                </Text>
                                <ThunderboltOutlined style={{ fontSize: 20, color: '#FA8C16' }} />
                            </Flex>

                            <Flex justify="space-between" align="center">
                                <Flex vertical gap={4}>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            color: token.colorPrimary,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('electricManagement.current')}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 24,
                                            color: token.colorPrimary,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {zone.currentConsumption}
                                    </Text>
                                </Flex>

                                <Flex vertical gap={4} align="flex-end">
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            color: '#FA8C16',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {t('electricManagement.total')}
                                    </Text>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 24,
                                            color: '#FA8C16',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {zone.filterConsumptionResult.totalAllConsumption.toLocaleString(
                                            'en-US'
                                        )}
                                    </Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .zone-scroll-container::-webkit-scrollbar {
                    height: 6px;
                }
                .zone-scroll-container::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 3px;
                }
                .zone-scroll-container::-webkit-scrollbar-thumb {
                    background: ${token.colorBorder};
                    border-radius: 3px;
                    transition: background 0.3s;
                }
                .zone-scroll-container:hover::-webkit-scrollbar-thumb {
                    background: ${token.colorPrimary};
                }
                .zone-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: ${token.colorPrimaryHover};
                }
            `}</style>
        </div>
    );
};

export default ZoneConsumptionCards;
