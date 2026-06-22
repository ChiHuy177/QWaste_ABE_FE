import { SpaceWithChildrenResponse } from '@/types/Space';
import { Button, Space, Tag, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { spaceLevelColors, spaceLevelTextColors } from '@/configs/antdTheme';


export interface SpaceTableColumnProps {
    onView: (space: SpaceWithChildrenResponse) => void;
    onEdit: (space: SpaceWithChildrenResponse) => void;
    onDelete: (space: SpaceWithChildrenResponse) => void;
    onAddChild: (parentSpace: SpaceWithChildrenResponse) => void;
    maxSpaceLevel: number;
    isMobile: boolean;
    t: (key: string, options?: any) => string;
    ability: any;
    themeToken: any;
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
    themeToken,
}: SpaceTableColumnProps): ColumnsType<SpaceWithChildrenResponse> => {
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
            width: isMobile ? 140 : 180,
            render: (_, record: SpaceWithChildrenResponse) => {
                const isMaxLevel = record.spaceLevel?.spaceLevel >= maxSpaceLevel;

                return (
                    <Space size="small">
                        <Tooltip title={t('common.view')}>
                            <Button
                                type="default"
                                icon={<EyeOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView(record);
                                }}
                                aria-label={t('common.view')}
                            />
                        </Tooltip>
                        {/* Add Child Button (Invisible if at deepest level) */}
                        {!isMaxLevel && ability.can('create', 'space') && (
                            <Tooltip title={t('spaceManagement.actions.create')}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddChild(record);
                                    }}
                                    style={{
                                        backgroundColor: themeToken.colorSuccess,
                                        borderColor: themeToken.colorSuccess,
                                    }}
                                />
                            </Tooltip>
                        )}

                        {/* Edit Button */}
                        {ability.can('update', 'space') && (
                            <Tooltip title={t('spaceManagement.actions.edit')}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(record);
                                    }}
                                />
                            </Tooltip>
                        )}

                        {/* Delete Button */}
                        {ability.can('delete', 'space') && (
                            <Popconfirm
                                title={t('spaceManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'spaceManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={(e) => {
                                    e?.stopPropagation();
                                    onDelete(record);
                                }}
                                onCancel={(e) => e?.stopPropagation()}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                                disabled={record.children && record.children.length > 0}
                            >
                                <Tooltip
                                    title={
                                        record.children && record.children.length > 0
                                            ? t('spaceManagement.errors.cannotDeleteHasChildren')
                                            : t('spaceManagement.actions.delete')
                                    }
                                >
                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={record.children && record.children.length > 0}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        },
    ];
};
