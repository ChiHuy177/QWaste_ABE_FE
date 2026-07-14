'use client';

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import dayjs, { Dayjs } from 'dayjs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useAntdTableScroll } from '@/hooks/useAntdTableScroll';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import { MachineService } from '@/services/MachineService';
import { MoldService } from '@/services/MoldService';
import type { Machine } from '@/types/Machine';
import { isMoldSchedulable, type Mold } from '@/types/Mold';
import type {
    ProductionPlanFormData,
    ProductionPlanReorderItem,
    ProductionPlanUpdateFormData,
} from '@/types/ProductionPlan';
import DailyTable from './_components/DailyTable';
import ImportModal from './_components/ImportModal';
import WeeklyTable from './_components/WeeklyTable';
import MachineMatrixTable from './_components/MachineMatrixTable';
import PlanFormModal from './_components/PlanFormModal';
import TransferMachineModal, {
    TransferMachinePayload,
} from './_components/TransferMachineModal';
import TransferScheduleModal, {
    TransferSchedulePayload,
} from './_components/TransferScheduleModal';
import { formatDailyLabel, formatWeeklyLabel, getTodayScheduleIndex, WEEK_DAY_KEYS } from './_utils/dateUtils';
import {
    buildMachineInfoMap,
    mapDailyGroups,
    mapWeeklyGroups,
    type MachineInfoMap,
} from './_utils/planMappers';
import {
    MachineGroupVM,
    PlanFormValues,
    PlanModalState,
    PlanRowTarget,
    SelectOptionVM,
    TransferMachineModalState,
    TransferScheduleModalState,
} from './_components/types';
import styles from './_components/ProductionPlanTable.module.css';

type ActiveView = 'daily' | 'weekly' | 'matrix';

const { Text } = Typography;

const DATE_FORMAT = 'YYYY-MM-DD';
// BE phân trang theo máy (size mặc định 20) — lấy dư để render toàn bộ (G9).
const MACHINE_PAGE_SIZE = 100;

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const moveArrayItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);

    return nextItems;
};

const getWeekStart = (date: Dayjs) => date.subtract((date.day() + 6) % 7, 'day');

const machineOptionLabel = (machine: Machine) => {
    const code = machine.machineCode || machine.machineName;
    const space = machine.space?.spaceName;
    return space ? `${code} — ${space}` : code;
};

