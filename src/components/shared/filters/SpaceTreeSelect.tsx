import React, { useState, useEffect, useRef } from 'react';
import { TreeSelect, TreeSelectProps, Tooltip, Tag } from 'antd';
import { SpaceService } from '@/services/SpaceService';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';

export interface SpaceTreeSelectOption {
    value: number;
    title: React.ReactNode;
    label: string;
    displayLabel: React.ReactNode;
    disabled?: boolean;
    children?: SpaceTreeSelectOption[];
}

type TreeSelectChangeExtra = Parameters<NonNullable<TreeSelectProps['onChange']>>[2];

export interface SpaceTreeSelectProps extends Omit<TreeSelectProps<number>, 'treeData'> {
    treeData?: SpaceTreeSelectOption[];
    autoSelectFirst?: boolean;
    autoSelectFirstChild?: boolean;
}

export interface SpaceTreeNode {
    spaceId: number;
    spaceName: string;
    spaceLevel?: { spaceLevel?: number } | number | Record<string, unknown>;
    children?: SpaceTreeNode[];
}

export interface MapSpaceTreeOptions {
    maxSelectableLevel?: number;
    targetSelectableLevel?: number;
    maxDepthLevel?: number;
    disabledSpaceIds?: number[];
    maxBadgeText?: string;
    t?: TFunction;
}

const extractNodeLevel = (node: SpaceTreeNode): number => {
    const rawLevel =
        typeof node.spaceLevel === 'object' && node.spaceLevel !== null
            ? ((
                  node.spaceLevel as {
                      spaceLevel?: number;
                      space_level?: number;
                      level?: number;
                  }
              ).spaceLevel ??
              (node.spaceLevel as { space_level?: number }).space_level ??
              (node.spaceLevel as { level?: number }).level)
            : node.spaceLevel;
    return Number(rawLevel ?? 0);
};

export const mapSpaceTreeToTreeSelect = (
    nodes: SpaceTreeNode[],
    parentPathName: string = '',
    options?: MapSpaceTreeOptions
): SpaceTreeSelectOption[] => {
    const hasTargetLevel =
        options?.targetSelectableLevel !== undefined && options.targetSelectableLevel > 0;

    const hasValidCandidate = (n: SpaceTreeNode): boolean => {
        const lvl = extractNodeLevel(n);
        if (lvl === options?.targetSelectableLevel) {
            return true;
        }
        if (n.children && n.children.length > 0) {
            return n.children.some(hasValidCandidate);
        }
        return false;
    };

    const targetNodes = hasTargetLevel ? nodes.filter(hasValidCandidate) : nodes;

    return targetNodes.map((node) => {
        const currentPathName = parentPathName
            ? `${parentPathName} / ${node.spaceName}`
            : node.spaceName;

        const levelNum = extractNodeLevel(node);

        const isTargetLevelCandidate = hasTargetLevel && levelNum === options.targetSelectableLevel;
        const isLevelMismatched = hasTargetLevel && levelNum !== options.targetSelectableLevel;

        const isMaxLevelReached =
            !hasTargetLevel &&
            options?.maxSelectableLevel !== undefined &&
            options.maxSelectableLevel > 0 &&
            levelNum >= options.maxSelectableLevel;

        const isExcluded = options?.disabledSpaceIds?.includes(node.spaceId) ?? false;
        const isDisabled = isLevelMismatched || isMaxLevelReached || isExcluded;

        const maxBadgeText =
            options?.maxBadgeText ??
            (options?.t
                ? options.t('spaceManagement.maxLevelBadge', { defaultValue: 'Tối đa' })
                : 'Tối đa');

        const shouldStopRecursion =
            options?.maxDepthLevel !== undefined &&
            options.maxDepthLevel > 0 &&
            levelNum >= options.maxDepthLevel;

        return {
            value: node.spaceId,
            disabled: isDisabled,
            title: (
                <span
                    title={
                        isMaxLevelReached ? `${node.spaceName} (${maxBadgeText})` : node.spaceName
                    }
                    style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        opacity: isDisabled ? 0.45 : 1,
                    }}
                >
                    {node.spaceName}
                    {isMaxLevelReached && (
                        <Tag
                            color="error"
                            variant="filled"
                            style={{
                                fontSize: 10,
                                marginInlineStart: 6,
                                marginInlineEnd: 0,
                                paddingInline: 4,
                                lineHeight: '16px',
                            }}
                        >
                            {maxBadgeText}
                        </Tag>
                    )}
                    {hasTargetLevel && levelNum > 0 && (
                        <Tag
                            color={isTargetLevelCandidate ? 'processing' : 'default'}
                            variant="filled"
                            style={{
                                fontSize: 10,
                                marginInlineStart: 6,
                                marginInlineEnd: 0,
                                paddingInline: 4,
                                lineHeight: '16px',
                            }}
                        >
                            {options?.t
                                ? options.t('spaceManagement.levelBadge', {
                                      level: levelNum,
                                      defaultValue: `Cấp ${levelNum}`,
                                  })
                                : `Cấp ${levelNum}`}
                        </Tag>
                    )}
                </span>
            ),
            label: currentPathName,
            displayLabel: (
                <Tooltip title={currentPathName} placement="bottomLeft">
                    <span>{currentPathName}</span>
                </Tooltip>
            ),
            children:
                !shouldStopRecursion && node.children && node.children.length > 0
                    ? mapSpaceTreeToTreeSelect(node.children, currentPathName, options)
                    : undefined,
        };
    });
};

