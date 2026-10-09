import { UserProfile } from '@/types/User';
import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, UndoOutlined, EyeOutlined } from '@ant-design/icons';
import { AppAbility } from '@/configs/permissions/caslAbility';
import { statusColors } from '@/configs/antdTheme';

export type StaffTableColumnProps = {
    onView?: (user: UserProfile) => void;
    onEdit?: (user: UserProfile) => void;
    onDelete?: (user: UserProfile) => void;
    onRestore?: (user: UserProfile) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getStaffTableColumns = (props?: StaffTableColumnProps): ColumnsType<UserProfile> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'staff') ?? false;
    const canDelete = ability?.can('delete', 'staff') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<UserProfile> = [
        {
            title: () => t('staffManagement.table.headers.userCode'),
            dataIndex: 'userCode',
            key: 'userCode',
            sorter: (a, b) => a.userCode.localeCompare(b.userCode),
            width: 150,
            render: (text: string) => <div style={{ fontWeight: 500 }}>{text}</div>,
        },
        {
            title: () => t('staffManagement.table.headers.name'),
            dataIndex: 'fullname',
            sorter: (a, b) => a.fullname.localeCompare(b.fullname),
            key: 'fullname',
            width: 200,
            render: (text: string) => <div style={{ fontWeight: 500 }}>{text}</div>,
        },
        {
            title: () => t('staffManagement.table.headers.email'),
            dataIndex: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
            key: 'email',
            width: 250,
        },
        {
            title: () => t('staffManagement.table.headers.phone'),
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 150,
        },
        {
            title: () => t('staffManagement.table.headers.status'),
            dataIndex: ['softDeleteMetaData', 'deleted'],
            key: 'softDeleteMetaData.deleted',
            width: 100,
            render: (value, record) => {
                const isDeleted = Boolean(record.softDeleteMetaData?.isDeleted ?? value);
                const tagColor = isDeleted ? statusColors.light.error : statusColors.light.runtime;
                return (
                    <Tag
                        style={{
                            color: tagColor.base,
                            backgroundColor: tagColor.bg,
                            borderColor: tagColor.border,
                        }}
                    >
                        {isDeleted
                            ? t('staffManagement.status.notWorking')
                            : t('staffManagement.status.working')}
                    </Tag>
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
            fixed: 'right',
            render: (_, record: UserProfile) => {
                const isDeleted = Boolean(
                    record.softDeleteMetaData?.isDeleted ??
                    (record.softDeleteMetaData as unknown as { deleted?: boolean })?.deleted
                );

                if (isDeleted) {
                    return canUpdate ? (
                        <Space size="small">
                            <Popconfirm
                                title={t('staffManagement.dialogs.restoreConfirmation.title')}
                                description={t(
                                    'staffManagement.dialogs.restoreConfirmation.description'
                                )}
                                onConfirm={() => props?.onRestore?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                            >
                                <Tooltip title={t('staffManagement.actions.restore')}>
                                    <Button
                                        type="primary"
                                        icon={<UndoOutlined />}
                                        style={{
                                            backgroundColor: statusColors.light.runtime.base,
                                            borderColor: statusColors.light.runtime.base,
                                        }}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </Space>
                    ) : null;
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
                            <Tooltip title={t('staffManagement.actions.edit')}>
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
                                title={t('staffManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'staffManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                            >
                                <Tooltip title={t('staffManagement.actions.delete')}>
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