export default function ProductionPlanPage() {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const { handleError } = useApiErrorHandler();
    const { checkPermission, checkPermissionSilent } = usePermissionCheck();

    usePageTitle(t('productionPlan.title'));

    const [activeView, setActiveView] = useState<ActiveView>('daily');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
    const [machineFilter, setMachineFilter] = useState('');

    const [machineGroups, setMachineGroups] = useState<MachineGroupVM[]>([]);
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [molds, setMolds] = useState<Mold[]>([]);

    const [modalState, setModalState] = useState<PlanModalState>({ open: false });
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [deleteState, setDeleteState] = useState<PlanRowTarget | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [transferMachineState, setTransferMachineState] = useState<TransferMachineModalState>({
        open: false,
    });
    const [transferScheduleState, setTransferScheduleState] = useState<TransferScheduleModalState>(
        { open: false }
    );
    const [transferWeeklyGroups, setTransferWeeklyGroups] = useState<MachineGroupVM[]>([]);
    const [transferGridLoading, setTransferGridLoading] = useState(false);
    const [transferSubmitting, setTransferSubmitting] = useState(false);

    const [importModalOpen, setImportModalOpen] = useState(false);

    // Reorder theo trigger: kéo-thả chỉ cập nhật optimistic + đánh dấu dirty,
    // API PUT /reorder chỉ gọi khi bấm "Lưu thứ tự" (gộp mọi máy đã đổi).
    const [dirtyMachineIds, setDirtyMachineIds] = useState<Set<string>>(new Set());
    const [savingReorder, setSavingReorder] = useState(false);
    const [navConfirmOpen, setNavConfirmOpen] = useState(false);
    const savedMachineGroupsRef = useRef<MachineGroupVM[]>([]);
    const pendingNavActionRef = useRef<(() => void) | null>(null);
    const isReorderDirty = dirtyMachineIds.size > 0;

    const { tableContainerRef, tableScrollY } = useAntdTableScroll();

    // Machine list fetch 1 lần cho cả enrich spaceName lẫn options (G2).
    const machineInfoPromiseRef = useRef<Promise<{
        machines: Machine[];
        map: MachineInfoMap;
    }> | null>(null);

    const loadMachineInfo = useCallback(() => {
        machineInfoPromiseRef.current ??= MachineService.getAllMachines().then((machineList) => {
            setMachines(machineList);
            return { machines: machineList, map: buildMachineInfoMap(machineList) };
        });
        return machineInfoPromiseRef.current;
    }, []);

    const selectedDateValue = useMemo(() => selectedDate.toDate(), [selectedDate]);
    const todayIndex = useMemo(() => getTodayScheduleIndex(selectedDateValue), [selectedDateValue]);
    const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
    const fullWeekDays = useMemo(
        () => WEEK_DAY_KEYS.map((dayKey) => t(`productionPlan.days.full.${dayKey}`)),
        [t]
    );
    const headerLabel =
        activeView === 'daily'
            ? formatDailyLabel(selectedDateValue, fullWeekDays)
            : formatWeeklyLabel(selectedDateValue, t('productionPlan.days.week'));

    const canCreate = checkPermissionSilent('create', 'product');
    const canReorder = checkPermissionSilent('reorder', 'product');
    const canImport = checkPermissionSilent('import', 'product');

    const fetchPlanData = useCallback(async () => {
        try {
            setLoading(true);
            const { map } = await loadMachineInfo();

            let nextGroups: MachineGroupVM[];
            if (activeView === 'daily') {
                const page = await ProductionPlanService.getDailyProductionPlans({
                    date: selectedDate.format(DATE_FORMAT),
                    size: MACHINE_PAGE_SIZE,
                });
                nextGroups = mapDailyGroups(page.content, map, todayIndex);
            } else {
                const page = await ProductionPlanService.getWeeklyProductionPlans({
                    startDate: weekStart.format(DATE_FORMAT),
                    endDate: weekStart.add(6, 'day').format(DATE_FORMAT),
                    size: MACHINE_PAGE_SIZE,
                });
                nextGroups = mapWeeklyGroups(page.content, map, weekStart.format(DATE_FORMAT));
            }

            setMachineGroups(nextGroups);
            // Fetch mới luôn là nguồn sự thật — reset baseline & bỏ mọi thay đổi reorder chưa lưu.
            savedMachineGroupsRef.current = nextGroups;
            setDirtyMachineIds(new Set());
        } catch (error) {
            handleError(error, { fallbackKey: 'productionPlan.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [activeView, handleError, loadMachineInfo, selectedDate, todayIndex, weekStart]);

    useEffect(() => {
        fetchPlanData();
    }, [fetchPlanData]);

    useEffect(() => {
        let cancelled = false;

        const fetchMolds = async () => {
            try {
                const moldList = await MoldService.getAllMolds();
                if (!cancelled) {
                    setMolds(moldList);
                }
            } catch (error) {
                handleError(error, { fallbackKey: 'productionPlan.moldFetchError' });
            }
        };

        fetchMolds();
        return () => {
            cancelled = true;
        };
    }, [handleError]);

    const machineOptions = useMemo<SelectOptionVM[]>(
        () =>
            machines.map((machine) => ({
                value: String(machine.machineId),
                label: machineOptionLabel(machine),
            })),
        [machines]
    );

    // GET /v1 trả cả mold đã xóa/RETIRED — picker chỉ đưa mold còn dùng được.
    const moldOptions = useMemo<SelectOptionVM[]>(
        () =>
            molds.filter(isMoldSchedulable).map((mold) => ({
                value: mold.moldId,
                label: `${mold.moldCode} — ${mold.moldName}`,
            })),
        [molds]
    );

    const normalizedMachineFilter = machineFilter.trim().toLowerCase();

    const summary = useMemo(() => {
        const visibleGroups = machineGroups.filter(
            (group) =>
                group.products.length > 0 &&
                (!normalizedMachineFilter ||
                    group.machineCode.toLowerCase().includes(normalizedMachineFilter) ||
                    group.machineName.toLowerCase().includes(normalizedMachineFilter) ||
                    group.spaceName.toLowerCase().includes(normalizedMachineFilter))
        );

        let totalProducts = 0;
        let dailyCases = 0;
        let weeklyCases = 0;

        visibleGroups.forEach((group) => {
            group.products
                .filter((product) => !product.isDeleted)
                .forEach((product) => {
                    totalProducts += 1;
                    dailyCases += product.schedule[todayIndex];
                    weeklyCases += product.schedule.reduce((sum, qty) => sum + qty, 0);
                });
        });

        return { totalLines: visibleGroups.length, totalProducts, dailyCases, weeklyCases };
    }, [machineGroups, normalizedMachineFilter, todayIndex]);

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

    // Còn thay đổi thứ tự chưa lưu — chặn các thao tác khác vì chúng tính sequence/refetch
    // dựa trên machineGroups, có thể lệch hoặc âm thầm xóa mất phần chưa lưu.
    const blockIfReorderDirty = useCallback(() => {
        if (!isReorderDirty) return false;
        toast.warning(t('productionPlan.reorder.lockedActionHint'));
        return true;
    }, [isReorderDirty, t]);

    // ─── Create / Edit ───────────────────────────────────────────────────────

    const openCreateModal = useCallback(() => {
        if (blockIfReorderDirty()) return;
        if (!checkPermission('create', 'product')) return;
        setModalState({ open: true, mode: 'create' });
    }, [blockIfReorderDirty, checkPermission]);

    const openEditModal = useCallback(
        (target: PlanRowTarget) => {
            if (blockIfReorderDirty()) return;
            if (!checkPermission('update', 'product')) return;
            setModalState({ open: true, mode: 'edit', machineId: target.machineId, row: target.row });
        },
        [blockIfReorderDirty, checkPermission]
    );

    const closeModal = useCallback(() => {
        setModalState({ open: false });
    }, []);

    const formInitialValues = useMemo<Partial<PlanFormValues> | undefined>(() => {
        if (!modalState.open) return undefined;
        if (modalState.mode === 'create') {
            return { plannedDate: selectedDate, plannedQuantity: 1 };
        }
        return {
            code: modalState.row.code,
            name: modalState.row.name,
            plannedQuantity: modalState.row.schedule[todayIndex],
        };
    }, [modalState, selectedDate, todayIndex]);

    const nextSequenceForMachine = useCallback(
        (machineId: string) => {
            const group = machineGroups.find((g) => g.machineId === machineId);
            if (!group) return 1;
            const maxSequence = group.products.reduce(
                (max, product) => Math.max(max, product.sequence ?? 0),
                0
            );
            return maxSequence + 1;
        },
        [machineGroups]
    );

    const handleSubmit = useCallback(
        async (values: PlanFormValues) => {
            if (!modalState.open) return;

            try {
                setFormSubmitting(true);

                if (modalState.mode === 'create') {
                    if (!values.machineId || !values.moldId || !values.plannedDate) return;
                    const request: ProductionPlanFormData = {
                        productionPlanCode: values.code,
                        productionPlanName: values.name,
                        plannedQuantity: values.plannedQuantity,
                        sequence: nextSequenceForMachine(values.machineId),
                        plannedDate: values.plannedDate.format(DATE_FORMAT),
                        note: values.note,
                        machineId: values.machineId,
                        moldId: values.moldId,
                    };
                    await ProductionPlanService.createProductionPlan(request);
                    toast.success(t('productionPlan.form.createSuccess'));
                } else {
                    const request: ProductionPlanUpdateFormData = {
                        productionPlanId: modalState.row.productionPlanId,
                        productionPlanCode: values.code,
                        productionPlanName: values.name,
                        plannedQuantity: values.plannedQuantity,
                        moldId: values.moldId,
                    };
                    await ProductionPlanService.updateProductionPlan(request);
                    toast.success(t('productionPlan.form.updateSuccess'));
                }

                closeModal();
                fetchPlanData();
            } catch (error) {
                handleError(error, {
                    fallbackKey:
                        modalState.mode === 'create'
                            ? 'productionPlan.form.createError'
                            : 'productionPlan.form.updateError',
                });
            } finally {
                setFormSubmitting(false);
            }
        },
        [closeModal, fetchPlanData, handleError, modalState, nextSequenceForMachine, t]
    );

    // ─── Delete / Restore (chỉ daily view) ───────────────────────────────────

    const requestDelete = useCallback(
        (target: PlanRowTarget) => {
            if (blockIfReorderDirty()) return;
            if (!checkPermission('delete', 'product')) return;
            setDeleteState(target);
        },
        [blockIfReorderDirty, checkPermission]
    );

    const confirmDelete = useCallback(async () => {
        if (!deleteState) return;

        try {
            setDeleting(true);
            const message = await ProductionPlanService.deleteProductionPlan(
                deleteState.row.productionPlanId
            );
            toast.success(message || t('productionPlan.deleteSuccess'));
            setDeleteState(null);
            fetchPlanData();
        } catch (error) {
            handleError(error, { fallbackKey: 'productionPlan.deleteError' });
        } finally {
            setDeleting(false);
        }
    }, [deleteState, fetchPlanData, handleError, t]);

    const handleRestore = useCallback(
        async (target: PlanRowTarget) => {
            if (blockIfReorderDirty()) return;
            if (!checkPermission('restore', 'product')) return;

            try {
                const message = await ProductionPlanService.restoreProductionPlan(
                    target.row.productionPlanId
                );
                toast.success(message || t('productionPlan.restoreSuccess'));
                fetchPlanData();
            } catch (error) {
                handleError(error, { fallbackKey: 'productionPlan.restoreError' });
            }
        },
        [blockIfReorderDirty, checkPermission, fetchPlanData, handleError, t]
    );

    // ─── Reorder (daily view, trong 1 máy) — staged, chỉ gọi API khi confirm ──

    // Kéo-thả chỉ cập nhật state optimistic + đánh dấu máy "dirty". Không gọi API ở đây —
    // API PUT /reorder chỉ chạy khi bấm "Lưu thứ tự" (handleSaveReorder), gộp mọi máy dirty.
    const handleReorderProducts = useCallback(
        (machineId: string, activeRowKey: string, overRowKey: string) => {
            if (!checkPermission('reorder', 'product')) return;

            const group = machineGroups.find((g) => g.machineId === machineId);
            if (!group) return;

            const activeProducts = group.products.filter((product) => !product.isDeleted);
            const activeIndex = activeProducts.findIndex((p) => p.rowKey === activeRowKey);
            const overIndex = activeProducts.findIndex((p) => p.rowKey === overRowKey);
            if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return;

            const reordered = moveArrayItem(activeProducts, activeIndex, overIndex);

            setMachineGroups((currentGroups) =>
                currentGroups.map((currentGroup) => {
                    if (currentGroup.machineId !== machineId) return currentGroup;
                    const deletedProducts = currentGroup.products.filter((p) => p.isDeleted);
                    return { ...currentGroup, products: [...reordered, ...deletedProducts] };
                })
            );
            setDirtyMachineIds((prev) => (prev.has(machineId) ? prev : new Set(prev).add(machineId)));
        },
        [checkPermission, machineGroups]
    );

    const buildReorderItems = useCallback((): ProductionPlanReorderItem[] => {
        const items: ProductionPlanReorderItem[] = [];
        machineGroups.forEach((group) => {
            if (!dirtyMachineIds.has(group.machineId)) return;
            group.products
                .filter((product) => !product.isDeleted)
                .forEach((product, index) => {
                    items.push({ productionPlanId: product.productionPlanId, sequence: index + 1 });
                });
        });
        return items;
    }, [dirtyMachineIds, machineGroups]);

    const handleDiscardReorder = useCallback(() => {
        setMachineGroups(savedMachineGroupsRef.current);
        setDirtyMachineIds(new Set());
    }, []);

    const handleSaveReorder = useCallback(async () => {
        const items = buildReorderItems();
        if (items.length === 0) {
            setDirtyMachineIds(new Set());
            return;
        }

        try {
            setSavingReorder(true);
            await ProductionPlanService.reorderProductionPlans(items);
            toast.success(t('productionPlan.reorder.saveSuccess'));
            savedMachineGroupsRef.current = machineGroups;
            setDirtyMachineIds(new Set());
        } catch (error) {
            handleError(error, { fallbackKey: 'productionPlan.reorderError' });
            throw error;
        } finally {
            setSavingReorder(false);
        }
    }, [buildReorderItems, handleError, machineGroups, t]);

    // Chặn điều hướng (đổi ngày/view/filter) khi còn thay đổi thứ tự chưa lưu —
    // mở modal xác nhận Lưu/Hủy thay vì âm thầm mất dữ liệu qua fetchPlanData().
    const runOrConfirm = useCallback(
        (action: () => void) => {
            if (!isReorderDirty) {
                action();
                return;
            }
            pendingNavActionRef.current = action;
            setNavConfirmOpen(true);
        },
        [isReorderDirty]
    );

    const closeNavConfirm = useCallback(() => {
        setNavConfirmOpen(false);
        pendingNavActionRef.current = null;
    }, []);

    const handleNavConfirmDiscard = useCallback(() => {
        handleDiscardReorder();
        const action = pendingNavActionRef.current;
        closeNavConfirm();
        action?.();
    }, [closeNavConfirm, handleDiscardReorder]);

    const handleNavConfirmSave = useCallback(async () => {
        try {
            await handleSaveReorder();
            const action = pendingNavActionRef.current;
            closeNavConfirm();
            action?.();
        } catch {
            // Lỗi đã toast trong handleSaveReorder — giữ modal mở để thử lại.
        }
    }, [closeNavConfirm, handleSaveReorder]);

    // ─── Transfer (BE incident defer — G6) ───────────────────────────────────

    // BE detail response không có moldId — resolve từ mold list qua snapshotMoldCode.
    // Tra trên toàn bộ list (kể cả mold hết ACTIVE) vì plan cũ vẫn giữ khuôn cũ.
    const resolveMoldId = useCallback(
        (moldCode: string | null) => {
            if (!moldCode) return undefined;
            return molds.find((m) => m.moldCode === moldCode)?.moldId;
        },
        [molds]
    );

    const openTransferMachineModal = useCallback(
        (target: PlanRowTarget) => {
            if (blockIfReorderDirty()) return;
            if (!checkPermission('update', 'product')) return;
            setTransferMachineState({ open: true, ...target });
        },
        [blockIfReorderDirty, checkPermission]
    );

    const openTransferScheduleModal = useCallback(
        async (target: PlanRowTarget) => {
            if (blockIfReorderDirty()) return;
            if (!checkPermission('update', 'product')) return;
            setTransferScheduleState({ open: true, ...target });

            try {
                setTransferGridLoading(true);
                const { map } = await loadMachineInfo();
                const page = await ProductionPlanService.getWeeklyProductionPlans({
                    startDate: weekStart.format(DATE_FORMAT),
                    endDate: weekStart.add(6, 'day').format(DATE_FORMAT),
                    size: MACHINE_PAGE_SIZE,
                });
                setTransferWeeklyGroups(
                    mapWeeklyGroups(page.content, map, weekStart.format(DATE_FORMAT))
                );
            } catch (error) {
                handleError(error, { fallbackKey: 'productionPlan.fetchError' });
            } finally {
                setTransferGridLoading(false);
            }
        },
        [blockIfReorderDirty, checkPermission, handleError, loadMachineInfo, weekStart]
    );

    const runDefer = useCallback(
        async (
            target: PlanRowTarget,
            payload: {
                plannedDate: string;
                machineId: string;
                incidentReason: TransferMachinePayload['incidentReason'];
                note?: string;
            },
            sequence: number,
            onDone: () => void
        ) => {
            const moldId = resolveMoldId(target.row.moldCode);
            if (!moldId) {
                toast.error(t('productionPlan.transfer.detailNotReady'));
                return;
            }

            try {
                setTransferSubmitting(true);
                await ProductionPlanService.deferProductionPlan(target.row.productionPlanId, {
                    plannedDate: payload.plannedDate,
                    machineId: payload.machineId,
                    moldId,
                    sequence,
                    incidentReason: payload.incidentReason,
                    note: payload.note,
                });
                toast.success(t('productionPlan.transfer.success'));
                onDone();
                fetchPlanData();
            } catch (error) {
                handleError(error, { fallbackKey: 'productionPlan.transfer.error' });
            } finally {
                setTransferSubmitting(false);
            }
        },
        [fetchPlanData, handleError, resolveMoldId, t]
    );

    const handleTransferMachine = useCallback(
        (payload: TransferMachinePayload) => {
            if (!transferMachineState.open) return;
            const target: PlanRowTarget = transferMachineState;

            runDefer(
                target,
                {
                    plannedDate: selectedDate.format(DATE_FORMAT),
                    machineId: payload.machineId,
                    incidentReason: payload.incidentReason,
                    note: payload.note,
                },
                nextSequenceForMachine(payload.machineId),
                () => setTransferMachineState({ open: false })
            );
        },
        [nextSequenceForMachine, runDefer, selectedDate, transferMachineState]
    );

    const handleTransferSchedule = useCallback(
        (payload: TransferSchedulePayload) => {
            if (!transferScheduleState.open) return;
            const target: PlanRowTarget = transferScheduleState;

            const targetGroup = transferWeeklyGroups.find(
                (group) => group.machineId === payload.machineId
            );
            const plansOnTargetDay =
                targetGroup?.products.filter(
                    (product) => !product.isDeleted && product.schedule[payload.dayIndex] > 0
                ).length ?? 0;

            runDefer(
                target,
                {
                    plannedDate: weekStart.add(payload.dayIndex, 'day').format(DATE_FORMAT),
                    machineId: payload.machineId,
                    incidentReason: payload.incidentReason,
                    note: payload.note,
                },
                plansOnTargetDay + 1,
                () => setTransferScheduleState({ open: false })
            );
        },
        [runDefer, transferScheduleState, transferWeeklyGroups, weekStart]
    );

    // ─── Render ──────────────────────────────────────────────────────────────

    const pendingDeleteProduct = deleteState?.row ?? null;

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
                        runOrConfirm(() => setSelectedDate(date));
                    }
                }}
                allowClear={false}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined />}
                style={{ width: 150, borderRadius: 8 }}
            />
            <Segmented<ActiveView>
                value={activeView}
                onChange={(value) => runOrConfirm(() => setActiveView(value))}
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
            {canImport && (
                <Tooltip title={isReorderDirty ? t('productionPlan.reorder.lockedImportHint') : undefined}>
                    <span style={{ display: 'inline-block' }}>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={() => {
                                if (blockIfReorderDirty()) return;
                                setImportModalOpen(true);
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
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <ResponsivePageHeader
                title={t('productionPlan.headerTitle', { label: headerLabel })}
                rightContent={headerActions}
                mobileMenuItems={
                    canCreate
                        ? [
                            {
                                key: 'add-product',
                                label: t('productionPlan.actions.addProduct'),
                                icon: <PlusOutlined />,
                                onClick: openCreateModal,
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
                loading={loading}
                style={{
                    ...planThemeVars,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: token.boxShadow,
                    flex: 1,
                    minHeight: 0,
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
                                        runOrConfirm(() =>
                                            setSelectedDate((d) => d.subtract(1, 'day'))
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
                                        runOrConfirm(() => setSelectedDate((d) => d.add(1, 'day')))
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
                                ? t('productionPlan.panel.cases', {
                                    count: formatNumber(summary.dailyCases),
                                })
                                : t('productionPlan.panel.cases', {
                                    count: formatNumber(summary.weeklyCases),
                                })}
                        </Text>
                        {isReorderDirty && (
                            <>
                                <Button size="small" onClick={handleDiscardReorder}>
                                    {t('productionPlan.reorder.discard')}
                                </Button>
                                <Button
                                    size="small"
                                    type="primary"
                                    loading={savingReorder}
                                    onClick={handleSaveReorder}
                                >
                                    {t('productionPlan.reorder.save')}
                                </Button>
                            </>
                        )}
                        {canCreate && (
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
                                        onClick={openCreateModal}
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
                            canReorder={canReorder}
                            scrollY={tableScrollY}
                            actionsLocked={isReorderDirty}
                            onEdit={openEditModal}
                            onDelete={requestDelete}
                            onRestore={handleRestore}
                            onReorder={handleReorderProducts}
                            onTransferMachine={openTransferMachineModal}
                            onTransferSchedule={openTransferScheduleModal}
                        />
                    )}
                    {activeView === 'weekly' && (
                        <WeeklyTable
                            groups={machineGroups}
                            todayIndex={todayIndex}
                            machineFilter={machineFilter}
                            scrollY={tableScrollY}
                        />
                    )}
                    {activeView === 'matrix' && (
                        <MachineMatrixTable
                            groups={machineGroups}
                            machineFilter={machineFilter}
                            scrollY={tableScrollY}
                        />
                    )}
                </div>
            </Card>

            {modalState.open && (
                <PlanFormModal
                    open={modalState.open}
                    mode={modalState.mode}
                    initialValues={formInitialValues}
                    currentMoldCode={modalState.mode === 'edit' ? modalState.row.moldCode : undefined}
                    machineOptions={machineOptions}
                    moldOptions={moldOptions}
                    submitting={formSubmitting}
                    onCancel={closeModal}
                    onSubmit={handleSubmit}
                />
            )}

            <ImportModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImported={fetchPlanData}
            />

            <TransferMachineModal
                open={transferMachineState.open}
                target={transferMachineState.open ? transferMachineState : null}
                todayIndex={todayIndex}
                machineOptions={machineOptions}
                submitting={transferSubmitting}
                onCancel={() => setTransferMachineState({ open: false })}
                onConfirm={handleTransferMachine}
            />

            <TransferScheduleModal
                open={transferScheduleState.open}
                target={transferScheduleState.open ? transferScheduleState : null}
                todayIndex={todayIndex}
                weeklyGroups={transferWeeklyGroups}
                gridLoading={transferGridLoading}
                submitting={transferSubmitting}
                onCancel={() => setTransferScheduleState({ open: false })}
                onConfirm={handleTransferSchedule}
            />

            <Modal
                title={t('productionPlan.deleteModal.title')}
                open={deleteState != null}
                okText={t('common.delete')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true, loading: deleting }}
                onOk={confirmDelete}
                onCancel={() => setDeleteState(null)}
            >
                {t('productionPlan.deleteModal.messagePrefix')}{' '}
                <strong>
                    {pendingDeleteProduct?.code ?? t('productionPlan.deleteModal.fallbackProduct')}
                </strong>{' '}
                {t('productionPlan.deleteModal.messageSuffix')}
            </Modal>

            <Modal
                title={t('productionPlan.reorder.confirmTitle')}
                open={navConfirmOpen}
                onCancel={closeNavConfirm}
                footer={[
                    <Button key="cancel" onClick={closeNavConfirm}>
                        {t('common.cancel')}
                    </Button>,
                    <Button key="discard" danger onClick={handleNavConfirmDiscard}>
                        {t('productionPlan.reorder.discardAndContinue')}
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={savingReorder}
                        onClick={handleNavConfirmSave}
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
