import type { Machine } from '@/types/Machine';
import type {
    ProductionPlanDailyMachineGroup,
    ProductionPlanListItem,
    ProductionPlanStatus,
    ProductionPlanWeeklyMachineGroup,
    Schedule,
} from '@/types/ProductionPlan';
import type { MachineGroupVM, PlanRowVM } from '../_components/types';

// ─── Enrich machineName/spaceName (G2 — BE group response chỉ có machineId/Code) ───

export interface MachineInfo {
    machineName: string;
    spaceName: string;
}

export type MachineInfoMap = Map<string, MachineInfo>;

export function buildMachineInfoMap(machines: Machine[]): MachineInfoMap {
    const map: MachineInfoMap = new Map();
    machines.forEach((machine) => {
        map.set(String(machine.machineId), {
            machineName: machine.machineName ?? '',
            spaceName: machine.space?.spaceName ?? '',
        });
    });
    return map;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_SCHEDULE: Schedule = [0, 0, 0, 0, 0, 0, 0];

const MS_PER_DAY = 86_400_000;

/** Parse 'yyyy-MM-dd' thành mốc UTC — tránh lệch ngày do timezone của Date(). */
const parseIsoDateUtc = (isoDate: string): number => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
};

/** Index Mon..Sun (0..6) của `date` so với `weekStart`; ngoài tuần trả -1. */
export function dayIndexFromWeekStart(date: string, weekStart: string): number {
    const diff = Math.round((parseIsoDateUtc(date) - parseIsoDateUtc(weekStart)) / MS_PER_DAY);
    return diff >= 0 && diff <= 6 ? diff : -1;
}

const sortRows = (rows: PlanRowVM[]): PlanRowVM[] =>
    [...rows].sort((a, b) => {
        const seqA = a.sequence ?? Number.POSITIVE_INFINITY;
        const seqB = b.sequence ?? Number.POSITIVE_INFINITY;
        if (seqA !== seqB) return seqA - seqB;
        return a.code.localeCompare(b.code);
    });

const buildGroupVM = (
    machineId: string,
    machineCode: string,
    machineInfoMap: MachineInfoMap,
    products: PlanRowVM[]
): MachineGroupVM => {
    const info = machineInfoMap.get(String(machineId));
    return {
        machineId,
        machineCode,
        machineName: info?.machineName ?? '',
        spaceName: info?.spaceName ?? '',
        products: sortRows(products),
    };
};

// ─── Daily ───────────────────────────────────────────────────────────────────

/**
 * Map response GET /productionPlans/v1/daily → view-model bảng.
 * Mỗi list item = 1 plan của đúng ngày `dayIndex` (Mon=0..Sun=6).
 */
/**
 * Map the GET /productionPlans/v1/daily response → table view-model.
 * Each list item = 1 plan for the exact `dayIndex` (Mon=0..Sun=6).
 */
export function mapDailyGroups(
    groups: ProductionPlanDailyMachineGroup[],
    machineInfoMap: MachineInfoMap,
    dayIndex: number
): MachineGroupVM[] {
    return groups.map((group) => {
        const products = group.productionPlans.map((plan): PlanRowVM => {
            const schedule = [...EMPTY_SCHEDULE] as Schedule;
            schedule[dayIndex] = plan.plannedQuantity;

            const planIdsByDay = new Array<string | null>(7).fill(null);
            planIdsByDay[dayIndex] = plan.productionPlanId;

            return {
                rowKey: plan.productionPlanId,
                productionPlanId: plan.productionPlanId,
                planIdsByDay,
                code: plan.productionPlanCode,
                name: plan.productionPlanName,
                moldCode: plan.snapshotMoldCode,
                schedule,
                status: plan.status,
                sequence: plan.sequence,
                isDeleted: plan.isDeleted,
            };
        });

        return buildGroupVM(group.machineId, group.machineCode, machineInfoMap, products);
    });
}

// ─── Weekly (pivot — G4) ─────────────────────────────────────────────────────

interface WeeklyRowAccumulator {
    row: PlanRowVM;
    statusesByDay: (ProductionPlanStatus | null)[];
    deletedFlags: boolean[];
}

/**
 * Status đại diện cho dòng weekly: status của ngày sớm nhất chưa COMPLETE;
 * mọi ngày đều COMPLETE → COMPLETE.
 */
/**
 * Status representing the weekly row: the status of the earliest day that is not COMPLETE;
 * all days are COMPLETE → COMPLETE.
 */
const resolveWeeklyStatus = (
    statusesByDay: (ProductionPlanStatus | null)[]
): ProductionPlanStatus => {
    for (const status of statusesByDay) {
        if (status && status !== 'COMPLETE') return status;
    }
    return 'COMPLETE';
};

