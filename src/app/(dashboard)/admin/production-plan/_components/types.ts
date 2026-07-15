import type { Dayjs } from 'dayjs';
import type { ProductionPlanStatus, Schedule } from '@/types/ProductionPlan';

export type { Schedule } from '@/types/ProductionPlan';

// ─── View-model từ dữ liệu BE (thay ProductionLine/ProductionProduct mock) ───


/**
 * Một dòng sản phẩm trên bảng daily/weekly/matrix.
 *
 * Daily: dòng = 1 plan BE — `planIdsByDay` chỉ set tại ô của ngày đang xem.
 * Weekly: dòng = pivot các plan cùng `code|moldCode` trong tuần — mỗi ngày là
 * 1 plan riêng bên BE, id từng ngày nằm ở `planIdsByDay[0..6]` (Mon..Sun).
 */
export interface PlanRowVM {
    /** Key ổn định cho rowKey/sortable: daily = productionPlanId; weekly = machineId|code|moldCode */
    rowKey: string;
    /** Daily: id plan của ngày đang xem. Weekly: id đầu tiên khác null trong planIdsByDay. */
    productionPlanId: string;
    planIdsByDay: (string | null)[];
    code: string;
    name: string;
    moldCode: string | null;
    /** plannedQuantity theo ngày Mon..Sun; daily chỉ có ô ngày đang xem. */
    schedule: Schedule;
    /**
     * Daily: status plan. Weekly: status của ngày sớm nhất chưa COMPLETE
     * (toàn bộ COMPLETE → COMPLETE).
     */
    status: ProductionPlanStatus;
    /** Weekly: min sequence khác null giữa các ngày. */
    sequence: number | null;
    /** Weekly: true khi TẤT CẢ plan cấu thành đã soft-delete. */
    isDeleted: boolean;
}

/** Một nhóm máy trên bảng — thay ProductionLine (BE nhóm theo machine, không theo space). */
export interface MachineGroupVM {
    machineId: string;
    machineCode: string;
    /** Enrich từ machine list (BE group response không có) — fallback ''. */
    machineName: string;
    spaceName: string;
    /** Đã sort theo sequence ASC (null cuối), tiebreak theo code. */
    products: PlanRowVM[];
}

/** Một dòng trên trang monitor — 1 plan của hôm nay, status realtime từ WS. */
export interface MonitorRowVM {
    productionPlanId: string;
    code: string;
    name: string;
    machineId: string;
    machineCode: string;
    spaceName: string;
    moldCode: string | null;
    plannedQuantity: number;
    status: ProductionPlanStatus;
    updatedAt: Date | null;
}

// ─── Form & modal states (id-based — dữ liệu refetch được, index dễ lệch) ────

export interface SelectOptionVM {
    value: string;
    label: string;
}

/** Giá trị PlanFormModal — page tự build request BE từ đây. */
export interface PlanFormValues {
    code: string;
    name: string;
    /** create-only */
    machineId?: string;
    /** Bắt buộc ở cả create/edit — edit được prefill khuôn hiện tại nên luôn có giá trị. */
    moldId?: string;
    /** create-only */
    plannedDate?: Dayjs;
    plannedQuantity: number;
    /** create-only */
    note?: string;
}

export type PlanModalState =
    | { open: false }
    | { open: true; mode: 'create' }
    | { open: true; mode: 'edit'; machineId: string; row: PlanRowVM };

export interface PlanRowTarget {
    machineId: string;
    machineCode: string;
    row: PlanRowVM;
}

export type TransferState = { open: false } | ({ open: true } & PlanRowTarget);
