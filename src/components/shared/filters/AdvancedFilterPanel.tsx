import { useState, useEffect, useRef } from 'react';
import { Button, Col, DatePicker, Input, Row, Select, Tooltip, theme } from 'antd';
import {
    CalendarOutlined,
    CloseOutlined,
    SearchOutlined,
    SlidersOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const DEFAULT_COL_XS = 24;
const DEFAULT_COL_SM = 12;
const DEFAULT_COL_MD = 6;

export interface FilterFieldColProps {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
}

export interface FilterFieldOption {
    label: string;
    value: string;
}

export interface FilterField {
    key: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'select' | 'date';
    options?: FilterFieldOption[];
    colProps?: FilterFieldColProps;
}

interface AdvancedFilterPanelProps {
    fields: FilterField[];
    onApply: () => void;
    onReset: () => void;
    applyLabel?: string;
    resetLabel?: string;
    /** Optional heading shown above the fields, e.g. "Bộ lọc nâng cao" */
    title?: string;
    /** Optional "Đang áp dụng N bộ lọc" summary shown next to the action buttons */
    activeFiltersLabel?: (count: number) => string;
    /** Label for the inline clear-all link next to activeFiltersLabel */
    clearAllLabel?: string;
}

const AdvancedFilterPanel = ({
    fields,
    onApply,
    onReset,
    applyLabel,
    resetLabel,
    title,
    activeFiltersLabel,
    clearAllLabel,
}: AdvancedFilterPanelProps) => {
    const { token } = theme.useToken();

    // Fields currently applied (committed) by the parent — used to show how many
    // filters are active without waiting for the user to scan every field.
    const activeCount = fields.filter((f) => f.value !== '').length;

    // Store input values locally to prevent parent re-renders on every keystroke
    const [localValues, setLocalValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach((f) => {
            initial[f.key] = f.value;
        });
        return initial;
    });

    // Keep local values in sync with parent value changes (e.g. when Reset is called)
    useEffect(() => {
        setLocalValues((prev) => {
            const next = { ...prev };
            fields.forEach((f) => {
                next[f.key] = f.value;
            });
            return next;
        });
    }, [fields]);

    const isApplying = useRef(false);

    // Run apply callback after parent states have updated and re-rendered (updating the props)
    useEffect(() => {
        if (isApplying.current) {
            isApplying.current = false;
            onApply();
        }
    }, [fields, onApply]);

    const handleApply = () => {
        let hasChanges = false;
        // Sync all local values back to the parent state before applying the filters
        fields.forEach((f) => {
            const newValue = localValues[f.key] ?? '';
            if (f.value !== newValue) {
                f.onChange(newValue);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            isApplying.current = true;
        } else {
            onApply();
        }
    };

    return (
        <div
            style={{
                padding: '20px',
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                marginBottom: '20px',
                boxShadow: token.boxShadowSecondary || '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease-in-out',
            }}
        >
            {(title || activeCount > 0) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 26,
                                height: 26,
                                borderRadius: token.borderRadiusSM,
                                background: token.colorPrimaryBg,
                                color: token.colorPrimary,
                            }}
                        >
                            <SlidersOutlined style={{ fontSize: 13 }} />
                        </span>
                        {title && (
                            <span
                                style={{ fontWeight: 650, fontSize: 14.5, color: token.colorText }}
                            >
                                {title}
                            </span>
                        )}
                    </div>
                    {activeCount > 0 && (
                        <Tooltip title={resetLabel}>
                            <button
                                type="button"
                                onClick={onReset}
                                aria-label={resetLabel}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 22,
                                    height: 22,
                                    padding: '0 7px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: token.colorPrimary,
                                    color: token.colorWhite,
                                    fontSize: 12,
                                    fontWeight: 650,
                                    cursor: 'pointer',
                                }}
                            >
                                {activeCount}
                            </button>
                        </Tooltip>
                    )}
                </div>
            )}
            <Row gutter={[16, 16]}>
                {fields.map((field) => (
                    <Col
                        key={field.key}
                        xs={field.colProps?.xs ?? DEFAULT_COL_XS}
                        sm={field.colProps?.sm ?? DEFAULT_COL_SM}
                        md={field.colProps?.md ?? DEFAULT_COL_MD}
                        lg={field.colProps?.lg}
                        xl={field.colProps?.xl}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {field.type === 'date' && (
                                    <CalendarOutlined
                                        style={{ fontSize: 12, color: token.colorTextTertiary }}
                                    />
                                )}
                                {field.type === 'select' && (
                                    <TagsOutlined
                                        style={{ fontSize: 12, color: token.colorTextTertiary }}
                                    />
                                )}
                                {field.label}
                            </span>
                            {field.type === 'select' ? (
                                <Select
                                    placeholder={field.placeholder}
                                    value={localValues[field.key] || undefined}
                                    onChange={(val) => {
                                        setLocalValues((prev) => ({
                                            ...prev,
                                            [field.key]: val ?? '',
                                        }));
                                    }}
                                    options={field.options}
                                    allowClear
                                    style={{ width: '100%', height: 38 }}
                                />
                            ) : field.type === 'date' ? (
                                <DatePicker
                                    placeholder={field.placeholder}
                                    value={
                                        localValues[field.key]
                                            ? dayjs(localValues[field.key])
                                            : null
                                    }
                                    onChange={(_date, dateString) => {
                                        setLocalValues((prev) => ({
                                            ...prev,
                                            [field.key]: Array.isArray(dateString)
                                                ? (dateString[0] ?? '')
                                                : dateString,
                                        }));
                                    }}
                                    format="YYYY-MM-DD"
                                    style={{ width: '100%', height: 38 }}
                                    allowClear
                                />
                            ) : (
                                <Input
                                    placeholder={field.placeholder}
                                    value={localValues[field.key] ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalValues((prev) => ({
                                            ...prev,
                                            [field.key]: val,
                                        }));
                                    }}
                                    onPressEnter={handleApply}
                                    allowClear
                                    style={{ borderRadius: 6, height: 38 }}
                                />
                            )}
                        </div>
                    </Col>
                ))}
            </Row>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                        activeFiltersLabel && activeCount > 0 ? 'space-between' : 'flex-end',
                    gap: 12,
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: `1px dashed ${token.colorBorderSecondary}`,
                }}
            >
                {activeFiltersLabel && activeCount > 0 && (
                    <div style={{ fontSize: 13, color: token.colorTextSecondary }}>
                        {activeFiltersLabel(activeCount)}
                        {clearAllLabel && (
                            <>
                                <span style={{ margin: '0 8px', color: token.colorBorder }}>·</span>
                                <button
                                    type="button"
                                    onClick={onReset}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        color: token.colorPrimary,
                                        fontWeight: 500,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {clearAllLabel}
                                </button>
                            </>
                        )}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        onClick={onReset}
                        icon={<CloseOutlined />}
                        style={{
                            borderRadius: 6,
                            height: 38,
                            display: 'inline-flex',
                            alignItems: 'center',
                        }}
                    >
                        {resetLabel}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleApply}
                        icon={<SearchOutlined />}
                        style={{
                            borderRadius: 6,
                            height: 38,
                            display: 'inline-flex',
                            alignItems: 'center',
                        }}
                    >
                        {applyLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilterPanel;