/**
 * Map response GET /productionPlans/v1/weekly → view-model bảng.
 * BE trả mỗi (machine, date) một danh sách plan; FE pivot các plan cùng
 * `code|moldCode` thành 1 dòng với schedule 7 ngày tính từ `weekStart` (Monday,
 * 'yyyy-MM-dd'). Plan trùng key trong cùng ngày (tạo tay) được cộng dồn qty,
 * giữ id plan đầu tiên.
 */
/**
 * Map the GET /productionPlans/v1/weekly response → table view-model.
 * The BE returns a list of plans for each (machine, date); the FE pivots plans with the same
 * `code|moldCode` into 1 row with a 7-day schedule starting from `weekStart` (Monday,
 * 'yyyy-MM-dd'). Plans with duplicate keys on the same day (manually created) have their qty accumulated,
 * keeping the id of the first plan.
 */
export function mapWeeklyGroups(
    groups: ProductionPlanWeeklyMachineGroup[],
    machineInfoMap: MachineInfoMap,
    weekStart: string
): MachineGroupVM[] {
    return groups.map((group) => {
        const rowsByKey = new Map<string, WeeklyRowAccumulator>();

        group.days.forEach((day) => {
            const dayIndex = dayIndexFromWeekStart(day.date, weekStart);
            if (dayIndex < 0) return;

            day.productionPlans.forEach((plan: ProductionPlanListItem) => {
                const key = `${plan.productionPlanCode}|${plan.snapshotMoldCode ?? ''}`;
                let accumulator = rowsByKey.get(key);

                if (!accumulator) {
                    accumulator = {
                        row: {
                            rowKey: `${group.machineId}|${key}`,
                            productionPlanId: plan.productionPlanId,
                            planIdsByDay: new Array<string | null>(7).fill(null),
                            code: plan.productionPlanCode,
                            name: plan.productionPlanName,
                            moldCode: plan.snapshotMoldCode,
                            schedule: [...EMPTY_SCHEDULE] as Schedule,
                            status: plan.status,
                            sequence: null,
                            isDeleted: true,
                        },
                        statusesByDay: new Array<ProductionPlanStatus | null>(7).fill(null),
                        deletedFlags: [],
                    };
                    rowsByKey.set(key, accumulator);
                }

                const { row, statusesByDay, deletedFlags } = accumulator;
                row.schedule[dayIndex] += plan.plannedQuantity;
                row.planIdsByDay[dayIndex] ??= plan.productionPlanId;
                statusesByDay[dayIndex] ??= plan.status;
                deletedFlags.push(plan.isDeleted);

                if (plan.sequence != null) {
                    row.sequence =
                        row.sequence == null
                            ? plan.sequence
                            : Math.min(row.sequence, plan.sequence);
                }
            });
        });

        const products = Array.from(rowsByKey.values()).map(
            ({ row, statusesByDay, deletedFlags }): PlanRowVM => ({
                ...row,
                productionPlanId:
                    row.planIdsByDay.find((id): id is string => id != null) ?? row.productionPlanId,
                status: resolveWeeklyStatus(statusesByDay),
                isDeleted: deletedFlags.every(Boolean),
            })
        );

        return buildGroupVM(group.machineId, group.machineCode, machineInfoMap, products);
    });
}

// ─── Monitor status grouping (PARTIAL gộp vào nhóm COMPLETE — plan đã đóng, không còn thao tác được) ───

/** Key nhóm hiển thị trên monitor — trùng key i18n productionPlan.monitor.status.* hiện có. */
export type MonitorGroupKey = 'TODO' | 'IN_PROGRESS' | 'PAUSE' | 'COMPLETE';

export const MONITOR_GROUP_ORDER: MonitorGroupKey[] = ['TODO', 'IN_PROGRESS', 'PAUSE', 'COMPLETE'];

export const MONITOR_GROUP_BY_STATUS: Record<ProductionPlanStatus, MonitorGroupKey> = {
    PENDING: 'TODO',
    RUNNING: 'IN_PROGRESS',
    PAUSE: 'PAUSE',
    PARTIAL: 'COMPLETE',
    COMPLETE: 'COMPLETE',
};

/** Token theme cần để suy ra màu nhóm — subset của antd GlobalToken. */
export interface MonitorGroupColorToken {
    colorInfo: string;
    colorWarning: string;
    colorSuccess: string;
}

/**
 * Mã màu chủ đạo của mỗi nhóm monitor — nguồn dùng chung cho pill trạng thái trên header
 * Collapse (`useMonitorGroups.ts`) và mọi nơi khác cần hiển thị màu đồng bộ với nó (vd Timeline
 * lịch sử trạng thái ở `ProductDetailModal.tsx`).
 */
export function monitorGroupColor(group: MonitorGroupKey, token: MonitorGroupColorToken): string {
    switch (group) {
        case 'TODO':
            return '#722ed1';
        case 'IN_PROGRESS':
            return token.colorInfo;
        case 'PAUSE':
            return token.colorWarning;
        case 'COMPLETE':
            return token.colorSuccess;
    }
}
