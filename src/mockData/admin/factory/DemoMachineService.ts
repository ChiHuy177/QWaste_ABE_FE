import type {
    Machine,
    MachineFormData,
    MachineOverview,
    MachinePaginatedParams,
    MachineUpdateFormData,
    MachineWithStatusLogsSummary,
} from '@/types/Machine';
import type { SpaceDetailResponse, SpaceOverview, SpaceWithChildrenResponse } from '@/types/Space';
import type { PaginatedResult } from '@/types/Common';
import { MOCK_FACTORY_OVERVIEW } from './factoryOverview';
import { DEMO_SPACE_AUDIT, demoSpaceTree } from './spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const getSpaceLevel = (depth: number) => ({
    spaceLevelId: depth + 1,
    spaceLevel: depth + 1,
    spaceLevelName: depth === 0 ? 'Factory' : depth === 1 ? 'Zone' : 'Line',
});

const MACHINE_IMAGE_BY_CODE: Record<string, string> = {
    'CNC-01': 'https://commons.wikimedia.org/wiki/Special:FilePath/CNC_Mill_(3964417019).jpg',
    'CNC-02': 'https://commons.wikimedia.org/wiki/Special:FilePath/CNC_machine.jpg',
    'LATHE-01': 'https://commons.wikimedia.org/wiki/Special:FilePath/Conventional-lathe.jpg',
    'CUT-01':
        'https://commons.wikimedia.org/wiki/Special:FilePath/%22Optimum_TT%22_laser_cutting_machine_during_the_%22Armiya_2021%22_exhibition.jpg',
    'HEAT-01': 'https://commons.wikimedia.org/wiki/Special:FilePath/Heat-Treating-Furnace.jpg',
};

const createSoftDeleteMetaData = (isDeleted = false) => ({
    isDeleted,
    deletedAt: isDeleted ? '2026-05-28T09:45:00.000Z' : null,
    deletedBy: isDeleted ? 'Demo Admin' : null,
});

const toSpaceTree = (
    space: SpaceOverview,
    parentId: number | null,
    depth: number
): SpaceWithChildrenResponse => ({
    spaceId: space.spaceId,
    parentId,
    spaceCode: space.spaceCode,
    spaceName: space.spaceName,
    description: `${space.spaceName} demo space`,
    displayOrder: space.spaceId,
    auditMetaData,
    spaceLevel: getSpaceLevel(depth),
    children: space.children.map((child) => toSpaceTree(child, space.spaceId, depth + 1)),
});

const findSpace = (space: SpaceOverview, spaceId: number): SpaceOverview | null => {
    if (space.spaceId === spaceId) return space;

    for (const child of space.children) {
        const found = findSpace(child, spaceId);
        if (found) return found;
    }

    return null;
};

const collectMachines = (space: SpaceOverview): MachineWithStatusLogsSummary[] => [
    ...space.machineChildren,
    ...space.children.flatMap(collectMachines),
];

const mapStatus = (currentStatus: MachineWithStatusLogsSummary['currentStatus']) => {
    switch (currentStatus) {
        case 'RUNTIME':
            return 'running';
        case 'IDLE':
            return 'idle';
        case 'ERROR':
            return 'error';
        default:
            return 'empty';
    }
};

const toMachineOverview = (machine: MachineWithStatusLogsSummary): MachineOverview => ({
    machineId: machine.machineId,
    machineName: machine.machineName,
    machineCode: machine.machineCode,
    propertyCode: machine.propertyCode,
    power: machine.power,
    status: mapStatus(machine.currentStatus),
    machineImage: MACHINE_IMAGE_BY_CODE[machine.machineCode] ?? '/images/machine-placeholder.png',
    operatorCount: machine.operatorCount,
    logs: Object.entries(machine.runtimeByStatus ?? {}).map(([logStatus, totalLogStateTime]) => ({
        logStatus: logStatus as MachineOverview['logs'][number]['logStatus'],
        totalLogStateTime,
    })),
    currentEnergyConsumption: Number((machine.power * 0.82).toFixed(1)),
    currentStatus: machine.currentStatus,
    productionCounter: machine.totalProductions,
    totalProductions: machine.totalProductions,
    runtimeByStatus: machine.runtimeByStatus,
    topic: machine.topic,
});

const findSpaceInDemoTree = (
    spaces: SpaceWithChildrenResponse[],
    spaceId: number
): SpaceWithChildrenResponse | null => {
    for (const space of spaces) {
        if (space.spaceId === spaceId) return space;

        const found = findSpaceInDemoTree(space.children ?? [], spaceId);
        if (found) return found;
    }

    return null;
};

const toSpaceDetail = (space: SpaceWithChildrenResponse): SpaceDetailResponse => {
    const parent = space.parentId ? findSpaceInDemoTree(demoSpaceTree, space.parentId) : null;

    return {
        spaceId: space.spaceId,
        parentId: space.parentId,
        spaceParentName: parent?.spaceName ?? null,
        spaceParentCode: parent?.spaceCode ?? null,
        spaceCode: space.spaceCode,
        spaceName: space.spaceName,
        description: space.description,
        displayOrder: space.displayOrder,
        auditMetaData: space.auditMetaData,
        spaceLevel: space.spaceLevel,
    };
};

