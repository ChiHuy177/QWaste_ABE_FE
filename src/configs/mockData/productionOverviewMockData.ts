import dayjs from 'dayjs';

export type TimelineGranularity = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface KpiSummaryData {
    oee: {
        current: number;
        target: number;
        yesterdayDiff: number;
        statusTag: string;
    };
    downtimeMinutes: {
        current: number;
        overTargetMinutes: number;
    };
    yieldRate: {
        current: number;
        targetText: string;
    };
    actualProduction: {
        current: number;
        target: number;
        unit: string;
    };
}

export interface MachineOeeData {
    machineCode: string;
    oee: number;
    target: number;
}

export interface MachineOutputData {
    machineCode: string;
    planned: number;
    actual: number;
}

export interface ProductOutputData {
    productCode: string;
    planned: number;
    actual: number;
}

export interface OutputTimelinePoint {
    label: string; // e.g. "00:00", "T2 17/08", "Tuần 1", "T1"
    actual: number;
    planned?: number; // Present when granularity is DAY, WEEK, or MONTH
    stoppageNote?: string;
}

export interface DailyEfficiencyPoint {
    date: string; // "11/08", "12/08", ..., "17/08"
    efficiency: number;
    target: number;
}

export interface MachineDetailInfo {
    machineCode: string;
    machineName: string;
    lineName: string;
    status: 'RUNNING' | 'STOPPED';
    operatorName: string;
    shiftTime: string;
    updatedAt: string;
    runningSku: string;
    stoppageReason?: string;
    stoppageTimeAccumulated?: number;
}

export interface MachineDetailMockPayload {
    info: MachineDetailInfo;
    kpi: KpiSummaryData;
    granularity: TimelineGranularity;
    hasPlanLine: boolean;
    outputTimeline: OutputTimelinePoint[];
    recent7DaysEfficiency: DailyEfficiencyPoint[];
}

export interface ProductionOverviewMockPayload {
    kpi: KpiSummaryData;
    machineOeeList: MachineOeeData[];
    machineOutputList: MachineOutputData[];
    productOutputList: ProductOutputData[];
}

export interface FilterContextParams {
    mode: 'PRESET' | 'CUSTOM_RANGE';
    periodId?: number | null;
    periodCode?: string | null;
    displayNameVi?: string | null;
    displayNameEn?: string | null;
    category?: 'PERIOD' | 'SHIFT' | null;
    shiftId?: number | null;
    startDate?: string;
    endDate?: string;
}

// Base single-day (shift) overview mock - Date: 17/08/2026 (Monday)
export const BASE_DAILY_OVERVIEW_MOCK: ProductionOverviewMockPayload = {
    kpi: {
        oee: {
            current: 74.2,
            target: 85.0,
            yesterdayDiff: -3.8,
            statusTag: 'Vùng cải thiện (70–84%)',
        },
        downtimeMinutes: {
            current: 265,
            overTargetMinutes: 125,
        },
        yieldRate: {
            current: 83.9,
            targetText: 'So với kế hoạch',
        },
        actualProduction: {
            current: 6542,
            target: 7800,
            unit: 'sp',
        },
    },
    machineOeeList: [
        { machineCode: 'CNC-01', oee: 88, target: 85 },
        { machineCode: 'CNC-02', oee: 78, target: 85 },
        { machineCode: 'CNC-03', oee: 62, target: 85 },
        { machineCode: 'CNC-04', oee: 92, target: 85 },
        { machineCode: 'LASER-01', oee: 72, target: 85 },
        { machineCode: 'LASER-02', oee: 85, target: 85 },
        { machineCode: 'PRESS-01', oee: 67, target: 85 },
        { machineCode: 'PRESS-02', oee: 79, target: 85 },
    ],
    machineOutputList: [
        { machineCode: 'CNC-01', planned: 1400, actual: 1350 },
        { machineCode: 'CNC-02', planned: 1200, actual: 1100 },
        { machineCode: 'CNC-03', planned: 1000, actual: 750 },
        { machineCode: 'CNC-04', planned: 1500, actual: 1520 },
        { machineCode: 'LASER-01', planned: 1100, actual: 900 },
        { machineCode: 'LASER-02', planned: 1000, actual: 980 },
        { machineCode: 'PRESS-01', planned: 900, actual: 650 },
        { machineCode: 'PRESS-02', planned: 1300, actual: 1180 },
    ],
    productOutputList: [
        { productCode: 'SP-1142', planned: 800, actual: 820 },
        { productCode: 'SP-2887', planned: 600, actual: 580 },
        { productCode: 'SP-3301', planned: 400, actual: 250 },
        { productCode: 'SP-4455', planned: 900, actual: 940 },
        { productCode: 'SP-5512', planned: 500, actual: 0 },
        { productCode: 'SP-6678', planned: 650, actual: 600 },
        { productCode: 'SP-7734', planned: 550, actual: 380 },
        { productCode: 'SP-6898', planned: 700, actual: 660 },
    ],
};

