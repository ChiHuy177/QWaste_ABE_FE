'use client';

import { useEffect, useState } from 'react';
import { Alert, Input, Modal, Select, Tag, theme, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { IncidentReason } from '@/types/ProductionPlan';
import { PlanRowTarget, SelectOptionVM } from './types';
import { WEEK_DAY_KEYS } from '../_utils/dateUtils';
import { getIncidentReasonOptions, isIncidentNoteRequired } from '../_utils/incidentOptions';

export interface TransferMachinePayload {
    machineId: string;
    incidentReason: IncidentReason;
    note?: string;
}

interface TransferMachineModalProps {
    open: boolean;
    target: PlanRowTarget | null;
    todayIndex: number;
    /** value = machineId */
    machineOptions: SelectOptionVM[];
    submitting?: boolean;
    onCancel: () => void;
    onConfirm: (payload: TransferMachinePayload) => void;
}

const { Text } = Typography;

// Đổi máy = BE incident defer (tạo child plan cùng ngày, máy mới) nên cần lý do sự cố.
export default function TransferMachineModal({
    open,
    target,
    todayIndex,
    machineOptions,
    submitting,
    onCancel,
    onConfirm,
}: TransferMachineModalProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [newMachineId, setNewMachineId] = useState<string | undefined>(undefined);
    const [incidentReason, setIncidentReason] = useState<IncidentReason | undefined>(undefined);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (!open) {
            setNewMachineId(undefined);
            setIncidentReason(undefined);
            setNote('');
        }
    }, [open]);

    const currentMachineCode = target?.machineCode ?? '';
    const dayLabel = t(`productionPlan.days.full.${WEEK_DAY_KEYS[todayIndex]}`);
    const noteRequired = isIncidentNoteRequired(incidentReason);
    const canConfirm =
        !!newMachineId && !!incidentReason && (!noteRequired || note.trim().length > 0);

    const handleConfirm = () => {
        if (!canConfirm || !newMachineId || !incidentReason) return;
        onConfirm({ machineId: newMachineId, incidentReason, note: note.trim() || undefined });
    };

    const selectOptions = machineOptions.filter((option) => option.value !== target?.machineId);

    return (
        <Modal
            title={t('productionPlan.transferMachine.title', { code: target?.row.code ?? '' })}
            open={open}
            onOk={handleConfirm}
            onCancel={onCancel}
            okText={t('productionPlan.actions.transfer')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            confirmLoading={submitting}
            destroyOnHidden
            width={440}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                <div
                    style={{
                        padding: '12px 14px',
                        background: token.colorFillAlter,
                        borderRadius: 8,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                    }}
                >
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('productionPlan.transferMachine.applyDate')}
                        </Text>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>{dayLabel}</div>
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('productionPlan.transferMachine.currentMachine')}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                            <Tag color="default" style={{ fontWeight: 600 }}>
                                {currentMachineCode}
                            </Tag>
                        </div>
                    </div>
                </div>

                <div>
                    <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                        {t('productionPlan.transferMachine.newMachine')}
                    </Text>
                    <Select
                        style={{ width: '100%' }}
                        placeholder={t('productionPlan.transferMachine.newMachinePlaceholder')}
                        showSearch
                        value={newMachineId}
                        onChange={setNewMachineId}
                        options={selectOptions}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={t('productionPlan.transferMachine.machineNotFound')}
                    />
                </div>

                <div>
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

                <div>
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

                <Alert
                    type="info"
                    showIcon
                    message={t('productionPlan.transferMachine.applyOnlySelectedDay', {
                        day: dayLabel,
                    })}
                />
            </div>
        </Modal>
    );
}
