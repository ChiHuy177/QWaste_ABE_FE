'use client';

import React from 'react';
import { Input, Button, Badge } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';

interface MobileSearchBarProps {
    searchText: string;
    onSearchChange: (value: string) => void;
    onFilterClick: () => void;
    activeFiltersCount?: number;
    searchPlaceholder?: string;
    showSearch?: boolean;
}

/**
 * Reusable Mobile Search Bar component with filter button
 * @param searchText - Current search text value
 * @param onSearchChange - Callback when search text changes
 * @param onFilterClick - Callback when filter button is clicked
 * @param activeFiltersCount - Number of active filters (shows badge)
 * @param searchPlaceholder - Placeholder text for search input
 * @param showSearch - Whether to show search input (default: true)
 */
const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
    searchText,
    onSearchChange,
    onFilterClick,
    activeFiltersCount = 0,
    searchPlaceholder = 'Search...',
    showSearch = true,
}) => {
    const { resolvedTheme } = useTheme();
    return (
        <div
            style={{
                backgroundColor: 'var(--card)',
                boxShadow:
                    resolvedTheme === 'dark'
                        ? '0 2px 8px rgba(0,0,0,0.4)'
                        : '0 2px 8px rgba(0,0,0,0.1)',
            }}
        >
            {/* Search & Filter Button */}
            <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {showSearch && (
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchText}
                                onChange={(e) => onSearchChange(e.target.value)}
                                prefix={<SearchOutlined />}
                                allowClear
                                style={{
                                    borderRadius: '8px',
                                    height: '42px',
                                }}
                            />
                        </div>
                    )}
                    <Badge count={activeFiltersCount} offset={[-4, 4]}>
                        <Button
                            type="primary"
                            icon={<FilterOutlined />}
                            onClick={onFilterClick}
                            style={{
                                height: '42px',
                                borderRadius: '8px',
                            }}
                        />
                    </Badge>
                </div>
            </div>
        </div>
    );
};

export default MobileSearchBar;
