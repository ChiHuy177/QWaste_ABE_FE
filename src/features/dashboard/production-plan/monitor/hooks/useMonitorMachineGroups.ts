'use client';

import { useMemo } from 'react';
import type { MonitorRowVM } from '../../components/types';

export interface MonitorMachineGroup {
    machineId: string;
    machineCode: string;
    spaceName: string;
    /** Toàn bộ plan của máy hôm nay, giữ nguyên thứ tự sequence từ BE. */
    rows: MonitorRowVM[];
    /** Plan đang "sống" của máy — ưu tiên PAUSE (cần chú ý) hơn RUNNING. */
    current: MonitorRowVM | null;
    /** Plan PENDING chưa chạy, không tính current. */
    queue: MonitorRowVM[];
    /** Plan đã COMPLETE/PARTIAL trong ngày. */
    done: MonitorRowVM[];
    totalPlanned: number;
}

/** Gom dữ liệu monitor theo máy — dùng chung cho tab Sơ đồ máy & Nhật trình ca. */
export const useMonitorMachineGroups = (products: MonitorRowVM[]): MonitorMachineGroup[] =>
    useMemo(() => {
        const map = new Map<string, MonitorRowVM[]>();
        products.forEach((p) => {
            const arr = map.get(p.machineId) ?? [];
            arr.push(p);
            map.set(p.machineId, arr);
        });

        return Array.from(map.entries())
            .map(([machineId, rows]) => {
                const { machineCode, spaceName } = rows[0];
                const pauseRow = rows.find((r) => r.status === 'PAUSE') ?? null;
                const runningRow = rows.find((r) => r.status === 'RUNNING') ?? null;
                const current = pauseRow ?? runningRow;
                const queue = rows.filter((r) => r.status === 'PENDING');
                const done = rows.filter((r) => r.status === 'COMPLETE' || r.status === 'PARTIAL');
                const totalPlanned = rows.reduce((sum, r) => sum + r.plannedQuantity, 0);
                return { machineId, machineCode, spaceName, rows, current, queue, done, totalPlanned };
            })
            .sort((a, b) => a.machineCode.localeCompare(b.machineCode));
    }, [products]);
