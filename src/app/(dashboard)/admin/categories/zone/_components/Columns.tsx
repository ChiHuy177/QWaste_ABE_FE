'use client';

import { Button, Popconfirm, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Zone } from '@/types/Zone';
import { AppAbility } from '@/configs/permissions/caslAbility';
const { Text } = Typography;

export type ZoneTableColumnProps = {
    onView?: (zone: Zone) => void;
    onEdit?: (zone: Zone) => void;
    onDelete?: (zone: Zone) => void;
    t: (key: string) => string;
    ability?: AppAbility;
    isMobile?: boolean;
};

export const getZoneTableColumns = (props?: ZoneTableColumnProps): ColumnsType<Zone> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'zone') ?? false;
    const canDelete = ability?.can('delete', 'zone') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<Zone> = [
        {
            title: () => t('zoneManagement.table.headers.zoneCode'),
            dataIndex: 'zoneCode',
            key: 'zoneCode',
            sorter: (a, b) => a.zoneCode.localeCompare(b.zoneCode),
            width: 150,
            align: 'center',
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: () => t('zoneManagement.table.headers.factoryName'),
            dataIndex: ['factory', 'factoryName'],
            key: 'factoryName',
            sorter: (a, b) =>
                (a.factory?.factoryName || '').localeCompare(b.factory?.factoryName || ''),
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text style={{ fontSize: 14 }}>{text || '-'}</Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('zoneManagement.table.headers.zoneName'),
            dataIndex: 'zoneName',
            key: 'zoneName',
            sorter: (a, b) => a.zoneName.localeCompare(b.zoneName),
            width: 200,

            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text strong style={{ fontSize: 14 }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('zoneManagement.table.headers.order'),
            dataIndex: 'displayOrder',
            key: 'displayOrder',
            sorter: (a, b) => a.displayOrder - b.displayOrder,
            width: 100,
            align: 'center',
            render: (text: number) => (
                <Text style={{ fontSize: 14 }}>
                    {' '}
                    <Tag color="gray" style={{ fontSize: 13 }}>
                        {text}
                    </Tag>
                </Text>
            ),
        },
        {
            title: () => t('zoneManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (text: string) => (
                <Text
                    type="secondary"
                    style={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        display: 'block',
                    }}
                >
                    {text || '-'}
                </Text>
            ),
        },
        {
            title: () => t('zoneManagement.table.headers.createdAt'),
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
            title: () => t('zoneManagement.table.headers.updatedAt'),
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
            title: () => t('zoneManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_, record: Zone) => {
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
                            <Tooltip title={t('zoneManagement.actions.edit')}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                        props?.onEdit?.(record);
                                    }}
                                    aria-label={t('zoneManagement.actions.edit')}
                                />
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Popconfirm
                                title={t('zoneManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'zoneManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                                placement="topRight"
                            >
                                <Tooltip title={t('zoneManagement.actions.delete')}>
                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        aria-label={t('zoneManagement.actions.delete')}
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
