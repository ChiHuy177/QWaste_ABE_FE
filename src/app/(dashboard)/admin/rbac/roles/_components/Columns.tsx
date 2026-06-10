import { ColumnsType } from 'antd/es/table';
import { Role } from '@/types/Role';
import { Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppAbility } from '@/configs/permissions/caslAbility';

export type RoleTableColumnProps = {
    onEdit?: (role: Role) => void;
    onDelete?: (role: Role) => void;
    t: (key: string, options?: any) => string;
    isMobileResponsive?: boolean;
    ability?: AppAbility;
};

export const getRoleTableColumns = (
    props?: RoleTableColumnProps
): ColumnsType<Role> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canUpdate = ability?.can('update', 'role') ?? false;
    const canDelete = ability?.can('delete', 'role') ?? false;
    const hasAnyAction = canUpdate || canDelete;

    const columns: ColumnsType<Role> = [
        {
            title: t('roleManagement.columns.name'),
            dataIndex: 'roleName',
            key: 'roleName',
            sorter: (a, b) => a.roleName.localeCompare(b.roleName),
            width: props?.isMobileResponsive ? '60%' : '25%',
            ellipsis: true,
        },
        {
            title: t('roleManagement.columns.description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: '45%',
        },
        {
            title: t('roleManagement.columns.permissions'),
            key: 'permissions',
            width: '15%',
            render: (_: any, record: Role) => (
                <Tag color="blue">
                    {t('roleManagement.columns.permissionsCount', { count: record.permissions?.length || 0 })}
                </Tag>
            ),
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: t('roleManagement.columns.actions'),
            key: 'actions',
            fixed: props?.isMobileResponsive ? undefined : 'right',
            width: props?.isMobileResponsive ? 100 : '15%',
            render: (_: any, record: Role) => (
                <Space size="small">
                    {canUpdate && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => props?.onEdit?.(record)}
                            style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                        >
                            {!props?.isMobileResponsive && t('roleManagement.actions.edit')}
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                            onClick={() => props?.onDelete?.(record)}
                        >
                            {!props?.isMobileResponsive && t('roleManagement.actions.delete')}
                        </Button>
                    )}
                </Space>
            ),
        });
    }

    return columns;
};
