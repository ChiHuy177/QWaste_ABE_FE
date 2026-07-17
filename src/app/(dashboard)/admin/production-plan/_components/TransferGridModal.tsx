'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Spin, Tag, theme, Typography } from 'antd';
import { CheckOutlined, LeftOutlined, LockOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import type { IncidentReason } from '@/types/ProductionPlan';
import type { MachineGroupVM, PlanRowTarget } from './types';
import { getWeekDayColumns, WEEK_DAY_KEYS } from '../_utils/dateUtils';
import { getIncidentReasonOptions, isIncidentNoteRequired } from '../_utils/incidentOptions';

export interface TransferPayload {
    machineId: string;
    dayIndex: number;
    incidentReason?: IncidentReason;
    note?: string;
}

interface TransferGridModalProps {
    open: boolean;
    target: PlanRowTarget;
    todayIndex: number;
    /** Tuần đang xem ở trang chính — dùng tính ngày nguồn "hôm nay", không đổi theo weekOffset. */
    weekStart: Dayjs;
    /** Tuần đang hiển thị trong lưới = weekStart + gridWeekOffset tuần. */
    gridWeekStart: Dayjs;
    gridWeekOffset: number;
    onShiftWeek: (dir: 1 | -1) => void;
    /** Chỉ gồm máy tương thích công đoạn khuôn của kế hoạch (lọc từ pickingByOperationType). */
    weeklyGroups: MachineGroupVM[];
    gridLoading?: boolean;
    submitting?: boolean;
    onCancel: () => void;
    onConfirm: (payload: TransferPayload) => void;
}

const { Text } = Typography;

const MACHINE_COL_WIDTH = 120;
const DAY_COL_MIN_WIDTH = 158;

// Modal lưới tuần hợp nhất (hướng 1) — thay popover + modal lưới tách rời trước đây bằng
// 1 modal duy nhất: chọn máy/ngày (kể cả tuần khác) bằng cách bấm ô, điền lý do sự cố nếu
// cần rồi xác nhận — tự gọi API move/defer ngay tại đây.
export default function TransferGridModal({
    open,
    target,
    todayIndex,
    weekStart,
    gridWeekStart,
    gridWeekOffset,
    onShiftWeek,
    weeklyGroups,
    gridLoading,
    submitting,
    onCancel,
    onConfirm,
}: TransferGridModalProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [incidentReason, setIncidentReason] = useState<IncidentReason | undefined>(undefined);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (!open) return;
        setSelectedDayIndex(null);
        setSelectedMachineId(null);
        setIncidentReason(undefined);
        setNote('');
    }, [open, target.row.productionPlanId]);

    useEffect(() => {
        // Đổi tuần thì bỏ lựa chọn cũ — tránh hiểu nhầm ô đã chọn thuộc tuần nào.
        setSelectedDayIndex(null);
        setSelectedMachineId(null);
    }, [gridWeekOffset]);

    const currentMachineCode = target.machineCode;
    const currentQty = target.row.schedule[todayIndex] ?? 0;
    const hasNoQty = currentQty === 0;
    const requiresIncidentReason = target.row.status === 'PAUSE';
    const noteRequired = requiresIncidentReason && isIncidentNoteRequired(incidentReason);

    const dayColumns = useMemo(
        () => getWeekDayColumns(gridWeekStart, gridWeekOffset === 0 ? todayIndex : 0),
        [gridWeekStart, gridWeekOffset, todayIndex]
    );
    const canConfirm =
        !hasNoQty &&
        selectedDayIndex !== null &&
        !!selectedMachineId &&
        (!requiresIncidentReason || (!!incidentReason && (!noteRequired || note.trim().length > 0)));

    const selectedMachine = useMemo(
        () => weeklyGroups.find((group) => group.machineId === selectedMachineId) ?? null,
        [selectedMachineId, weeklyGroups]
    );

    const existingQtyOnTarget = useMemo(() => {
        if (selectedDayIndex === null || !selectedMachine) return 0;
        const sameProduct = selectedMachine.products.find(
            (product) => product.code === target.row.code && product.moldCode === target.row.moldCode
        );
        return sameProduct?.schedule[selectedDayIndex] ?? 0;
    }, [selectedDayIndex, selectedMachine, target]);

    const shortDayLabels = WEEK_DAY_KEYS.map((key) => t(`productionPlan.days.short.${key}`));

    const getRelativeLabel = (colIndex: number) => {
        if (gridWeekOffset !== 0) return null;
        const offset = colIndex - todayIndex;
        if (offset === 0) return t('productionPlan.days.today');
        if (offset === 1) return t('productionPlan.transferSchedule.tomorrow');
        if (offset === 2) return t('productionPlan.transferSchedule.dayAfterTomorrow');
        return null;
    };

    const handleSelectCell = (dayIndex: number, machineId: string) => {
        setSelectedDayIndex(dayIndex);
        setSelectedMachineId(machineId);
    };

    const handleConfirm = () => {
        if (!canConfirm || selectedDayIndex === null || !selectedMachineId) return;
        onConfirm({
            machineId: selectedMachineId,
            dayIndex: selectedDayIndex,
            incidentReason: requiresIncidentReason ? incidentReason : undefined,
            note: requiresIncidentReason ? note.trim() || undefined : undefined,
        });
    };

    const handleCancel = () => {
        if (submitting) return;
        onCancel();
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
        <Modal
            title={t('productionPlan.transfer.title', { code: target.row.code })}
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText={t('productionPlan.actions.transfer')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            confirmLoading={submitting}
            maskClosable={!submitting}
            destroyOnHidden
            centered
            width="min(92vw, 1100px)"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                {hasNoQty && (
                    <Alert
                        type="warning"
                        showIcon
                        message={t('productionPlan.transferSchedule.noQuantityToday')}
                    />
                )}
                {!gridLoading && weeklyGroups.length === 0 && (
                    <Alert
                        type="info"
                        showIcon
                        message={t('productionPlan.transfer.noCompatibleMachine')}
                    />
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div
                        style={{
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
                                    {weekStart.add(todayIndex, 'day').format('DD/MM')}
                                </Text>
                            </div>
                        </div>
                        <div style={{ width: 1, alignSelf: 'stretch', background: borderColor }} />
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                {t('productionPlan.table.headers.machine')}
                            </Text>
                            <Tag
                                style={{
                                    fontWeight: 700,
                                    margin: '4px 0 0',
                                    background: token.colorBgContainer,
                                    borderColor: token.colorBorder,
                                }}
                            >
                                {currentMachineCode}
                            </Tag>
                        </div>
                        <div style={{ width: 1, alignSelf: 'stretch', background: borderColor }} />
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                {t('productionPlan.transferSchedule.pieceQuantity')}
                            </Text>
                            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                                {currentQty}
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>
                                    {t('productionPlan.units.pieces').toLowerCase()}
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: `1px solid ${borderColor}`,
                            marginLeft: 'auto',
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
                                    const isCurrentMachine = group.machineId === target.machineId;
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
                                                        onClick={!isSource ? () => handleSelectCell(col.index, group.machineId) : undefined}
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
                                                                        isCurrent={p.code === target.row.code}
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

                {requiresIncidentReason && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            padding: 12,
                            borderRadius: 8,
                            border: `1px solid ${borderColor}`,
                        }}
                    >
                        <div>
                            <Text style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
                                {t('productionPlan.incident.reasonLabel')}
                            </Text>
                            <Select
                                style={{ width: '100%' }}
                                placeholder={t('productionPlan.incident.reasonPlaceholder')}
                                value={incidentReason}
                                onChange={setIncidentReason}
                                options={getIncidentReasonOptions(t)}
                            />
                        </div>
                        <div>
                            <Text style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
                                {t('productionPlan.incident.noteLabel')}
                                {noteRequired && <Text type="danger"> *</Text>}
                            </Text>
                            <Input.TextArea
                                rows={2}
                                maxLength={2000}
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder={t('productionPlan.incident.notePlaceholder')}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
