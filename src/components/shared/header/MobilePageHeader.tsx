'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Typography, Button, Badge, Input, Tooltip } from 'antd';
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTheme } from '@/hooks/useTheme';

const { Title } = Typography;

interface MobilePageHeaderProps {
    title: string;
    showSearch?: boolean;
    searchText?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    showFilter?: boolean;
    onFilterClick?: () => void;
    activeFiltersCount?: number;
    /** Action buttons rendered as icon buttons (use items with icon + onClick) */
    additionalMenuItems?: MenuProps['items'];
}

const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
    title,
    showSearch = true,
    searchText = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    showFilter = true,
    onFilterClick,
    activeFiltersCount = 0,
    additionalMenuItems = [],
}) => {
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<any>(null);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (searchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchExpanded]);

    const handleSearchToggle = () => {
        if (searchExpanded) {
            onSearchChange?.('');
            setSearchExpanded(false);
        } else {
            setSearchExpanded(true);
        }
    };

    const iconButtonStyle: React.CSSProperties = {
        height: 36,
        width: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: 8,
    };

    return (
        <div
            style={{
                backgroundColor: 'var(--card)',
                borderBottom:
                    resolvedTheme === 'dark'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(0,0,0,0.06)',
                boxShadow:
                    resolvedTheme === 'dark'
                        ? '0 1px 4px rgba(0,0,0,0.3)'
                        : '0 1px 4px rgba(0,0,0,0.06)',
            }}
        >
            {/* Title row: title + action buttons */}
            <div
                style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
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
                        lineHeight: 1.4,
                    }}
                >
                    {title}
                </Title>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {showSearch && (
                        <Tooltip title={searchExpanded ? undefined : searchPlaceholder}>
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
                                    ...iconButtonStyle,
                                    color: searchExpanded ? 'var(--primary)' : undefined,
                                }}
                            />
                        </Tooltip>
                    )}

                    {showFilter && (
                        <Tooltip title="Filter">
                            <Badge
                                count={activeFiltersCount}
                                size="small"
                                offset={[-4, 4]}
                                style={{ backgroundColor: 'var(--primary)' }}
                            >
                                <Button
                                    type="text"
                                    icon={<FilterOutlined style={{ fontSize: 17 }} />}
                                    onClick={onFilterClick}
                                    style={iconButtonStyle}
                                />
                            </Badge>
                        </Tooltip>
                    )}

                    {(additionalMenuItems || []).map((item: any) => (
                        <Tooltip key={item.key} title={item.label}>
                            <Button
                                type="text"
                                icon={
                                    item.icon ? (
                                        <span style={{ fontSize: 17, display: 'flex' }}>
                                            {item.icon}
                                        </span>
                                    ) : undefined
                                }
                                onClick={item.onClick}
                                style={iconButtonStyle}
                            />
                        </Tooltip>
                    ))}
                </div>
            </div>

            {/* Collapsible search bar */}
            <div
                style={{
                    overflow: 'hidden',
                    maxHeight: searchExpanded ? 52 : 0,
                    opacity: searchExpanded ? 1 : 0,
                    transition: 'max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease',
                    padding: searchExpanded ? '0 16px 10px' : '0 16px 0',
                }}
            >
                <Input
                    ref={searchInputRef}
                    placeholder={searchPlaceholder}
                    value={searchText}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    prefix={<SearchOutlined style={{ fontSize: 14, opacity: 0.45 }} />}
                    allowClear
                    style={{
                        borderRadius: 8,
                        height: 36,
                    }}
                />
            </div>
        </div>
    );
};

export default MobilePageHeader;
