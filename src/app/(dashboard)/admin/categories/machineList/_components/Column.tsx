'use client';
import { Machine } from '@/types/Machine';
import { Button, Popconfirm, Space, Tooltip, Typography, Image, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined } from '@ant-design/icons';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type MachineTableColumnProps = {
    onEdit?: (machine: Machine) => void;
    onView?: (machine: Machine) => void;
    onDelete?: (machine: Machine) => void;
    onRestore?: (machine: Machine) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};


export const getMachineListTableColumns = (
    props?: MachineTableColumnProps
): ColumnsType<Machine> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'machine') ?? false;
    const canDelete = ability?.can('delete', 'machine') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<Machine> = [
        {
            title: () => t('machineListManagement.table.headers.machineImage'),
            dataIndex: 'machineImage',
            key: 'machineImage',
            width: 100,
            align: 'center',
            render: (imageUrl: string) => {
                if (!imageUrl) {
                    return <Text type="secondary">{t('common.notAvailable')}</Text>;
                }
                return (
                    <Image
                        src={imageUrl}
                        alt="Machine"
                        width={60}
                        height={60}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={{
                            cover: <div>Preview</div>,
                        }}
                    />
                );
            },
        },
        {
            title: () => t('machineListManagement.table.headers.machineName'),
            dataIndex: 'machineName',
            key: 'machineName',
            sorter: (a, b) => a.machineName.localeCompare(b.machineName),
            width: 250,
            ellipsis: { showTitle: false },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Text strong style={{ fontSize: 14 }}>
                            {text}
                        </Text>
                    </div>
                </Tooltip>
            ),
        },
        {
            title: () => t('machineListManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
            ellipsis: { showTitle: false },
            render: (text: string) => {
                if (!text) return null;
                return (
                    <Tooltip placement="topLeft" title={text}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Text type="secondary">{text}</Text>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('machineListManagement.table.headers.propertyCode'),
            dataIndex: 'propertyCode',
            key: 'propertyCode',
            width: 150,
            align: 'center',
            ellipsis: { showTitle: false },
            sorter: (a, b) => {
                const codeA = a.propertyCode || '';
                const codeB = b.propertyCode || '';
                return codeA.localeCompare(codeB);
            },
            render: (text: string) => {
                if (!text) return <Text type="secondary">{t('common.notAvailable')}</Text>;
                return (
                    <Tooltip placement="topLeft" title={text}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Tag
                                color="cyan"
                                style={{
                                    fontSize: 13,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    verticalAlign: 'middle',
                                    marginInlineEnd: 0
                                }}
                            >
                                {text}
                            </Tag>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('machineListManagement.table.headers.power'),
            dataIndex: 'power',
            key: 'power',
            width: 120,
            align: 'center',
            ellipsis: { showTitle: false },
            sorter: (a, b) => (a.power || 0) - (b.power || 0),
            render: (power: number) => {
                if (power === null || power === undefined)
                    return <Text type="secondary">{t('common.notAvailable')}</Text>;
                return (
                    <Tooltip placement="topLeft" title={`${power} kW`}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Tag
                                color="orange"
                                style={{
                                    fontSize: 13,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    verticalAlign: 'middle',
                                    marginInlineEnd: 0
                                }}
                            >
                                {power} kW
                            </Tag>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('machineListManagement.table.headers.status'),
            dataIndex: ['softDeleteMetaData', 'deleted'],
            key: 'softDeleteMetaData.deleted',
            width: 150,
            align: 'center',
            ellipsis: { showTitle: false },
            render: (value) => {
                const text = value ? t('machineListManagement.status.inactive') : t('machineListManagement.status.active');
                return (
                    <Tooltip placement="topLeft" title={text}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Tag
                                color={value ? 'red' : 'green'}
                                style={{
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    verticalAlign: 'middle',
                                    marginInlineEnd: 0
                                }}
                            >
                                {text}
                            </Tag>
                        </div>
                    </Tooltip>
                );
            },
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: '',
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_, record: Machine) => {
                const isDeleted = record.softDeleteMetaData?.isDeleted;

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
                            <Tooltip title={t('machineListManagement.actions.edit')}>
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

                        {isDeleted
                            ? canUpdate && (
                                <Popconfirm
                                    title={t(
                                        'machineListManagement.dialogs.restoreConfirmation.title'
                                    )}
                                    description={t(
                                        'machineListManagement.dialogs.restoreConfirmation.description'
                                    )}
                                    onConfirm={() => props?.onRestore?.(record)}
                                    okText={t('common.yes')}
                                    cancelText={t('common.no')}
                                >
                                    <Tooltip title={t('machineListManagement.actions.restore')}>
                                        <Button
                                            type="primary"
                                            icon={<UndoOutlined />}
                                            style={{
                                                backgroundColor: '#52c41a',
                                                borderColor: '#52c41a',
                                            }}
                                        />
                                    </Tooltip>
                                </Popconfirm>
                            )
                            : canDelete && (
                                <Popconfirm
                                    title={t(
                                        'machineListManagement.dialogs.deleteConfirmation.title'
                                    )}
                                    description={t(
                                        'machineListManagement.dialogs.deleteConfirmation.description'
                                    )}
                                    onConfirm={() => props?.onDelete?.(record)}
                                    okText={t('common.yes')}
                                    cancelText={t('common.no')}
                                    okButtonProps={{ danger: true }}
                                >
                                    <Tooltip title={t('machineListManagement.actions.delete')}>
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
