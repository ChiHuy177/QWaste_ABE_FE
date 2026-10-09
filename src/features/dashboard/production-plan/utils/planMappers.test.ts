import type {
    ProductionPlanDailyMachineGroup,
    ProductionPlanListItem,
    ProductionPlanWeeklyMachineGroup,
} from '@/types/ProductionPlan';
import {
    MONITOR_GROUP_BY_STATUS,
    buildMachineInfoMap,
    dayIndexFromWeekStart,
    mapDailyGroups,
    mapWeeklyGroups,
} from './planMappers';
import type { Machine } from '@/types/Machine';

const listItem = (overrides: Partial<ProductionPlanListItem>): ProductionPlanListItem => ({
    productionPlanId: 'plan-1',
    productionPlanCode: 'SP-001',
    productionPlanName: 'Sản phẩm 1',
    snapshotMoldCode: 'M-01',
    plannedQuantity: 10,
    actualQuantity: null,
    status: 'PENDING',
    sequence: 1,
    isDeleted: false,
    ...overrides,
});

const machineInfoMap = buildMachineInfoMap([
    {
        machineId: 'mac-1',
        machineName: 'Máy ép 01',
        space: { spaceName: 'Chuyền A' },
    } as unknown as Machine,
]);

describe('dayIndexFromWeekStart', () => {
    it('trả 0..6 trong tuần, -1 ngoài tuần', () => {
        expect(dayIndexFromWeekStart('2026-07-06', '2026-07-06')).toBe(0); // Mon
        expect(dayIndexFromWeekStart('2026-07-12', '2026-07-06')).toBe(6); // Sun
        expect(dayIndexFromWeekStart('2026-07-13', '2026-07-06')).toBe(-1);
        expect(dayIndexFromWeekStart('2026-07-05', '2026-07-06')).toBe(-1);
    });
});

describe('mapDailyGroups', () => {
    const groups: ProductionPlanDailyMachineGroup[] = [
        {
            machineId: 'mac-1',
            machineCode: 'EP01',
            productionPlans: [
                listItem({ productionPlanId: 'p2', sequence: 2 }),
                listItem({ productionPlanId: 'p1', sequence: 1, productionPlanCode: 'SP-002' }),
                listItem({ productionPlanId: 'p3', sequence: null }),
            ],
        },
    ];

    it('set schedule đúng ô dayIndex và enrich machine info', () => {
        const [group] = mapDailyGroups(groups, machineInfoMap, 2); // Wed

        expect(group.machineCode).toBe('EP01');
        expect(group.machineName).toBe('Máy ép 01');
        expect(group.spaceName).toBe('Chuyền A');

        const row = group.products.find((p) => p.productionPlanId === 'p1')!;
        expect(row.schedule).toEqual([0, 0, 10, 0, 0, 0, 0]);
        expect(row.planIdsByDay[2]).toBe('p1');
        expect(row.planIdsByDay[0]).toBeNull();
    });

    it('sort theo sequence ASC, null xuống cuối', () => {
        const [group] = mapDailyGroups(groups, machineInfoMap, 0);
        expect(group.products.map((p) => p.productionPlanId)).toEqual(['p1', 'p2', 'p3']);
    });

    it('machine không có trong map → fallback rỗng', () => {
        const [group] = mapDailyGroups(
            [{ ...groups[0], machineId: 'unknown' }],
            machineInfoMap,
            0
        );
        expect(group.spaceName).toBe('');
        expect(group.machineName).toBe('');
    });
});

