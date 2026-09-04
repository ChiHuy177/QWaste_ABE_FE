import { useState, useEffect, useRef } from 'react';
import { Button, Col, Input, Row, Select, theme } from 'antd';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';

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

export interface FilterField {
    key: string;
    label: string;
    placeholder?: string;
    value: string;
    type?: 'text' | 'select';
    options?: { label: string; value: string }[];
    onChange?: (value: string) => void;
    /** Override responsive column widths. Defaults to xs=24 sm=12 md=6 */
    colProps?: FilterFieldColProps;
}

interface AdvancedFilterPanelProps {
    fields: FilterField[];
    onApply: (values: Record<string, string>) => void;
    onReset: () => void;
    applyLabel?: string;
    resetLabel?: string;
}

const AdvancedFilterPanel = ({
    fields,
    onApply,
    onReset,
    applyLabel,
    resetLabel,
}: AdvancedFilterPanelProps) => {
    const { token } = theme.useToken();
    const firstInputRef = useRef<any>(null);

    const [localValues, setLocalValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach((f) => {
            initial[f.key] = f.value;
        });
        return initial;
    });

    // Sync local values when parent resets (applied state → '' propagates back via value prop)
    useEffect(() => {
        setLocalValues((prev) => {
            const next = { ...prev };
            fields.forEach((f) => {
                next[f.key] = f.value;
            });
            return next;
        });
    }, [fields]);

    // Focus first input when panel mounts
    useEffect(() => {
        const timer = setTimeout(() => firstInputRef.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleApply = () => {
        fields.forEach((f) => f.onChange?.(localValues[f.key] ?? ''));
        onApply(localValues);
    };

    const hasAnyLocal = fields.some((f) => (localValues[f.key] ?? '').trim().length > 0);

    return (
        <div
            style={{
                padding: '20px',
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: token.boxShadowSecondary || '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
            }}
        >
            <Row gutter={[16, 16]}>
                {fields.map((field, index) => {
                    const localVal = localValues[field.key] ?? '';
                    const hasValue = localVal.trim().length > 0;

                    return (
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
                                        fontWeight: 500,
                                        fontSize: 13,
                                        color: hasValue
                                            ? token.colorPrimary
                                            : token.colorTextSecondary,
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    {field.label}
                                </span>
                                {field.type === 'select' ? (
                                    <Select
                                        placeholder={field.placeholder}
                                        value={localVal || undefined}
                                        onChange={(val) => {
                                            setLocalValues((prev) => ({
                                                ...prev,
                                                [field.key]: val || '',
                                            }));
                                        }}
                                        options={field.options}
                                        allowClear
                                        style={{
                                            borderRadius: 6,
                                            width: '100%',
                                        }}
                                    />
                                ) : (
                                    <Input
                                        ref={index === 0 ? firstInputRef : undefined}
                                        placeholder={field.placeholder}
                                        value={localVal}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalValues((prev) => ({
                                                ...prev,
                                                [field.key]: val,
                                            }));
                                        }}
                                        onPressEnter={handleApply}
                                        allowClear
                                        style={{
                                            borderRadius: 6,
                                            height: 38,
                                            borderColor: hasValue
                                                ? token.colorPrimaryBorder
                                                : undefined,
                                            transition: 'border-color 0.2s',
                                        }}
                                    />
                                )}
                            </div>
                        </Col>
                    );
                })}
            </Row>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                    marginTop: 20,
                }}
            >
                <Button
                    onClick={onReset}
                    icon={<CloseOutlined />}
                    disabled={!hasAnyLocal}
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
    );
};

export default AdvancedFilterPanel;
