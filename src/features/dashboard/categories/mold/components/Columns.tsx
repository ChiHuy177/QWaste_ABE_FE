'use client';

import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined, UndoOutlined } from '@ant-design/icons';
import { Mold } from '@/types/Mold';
import { AppAbility } from '@/configs/permissions/caslAbility';
import dayjs from 'dayjs';

const { Text } = Typography;

export type MoldTableColumnProps = {
    onView?: (mold: Mold) => void;
    onEdit?: (mold: Mold) => void;
    onDelete?: (mold: Mold) => void;
    onRestore?: (mold: Mold) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

const isDeleted = (mold: Mold) => !!mold.softDeleteMetaData?.isDeleted;

const compareDate = (a?: string | null, b?: string | null) =>
    new Date(a ?? 0).getTime() - new Date(b ?? 0).getTime();

// Danh sách lấy từ GET /v1 không phân trang → sort/lọc chạy client-side.
export const getMoldTableColumns = (props?: MoldTableColumnProps): ColumnsType<Mold> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'mold') ?? false;
    const canDelete = ability?.can('delete', 'mold') ?? false;
    const canRestore = ability?.can('restore', 'mold') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete || canRestore;

    const columns: ColumnsType<Mold> = [
        {
            title: () => t('moldManagement.table.headers.moldCode'),
            dataIndex: 'moldCode',
            key: 'moldCode',
            sorter: (a, b) => a.moldCode.localeCompare(b.moldCode),
            width: 170,
            render: (text: string, record) => (
                <>
                    <Text strong style={{ fontSize: 14 }} delete={isDeleted(record)}>
                        {text}
                    </Text>
                    {isDeleted(record) && (
                        <Tag style={{ marginLeft: 6 }}>{t('moldManagement.deletedTag')}</Tag>
                    )}
                </>
            ),
        },
        {
            title: () => t('moldManagement.table.headers.moldName'),
            dataIndex: 'moldName',
            key: 'moldName',
            sorter: (a, b) => a.moldName.localeCompare(b.moldName),
            width: 220,
            ellipsis: { showTitle: false },
            render: (text: string, record) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text strong style={{ fontSize: 14 }} delete={isDeleted(record)}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('moldManagement.table.headers.outputPerShot'),
            dataIndex: 'outputPerShot',
            key: 'outputPerShot',
            sorter: (a, b) => a.outputPerShot - b.outputPerShot,
            width: 110,
            align: 'center',
            render: (val: number) => <Text>{val}</Text>,
        },
        {
            title: () => t('moldManagement.table.headers.operationType'),
            dataIndex: ['operationType', 'operationTypeName'],
            key: 'operationType',
            sorter: (a, b) =>
                a.operationType.operationTypeName.localeCompare(b.operationType.operationTypeName),
            width: 160,
            render: (_, record) => (
                <Tooltip title={record.operationType.description}>
                    <Tag color="blue">{record.operationType.operationTypeName}</Tag>
                </Tooltip>
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
            title: () => t('moldManagement.table.headers.updatedAt'),
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
            title: () => t('moldManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: Mold) => {
                if (isDeleted(record)) {
                    if (!canRestore) return null;
                    return (
                        <Popconfirm
                            title={t('moldManagement.dialogs.restoreConfirmation.title')}
                            description={t('moldManagement.dialogs.restoreConfirmation.description')}
                            onConfirm={() => props?.onRestore?.(record)}
                            okText={t('common.yes')}
                            cancelText={t('common.no')}
                            placement="topRight"
                        >
                            <Tooltip title={t('common.restore')}>
                                <Button
                                    icon={<UndoOutlined />}
                                    aria-label={t('common.restore')}
                                />
                            </Tooltip>
                        </Popconfirm>
                    );
                }

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
                                title={t('moldManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'moldManagement.dialogs.deleteConfirmation.description'
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
