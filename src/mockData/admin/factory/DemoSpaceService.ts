import type {
    SpaceCRUDResponse,
    SpaceCreationRequest,
    SpaceDetailResponse,
    SpacePickingResponse,
    SpacePickingWithChildren,
    SpaceUpdationRequest,
    SpaceWithChildrenResponse,
} from '@/types/Space';
import { DEMO_SPACE_AUDIT, demoSpaceLevels, demoSpaceTree } from './spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const touch = () => ({
    ...DEMO_SPACE_AUDIT,
    updatedAt: new Date().toISOString(),
});

const findLevelById = (spaceLevelId: number) => {
    const level = demoSpaceLevels.find((item) => item.spaceLevelId === spaceLevelId);
    if (!level) {
        throw new Error('Demo space level was not found');
    }

    return {
        spaceLevelId: level.spaceLevelId,
        spaceLevel: level.spaceLevel,
        spaceLevelName: level.spaceLevelName,
    };
};

const walkSpaces = (
    spaces: SpaceWithChildrenResponse[],
    visitor: (space: SpaceWithChildrenResponse) => void
) => {
    spaces.forEach((space) => {
        visitor(space);
        walkSpaces(space.children ?? [], visitor);
    });
};

const findSpace = (
    spaces: SpaceWithChildrenResponse[],
    spaceId: number
): SpaceWithChildrenResponse | null => {
    for (const space of spaces) {
        if (space.spaceId === spaceId) return space;

        const found = findSpace(space.children ?? [], spaceId);
        if (found) return found;
    }

    return null;
};

const findParentCollection = (
    spaces: SpaceWithChildrenResponse[],
    spaceId: number
): SpaceWithChildrenResponse[] | null => {
    if (spaces.some((space) => space.spaceId === spaceId)) return spaces;

    for (const space of spaces) {
        const found = findParentCollection(space.children ?? [], spaceId);
        if (found) return found;
    }

    return null;
};

const getNextSpaceId = () => {
    let maxId = 0;
    walkSpaces(demoSpaceTree, (space) => {
        maxId = Math.max(maxId, space.spaceId);
    });

    return maxId + 1;
};

