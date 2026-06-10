import React, { useState, useEffect } from 'react';
import { TreeSelect, TreeSelectProps, Tooltip } from 'antd';
import { SpaceService } from '@/services/SpaceService';
import { SpaceWithChildrenResponse } from '@/types/Space';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface SpaceTreeSelectProps extends Omit<TreeSelectProps<any>, 'treeData'> {
    treeData?: any[];
}

export const mapSpaceTreeToTreeSelect = (
    nodes: SpaceWithChildrenResponse[],
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

export const SpaceTreeSelect: React.FC<SpaceTreeSelectProps> = ({
    treeData: externalTreeData,
    dropdownStyle,
    styles,
    style,
    disabled,
    placeholder,
    value,
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

    return (
        <TreeSelect
            placeholder={placeholder || t('common.selectSpace')}
            style={{ width: '100%', ...style }}
            treeData={displayData}
            loading={isActuallyLoading}
            allowClear
            treeDefaultExpandAll={false}
            showSearch
            treeNodeFilterProp="label"
            treeNodeLabelProp="displayLabel"
            styles={{
                ...styles,
                popup: {
                    ...styles?.popup,
                    root: {
                        maxHeight: 400,
                        overflow: 'auto',
                        ...dropdownStyle,
                        ...styles?.popup?.root,
                    },
                },
            }}
            {...props}
            value={safeValue}
            disabled={disabled || isActuallyLoading || (!isActuallyLoading && isDataEmpty)}
        />
    );
};
