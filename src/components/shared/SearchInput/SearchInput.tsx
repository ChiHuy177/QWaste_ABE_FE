'use client';
import { Badge, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { CSSProperties, useState, useEffect, useRef, useCallback } from 'react';

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
    onPressEnter?: (value: string) => void;
}

export const SearchInput = ({
    value,
    onChange,
    placeholder = 'Search...',
    width = 250,
    style,
    className,
    allowClear = true,
    debounceMs = 500,
    showFilterIcon = false,
    onFilterClick,
    isFilterActive = false,
    activeFilterCount = 0,
    onPressEnter,
}: SearchInputProps) => {
    const [inputValue, setInputValue] = useState(value);
    const lastEmittedValueRef = useRef(value);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Synchronize ONLY when external value changes (e.g. parent resets filters to '')
    useEffect(() => {
        if (value !== lastEmittedValueRef.current) {
            lastEmittedValueRef.current = value;
            setInputValue(value);
        }
    }, [value]);

    // Clear debounce timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const emitChange = useCallback((val: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (val !== lastEmittedValueRef.current) {
            lastEmittedValueRef.current = val;
            onChangeRef.current(val);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextVal = e.target.value;
        setInputValue(nextVal);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        // Fast feedback on clear / backspace to empty
        if (nextVal === '') {
            emitChange('');
            return;
        }

        if (debounceMs <= 0) {
            emitChange(nextVal);
            return;
        }

        timerRef.current = setTimeout(() => {
            emitChange(nextVal);
        }, debounceMs);
    };

    const handlePressEnter = () => {
        emitChange(inputValue);
        onPressEnter?.(inputValue);
    };

    const FilterIcon = showFilterIcon ? require('@ant-design/icons').FilterOutlined : null;

    return (
        <Input
            placeholder={placeholder}
            prefix={<SearchOutlined />}
            suffix={
                showFilterIcon && FilterIcon ? (
                    <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
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
                    </Badge>
                ) : undefined
            }
            value={inputValue}
            onChange={handleInputChange}
            onPressEnter={handlePressEnter}
            allowClear={allowClear}
            style={{ width, ...style, marginBottom: '-2px' }}
            className={className}
        />
    );
};
