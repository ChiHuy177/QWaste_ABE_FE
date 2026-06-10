'use client';

import React, { useMemo } from 'react';
import { InputNumber, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface DurationPickerProps {
    value?: number | null;
    onChange?: (value: number | null) => void;
    disabled?: boolean;
    size?: 'small' | 'middle' | 'large';
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
    value = 0,
    onChange,
    disabled = false,
    size = 'middle',
}) => {
    const { t } = useTranslation();

    // Derived H, M, S from total seconds
    const { hours, minutes, seconds } = useMemo(() => {
        const totalSeconds = value || 0;
        return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60,
        };
    }, [value]);

    const handleUpdate = (h: number, m: number, s: number) => {
        const total = h * 3600 + m * 60 + s;
        onChange?.(total > 0 ? total : null);
    };

    const handleKeyPressInteger = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.key;
        const allowedKeys = [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            'Backspace',
            'Delete',
            'Tab',
            'Enter',
            'ArrowLeft',
            'ArrowRight',
        ];

        if (!allowedKeys.includes(key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    };

    return (
        <Space size={size === 'small' ? 4 : 8} wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InputNumber
                    min={0}
                    max={99999}
                    precision={0}
                    onKeyPress={handleKeyPressInteger}
                    value={hours}
                    onChange={(val) => handleUpdate(val || 0, minutes, seconds)}
                    disabled={disabled}
                    size={size}
                    style={{ width: size === 'small' ? 60 : 80 }}
                    placeholder="0"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    h
                </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InputNumber
                    min={0}
                    max={59}
                    precision={0}
                    onKeyPress={handleKeyPressInteger}
                    value={minutes}
                    onChange={(val) => handleUpdate(hours, val || 0, seconds)}
                    disabled={disabled}
                    size={size}
                    style={{ width: size === 'small' ? 50 : 70 }}
                    placeholder="0"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    m
                </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InputNumber
                    min={0}
                    max={59}
                    precision={0}
                    onKeyPress={handleKeyPressInteger}
                    value={seconds}
                    onChange={(val) => handleUpdate(hours, minutes, val || 0)}
                    disabled={disabled}
                    size={size}
                    style={{ width: size === 'small' ? 50 : 70 }}
                    placeholder="0"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    s
                </Text>
            </div>
        </Space>
    );
};