export const INITIAL_PRODUCTION_OVERVIEW_MOCK = BASE_DAILY_OVERVIEW_MOCK;

// Multi-tier timeline configurations per machine
interface BaseMachineConfig {
    info: MachineDetailInfo;
    baseKpi: KpiSummaryData;
    hourlyTimeline: OutputTimelinePoint[];
    dailyTimeline: OutputTimelinePoint[];
    weeklyTimeline: OutputTimelinePoint[];
    monthlyTimeline: OutputTimelinePoint[];
    recent7DaysEfficiency: DailyEfficiencyPoint[];
}

export const BASE_MACHINE_CONFIGS: Record<string, BaseMachineConfig> = {
    'CNC-03': {
        info: {
            machineCode: 'CNC-03',
            machineName: 'Máy Phay CNC 03',
            lineName: 'Dây chuyền A',
            status: 'STOPPED',
            operatorName: 'Nguyễn Đức Thắng',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-3301',
            stoppageReason: 'Gãy dao phay số 3',
            stoppageTimeAccumulated: 32,
        },
        baseKpi: {
            oee: {
                current: 62.3,
                target: 85.0,
                yesterdayDiff: -5.4,
                statusTag: 'Cần cải thiện (<70%)',
            },
            downtimeMinutes: {
                current: 157,
                overTargetMinutes: 67,
            },
            yieldRate: {
                current: 75.0,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 750,
                target: 1000,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 125 },
            { label: '01:00', actual: 130 },
            { label: '02:00', actual: 128 },
            { label: '03:00', actual: 115 },
            { label: '04:00', actual: 110 },
            { label: '05:00', actual: 95, stoppageNote: 'Dừng máy từ 05:12 - Gãy dao phay số 3. Thời gian dừng tích lũy: 32 phút.' },
            { label: '06:00', actual: 0 },
            { label: '07:00', actual: 0 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 950, actual: 980 },
            { label: 'T4 12/08', planned: 1100, actual: 910 },
            { label: 'T5 13/08', planned: 1050, actual: 870 },
            { label: 'T6 14/08', planned: 1200, actual: 1020 },
            { label: 'T7 15/08', planned: 1150, actual: 890 },
            { label: 'CN 16/08', planned: 850, actual: 940 },
            { label: 'T2 17/08', planned: 1000, actual: 750, stoppageNote: 'Dừng máy 157 phút ngày 17/08' },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 5800, actual: 5800 },
            { label: 'Tuần 2 (08-14/08)', planned: 6400, actual: 5650 },
            { label: 'Tuần 3 (15-21/08)', planned: 6100, actual: 4800, stoppageNote: 'Sự cố gãy dao phay tuần 3' },
            { label: 'Tuần 4 (22-28/08)', planned: 6700, actual: 5900 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 24500, actual: 24200 },
            { label: 'T2', planned: 21000, actual: 21800 },
            { label: 'T3', planned: 26800, actual: 25900 },
            { label: 'T4', planned: 25200, actual: 24700 },
            { label: 'T5', planned: 27500, actual: 26100 },
            { label: 'T6', planned: 24800, actual: 23800 },
            { label: 'T7', planned: 26200, actual: 25400 },
            { label: 'T8', planned: 25500, actual: 22500 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 86, target: 85 },
            { date: '12/08', efficiency: 78, target: 85 },
            { date: '13/08', efficiency: 74, target: 85 },
            { date: '14/08', efficiency: 89, target: 85 },
            { date: '15/08', efficiency: 76, target: 85 },
            { date: '16/08', efficiency: 82, target: 85 },
            { date: '17/08', efficiency: 62, target: 85 },
        ],
    },
    'CNC-01': {
        info: {
            machineCode: 'CNC-01',
            machineName: 'Máy Phay CNC 01',
            lineName: 'Dây chuyền A',
            status: 'RUNNING',
            operatorName: 'Trần Văn Hoàng',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-1142',
        },
        baseKpi: {
            oee: {
                current: 88.5,
                target: 85.0,
                yesterdayDiff: 2.1,
                statusTag: 'Đạt mục tiêu (≥85%)',
            },
            downtimeMinutes: {
                current: 25,
                overTargetMinutes: 0,
            },
            yieldRate: {
                current: 96.4,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 1350,
                target: 1400,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 165 },
            { label: '01:00', actual: 172 },
            { label: '02:00', actual: 168 },
            { label: '03:00', actual: 175 },
            { label: '04:00', actual: 170 },
            { label: '05:00', actual: 162 },
            { label: '06:00', actual: 168 },
            { label: '07:00', actual: 170 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 1350, actual: 1380 },
            { label: 'T4 12/08', planned: 1420, actual: 1350 },
            { label: 'T5 13/08', planned: 1380, actual: 1410 },
            { label: 'T6 14/08', planned: 1500, actual: 1390 },
            { label: 'T7 15/08', planned: 1450, actual: 1370 },
            { label: 'CN 16/08', planned: 1200, actual: 1420 },
            { label: 'T2 17/08', planned: 1400, actual: 1350 },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 8100, actual: 8350 },
            { label: 'Tuần 2 (08-14/08)', planned: 8800, actual: 8420 },
            { label: 'Tuần 3 (15-21/08)', planned: 8300, actual: 8300 },
            { label: 'Tuần 4 (22-28/08)', planned: 8900, actual: 8500 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 34000, actual: 34800 },
            { label: 'T2', planned: 31000, actual: 32400 },
            { label: 'T3', planned: 37500, actual: 36200 },
            { label: 'T4', planned: 35200, actual: 35100 },
            { label: 'T5', planned: 38000, actual: 36400 },
            { label: 'T6', planned: 34500, actual: 34900 },
            { label: 'T7', planned: 37000, actual: 35800 },
            { label: 'T8', planned: 36500, actual: 35500 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 88, target: 85 },
            { date: '12/08', efficiency: 85, target: 85 },
            { date: '13/08', efficiency: 89, target: 85 },
            { date: '14/08', efficiency: 87, target: 85 },
            { date: '15/08', efficiency: 86, target: 85 },
            { date: '16/08', efficiency: 90, target: 85 },
            { date: '17/08', efficiency: 88, target: 85 },
        ],
    },
    'CNC-02': {
        info: {
            machineCode: 'CNC-02',
            machineName: 'Máy Phay CNC 02',
            lineName: 'Dây chuyền A',
            status: 'RUNNING',
            operatorName: 'Lê Quốc Anh',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-2887',
        },
        baseKpi: {
            oee: {
                current: 78.0,
                target: 85.0,
                yesterdayDiff: -1.2,
                statusTag: 'Vùng cải thiện (70–84%)',
            },
            downtimeMinutes: {
                current: 45,
                overTargetMinutes: 15,
            },
            yieldRate: {
                current: 91.6,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 1100,
                target: 1200,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 140 },
            { label: '01:00', actual: 145 },
            { label: '02:00', actual: 138 },
            { label: '03:00', actual: 142 },
            { label: '04:00', actual: 135 },
            { label: '05:00', actual: 120 },
            { label: '06:00', actual: 138 },
            { label: '07:00', actual: 142 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 1150, actual: 1150 },
            { label: 'T4 12/08', planned: 1250, actual: 1120 },
            { label: 'T5 13/08', planned: 1180, actual: 1080 },
            { label: 'T6 14/08', planned: 1300, actual: 1140 },
            { label: 'T7 15/08', planned: 1220, actual: 1130 },
            { label: 'CN 16/08', planned: 1000, actual: 1160 },
            { label: 'T2 17/08', planned: 1200, actual: 1100 },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 7000, actual: 6850 },
            { label: 'Tuần 2 (08-14/08)', planned: 7500, actual: 6900 },
            { label: 'Tuần 3 (15-21/08)', planned: 7100, actual: 6780 },
            { label: 'Tuần 4 (22-28/08)', planned: 7800, actual: 7050 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 29500, actual: 28900 },
            { label: 'T2', planned: 26500, actual: 27100 },
            { label: 'T3', planned: 32000, actual: 30200 },
            { label: 'T4', planned: 30500, actual: 29400 },
            { label: 'T5', planned: 32500, actual: 30500 },
            { label: 'T6', planned: 29800, actual: 28800 },
            { label: 'T7', planned: 31500, actual: 29900 },
            { label: 'T8', planned: 31000, actual: 29100 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 82, target: 85 },
            { date: '12/08', efficiency: 79, target: 85 },
            { date: '13/08', efficiency: 77, target: 85 },
            { date: '14/08', efficiency: 81, target: 85 },
            { date: '15/08', efficiency: 80, target: 85 },
            { date: '16/08', efficiency: 83, target: 85 },
            { date: '17/08', efficiency: 78, target: 85 },
        ],
    },
    'CNC-04': {
        info: {
            machineCode: 'CNC-04',
            machineName: 'Máy Phay CNC 04',
            lineName: 'Dây chuyền A',
            status: 'RUNNING',
            operatorName: 'Phạm Minh Tuấn',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-4455',
        },
        baseKpi: {
            oee: {
                current: 92.4,
                target: 85.0,
                yesterdayDiff: 3.5,
                statusTag: 'Đạt mục tiêu (≥85%)',
            },
            downtimeMinutes: {
                current: 18,
                overTargetMinutes: 0,
            },
            yieldRate: {
                current: 101.3,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 1520,
                target: 1500,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 190 },
            { label: '01:00', actual: 195 },
            { label: '02:00', actual: 188 },
            { label: '03:00', actual: 192 },
            { label: '04:00', actual: 190 },
            { label: '05:00', actual: 185 },
            { label: '06:00', actual: 190 },
            { label: '07:00', actual: 190 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 1450, actual: 1510 },
            { label: 'T4 12/08', planned: 1550, actual: 1490 },
            { label: 'T5 13/08', planned: 1480, actual: 1540 },
            { label: 'T6 14/08', planned: 1600, actual: 1500 },
            { label: 'T7 15/08', planned: 1520, actual: 1530 },
            { label: 'CN 16/08', planned: 1300, actual: 1560 },
            { label: 'T2 17/08', planned: 1500, actual: 1520 },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 8800, actual: 9150 },
            { label: 'Tuần 2 (08-14/08)', planned: 9400, actual: 9100 },
            { label: 'Tuần 3 (15-21/08)', planned: 8900, actual: 9200 },
            { label: 'Tuần 4 (22-28/08)', planned: 9600, actual: 9250 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 37500, actual: 38500 },
            { label: 'T2', planned: 33000, actual: 35600 },
            { label: 'T3', planned: 40500, actual: 39400 },
            { label: 'T4', planned: 38200, actual: 38200 },
            { label: 'T5', planned: 41000, actual: 39800 },
            { label: 'T6', planned: 37800, actual: 38700 },
            { label: 'T7', planned: 40000, actual: 39200 },
            { label: 'T8', planned: 39000, actual: 39500 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 91, target: 85 },
            { date: '12/08', efficiency: 89, target: 85 },
            { date: '13/08', efficiency: 93, target: 85 },
            { date: '14/08', efficiency: 90, target: 85 },
            { date: '15/08', efficiency: 92, target: 85 },
            { date: '16/08', efficiency: 94, target: 85 },
            { date: '17/08', efficiency: 92, target: 85 },
        ],
    },
    'LASER-01': {
        info: {
            machineCode: 'LASER-01',
            machineName: 'Máy Cắt Laser 01',
            lineName: 'Dây chuyền B',
            status: 'RUNNING',
            operatorName: 'Vũ Đức Thịnh',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-5512',
        },
        baseKpi: {
            oee: {
                current: 72.1,
                target: 85.0,
                yesterdayDiff: -2.3,
                statusTag: 'Vùng cải thiện (70–84%)',
            },
            downtimeMinutes: {
                current: 58,
                overTargetMinutes: 28,
            },
            yieldRate: {
                current: 81.8,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 900,
                target: 1100,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 115 },
            { label: '01:00', actual: 118 },
            { label: '02:00', actual: 110 },
            { label: '03:00', actual: 112 },
            { label: '04:00', actual: 115 },
            { label: '05:00', actual: 105 },
            { label: '06:00', actual: 110 },
            { label: '07:00', actual: 115 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 1050, actual: 950 },
            { label: 'T4 12/08', planned: 1200, actual: 980 },
            { label: 'T5 13/08', planned: 980, actual: 920 },
            { label: 'T6 14/08', planned: 1280, actual: 960 },
            { label: 'T7 15/08', planned: 1150, actual: 930 },
            { label: 'CN 16/08', planned: 850, actual: 970 },
            { label: 'T2 17/08', planned: 1100, actual: 900 },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 6400, actual: 5700 },
            { label: 'Tuần 2 (08-14/08)', planned: 7200, actual: 5850 },
            { label: 'Tuần 3 (15-21/08)', planned: 6100, actual: 5600 },
            { label: 'Tuần 4 (22-28/08)', planned: 7600, actual: 5900 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 27500, actual: 24500 },
            { label: 'T2', planned: 23500, actual: 22100 },
            { label: 'T3', planned: 29800, actual: 25200 },
            { label: 'T4', planned: 26500, actual: 23800 },
            { label: 'T5', planned: 30200, actual: 24900 },
            { label: 'T6', planned: 27000, actual: 23500 },
            { label: 'T7', planned: 29500, actual: 24800 },
            { label: 'T8', planned: 28000, actual: 23900 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 75, target: 85 },
            { date: '12/08', efficiency: 78, target: 85 },
            { date: '13/08', efficiency: 72, target: 85 },
            { date: '14/08', efficiency: 76, target: 85 },
            { date: '15/08', efficiency: 73, target: 85 },
            { date: '16/08', efficiency: 77, target: 85 },
            { date: '17/08', efficiency: 72, target: 85 },
        ],
    },
    'LASER-02': {
        info: {
            machineCode: 'LASER-02',
            machineName: 'Máy Cắt Laser 02',
            lineName: 'Dây chuyền B',
            status: 'RUNNING',
            operatorName: 'Đặng Ngọc Sơn',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-6678',
        },
        baseKpi: {
            oee: {
                current: 85.3,
                target: 85.0,
                yesterdayDiff: 1.0,
                statusTag: 'Đạt mục tiêu (≥85%)',
            },
            downtimeMinutes: {
                current: 30,
                overTargetMinutes: 0,
            },
            yieldRate: {
                current: 98.0,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 980,
                target: 1000,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 122 },
            { label: '01:00', actual: 125 },
            { label: '02:00', actual: 120 },
            { label: '03:00', actual: 124 },
            { label: '04:00', actual: 122 },
            { label: '05:00', actual: 121 },
            { label: '06:00', actual: 123 },
            { label: '07:00', actual: 123 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 960, actual: 990 },
            { label: 'T4 12/08', planned: 1080, actual: 1010 },
            { label: 'T5 13/08', planned: 1020, actual: 1000 },
            { label: 'T6 14/08', planned: 1150, actual: 1020 },
            { label: 'T7 15/08', planned: 1050, actual: 980 },
            { label: 'CN 16/08', planned: 880, actual: 1010 },
            { label: 'T2 17/08', planned: 1000, actual: 980 },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 5800, actual: 5950 },
            { label: 'Tuần 2 (08-14/08)', planned: 6400, actual: 6020 },
            { label: 'Tuần 3 (15-21/08)', planned: 5900, actual: 5980 },
            { label: 'Tuần 4 (22-28/08)', planned: 6600, actual: 6100 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 25500, actual: 25800 },
            { label: 'T2', planned: 22800, actual: 24200 },
            { label: 'T3', planned: 27200, actual: 26100 },
            { label: 'T4', planned: 24800, actual: 25200 },
            { label: 'T5', planned: 28000, actual: 26400 },
            { label: 'T6', planned: 25200, actual: 25100 },
            { label: 'T7', planned: 27500, actual: 25900 },
            { label: 'T8', planned: 26800, actual: 25700 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 84, target: 85 },
            { date: '12/08', efficiency: 86, target: 85 },
            { date: '13/08', efficiency: 85, target: 85 },
            { date: '14/08', efficiency: 87, target: 85 },
            { date: '15/08', efficiency: 83, target: 85 },
            { date: '16/08', efficiency: 86, target: 85 },
            { date: '17/08', efficiency: 85, target: 85 },
        ],
    },
    'PRESS-01': {
        info: {
            machineCode: 'PRESS-01',
            machineName: 'Máy Dập Thủy Lực 01',
            lineName: 'Dây chuyền C',
            status: 'STOPPED',
            operatorName: 'Bùi Thế Hiển',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-7734',
            stoppageReason: 'Bảo trì định kỳ bơm thủy lực',
            stoppageTimeAccumulated: 45,
        },
        baseKpi: {
            oee: {
                current: 67.4,
                target: 85.0,
                yesterdayDiff: -4.8,
                statusTag: 'Cần cải thiện (<70%)',
            },
            downtimeMinutes: {
                current: 95,
                overTargetMinutes: 45,
            },
            yieldRate: {
                current: 72.2,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 650,
                target: 900,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 105 },
            { label: '01:00', actual: 110 },
            { label: '02:00', actual: 108 },
            { label: '03:00', actual: 102 },
            { label: '04:00', actual: 95 },
            { label: '05:00', actual: 70, stoppageNote: 'Bảo trì định kỳ bơm thủy lực' },
            { label: '06:00', actual: 30 },
            { label: '07:00', actual: 30 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 850, actual: 820 },
            { label: 'T4 12/08', planned: 980, actual: 850 },
            { label: 'T5 13/08', planned: 920, actual: 870 },
            { label: 'T6 14/08', planned: 1050, actual: 840 },
            { label: 'T7 15/08', planned: 950, actual: 810 },
            { label: 'CN 16/08', planned: 780, actual: 860 },
            { label: 'T2 17/08', planned: 900, actual: 650, stoppageNote: 'Dừng máy 95 phút ngày 17/08' },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 5200, actual: 5100 },
            { label: 'Tuần 2 (08-14/08)', planned: 5900, actual: 5050 },
            { label: 'Tuần 3 (15-21/08)', planned: 5100, actual: 4450, stoppageNote: 'Bảo trì hệ thống thủy lực' },
            { label: 'Tuần 4 (22-28/08)', planned: 6100, actual: 5200 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 22500, actual: 21500 },
            { label: 'T2', planned: 19800, actual: 19800 },
            { label: 'T3', planned: 25000, actual: 22800 },
            { label: 'T4', planned: 23200, actual: 21900 },
            { label: 'T5', planned: 25800, actual: 23100 },
            { label: 'T6', planned: 22900, actual: 21400 },
            { label: 'T7', planned: 24600, actual: 22600 },
            { label: 'T8', planned: 23500, actual: 20900 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 74, target: 85 },
            { date: '12/08', efficiency: 78, target: 85 },
            { date: '13/08', efficiency: 80, target: 85 },
            { date: '14/08', efficiency: 76, target: 85 },
            { date: '15/08', efficiency: 72, target: 85 },
            { date: '16/08', efficiency: 79, target: 85 },
            { date: '17/08', efficiency: 67, target: 85 },
        ],
    },
    'PRESS-02': {
        info: {
            machineCode: 'PRESS-02',
            machineName: 'Máy Dập Thủy Lực 02',
            lineName: 'Dây chuyền C',
            status: 'RUNNING',
            operatorName: 'Ngô Thanh Tùng',
            shiftTime: '06:00–14:00',
            updatedAt: '07:31',
            runningSku: 'SP-6898',
        },
        baseKpi: {
            oee: {
                current: 79.2,
                target: 85.0,
                yesterdayDiff: 0.5,
                statusTag: 'Vùng cải thiện (70–84%)',
            },
            downtimeMinutes: {
                current: 40,
                overTargetMinutes: 10,
            },
            yieldRate: {
                current: 90.7,
                targetText: 'So với kế hoạch',
            },
            actualProduction: {
                current: 1180,
                target: 1300,
                unit: 'sp',
            },
        },
        hourlyTimeline: [
            { label: '00:00', actual: 148 },
            { label: '01:00', actual: 152 },
            { label: '02:00', actual: 145 },
            { label: '03:00', actual: 150 },
            { label: '04:00', actual: 146 },
            { label: '05:00', actual: 144 },
            { label: '06:00', actual: 147 },
            { label: '07:00', actual: 148 },
        ],
        dailyTimeline: [
            { label: 'T3 11/08', planned: 1250, actual: 1210 },
            { label: 'T4 12/08', planned: 1380, actual: 1200 },
            { label: 'T5 13/08', planned: 1290, actual: 1240 },
            { label: 'T6 14/08', planned: 1450, actual: 1190 },
            { label: 'T7 15/08', planned: 1320, actual: 1230 },
            { label: 'CN 16/08', planned: 1100, actual: 1220 },
            { label: 'T2 17/08', planned: 1300, actual: 1180 },
        ],
        weeklyTimeline: [
            { label: 'Tuần 1 (01-07/08)', planned: 7600, actual: 7400 },
            { label: 'Tuần 2 (08-14/08)', planned: 8200, actual: 7450 },
            { label: 'Tuần 3 (15-21/08)', planned: 7700, actual: 7380 },
            { label: 'Tuần 4 (22-28/08)', planned: 8500, actual: 7600 },
        ],
        monthlyTimeline: [
            { label: 'T1', planned: 31500, actual: 31200 },
            { label: 'T2', planned: 28200, actual: 28600 },
            { label: 'T3', planned: 34500, actual: 32500 },
            { label: 'T4', planned: 32200, actual: 31700 },
            { label: 'T5', planned: 35000, actual: 32900 },
            { label: 'T6', planned: 31800, actual: 31100 },
            { label: 'T7', planned: 34000, actual: 32400 },
            { label: 'T8', planned: 33500, actual: 31900 },
        ],
        recent7DaysEfficiency: [
            { date: '11/08', efficiency: 81, target: 85 },
            { date: '12/08', efficiency: 80, target: 85 },
            { date: '13/08', efficiency: 83, target: 85 },
            { date: '14/08', efficiency: 78, target: 85 },
            { date: '15/08', efficiency: 82, target: 85 },
            { date: '16/08', efficiency: 81, target: 85 },
            { date: '17/08', efficiency: 79, target: 85 },
        ],
    },
};

