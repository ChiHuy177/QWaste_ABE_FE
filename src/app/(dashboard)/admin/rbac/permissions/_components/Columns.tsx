import { ColumnsType } from 'antd/es/table';
import { Permission } from '@/types/Permission';
import { Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import { AppAbility } from '@/configs/permissions/caslAbility';

export type PermissionTableColumnProps = {
    onEdit?: (permission: Permission) => void;
    onDelete?: (permission: Permission) => void;
    t: (key: string) => string;
    isMobileResponsive?: boolean;
    ability?: AppAbility;
};

const getActionColor = (action: string): string => {
    switch (action) {
        // Create actions
        case 'create':
            return 'green';
        // View actions
        case 'view':
        case 'view-own':
        case 'view-all':
        case 'dashboard':
        case 'overview_view':
        case 'operator_view':
        case 'manager_review_view':
        case 'store':
        case 'confirm':
        case 'restore':
            return 'blue';
        // Update/Modify actions
        case 'update':
        case 'config':
        case 'settings':
        case 'assign':
        case 'update_sensitive':
        case 'update_info':
        case 'update_plan':
            return 'orange';
        // Delete/Cancel actions
        case 'delete':
        case 'cancel':
        case 'decline':
            return 'red';
        // Execute/Approve actions
        case 'operate':
        case 'approve':
            return 'cyan';
        // Special actions
        case 'reset-password':
            return 'purple';
        // Report/Audit actions
        case 'finance':
        case 'audit-log':
            return 'gold';
        default:
            return 'blue'; // As per guide: any action without color defaults to blue
    }
};

export const getPermissionTableColumns = (props?: PermissionTableColumnProps): ColumnsType<any> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canUpdate = ability?.can('update', 'permission') ?? false;
    const canDelete = ability?.can('delete', 'permission') ?? false;
    const hasAnyAction = canUpdate || canDelete;

    const columns: ColumnsType<any> = [
        {
            title: t('permissionManagement.columns.name'),
            dataIndex: 'permissionName',
            key: 'permissionName',
            sorter: (a, b) => a.permissionName.localeCompare(b.permissionName),
            width: props?.isMobileResponsive ? '60%' : '25%',
            ellipsis: true,
            render: (text: string, record: any) => {
                if (record.children) {
                    return (
                        <Space size="small" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                            <FolderOpenOutlined style={{ color: '#1890ff', fontSize: '16px', flexShrink: 0 }} />
                            <span style={{ 
                                fontWeight: 600, 
                                fontSize: '14px', 
                                color: '#1f1f1f',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                maxWidth: props?.isMobileResponsive ? '120px' : 'none'
                            }}>
                                {text}
                            </span>
                            <Badge 
                                count={record.children.length} 
                                style={{ 
                                    backgroundColor: '#e6f7ff', 
                                    color: '#1890ff',
                                    boxShadow: 'none',
                                    border: '1px solid #91d5ff',
                                    flexShrink: 0
                                }} 
                            />
                        </Space>
                    );
                }

                return text;
            },
        },
        {
            title: t('permissionManagement.columns.slug'),
            dataIndex: 'slug',
            key: 'slug',
            width: '27%',
            render: (slug: string, record: any) => {
                if (record.children) return null;
                const [_, action] = slug.split(':');
                return (
                    <Space>
                        {action && (
                            <Tag 
                                color={getActionColor(action)} 
                                style={{ 
                                    borderRadius: '12px', 
                                    padding: '0 10px',
                                    textTransform: 'uppercase',
                                    fontSize: '11px',
                                    fontWeight: 600
                                }}
                            >
                                {t(`common.${action}`)}
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: t('permissionManagement.columns.description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            width: '35%',
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: t('permissionManagement.columns.actions'),
            key: 'actions',
            fixed: props?.isMobileResponsive ? undefined : 'right',
            width: props?.isMobileResponsive ? 100 : '13%',
            render: (_: any, record: any) => {
                if (record.children) return null;
                return (
                    <Space size="small">
                        {canUpdate && (
                            <Button
                                type="link"
                                icon={<EditOutlined />}
                                onClick={() => props?.onEdit?.(record)}
                                style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                            >
                                {!props?.isMobileResponsive && t('permissionManagement.actions.edit')}
                            </Button>
                        )}
                        {canDelete && (
                            <Popconfirm
                                title={t('permissionManagement.actions.confirmDeleteTitle')}
                                description={t('permissionManagement.actions.confirmDeleteMessage')}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('permissionManagement.actions.confirmYes')}
                                cancelText={t('permissionManagement.actions.confirmNo')}
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                                >
                                    {!props?.isMobileResponsive && t('permissionManagement.actions.delete')}
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                );
            },
        });
    }

    return columns;
};
