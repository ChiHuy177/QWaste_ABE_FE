import type { IndustryFilter } from '@/types/IndustryFilter';
import type {
    MachineErrorDetailResponse,
    MachineStatusSummaryResponse,
    MtbfChartResponse,
    MttrChartResponse,
} from '@/types/Monitoring';
import type { MachineWithStatusLogsSummary } from '@/types/Machine';
import type { SpaceOverview, SpacePickingWithChildren } from '@/types/Space';

export const USE_MOCK_FACTORY_OVERVIEW = true;

const FACTORY_LEVEL = { spaceLevelId: 1, spaceLevel: 1, spaceLevelName: 'Factory' };
const ZONE_LEVEL = { spaceLevelId: 2, spaceLevel: 2, spaceLevelName: 'Zone' };

export const MOCK_FACTORY_INDUSTRY_FILTERS: IndustryFilter[] = [
    {
        filterId: 1,
        category: 'PERIOD',
        periodCode: 'TODAY',
        shiftNumber: null,
        startTime: '00:00:00',
        endTime: '23:59:59',
        crossesMidnight: false,
        displayNameEn: 'Today',
        displayNameVi: 'Hôm nay',
        shortNameEn: 'Today',
        isPrimary: true,
        sortOrder: 1,
    },
    {
        filterId: 2,
        category: 'SHIFT',
        periodCode: null,
        shiftNumber: 1,
        startTime: '06:00:00',
        endTime: '14:00:00',
        crossesMidnight: false,
        displayNameEn: 'Shift 1',
        displayNameVi: 'Ca 1',
        shortNameEn: 'S1',
        isPrimary: true,
        sortOrder: 2,
    },
    {
        filterId: 3,
        category: 'SHIFT',
        periodCode: null,
        shiftNumber: 2,
        startTime: '14:00:00',
        endTime: '22:00:00',
        crossesMidnight: false,
        displayNameEn: 'Shift 2',
        displayNameVi: 'Ca 2',
        shortNameEn: 'S2',
        isPrimary: true,
        sortOrder: 3,
    },
];

export const MOCK_FACTORY_SPACES: SpacePickingWithChildren[] = [
    {
        spaceId: 1,
        parentId: 0,
        spaceCode: 'FACTORY-A',
        spaceName: 'Factory A',
        description: 'Demo production factory',
        displayOrder: 1,
        spaceLevel: FACTORY_LEVEL,
        children: [
            {
                spaceId: 11,
                parentId: 1,
                spaceCode: 'ZONE-A1',
                spaceName: 'Zone A1 - CNC',
                description: 'CNC machining area',
                displayOrder: 1,
                spaceLevel: ZONE_LEVEL,
                children: [],
            },
            {
                spaceId: 12,
                parentId: 1,
                spaceCode: 'ZONE-A2',
                spaceName: 'Zone A2 - Cutting',
                description: 'Laser cutting and heat treatment area',
                displayOrder: 2,
                spaceLevel: ZONE_LEVEL,
                children: [],
            },
        ],
    },
];

const machine = (
    machineId: string,
    machineCode: string,
    machineName: string,
    currentStatus: MachineWithStatusLogsSummary['currentStatus'],
    runtimeByStatus: NonNullable<MachineWithStatusLogsSummary['runtimeByStatus']>,
    options: Partial<MachineWithStatusLogsSummary> = {}
): MachineWithStatusLogsSummary => ({
    machineId,
    machineCode,
    machineName,
    propertyCode: options.propertyCode ?? `PROP-${machineCode}`,
    power: options.power ?? 7.5,
    machineDisplayOrder: options.machineDisplayOrder ?? 1,
    topic: options.topic ?? machineCode,
    currentStatus,
    operatorCount: options.operatorCount ?? 1,
    totalProductions: options.totalProductions ?? 0,
    runtimeByStatus,
});

