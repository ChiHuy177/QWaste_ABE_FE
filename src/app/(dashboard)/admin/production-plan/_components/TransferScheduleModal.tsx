'use client';

import { useState } from 'react';
import { Alert, Modal, Select, Tag, theme, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { WEEK_DAY_KEYS } from '../utils/dateUtils';
import { getEffectiveMachine } from '../utils/planUtils';
import { ProductionProduct } from './types';

interface TransferScheduleModalProps {
    open: boolean;
    product: ProductionProduct | null;
    todayIndex: number;
    machineOptions: string[];
    onCancel: () => void;
    onConfirm: (newDayIndex: number, newMachine: string) => void;
}

const { Text } = Typography;

export default function TransferScheduleModal({
    open,
    product,
    todayIndex,
    machineOptions,
    onCancel,
    onConfirm,
}: TransferScheduleModalProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [newDayIndex, setNewDayIndex] = useState<number | undefined>(undefined);
    const [newMachine, setNewMachine] = useState<string | undefined>(undefined);

    const currentMachine = product ? getEffectiveMachine(product, todayIndex) : '';
    const currentQty = product?.schedule[todayIndex] ?? 0;
    const existingQtyOnTarget = newDayIndex !== undefined ? (product?.schedule[newDayIndex] ?? 0) : 0;
    const resultQty = existingQtyOnTarget + currentQty;

    const hasNoQty = currentQty === 0;
    const canConfirm = !hasNoQty && newDayIndex !== undefined && !!newMachine;

    const handleConfirm = () => {
        if (!canConfirm || newDayIndex === undefined || !newMachine) return;
        onConfirm(newDayIndex, newMachine);
        setNewDayIndex(undefined);
        setNewMachine(undefined);
    };

    const handleCancel = () => {
        setNewDayIndex(undefined);
        setNewMachine(undefined);
        onCancel();
    };

    const dayLabels = WEEK_DAY_KEYS.map((dayKey) => t(`productionPlan.days.full.${dayKey}`));
    const dayOptions = dayLabels
        .map((day, index) => ({ label: day, value: index }))
        .filter((opt) => opt.value !== todayIndex);

    const machineSelectOptions = machineOptions.map((m) => ({ label: m, value: m }));

    return (
        <Modal
            title={t('productionPlan.transferSchedule.title', { code: product?.code ?? '' })}
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText={t('productionPlan.actions.transferSchedule')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            destroyOnHidden
            width={460}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                {hasNoQty && (
                    <Alert
                        type="warning"
                        showIcon
                        message={t('productionPlan.transferSchedule.noQuantityToday')}
                    />
                )}

                <div
                    style={{
                        padding: '12px 14px',
                        background: token.colorFillAlter,
                        borderRadius: 8,
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        {t('productionPlan.transferSchedule.from')}
                    </Text>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('productionPlan.transferSchedule.day')}
                            </Text>
                            <div style={{ fontWeight: 600 }}>{dayLabels[todayIndex]}</div>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('productionPlan.table.headers.machine')}
                            </Text>
                            <div style={{ marginTop: 2 }}>
                                <Tag color="default" style={{ fontWeight: 600 }}>{currentMachine}</Tag>
                            </div>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('productionPlan.transferSchedule.caseQuantity')}
                            </Text>
                            <div style={{ fontWeight: 700, color: token.colorText }}>{currentQty}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('productionPlan.transferSchedule.to')}
                    </Text>

                    <div>
                        <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                            {t('productionPlan.transferSchedule.newDay')}
                        </Text>
                        <Select
                            style={{ width: '100%' }}
                            placeholder={t('productionPlan.transferSchedule.newDayPlaceholder')}
                            value={newDayIndex}
                            onChange={setNewDayIndex}
                            options={dayOptions}
                        />
                    </div>

                    <div>
                        <Text style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                            {t('productionPlan.transferSchedule.newMachine')}
                        </Text>
                        <Select
                            style={{ width: '100%' }}
                            placeholder={t('productionPlan.transferSchedule.newMachinePlaceholder')}
                            showSearch
                            value={newMachine}
                            onChange={setNewMachine}
                            options={machineSelectOptions}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            notFoundContent={t('productionPlan.transferMachine.machineNotFound')}
                        />
                    </div>
                </div>

                {canConfirm && newDayIndex !== undefined && newMachine && (
                    <div
                        style={{
                            padding: '10px 14px',
                            background: token.colorPrimaryBg,
                            borderRadius: 8,
                            border: `1px solid ${token.colorPrimaryBorder}`,
                        }}
                    >
                        <Text style={{ fontSize: 13 }}>
                            <strong>
                                {t('productionPlan.transferSchedule.caseCount', {
                                    count: currentQty,
                                })}
                            </strong>{' '}
                            {t('productionPlan.transferSchedule.from').toLowerCase()}{' '}
                            {dayLabels[todayIndex]} ({currentMachine})
                            {' -> '}
                            <strong>{dayLabels[newDayIndex]}</strong> / <strong>{newMachine}</strong>
                        </Text>
                        {existingQtyOnTarget > 0 && (
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginTop: 8 }}
                                message={
                                    <span>
                                        {t('productionPlan.transferSchedule.targetAlreadyHasPrefix')}{' '}
                                        <strong>{existingQtyOnTarget}</strong>{' '}
                                        {t('productionPlan.units.cases')},{' '}
                                        {t('productionPlan.transferSchedule.targetAlreadyHasMiddle')}{' '}
                                        <strong>{resultQty}</strong>{' '}
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
