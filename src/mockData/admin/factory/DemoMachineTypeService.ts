import type { MachineType, MachineTypeFormData } from '@/types/MachineType';
import { DEMO_SPACE_AUDIT } from './spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const demoMachineTypes: MachineType[] = [
    {
        machineTypeId: 1,
        machineTypeName: 'CNC Milling',
        description: 'Computer numerical control milling machines for precision machining.',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        machineTypeId: 2,
        machineTypeName: 'CNC Lathe',
        description: 'Turning machines for shafts, sleeves, and round workpieces.',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        machineTypeId: 3,
        machineTypeName: 'Laser Cutting',
        description: 'Laser cutting machines for sheet metal preparation.',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        machineTypeId: 4,
        machineTypeName: 'Heat Treatment',
        description: 'Industrial furnaces for hardening and thermal processing.',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
];

const getNextMachineTypeId = () =>
    Math.max(...demoMachineTypes.map((machineType) => machineType.machineTypeId), 0) + 1;

const touchMachineType = (machineType: MachineType) => {
    machineType.auditMetaData = {
        ...(machineType.auditMetaData ?? DEMO_SPACE_AUDIT),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

const findMachineType = (machineTypeId: number) => {
    const machineType = demoMachineTypes.find((item) => item.machineTypeId === machineTypeId);
    if (!machineType) {
        throw new Error('Demo machine type was not found');
    }

    return machineType;
};

export class DemoMachineTypeService {
    static async getAllMachineTypesPicking(): Promise<MachineType[]> {
        return clone(demoMachineTypes);
    }

    static async getAllMachineTypes(): Promise<MachineType[]> {
        return clone(demoMachineTypes);
    }

    static async getMachineTypeById(machineTypeId: number): Promise<MachineType> {
        return clone(findMachineType(machineTypeId));
    }

    static async createMachineType(machineTypeData: MachineTypeFormData): Promise<MachineType> {
        const now = new Date().toISOString();
        const newMachineType: MachineType = {
            machineTypeId: getNextMachineTypeId(),
            machineTypeName: machineTypeData.machineTypeName,
            description: machineTypeData.description,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };

        demoMachineTypes.push(newMachineType);

        return clone(newMachineType);
    }

    static async updateMachineType(machineTypeData: MachineType): Promise<string> {
        const machineType = findMachineType(machineTypeData.machineTypeId);

        machineType.machineTypeName = machineTypeData.machineTypeName;
        machineType.description = machineTypeData.description;
        touchMachineType(machineType);

        return 'Demo machine type updated';
    }

    static async deleteMachineType(machineTypeId: number): Promise<void> {
        const targetIndex = demoMachineTypes.findIndex(
            (machineType) => machineType.machineTypeId === machineTypeId
        );
        if (targetIndex === -1) {
            throw new Error('Demo machine type was not found');
        }

        demoMachineTypes.splice(targetIndex, 1);
    }
}
