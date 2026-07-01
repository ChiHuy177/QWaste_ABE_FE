'use client';

import { type CSSProperties, useCallback, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Flex,
    Input,
    Modal,
    Row,
    Segmented,
    Tag,
    Typography,
    theme,
} from 'antd';
import {
    ApartmentOutlined,
    AppstoreOutlined,
    CalendarOutlined,
    InboxOutlined,
    LeftOutlined,
    PlusOutlined,
    RightOutlined,
    SearchOutlined,
    TableOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import DailyTable from './_components/DailyTable';
import ImportModal from './_components/ImportModal';
import WeeklyTable from './_components/WeeklyTable';
import PlanFormModal from './_components/PlanFormModal';
import TransferMachineModal from './_components/TransferMachineModal';
import TransferScheduleModal from './_components/TransferScheduleModal';
import {
    formatDailyLabel,
    formatWeeklyLabel,
    getTodayScheduleIndex,
    WEEK_DAY_KEYS,
} from './utils/dateUtils';
import { initialProductionPlan } from './utils/mockData';
import {
    PlanModalState,
    ProductionLine,
    ProductionProduct,
    ProductPosition,
    TransferMachineModalState,
    TransferScheduleModalState,
} from './_components/types';
import { getAllMachineNames, getEffectiveMachine } from './utils/planUtils';
import styles from './_components/ProductionPlanTable.module.css';
import { useTranslation } from 'react-i18next';

type ActiveView = 'daily' | 'weekly';

const { Text } = Typography;

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const moveArrayItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);

    return nextItems;
};

