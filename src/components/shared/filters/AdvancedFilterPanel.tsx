import { useState, useEffect, useRef } from 'react';
import { Button, Col, Input, Row, theme } from 'antd';
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
    onChange: (value: string) => void;
    /** Override responsive column widths. Defaults to xs=24 sm=12 md=6 */
    colProps?: FilterFieldColProps;
}

interface AdvancedFilterPanelProps {
    fields: FilterField[];
    onApply: () => void;
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
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: token.boxShadowSecondary || '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease-in-out',
            }}
        >
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
                                    fontWeight: 500,
                                    fontSize: 13,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                {field.label}
                            </span>
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
                                style={{ borderRadius: 6, height: 38 }}
                            />
                        </div>
                    </Col>
                ))}
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
