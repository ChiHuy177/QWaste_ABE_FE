'use client';

import { useEffect, useState } from 'react';
import { Alert, Input, Modal, Select, Tag, theme, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import type { IncidentReason } from '@/types/ProductionPlan';
import type { MachineGroupVM, PlanRowTarget } from './types';
import { getIncidentReasonOptions, isIncidentNoteRequired } from '../utils/incidentOptions';
import MachineDayGridPicker from './MachineDayGridPicker';

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

// Modal lưới tuần hợp nhất (hướng 1) — thay popover + modal lưới tách rời trước đây bằng
// 1 modal duy nhất: chọn máy/ngày (kể cả tuần khác) bằng cách bấm ô, điền lý do sự cố nếu
// cần rồi xác nhận — tự gọi API move/defer ngay tại đây. Phần bảng máy×ngày dùng chung với
// bước Dời lịch trong Incident Confirm (monitor) qua MachineDayGridPicker.
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

    const canConfirm =
        !hasNoQty &&
        selectedDayIndex !== null &&
        !!selectedMachineId &&
        (!requiresIncidentReason || (!!incidentReason && (!noteRequired || note.trim().length > 0)));

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

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: `1px solid ${borderColor}`,
                        background: token.colorFillAlter,
                        width: 'fit-content',
                    }}
                >
                    <div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            {t('productionPlan.transferSchedule.from')}
                        </Text>
                        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                            {weekStart.add(todayIndex, 'day').format('DD/MM')}
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

                <MachineDayGridPicker
                    gridWeekStart={gridWeekStart}
                    gridWeekOffset={gridWeekOffset}
                    todayIndex={todayIndex}
                    onShiftWeek={onShiftWeek}
                    weeklyGroups={weeklyGroups}
                    gridLoading={gridLoading}
                    selectedDayIndex={selectedDayIndex}
                    selectedMachineId={selectedMachineId}
                    onSelectCell={handleSelectCell}
                    sourceMachineId={target.machineId}
                    currentCode={target.row.code}
                    currentMoldCode={target.row.moldCode}
                    currentQty={currentQty}
                />

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