// Helper: Calculate multiplier, granularity & timeline properties
export function calculateFilterScale(filterParams?: FilterContextParams): {
    multiplier: number;
    granularity: TimelineGranularity;
    hasPlanLine: boolean;
} {
    if (!filterParams) {
        return { multiplier: 7, granularity: 'DAY', hasPlanLine: true }; // default this week
    }

    const { mode, periodCode, displayNameVi, displayNameEn, category, startDate, endDate } =
        filterParams;

    if (mode === 'CUSTOM_RANGE') {
        if (startDate && endDate) {
            const start = dayjs(startDate);
            const end = dayjs(endDate);
            const days = Math.max(1, end.diff(start, 'day') + 1);
            if (days >= 60) {
                return { multiplier: days, granularity: 'MONTH', hasPlanLine: true };
            }
            if (days >= 14) {
                return { multiplier: days, granularity: 'WEEK', hasPlanLine: true };
            }
            if (days > 1) {
                return { multiplier: days, granularity: 'DAY', hasPlanLine: true };
            }
            return { multiplier: 1, granularity: 'HOUR', hasPlanLine: false };
        }
        return { multiplier: 1, granularity: 'HOUR', hasPlanLine: false };
    }

    // PRESET Mode
    const code = (periodCode || '').toUpperCase();
    const nameVi = (displayNameVi || '').toLowerCase();
    const nameEn = (displayNameEn || '').toLowerCase();

    // 1. Year Filter -> Granularity = MONTH (shows T1..T12)
    if (code.includes('YEAR') || nameVi.includes('năm') || nameEn.includes('year')) {
        return { multiplier: 365, granularity: 'MONTH', hasPlanLine: true };
    }

    // 2. Month Filter -> Granularity = WEEK (shows Tuần 1..Tuần 4)
    if (code.includes('MONTH') || nameVi.includes('tháng') || nameEn.includes('month')) {
        return { multiplier: 30, granularity: 'WEEK', hasPlanLine: true };
    }

    // 3. Week Filter -> Granularity = DAY (shows T3 11/08..T2 17/08)
    if (code.includes('WEEK') || nameVi.includes('tuần') || nameEn.includes('week')) {
        return { multiplier: 7, granularity: 'DAY', hasPlanLine: true };
    }

    // 4. Today / Yesterday Filter -> Granularity = HOUR (shows 00:00..07:00, NO plan line)
    if (
        code.includes('TODAY') ||
        code.includes('YESTERDAY') ||
        nameVi.includes('hôm nay') ||
        nameVi.includes('hôm qua') ||
        nameEn.includes('today') ||
        nameEn.includes('yesterday')
    ) {
        return { multiplier: 1, granularity: 'HOUR', hasPlanLine: false };
    }

    // 5. If category is PERIOD (and not today/yesterday), default to Week (DAY)
    if (category === 'PERIOD') {
        return { multiplier: 7, granularity: 'DAY', hasPlanLine: true };
    }

    // 6. If category is SHIFT, single shift -> Granularity = HOUR
    return { multiplier: 1, granularity: 'HOUR', hasPlanLine: false };
}

