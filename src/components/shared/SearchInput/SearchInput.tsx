'use client';
import { Badge, Input } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { CSSProperties, MouseEvent, useState, useEffect, useRef } from 'react';

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
    activeFilterCount?: number;
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
    activeFilterCount = 0,
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


    return (
        <Input
            placeholder={placeholder}
            prefix={<SearchOutlined />}
            suffix={
                showFilterIcon ? (
                    <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
                        <FilterOutlined
                            aria-label="Open filters"
                            style={{
                                color: isFilterActive ? '#1677ff' : '#bfbfbf',
                                cursor: 'pointer',
                                fontSize: 16,
                                transition: 'color 0.3s',
                            }}
                            onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                onFilterClick?.();
                            }}
                        />
                    </Badge>
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
