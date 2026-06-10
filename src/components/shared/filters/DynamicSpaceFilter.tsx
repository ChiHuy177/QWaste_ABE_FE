import React, { useMemo } from 'react';
import { Select } from 'antd';
import { SpacePickingWithChildren } from '@/types/Space';
import { useTranslation } from 'react-i18next';

interface DynamicSpaceFilterProps {
    spacesTree: SpacePickingWithChildren[];
    selectedPath: (number | undefined)[];
    onChange: (levelIndex: number, spaceId: number | undefined) => void;
    isLoading?: boolean;
}

export const DynamicSpaceFilter: React.FC<DynamicSpaceFilterProps> = ({
    spacesTree,
    selectedPath,
    onChange,
    isLoading = false,
}) => {
    const { t } = useTranslation();

    const levelsData = useMemo(() => {
        const levels: { spaces: SpacePickingWithChildren[], levelName: string }[] = [];

        let currentLevelSpaces = spacesTree;

        // Loop as long as there are items to show at the current depth
        for (let depth = 0; currentLevelSpaces && currentLevelSpaces.length > 0; depth++) {
            const firstSpace = currentLevelSpaces[0];
            const levelName = firstSpace.spaceLevel?.spaceLevelName || `Level ${depth + 1}`;

            levels.push({ spaces: currentLevelSpaces, levelName });

            // Evaluate if we have a selected id at this depth
            const selectedId = selectedPath[depth];
            if (selectedId !== undefined) {
                const selectedNode = currentLevelSpaces.find(s => s.spaceId === selectedId);
                currentLevelSpaces = selectedNode?.children || [];
            } else {
                break;
            }
        }

        return levels;
    }, [spacesTree, selectedPath]);

    if (spacesTree.length === 0 && !isLoading) {
        return null;
    }

    return (
        <>
            {levelsData.map((level, index) => {
                const selectedValue = selectedPath[index];
                const isDisabled = index > 0 && selectedPath[index - 1] === undefined;

                return (
                    <Select
                        key={`space-level-${index}`}
                        placeholder={`Select ${level.levelName}`}
                        value={selectedValue}
                        onChange={(value) => onChange(index, value)}
                        style={{ width: 150, minWidth: 100 }}
                        loading={isLoading}
                        disabled={isLoading || isDisabled || level.spaces.length === 0}
                        options={level.spaces.map((space) => ({
                            label: index === 2
                                ? `${t('common.filters.line', 'Line')} ${space.displayOrder}: ${space.spaceName}`
                                : space.spaceCode || space.spaceName,
                            value: space.spaceId,
                        }))}
                        allowClear={false}
                    />
                );
            })}
        </>
    );
};
