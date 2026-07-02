'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Modal, Tag, theme, Typography } from 'antd';
import { CheckOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProductionLine, ProductionProduct } from './types';
import { WEEK_DAY_KEYS } from '../_utils/dateUtils';
import { getEffectiveMachine } from '../_utils/planUtils';

interface TransferScheduleModalProps {
    open: boolean;
    product: ProductionProduct | null;
    todayIndex: number;
    machineOptions: string[];
    lines: ProductionLine[];
    onCancel: () => void;
    onConfirm: (newDayIndex: number, newMachine: string) => void;
}

const { Text } = Typography;

const MACHINE_COL_WIDTH = 120;
const DAY_COL_MIN_WIDTH = 158;

function getDayColumns(todayIndex: number) {
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    return Array.from({ length: 7 - todayIndex }, (_, i) => {
        const idx = todayIndex + i;
        const date = new Date(monday);
        date.setDate(monday.getDate() + idx);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        return { index: idx, dateStr: `${dd}/${mm}` };
    });
}

function getProductsForCell(lines: ProductionLine[], machine: string, dayIndex: number) {
    const result: Array<{ code: string; qty: number }> = [];
    for (const line of lines) {
        for (const product of line.products) {
            if (
                getEffectiveMachine(product, dayIndex) === machine &&
                product.schedule[dayIndex] > 0
            ) {
                result.push({ code: product.code, qty: product.schedule[dayIndex] });
            }
        }
    }
    return result;
}

