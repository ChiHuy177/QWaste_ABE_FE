'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Divider, Flex, Input, Modal, Tag, Typography, message, theme } from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    StopOutlined,
    ToolOutlined,
    WifiOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ProductionLine } from './types';
import TransferScheduleModal from './TransferScheduleModal';
import { MonitorProduct } from '@/types';
import { getTodayScheduleIndex, WEEK_DAY_KEYS } from '../_utils/dateUtils';

const { Text } = Typography;
const { TextArea } = Input;

// TODO: replace with real data from API (planQuantity, calculatedPcs) when backend is ready
const MOCK_PLAN_QTY = 800;
const MOCK_CALCULATED_PCS = 312;

type IncidentOption = 1 | 2 | 3;

interface Opt2State {
    transferDayIndex: number | null;
    transferMachine: string;
    newMold: string;
    reason: string;
}

interface Props {
    product: MonitorProduct | null;
    open: boolean;
    machineOptions: string[];
    lines: ProductionLine[];
    onClose: () => void;
}

const OPT2_INITIAL: Opt2State = {
    transferDayIndex: null,
    transferMachine: '',
    newMold: '',
    reason: '',
};

export default function IncidentConfirmModal({
    product,
    open,
    machineOptions,
    lines,
    onClose,
}: Props) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const [messageApi, contextHolder] = message.useMessage();

    const [selected, setSelected] = useState<IncidentOption | null>(null);
    const [opt2, setOpt2] = useState<Opt2State>(OPT2_INITIAL);
    const [opt3Reason, setOpt3Reason] = useState('');
    const [transferOpen, setTransferOpen] = useState(false);

    const todayIndex = useMemo(() => getTodayScheduleIndex(new Date()), []);
    const dayLabels = useMemo(
        () => WEEK_DAY_KEYS.map((key) => t(`productionPlan.days.full.${key}`)),
        [t]
    );

    const remaining = MOCK_PLAN_QTY - MOCK_CALCULATED_PCS;

    const canConfirm =
        selected !== null &&
        (selected !== 2 ||
            (opt2.transferDayIndex !== null &&
                !!opt2.transferMachine &&
                !!opt2.newMold &&
                !!opt2.reason));

    const handleClose = () => {
        setSelected(null);
        setOpt2(OPT2_INITIAL);
        setOpt3Reason('');
        setTransferOpen(false);
        onClose();
    };

    const handleConfirm = () => {
        if (!canConfirm || !product) return;
        if (selected === 1) {
            messageApi.success(
                t('productionPlan.monitor.incident.successTerminate', { code: product.code })
            );
        } else if (selected === 2) {
            messageApi.success(
                t('productionPlan.monitor.incident.successDefer', {
                    code: product.code,
                    remaining,
                })
            );
        } else {
            messageApi.success(
                t('productionPlan.monitor.incident.successRepair', { code: product.code })
            );
        }
        handleClose();
    };

    const handleTransferConfirm = (newDayIndex: number, newMachine: string) => {
        setOpt2((p) => ({ ...p, transferDayIndex: newDayIndex, transferMachine: newMachine }));
        setTransferOpen(false);
    };

    const OPT_COLOR: Record<IncidentOption, string> = {
        1: token.colorError,
        2: token.colorWarning,
        3: token.colorInfo,
    };
    const OPT_BG: Record<IncidentOption, string> = {
        1: token.colorErrorBg,
        2: token.colorWarningBg,
        3: token.colorInfoBg,
    };
    const OPT_BORDER: Record<IncidentOption, string> = {
        1: token.colorErrorBorder,
        2: token.colorWarningBorder,
        3: token.colorInfoBorder,
    };

    const isOpt = (n: IncidentOption) => selected === n;

    const cardStyle = (n: IncidentOption): React.CSSProperties => ({
        borderRadius: 10,
        border: `2px solid ${isOpt(n) ? OPT_COLOR[n] : token.colorBorderSecondary}`,
        padding: '14px 16px',
        cursor: 'pointer',
        background: isOpt(n) ? OPT_BG[n] : token.colorBgContainer,
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
    });

    const radioStyle = (n: IncidentOption): React.CSSProperties => ({
        width: 18,
        height: 18,
        minWidth: 18,
        borderRadius: '50%',
        border: `2px solid ${isOpt(n) ? OPT_COLOR[n] : token.colorBorder}`,
        background: isOpt(n) ? OPT_COLOR[n] : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 3,
    });

    const summaryBox: React.CSSProperties = {
        padding: '10px 12px',
        borderRadius: 8,
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: 12,
    };

    const summaryRow = (isLast = false): React.CSSProperties => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        marginBottom: isLast ? 0 : 4,
        paddingTop: isLast ? 8 : 0,
        borderTop: isLast ? `1px dashed ${token.colorBorderSecondary}` : undefined,
        fontWeight: isLast ? 700 : 400,
    });

    const fieldLabel = (label: string, required?: boolean) => (
        <label
            style={{
                fontSize: 12,
                fontWeight: 600,
                color: token.colorTextSecondary,
                display: 'block',
                marginBottom: 4,
            }}
        >
            {label}
            {required && <span style={{ color: token.colorError }}> *</span>}
        </label>
    );

    if (!product) return null;

    return (
        <>
            {contextHolder}
            <Modal
                open={open}
                onCancel={handleClose}
                destroyOnHidden
                width={860}
                styles={{ body: { padding: '12px 24px 16px' } }}
                title={
                    <Flex align="center" gap={10}>
                        <ExclamationCircleOutlined
                            style={{ color: token.colorWarning, fontSize: 20, flexShrink: 0 }}
                        />
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
                                {t('productionPlan.monitor.incident.title')} — {product.code}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 400,
                                    color: token.colorTextSecondary,
                                    marginTop: 1,
                                }}
                            >
                                {t('productionPlan.monitor.incident.subtitle', {
                                    machine: product.machine,
                                    name: product.name,
                                })}
                            </div>
                        </div>
                    </Flex>
                }
                footer={
                    <Flex align="center" justify="space-between" gap={8}>
                        <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>
                            {selected
                                ? selected === 2
                                    ? t('productionPlan.monitor.incident.hintOpt2', { remaining })
                                    : t(`productionPlan.monitor.incident.hintOpt${selected}`)
                                : t('productionPlan.monitor.incident.selectHint')}
                        </Text>
                        <Flex gap={8}>
                            <Button onClick={handleClose}>{t('common.cancel')}</Button>
                            <Button
                                type="primary"
                                disabled={!canConfirm}
                                onClick={handleConfirm}
                                danger={selected === 1}
                                style={
                                    selected === 2
                                        ? {
                                            background: token.colorWarning,
                                            borderColor: token.colorWarning,
                                        }
                                        : undefined
                                }
                            >
                                {t('productionPlan.monitor.incident.confirm')}
                            </Button>
                        </Flex>
                    </Flex>
                }
            >
                <Flex vertical gap={8}>
                    <Alert
                        type="warning"
                        showIcon
                        message={t('productionPlan.monitor.incident.alert')}
                    />

                    {/* ── Option 1: Terminate ── */}
                    <div style={cardStyle(1)} onClick={() => setSelected(1)}>
                        <Flex gap={12} align="flex-start">
                            <div style={radioStyle(1)}>
                                {isOpt(1) && (
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#fff',
                                        }}
                                    />
                                )}
                            </div>
                            <StopOutlined
                                style={{
                                    fontSize: 22,
                                    color: isOpt(1) ? token.colorError : token.colorTextQuaternary,
                                    marginTop: 2,
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: isOpt(1) ? token.colorError : token.colorText,
                                        marginBottom: 2,
                                    }}
                                >
                                    ① {t('productionPlan.monitor.incident.option1Title')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextSecondary,
                                        fontStyle: 'italic',
                                        marginBottom: 4,
                                    }}
                                >
                                    {t('productionPlan.monitor.incident.option1UseCase')}
                                </div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('productionPlan.monitor.incident.option1Desc')}
                                </Text>

                                {isOpt(1) && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <Alert
                                            type="error"
                                            showIcon
                                            message={t(
                                                'productionPlan.monitor.incident.option1Warning',
                                                { remaining }
                                            )}
                                            style={{ marginBottom: 12 }}
                                        />
                                        <div style={summaryBox}>
                                            <div style={summaryRow()}>
                                                <Text type="secondary">
                                                    {t('productionPlan.monitor.incident.planQty')}
                                                </Text>
                                                <Text strong>
                                                    {MOCK_PLAN_QTY.toLocaleString('vi-VN')}{' '}
                                                    {t('productionPlan.monitor.detail.pcs')}
                                                </Text>
                                            </div>
                                            <div style={summaryRow()}>
                                                <Text type="secondary">
                                                    {t('productionPlan.monitor.incident.produced')}
                                                </Text>
                                                <Text strong style={{ color: token.colorSuccess }}>
                                                    {MOCK_CALCULATED_PCS.toLocaleString('vi-VN')}{' '}
                                                    {t('productionPlan.monitor.detail.pcs')}
                                                </Text>
                                            </div>
                                            <div style={summaryRow(true)}>
                                                <Text style={{ color: token.colorError }}>
                                                    {t('productionPlan.monitor.incident.willSkip')}
                                                </Text>
                                                <Text
                                                    strong
                                                    style={{
                                                        color: token.colorError,
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {remaining.toLocaleString('vi-VN')}{' '}
                                                    {t('productionPlan.monitor.detail.pcs')}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Flex>
                    </div>

                    {/* ── Option 2: Defer ── */}
                    <div style={cardStyle(2)} onClick={() => setSelected(2)}>
                        <Flex gap={12} align="flex-start">
                            <div style={radioStyle(2)}>
                                {isOpt(2) && (
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#fff',
                                        }}
                                    />
                                )}
                            </div>
                            <CalendarOutlined
                                style={{
                                    fontSize: 22,
                                    color: isOpt(2)
                                        ? token.colorWarning
                                        : token.colorTextQuaternary,
                                    marginTop: 2,
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: isOpt(2) ? token.colorWarning : token.colorText,
                                        marginBottom: 2,
                                    }}
                                >
                                    ② {t('productionPlan.monitor.incident.option2Title')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextSecondary,
                                        fontStyle: 'italic',
                                        marginBottom: 4,
                                    }}
                                >
                                    {t('productionPlan.monitor.incident.option2UseCase')}
                                </div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('productionPlan.monitor.incident.option2Desc')}
                                </Text>

                                {isOpt(2) && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Divider style={{ margin: '12px 0' }} />

                                        {/* Remaining summary */}
                                        <div style={summaryBox}>
                                            <div style={summaryRow()}>
                                                <Text type="secondary">
                                                    {t('productionPlan.monitor.incident.planQty')}
                                                </Text>
                                                <Text strong>
                                                    {MOCK_PLAN_QTY.toLocaleString('vi-VN')}{' '}
                                                    {t('productionPlan.monitor.detail.pcs')}
                                                </Text>
                                            </div>
                                            <div style={summaryRow()}>
                                                <Text type="secondary">
                                                    {t('productionPlan.monitor.incident.produced')}
                                                </Text>
                                                <Text strong style={{ color: token.colorSuccess }}>
                                                    {MOCK_CALCULATED_PCS.toLocaleString('vi-VN')}{' '}
                                                    {t('productionPlan.monitor.detail.pcs')}
                                                </Text>
                                            </div>
                                            <div style={summaryRow(true)}>
                                                <Text style={{ color: token.colorWarning }}>
                                                    {t(
                                                        'productionPlan.monitor.incident.remainingQty'
                                                    )}
                                                </Text>
                                                <Text
                                                    strong
                                                    style={{
                                                        color: token.colorWarning,
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {remaining.toLocaleString('vi-VN')}{' '}
                                                    {t('productionPlan.monitor.detail.pcs')}
                                                </Text>
                                            </div>
                                        </div>

                                        {/* Transfer schedule picker */}
                                        <div style={{ marginBottom: 10 }}>
                                            {fieldLabel(
                                                t('productionPlan.actions.transferSchedule'),
                                                true
                                            )}
                                            {opt2.transferDayIndex === null ? (
                                                <Button
                                                    icon={<CalendarOutlined />}
                                                    onClick={() => setTransferOpen(true)}
                                                    block
                                                    style={{ height: 40 }}
                                                >
                                                    {t('productionPlan.actions.transferSchedule')}
                                                </Button>
                                            ) : (
                                                <Flex
                                                    align="center"
                                                    justify="space-between"
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 8,
                                                        border: `1px solid ${token.colorSuccessBorder}`,
                                                        background: token.colorSuccessBg,
                                                    }}
                                                >
                                                    <Flex gap={8} align="center">
                                                        <CheckCircleOutlined
                                                            style={{ color: token.colorSuccess }}
                                                        />
                                                        <Text style={{ fontSize: 13 }}>
                                                            <strong>
                                                                {dayLabels[opt2.transferDayIndex]}
                                                            </strong>
                                                            {' — '}
                                                            <Tag style={{ marginLeft: 2 }}>
                                                                {opt2.transferMachine}
                                                            </Tag>
                                                        </Text>
                                                    </Flex>
                                                    <Button
                                                        size="small"
                                                        onClick={() => setTransferOpen(true)}
                                                    >
                                                        {t('common.edit')}
                                                    </Button>
                                                </Flex>
                                            )}
                                        </div>

                                        {/* Mold */}
                                        <div style={{ marginBottom: 10 }}>
                                            {fieldLabel(
                                                t('productionPlan.monitor.incident.newMold'),
                                                true
                                            )}
                                            <Input
                                                placeholder={t(
                                                    'productionPlan.monitor.incident.moldPlaceholder'
                                                )}
                                                value={opt2.newMold}
                                                onChange={(e) =>
                                                    setOpt2((p) => ({
                                                        ...p,
                                                        newMold: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        {/* Reason */}
                                        <div>
                                            {fieldLabel(
                                                t('productionPlan.monitor.incident.deferReason'),
                                                true
                                            )}
                                            <TextArea
                                                rows={3}
                                                placeholder={t(
                                                    'productionPlan.monitor.incident.deferReasonPh'
                                                )}
                                                value={opt2.reason}
                                                onChange={(e) =>
                                                    setOpt2((p) => ({
                                                        ...p,
                                                        reason: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Flex>
                    </div>

                    {/* ── Option 3: Temp Pause ── */}
                    <div style={cardStyle(3)} onClick={() => setSelected(3)}>
                        <Flex gap={12} align="flex-start">
                            <div style={radioStyle(3)}>
                                {isOpt(3) && (
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#fff',
                                        }}
                                    />
                                )}
                            </div>
                            <ToolOutlined
                                style={{
                                    fontSize: 22,
                                    color: isOpt(3) ? token.colorInfo : token.colorTextQuaternary,
                                    marginTop: 2,
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: isOpt(3) ? token.colorInfo : token.colorText,
                                        marginBottom: 2,
                                    }}
                                >
                                    ③ {t('productionPlan.monitor.incident.option3Title')}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: token.colorTextSecondary,
                                        fontStyle: 'italic',
                                        marginBottom: 4,
                                    }}
                                >
                                    {t('productionPlan.monitor.incident.option3UseCase')}
                                </div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {t('productionPlan.monitor.incident.option3Desc')}
                                </Text>

                                {isOpt(3) && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <Alert
                                            type="info"
                                            showIcon
                                            icon={<WifiOutlined />}
                                            message={t(
                                                'productionPlan.monitor.incident.option3AutoResume'
                                            )}
                                            style={{ marginBottom: 12 }}
                                        />
                                        {fieldLabel(
                                            t('productionPlan.monitor.incident.pauseReason')
                                        )}
                                        <Input
                                            placeholder={t(
                                                'productionPlan.monitor.incident.pauseReasonPh'
                                            )}
                                            value={opt3Reason}
                                            onChange={(e) => setOpt3Reason(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </Flex>
                    </div>
                </Flex>
            </Modal>

            <TransferScheduleModal
                open={transferOpen}
                product={product}
                todayIndex={todayIndex}
                machineOptions={machineOptions}
                lines={lines}
                onCancel={() => setTransferOpen(false)}
                onConfirm={handleTransferConfirm}
            />
        </>
    );
}
