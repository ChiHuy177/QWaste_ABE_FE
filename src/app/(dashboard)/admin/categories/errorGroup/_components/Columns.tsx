'use client';

import { Button, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ErrorGroup } from '@/types/ErrorGroup';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type ErrorGroupTableColumnProps = {
    onView?: (item: ErrorGroup) => void;
    onEdit?: (item: ErrorGroup) => void;
    onDelete?: (item: ErrorGroup) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getErrorGroupTableColumns = (
    props?: ErrorGroupTableColumnProps
): ColumnsType<ErrorGroup> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'error_group') ?? false;
    const canDelete = ability?.can('delete', 'error_group') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<ErrorGroup> = [
        {
            title: () => t('errorGroupManagement.table.headers.id'),
            dataIndex: 'errorGroupId',
            key: 'errorGroupId',
            sorter: (a, b) => a.errorGroupId - b.errorGroupId,
            width: 80,
            align: 'center',
            render: (val: number) => <Text strong>{val}</Text>,
        },
        {
            title: () => t('errorGroupManagement.table.headers.errorGroupName'),
            dataIndex: 'errorGroupName',
            key: 'errorGroupName',
            sorter: (a, b) => a.errorGroupName.localeCompare(b.errorGroupName),
            width: 200,
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
            title: () => t('errorGroupManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (text: string) => (
                <Text
                    type="secondary"
                    style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: 'block' }}
                >
                    {text || '-'}
                </Text>
            ),
        },
        {
            title: () => t('errorGroupManagement.table.headers.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status: string) => (
                <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
            ),
        },
        {
            title: () => t('errorGroupManagement.table.headers.createdAt'),
            dataIndex: ['auditMetaData', 'createdAt'],
            key: 'createdAt',
            width: 180,
            align: 'center',
            sorter: (a, b) => {
                const dateA = a.auditMetaData?.createdAt || '';
                const dateB = b.auditMetaData?.createdAt || '';
                return dateA.localeCompare(dateB);
            },
            render: (date: string) => {
                if (!date) return <Text type="secondary">-</Text>;
                return (
                    <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
                        <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('errorGroupManagement.table.headers.updatedAt'),
            dataIndex: ['auditMetaData', 'updatedAt'],
            key: 'updatedAt',
            width: 180,
            align: 'center',
            sorter: (a, b) => {
                const dateA = a.auditMetaData?.updatedAt || '';
                const dateB = b.auditMetaData?.updatedAt || '';
                return dateA.localeCompare(dateB);
            },
            render: (date: string) => {
                if (!date) return <Text type="secondary">-</Text>;
                return (
                    <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm:ss')}>
                        <Text>{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
                    </Tooltip>
                );
            },
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('errorGroupManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: ErrorGroup) => (
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
                        <Tooltip title={t('errorGroupManagement.actions.edit')}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => props?.onEdit?.(record)}
                                aria-label={t('errorGroupManagement.actions.edit')}
                            />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title={t('errorGroupManagement.actions.delete')}>
                            <Button
                                danger
                                type="primary"
                                icon={<DeleteOutlined />}
                                onClick={() => props?.onDelete?.(record)}
                                aria-label={t('errorGroupManagement.actions.delete')}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        });
    }

    return columns;
};
