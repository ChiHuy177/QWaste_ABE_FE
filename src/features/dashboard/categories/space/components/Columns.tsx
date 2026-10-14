import { useState } from 'react';
import { TFunction } from 'i18next';
import { SpaceWithChildrenResponse } from '@/types/Space';
import { Button, Dropdown, Popconfirm, Tag, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    EllipsisOutlined,
    EyeOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { spaceLevelColors, spaceLevelTextColors } from '@/configs/antdTheme';
import { AppAbility } from '@/configs/permissions/caslAbility';

const ACTION_BUTTON_SIZE = 34;
const ACTION_BUTTON_GAP = 8;

export interface SpaceTableColumnProps {
    onView: (space: SpaceWithChildrenResponse) => void;
    onEdit: (space: SpaceWithChildrenResponse) => void;
    onDelete: (space: SpaceWithChildrenResponse) => void;
    onAddChild: (parentSpace: SpaceWithChildrenResponse) => void;
    maxSpaceLevel: number;
    isMobile: boolean;
    t: TFunction;
    ability: AppAbility;
}

export const getSpaceTableColumns = ({
    onView,
    onEdit,
    onDelete,
    onAddChild,
    maxSpaceLevel,
    isMobile,
    t,
    ability,
}: SpaceTableColumnProps): ColumnsType<SpaceWithChildrenResponse> => {
    const canCreateSpace = ability.can('create', 'space');
    const canUpdateSpace = ability.can('update', 'space');
    const canDeleteSpace = ability.can('delete', 'space');
    const hasOverflowActions = canCreateSpace || canDeleteSpace;
    const visibleActionCount = 1 + (canUpdateSpace ? 1 : 0) + (hasOverflowActions ? 1 : 0);
    const actionColumnWidth =
        visibleActionCount * ACTION_BUTTON_SIZE + (visibleActionCount - 1) * ACTION_BUTTON_GAP + 32;
    const actionButtonStyle = {
        width: ACTION_BUTTON_SIZE,
        height: ACTION_BUTTON_SIZE,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
    const actionSlotStyle = {
        width: ACTION_BUTTON_SIZE,
        height: ACTION_BUTTON_SIZE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    return [
        {
            title: t('spaceManagement.table.headers.spaceName'),
            dataIndex: 'spaceName',
            key: 'spaceName',
            ...(isMobile ? {} : { fixed: 'left' }),
            width: isMobile ? 180 : 300,
            render: (text: string, record: SpaceWithChildrenResponse) => {
                const childCount = record.children?.length || 0;
                const level = record.spaceLevel?.spaceLevel || 1;
                const dynamicFontWeight = level === 1 ? 600 : level === 2 ? 500 : 400;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span
                                style={{
                                    fontWeight: dynamicFontWeight,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                                title={text}
                            >
                                {text}
                            </span>
                            {childCount > 0 && (
                                <Tag
                                    color="blue"
                                    variant="filled"
                                    style={{
                                        flexShrink: 0,
                                        borderRadius: 10,
                                        padding: '0 6px',
                                        fontSize: 11,
                                        lineHeight: '18px',
                                        margin: 0,
                                    }}
                                >
                                    {childCount}
                                </Tag>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: t('spaceManagement.table.headers.spaceCode'),
            dataIndex: 'spaceCode',
            key: 'spaceCode',
            width: 150,
            responsive: ['md'],
        },
        {
            title: t('spaceManagement.table.headers.level'),
            key: 'level',
            width: 150,
            render: (_, record: SpaceWithChildrenResponse) => {
                const level = record.spaceLevel?.spaceLevel;
                const levelName = record.spaceLevel?.spaceLevelName;

                const color = spaceLevelColors[level as keyof typeof spaceLevelColors] || 'default';
                const textColor = spaceLevelTextColors[level as keyof typeof spaceLevelTextColors];

                return (
                    <Tag color={color} variant="solid" style={{ color: textColor }}>
                        {levelName} (L{level})
                    </Tag>
                );
            },
        },
        {
            title: t('spaceManagement.table.headers.displayOrder'),
            dataIndex: 'displayOrder',
            key: 'displayOrder',
            width: 100,
            align: 'center',
            responsive: ['lg'],
        },
        {
            title: t('spaceManagement.table.headers.actions'),
            key: 'actions',
            align: 'center',
            ...(isMobile ? {} : { fixed: 'right' }),
            width: isMobile ? actionColumnWidth : Math.max(actionColumnWidth, 180),
            onCell: () => ({
                style: {
                    whiteSpace: 'nowrap',
                },
                onClick: (e) => e.stopPropagation(),
            }),
            render: (_, record: SpaceWithChildrenResponse) => (
                <SpaceActionCell
                    record={record}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddChild={onAddChild}
                    maxSpaceLevel={maxSpaceLevel}
                    canCreateSpace={canCreateSpace}
                    canUpdateSpace={canUpdateSpace}
                    canDeleteSpace={canDeleteSpace}
                    hasOverflowActions={hasOverflowActions}
                    visibleActionCount={visibleActionCount}
                    actionSlotStyle={actionSlotStyle}
                    actionButtonStyle={actionButtonStyle}
                    t={t}
                />
            ),
        },
    ];
};

interface SpaceActionCellProps {
    record: SpaceWithChildrenResponse;
    onView: (space: SpaceWithChildrenResponse) => void;
    onEdit: (space: SpaceWithChildrenResponse) => void;
    onDelete: (space: SpaceWithChildrenResponse) => void;
    onAddChild: (parentSpace: SpaceWithChildrenResponse) => void;
    maxSpaceLevel: number;
    canCreateSpace: boolean;
    canUpdateSpace: boolean;
    canDeleteSpace: boolean;
    hasOverflowActions: boolean;
    visibleActionCount: number;
    actionSlotStyle: React.CSSProperties;
    actionButtonStyle: React.CSSProperties;
    t: TFunction;
}

const SpaceActionCell = ({
    record,
    onView,
    onEdit,
    onDelete,
    onAddChild,
    maxSpaceLevel,
    canCreateSpace,
    canUpdateSpace,
    canDeleteSpace,
    hasOverflowActions,
    visibleActionCount,
    actionSlotStyle,
    actionButtonStyle,
    t,
}: SpaceActionCellProps) => {
    const [popconfirmOpen, setPopconfirmOpen] = useState(false);
    const isMaxLevel = (record.spaceLevel?.spaceLevel ?? 0) >= maxSpaceLevel;
    const hasChildren = !!record.children && record.children.length > 0;

    const overflowItems: MenuProps['items'] = [
        ...(canCreateSpace
            ? [
                  {
                      key: 'add-child',
                      icon: <PlusOutlined />,
                      label: t('spaceManagement.actions.create'),
                      disabled: isMaxLevel,
                  },
              ]
            : []),
        ...(canCreateSpace && canDeleteSpace ? [{ type: 'divider' as const }] : []),
        ...(canDeleteSpace
            ? [
                  {
                      key: 'delete',
                      danger: true,
                      icon: <DeleteOutlined />,
                      label: hasChildren
                          ? t('spaceManagement.errors.cannotDeleteHasChildren')
                          : t('spaceManagement.actions.delete'),
                      disabled: hasChildren,
                  },
              ]
            : []),
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${visibleActionCount}, ${ACTION_BUTTON_SIZE}px)`,
                gap: ACTION_BUTTON_GAP,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <span style={actionSlotStyle}>
                <Tooltip title={t('common.view')}>
                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(record);
                        }}
                        aria-label={t('common.view')}
                        style={actionButtonStyle}
                    />
                </Tooltip>
            </span>

            {canUpdateSpace && (
                <span style={actionSlotStyle}>
                    <Tooltip title={t('spaceManagement.actions.edit')}>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(record);
                            }}
                            style={actionButtonStyle}
                        />
                    </Tooltip>
                </span>
            )}

            {hasOverflowActions && (
                <span style={actionSlotStyle}>
                    <Popconfirm
                        open={popconfirmOpen}
                        onOpenChange={(open) => {
                            if (!open) {
                                setPopconfirmOpen(false);
                            }
                        }}
                        title={t('spaceManagement.dialogs.deleteConfirmation.title')}
                        description={t('spaceManagement.dialogs.deleteConfirmation.description')}
                        onConfirm={(e) => {
                            e?.stopPropagation();
                            setPopconfirmOpen(false);
                            onDelete(record);
                        }}
                        onCancel={(e) => {
                            e?.stopPropagation();
                            setPopconfirmOpen(false);
                        }}
                        okText={t('common.yes')}
                        cancelText={t('common.no')}
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                        trigger={[]}
                    >
                        <Tooltip title={t('common.moreActions', { defaultValue: 'More actions' })}>
                            <Dropdown
                                trigger={['click']}
                                menu={{
                                    items: overflowItems,
                                    onClick: ({ key, domEvent }) => {
                                        domEvent.stopPropagation();

                                        if (key === 'add-child' && !isMaxLevel) {
                                            onAddChild(record);
                                        }

                                        if (key === 'delete' && !hasChildren) {
                                            setPopconfirmOpen(true);
                                        }
                                    },
                                }}
                            >
                                <Button
                                    type="default"
                                    icon={<EllipsisOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={t('common.moreActions', {
                                        defaultValue: 'More actions',
                                    })}
                                    style={actionButtonStyle}
                                />
                            </Dropdown>
                        </Tooltip>
                    </Popconfirm>
                </span>
            )}
        </div>
    );
};
