'use client';

import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined, UndoOutlined } from '@ant-design/icons';
import { Mold } from '@/types/Mold';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type MoldTableColumnProps = {
    onView?: (mold: Mold) => void;
    onEdit?: (mold: Mold) => void;
    onDelete?: (mold: Mold) => void;
    onRestore?: (mold: Mold) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
    page?: number;
    pageSize?: number;
};

const isDeleted = (mold: Mold) =>
    mold.isDeleted === true || mold.softDeleteMetaData?.isDeleted === true;

// Cấu hình các cột cho bảng danh sách khuôn (Mold).
export const getMoldTableColumns = (props?: MoldTableColumnProps): ColumnsType<Mold> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'mold') ?? false;
    const canDelete = ability?.can('delete', 'mold') ?? false;
    const canRestore = ability
        ? ability.can('restore', 'mold') || ability.can('update', 'mold')
        : true;
    const hasAnyAction = canView || canUpdate || canDelete || canRestore;
    const page = props?.page ?? 0;
    const pageSize = props?.pageSize ?? 10;

    const columns: ColumnsType<Mold> = [
        {
            title: () => t('moldManagement.table.headers.index') || 'STT',
            key: 'index',
            width: 70,
            align: 'center',
            render: (_: any, __: any, index: number) => (
                <Text type="secondary">{page * pageSize + index + 1}</Text>
            ),
        },
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
            sorter: (a, b) => {
                const aVal = `${a.operationType.operationTypeCode} ${a.operationType.operationTypeName}`;
                const bVal = `${b.operationType.operationTypeCode} ${b.operationType.operationTypeName}`;
                return aVal.localeCompare(bVal);
            },
            width: 200,
            render: (_, record) => {
                const op = record.operationType;
                const displayText = `${op.operationTypeCode} — ${op.operationTypeName}`;
                return (
                    <Tooltip title={op.description || displayText}>
                        <Tag
                            color="blue"
                            style={{
                                maxWidth: 220,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {displayText}
                        </Tag>
                    </Tooltip>
                );
            },
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
                            description={t(
                                'moldManagement.dialogs.restoreConfirmation.description'
                            )}
                            onConfirm={() => props?.onRestore?.(record)}
                            okText={t('common.yes')}
                            cancelText={t('common.no')}
                            placement="topRight"
                        >
                            <Tooltip title={t('common.restore')}>
                                <Button
                                    type="primary"
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
