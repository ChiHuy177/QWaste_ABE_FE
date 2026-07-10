'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    DatePicker,
    Divider,
    Flex,
    Input,
    Modal,
    Select,
    Tag,
    Typography,
    theme,
} from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    StopOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { IncidentReason } from '@/types/ProductionPlan';
import { MonitorRowVM, SelectOptionVM } from './types';
import { getIncidentReasonOptions, isIncidentNoteRequired } from '../_utils/incidentOptions';

const { Text } = Typography;
const { TextArea } = Input;

const DATE_FORMAT = 'YYYY-MM-DD';

type IncidentOption = 1 | 2 | 3; // 1 = terminate, 2 = defer, 3 = temp pause

interface Props {
    open: boolean;
    row: MonitorRowVM | null;
    machineOptions: SelectOptionVM[];
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
    machineOptions,
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
    const [deferDate, setDeferDate] = useState<Dayjs | null>(null);
    const [deferMachineId, setDeferMachineId] = useState<string | undefined>(undefined);
    const [deferMoldId, setDeferMoldId] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);
    const [actualQuantity, setActualQuantity] = useState<number | null>(null);

    useEffect(() => {
        if (!open) {
            setSelected(null);
            setIncidentReason(undefined);
            setNote('');
            setDeferDate(null);
            setDeferMachineId(undefined);
            setDeferMoldId(undefined);
            setActualQuantity(null);
            return;
        }
        setDeferMoldId(currentMoldId);
    }, [currentMoldId, open]);

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
    const noteRequired = isIncidentNoteRequired(incidentReason);

    const canConfirm =
        selected !== null &&
        !!incidentReason &&
        (!noteRequired || note.trim().length > 0) &&
        (selected !== 2 || (!!deferDate && !!deferMachineId && !!deferMoldId));

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
                const plannedDate = deferDate!.format(DATE_FORMAT);
                // Sequence = cuối hàng đợi của máy đích ngày đích.
                const page = await ProductionPlanService.getDailyProductionPlans({
                    date: plannedDate,
                    size: 100,
                });
                const targetGroup = page.content.find(
                    (group) => group.machineId === deferMachineId
                );
                const sequence =
                    (targetGroup?.productionPlans.filter((plan) => !plan.isDeleted).length ?? 0) +
                    1;

                await ProductionPlanService.deferProductionPlan(row.productionPlanId, {
                    plannedDate,
                    machineId: deferMachineId!,
                    moldId: deferMoldId!,
                    sequence,
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
            handleError(error, { fallbackKey: 'productionPlan.transfer.error' });
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
            onOk={handleConfirm}
            okText={t('productionPlan.monitor.incident.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            confirmLoading={submitting}
            destroyOnHidden
            width={620}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>
                {/* Quantity summary */}
                <Flex gap={16} wrap="wrap">
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
                        <Text strong style={{ color: token.colorWarning }}>
                            {remaining}
                        </Text>
                    </Text>
                </Flex>

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
                                                'productionPlan.monitor.incident.option1Warning'
                                            )}
                                        />
                                    )}
                                    {option === 2 && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 8,
                                                marginTop: 10,
                                            }}
                                        >
                                            <Flex gap={8} wrap="wrap">
                                                <div style={{ flex: '1 1 160px' }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            display: 'block',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        {t(
                                                            'productionPlan.monitor.incident.newDate'
                                                        )}
                                                    </Text>
                                                    <DatePicker
                                                        style={{ width: '100%' }}
                                                        format="DD/MM/YYYY"
                                                        value={deferDate}
                                                        onChange={setDeferDate}
                                                        disabledDate={(date) =>
                                                            date.isBefore(dayjs(), 'day')
                                                        }
                                                    />
                                                </div>
                                                <div style={{ flex: '1 1 200px' }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            display: 'block',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        {t(
                                                            'productionPlan.monitor.incident.newMachine'
                                                        )}
                                                    </Text>
                                                    <Select
                                                        style={{ width: '100%' }}
                                                        showSearch
                                                        placeholder={t(
                                                            'productionPlan.transferMachine.newMachinePlaceholder'
                                                        )}
                                                        value={deferMachineId}
                                                        onChange={setDeferMachineId}
                                                        options={machineOptions}
                                                        filterOption={(input, option) =>
                                                            (option?.label ?? '')
                                                                .toLowerCase()
                                                                .includes(input.toLowerCase())
                                                        }
                                                    />
                                                </div>
                                            </Flex>
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
            </div>
        </Modal>
    );
}
