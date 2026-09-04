'use client';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { Button, Col, Drawer, Grid, Input, Popover, Row, Select, theme } from 'antd';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { FilterField } from './AdvancedFilterPanel';

export interface FilterDrawerProps {
    open: boolean;
    onClose: () => void;
    fields: FilterField[];
    onApply: (values: Record<string, string>) => void;
    onReset: () => void;
    /** Trigger element — on desktop wraps Popover, on mobile renders standalone */
    children: ReactNode;
    title?: string;
    applyLabel?: string;
    resetLabel?: string;
}

const { useBreakpoint } = Grid;

const FilterDrawer = ({
    open,
    onClose,
    fields,
    onApply,
    onReset,
    children,
    title,
    applyLabel = 'Search',
    resetLabel = 'Reset',
}: FilterDrawerProps) => {
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const firstInputRef = useRef<any>(null);

    const [localValues, setLocalValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        fields.forEach((f) => {
            initial[f.key] = f.value;
        });
        return initial;
    });

    useEffect(() => {
        setLocalValues((prev) => {
            const next = { ...prev };
            fields.forEach((f) => {
                next[f.key] = f.value;
            });
            return next;
        });
    }, [fields]);

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => firstInputRef.current?.focus(), 150);
        return () => clearTimeout(timer);
    }, [open]);

    const handleApply = () => {
        fields.forEach((f) => f.onChange?.(localValues[f.key] ?? ''));
        onApply(localValues);
        onClose();
    };

    const hasAnyLocal = fields.some((f) => (localValues[f.key] ?? '').trim().length > 0);

    const renderFields = (stackAll: boolean) => (
        <Row gutter={[12, stackAll ? 12 : 16]}>
            {fields.map((field, index) => {
                const localVal = localValues[field.key] ?? '';
                const hasValue = localVal.trim().length > 0;
                const colSpan = stackAll
                    ? { span: 24 }
                    : { xs: field.colProps?.xs ?? 24, sm: field.colProps?.sm ?? 12 };

                return (
                    <Col key={field.key} {...colSpan}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <span
                                style={{
                                    fontWeight: 500,
                                    fontSize: 12,
                                    color: hasValue ? token.colorPrimary : token.colorTextSecondary,
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
                                        height: stackAll ? 34 : 38,
                                    }}
                                />
                            ) : (
                                <Input
                                    ref={index === 0 ? firstInputRef : undefined}
                                    placeholder={field.placeholder}
                                    value={localVal}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLocalValues((prev) => ({ ...prev, [field.key]: val }));
                                    }}
                                    onPressEnter={handleApply}
                                    allowClear
                                    style={{
                                        borderRadius: 6,
                                        height: stackAll ? 34 : 38,
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
    );

    const actionButtons = (compact: boolean) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
                onClick={onReset}
                icon={<CloseOutlined />}
                disabled={!hasAnyLocal}
                size={compact ? 'small' : 'middle'}
                style={{ borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}
            >
                {resetLabel}
            </Button>
            <Button
                type="primary"
                onClick={handleApply}
                icon={<SearchOutlined />}
                size={compact ? 'small' : 'middle'}
                style={{ borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}
            >
                {applyLabel}
            </Button>
        </div>
    );

    if (!isMobile) {
        return (
            <Popover
                open={open}
                onOpenChange={(visible) => {
                    if (!visible) onClose();
                }}
                content={
                    <div style={{ width: 320 }}>
                        {renderFields(true)}
                        <div
                            style={{
                                marginTop: 14,
                                paddingTop: 12,
                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                            }}
                        >
                            {actionButtons(true)}
                        </div>
                    </div>
                }
                placement="bottomRight"
                trigger="click"
                arrow={false}
            >
                {children}
            </Popover>
        );
    }

    return (
        <>
            {children}
            <Drawer
                title={title}
                placement="bottom"
                size="auto"
                open={open}
                onClose={onClose}
                styles={{
                    body: { paddingTop: 16, paddingBottom: 8 },
                    footer: { padding: '12px 16px' },
                }}
                footer={actionButtons(false)}
            >
                {renderFields(false)}
            </Drawer>
        </>
    );
};

export default FilterDrawer;
