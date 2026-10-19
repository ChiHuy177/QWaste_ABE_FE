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
    page?: number;
    pageSize?: number;
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
    const page = props?.page ?? 0;
    const pageSize = props?.pageSize ?? 10;

    const columns: ColumnsType<OperationType> = [
        {
            title: () => t('operationTypeManagement.table.headers.index') || 'STT',
            key: 'index',
            width: 70,
            align: 'center',
            render: (_: any, __: any, index: number) => (
                <Text type="secondary">{page * pageSize + index + 1}</Text>
            ),
        },
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
