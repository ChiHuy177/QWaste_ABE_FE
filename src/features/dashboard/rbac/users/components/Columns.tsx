import { ColumnsType } from 'antd/es/table';
import { TFunction } from 'i18next';
import { UserWithRBAC } from '@/types/User';
import { Button, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';

export type UserTableColumnProps = {
    onEdit?: (user: UserWithRBAC) => void;
    // onDelete?: (user: UserWithRBAC) => void;
    t: TFunction;
    isMobileResponsive?: boolean;
};

export const getUserTableColumns = (props?: UserTableColumnProps): ColumnsType<UserWithRBAC> => {
    const t = props?.t || ((key: string) => key);

    const columns: ColumnsType<UserWithRBAC> = [
        {
            title: t('userManagement.columns.username'),
            dataIndex: 'username',
            key: 'username',
            sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
            width: props?.isMobileResponsive ? '60%' : '15%',
            ellipsis: true,
        },
        {
            title: t('userManagement.columns.fullName'),
            key: 'fullName',
            width: props?.isMobileResponsive ? '40%' : '20%',
            ellipsis: true,
            render: (_: unknown, record: UserWithRBAC) =>
                `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
        },
        {
            title: t('userManagement.columns.email'),
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
            width: '20%',
        },
        {
            title: t('userManagement.columns.roles'),
            key: 'roles',
            width: '20%',
            render: (_: unknown, record: UserWithRBAC) => {
                if (!record.roles || record.roles.length === 0) {
                    return <Tag>{t('userManagement.columns.noRoles')}</Tag>;
                }

                return (
                    <Space size={[0, 4]} wrap>
                        {record.roles.map((roleName, index) => (
                            <Tag key={index} color="blue">
                                {roleName}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: t('userManagement.columns.accessibleFactories'),
            key: 'accessibleFactories',
            width: '15%',
            render: (_: unknown, record: UserWithRBAC) => {
                if (!record.accessibleFactories || record.accessibleFactories.length === 0) {
                    return '-';
                }

                return (
                    <Space size={[0, 4]} wrap>
                        {record.accessibleFactories.map((factory) => (
                            <Tag key={factory.factoryId} color="green">
                                {factory.factoryCode}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: t('userManagement.columns.actions'),
            key: 'actions',
            fixed: props?.isMobileResponsive ? undefined : 'right',
            width: props?.isMobileResponsive ? 100 : '13%',
            render: (_: unknown, record: UserWithRBAC) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => props?.onEdit?.(record)}
                        style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                    >
                        {!props?.isMobileResponsive && t('userManagement.actions.edit')}
                    </Button>
                    {/* <Popconfirm
                        title={t('userManagement.actions.confirmDeleteTitle')}
                        description={t('userManagement.actions.confirmDeleteMessage')}
                        onConfirm={() => props?.onDelete?.(record)}
                        okText={t('userManagement.actions.confirmYes')}
                        cancelText={t('userManagement.actions.confirmNo')}
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                        >
                            {!props?.isMobileResponsive && t('userManagement.actions.delete')}
                        </Button>
                    </Popconfirm> */}
                </Space>
            ),
        },
    ];

    return columns;
};
