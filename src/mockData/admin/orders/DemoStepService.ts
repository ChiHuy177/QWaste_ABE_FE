import type { CreateStepRequest, StepDTO, UpdateStepRequest } from '@/types/Step';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const toStep = (
    standardStepId: number,
    stepName: string,
    description: string,
    requiresQc: boolean,
    defaultCompletionTimeSeconds: number,
    materialName: string
): StepDTO => ({
    standardStepId,
    stepName,
    description,
    requiresQc,
    defaultCompletionTimeSeconds,
    materialName,
    createdAt: auditMetaData.createdAt,
    createdBy: auditMetaData.createdBy,
    updatedAt: auditMetaData.updatedAt,
    updatedBy: auditMetaData.updatedBy,
    auditMetaData,
});

const demoSteps: StepDTO[] = [
    toStep(1, 'Surface milling', 'First-pass milling on CNC machine.', true, 7200, 'Aluminum 6061'),
    toStep(2, 'Thread drilling', 'Drill and tap mounting holes.', true, 5400, 'Aluminum 6061'),
    toStep(3, 'Laser cutting', 'Cut cover plate profile.', false, 3600, 'Steel S45C'),
    toStep(4, 'Heat treatment', 'Run batch heat treatment.', true, 7200, 'Steel S45C'),
    toStep(5, 'Final inspection', 'Measure critical dimensions before packing.', true, 1800, 'Finished part'),
];

const getNextStepId = () => Math.max(...demoSteps.map((step) => step.standardStepId), 0) + 1;

const findStep = (standardStepId: number) => {
    const step = demoSteps.find((item) => item.standardStepId === standardStepId);
    if (!step) {
        throw new Error('Demo step was not found');
    }

    return step;
};

const touchStep = (step: StepDTO) => {
    const now = new Date().toISOString();
    step.updatedAt = now;
    step.updatedBy = 'Demo Admin';
    step.auditMetaData = {
        ...(step.auditMetaData ?? auditMetaData),
        updatedAt: now,
        updatedBy: 'Demo Admin',
    };
};

export class DemoStepService {
    static async getAllSteps(): Promise<StepDTO[]> {
        return clone(demoSteps);
    }

    static async createStep(data: CreateStepRequest): Promise<StepDTO> {
        const now = new Date().toISOString();
        const step: StepDTO = {
            standardStepId: getNextStepId(),
            stepName: data.stepName,
            description: data.description ?? null,
            requiresQc: data.requiresQc,
            defaultCompletionTimeSeconds: data.defaultCompletionTimeSeconds ?? null,
            materialName: data.materialName ?? null,
            createdAt: now,
            createdBy: 'Demo Admin',
            updatedAt: now,
            updatedBy: 'Demo Admin',
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };

        demoSteps.push(step);

        return clone(step);
    }

    static async updateStep(data: UpdateStepRequest): Promise<StepDTO> {
        const step = findStep(data.standardStepId);

        step.stepName = data.stepName;
        step.description = data.description ?? null;
        step.requiresQc = data.requiresQc;
        step.defaultCompletionTimeSeconds = data.defaultCompletionTimeSeconds ?? null;
        step.materialName = data.materialName ?? null;
        touchStep(step);

        return clone(step);
    }

    static async getStepById(id: number): Promise<StepDTO> {
        return clone(findStep(id));
    }

    static async deleteStep(id: number): Promise<void> {
        const targetIndex = demoSteps.findIndex((step) => step.standardStepId === id);
        if (targetIndex === -1) {
            throw new Error('Demo step was not found');
        }

        demoSteps.splice(targetIndex, 1);
    }
}
