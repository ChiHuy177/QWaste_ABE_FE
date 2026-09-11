'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Divider, Flex, Input, Modal, Select, Tag, Typography, theme } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    StopOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { IncidentReason } from '@/types/ProductionPlan';
import type { Mold } from '@/types/Mold';
import { useCompatibleMachines } from '../hooks/useCompatibleMachines';
import { useMachineOptions } from '../hooks/useMachineOptions';
import { useWeeklyMachineGrid } from '../hooks/useWeeklyMachineGrid';
import { getTodayScheduleIndex, getWeekStart } from '../utils/dateUtils';
import { MonitorRowVM, SelectOptionVM } from './types';
import { getIncidentReasonOptions, isIncidentNoteRequired } from '../utils/incidentOptions';
import MachineDayGridPicker from './MachineDayGridPicker';

const { Text } = Typography;
const { TextArea } = Input;

const DATE_FORMAT = 'YYYY-MM-DD';
// BE clamp sequence vượt quá cuối ngày về vị trí hợp lệ cuối cùng — gửi số lớn để luôn "chèn
// cuối hàng đợi" của (machine, plannedDate) đích, giống cách useTransferPlan.ts đang làm.
const APPEND_TO_QUEUE_END = 999_999;

type IncidentOption = 1 | 2 | 3; // 1 = terminate, 2 = defer, 3 = temp pause

interface Props {
    open: boolean;
    row: MonitorRowVM | null;
    /** Danh sách khuôn đầy đủ — dùng tra operationType để lọc máy tương thích khi chọn khuôn. */
    molds: Mold[];
    moldOptions: SelectOptionVM[];
    /** moldId hiện tại của plan (resolve từ moldCode) — default cho defer. */
    currentMoldId?: string;
    onClose: () => void;
    /** Gọi sau khi action thành công để page refetch. */
    onDone: () => void;
}