// Dynamic Mock Overview Data generator
export function getProductionOverviewData(
    filterParams?: FilterContextParams
): ProductionOverviewMockPayload {
    const { multiplier } = calculateFilterScale(filterParams);
    const base = BASE_DAILY_OVERVIEW_MOCK;

    return {
        kpi: {
            ...base.kpi,
            downtimeMinutes: {
                current: base.kpi.downtimeMinutes.current * multiplier,
                overTargetMinutes: base.kpi.downtimeMinutes.overTargetMinutes * multiplier,
            },
            actualProduction: {
                current: base.kpi.actualProduction.current * multiplier,
                target: base.kpi.actualProduction.target * multiplier,
                unit: 'sp',
            },
        },
        machineOeeList: base.machineOeeList,
        machineOutputList: base.machineOutputList.map((m) => ({
            machineCode: m.machineCode,
            planned: m.planned * multiplier,
            actual: m.actual * multiplier,
        })),
        productOutputList: base.productOutputList.map((p) => ({
            productCode: p.productCode,
            planned: p.planned * multiplier,
            actual: p.actual * multiplier,
        })),
    };
}

// Dynamic Mock Machine Detail Data generator
export function getMachineDetail(
    machineCode: string,
    filterParams?: FilterContextParams
): MachineDetailMockPayload {
    const config = BASE_MACHINE_CONFIGS[machineCode] ?? BASE_MACHINE_CONFIGS['CNC-03'];
    const { multiplier, granularity, hasPlanLine } = calculateFilterScale(filterParams);

    let outputTimeline: OutputTimelinePoint[];
    switch (granularity) {
        case 'MONTH':
            outputTimeline = config.monthlyTimeline;
            break;
        case 'WEEK':
            outputTimeline = config.weeklyTimeline;
            break;
        case 'DAY':
            outputTimeline = config.dailyTimeline;
            break;
        case 'HOUR':
        default:
            outputTimeline = config.hourlyTimeline;
            break;
    }

    return {
        info: config.info,
        kpi: {
            ...config.baseKpi,
            downtimeMinutes: {
                current: config.baseKpi.downtimeMinutes.current * multiplier,
                overTargetMinutes: config.baseKpi.downtimeMinutes.overTargetMinutes * multiplier,
            },
            actualProduction: {
                current: config.baseKpi.actualProduction.current * multiplier,
                target: config.baseKpi.actualProduction.target * multiplier,
                unit: 'sp',
            },
        },
        granularity,
        hasPlanLine,
        outputTimeline,
        recent7DaysEfficiency: config.recent7DaysEfficiency,
    };
}
