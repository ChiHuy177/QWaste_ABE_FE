import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { ProductionPlanService } from '@/services/ProductionPlanService';
import type { Machine } from '@/types/Machine';
import { mapWeeklyGroups, type MachineInfoMap, type RawPlanData } from '../utils/planMappers';
import { productionPlanQueryKeys } from './queryKeys';
import type { MachineGroupVM } from '../components/types';

const DATE_FORMAT = 'YYYY-MM-DD';
// BE phân trang theo máy (size mặc định 20) — lấy dư để render toàn bộ lưới tuần (G9).
const MACHINE_PAGE_SIZE = 100;

interface UseWeeklyMachineGridParams {
    gridWeekStart: Dayjs;
    /** Danh sách máy tương thích (vd từ useCompatibleMachines) — nguồn dòng của lưới, luôn hiện
     * đủ kể cả tuần chưa có plan nào (BE /weekly chỉ trả máy đã có plan trong khoảng ngày đó). */
    machines: Machine[];
    machineInfoMap: MachineInfoMap;
    enabled: boolean;
}

/**
 * Lưới tuần (máy × 7 ngày) dùng chung cho modal chuyển kế hoạch (trang production-plan) và
 * bước dời lịch trong Incident Confirm (trang monitor) — fetch GET /productionPlans/v1/weekly
 * theo `gridWeekStart`, map bằng mapWeeklyGroups rồi merge với `machines` để không mất dòng máy
 * chưa có plan.
 */
export const useWeeklyMachineGrid = ({
    gridWeekStart,
    machines,
    machineInfoMap,
    enabled,
}: UseWeeklyMachineGridParams) => {
    // queryKey trùng với planQuery (view weekly) của trang production-plan chính — chia sẻ
    // cache thô RawPlanData khi trùng tuần đang xem, nên queryFn phải trả đúng shape đó.
    const weeklyGridQuery = useQuery({
        queryKey: productionPlanQueryKeys.weekly(gridWeekStart.format(DATE_FORMAT)),
        queryFn: async (): Promise<RawPlanData> => {
            const page = await ProductionPlanService.getWeeklyProductionPlans({
                startDate: gridWeekStart.format(DATE_FORMAT),
                endDate: gridWeekStart.add(6, 'day').format(DATE_FORMAT),
                size: MACHINE_PAGE_SIZE,
            });
            return { kind: 'weekly', content: page.content };
        },
        enabled,
    });

    const weeklyGroups = useMemo(() => {
        const groupsByMachineId = new Map<string, MachineGroupVM>();
        if (weeklyGridQuery.data && weeklyGridQuery.data.kind === 'weekly') {
            mapWeeklyGroups(
                weeklyGridQuery.data.content,
                machineInfoMap,
                gridWeekStart.format(DATE_FORMAT)
            ).forEach((group) => groupsByMachineId.set(group.machineId, group));
        }

        const safeMachines = Array.isArray(machines) ? machines : [];
        return safeMachines.map((machine): MachineGroupVM => {
            const machineId = String(machine.machineId);
            return (
                groupsByMachineId.get(machineId) ?? {
                    machineId,
                    machineCode: machine.machineCode || machine.machineName,
                    machineName: machine.machineName,
                    spaceName: machine.space?.spaceName ?? '',
                    products: [],
                }
            );
        });
    }, [weeklyGridQuery.data, machineInfoMap, gridWeekStart, machines]);

    return { weeklyGroups, isLoading: weeklyGridQuery.isLoading };
};
