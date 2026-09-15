'use client';

import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { OperationType } from '@/types/OperationType';
import { AppAbility } from '@/configs/permissions/caslAbility';
import dayjs from 'dayjs';

const { Text } = Typography;

export type OperationTypeTableColumnProps = {
    onView?: (operationType: OperationType) => void;
    onEdit?: (operationType: OperationType) => void;
    onDelete?: (operationType: OperationType) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

const compareDate = (a?: string | null, b?: string | null) =>
    new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();

export const getOperationTypeTableColumns = (
    props?: OperationTypeTableColumnProps
): ColumnsType<OperationType> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'operation_type') ?? false;
    const canDelete = ability?.can('delete', 'operation_type') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<OperationType> = [
        {
            title: () => t('operationTypeManagement.table.headers.operationTypeCode'),
            dataIndex: 'operationTypeCode',
            key: 'operationTypeCode',
            sorter: (a, b) => a.operationTypeCode.localeCompare(b.operationTypeCode),
            width: 160,
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: () => t('operationTypeManagement.table.headers.operationTypeName'),
            dataIndex: 'operationTypeName',
            key: 'operationTypeName',
            sorter: (a, b) => a.operationTypeName.localeCompare(b.operationTypeName),
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
            title: () => t('operationTypeManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
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
            title: () => t('operationTypeManagement.table.headers.createdAt'),
            dataIndex: ['auditMetaData', 'createdAt'],
            key: 'auditMetaData.createdAt',
            sorter: (a, b) => compareDate(a.auditMetaData?.createdAt, b.auditMetaData?.createdAt),
            defaultSortOrder: 'ascend',
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
            title: () => t('operationTypeManagement.table.headers.updatedAt'),
            dataIndex: ['auditMetaData', 'updatedAt'],
            key: 'auditMetaData.updatedAt',
            sorter: (a, b) => compareDate(a.auditMetaData?.updatedAt, b.auditMetaData?.updatedAt),
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
            title: () => t('operationTypeManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: OperationType) => (
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
                            title={t('operationTypeManagement.dialogs.deleteConfirmation.title')}
                            description={t(
                                'operationTypeManagement.dialogs.deleteConfirmation.description'
                            )}
                            onConfirm={() => props?.onDelete?.(record)}
                            okText={t('common.yes')}
                            cancelText={t('common.no')}
                            okButtonProps={{ danger: true }}
                            placement="topRight"
                        >
                            <Tooltip title={t('common.delete')}>
                                <Button danger type="primary" icon={<DeleteOutlined />} />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        });
    }

    return columns;
};
