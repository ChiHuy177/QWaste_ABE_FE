'use client';

import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Mold, MoldStatus, MoldType } from '@/types/Mold';
import { AppAbility } from '@/configs/permissions/caslAbility';
import dayjs from 'dayjs';

const { Text } = Typography;

export type MoldTableColumnProps = {
    onView?: (mold: Mold) => void;
    onEdit?: (mold: Mold) => void;
    onDelete?: (mold: Mold) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

const MOLD_TYPE_COLOR: Record<MoldType, string> = {
    PRESS: 'blue',
    COMPRESS: 'orange',
};

const MOLD_STATUS_COLOR: Record<MoldStatus, string> = {
    ACTIVE: 'green',
    MAINTENANCE: 'gold',
    RETIRED: 'red',
};

export const getMoldTableColumns = (props?: MoldTableColumnProps): ColumnsType<Mold> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'mold') ?? false;
    const canDelete = ability?.can('delete', 'mold') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<Mold> = [
        {
            title: () => t('moldManagement.table.headers.moldCode'),
            dataIndex: 'moldCode',
            key: 'moldCode',
            sorter: true,
            width: 150,
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: () => t('moldManagement.table.headers.moldName'),
            dataIndex: 'moldName',
            key: 'moldName',
            sorter: true,
            width: 220,
            ellipsis: { showTitle: false },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text strong style={{ fontSize: 14 }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('moldManagement.table.headers.quantity'),
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: true,
            width: 110,
            align: 'center',
            render: (val: number) => <Text>{val}</Text>,
        },
        {
            title: () => t('moldManagement.table.headers.moldType'),
            dataIndex: 'moldType',
            key: 'moldType',
            width: 120,
            align: 'center',
            render: (type: MoldType) => (
                <Tag color={MOLD_TYPE_COLOR[type]}>
                    {t(`moldManagement.moldType.${type}`)}
                </Tag>
            ),
        },
        {
            title: () => t('moldManagement.table.headers.status'),
            dataIndex: 'status',
            key: 'status',
            width: 140,
            align: 'center',
            render: (status: MoldStatus) => (
                <Tag color={MOLD_STATUS_COLOR[status]}>
                    {t(`moldManagement.status.${status}`)}
                </Tag>
            ),
        },
        {
            title: () => t('moldManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 250,
            ellipsis: { showTitle: false },
            render: (text: string) =>
                text ? (
                    <Tooltip placement="topLeft" title={text}>
                        <Text type="secondary">{text}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: () => t('moldManagement.table.headers.createdAt'),
            dataIndex: ['auditMetaData', 'createdAt'],
            key: 'auditMetaData.createdAt',
            sorter: true,
            width: 160,
            align: 'center',
            render: (date: string) =>
                date ? (
                    <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
                        <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: () => t('moldManagement.table.headers.updatedAt'),
            dataIndex: ['auditMetaData', 'updatedAt'],
            key: 'auditMetaData.updatedAt',
            sorter: true,
            width: 160,
            align: 'center',
            render: (date: string) =>
                date ? (
                    <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
                        <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('moldManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: Mold) => (
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
                            title={t('moldManagement.dialogs.deleteConfirmation.title')}
                            description={t('moldManagement.dialogs.deleteConfirmation.description')}
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
            ),
        });
    }

    return columns;
};