describe('mapWeeklyGroups', () => {
    const weekStart = '2026-07-06'; // Monday

    const groups: ProductionPlanWeeklyMachineGroup[] = [
        {
            machineId: 'mac-1',
            machineCode: 'EP01',
            days: [
                {
                    date: '2026-07-06', // Mon
                    productionPlans: [
                        listItem({ productionPlanId: 'mon-a', plannedQuantity: 5, status: 'COMPLETE' }),
                        listItem({
                            productionPlanId: 'mon-b',
                            productionPlanCode: 'SP-001',
                            snapshotMoldCode: 'M-02', // khác mold → dòng riêng
                            plannedQuantity: 3,
                        }),
                    ],
                },
                {
                    date: '2026-07-08', // Wed
                    productionPlans: [
                        listItem({
                            productionPlanId: 'wed-a',
                            plannedQuantity: 7,
                            status: 'RUNNING',
                            sequence: 5,
                        }),
                    ],
                },
            ],
        },
    ];

    it('pivot cùng code|mold thành 1 dòng, 7 ngày tính từ weekStart', () => {
        const [group] = mapWeeklyGroups(groups, machineInfoMap, weekStart);

        const pivoted = group.products.find((p) => p.moldCode === 'M-01')!;
        expect(pivoted.schedule).toEqual([5, 0, 7, 0, 0, 0, 0]);
        expect(pivoted.planIdsByDay[0]).toBe('mon-a');
        expect(pivoted.planIdsByDay[2]).toBe('wed-a');
        expect(pivoted.planIdsByDay[1]).toBeNull();
    });

    it('khác mold → tách dòng riêng', () => {
        const [group] = mapWeeklyGroups(groups, machineInfoMap, weekStart);
        expect(group.products).toHaveLength(2);
        const other = group.products.find((p) => p.moldCode === 'M-02')!;
        expect(other.schedule).toEqual([3, 0, 0, 0, 0, 0, 0]);
    });

    it('status = ngày sớm nhất chưa COMPLETE; sequence = min các ngày', () => {
        const [group] = mapWeeklyGroups(groups, machineInfoMap, weekStart);
        const pivoted = group.products.find((p) => p.moldCode === 'M-01')!;
        expect(pivoted.status).toBe('RUNNING'); // Mon COMPLETE → lấy Wed
        expect(pivoted.sequence).toBe(1); // min(1, 5)
    });

    it('toàn bộ ngày COMPLETE → COMPLETE; toàn bộ deleted → isDeleted', () => {
        const allDone: ProductionPlanWeeklyMachineGroup[] = [
            {
                machineId: 'mac-1',
                machineCode: 'EP01',
                days: [
                    {
                        date: '2026-07-06',
                        productionPlans: [
                            listItem({ status: 'COMPLETE', isDeleted: true }),
                        ],
                    },
                    {
                        date: '2026-07-07',
                        productionPlans: [
                            listItem({
                                productionPlanId: 'p-tue',
                                status: 'COMPLETE',
                                isDeleted: true,
                            }),
                        ],
                    },
                ],
            },
        ];

        const [group] = mapWeeklyGroups(allDone, machineInfoMap, weekStart);
        expect(group.products[0].status).toBe('COMPLETE');
        expect(group.products[0].isDeleted).toBe(true);
    });

    it('ngày ngoài tuần bị bỏ qua', () => {
        const outOfRange: ProductionPlanWeeklyMachineGroup[] = [
            {
                machineId: 'mac-1',
                machineCode: 'EP01',
                days: [{ date: '2026-07-20', productionPlans: [listItem({})] }],
            },
        ];

        const [group] = mapWeeklyGroups(outOfRange, machineInfoMap, weekStart);
        expect(group.products).toHaveLength(0);
    });
});

describe('MONITOR_GROUP_BY_STATUS', () => {
    it('PARTIAL gộp vào nhóm PAUSE (quyết định G1)', () => {
        expect(MONITOR_GROUP_BY_STATUS.PARTIAL).toBe('PAUSE');
        expect(MONITOR_GROUP_BY_STATUS.PENDING).toBe('TODO');
        expect(MONITOR_GROUP_BY_STATUS.RUNNING).toBe('IN_PROGRESS');
        expect(MONITOR_GROUP_BY_STATUS.COMPLETE).toBe('COMPLETE');
    });
});
