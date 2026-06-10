import type { SpaceWithChildrenResponse } from '@/types/Space';
import type { SpaceLevelDTO } from '@/types/SpaceLevel';

export const DEMO_SPACE_AUDIT = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

export const demoSpaceLevels: SpaceLevelDTO[] = [
    {
        spaceLevelId: 1,
        spaceLevel: 1,
        spaceLevelName: 'Factory',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        spaceLevelId: 2,
        spaceLevel: 2,
        spaceLevelName: 'Zone',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        spaceLevelId: 3,
        spaceLevel: 3,
        spaceLevelName: 'Line',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
];

const getSpaceLevel = (spaceLevelId: number) => {
    const level = demoSpaceLevels.find((item) => item.spaceLevelId === spaceLevelId);
    if (!level) {
        throw new Error(`Demo space level ${spaceLevelId} was not found`);
    }

    return {
        spaceLevelId: level.spaceLevelId,
        spaceLevel: level.spaceLevel,
        spaceLevelName: level.spaceLevelName,
    };
};

export const demoSpaceTree: SpaceWithChildrenResponse[] = [
    {
        spaceId: 1,
        parentId: null,
        spaceCode: 'FACTORY-A',
        spaceName: 'Factory A',
        description: 'Demo production factory',
        displayOrder: 1,
        auditMetaData: DEMO_SPACE_AUDIT,
        spaceLevel: getSpaceLevel(1),
        children: [
            {
                spaceId: 11,
                parentId: 1,
                spaceCode: 'ZONE-A1',
                spaceName: 'Zone A1 - CNC',
                description: 'CNC machining area',
                displayOrder: 1,
                auditMetaData: DEMO_SPACE_AUDIT,
                spaceLevel: getSpaceLevel(2),
                children: [
                    {
                        spaceId: 111,
                        parentId: 11,
                        spaceCode: 'LINE-A1-01',
                        spaceName: 'Line A1 / CNC milling',
                        description: 'CNC milling production line',
                        displayOrder: 1,
                        auditMetaData: DEMO_SPACE_AUDIT,
                        spaceLevel: getSpaceLevel(3),
                        children: [],
                    },
                    {
                        spaceId: 112,
                        parentId: 11,
                        spaceCode: 'LINE-A1-02',
                        spaceName: 'Line A1 / CNC turning',
                        description: 'CNC turning production line',
                        displayOrder: 2,
                        auditMetaData: DEMO_SPACE_AUDIT,
                        spaceLevel: getSpaceLevel(3),
                        children: [],
                    },
                ],
            },
            {
                spaceId: 12,
                parentId: 1,
                spaceCode: 'ZONE-A2',
                spaceName: 'Zone A2 - Cutting',
                description: 'Laser cutting and heat treatment area',
                displayOrder: 2,
                auditMetaData: DEMO_SPACE_AUDIT,
                spaceLevel: getSpaceLevel(2),
                children: [
                    {
                        spaceId: 121,
                        parentId: 12,
                        spaceCode: 'LINE-A2-01',
                        spaceName: 'Line A2 / Laser cutting',
                        description: 'Laser cutting production line',
                        displayOrder: 1,
                        auditMetaData: DEMO_SPACE_AUDIT,
                        spaceLevel: getSpaceLevel(3),
                        children: [],
                    },
                ],
            },
        ],
    },
];