export default function TransferScheduleModal({
    open,
    product,
    todayIndex,
    machineOptions,
    lines,
    onCancel,
    onConfirm,
}: TransferScheduleModalProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

    const currentMachine = product ? getEffectiveMachine(product, todayIndex) : '';
    const currentQty = product?.schedule[todayIndex] ?? 0;
    const hasNoQty = currentQty === 0;

    const dayColumns = useMemo(() => getDayColumns(todayIndex), [todayIndex]);
    const canConfirm = !hasNoQty && selectedDayIndex !== null && !!selectedMachine;

    const existingQtyOnTarget =
        selectedDayIndex !== null ? (product?.schedule[selectedDayIndex] ?? 0) : 0;

    const shortDayLabels = WEEK_DAY_KEYS.map((key) => t(`productionPlan.days.short.${key}`));

    const getRelativeLabel = (colIndex: number) => {
        const offset = colIndex - todayIndex;
        if (offset === 0) return t('productionPlan.days.today');
        if (offset === 1) return t('productionPlan.transferSchedule.tomorrow');
        if (offset === 2) return t('productionPlan.transferSchedule.dayAfterTomorrow');
        return null;
    };

    const handleSelectCell = (dayIndex: number, machine: string) => {
        if (selectedDayIndex === dayIndex && selectedMachine === machine) {
            setSelectedDayIndex(null);
            setSelectedMachine(null);
        } else {
            setSelectedDayIndex(dayIndex);
            setSelectedMachine(machine);
        }
    };

    const reset = () => {
        setSelectedDayIndex(null);
        setSelectedMachine(null);
    };

    const handleConfirm = () => {
        if (!canConfirm || selectedDayIndex === null || !selectedMachine) return;
        onConfirm(selectedDayIndex, selectedMachine);
        reset();
    };

    const handleCancel = () => {
        reset();
        onCancel();
    };

    const borderColor = token.colorBorderSecondary;

    const ProductChip = ({ code, qty, isCurrent }: { code: string; qty: number; isCurrent: boolean }) => (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 8px',
                borderRadius: 99,
                fontSize: 11,
                whiteSpace: 'nowrap',
                background: isCurrent ? token.colorPrimaryBg : token.colorFillSecondary,
                border: `1px solid ${isCurrent ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                color: isCurrent ? token.colorPrimary : token.colorText,
            }}
        >
            <span style={{ fontWeight: 700 }}>{code}</span>
            <span style={{ color: token.colorTextQuaternary, fontSize: 10 }}>·</span>
            <span style={{ color: isCurrent ? token.colorPrimaryTextActive : token.colorTextSecondary }}>
                {qty}
            </span>
        </span>
    );

    return (
        <Modal
            title={
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {t('productionPlan.transferSchedule.title', { code: product?.code ?? '' })}
                    </div>
                    {product?.name && (
                        <div style={{ fontSize: 12, fontWeight: 400, color: token.colorTextSecondary, marginTop: 1 }}>
                            {product.name}
                        </div>
                    )}
                </div>
            }
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText={t('productionPlan.actions.transferSchedule')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            destroyOnHidden
            width="min(92vw, 1200px)"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                {hasNoQty && (
                    <Alert
                        type="warning"
                        showIcon
                        message={t('productionPlan.transferSchedule.noQuantityToday')}
                    />
                )}

                {/* From info + Legend */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
                    {/* From card */}
                    <div
                        style={{
                            flex: '0 0 auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '10px 16px',
                            borderRadius: 8,
                            border: `1px solid ${borderColor}`,
                            background: token.colorFillAlter,
                        }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                {t('productionPlan.transferSchedule.from')}
                            </Text>
                            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                                {shortDayLabels[todayIndex]}
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, marginLeft: 5 }}>
                                    {dayColumns[0]?.dateStr}
                                </Text>
                            </div>
                        </div>
                        <div style={{ width: 1, alignSelf: 'stretch', background: borderColor }} />
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                {t('productionPlan.table.headers.machine')}
                            </Text>
                            <Tag color="purple" style={{ fontWeight: 700, margin: '4px 0 0' }}>
                                {currentMachine}
                            </Tag>
                        </div>
                        <div style={{ width: 1, alignSelf: 'stretch', background: borderColor }} />
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                {t('productionPlan.transferSchedule.caseQuantity')}
                            </Text>
                            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                                {currentQty}
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>
                                    {t('productionPlan.units.cases').toLowerCase()}
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 220,
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: `1px solid ${borderColor}`,
                            background: token.colorBgContainer,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 6,
                        }}
                    >
                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                            Chú thích
                        </Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                background: token.colorPrimaryBg,
                                border: `1px solid ${token.colorPrimaryBorder}`,
                                color: token.colorPrimary,
                            }}>
                                {product?.code ?? 'P-XXX'}
                            </span>
                            <Text type="secondary" style={{ fontSize: 11 }}>= SP đang chuyển</Text>

                            <span style={{ color: token.colorTextQuaternary }}>·</span>

                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                padding: '2px 8px', borderRadius: 99, fontSize: 11,
                                background: token.colorFillSecondary,
                                border: `1px solid ${token.colorBorderSecondary}`,
                                color: token.colorText,
                            }}>
                                P-XXX
                            </span>
                            <Text type="secondary" style={{ fontSize: 11 }}>= SP khác</Text>

                            <span style={{ color: token.colorTextQuaternary }}>·</span>

                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 8px', borderRadius: 4, fontSize: 11,
                                background: token.colorFillSecondary,
                                border: `1px solid ${borderColor}`,
                                color: token.colorTextQuaternary,
                            }}>
                                <LockOutlined style={{ fontSize: 10 }} /> Nguồn
                            </span>
                            <Text type="secondary" style={{ fontSize: 11 }}>= không thể chọn</Text>
                        </div>
                    </div>
                </div>

                {/* Schedule table */}
                <div
                    style={{
                        overflowX: 'auto',
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                    }}
                >
                    <table
                        style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            minWidth: MACHINE_COL_WIDTH + DAY_COL_MIN_WIDTH * dayColumns.length,
                        }}
                    >
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        width: MACHINE_COL_WIDTH,
                                        padding: '10px 12px',
                                        background: token.colorFillAlter,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: token.colorTextSecondary,
                                        textAlign: 'left',
                                        borderBottom: `2px solid ${borderColor}`,
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 2,
                                    }}
                                >
                                    {t('productionPlan.table.headers.machine')}
                                </th>
                                {dayColumns.map((col) => {
                                    const relative = getRelativeLabel(col.index);
                                    const isToday = col.index === todayIndex;
                                    const isSelectedDay = selectedDayIndex === col.index;
                                    return (
                                        <th
                                            key={col.index}
                                            style={{
                                                minWidth: DAY_COL_MIN_WIDTH,
                                                padding: '8px 12px',
                                                background: isSelectedDay
                                                    ? token.colorPrimaryBg
                                                    : isToday
                                                        ? token.colorPrimaryBg
                                                        : token.colorFillAlter,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: isToday || isSelectedDay
                                                    ? token.colorPrimary
                                                    : token.colorTextSecondary,
                                                textAlign: 'left',
                                                borderBottom: `2px solid ${isSelectedDay
                                                    ? token.colorPrimary
                                                    : isToday
                                                        ? token.colorPrimaryBorder
                                                        : borderColor
                                                    }`,
                                                borderLeft: `1px solid ${borderColor}`,
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                                {relative && (
                                                    <span
                                                        style={{
                                                            padding: '0 5px',
                                                            borderRadius: 10,
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            background: isToday
                                                                ? token.colorPrimary
                                                                : token.colorPrimaryBg,
                                                            color: isToday ? '#fff' : token.colorPrimary,
                                                            border: `1px solid ${token.colorPrimaryBorder}`,
                                                        }}
                                                    >
                                                        {relative}
                                                    </span>
                                                )}
                                                <span>{shortDayLabels[col.index]}</span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 400,
                                                    color: isToday || isSelectedDay
                                                        ? token.colorPrimaryTextActive
                                                        : token.colorTextTertiary,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {col.dateStr}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {machineOptions.map((machine, mIdx) => {
                                const isLastRow = mIdx === machineOptions.length - 1;
                                const isCurrentMachine = machine === currentMachine;
                                return (
                                    <tr key={machine}>
                                        <td
                                            style={{
                                                width: MACHINE_COL_WIDTH,
                                                padding: '10px 12px',
                                                background: token.colorFillAlter,
                                                borderBottom: isLastRow ? 'none' : `1px solid ${borderColor}`,
                                                verticalAlign: 'middle',
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1,
                                            }}
                                        >
                                            <Tag
                                                color={isCurrentMachine ? 'purple' : 'default'}
                                                style={{ fontWeight: 700, margin: 0 }}
                                            >
                                                {machine}
                                            </Tag>
                                        </td>

                                        {dayColumns.map((col) => {
                                            const isSource =
                                                machine === currentMachine && col.index === todayIndex;
                                            const isSelected =
                                                selectedDayIndex === col.index && selectedMachine === machine;
                                            const isToday = col.index === todayIndex;
                                            const cellProducts = getProductsForCell(
                                                lines,
                                                machine,
                                                col.index,
                                            );

                                            return (
                                                <td
                                                    key={col.index}
                                                    onClick={
                                                        !isSource
                                                            ? () => handleSelectCell(col.index, machine)
                                                            : undefined
                                                    }
                                                    style={{
                                                        minWidth: DAY_COL_MIN_WIDTH,
                                                        padding: '8px 10px',
                                                        verticalAlign: 'top',
                                                        cursor: isSource ? 'not-allowed' : 'pointer',
                                                        background: isSource
                                                            ? token.colorFillSecondary
                                                            : isSelected
                                                                ? token.colorPrimaryBg
                                                                : isToday
                                                                    ? `${token.colorPrimaryBg}66`
                                                                    : token.colorBgContainer,
                                                        borderBottom: isLastRow
                                                            ? 'none'
                                                            : `1px solid ${borderColor}`,
                                                        borderLeft: `1px solid ${borderColor}`,
                                                        outline: isSelected
                                                            ? `2px solid ${token.colorPrimary}`
                                                            : undefined,
                                                        outlineOffset: -2,
                                                        transition: 'background 0.15s',
                                                    }}
                                                >
                                                    {/* Product chips */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 4,
                                                            marginBottom: 6,
                                                            minHeight: 22,
                                                        }}
                                                    >
                                                        {cellProducts.length > 0 ? (
                                                            cellProducts.map((p) => (
                                                                <ProductChip
                                                                    key={p.code}
                                                                    code={p.code}
                                                                    qty={p.qty}
                                                                    isCurrent={p.code === product?.code}
                                                                />
                                                            ))
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: token.colorTextQuaternary,
                                                                    fontStyle: 'italic',
                                                                    lineHeight: '22px',
                                                                }}
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action */}
                                                    {isSource ? (
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                color: token.colorTextQuaternary,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                            }}
                                                        >
                                                            <LockOutlined style={{ fontSize: 10 }} />
                                                            <span>
                                                                {t('productionPlan.transferSchedule.sourceLocked')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            type={isSelected ? 'primary' : 'dashed'}
                                                            icon={
                                                                isSelected ? (
                                                                    <CheckOutlined />
                                                                ) : (
                                                                    <PlusOutlined />
                                                                )
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectCell(col.index, machine);
                                                            }}
                                                            style={{ fontSize: 11, height: 24 }}
                                                        >
                                                            {isSelected
                                                                ? t('productionPlan.transferSchedule.selected')
                                                                : t('productionPlan.transferSchedule.selectTransferTo')}
                                                        </Button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Transfer preview */}
                {canConfirm && selectedDayIndex !== null && selectedMachine && (
                    <div
                        style={{
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: `1px solid ${token.colorSuccessBorder}`,
                            background: token.colorSuccessBg,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                                fontSize: 13,
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: 12 }}>Chuyển</Text>
                            <Tag style={{ fontWeight: 700, margin: 0 }}>
                                {currentQty} {t('productionPlan.units.cases').toLowerCase()}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>từ</Text>
                            <strong>{shortDayLabels[todayIndex]}</strong>
                            <Tag color="purple" style={{ margin: 0 }}>{currentMachine}</Tag>
                            <span style={{ color: token.colorSuccess, fontWeight: 700, fontSize: 16 }}>→</span>
                            <strong style={{ color: token.colorSuccess }}>
                                {shortDayLabels[selectedDayIndex]}
                            </strong>
                            <Tag color="green" style={{ margin: 0 }}>{selectedMachine}</Tag>
                        </div>
                        {existingQtyOnTarget > 0 && (
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginTop: 8 }}
                                message={
                                    <span>
                                        {t('productionPlan.transferSchedule.targetAlreadyHasPrefix')}{' '}
                                        <strong>{existingQtyOnTarget}</strong>{' '}
                                        {t('productionPlan.units.cases').toLowerCase()},{' '}
                                        {t('productionPlan.transferSchedule.targetAlreadyHasMiddle')}{' '}
                                        <strong>{existingQtyOnTarget + currentQty}</strong>{' '}
                                        {t('productionPlan.transferSchedule.targetAlreadyHasSuffix')}
                                    </span>
                                }
                            />
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
