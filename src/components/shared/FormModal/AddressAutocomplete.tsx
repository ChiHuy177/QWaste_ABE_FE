'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input, Spin } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

interface AddressAutocompleteProps {
    value?: string;
    onChange?: (address: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

/**
 * Address Autocomplete Component
 * Uses OpenStreetMap Nominatim API (100% FREE)
 * Only stores the formatted address string
 */
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Nhập địa chỉ...',
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Update input value when prop changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        setIsLoading(true);
        try {
            // Using Nominatim API - FREE, no API key needed
            // Adding Vietnam bias for better results
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json` +
                `&q=${encodeURIComponent(query)}` +
                `&countrycodes=vn` + // Limit to Vietnam
                `&limit=5` +
                `&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'vi', // Vietnamese results
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch suggestions');
            }

            const data: NominatimResult[] = await response.json();
            setSuggestions(data);
            setShowDropdown(data.length > 0);
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            setSuggestions([]);
            setShowDropdown(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(newValue); // Update form value immediately

        // Debounce search to avoid too many requests
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchAddress(newValue);
        }, 500); // Wait 500ms after user stops typing
    };

    const handleSelectSuggestion = (address: string) => {
        setInputValue(address);
        onChange?.(address);
        setSuggestions([]);
        setShowDropdown(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                size="middle"
                allowClear
                prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />}
                suffix={isLoading ? <Spin size="small" /> : null}
            />

            {showDropdown && suggestions.length > 0 && (
                <ul
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1050,
                        margin: '4px 0 0 0',
                        padding: 0,
                        listStyle: 'none',
                        backgroundColor: '#fff',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        maxHeight: '300px',
                        overflowY: 'auto',
                    }}
                >
                    {suggestions.map((item) => (
                        <li
                            key={item.place_id}
                            onClick={() => handleSelectSuggestion(item.display_name)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: 'rgba(0, 0, 0, 0.88)',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                            }}
                        >
                            <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            {item.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