const toDetail = (space: SpaceWithChildrenResponse): SpaceDetailResponse => {
    const parent = space.parentId ? findSpace(demoSpaceTree, space.parentId) : null;

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

const toCrudResponse = (
    space: SpaceWithChildrenResponse,
    prevParentId: number | null
): SpaceCRUDResponse => ({
    spaceId: space.spaceId,
    spaceCode: space.spaceCode,
    spaceName: space.spaceName,
    description: space.description,
    displayOrder: space.displayOrder,
    spaceLevel: space.spaceLevel,
    newParentId: space.parentId,
    prevParentId,
});

const toPickingSpace = (space: SpaceWithChildrenResponse): SpacePickingResponse => ({
    spaceId: space.spaceId,
    spaceCode: space.spaceCode,
    spaceName: space.spaceName,
    displayOrder: space.displayOrder,
    spaceLevel: space.spaceLevel,
});

const toPickingWithChildren = (space: SpaceWithChildrenResponse): SpacePickingWithChildren => ({
    spaceId: space.spaceId,
    parentId: space.parentId ?? 0,
    spaceCode: space.spaceCode,
    spaceName: space.spaceName,
    description: space.description ?? '',
    displayOrder: space.displayOrder,
    spaceLevel: space.spaceLevel,
    children: (space.children ?? []).map(toPickingWithChildren),
});

const collectByLevel = (level: number) => {
    const spaces: SpaceWithChildrenResponse[] = [];

    walkSpaces(demoSpaceTree, (space) => {
        if (space.spaceLevel.spaceLevel === level) {
            spaces.push(space);
        }
    });

    return spaces;
};

export class DemoSpaceService {
    static async getSpaceById(spaceId: number | string): Promise<SpaceDetailResponse> {
        const space = findSpace(demoSpaceTree, Number(spaceId));
        if (!space) {
            throw new Error('Demo space was not found');
        }

        return clone(toDetail(space));
    }

    static async getAllSpacesTree(): Promise<SpaceWithChildrenResponse[]> {
        return clone(demoSpaceTree);
    }

    static async getSpacesByLevelWithChildren(level: number): Promise<SpacePickingWithChildren[]> {
        return clone(collectByLevel(level).map(toPickingWithChildren));
    }

    static async getSpacesByLevel(level: number): Promise<SpacePickingWithChildren[]> {
        return clone(collectByLevel(level).map(toPickingWithChildren));
    }

    static async getRootSpacesForRegistration(): Promise<SpacePickingResponse[]> {
        return clone(demoSpaceTree.map(toPickingSpace));
    }

    static async createSpace(spaceData: SpaceCreationRequest): Promise<SpaceCRUDResponse> {
        const parentSpaceId = spaceData.parentSpaceId ?? null;
        const targetCollection = parentSpaceId
            ? findSpace(demoSpaceTree, parentSpaceId)?.children
            : demoSpaceTree;

        if (!targetCollection) {
            throw new Error('Demo parent space was not found');
        }

        const spaceLevelId =
            spaceData.spaceLevelId ??
            (parentSpaceId
                ? (findSpace(demoSpaceTree, parentSpaceId)?.spaceLevel.spaceLevelId ?? 0) + 1
                : 1);

        const newSpace: SpaceWithChildrenResponse = {
            spaceId: getNextSpaceId(),
            parentId: parentSpaceId,
            spaceCode: spaceData.spaceCode,
            spaceName: spaceData.spaceName,
            description: spaceData.description ?? null,
            displayOrder: spaceData.displayOrder ?? targetCollection.length + 1,
            auditMetaData: touch(),
            spaceLevel: findLevelById(spaceLevelId),
            children: [],
        };

        targetCollection.push(newSpace);

        return clone(toCrudResponse(newSpace, null));
    }

    static async updateSpace(spaceData: SpaceUpdationRequest): Promise<SpaceCRUDResponse> {
        const space = findSpace(demoSpaceTree, spaceData.spaceId);
        if (!space) {
            throw new Error('Demo space was not found');
        }

        const prevParentId = space.parentId;
        const nextParentId = spaceData.parentSpaceId ?? space.parentId;

        space.spaceCode = spaceData.spaceCode;
        space.spaceName = spaceData.spaceName;
        space.description = spaceData.description ?? null;
        space.displayOrder = spaceData.displayOrder ?? space.displayOrder;
        space.auditMetaData = touch();

        if (nextParentId !== prevParentId) {
            const currentCollection = findParentCollection(demoSpaceTree, space.spaceId);
            const nextCollection = nextParentId
                ? findSpace(demoSpaceTree, nextParentId)?.children
                : demoSpaceTree;

            if (!currentCollection || !nextCollection) {
                throw new Error('Demo target parent space was not found');
            }

            const currentIndex = currentCollection.findIndex((item) => item.spaceId === space.spaceId);
            currentCollection.splice(currentIndex, 1);
            space.parentId = nextParentId;
            nextCollection.push(space);
        }

        return clone(toCrudResponse(space, prevParentId));
    }

    static async deleteSpace(spaceId: number | string): Promise<void> {
        const targetId = Number(spaceId);
        const space = findSpace(demoSpaceTree, targetId);
        if (!space) {
            throw new Error('Demo space was not found');
        }

        if (space.children && space.children.length > 0) {
            throw new Error('Demo space has child spaces');
        }

        const parentCollection = findParentCollection(demoSpaceTree, targetId);
        if (!parentCollection) {
            throw new Error('Demo parent space was not found');
        }

        const targetIndex = parentCollection.findIndex((item) => item.spaceId === targetId);
        parentCollection.splice(targetIndex, 1);
    }
}
