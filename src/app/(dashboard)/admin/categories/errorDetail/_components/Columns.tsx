'use client';

import { Button, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ErrorDetail } from '@/types/ErrorDetail';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type ErrorDetailTableColumnProps = {
    onView?: (item: ErrorDetail) => void;
    onEdit?: (item: ErrorDetail) => void;
    onDelete?: (item: ErrorDetail) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getErrorDetailTableColumns = (
    props?: ErrorDetailTableColumnProps
): ColumnsType<ErrorDetail> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'error_detail') ?? false;
    const canDelete = ability?.can('delete', 'error_detail') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<ErrorDetail> = [
        {
            title: () => t('errorDetailManagement.table.headers.id'),
            dataIndex: 'errorCodeId',
            key: 'errorCodeId',
            sorter: (a, b) => a.errorCodeId - b.errorCodeId,
            width: 80,
            align: 'center',
            render: (val: number) => <Text strong>{val}</Text>,
        },
        {
            title: () => t('errorDetailManagement.table.headers.errorName'),
            dataIndex: 'errorName',
            key: 'errorName',
            sorter: (a, b) => a.errorName.localeCompare(b.errorName),
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
            title: () => t('errorDetailManagement.table.headers.description'),
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
            title: () => t('errorDetailManagement.table.headers.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status: string) => (
                <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
            ),
        },
        {
            title: () => t('errorDetailManagement.table.headers.createdAt'),
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
            title: () => t('errorDetailManagement.table.headers.updatedAt'),
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
            title: () => t('errorDetailManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: ErrorDetail) => (
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
                        <Tooltip title={t('errorDetailManagement.actions.edit')}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => props?.onEdit?.(record)}
                                aria-label={t('errorDetailManagement.actions.edit')}
                            />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title={t('errorDetailManagement.actions.delete')}>
                            <Button
                                danger
                                type="primary"
                                icon={<DeleteOutlined />}
                                onClick={() => props?.onDelete?.(record)}
                                aria-label={t('errorDetailManagement.actions.delete')}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        });
    }

    return columns;
};
