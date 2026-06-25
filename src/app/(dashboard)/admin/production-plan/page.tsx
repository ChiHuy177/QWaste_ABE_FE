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
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import DailyTable from './_components/DailyTable';
import WeeklyTable from './_components/WeeklyTable';
import PlanFormModal from './_components/PlanFormModal';
import {
    formatDailyLabel,
    formatWeeklyLabel,
    getTodayScheduleIndex,
} from './_components/dateUtils';
import { initialProductionPlan } from './_components/mockData';
import {
    PlanModalState,
    ProductionLine,
    ProductionProduct,
    ProductPosition,
} from './_components/types';
import styles from './_components/ProductionPlanTable.module.css';

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

    usePageTitle('Kế hoạch sản xuất');

    const [activeView, setActiveView] = useState<ActiveView>('daily');
    const [lines, setLines] = useState<ProductionLine[]>(initialProductionPlan);
    const [modalState, setModalState] = useState<PlanModalState>({ open: false });
    const [deleteState, setDeleteState] = useState<ProductPosition | null>(null);
    const [machineFilter, setMachineFilter] = useState('');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());

    const selectedDateValue = useMemo(() => selectedDate.toDate(), [selectedDate]);
    const todayIndex = useMemo(() => getTodayScheduleIndex(selectedDateValue), [selectedDateValue]);
    const headerLabel =
        activeView === 'daily'
            ? formatDailyLabel(selectedDateValue)
            : formatWeeklyLabel(selectedDateValue);

    const selectedProduct = useMemo(() => {
        if (!modalState.open || modalState.mode !== 'edit' || modalState.productIndex == null) {
            return undefined;
        }

        return lines[modalState.lineIndex]?.products[modalState.productIndex];
    }, [lines, modalState]);

    const summary = useMemo(() => {
        const normalizedMachineFilter = machineFilter.trim().toLowerCase();
        const visibleLines = lines
            .map((line) => ({
                ...line,
                products: line.products.filter(
                    (product) =>
                        !normalizedMachineFilter ||
                        product.machine.toLowerCase().includes(normalizedMachineFilter)
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
                label: 'Chuyền',
                value: summary.totalLines,
                icon: ApartmentOutlined,
                borderColor: token.colorPrimary,
                backgroundColor: token.colorInfoBg,
            },
            {
                label: 'Mã hàng',
                value: summary.totalProducts,
                icon: AppstoreOutlined,
                borderColor: token.colorSuccess,
                backgroundColor: token.colorSuccessBg,
            },
            {
                label: 'Thùng hôm nay',
                value: summary.dailyCases,
                icon: InboxOutlined,
                borderColor: token.colorWarning,
                backgroundColor: token.colorWarningBg,
            },
            {
                label: 'Thùng trong tuần',
                value: summary.weeklyCases,
                icon: CalendarOutlined,
                borderColor: token.colorInfo,
                backgroundColor: token.colorPrimaryBg,
            },
        ],
        [summary, token]
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
                        products: line.products.map((currentProduct, productIndex) =>
                            productIndex === modalState.productIndex ? product : currentProduct
                        ),
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
                placeholder="Tìm theo máy"
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
                        label: 'Ngày',
                        value: 'daily',
                        icon: <CalendarOutlined />,
                    },
                    {
                        label: 'Tuần',
                        value: 'weekly',
                        icon: <TableOutlined />,
                    },
                ]}
            />
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreateModal(0)}
                disabled={lines.length === 0}
            >
                Thêm mã hàng
            </Button>
        </div>
    );

    return (
        <>
            <ResponsivePageHeader
                title={`Kế hoạch sản xuất - ${headerLabel}`}
                rightContent={headerActions}
                mobileMenuItems={[
                    {
                        key: 'add-product',
                        label: 'Thêm mã hàng',
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
                                {activeView === 'daily' ? 'Bảng ngày' : 'Bảng tuần'}
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
                            {summary.totalLines} chuyền / {summary.totalProducts} mã hàng
                        </div>
                    </div>
                    <Text type="secondary">
                        {activeView === 'daily'
                            ? `${formatNumber(summary.dailyCases)} thùng`
                            : `${formatNumber(summary.weeklyCases)} thùng`}
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

            <Modal
                title="Xóa mã hàng"
                open={deleteState != null}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onOk={confirmDelete}
                onCancel={() => setDeleteState(null)}
            >
                Bạn có chắc chắn muốn xóa{' '}
                <strong>{pendingDeleteProduct?.code ?? 'mã hàng này'}</strong> khỏi kế hoạch?
            </Modal>
        </>
    );
}
