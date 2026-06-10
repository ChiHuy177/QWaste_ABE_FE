'use client';

import { Button, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { MoldCode } from '@/types/MoldCode';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type MoldCodeTableColumnProps = {
    onView?: (item: MoldCode) => void;
    onEdit?: (item: MoldCode) => void;
    onDelete?: (item: MoldCode) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getMoldCodeTableColumns = (
    props?: MoldCodeTableColumnProps
): ColumnsType<MoldCode> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'mold_code') ?? false;
    const canDelete = ability?.can('delete', 'mold_code') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<MoldCode> = [
        {
            title: () => t('moldCodeManagement.table.headers.id'),
            dataIndex: 'moldCodeId',
            key: 'moldCodeId',
            sorter: (a, b) => a.moldCodeId - b.moldCodeId,
            width: 80,
            align: 'center',
            render: (val: number) => <Text strong>{val}</Text>,
        },
        {
            title: () => t('moldCodeManagement.table.headers.moldCodeName'),
            dataIndex: 'moldCodeName',
            key: 'moldCodeName',
            sorter: (a, b) => a.moldCodeName.localeCompare(b.moldCodeName),
            width: 180,
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
            title: () => t('moldCodeManagement.table.headers.description'),
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
            title: () => t('moldCodeManagement.table.headers.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status: string) => (
                <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
            ),
        },
        {
            title: () => t('moldCodeManagement.table.headers.createdAt'),
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
            title: () => t('moldCodeManagement.table.headers.updatedAt'),
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
            title: () => t('moldCodeManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: MoldCode) => (
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
                        <Tooltip title={t('moldCodeManagement.actions.edit')}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => props?.onEdit?.(record)}
                                aria-label={t('moldCodeManagement.actions.edit')}
                            />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title={t('moldCodeManagement.actions.delete')}>
                            <Button
                                danger
                                type="primary"
                                icon={<DeleteOutlined />}
                                onClick={() => props?.onDelete?.(record)}
                                aria-label={t('moldCodeManagement.actions.delete')}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        });
    }

    return columns;
};
