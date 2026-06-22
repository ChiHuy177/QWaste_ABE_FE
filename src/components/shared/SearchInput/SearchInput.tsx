'use client';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { CSSProperties, useState, useEffect, useRef } from 'react';

export interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    width?: number | string;
    style?: CSSProperties;
    className?: string;
    allowClear?: boolean;
    debounceMs?: number;
    showFilterIcon?: boolean;
    onFilterClick?: () => void;
    isFilterActive?: boolean;
}

export const SearchInput = ({
    value,
    onChange,
    placeholder = 'Search...',
    width = 250,
    style,
    className,
    allowClear = true,
    debounceMs = 300,
    showFilterIcon = false,
    onFilterClick,
    isFilterActive = false,
}: SearchInputProps) => {
    const [inputValue, setInputValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    if (prevValue !== value) {
        setPrevValue(value);
        setInputValue(value);
    }
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceMs === 0) {
            onChange(inputValue);
            return;
        }

        const timer = setTimeout(() => {
            onChange(inputValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [inputValue, debounceMs, onChange]);

    // Lazy load the icon if used
    const FilterIcon = showFilterIcon ? require('@ant-design/icons').FilterOutlined : null;

    return (
        <Input
            placeholder={placeholder}
            prefix={<SearchOutlined />}
            suffix={
                showFilterIcon && FilterIcon ? (
                    <FilterIcon
                        aria-label="Open filters"
                        style={{
                            color: isFilterActive ? '#1677ff' : '#bfbfbf',
                            cursor: 'pointer',
                            fontSize: 16,
                            transition: 'color 0.3s',
                        }}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            onFilterClick?.();
                        }}
                    />
                ) : undefined
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            allowClear={allowClear}
            style={{ width, ...style, marginBottom: '-2px' }}
            className={className}
        />
    );
};