const findSpaceDetail = (spaceId: number): SpaceDetailResponse => {
    const space = findSpaceInDemoTree(demoSpaceTree, spaceId);
    if (!space) {
        throw new Error('Demo machine space was not found');
    }

    return toSpaceDetail(space);
};

const demoMachines: Machine[] = [
    {
        machineId: 'machine-demo-cnc-01',
        machineCode: 'CNC-01',
        machineName: 'CNC Machine 01',
        description: 'Primary CNC milling machine for aluminum parts.',
        topic: 'cnc-01',
        displayOrder: 1,
        productionTime: 19800,
        machineImage: MACHINE_IMAGE_BY_CODE['CNC-01'],
        space: findSpaceDetail(111),
        propertyCode: 'PROP-CNC-01',
        operatorCount: 2,
        power: 9.5,
        auditMetaData: DEMO_SPACE_AUDIT,
        softDeleteMetaData: createSoftDeleteMetaData(),
    },
    {
        machineId: 'machine-demo-cnc-02',
        machineCode: 'CNC-02',
        machineName: 'CNC Machine 02',
        description: 'Backup CNC milling machine currently pending maintenance review.',
        topic: 'cnc-02',
        displayOrder: 2,
        productionTime: 12600,
        machineImage: MACHINE_IMAGE_BY_CODE['CNC-02'],
        space: findSpaceDetail(111),
        propertyCode: 'PROP-CNC-02',
        operatorCount: 1,
        power: 8.5,
        auditMetaData: DEMO_SPACE_AUDIT,
        softDeleteMetaData: createSoftDeleteMetaData(true),
    },
    {
        machineId: 'machine-demo-lathe-01',
        machineCode: 'LATHE-01',
        machineName: 'CNC Lathe 01',
        description: 'Turning machine for shaft and sleeve production.',
        topic: 'lathe-01',
        displayOrder: 1,
        productionTime: 14400,
        machineImage: MACHINE_IMAGE_BY_CODE['LATHE-01'],
        space: findSpaceDetail(112),
        propertyCode: 'PROP-LATHE-01',
        operatorCount: 1,
        power: 6.5,
        auditMetaData: DEMO_SPACE_AUDIT,
        softDeleteMetaData: createSoftDeleteMetaData(),
    },
    {
        machineId: 'machine-demo-cut-01',
        machineCode: 'CUT-01',
        machineName: 'Laser Cutting 01',
        description: 'Laser cutting machine for sheet metal preparation.',
        topic: 'cut-01',
        displayOrder: 1,
        productionTime: 18000,
        machineImage: MACHINE_IMAGE_BY_CODE['CUT-01'],
        space: findSpaceDetail(121),
        propertyCode: 'PROP-CUT-01',
        operatorCount: 2,
        power: 12,
        auditMetaData: DEMO_SPACE_AUDIT,
        softDeleteMetaData: createSoftDeleteMetaData(),
    },
    {
        machineId: 'machine-demo-heat-01',
        machineCode: 'HEAT-01',
        machineName: 'Heat Treatment 01',
        description: 'Heat treatment furnace for hardened components.',
        topic: 'heat-01',
        displayOrder: 2,
        productionTime: 7200,
        machineImage: MACHINE_IMAGE_BY_CODE['HEAT-01'],
        space: findSpaceDetail(121),
        propertyCode: 'PROP-HEAT-01',
        operatorCount: 0,
        power: 18,
        auditMetaData: DEMO_SPACE_AUDIT,
        softDeleteMetaData: createSoftDeleteMetaData(),
    },
];

const getNextMachineId = () => `machine-demo-${Date.now()}`;

const touchMachine = (machine: Machine) => {
    machine.auditMetaData = {
        ...(machine.auditMetaData ?? DEMO_SPACE_AUDIT),
        updatedAt: new Date().toISOString(),
    };
};

const normalizeText = (value?: string) => value?.trim().toLowerCase();

const includesText = (source: string | undefined, search: string | undefined) => {
    if (!search) return true;
    return source?.toLowerCase().includes(search) ?? false;
};

const compareMachines = (left: Machine, right: Machine, sortParam: string) => {
    const [field, direction] = sortParam.split(',');
    const multiplier = direction === 'ASC' ? 1 : -1;

    switch (field) {
        case 'machineCode':
            return left.machineCode.localeCompare(right.machineCode) * multiplier;
        case 'machineName':
            return left.machineName.localeCompare(right.machineName) * multiplier;
        case 'propertyCode':
            return (left.propertyCode ?? '').localeCompare(right.propertyCode ?? '') * multiplier;
        case 'power':
            return ((left.power ?? 0) - (right.power ?? 0)) * multiplier;
        default:
            return (
                (Date.parse(left.auditMetaData?.createdAt ?? '') -
                    Date.parse(right.auditMetaData?.createdAt ?? '')) *
                multiplier
            );
    }
};