export default function ProductionPlanPage() {
    const { token } = theme.useToken();
    const { t } = useTranslation();

    usePageTitle(t('productionPlan.title'));

    const [activeView, setActiveView] = useState<ActiveView>('daily');
    const [lines, setLines] = useState<ProductionLine[]>(initialProductionPlan);
    const [modalState, setModalState] = useState<PlanModalState>({ open: false });
    const [deleteState, setDeleteState] = useState<ProductPosition | null>(null);
    const [transferMachineState, setTransferMachineState] = useState<TransferMachineModalState>({ open: false });
    const [transferScheduleState, setTransferScheduleState] = useState<TransferScheduleModalState>({ open: false });
    const [machineFilter, setMachineFilter] = useState('');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
    const [importModalOpen, setImportModalOpen] = useState(false);

    const selectedDateValue = useMemo(() => selectedDate.toDate(), [selectedDate]);
    const todayIndex = useMemo(() => getTodayScheduleIndex(selectedDateValue), [selectedDateValue]);
    const fullWeekDays = useMemo(
        () => WEEK_DAY_KEYS.map((dayKey) => t(`productionPlan.days.full.${dayKey}`)),
        [t]
    );
    const headerLabel =
        activeView === 'daily'
            ? formatDailyLabel(selectedDateValue, fullWeekDays)
            : formatWeeklyLabel(selectedDateValue, t('productionPlan.days.week'));

    const selectedProduct = useMemo(() => {
        if (!modalState.open || modalState.mode !== 'edit' || modalState.productIndex == null) {
            return undefined;
        }

        return lines[modalState.lineIndex]?.products[modalState.productIndex];
    }, [lines, modalState]);

    const allMachineNames = useMemo(() => getAllMachineNames(lines), [lines]);

    const transferMachineProduct = useMemo(() => {
        if (!transferMachineState.open) return null;
        return lines[transferMachineState.lineIndex]?.products[transferMachineState.productIndex] ?? null;
    }, [lines, transferMachineState]);

    const transferScheduleProduct = useMemo(() => {
        if (!transferScheduleState.open) return null;
        return lines[transferScheduleState.lineIndex]?.products[transferScheduleState.productIndex] ?? null;
    }, [lines, transferScheduleState]);

    const summary = useMemo(() => {
        const normalizedMachineFilter = machineFilter.trim().toLowerCase();
        const visibleLines = lines
            .map((line) => ({
                ...line,
                products: line.products.filter(
                    (product) =>
                        !normalizedMachineFilter ||
                        getEffectiveMachine(product, todayIndex)
                            .toLowerCase()
                            .includes(normalizedMachineFilter)
                ),
            }))
            .filter((line) => line.products.length > 0);

        const totalProducts = visibleLines.reduce((sum, line) => sum + line.products.length, 0);
        const dailyCases = visibleLines.reduce(
            (sum, line) =>
                sum +
                line.products.reduce(
                    (lineSum, product) => lineSum + product.schedule[todayIndex],
                    0
                ),
            0
        );
        const weeklyCases = visibleLines.reduce(
            (sum, line) =>
                sum +
                line.products.reduce(
                    (lineSum, product) =>
                        lineSum + product.schedule.reduce((daySum, quantity) => daySum + quantity, 0),
                    0
                ),
            0
        );

        return { totalLines: visibleLines.length, totalProducts, dailyCases, weeklyCases };
    }, [lines, machineFilter, todayIndex]);

    const summaryCards = useMemo(
        () => [
            {
                label: t('productionPlan.summary.lines'),
                value: summary.totalLines,
                icon: ApartmentOutlined,
                borderColor: token.colorPrimary,
                backgroundColor: token.colorInfoBg,
            },
            {
                label: t('productionPlan.summary.products'),
                value: summary.totalProducts,
                icon: AppstoreOutlined,
                borderColor: token.colorSuccess,
                backgroundColor: token.colorSuccessBg,
            },
            {
                label: t('productionPlan.summary.dailyCases'),
                value: summary.dailyCases,
                icon: InboxOutlined,
                borderColor: token.colorWarning,
                backgroundColor: token.colorWarningBg,
            },
            {
                label: t('productionPlan.summary.weeklyCases'),
                value: summary.weeklyCases,
                icon: CalendarOutlined,
                borderColor: token.colorInfo,
                backgroundColor: token.colorPrimaryBg,
            },
        ],
        [summary, t, token]
    );

    const planThemeVars = useMemo(
        () =>
            ({
                '--plan-color-primary': token.colorPrimary,
                '--plan-color-bg-container': token.colorBgContainer,
                '--plan-color-bg-muted': token.colorBgLayout,
                '--plan-color-border': token.colorBorder,
                '--plan-color-text': token.colorText,
                '--plan-color-text-secondary': token.colorTextSecondary,
                '--plan-color-text-tertiary': token.colorTextTertiary,
            }) as CSSProperties,
        [
            token.colorBgContainer,
            token.colorBgLayout,
            token.colorBorder,
            token.colorPrimary,
            token.colorText,
            token.colorTextSecondary,
            token.colorTextTertiary,
        ]
    );

    const openCreateModal = useCallback((lineIndex: number) => {
        setModalState({ open: true, mode: 'create', lineIndex });
    }, []);

    const openEditModal = useCallback(({ lineIndex, productIndex }: ProductPosition) => {
        setModalState({ open: true, mode: 'edit', lineIndex, productIndex });
    }, []);

    const closeModal = useCallback(() => {
        setModalState({ open: false });
    }, []);

    const handleSubmit = useCallback(
        (product: ProductionProduct) => {
            if (!modalState.open) return;

            setLines((currentLines) =>
                currentLines.map((line, lineIndex) => {
                    if (lineIndex !== modalState.lineIndex) return line;

                    if (modalState.mode === 'create') {
                        return {
                            ...line,
                            products: [...line.products, product],
                        };
                    }

                    return {
                        ...line,
                        products: line.products.map((currentProduct, productIndex) => {
                            if (productIndex !== modalState.productIndex) return currentProduct;
                            return { ...product, machineOverrides: currentProduct.machineOverrides };
                        }),
                    };
                })
            );
            closeModal();
        },
        [closeModal, modalState]
    );

    const confirmDelete = useCallback(() => {
        if (!deleteState) return;

        setLines((currentLines) =>
            currentLines.map((line, lineIndex) => {
                if (lineIndex !== deleteState.lineIndex) return line;

                return {
                    ...line,
                    products: line.products.filter(
                        (_product, productIndex) => productIndex !== deleteState.productIndex
                    ),
                };
            })
        );
        setDeleteState(null);
    }, [deleteState]);

    const openTransferMachineModal = useCallback(({ lineIndex, productIndex }: ProductPosition) => {
        setTransferMachineState({ open: true, lineIndex, productIndex });
    }, []);

    const openTransferScheduleModal = useCallback(({ lineIndex, productIndex }: ProductPosition) => {
        setTransferScheduleState({ open: true, lineIndex, productIndex });
    }, []);

    const handleTransferMachine = useCallback(
        (newMachine: string) => {
            if (!transferMachineState.open) return;
            const { lineIndex, productIndex } = transferMachineState;

            setLines((currentLines) =>
                currentLines.map((line, li) => {
                    if (li !== lineIndex) return line;
                    return {
                        ...line,
                        products: line.products.map((product, pi) => {
                            if (pi !== productIndex) return product;
                            const overrides = [...(product.machineOverrides ?? new Array(7).fill(undefined))];
                            overrides[todayIndex] = newMachine;
                            return { ...product, machineOverrides: overrides };
                        }),
                    };
                })
            );
            setTransferMachineState({ open: false });
        },
        [transferMachineState, todayIndex]
    );

    const handleTransferSchedule = useCallback(
        (newDayIndex: number, newMachine: string) => {
            if (!transferScheduleState.open) return;
            const { lineIndex, productIndex } = transferScheduleState;

            setLines((currentLines) =>
                currentLines.map((line, li) => {
                    if (li !== lineIndex) return line;
                    return {
                        ...line,
                        products: line.products.map((product, pi) => {
                            if (pi !== productIndex) return product;
                            const transferredQty = product.schedule[todayIndex];
                            if (transferredQty <= 0) return product;

                            const newSchedule = [...product.schedule] as typeof product.schedule;
                            newSchedule[todayIndex] = 0;
                            newSchedule[newDayIndex] = (newSchedule[newDayIndex] ?? 0) + transferredQty;

                            const overrides = [...(product.machineOverrides ?? new Array(7).fill(undefined))];
                            overrides[todayIndex] = undefined;
                            overrides[newDayIndex] = newMachine;

                            return { ...product, schedule: newSchedule, machineOverrides: overrides };
                        }),
                    };
                })
            );
            setTransferScheduleState({ open: false });
        },
        [transferScheduleState, todayIndex]
    );

    const handleReorderProducts = useCallback(
        (lineIndex: number, activeCode: string, overCode: string) => {
            setLines((currentLines) =>
                currentLines.map((line, currentLineIndex) => {
                    if (currentLineIndex !== lineIndex) return line;

                    const activeIndex = line.products.findIndex(
                        (product) => product.code === activeCode
                    );
                    const overIndex = line.products.findIndex((product) => product.code === overCode);

                    if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
                        return line;
                    }

                    return {
                        ...line,
                        products: moveArrayItem(line.products, activeIndex, overIndex),
                    };
                })
            );
        },
        []
    );

    const activeLineName = modalState.open ? lines[modalState.lineIndex]?.name : undefined;
    const pendingDeleteProduct =
        deleteState != null ? lines[deleteState.lineIndex]?.products[deleteState.productIndex] : null;

    const headerActions = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
                placeholder={t('productionPlan.filters.machinePlaceholder')}
                prefix={<SearchOutlined />}
                value={machineFilter}
                onChange={(event) => setMachineFilter(event.target.value)}
                allowClear
                style={{ width: 220, borderRadius: 8 }}
            />
            <DatePicker
                value={selectedDate}
                onChange={(date) => {
                    if (date) {
                        setSelectedDate(date);
                    }
                }}
                allowClear={false}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                style={{ width: 150, borderRadius: 8 }}
            />
            <Segmented<ActiveView>
                value={activeView}
                onChange={setActiveView}
                options={[
                    {
                        label: t('productionPlan.views.daily'),
                        value: 'daily',
                        icon: <CalendarOutlined />,
                    },
                    {
                        label: t('productionPlan.views.weekly'),
                        value: 'weekly',
                        icon: <TableOutlined />,
                    },
                ]}
            />
            <Button
                icon={<UploadOutlined />}
                onClick={() => setImportModalOpen(true)}
            >
                {t('productionPlan.actions.import')}
            </Button>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreateModal(0)}
                disabled={lines.length === 0}
            >
                {t('productionPlan.actions.addProduct')}
            </Button>
        </div>
    );

    return (
        <>
            <ResponsivePageHeader
                title={t('productionPlan.headerTitle', { label: headerLabel })}
                rightContent={headerActions}
                mobileMenuItems={[
                    {
                        key: 'add-product',
                        label: t('productionPlan.actions.addProduct'),
                        icon: <PlusOutlined />,
                        onClick: () => openCreateModal(0),
                    },
                ]}
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {summaryCards.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Col xs={24} sm={12} lg={6} key={item.label}>
                            <Card
                                variant="borderless"
                                hoverable
                                style={{
                                    height: '100%',
                                    borderRadius: 12,
                                    border: `1px solid ${item.borderColor}`,
                                    background: item.backgroundColor,
                                    boxShadow: token.boxShadow,
                                }}
                            >
                                <Flex align="center" gap={16} wrap="nowrap">
                                    <span
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 8,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: token.colorBgContainer,
                                            color: item.borderColor,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon style={{ fontSize: 22 }} />
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                color: token.colorPrimary,
                                                fontSize: 14,
                                                fontWeight: 500,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                        <div
                                            style={{
                                                color: token.colorPrimary,
                                                fontSize: 30,
                                                fontWeight: 700,
                                                lineHeight: 1,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {formatNumber(item.value)}
                                        </div>
                                    </div>
                                </Flex>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <Card
                style={{
                    ...planThemeVars,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: token.boxShadow,
                }}
                styles={{
                    body: {
                        padding: 0,
                    },
                }}
            >
                <div className={styles.tablePanelHeader}>
                    <div>
                        <Flex align="center" gap={8} wrap="wrap">
                            <Text strong>
                                {activeView === 'daily'
                                    ? t('productionPlan.panel.dailyTable')
                                    : t('productionPlan.panel.weeklyTable')}
                            </Text>
                            {activeView === 'daily' && (
                                <Button
                                    size="small"
                                    icon={<LeftOutlined />}
                                    onClick={() => setSelectedDate((d) => d.subtract(1, 'day'))}
                                />
                            )}
                            <Tag color={activeView === 'daily' ? 'blue' : 'geekblue'}>
                                {headerLabel}
                            </Tag>
                            {activeView === 'daily' && (
                                <Button
                                    size="small"
                                    icon={<RightOutlined />}
                                    onClick={() => setSelectedDate((d) => d.add(1, 'day'))}
                                />
                            )}
                        </Flex>
                        <div className={styles.panelMeta}>
                            {t('productionPlan.panel.meta', {
                                lines: summary.totalLines,
                                products: summary.totalProducts,
                            })}
                        </div>
                    </div>
                    <Text type="secondary">
                        {activeView === 'daily'
                            ? t('productionPlan.panel.cases', {
                                count: formatNumber(summary.dailyCases),
                            })
                            : t('productionPlan.panel.cases', {
                                count: formatNumber(summary.weeklyCases),
                            })}
                    </Text>
                </div>

                <div className={styles.tablePanelBody}>
                    {activeView === 'daily' ? (
                        <DailyTable
                            lines={lines}
                            todayIndex={todayIndex}
                            dateLabel={headerLabel}
                            onEdit={openEditModal}
                            onDelete={setDeleteState}
                            onReorder={handleReorderProducts}
                            onTransferMachine={openTransferMachineModal}
                            onTransferSchedule={openTransferScheduleModal}
                            machineFilter={machineFilter}
                        />
                    ) : (
                        <WeeklyTable
                            lines={lines}
                            todayIndex={todayIndex}
                            onEdit={openEditModal}
                            onDelete={setDeleteState}
                            onReorder={handleReorderProducts}
                            machineFilter={machineFilter}
                        />
                    )}
                </div>
            </Card>

            {modalState.open && (
                <PlanFormModal
                    open={modalState.open}
                    mode={modalState.mode}
                    lineName={activeLineName}
                    initialData={selectedProduct}
                    onCancel={closeModal}
                    onSubmit={handleSubmit}
                />
            )}

            <ImportModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
            />

            <TransferMachineModal
                open={transferMachineState.open}
                product={transferMachineProduct}
                todayIndex={todayIndex}
                machineOptions={allMachineNames}
                onCancel={() => setTransferMachineState({ open: false })}
                onConfirm={handleTransferMachine}
            />

            <TransferScheduleModal
                open={transferScheduleState.open}
                product={transferScheduleProduct}
                todayIndex={todayIndex}
                machineOptions={allMachineNames}
                lines={lines}
                onCancel={() => setTransferScheduleState({ open: false })}
                onConfirm={handleTransferSchedule}
            />

            <Modal
                title={t('productionPlan.deleteModal.title')}
                open={deleteState != null}
                okText={t('common.delete')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true }}
                onOk={confirmDelete}
                onCancel={() => setDeleteState(null)}
            >
                {t('productionPlan.deleteModal.messagePrefix')}{' '}
                <strong>
                    {pendingDeleteProduct?.code ?? t('productionPlan.deleteModal.fallbackProduct')}
                </strong>{' '}
                {t('productionPlan.deleteModal.messageSuffix')}
            </Modal>
        </>
    );
}
