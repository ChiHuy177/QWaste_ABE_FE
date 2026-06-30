'use client';

import { useState } from 'react';
import { Alert, Modal, Select, Tag, theme, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { WEEK_DAY_KEYS } from '../utils/dateUtils';
import { getEffectiveMachine } from '../utils/planUtils';
import { ProductionProduct } from './types';

interface TransferMachineModalProps {
    open: boolean;
    product: ProductionProduct | null;
    todayIndex: number;
    machineOptions: string[];
    onCancel: () => void;
    onConfirm: (newMachine: string) => void;
}

const { Text } = Typography;

export default function TransferMachineModal({
    open,
    product,
    todayIndex,
    machineOptions,
    onCancel,
    onConfirm,
}: TransferMachineModalProps) {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [newMachine, setNewMachine] = useState<string | undefined>(undefined);

    const currentMachine = product ? getEffectiveMachine(product, todayIndex) : '';
    const dayLabel = t(`productionPlan.days.full.${WEEK_DAY_KEYS[todayIndex]}`);
    const isDuplicate = newMachine === currentMachine;
    const canConfirm = !!newMachine && !isDuplicate;

    const handleConfirm = () => {
        if (!newMachine || !canConfirm) return;
        onConfirm(newMachine);
        setNewMachine(undefined);
    };

    const handleCancel = () => {
        setNewMachine(undefined);
        onCancel();
    };

    const selectOptions = machineOptions
        .filter((m) => m !== currentMachine)
        .map((m) => ({ label: m, value: m }));

    return (
        <Modal
            title={t('productionPlan.transferMachine.title', { code: product?.code ?? '' })}
            open={open}
            onOk={handleConfirm}
            onCancel={handleCancel}
            okText={t('productionPlan.actions.transfer')}
            cancelText={t('common.cancel')}
            okButtonProps={{ disabled: !canConfirm }}
            destroyOnHidden
            width={420}
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
                            <Tag color="default" style={{ fontWeight: 600 }}>{currentMachine}</Tag>
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
                        value={newMachine}
                        onChange={setNewMachine}
                        options={selectOptions}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={t('productionPlan.transferMachine.machineNotFound')}
                    />
                    {isDuplicate && (
                        <Alert
                            type="warning"
                            title={t('productionPlan.transferMachine.duplicateMachine')}
                            style={{ marginTop: 8 }}
                            showIcon
                        />
                    )}
                </div>

                <Alert
                    type="info"
                    showIcon
                    title={t('productionPlan.transferMachine.applyOnlySelectedDay', {
                        day: dayLabel,
                    })}
                />
            </div>
        </Modal>
    );
}
