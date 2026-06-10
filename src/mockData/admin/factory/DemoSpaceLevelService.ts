import type { PaginatedResult } from '@/types/Common';
import type {
    SpaceLevelCreationRequest,
    SpaceLevelDTO,
    SpaceLevelsPaginatedParams,
    SpaceLevelUpdationRequest,
} from '@/types/SpaceLevel';
import { DEMO_SPACE_AUDIT, demoSpaceLevels, demoSpaceTree } from './spaces';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const touch = () => ({
    ...DEMO_SPACE_AUDIT,
    updatedAt: new Date().toISOString(),
});

const getNextSpaceLevelId = () =>
    Math.max(...demoSpaceLevels.map((level) => level.spaceLevelId), 0) + 1;

const compareSpaceLevel = (left: SpaceLevelDTO, right: SpaceLevelDTO, sortParam: string) => {
    const [field, direction] = sortParam.split(',');
    const directionMultiplier = direction === 'ASC' ? 1 : -1;

    if (field === 'spaceLevelName') {
        return left.spaceLevelName.localeCompare(right.spaceLevelName) * directionMultiplier;
    }

    return (left.spaceLevel - right.spaceLevel) * directionMultiplier;
};

const isSpaceLevelUsed = (spaceLevelId: number): boolean => {
    const pendingSpaces = [...demoSpaceTree];

    while (pendingSpaces.length > 0) {
        const currentSpace = pendingSpaces.pop();
        if (!currentSpace) continue;
        if (currentSpace.spaceLevel.spaceLevelId === spaceLevelId) return true;

        pendingSpaces.push(...(currentSpace.children ?? []));
    }

    return false;
};

const syncSpaceLevelReferences = (updatedLevel: SpaceLevelDTO) => {
    const pendingSpaces = [...demoSpaceTree];

    while (pendingSpaces.length > 0) {
        const currentSpace = pendingSpaces.pop();
        if (!currentSpace) continue;

        if (currentSpace.spaceLevel.spaceLevelId === updatedLevel.spaceLevelId) {
            currentSpace.spaceLevel = {
                spaceLevelId: updatedLevel.spaceLevelId,
                spaceLevel: updatedLevel.spaceLevel,
                spaceLevelName: updatedLevel.spaceLevelName,
            };
        }

        pendingSpaces.push(...(currentSpace.children ?? []));
    }
};

export class DemoSpaceLevelService {
    static async getSpaceLevelsPaginated(
        params: SpaceLevelsPaginatedParams
    ): Promise<PaginatedResult<SpaceLevelDTO>> {
        const searchTerm = params.search?.trim().toLowerCase();
        const sortParams = Array.isArray(params.sort)
            ? params.sort
            : [params.sort ?? 'spaceLevel,DESC'];

        const filteredLevels = demoSpaceLevels
            .filter((level) => {
                const matchesSearch = searchTerm
                    ? level.spaceLevelName.toLowerCase().includes(searchTerm) ||
                      level.spaceLevel.toString().includes(searchTerm)
                    : true;
                const matchesLevel =
                    params.spaceLevel === undefined || level.spaceLevel === params.spaceLevel;

                return matchesSearch && matchesLevel;
            })
            .sort((left, right) => {
                for (const sortParam of sortParams) {
                    const result = compareSpaceLevel(left, right, sortParam);
                    if (result !== 0) return result;
                }

                return 0;
            });

        const startIndex = params.page * params.size;
        const content = filteredLevels.slice(startIndex, startIndex + params.size);
        const totalPages = Math.ceil(filteredLevels.length / params.size);

        return clone({
            content,
            pageNumber: params.page,
            pageSize: params.size,
            totalElements: filteredLevels.length,
            totalPages,
            first: params.page === 0,
            last: params.page >= totalPages - 1,
            empty: content.length === 0,
        });
    }

    static async getAllSpaceLevels(): Promise<SpaceLevelDTO[]> {
        return clone([...demoSpaceLevels].sort((left, right) => left.spaceLevel - right.spaceLevel));
    }

    static async getHighestSpaceLevel(): Promise<number> {
        return Math.max(...demoSpaceLevels.map((level) => level.spaceLevel), 0);
    }

    static async createSpaceLevel(data: SpaceLevelCreationRequest): Promise<SpaceLevelDTO> {
        const newLevel: SpaceLevelDTO = {
            spaceLevelId: getNextSpaceLevelId(),
            spaceLevel: data.spaceLevel,
            spaceLevelName: data.spaceLevelName,
            auditMetaData: touch(),
        };

        demoSpaceLevels.push(newLevel);

        return clone(newLevel);
    }

    static async updateSpaceLevel(data: SpaceLevelUpdationRequest): Promise<SpaceLevelDTO> {
        const spaceLevel = demoSpaceLevels.find(
            (level) => level.spaceLevelId === data.spaceLevelId
        );
        if (!spaceLevel) {
            throw new Error('Demo space level was not found');
        }

        spaceLevel.spaceLevel = data.spaceLevel;
        spaceLevel.spaceLevelName = data.spaceLevelName;
        spaceLevel.auditMetaData = touch();
        syncSpaceLevelReferences(spaceLevel);

        return clone(spaceLevel);
    }

    static async getSpaceLevelById(id: number | string): Promise<SpaceLevelDTO> {
        const spaceLevel = demoSpaceLevels.find((level) => level.spaceLevelId === Number(id));
        if (!spaceLevel) {
            throw new Error('Demo space level was not found');
        }

        return clone(spaceLevel);
    }

    static async deleteSpaceLevel(id: number | string): Promise<void> {
        const targetId = Number(id);
        if (isSpaceLevelUsed(targetId)) {
            throw new Error('Demo space level is being used by spaces');
        }

        const targetIndex = demoSpaceLevels.findIndex((level) => level.spaceLevelId === targetId);
        if (targetIndex === -1) {
            throw new Error('Demo space level was not found');
        }

        demoSpaceLevels.splice(targetIndex, 1);
    }
}
