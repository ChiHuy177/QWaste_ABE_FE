'use client';

import { type CSSProperties, useMemo } from 'react';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Flex,
    Grid,
    Input,
    Modal,
    Row,
    Segmented,
    Tag,
    Tooltip,
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
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import { useAppSelector } from '@/stores/hook';
import DailyTable from './_components/DailyTable';
import ImportModal from './_components/ImportModal';
import WeeklyTable from './_components/WeeklyTable';
import MachineMatrixTable from './_components/MachineMatrixTable';
import PlanFormModal from './_components/PlanFormModal';
import TransferGridModal from './_components/TransferGridModal';
import { formatDailyLabel, formatWeeklyLabel, WEEK_DAY_KEYS } from './_utils/dateUtils';
import { useMachineOptions } from './_hooks/useMachineOptions';
import { useMoldOptions } from './_hooks/useMoldOptions';
import {
    useNavConfirm,
    useProductionPlanActions,
    useProductionPlanData,
    useReorderPlan,
    useTransferPlan,
} from './hooks';
import type { PlanFormValues } from './_components/types';
import styles from './_components/ProductionPlanTable.module.css';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const DATE_FORMAT = 'YYYY-MM-DD';
const formatNumber = (value: number) => value.toLocaleString('vi-VN');

export default function ProductionPlanPage() {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    usePageTitle(t('productionPlan.title'));

    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    const modalState = useAppSelector((state) => state.productionPlan.modalState);

    const {
        activeView,
        selectedDate,
        selectedDateValue,
        todayIndex,
        weekStart,
        machineFilter,
        machineGroups: fetchedMachineGroups,
        isLoading,
        editDetail,
        summary,
        setActiveView,
        setSelectedDate,
        setMachineFilter,
    } = useProductionPlanData();

    const { machineCodeById } = useMachineOptions();
    const { molds, moldOptions } = useMoldOptions();

    const actions = useProductionPlanActions({ machineGroups: fetchedMachineGroups, modalState });

    const reorder = useReorderPlan({
        machineGroups: fetchedMachineGroups,
        selectedDateFormatted: selectedDate.format(DATE_FORMAT),
        machineCodeById,
    });
    const machineGroups = reorder.machineGroups;

    const transfer = useTransferPlan({
        weekStart,
        machineCodeById,
        onMutated: actions.invalidatePlanQueries,
    });

    const navConfirm = useNavConfirm({
        isReorderDirty: reorder.isReorderDirty,
        handleDiscardReorder: reorder.handleDiscardReorder,
        handleSaveReorder: reorder.handleSaveReorder,
    });

    const isReorderDirty = reorder.isReorderDirty;

    const fullWeekDays = useMemo(
        () => WEEK_DAY_KEYS.map((dayKey) => t(`productionPlan.days.full.${dayKey}`)),
        [t]
    );
    const headerLabel =
        activeView === 'daily'
            ? formatDailyLabel(selectedDateValue, fullWeekDays)
            : formatWeeklyLabel(selectedDateValue, t('productionPlan.days.week'));

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
                label: t('productionPlan.summary.dailyPieces'),
                value: summary.dailyPieces,
                icon: InboxOutlined,
                borderColor: token.colorWarning,
                backgroundColor: token.colorWarningBg,
            },
            {
                label: t('productionPlan.summary.weeklyPieces'),
                value: summary.weeklyPieces,
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

    const currentMoldCode =
        modalState.open && modalState.mode === 'edit'
            ? (editDetail?.snapshotMoldCode ?? modalState.row.moldCode)
            : undefined;
    const currentMoldId = useMemo(
        () => molds.find((mold) => mold.moldCode === currentMoldCode)?.moldId,
        [molds, currentMoldCode]
    );

    const formInitialValues = useMemo<Partial<PlanFormValues> | undefined>(() => {
        if (!modalState.open) return undefined;
        if (modalState.mode === 'create') {
            return { plannedDate: selectedDate, plannedQuantity: 1 };
        }
        return {
            code: editDetail?.productionPlanCode ?? modalState.row.code,
            name: editDetail?.productionPlanName ?? modalState.row.name,
            plannedQuantity: editDetail?.plannedQuantity ?? modalState.row.schedule[todayIndex],
            note: editDetail?.note ?? undefined,
            moldId: currentMoldId,
        };
    }, [editDetail, modalState, selectedDate, todayIndex, currentMoldId]);

    const pendingDeleteProduct = actions.deleteState?.row ?? null;

    const headerActions = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Tooltip title={isReorderDirty ? t('productionPlan.reorder.lockedFilterHint') : undefined}>
                <span style={{ display: 'inline-block' }}>
                    <Input
                        placeholder={t('productionPlan.filters.machinePlaceholder')}
                        prefix={<SearchOutlined />}
                        value={machineFilter}
                        onChange={(event) => setMachineFilter(event.target.value)}
                        disabled={isReorderDirty}
                        allowClear
                        style={{ width: 220, borderRadius: 8 }}
                    />
                </span>
            </Tooltip>
            <DatePicker
                value={selectedDate}
                onChange={(date) => {
                    if (date) {
                        navConfirm.runOrConfirm(() => setSelectedDate(date));
                    }
                }}
                allowClear={false}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                style={{ width: 150, borderRadius: 8 }}
            />
            <Segmented
                value={activeView}
                onChange={(value) =>
                    navConfirm.runOrConfirm(() =>
                        setActiveView(value as 'daily' | 'weekly' | 'matrix')
                    )
                }
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
                    {
                        label: t('productionPlan.views.matrix'),
                        value: 'matrix',
                        icon: <TableOutlined />,
                    },
                ]}
            />
            {actions.canImport && (
                <Tooltip title={isReorderDirty ? t('productionPlan.reorder.lockedImportHint') : undefined}>
                    <span style={{ display: 'inline-block' }}>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={() => {
                                if (actions.blockIfReorderDirty()) return;
                                actions.openImportModal();
                            }}
                            disabled={isReorderDirty}
                            type='primary'
                        >
                            {t('productionPlan.actions.import')}
                        </Button>
                    </span>
                </Tooltip>
            )}
        </div>
    );

    return (
        <div
            style={{
                height: isMobile ? 'auto' : '100%',
                minHeight: 0,
                overflow: isMobile ? 'visible' : 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <ResponsivePageHeader
                title={t('productionPlan.headerTitle', { label: headerLabel })}
                rightContent={headerActions}
                mobileMenuItems={
                    actions.canCreate
                        ? [
                            {
                                key: 'add-product',
                                label: t('productionPlan.actions.addProduct'),
                                icon: <PlusOutlined />,
                                onClick: actions.openCreateModal,
                            },
                        ]
                        : []
                }
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 24, flexShrink: 0 }}>
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
                                                color: item.borderColor,
                                                fontSize: 14,
                                                fontWeight: 500,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {item.label}
                                        </div>
                                        <div
                                            style={{
                                                color: item.borderColor,
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
                loading={isLoading}
                style={{
                    ...planThemeVars,
                    borderRadius: 12,
                    overflow: 'hidden',
                    // Card border khớp với --plan-color-border dùng xuyên suốt panel (header,
                    // table) — mặc định antd dùng colorBorderSecondary, lệch tông với các border
                    // còn lại trong panel này.
                    border: `1px solid ${token.colorBorder}`,
                    boxShadow: token.boxShadow,
                    flex: isMobile ? 'none' : 1,
                    height: isMobile ? '60vh' : undefined,
                    minHeight: isMobile ? 420 : 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                styles={{
                    body: {
                        padding: 0,
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    },
                }}
            >
                <div className={styles.tablePanelHeader}>
                    <div>
                        <Flex align="center" gap={8} wrap="wrap">
                            <Text strong>
                                {activeView === 'daily'
                                    ? t('productionPlan.panel.dailyTable')
                                    : activeView === 'weekly'
                                        ? t('productionPlan.panel.weeklyTable')
                                        : t('productionPlan.panel.machineMatrixTable')}
                            </Text>
                            {activeView === 'daily' && (
                                <Button
                                    size="small"
                                    icon={<LeftOutlined />}
                                    onClick={() =>
                                        navConfirm.runOrConfirm(() =>
                                            setSelectedDate(selectedDate.subtract(1, 'day'))
                                        )
                                    }
                                />
                            )}
                            <Tag color={activeView === 'daily' ? 'blue' : 'geekblue'}>
                                {headerLabel}
                            </Tag>
                            {activeView === 'daily' && (
                                <Button
                                    size="small"
                                    icon={<RightOutlined />}
                                    onClick={() =>
                                        navConfirm.runOrConfirm(() =>
                                            setSelectedDate(selectedDate.add(1, 'day'))
                                        )
                                    }
                                />
                            )}
                            {isReorderDirty && (
                                <Tag color="warning">{t('productionPlan.reorder.unsavedTag')}</Tag>
                            )}
                        </Flex>
                        <div className={styles.panelMeta}>
                            {t('productionPlan.panel.meta', {
                                lines: summary.totalLines,
                                products: summary.totalProducts,
                            })}
                        </div>
                    </div>
                    <Flex align="center" gap={12}>
                        <Text type="secondary">
                            {activeView === 'daily'
                                ? t('productionPlan.panel.pieces', {
                                    count: formatNumber(summary.dailyPieces),
                                })
                                : t('productionPlan.panel.pieces', {
                                    count: formatNumber(summary.weeklyPieces),
                                })}
                        </Text>
                        {isReorderDirty && (
                            <>
                                <Button size="small" onClick={reorder.handleDiscardReorder}>
                                    {t('productionPlan.reorder.discard')}
                                </Button>
                                <Button
                                    size="small"
                                    type="primary"
                                    loading={reorder.savingReorder}
                                    onClick={reorder.handleSaveReorder}
                                >
                                    {t('productionPlan.reorder.save')}
                                </Button>
                            </>
                        )}
                        {actions.canCreate && (
                            <Tooltip
                                title={
                                    isReorderDirty
                                        ? t('productionPlan.reorder.lockedCreateHint')
                                        : undefined
                                }
                            >
                                <span style={{ display: 'inline-block' }}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={actions.openCreateModal}
                                        disabled={isReorderDirty}
                                    >
                                        {t('productionPlan.actions.addProduct')}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </Flex>
                </div>

                <div ref={tableContainerRef} className={styles.tablePanelBody}>
                    {activeView === 'daily' && (
                        <DailyTable
                            groups={machineGroups}
                            todayIndex={todayIndex}
                            dateLabel={headerLabel}
                            machineFilter={machineFilter}
                            canReorder={actions.canReorder}
                            scrollY={tableScrollY}
                            isMobile={isMobile}
                            actionsLocked={isReorderDirty}
                            onEdit={actions.openEditModal}
                            onDelete={actions.requestDelete}
                            onRestore={actions.handleRestore}
                            onReorder={reorder.handleReorderProducts}
                            onTransferOpen={transfer.openTransfer}
                        />
                    )}
                    {activeView === 'weekly' && (
                        <WeeklyTable
                            groups={machineGroups}
                            todayIndex={todayIndex}
                            machineFilter={machineFilter}
                            scrollY={tableScrollY}
                            isMobile={isMobile}
                        />
                    )}
                    {activeView === 'matrix' && (
                        <MachineMatrixTable
                            groups={machineGroups}
                            machineFilter={machineFilter}
                            scrollY={tableScrollY}
                            isMobile={isMobile}
                        />
                    )}
                </div>
            </Card>

            {modalState.open && (
                <PlanFormModal
                    open={modalState.open}
                    mode={modalState.mode}
                    initialValues={formInitialValues}
                    currentMoldCode={currentMoldCode}
                    molds={molds}
                    moldOptions={moldOptions}
                    submitting={actions.formSubmitting}
                    onCancel={actions.closeModal}
                    onSubmit={actions.handleSubmit}
                />
            )}

            <ImportModal
                open={actions.importModalOpen}
                onClose={actions.closeImportModal}
                onImported={actions.invalidatePlanQueries}
            />

            {transfer.transferState.open && (
                <TransferGridModal
                    open={transfer.transferState.open}
                    target={transfer.transferState}
                    todayIndex={todayIndex}
                    weekStart={weekStart}
                    gridWeekStart={transfer.gridWeekStart}
                    gridWeekOffset={transfer.gridWeekOffset}
                    onShiftWeek={transfer.shiftGridWeek}
                    weeklyGroups={transfer.transferWeeklyGroups}
                    gridLoading={transfer.transferGridLoading}
                    submitting={transfer.transferSubmitting}
                    onCancel={transfer.closeTransfer}
                    onConfirm={transfer.handleTransferConfirm}
                />
            )}

            <Modal
                title={t('productionPlan.deleteModal.title')}
                open={actions.deleteState != null}
                okText={t('common.delete')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true, loading: actions.deleting }}
                onOk={actions.confirmDelete}
                onCancel={actions.cancelDelete}
            >
                {t('productionPlan.deleteModal.messagePrefix')}{' '}
                <strong>
                    {pendingDeleteProduct?.code ?? t('productionPlan.deleteModal.fallbackProduct')}
                </strong>{' '}
                {t('productionPlan.deleteModal.messageSuffix')}
            </Modal>

            <Modal
                title={t('productionPlan.reorder.confirmTitle')}
                open={navConfirm.navConfirmOpen}
                onCancel={navConfirm.closeNavConfirm}
                footer={[
                    <Button key="cancel" onClick={navConfirm.closeNavConfirm}>
                        {t('common.cancel')}
                    </Button>,
                    <Button key="discard" danger onClick={navConfirm.handleNavConfirmDiscard}>
                        {t('productionPlan.reorder.discardAndContinue')}
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={reorder.savingReorder}
                        onClick={navConfirm.handleNavConfirmSave}
                    >
                        {t('productionPlan.reorder.saveAndContinue')}
                    </Button>,
                ]}
            >
                {t('productionPlan.reorder.confirmMessage')}
            </Modal>
        </div>
    );
}
