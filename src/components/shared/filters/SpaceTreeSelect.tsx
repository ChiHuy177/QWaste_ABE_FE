import React, { useState, useEffect, useRef } from 'react';
import { TreeSelect, TreeSelectProps, Tooltip } from 'antd';
import { SpaceService } from '@/services/SpaceService';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface SpaceTreeSelectProps extends Omit<TreeSelectProps<any>, 'treeData'> {
    treeData?: any[];
    autoSelectFirst?: boolean;
    autoSelectFirstChild?: boolean;
}

export interface SpaceTreeNode {
    spaceId: number;
    spaceName: string;
    children?: SpaceTreeNode[];
}

export const mapSpaceTreeToTreeSelect = (
    nodes: SpaceTreeNode[],
    parentPathName: string = ''
): any[] => {
    return nodes.map((node) => {
        const currentPathName = parentPathName
            ? `${parentPathName} / ${node.spaceName}`
            : node.spaceName;
        return {
            value: node.spaceId,
            title: (
                <span
                    title={node.spaceName}
                    style={{
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                    }}
                >
                    {node.spaceName}
                </span>
            ),
            label: currentPathName,
            displayLabel: (
                <Tooltip title={currentPathName} placement="bottomLeft">
                    <span>{currentPathName}</span>
                </Tooltip>
            ),
            children:
                node.children && node.children.length > 0
                    ? mapSpaceTreeToTreeSelect(node.children, currentPathName)
                    : undefined,
        };
    });
};

let cachedTreeData: any[] | null = null;
let fetchPromise: Promise<any[]> | null = null;

const findFirstTreeValue = (
    nodes: any[],
    preferFirstChild = false
): number | string | undefined => {
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
    const [internalTreeData, setInternalTreeData] = useState<any[]>(cachedTreeData || []);
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
                        return mapSpaceTreeToTreeSelect(response);
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
    const safeValue =
        value !== undefined && value !== null ? Number(value) : undefined;
    const hasAutoSelectedRef = useRef(false);

    useEffect(() => {
        if (!autoSelectFirst || hasAutoSelectedRef.current || safeValue !== undefined) return;
        if (isActuallyLoading || isDataEmpty) return;

        const firstValue = findFirstTreeValue(displayData, autoSelectFirstChild);
        if (firstValue === undefined) return;

        hasAutoSelectedRef.current = true;
        onChange?.(firstValue, [], {} as any);
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
            treeDefaultExpandAll={false}
            showSearch={{ treeNodeFilterProp: "label" }}
            treeNodeLabelProp="displayLabel"
            styles={mergedStyles}
            {...props}
            onChange={onChange}
            value={safeValue}
            disabled={disabled || isActuallyLoading || (!isActuallyLoading && isDataEmpty)}
        />
    );
};
