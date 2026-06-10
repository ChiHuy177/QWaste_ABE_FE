'use client';
import { UserGroup } from '@/types/UserGroup';
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

export type GroupTableColumnProps = {
    onEdit?: (group: UserGroup) => void;
    onDelete?: (group: UserGroup) => void;
    onView?: (group: UserGroup) => void;
    t: (key: string) => string;
};

export const getGroupTableColumns = (props?: GroupTableColumnProps): ColumnsType<UserGroup> => {
    const t = props?.t || ((key: string) => key);

    return [
        {
            title: () => t('groupManagement.table.headers.groupId'),
            dataIndex: 'groupId',
            key: 'groupId',
            sorter: (a, b) => String(a.groupId).localeCompare(String(b.groupId)),
            width: 150,
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    #{text}
                </Text>
            ),
        },
        {
            title: () => t('groupManagement.table.headers.groupName'),
            dataIndex: 'groupName',
            key: 'groupName',
            sorter: (a, b) => a.groupName.localeCompare(b.groupName),
            width: 200,
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: () => t('groupManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text>{text}</Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('groupManagement.table.headers.createdAt'),
            dataIndex: ['auditMetaData', 'createdAt'],
            key: 'createdAt',
            width: 180,
            sorter: (a, b) => {
                const dateA = a.auditMetaData?.createdAt || '';
                const dateB = b.auditMetaData?.createdAt || '';
                return dateA.localeCompare(dateB);
            },
            render: (date: string) => {
                if (!date) return '-';
                return <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>;
            },
        },
        {
            title: () => t('groupManagement.table.headers.updatedAt'),
            dataIndex: ['auditMetaData', 'updatedAt'],
            key: 'updatedAt',
            width: 180,
            sorter: (a, b) => {
                const dateA = a.auditMetaData?.updatedAt || '';
                const dateB = b.auditMetaData?.updatedAt || '';
                return dateA.localeCompare(dateB);
            },
            render: (date: string) => {
                if (!date) return '-';
                return <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>;
            },
        },
        {
            title: '',
            key: 'actions',
            width: 150,
            align: 'center',
            fixed: 'right',
            render: (_, record: UserGroup) => {
                return (
                    <Space size="small">
                        <Tooltip title={t('common.view')}>
                            <Button
                                type="default"
                                icon={<EyeOutlined />}
                                onClick={() => props?.onView?.(record)}
                                aria-label={t('common.view')}
                            />
                        </Tooltip>
                        <Tooltip title={t('groupManagement.actions.edit')}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => {
                                    if (props?.onEdit) {
                                        props.onEdit(record);
                                    } else {
                                        console.error('onEdit is undefined');
                                    }
                                }}
                            />
                        </Tooltip>
                        <Popconfirm
                            title={t('groupManagement.dialogs.deleteConfirmation.title')}
                            description={t(
                                'groupManagement.dialogs.deleteConfirmation.description'
                            )}
                            onConfirm={() => props?.onDelete?.(record)}
                            okText={t('common.yes')}
                            cancelText={t('common.no')}
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title={t('groupManagement.actions.delete')}>
                                <Button danger type="primary" icon={<DeleteOutlined />} />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];
};
