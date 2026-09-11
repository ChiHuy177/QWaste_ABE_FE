'use client';
import { MachineType } from '@/types/MachineType';
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type MachineTypeTableColumnProps = {
    onView?: (machineType: MachineType) => void;
    onEdit?: (machineType: MachineType) => void;
    onDelete?: (machineType: MachineType) => void;
    t: (key: string) => string;
    ability?: AppAbility;
    isMobile?: boolean;
};

export const getMachineTypeTableColumns = (
    props?: MachineTypeTableColumnProps
): ColumnsType<MachineType> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'machine_type') ?? false;
    const canDelete = ability?.can('delete', 'machine_type') ?? false;
    const hasAnyAction = canUpdate || canDelete || canView;

    const columns: ColumnsType<MachineType> = [
        {
            title: () => t('machineTypeManagement.table.headers.machineTypeId'),
            dataIndex: 'machineTypeId',
            key: 'machineTypeId',
            sorter: (a, b) => a.machineTypeId - b.machineTypeId,
            width: 150,
            align: 'center',
            render: (text: number) => (
                <Text strong style={{ fontSize: 14 }}>
                    #{text}
                </Text>
            ),
        },
        {
            title: () => t('machineTypeManagement.table.headers.machineTypeName'),
            dataIndex: 'machineTypeName',
            key: 'machineTypeName',
            sorter: (a, b) => a.machineTypeName.localeCompare(b.machineTypeName),
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
            title: () => t('machineTypeManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <div
                        style={{
                            maxWidth: '350px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Text type="secondary">{text}</Text>
                    </div>
                </Tooltip>
            ),
        },
        {
            title: () => t('machineTypeManagement.table.headers.createdAt'),
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
            title: () => t('machineTypeManagement.table.headers.updatedAt'),
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
            title: () => t('machineTypeManagement.table.headers.actions') || '',
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_, record: MachineType) => {
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
                            <Tooltip title={t('machineTypeManagement.actions.edit')}>
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
                        )}
                        {canDelete && (
                            <Popconfirm
                                title={t('machineTypeManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'machineTypeManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                            >
                                <Tooltip title={t('machineTypeManagement.actions.delete')}>
                                    <Button danger type="primary" icon={<DeleteOutlined />} />
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
