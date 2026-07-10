'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Spin, Tag, theme, Typography } from 'antd';
import { CheckOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { IncidentReason } from '@/types/ProductionPlan';
import { MachineGroupVM, PlanRowTarget } from './types';
import { WEEK_DAY_KEYS } from '../_utils/dateUtils';
import { getIncidentReasonOptions, isIncidentNoteRequired } from '../_utils/incidentOptions';

export interface TransferSchedulePayload {
    dayIndex: number;
    machineId: string;
    incidentReason: IncidentReason;
    note?: string;
}

interface TransferScheduleModalProps {
    open: boolean;
    target: PlanRowTarget | null;
    todayIndex: number;
    /** Dữ liệu tuần hiện tại (fetch khi mở modal) để vẽ lưới máy × ngày. */
    weeklyGroups: MachineGroupVM[];
    gridLoading?: boolean;
    submitting?: boolean;
    onCancel: () => void;
    onConfirm: (payload: TransferSchedulePayload) => void;
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

// Dời lịch = BE incident defer (tạo child plan ngày/máy mới) nên cần lý do sự cố.
export default function TransferScheduleModal({
    open,
    target,
    todayIndex,
    weeklyGroups,
    gridLoading,
    submitting,
    onCancel,
    onConfirm,
}: TransferScheduleModalProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [incidentReason, setIncidentReason] = useState<IncidentReason | undefined>(undefined);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (!open) {
            setSelectedDayIndex(null);
            setSelectedMachineId(null);
            setIncidentReason(undefined);
            setNote('');
        }
    }, [open]);

    const currentMachineCode = target?.machineCode ?? '';
    const currentQty = target?.row.schedule[todayIndex] ?? 0;
    const hasNoQty = currentQty === 0;

    const dayColumns = useMemo(() => getDayColumns(todayIndex), [todayIndex]);
    const noteRequired = isIncidentNoteRequired(incidentReason);
    const canConfirm =
        !hasNoQty &&
        selectedDayIndex !== null &&
        !!selectedMachineId &&
        !!incidentReason &&
        (!noteRequired || note.trim().length > 0);

    const selectedMachine = useMemo(
        () => weeklyGroups.find((group) => group.machineId === selectedMachineId) ?? null,
        [selectedMachineId, weeklyGroups]
    );

    // Cùng sản phẩm (code|mold) đã có sẵn kế hoạch trên ô đích → cảnh báo cộng dồn.
    const existingQtyOnTarget = useMemo(() => {
        if (selectedDayIndex === null || !selectedMachine || !target) return 0;
        const sameProduct = selectedMachine.products.find(
            (product) =>
                product.code === target.row.code && product.moldCode === target.row.moldCode
        );
        return sameProduct?.schedule[selectedDayIndex] ?? 0;
    }, [selectedDayIndex, selectedMachine, target]);

    const shortDayLabels = WEEK_DAY_KEYS.map((key) => t(`productionPlan.days.short.${key}`));

    const getRelativeLabel = (colIndex: number) => {
        const offset = colIndex - todayIndex;
        if (offset === 0) return t('productionPlan.days.today');
        if (offset === 1) return t('productionPlan.transferSchedule.tomorrow');
        if (offset === 2) return t('productionPlan.transferSchedule.dayAfterTomorrow');
        return null;
    };

    const handleSelectCell = (dayIndex: number, machineId: string) => {
        if (selectedDayIndex === dayIndex && selectedMachineId === machineId) {
            setSelectedDayIndex(null);
            setSelectedMachineId(null);
        } else {
            setSelectedDayIndex(dayIndex);
            setSelectedMachineId(machineId);
        }
    };

    const handleConfirm = () => {
        if (!canConfirm || selectedDayIndex === null || !selectedMachineId || !incidentReason) {
            return;
        }
        onConfirm({
            dayIndex: selectedDayIndex,
            machineId: selectedMachineId,
            incidentReason,
            note: note.trim() || undefined,
        });
    };

    const borderColor = token.colorBorderSecondary;

    const ProductChip = ({
        code,
        qty,
        isCurrent,
    }: {
        code: string;
        qty: number;
        isCurrent: boolean;
    }) => (
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
            <span
                style={{
                    color: isCurrent ? token.colorPrimaryTextActive : token.colorTextSecondary,
                }}
            >
                {qty}
            </span>
        </span>
    );

    return (
        <Modal
            title={
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {t('productionPlan.transferSchedule.title', {
                            code: target?.row.code ?? '',
                        })}
                    </div>
                    {target?.row.name && (
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 400,
                                color: token.colorTextSecondary,
                                marginTop: 1,
                            }}
                        >
                            {target.row.name}
                        </div>
                    )}
                </div>
            }
            open={open}
            onOk={handleConfirm}
            onCancel={onCancel}
            okText={t('productionPlan.actions.transferSchedule')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            confirmLoading={submitting}
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

                {/* From info */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: `1px solid ${borderColor}`,
                        background: token.colorFillAlter,
                        alignSelf: 'flex-start',
                    }}
                >
                    <div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            {t('productionPlan.transferSchedule.from')}
                        </Text>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                            {shortDayLabels[todayIndex]}
                            <Text
                                type="secondary"
                                style={{ fontSize: 11, fontWeight: 400, marginLeft: 5 }}
                            >
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
                            {currentMachineCode}
                        </Tag>
                    </div>
                    <div style={{ width: 1, alignSelf: 'stretch', background: borderColor }} />
                    <div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            {t('productionPlan.transferSchedule.caseQuantity')}
                        </Text>
                        <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                            {currentQty}
                            <Text
                                type="secondary"
                                style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}
                            >
                                {t('productionPlan.units.cases').toLowerCase()}
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Schedule grid */}
                <Spin spinning={!!gridLoading}>
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
                                                    background:
                                                        isSelectedDay || isToday
                                                            ? token.colorPrimaryBg
                                                            : token.colorFillAlter,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color:
                                                        isToday || isSelectedDay
                                                            ? token.colorPrimary
                                                            : token.colorTextSecondary,
                                                    textAlign: 'left',
                                                    borderBottom: `2px solid ${
                                                        isSelectedDay
                                                            ? token.colorPrimary
                                                            : isToday
                                                              ? token.colorPrimaryBorder
                                                              : borderColor
                                                    }`,
                                                    borderLeft: `1px solid ${borderColor}`,
                                                    transition: 'background 0.15s',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
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
                                                                color: isToday
                                                                    ? '#fff'
                                                                    : token.colorPrimary,
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
                                                        color:
                                                            isToday || isSelectedDay
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
                                {weeklyGroups.map((group, mIdx) => {
                                    const isLastRow = mIdx === weeklyGroups.length - 1;
                                    const isCurrentMachine = group.machineId === target?.machineId;
                                    return (
                                        <tr key={group.machineId}>
                                            <td
                                                style={{
                                                    width: MACHINE_COL_WIDTH,
                                                    padding: '10px 12px',
                                                    background: token.colorFillAlter,
                                                    borderBottom: isLastRow
                                                        ? 'none'
                                                        : `1px solid ${borderColor}`,
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
                                                    {group.machineCode}
                                                </Tag>
                                            </td>

                                            {dayColumns.map((col) => {
                                                const isSource =
                                                    isCurrentMachine && col.index === todayIndex;
                                                const isSelected =
                                                    selectedDayIndex === col.index &&
                                                    selectedMachineId === group.machineId;
                                                const isToday = col.index === todayIndex;
                                                const cellProducts = group.products
                                                    .filter(
                                                        (product) =>
                                                            !product.isDeleted &&
                                                            product.schedule[col.index] > 0
                                                    )
                                                    .map((product) => ({
                                                        code: product.code,
                                                        qty: product.schedule[col.index],
                                                    }));

                                                return (
                                                    <td
                                                        key={col.index}
                                                        onClick={
                                                            !isSource
                                                                ? () =>
                                                                      handleSelectCell(
                                                                          col.index,
                                                                          group.machineId
                                                                      )
                                                                : undefined
                                                        }
                                                        style={{
                                                            minWidth: DAY_COL_MIN_WIDTH,
                                                            padding: '8px 10px',
                                                            verticalAlign: 'top',
                                                            cursor: isSource
                                                                ? 'not-allowed'
                                                                : 'pointer',
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
                                                                        isCurrent={
                                                                            p.code ===
                                                                            target?.row.code
                                                                        }
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
                                                                <LockOutlined
                                                                    style={{ fontSize: 10 }}
                                                                />
                                                                <span>
                                                                    {t(
                                                                        'productionPlan.transferSchedule.sourceLocked'
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="small"
                                                                type={
                                                                    isSelected
                                                                        ? 'primary'
                                                                        : 'dashed'
                                                                }
                                                                icon={
                                                                    isSelected ? (
                                                                        <CheckOutlined />
                                                                    ) : (
                                                                        <PlusOutlined />
                                                                    )
                                                                }
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectCell(
                                                                        col.index,
                                                                        group.machineId
                                                                    );
                                                                }}
                                                                style={{
                                                                    fontSize: 11,
                                                                    height: 24,
                                                                }}
                                                            >
                                                                {isSelected
                                                                    ? t(
                                                                          'productionPlan.transferSchedule.selected'
                                                                      )
                                                                    : t(
                                                                          'productionPlan.transferSchedule.selectTransferTo'
                                                                      )}
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
                </Spin>

                {/* Incident reason */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 280px' }}>
                        <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
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
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
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
                        {noteRequired && !note.trim() && (
                            <Text type="danger" style={{ fontSize: 12 }}>
                                {t('productionPlan.incident.noteRequiredForOther')}
                            </Text>
                        )}
                    </div>
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
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {t('productionPlan.transferSchedule.from')}
                            </Text>
                            <Tag style={{ fontWeight: 700, margin: 0 }}>
                                {currentQty} {t('productionPlan.units.cases').toLowerCase()}
                            </Tag>
                            <strong>{shortDayLabels[todayIndex]}</strong>
                            <Tag color="purple" style={{ margin: 0 }}>
                                {currentMachineCode}
                            </Tag>
                            <span
                                style={{
                                    color: token.colorSuccess,
                                    fontWeight: 700,
                                    fontSize: 16,
                                }}
                            >
                                →
                            </span>
                            <strong style={{ color: token.colorSuccess }}>
                                {shortDayLabels[selectedDayIndex]}
                            </strong>
                            <Tag color="green" style={{ margin: 0 }}>
                                {selectedMachine.machineCode}
                            </Tag>
                        </div>
                        {existingQtyOnTarget > 0 && (
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginTop: 8 }}
                                message={
                                    <span>
                                        {t(
                                            'productionPlan.transferSchedule.targetAlreadyHasPrefix'
                                        )}{' '}
                                        <strong>{existingQtyOnTarget}</strong>{' '}
                                        {t('productionPlan.units.cases').toLowerCase()},{' '}
                                        {t(
                                            'productionPlan.transferSchedule.targetAlreadyHasMiddle'
                                        )}{' '}
                                        <strong>{existingQtyOnTarget + currentQty}</strong>{' '}
                                        {t(
                                            'productionPlan.transferSchedule.targetAlreadyHasSuffix'
                                        )}
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