export const MOCK_FACTORY_OVERVIEW: SpaceOverview = {
    spaceId: 1,
    spaceCode: 'FACTORY-A',
    spaceName: 'Factory A',
    machineChildren: [],
    children: [
        {
            spaceId: 11,
            spaceCode: 'ZONE-A1',
            spaceName: 'Zone A1 - CNC',
            machineChildren: [],
            children: [
                {
                    spaceId: 111,
                    spaceCode: 'LINE-A1-01',
                    spaceName: 'Line A1 / CNC milling',
                    children: [],
                    machineChildren: [
                        machine(
                            'machine-demo-cnc-01',
                            'CNC-01',
                            'CNC Machine 01',
                            'RUNTIME',
                            { RUNTIME: 19800, IDLE: 2700, ERROR: 900, OFFLINE: 0 },
                            {
                                power: 9.5,
                                topic: 'cnc-01',
                                operatorCount: 2,
                                totalProductions: 186,
                                machineDisplayOrder: 1,
                            }
                        ),
                        machine(
                            'machine-demo-cnc-02',
                            'CNC-02',
                            'CNC Machine 02',
                            'ERROR',
                            { RUNTIME: 12600, IDLE: 3600, ERROR: 2400, OFFLINE: 900 },
                            {
                                power: 8.5,
                                topic: 'cnc-02',
                                operatorCount: 1,
                                totalProductions: 118,
                                machineDisplayOrder: 2,
                            }
                        ),
                    ],
                },
                {
                    spaceId: 112,
                    spaceCode: 'LINE-A1-02',
                    spaceName: 'Line A1 / CNC turning',
                    children: [],
                    machineChildren: [
                        machine(
                            'machine-demo-lathe-01',
                            'LATHE-01',
                            'CNC Lathe 01',
                            'IDLE',
                            { RUNTIME: 14400, IDLE: 5400, ERROR: 0, OFFLINE: 1800 },
                            {
                                power: 6.5,
                                topic: 'lathe-01',
                                operatorCount: 1,
                                totalProductions: 74,
                            }
                        ),
                    ],
                },
            ],
        },
        {
            spaceId: 12,
            spaceCode: 'ZONE-A2',
            spaceName: 'Zone A2 - Cutting',
            machineChildren: [],
            children: [
                {
                    spaceId: 121,
                    spaceCode: 'LINE-A2-01',
                    spaceName: 'Line A2 / Laser cutting',
                    children: [],
                    machineChildren: [
                        machine(
                            'machine-demo-cut-01',
                            'CUT-01',
                            'Laser Cutting 01',
                            'RUNTIME',
                            { RUNTIME: 18000, IDLE: 1800, ERROR: 1200, OFFLINE: 0 },
                            {
                                power: 12,
                                topic: 'cut-01',
                                operatorCount: 2,
                                totalProductions: 212,
                            }
                        ),
                        machine(
                            'machine-demo-heat-01',
                            'HEAT-01',
                            'Heat Treatment 01',
                            'OFFLINE',
                            { RUNTIME: 7200, IDLE: 1800, ERROR: 0, OFFLINE: 12600 },
                            {
                                power: 18,
                                topic: 'heat-01',
                                operatorCount: 0,
                                totalProductions: 48,
                            }
                        ),
                    ],
                },
            ],
        },
    ],
};

const collectMachines = (space: SpaceOverview): MachineWithStatusLogsSummary[] => [
    ...space.machineChildren,
    ...space.children.flatMap(collectMachines),
];

const allMachines = collectMachines(MOCK_FACTORY_OVERVIEW);

const chartLabels = ['08:00', '10:00', '12:00', '14:00', '16:00'];

export const MOCK_FACTORY_MTBF_DATA: MtbfChartResponse = {
    series: allMachines.map((item, index) => ({
        machineId: item.machineId,
        machineName: item.machineName,
        dataPoints: chartLabels.map((label, pointIndex) => ({
            label,
            value: Number((3.2 + index * 0.4 - pointIndex * 0.12).toFixed(2)),
        })),
    })),
};

export const MOCK_FACTORY_MTTR_DATA: MttrChartResponse = {
    series: allMachines.map((item, index) => ({
        machineId: item.machineId,
        machineName: item.machineName,
        dataPoints: chartLabels.map((label, pointIndex) => ({
            label,
            value: Number((0.8 + index * 0.22 + pointIndex * 0.08).toFixed(2)),
        })),
    })),
};

export const MOCK_MACHINE_STATUS_SUMMARY: MachineStatusSummaryResponse = {
    data: allMachines.map((item) => ({
        machineId: item.machineId,
        machineName: item.machineName,
        totalRuntimeHours: (item.runtimeByStatus?.RUNTIME ?? 0) / 3600,
        totalIdleHours: (item.runtimeByStatus?.IDLE ?? 0) / 3600,
        totalErrorHours: (item.runtimeByStatus?.ERROR ?? 0) / 3600,
        totalOfflineHours: (item.runtimeByStatus?.OFFLINE ?? 0) / 3600,
    })),
};

export const MOCK_MACHINE_ERROR_DETAILS: Record<string, MachineErrorDetailResponse> = {
    'machine-demo-cnc-01': {
        totalErrorHours: 0.25,
        errors: [
            {
                id: 'err-cnc-01-1',
                machineId: 'machine-demo-cnc-01',
                errorName: 'Tool wear warning',
                logStatus: 'ERROR',
                startTime: '2026-05-27T09:20:00.000Z',
                endTime: '2026-05-27T09:35:00.000Z',
                durationHours: 0.25,
            },
        ],
    },
    'machine-demo-cnc-02': {
        totalErrorHours: 0.67,
        errors: [
            {
                id: 'err-cnc-02-1',
                machineId: 'machine-demo-cnc-02',
                errorName: 'Spindle temperature alarm',
                logStatus: 'ERROR',
                startTime: '2026-05-27T11:10:00.000Z',
                endTime: '2026-05-27T11:50:00.000Z',
                durationHours: 0.67,
            },
        ],
    },
    'machine-demo-lathe-01': { totalErrorHours: 0, errors: [] },
    'machine-demo-cut-01': {
        totalErrorHours: 0.33,
        errors: [
            {
                id: 'err-cut-01-1',
                machineId: 'machine-demo-cut-01',
                errorName: 'Laser calibration pause',
                logStatus: 'ERROR',
                startTime: '2026-05-27T13:05:00.000Z',
                endTime: '2026-05-27T13:25:00.000Z',
                durationHours: 0.33,
            },
        ],
    },
    'machine-demo-heat-01': { totalErrorHours: 0, errors: [] },
};