let cachedTreeData: SpaceTreeSelectOption[] | null = null;
let fetchPromise: Promise<SpaceTreeSelectOption[]> | null = null;

const findFirstTreeValue = (
    nodes: SpaceTreeSelectOption[],
    preferFirstChild = false
): number | undefined => {
    const firstNode = nodes[0];
    if (!firstNode) return undefined;

    if (preferFirstChild && firstNode.children && firstNode.children.length > 0) {
        return firstNode.children[0].value;
    }

    return firstNode.value;
};

export const SpaceTreeSelect: React.FC<SpaceTreeSelectProps> = ({
    treeData: externalTreeData,
    autoSelectFirst = false,
    autoSelectFirstChild = false,
    dropdownStyle,
    styles,
    style,
    disabled,
    placeholder,
    value,
    onChange,
    ...props
}) => {
    const { t } = useTranslation();
    const [internalTreeData, setInternalTreeData] = useState<SpaceTreeSelectOption[]>(
        cachedTreeData || []
    );
    const [loading, setLoading] = useState<boolean>(
        !cachedTreeData && externalTreeData === undefined
    );

    useEffect(() => {
        if (externalTreeData !== undefined) return;

        if (cachedTreeData) {
            setInternalTreeData(cachedTreeData);
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadData = async () => {
            try {
                setLoading(true);

                if (!fetchPromise) {
                    fetchPromise = SpaceService.getAllSpacesTree().then((response) => {
                        return mapSpaceTreeToTreeSelect(response, '', { t });
                    });
                }

                const mappedData = await fetchPromise;

                cachedTreeData = mappedData;

                if (isMounted) {
                    setInternalTreeData(mappedData);
                }
            } catch (error) {
                console.error('Error fetching space tree:', error);
                if (isMounted) {
                    toast.error(t('spaceManagement.fetchError'));
                }
                fetchPromise = null;
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [externalTreeData, t]);

    const displayData = externalTreeData !== undefined ? externalTreeData : internalTreeData;
    const isActuallyLoading = loading && externalTreeData === undefined;
    const isDataEmpty = displayData.length === 0;

    // Remove undefined hacking. Force numeric cast to satisfy Ant Design strict equality `===` checks.
    const safeValue = value !== undefined && value !== null ? Number(value) : undefined;
    const hasAutoSelectedRef = useRef(false);

    useEffect(() => {
        if (!autoSelectFirst || hasAutoSelectedRef.current || safeValue !== undefined) return;
        if (isActuallyLoading || isDataEmpty) return;

        const firstValue = findFirstTreeValue(displayData, autoSelectFirstChild);
        if (firstValue === undefined) return;

        hasAutoSelectedRef.current = true;
        onChange?.(firstValue, [], {} as TreeSelectChangeExtra);
    }, [
        autoSelectFirst,
        autoSelectFirstChild,
        displayData,
        isActuallyLoading,
        isDataEmpty,
        onChange,
        safeValue,
    ]);

    const stylesObj = typeof styles === 'function' ? {} : (styles ?? {});
    const mergedStyles = {
        ...stylesObj,
        popup: {
            ...stylesObj.popup,
            root: {
                maxHeight: 400,
                overflow: 'auto',
                ...dropdownStyle,
                ...stylesObj.popup?.root,
            },
        },
    };

    return (
        <TreeSelect
            placeholder={placeholder || t('common.selectSpace')}
            style={{ width: '100%', ...style }}
            treeData={displayData}
            loading={isActuallyLoading}
            allowClear
            treeDefaultExpandAll={props.treeDefaultExpandAll ?? false}
            showSearch={{ treeNodeFilterProp: 'label' }}
            treeNodeLabelProp="displayLabel"
            styles={mergedStyles}
            {...props}
            onChange={onChange}
            value={safeValue}
            disabled={disabled || isActuallyLoading || (!isActuallyLoading && isDataEmpty)}
        />
    );
};
