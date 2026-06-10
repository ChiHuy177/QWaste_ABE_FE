'use client';

import { useState, ReactNode, useEffect, useRef } from 'react';
import { Grid, Button, Tooltip } from 'antd';
import { FilterOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Input, Typography } from 'antd';
import PageHeader from './PageHeader';
import { useTheme } from '@/hooks/useTheme';

const { useBreakpoint } = Grid;
const { Title } = Typography;

interface MobileSearchConfig {
    text: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

interface ResponsivePageHeaderProps {
    title: string;
    icon?: ReactNode;
    loading?: boolean;
    className?: string;

    rightContent?: ReactNode;
    rightContentMobile?: ReactNode;

    mobileSearch?: MobileSearchConfig;
    /** Extra icon buttons for mobile header (e.g. "Add" button) */
    mobileMenuItems?: MenuProps['items'];
    /** When true, use PageHeader for both desktop and mobile */
    desktopOnly?: boolean;
}

export default function ResponsivePageHeader({
    title,
    icon,
    loading = false,
    className,
    rightContent,
    rightContentMobile,
    mobileSearch,
    mobileMenuItems,
    desktopOnly = false,
}: ResponsivePageHeaderProps) {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const searchInputRef = { current: null as any };
    const [isFloating, setIsFloating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Detect scroll on the closest scrollable parent
    useEffect(() => {
        if (!containerRef.current) return;

        // Find the scrollable parent
        let scrollParent: HTMLElement | null = containerRef.current.parentElement;
        while (scrollParent) {
            const overflowY = window.getComputedStyle(scrollParent).overflowY;
            if (overflowY === 'auto' || overflowY === 'scroll') {
                break;
            }
            scrollParent = scrollParent.parentElement;
        }

        if (!scrollParent) {
            scrollParent = document.documentElement;
        }

        const handleScroll = () => {
            const scrollTop = scrollParent!.scrollTop;
            const shouldFloat = scrollTop > 50;
            setIsFloating(shouldFloat);
        };

        // Initial check
        handleScroll();

        scrollParent.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollParent?.removeEventListener('scroll', handleScroll);
        };
    }, []);

    if (desktopOnly || !isMobile) {
        return (
            <PageHeader
                title={title}
                icon={icon}
                loading={loading}
                rightContent={rightContent}
                rightContentMobile={rightContentMobile}
                className={className}
            />
        );
    }

    // Mobile render
    const hasSearch = !!mobileSearch;
    const hasFilters = !!rightContent;

    const handleSearchToggle = () => {
        if (searchExpanded) {
            mobileSearch?.onChange('');
            setSearchExpanded(false);
        } else {
            setSearchExpanded(true);
            setFilterExpanded(false);
        }
    };

    const handleFilterToggle = () => {
        setFilterExpanded((prev) => !prev);
        if (!filterExpanded) {
            setSearchExpanded(false);
        }
    };

    const iconBtnStyle: React.CSSProperties = {
        height: 36,
        width: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: 8,
        color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)',
    };

    const isExpanded = searchExpanded || filterExpanded;

    return (
        <div
            ref={containerRef}
            style={{
                position: isFloating ? 'fixed' : 'relative',
                top: isFloating ? 50 : 0,
                left: isFloating ? 16 : 0,
                right: isFloating ? 16 : 0,
                zIndex: 1000,
                padding: isFloating ? '0 12px' : '0',
                marginBottom: isFloating ? 0 : 16,
                pointerEvents: 'none',
                transition: 'all 0.3s ease-out',
            }}
        >
            <div
                style={{
                    background: isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(255, 255, 255, 0.78)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    borderRadius: isExpanded ? 20 : 22,
                    border: isDark
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(0,0,0,0.06)',
                    boxShadow: isDark
                        ? '0 4px 24px rgba(0,0,0,0.3)'
                        : '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'border-radius 0.3s ease-out',
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                }}
            >
                {/* Title row */}
                <div
                    style={{
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                    }}
                >
                    <Title
                        level={4}
                        style={{
                            margin: 0,
                            fontSize: 17,
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            minWidth: 80,
                            lineHeight: 1.4,
                            color: isDark ? '#f5f5f5' : '#1a1a1a',
                        }}
                    >
                        {title}
                    </Title>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                            flexWrap: 'wrap',
                        }}
                    >
                        {hasSearch && (
                            <Button
                                type="text"
                                icon={
                                    searchExpanded ? (
                                        <CloseOutlined style={{ fontSize: 15 }} />
                                    ) : (
                                        <SearchOutlined style={{ fontSize: 17 }} />
                                    )
                                }
                                onClick={handleSearchToggle}
                                style={{
                                    ...iconBtnStyle,
                                    color: searchExpanded ? 'var(--primary)' : undefined,
                                }}
                            />
                        )}

                        {hasFilters && (
                            <Button
                                type="text"
                                icon={
                                    filterExpanded ? (
                                        <CloseOutlined style={{ fontSize: 15 }} />
                                    ) : (
                                        <FilterOutlined style={{ fontSize: 17 }} />
                                    )
                                }
                                onClick={handleFilterToggle}
                                style={{
                                    ...iconBtnStyle,
                                    color: filterExpanded ? 'var(--primary)' : undefined,
                                }}
                            />
                        )}

                        {(mobileMenuItems || []).map((item: any) => (
                            <Tooltip key={item.key} title={item.label}>
                                <Button
                                    type="text"
                                    icon={
                                        <span style={{ fontSize: 17, display: 'flex' }}>
                                            {item.icon}
                                        </span>
                                    }
                                    onClick={item.onClick}
                                    style={iconBtnStyle}
                                />
                            </Tooltip>
                        ))}
                    </div>
                </div>

                {/* Collapsible search bar */}
                {hasSearch && (
                    <div
                        style={{
                            overflow: 'hidden',
                            maxHeight: searchExpanded ? 52 : 0,
                            opacity: searchExpanded ? 1 : 0,
                            transition:
                                'max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease',
                            padding: searchExpanded ? '0 16px 10px' : '0 16px 0',
                        }}
                    >
                        <Input
                            ref={searchInputRef}
                            placeholder={mobileSearch?.placeholder}
                            value={mobileSearch?.text}
                            onChange={(e) => mobileSearch?.onChange(e.target.value)}
                            prefix={<SearchOutlined style={{ fontSize: 14, opacity: 0.45 }} />}
                            allowClear
                            style={{ borderRadius: 8, height: 36 }}
                        />
                    </div>
                )}

                {/* Collapsible filter panel — glassmorphism inner panel */}
                {hasFilters && (
                    <div
                        style={{
                            overflow: 'hidden',
                            maxHeight: filterExpanded ? 500 : 0,
                            opacity: filterExpanded ? 1 : 0,
                            transition:
                                'max-height 0.3s ease, opacity 0.2s ease, padding 0.3s ease',
                            padding: filterExpanded ? '0 12px 12px' : '0 12px 0',
                        }}
                    >
                        <style>{`
                            .rph-filter-panel .ant-input-affix-wrapper,
                            .rph-filter-panel .ant-input {
                                min-width: 0 !important;
                            }

                            .rph-filter-panel > div, .rph-filter-panel .ant-input-affix-wrapper {
                                // flex-wrap: wrap !important;
                                width: 100% !important; 
                                margin-bottom: 8px;
                                
                            }
                            
                        `}</style>
                        <div
                            className="rph-filter-panel"
                            style={{
                                padding: '12px',
                                borderRadius: 14,
                                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                border: isDark
                                    ? '1px solid rgba(255,255,255,0.06)'
                                    : '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            {rightContent}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