export default function IncidentConfirmModal({
    open,
    row,
    molds,
    moldOptions,
    currentMoldId,
    onClose,
    onDone,
}: Props) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { handleError } = useApiErrorHandler();

    const [selected, setSelected] = useState<IncidentOption | null>(null);
    const [incidentReason, setIncidentReason] = useState<IncidentReason | undefined>(undefined);
    const [note, setNote] = useState('');
    const [deferMoldId, setDeferMoldId] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);
    const [actualQuantity, setActualQuantity] = useState<number | null>(null);

    // Lưới máy×ngày cho bước dời lịch (option 2) — tuần "hôm nay" cố định, gridWeekOffset lệch
    // theo số tuần tới do người dùng bấm next (giống useTransferPlan.ts ở trang chính).
    const [gridWeekOffset, setGridWeekOffset] = useState(0);
    const [gridSelectedDayIndex, setGridSelectedDayIndex] = useState<number | null>(null);
    const [gridSelectedMachineId, setGridSelectedMachineId] = useState<string | null>(null);

    const weekStart = useMemo(() => getWeekStart(dayjs()), []);
    const todayIndex = useMemo(() => getTodayScheduleIndex(), []);
    const gridWeekStart = useMemo(
        () => weekStart.add(gridWeekOffset * 7, 'day'),
        [weekStart, gridWeekOffset]
    );
    const shiftGridWeek = (dir: 1 | -1) => {
        setGridWeekOffset((prev) => Math.max(0, prev + dir));
    };

    // Chọn khuôn trước → tra operationType của khuôn đó → chỉ hiện máy tương thích
    // (GET /machines/v1/pickingByOperationType), giống form tạo mới và modal chuyển kế hoạch.
    const deferMold = molds.find((mold) => mold.moldId === deferMoldId);
    const deferOperationTypeId = deferMold?.operationType?.operationTypeId;
    const { machines: compatibleMachines, isLoading: compatibleMachinesLoading } =
        useCompatibleMachines(deferOperationTypeId, open && selected === 2);

    const { machineInfoMap } = useMachineOptions();
    const { weeklyGroups: deferWeeklyGroups, isLoading: deferGridDataLoading } =
        useWeeklyMachineGrid({
            gridWeekStart,
            machines: compatibleMachines,
            machineInfoMap,
            enabled: open && selected === 2 && !!deferMoldId,
        });

    useEffect(() => {
        if (!open) {
            setSelected(null);
            setIncidentReason(undefined);
            setNote('');
            setDeferMoldId(undefined);
            setActualQuantity(null);
            setGridWeekOffset(0);
            setGridSelectedDayIndex(null);
            setGridSelectedMachineId(null);
            return;
        }
        setDeferMoldId(currentMoldId);
    }, [currentMoldId, open]);

    // Đổi khuôn hoặc đổi tuần → tập máy tương thích/lưới đổi theo → bỏ ô đã chọn, tránh gửi
    // nhầm máy không còn hợp lệ với lựa chọn mới.
    useEffect(() => {
        setGridSelectedDayIndex(null);
        setGridSelectedMachineId(null);
    }, [deferMoldId, gridWeekOffset]);

    // Lấy actualQuantity để hiển thị số còn lại khi dời (detail response có, list không).
    useEffect(() => {
        if (!open || !row) return;
        let cancelled = false;

        const fetchDetail = async () => {
            try {
                const detail = await ProductionPlanService.getProductionPlanById(
                    row.productionPlanId
                );
                if (!cancelled) {
                    setActualQuantity(detail.actualQuantity);
                }
            } catch {
                // Không chặn flow — chỉ mất phần hiển thị số đã sản xuất.
            }
        };

        fetchDetail();
        return () => {
            cancelled = true;
        };
    }, [open, row]);

    const remaining = row ? Math.max(row.plannedQuantity - (actualQuantity ?? 0), 0) : 0;
    // Đã sản xuất đủ/thừa số lượng kế hoạch — không còn là "sự cố" nữa, cho đóng thẳng plan
    // thay vì bắt chọn 1 trong 3 phương án + điền incidentReason/note (BE chưa có endpoint
    // complete riêng, xem ProductionPlanService.completeProductionPlan).
    const isFullyProduced = !!row && actualQuantity !== null && actualQuantity >= row.plannedQuantity;
    const noteRequired = isIncidentNoteRequired(incidentReason);

    const canConfirm =
        selected !== null &&
        !!incidentReason &&
        (!noteRequired || note.trim().length > 0) &&
        (selected !== 2 ||
            (gridSelectedDayIndex !== null && !!gridSelectedMachineId && !!deferMoldId));

    const handleConfirm = async () => {
        if (!canConfirm || !row || !incidentReason || selected === null) return;

        try {
            setSubmitting(true);
            const trimmedNote = note.trim() || undefined;

            if (selected === 1) {
                await ProductionPlanService.terminateProductionPlan(row.productionPlanId, {
                    incidentReason,
                    reason: trimmedNote,
                });
                toast.success(
                    t('productionPlan.monitor.incident.successTerminate', { code: row.code })
                );
            } else if (selected === 2) {
                const plannedDate = gridWeekStart
                    .add(gridSelectedDayIndex!, 'day')
                    .format(DATE_FORMAT);

                await ProductionPlanService.deferProductionPlan(row.productionPlanId, {
                    plannedDate,
                    machineId: gridSelectedMachineId!,
                    moldId: deferMoldId!,
                    sequence: APPEND_TO_QUEUE_END,
                    incidentReason,
                    note: trimmedNote,
                });
                toast.success(
                    t('productionPlan.monitor.incident.successDefer', {
                        code: row.code,
                        remaining,
                    })
                );
            } else {
                await ProductionPlanService.pauseProductionPlan(row.productionPlanId, {
                    incidentReason,
                    reason: trimmedNote,
                });
                toast.success(
                    t('productionPlan.monitor.incident.successRepair', { code: row.code })
                );
            }

            onDone();
            onClose();
        } catch (error) {
            handleError(error, {
                fallbackKey: 'productionPlan.transfer.error',
                showServerMessageStatuses: [400],
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteConfirm = async () => {
        if (!row) return;

        try {
            setSubmitting(true);
            await ProductionPlanService.completeProductionPlan(row.productionPlanId);
            toast.success(
                t('productionPlan.monitor.incident.successComplete', { code: row.code })
            );
            onDone();
            onClose();
        } catch (error) {
            handleError(error, {
                fallbackKey: 'productionPlan.transfer.error',
                showServerMessageStatuses: [400],
            });
        } finally {
            setSubmitting(false);
        }
    };

    const optionConfigs = useMemo(
        () => [
            {
                option: 1 as IncidentOption,
                icon: StopOutlined,
                color: token.colorError,
                bg: token.colorErrorBg,
                title: t('productionPlan.monitor.incident.option1Title'),
                useCase: t('productionPlan.monitor.incident.option1UseCase'),
                description: t('productionPlan.monitor.incident.option1Desc'),
            },
            {
                option: 2 as IncidentOption,
                icon: ToolOutlined,
                color: token.colorWarning,
                bg: token.colorWarningBg,
                title: t('productionPlan.monitor.incident.option2Title'),
                useCase: t('productionPlan.monitor.incident.option2UseCase'),
                description: t('productionPlan.monitor.incident.option2Desc'),
            },
            {
                option: 3 as IncidentOption,
                icon: CheckCircleOutlined,
                color: token.colorInfo,
                bg: token.colorInfoBg,
                title: t('productionPlan.monitor.incident.option3Title'),
                useCase: t('productionPlan.monitor.incident.option3UseCase'),
                description: t('productionPlan.monitor.incident.option3Desc'),
            },
        ],
        [t, token]
    );

    if (!row) return null;

    return (
        <Modal
            title={
                <Flex align="center" gap={8}>
                    <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
                    <span>{t('productionPlan.monitor.incident.title')}</span>
                    <Tag color="processing" style={{ margin: 0 }}>
                        {row.code}
                    </Tag>
                </Flex>
            }
            open={open}
            onCancel={onClose}
            onOk={isFullyProduced ? handleCompleteConfirm : handleConfirm}
            okText={
                isFullyProduced
                    ? t('productionPlan.monitor.incident.completeButton')
                    : t('productionPlan.monitor.incident.confirm')
            }
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: isFullyProduced ? false : !canConfirm }}
            confirmLoading={submitting}
            destroyOnHidden
            width={!isFullyProduced && selected === 2 ? 900 : 620}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
                {/* Quantity summary */}
                <Flex gap={16} wrap="wrap" align="center">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.monitor.incident.planQty')}:{' '}
                        <Text strong>{row.plannedQuantity}</Text>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.monitor.incident.produced')}:{' '}
                        <Text strong>{actualQuantity ?? '—'}</Text>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.monitor.incident.remainingQty')}:{' '}
                        <Text
                            strong
                            style={{ color: isFullyProduced ? token.colorSuccess : token.colorWarning }}
                        >
                            {remaining}
                        </Text>
                    </Text>
                    {isFullyProduced && (
                        <Tag color="success" style={{ margin: 0 }}>
                            {t('productionPlan.monitor.incident.readyToCompleteBadge')}
                        </Tag>
                    )}
                </Flex>

                {isFullyProduced ? (
                    <Alert
                        type="success"
                        showIcon
                        message={t('productionPlan.monitor.incident.readyToCompleteTitle')}
                        description={t('productionPlan.monitor.incident.readyToCompleteDesc')}
                    />
                ) : (
                    <>
                {/* Option cards */}
                {optionConfigs.map(({ option, icon: Icon, color, bg, title, useCase, description }) => {
                    const isActive = selected === option;
                    return (
                        <div
                            key={option}
                            onClick={() => setSelected(option)}
                            style={{
                                borderRadius: 10,
                                border: `2px solid ${isActive ? color : token.colorBorderSecondary}`,
                                padding: '12px 14px',
                                cursor: 'pointer',
                                background: isActive ? bg : token.colorBgContainer,
                                transition: 'border-color 0.15s, background 0.15s',
                                userSelect: 'none',
                            }}
                        >
                            <Flex align="center" gap={10}>
                                <Icon style={{ fontSize: 18, color }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text strong style={{ display: 'block' }}>
                                        {title}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {useCase}
                                    </Text>
                                </div>
                            </Flex>
                            {isActive && (
                                <>
                                    <Divider style={{ margin: '10px 0' }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {description}
                                    </Text>
                                    {option === 1 && (
                                        <Alert
                                            type="error"
                                            showIcon
                                            style={{ marginTop: 8 }}
                                            message={t(
                                                'productionPlan.monitor.incident.option1Warning',
                                                { remaining }
                                            )}
                                        />
                                    )}
                                    {option === 2 && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 10,
                                                marginTop: 10,
                                            }}
                                        >
                                            <div>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        display: 'block',
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    {t('productionPlan.monitor.incident.newMold')}
                                                </Text>
                                                <Select
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    placeholder={t(
                                                        'productionPlan.monitor.incident.moldPlaceholder'
                                                    )}
                                                    value={deferMoldId}
                                                    onChange={setDeferMoldId}
                                                    options={moldOptions}
                                                    filterOption={(input, option) =>
                                                        (option?.label ?? '')
                                                            .toLowerCase()
                                                            .includes(input.toLowerCase())
                                                    }
                                                />
                                            </div>

                                            {deferMoldId && (
                                                <MachineDayGridPicker
                                                    gridWeekStart={gridWeekStart}
                                                    gridWeekOffset={gridWeekOffset}
                                                    todayIndex={todayIndex}
                                                    onShiftWeek={shiftGridWeek}
                                                    weeklyGroups={deferWeeklyGroups}
                                                    gridLoading={
                                                        compatibleMachinesLoading || deferGridDataLoading
                                                    }
                                                    selectedDayIndex={gridSelectedDayIndex}
                                                    selectedMachineId={gridSelectedMachineId}
                                                    onSelectCell={(dayIndex, machineId) => {
                                                        setGridSelectedDayIndex(dayIndex);
                                                        setGridSelectedMachineId(machineId);
                                                    }}
                                                    sourceMachineId={row.machineId}
                                                    currentCode={row.code}
                                                    currentMoldCode={row.moldCode}
                                                    currentQty={remaining}
                                                />
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Shared incident reason + note */}
                {selected !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                            <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
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
                            <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                {t('productionPlan.incident.noteLabel')}
                                {noteRequired && <Text type="danger"> *</Text>}
                            </Text>
                            <TextArea
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
                )}
                    </>
                )}
            </div>
        </Modal>
    );
}
