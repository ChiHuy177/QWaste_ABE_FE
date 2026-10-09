'use client';

import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { SpaceLevelDTO } from '@/types/SpaceLevel';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type SpaceLevelTableColumnProps = {
    onEdit?: (level: SpaceLevelDTO) => void;
    onView?: (level: SpaceLevelDTO) => void;
    onDelete?: (level: SpaceLevelDTO) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getSpaceLevelTableColumns = (
    props?: SpaceLevelTableColumnProps
): ColumnsType<SpaceLevelDTO> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'space_level') ?? false;
    const canDelete = ability?.can('delete', 'space_level') ?? false;
    const hasAnyAction = canUpdate || canDelete || canView;

    const columns: ColumnsType<SpaceLevelDTO> = [
        {
            title: () => t('spaceLevelManagement.table.headers.spaceLevel'),
            dataIndex: 'spaceLevel',
            key: 'spaceLevel',
            sorter: (a, b) => a.spaceLevel - b.spaceLevel,
            width: 150,
            align: 'center',
            render: (text: number) => {
                return (
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '0 8px',
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#0958d9',
                            background: '#e6f4ff',
                            border: '1px solid #91caff',
                            borderRadius: 4,
                            lineHeight: '22px',
                        }}
                    >
                        {text}
                    </span>
                );
            },
        },
        {
            title: () => t('spaceLevelManagement.table.headers.spaceLevelName'),
            dataIndex: 'spaceLevelName',
            key: 'spaceLevelName',
            sorter: (a, b) => a.spaceLevelName.localeCompare(b.spaceLevelName),
            width: 300,
            render: (text: string) => (
                <Text strong style={{ fontSize: 15 }}>
                    {text}
                </Text>
            ),
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('spaceLevelManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_, record: SpaceLevelDTO) => {
                return (
                    <Space size="small">
                        {canView && (
                            <Tooltip title={t('common.view')}>
                                <Button
                                    type="default"
                                    icon={<EyeOutlined />}
                                    onClick={() => props?.onView?.(record)}
                                    aria-label={t('common.view')}
                                />
                            </Tooltip>
                        )}
                        {canUpdate && (
                            <Tooltip title={t('common.edit')}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => props?.onEdit?.(record)}
                                    aria-label={t('common.edit')}
                                />
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Popconfirm
                                title={t('spaceLevelManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'spaceLevelManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                                placement="topRight"
                            >
                                <Tooltip title={t('common.delete')}>
                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        aria-label={t('common.delete')}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        });
    }

    return columns;
};
