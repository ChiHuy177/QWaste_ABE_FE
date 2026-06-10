import type {
    ShiftBreakPeriod,
    ShiftBreakPeriodCreationRequest,
    ShiftBreakPeriodUpdationRequest,
} from '@/types/ShiftBreakPeriod';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const demoShiftBreakPeriods: ShiftBreakPeriod[] = [
    {
        breakPeriodId: 1,
        filterId: 2,
        breakNameEn: 'Morning break',
        breakNameVi: 'Nghi giua ca sang',
        breakStartTime: '10:00',
        breakEndTime: '10:15',
        sortOrder: 1,
    },
    {
        breakPeriodId: 2,
        filterId: 3,
        breakNameEn: 'Afternoon break',
        breakNameVi: 'Nghi giua ca chieu',
        breakStartTime: '16:00',
        breakEndTime: '16:15',
        sortOrder: 1,
    },
];

const getNextBreakPeriodId = () =>
    Math.max(...demoShiftBreakPeriods.map((period) => period.breakPeriodId), 0) + 1;

const findBreakPeriod = (breakPeriodId: number) => {
    const period = demoShiftBreakPeriods.find((item) => item.breakPeriodId === breakPeriodId);
    if (!period) {
        throw new Error('Demo shift break period was not found');
    }

    return period;
};

export class DemoShiftBreakPeriodService {
    static async getAllShiftBreakPeriods(filterId: number): Promise<ShiftBreakPeriod[]> {
        return clone(
            demoShiftBreakPeriods
                .filter((period) => period.filterId === filterId)
                .sort((left, right) => left.sortOrder - right.sortOrder)
        );
    }

    static async createShiftBreakPeriod(
        data: ShiftBreakPeriodCreationRequest
    ): Promise<ShiftBreakPeriod> {
        const period: ShiftBreakPeriod = {
            breakPeriodId: getNextBreakPeriodId(),
            filterId: data.filterId,
            breakNameEn: data.breakNameEn,
            breakNameVi: data.breakNameVi,
            breakStartTime: data.breakStartTime,
            breakEndTime: data.breakEndTime,
            sortOrder: data.sortOrder ?? demoShiftBreakPeriods.length + 1,
        };

        demoShiftBreakPeriods.push(period);

        return clone(period);
    }

    static async updateShiftBreakPeriods(
        updates: ShiftBreakPeriodUpdationRequest[]
    ): Promise<ShiftBreakPeriod[]> {
        updates.forEach((update) => {
            const period = findBreakPeriod(update.breakPeriodId);

            period.breakNameEn = update.breakNameEn ?? period.breakNameEn;
            period.breakNameVi = update.breakNameVi ?? period.breakNameVi;
            period.breakStartTime = update.breakStartTime ?? period.breakStartTime;
            period.breakEndTime = update.breakEndTime ?? period.breakEndTime;
            period.sortOrder = update.sortOrder ?? period.sortOrder;
        });

        return clone(demoShiftBreakPeriods);
    }

    static async deleteShiftBreakPeriod(breakPeriodId: number): Promise<void> {
        const targetIndex = demoShiftBreakPeriods.findIndex(
            (period) => period.breakPeriodId === breakPeriodId
        );
        if (targetIndex === -1) {
            throw new Error('Demo shift break period was not found');
        }

        demoShiftBreakPeriods.splice(targetIndex, 1);
    }
}