const findMachine = (machineId: string) => {
    const machine = demoMachines.find((item) => item.machineId === machineId);
    if (!machine) {
        throw new Error('Demo machine was not found');
    }

    return machine;
};

export class DemoMachineService {
    static async getMachinesPaginated(
        params: MachinePaginatedParams
    ): Promise<PaginatedResult<Machine>> {
        const searchTerm = normalizeText(params.search);
        const machineCode = normalizeText(params.machineCode);
        const machineName = normalizeText(params.machineName);
        const propertyCode = normalizeText(params.propertyCode);
        const topic = normalizeText(params.topic);
        const sortParams = Array.isArray(params.sort)
            ? params.sort
            : [params.sort ?? 'auditMetaData.createdAt,DESC'];

        const filteredMachines = demoMachines
            .filter((machine) => {
                const matchesSpace =
                    params.spaceId === undefined || machine.space.spaceId === params.spaceId;
                const matchesSearch = searchTerm
                    ? [
                          machine.machineCode,
                          machine.machineName,
                          machine.propertyCode,
                          machine.topic,
                          machine.description,
                      ].some((value) => includesText(value, searchTerm))
                    : true;

                return (
                    matchesSpace &&
                    matchesSearch &&
                    includesText(machine.machineCode, machineCode) &&
                    includesText(machine.machineName, machineName) &&
                    includesText(machine.propertyCode, propertyCode) &&
                    includesText(machine.topic, topic)
                );
            })
            .sort((left, right) => {
                for (const sortParam of sortParams) {
                    const result = compareMachines(left, right, sortParam);
                    if (result !== 0) return result;
                }

                return 0;
            });

        const startIndex = params.page * params.size;
        const content = filteredMachines.slice(startIndex, startIndex + params.size);
        const totalPages = Math.ceil(filteredMachines.length / params.size);

        return clone({
            content,
            pageNumber: params.page,
            pageSize: params.size,
            totalElements: filteredMachines.length,
            totalPages,
            first: params.page === 0,
            last: params.page >= totalPages - 1,
            empty: content.length === 0,
        });
    }

    static async getAllMachines(): Promise<Machine[]> {
        return clone(demoMachines);
    }

    static async getAllMachinesInList(spaceId: number): Promise<Machine[]> {
        return clone(demoMachines.filter((machine) => machine.space.spaceId === spaceId));
    }

    static async getMachineById(machineId: string): Promise<Machine> {
        return clone(findMachine(machineId));
    }

    static async getSpacesTree(): Promise<SpaceWithChildrenResponse[]> {
        return clone([toSpaceTree(MOCK_FACTORY_OVERVIEW, null, 0)]);
    }

    static async getMachinesWithLogs(spaceId: number): Promise<MachineOverview[]> {
        const selectedSpace = findSpace(MOCK_FACTORY_OVERVIEW, spaceId) ?? MOCK_FACTORY_OVERVIEW;
        return clone(collectMachines(selectedSpace).map(toMachineOverview));
    }

    static async createMachine(machineData: MachineFormData): Promise<MachineFormData> {
        const now = new Date().toISOString();
        const newMachine: Machine = {
            machineId: getNextMachineId(),
            machineName: machineData.machineName,
            description: machineData.description,
            topic: machineData.topic,
            displayOrder: demoMachines.length + 1,
            machineCode: machineData.machineCode,
            productionTime: 0,
            machineImage: machineData.machineImage,
            space: findSpaceDetail(machineData.spaceId),
            propertyCode: machineData.propertyCode,
            operatorCount: 0,
            power: machineData.power,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
            softDeleteMetaData: createSoftDeleteMetaData(),
        };

        demoMachines.push(newMachine);

        return clone(machineData);
    }

    static async updateMachine(machineData: MachineUpdateFormData): Promise<MachineUpdateFormData> {
        const machine = findMachine(machineData.machineId);

        machine.machineName = machineData.machineName;
        machine.description = machineData.description;
        machine.topic = machineData.topic;
        machine.machineCode = machineData.machineCode;
        machine.machineImage = machineData.machineImage;
        machine.space = findSpaceDetail(machineData.spaceId);
        machine.propertyCode = machineData.propertyCode;
        machine.power = machineData.power;
        touchMachine(machine);

        return clone(machineData);
    }

    static async deleteMachine(machineId: string): Promise<void> {
        const machine = findMachine(machineId);
        machine.softDeleteMetaData = {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy: 'Demo Admin',
        };
        touchMachine(machine);
    }

    static async restoreMachine(machineId: string): Promise<void> {
        const machine = findMachine(machineId);
        machine.softDeleteMetaData = createSoftDeleteMetaData();
        touchMachine(machine);
    }

    static findSync(machineId: string) {
        return demoMachines.find((m) => m.machineId === machineId) ?? null;
    }
}
