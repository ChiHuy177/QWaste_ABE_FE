import type { DashboardStats } from '@/app/(dashboard)/admin/_components/DashboardStatsCards';
import type { ErrorCountChartResponse, MttrChartResponse } from '@/types/Monitoring';
import type { IndustryFilter } from '@/types/IndustryFilter';
import type { SpaceWithChildrenResponse } from '@/types/Space';

export const USE_MOCK_DASHBOARD = true;

const mockAuditMetaData = {
    createdAt: null,
    updatedAt: null,
    createdBy: null,
    updatedBy: null,
};

export interface MachineStatusData {
    running: number;
    idle: number;
    error: number;
    offline: number;
}

export interface ProductionHealthMetric {
    key: string;
    label: string;
    value: string;
    detail: string;
    trend?: string;
    tone: 'success' | 'warning' | 'error' | 'info';
}

export interface PriorityQueueItem {
    key: string;
    title: string;
    detail: string;
    owner: string;
    eta: string;
    tone: 'error' | 'warning' | 'info';
    href?: string;
}

export const MOCK_DASHBOARD_STATS: DashboardStats = {
    machinesRunning: 18,
    machinesTotal: 30,
    machinesError: 2,
    ordersInProgress: 12,
    ordersOverdue: 1,
    tasksInProgress: 14,
    tasksQcPending: 7,
    staffActive: 24,
    staffWorking: 18,
    processProgress: 62,
    energyToday: 1247,
    energyTrend: -8,
};

export const MOCK_MACHINE_STATUS_DATA: MachineStatusData = {
    running: 18,
    idle: 7,
    error: 2,
    offline: 3,
};

export const MOCK_PRODUCTION_HEALTH: ProductionHealthMetric[] = [
    {
        key: 'oee',
        label: 'OEE Today',
        value: '78%',
        detail: 'Target 82%',
        trend: '+4%',
        tone: 'warning',
    },
    {
        key: 'output',
        label: 'Output Today',
        value: '1,248 pcs',
        detail: '86% of daily plan',
        trend: '+12%',
        tone: 'success',
    },
    {
        key: 'qc-fail',
        label: 'QC Fail Rate',
        value: '3.2%',
        detail: 'Below 4% threshold',
        trend: '-0.6%',
        tone: 'success',
    },
    {
        key: 'downtime',
        label: 'Downtime',
        value: '2h 15m',
        detail: '2 machines affected',
        trend: '+18m',
        tone: 'error',
    },
];

export const MOCK_PRIORITY_QUEUE: PriorityQueueItem[] = [
    {
        key: 'cnc-01-down',
        title: 'CNC 01 is blocking production',
        detail: 'Spindle temperature alarm, downtime 35m',
        owner: 'Maintenance',
        eta: 'Now',
        tone: 'error',
        href: '/admin/machines',
    },
    {
        key: 'ord-2026-014',
        title: 'ORD-2026-014 near deadline',
        detail: 'Assembly step still in progress',
        owner: 'Production',
        eta: '6h left',
        tone: 'warning',
        href: '/admin/order',
    },
    {
        key: 'qc-queue',
        title: '7 tasks waiting for QC',
        detail: 'Longest waiting item: 42m',
        owner: 'QC Team',
        eta: 'Today',
        tone: 'info',
    },
];

export const MOCK_SPACES: SpaceWithChildrenResponse[] = [
    {
        spaceId: 1,
        parentId: null,
        spaceCode: 'FACTORY-A',
        spaceName: 'Factory A',
        description: 'Main production factory',
        displayOrder: 1,
        auditMetaData: mockAuditMetaData,
        spaceLevel: { spaceLevelId: 1, spaceLevel: 1, spaceLevelName: 'Factory' },
        children: [
            {
                spaceId: 11,
                parentId: 1,
                spaceCode: 'ZONE-A1',
                spaceName: 'Zone A1 - CNC',
                description: 'CNC machining zone',
                displayOrder: 1,
                auditMetaData: mockAuditMetaData,
                spaceLevel: { spaceLevelId: 2, spaceLevel: 2, spaceLevelName: 'Zone' },
                children: [],
            },
            {
                spaceId: 12,
                parentId: 1,
                spaceCode: 'ZONE-A2',
                spaceName: 'Zone A2 - Assembly',
                description: 'Assembly and finishing zone',
                displayOrder: 2,
                auditMetaData: mockAuditMetaData,
                spaceLevel: { spaceLevelId: 2, spaceLevel: 2, spaceLevelName: 'Zone' },
                children: [],
            },
        ],
    },
];

export const MOCK_INDUSTRY_FILTERS: IndustryFilter[] = [
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

export const MOCK_ERROR_COUNT_DATA: ErrorCountChartResponse = {
    series: [
        {
            machineId: 'CNC-01',
            machineName: 'CNC 01',
            dataPoints: [
                { label: '08:00', value: 2 },
                { label: '10:00', value: 1 },
                { label: '12:00', value: 4 },
                { label: '14:00', value: 2 },
                { label: '16:00', value: 3 },
            ],
        },
        {
            machineId: 'CNC-02',
            machineName: 'CNC 02',
            dataPoints: [
                { label: '08:00', value: 1 },
                { label: '10:00', value: 0 },
                { label: '12:00', value: 2 },
                { label: '14:00', value: 1 },
                { label: '16:00', value: 1 },
            ],
        },
        {
            machineId: 'ASM-01',
            machineName: 'Assembly 01',
            dataPoints: [
                { label: '08:00', value: 0 },
                { label: '10:00', value: 1 },
                { label: '12:00', value: 0 },
                { label: '14:00', value: 2 },
                { label: '16:00', value: 1 },
            ],
        },
        {
            machineId: 'CUT-01',
            machineName: 'Cutting 01',
            dataPoints: [
                { label: '08:00', value: 3 },
                { label: '10:00', value: 2 },
                { label: '12:00', value: 1 },
                { label: '14:00', value: 0 },
                { label: '16:00', value: 2 },
            ],
        },
    ],
};

export const MOCK_MTTR_DATA: MttrChartResponse = {
    series: [
        {
            machineId: 'CNC-01',
            machineName: 'CNC 01',
            dataPoints: [
                { label: 'Mon', value: 1.8 },
                { label: 'Tue', value: 2.1 },
                { label: 'Wed', value: 1.4 },
                { label: 'Thu', value: 1.7 },
                { label: 'Fri', value: 1.2 },
            ],
        },
        {
            machineId: 'CNC-02',
            machineName: 'CNC 02',
            dataPoints: [
                { label: 'Mon', value: 1.1 },
                { label: 'Tue', value: 1.3 },
                { label: 'Wed', value: 1.0 },
                { label: 'Thu', value: 1.4 },
                { label: 'Fri', value: 0.9 },
            ],
        },
        {
            machineId: 'CUT-01',
            machineName: 'Cutting 01',
            dataPoints: [
                { label: 'Mon', value: 2.4 },
                { label: 'Tue', value: 2.0 },
                { label: 'Wed', value: 1.8 },
                { label: 'Thu', value: 1.6 },
                { label: 'Fri', value: 1.5 },
            ],
        },
    ],
};

export const getMockDashboardData = () => ({
    stats: MOCK_DASHBOARD_STATS,
    machineStatusData: MOCK_MACHINE_STATUS_DATA,
    productionHealth: MOCK_PRODUCTION_HEALTH,
    priorityQueue: MOCK_PRIORITY_QUEUE,
    errorCountData: MOCK_ERROR_COUNT_DATA,
    mttrData: MOCK_MTTR_DATA,
});
