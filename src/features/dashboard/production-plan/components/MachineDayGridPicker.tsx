'use client';

import { useMemo } from 'react';
import { Alert, Button, Spin, Tag, theme, Typography } from 'antd';
import { CheckOutlined, LeftOutlined, LockOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import type { MachineGroupVM } from './types';
import { getWeekDayColumns, WEEK_DAY_KEYS } from '../utils/dateUtils';

const { Text } = Typography;

const MACHINE_COL_WIDTH = 120;
const DAY_COL_MIN_WIDTH = 158;

export interface MachineDayGridPickerProps {
    gridWeekStart: Dayjs;
    gridWeekOffset: number;
    todayIndex: number;
    onShiftWeek: (dir: 1 | -1) => void;
    weeklyGroups: MachineGroupVM[];
    gridLoading?: boolean;
    selectedDayIndex: number | null;
    selectedMachineId: string | null;
    onSelectCell: (dayIndex: number, machineId: string) => void;
    /** Khoá ô (máy này, todayIndex) khi gridWeekOffset === 0 — vị trí hiện tại, không chọn được. */
    sourceMachineId?: string;
    /** Mã sản phẩm/khuôn của kế hoạch đang thao tác — highlight chip + tính alert existingQty. */
    currentCode: string;
    currentMoldCode: string | null;
    currentQty: number;
}

/**
 * Bảng máy × ngày (kèm nav tuần + alert "target đã có sản lượng") — tách từ TransferGridModal
 * để dùng chung cho cả modal Chuyển kế hoạch (trang production-plan) lẫn bước Dời lịch trong
 * Incident Confirm (trang monitor), nơi khuôn có thể đổi nên tập máy tương thích không cố định.
 */
export default function MachineDayGridPicker({
    gridWeekStart,
    gridWeekOffset,
    todayIndex,
    onShiftWeek,
    weeklyGroups,
    gridLoading,
    selectedDayIndex,
    selectedMachineId,
    onSelectCell,
    sourceMachineId,
    currentCode,
    currentMoldCode,
    currentQty,
}: MachineDayGridPickerProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    const dayColumns = useMemo(
        () => getWeekDayColumns(gridWeekStart, gridWeekOffset === 0 ? todayIndex : 0),
        [gridWeekStart, gridWeekOffset, todayIndex]
    );

    const selectedMachine = useMemo(
        () => weeklyGroups.find((group) => group.machineId === selectedMachineId) ?? null,
        [selectedMachineId, weeklyGroups]
    );

    const existingQtyOnTarget = useMemo(() => {
        if (selectedDayIndex === null || !selectedMachine) return 0;
        const sameProduct = selectedMachine.products.find(
            (product) => product.code === currentCode && product.moldCode === currentMoldCode
        );
        return sameProduct?.schedule[selectedDayIndex] ?? 0;
    }, [selectedDayIndex, selectedMachine, currentCode, currentMoldCode]);

    const shortDayLabels = WEEK_DAY_KEYS.map((key) => t(`productionPlan.days.short.${key}`));

    const getRelativeLabel = (colIndex: number) => {
        if (gridWeekOffset !== 0) return null;
        const offset = colIndex - todayIndex;
        if (offset === 0) return t('productionPlan.days.today');
        if (offset === 1) return t('productionPlan.transferSchedule.tomorrow');
        if (offset === 2) return t('productionPlan.transferSchedule.dayAfterTomorrow');
        return null;
    };

    const borderColor = token.colorBorderSecondary;
    const weekRangeLabel = `${gridWeekStart.format('DD/MM')} – ${gridWeekStart.add(6, 'day').format('DD/MM')}`;

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!gridLoading && weeklyGroups.length === 0 && (
                <Alert type="info" showIcon message={t('productionPlan.transfer.noCompatibleMachine')} />
            )}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    marginLeft: 'auto',
                    width: 'fit-content',
                }}
            >
                <Button
                    size="small"
                    type="text"
                    icon={<LeftOutlined />}
                    disabled={gridWeekOffset === 0}
                    onClick={() => onShiftWeek(-1)}
                    title={t('productionPlan.transfer.prevWeek')}
                />
                <Text style={{ fontSize: 12.5, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
                    {weekRangeLabel}
                    {gridWeekOffset === 0 ? ` (${t('productionPlan.transfer.thisWeek')})` : ''}
                </Text>
                <Button
                    size="small"
                    type="text"
                    icon={<RightOutlined />}
                    onClick={() => onShiftWeek(1)}
                    title={t('productionPlan.transfer.nextWeek')}
                />
            </div>

            <Spin spinning={!!gridLoading}>
                <div style={{ overflowX: 'auto', border: `1px solid ${borderColor}`, borderRadius: 8 }}>
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
                                    const isToday = gridWeekOffset === 0 && col.index === todayIndex;
                                    const isSelectedDay = selectedDayIndex === col.index;
                                    return (
                                        <th
                                            key={col.index}
                                            style={{
                                                minWidth: DAY_COL_MIN_WIDTH,
                                                padding: '8px 12px',
                                                background:
                                                    isSelectedDay || isToday
                                                        ? token.colorPrimaryBg
                                                        : token.colorFillAlter,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: isToday || isSelectedDay ? token.colorPrimary : token.colorTextSecondary,
                                                textAlign: 'left',
                                                borderBottom: `2px solid ${
                                                    isSelectedDay
                                                        ? token.colorPrimary
                                                        : isToday
                                                          ? token.colorPrimaryBorder
                                                          : borderColor
                                                }`,
                                                borderLeft: `1px solid ${borderColor}`,
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
                                                            background: isToday ? token.colorPrimary : token.colorPrimaryBg,
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
                                                    color: isToday || isSelectedDay ? token.colorPrimaryTextActive : token.colorTextTertiary,
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
                            {weeklyGroups.map((group, mIdx) => {
                                const isLastRow = mIdx === weeklyGroups.length - 1;
                                const isCurrentMachine = group.machineId === sourceMachineId;
                                return (
                                    <tr key={group.machineId}>
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
                                                icon={isCurrentMachine ? <LockOutlined /> : undefined}
                                                style={{
                                                    fontWeight: 700,
                                                    margin: 0,
                                                    background: isCurrentMachine
                                                        ? token.colorFillSecondary
                                                        : token.colorBgContainer,
                                                    borderColor: token.colorBorder,
                                                }}
                                            >
                                                {group.machineCode}
                                            </Tag>
                                        </td>

                                        {dayColumns.map((col) => {
                                            const isSource =
                                                gridWeekOffset === 0 &&
                                                isCurrentMachine &&
                                                col.index === todayIndex;
                                            const isSelected =
                                                selectedDayIndex === col.index && selectedMachineId === group.machineId;
                                            const isToday = gridWeekOffset === 0 && col.index === todayIndex;
                                            const cellProducts = group.products
                                                .filter((product) => !product.isDeleted && product.schedule[col.index] > 0)
                                                .map((product) => ({ code: product.code, qty: product.schedule[col.index] }));

                                            return (
                                                <td
                                                    key={col.index}
                                                    onClick={!isSource ? () => onSelectCell(col.index, group.machineId) : undefined}
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
                                                        borderBottom: isLastRow ? 'none' : `1px solid ${borderColor}`,
                                                        borderLeft: `1px solid ${borderColor}`,
                                                        outline: isSelected ? `2px solid ${token.colorPrimary}` : undefined,
                                                        outlineOffset: -2,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6, minHeight: 22 }}>
                                                        {cellProducts.length > 0 ? (
                                                            cellProducts.map((p) => (
                                                                <ProductChip
                                                                    key={p.code}
                                                                    code={p.code}
                                                                    qty={p.qty}
                                                                    isCurrent={p.code === currentCode}
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
                                                            <span>{t('productionPlan.transferSchedule.sourceLocked')}</span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                                color: isSelected ? token.colorPrimary : token.colorTextSecondary,
                                                            }}
                                                        >
                                                            {isSelected ? <CheckOutlined /> : <PlusOutlined />}
                                                            {isSelected
                                                                ? t('productionPlan.transferSchedule.selected')
                                                                : t('productionPlan.transferSchedule.selectTransferTo')}
                                                        </div>
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
            </Spin>

            {selectedDayIndex !== null && selectedMachine && existingQtyOnTarget > 0 && (
                <Alert
                    type="info"
                    showIcon
                    message={
                        <span>
                            {t('productionPlan.transferSchedule.targetAlreadyHasPrefix')}{' '}
                            <strong>{existingQtyOnTarget}</strong>{' '}
                            {t('productionPlan.units.pieces').toLowerCase()},{' '}
                            {t('productionPlan.transferSchedule.targetAlreadyHasMiddle')}{' '}
                            <strong>{existingQtyOnTarget + currentQty}</strong>{' '}
                            {t('productionPlan.transferSchedule.targetAlreadyHasSuffix')}
                        </span>
                    }
                />
            )}
        </div>
    );
}
