import { ColumnsType } from 'antd/es/table';
import { Permission } from '@/types/Permission';
import { AuditMetaData } from '@/types/Metadata';
import { Button, Space, Popconfirm, Tag, Badge, theme } from 'antd';
import { EditOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';

/**
 * Row shape for the grouped permission table: either a real `Permission` leaf,
 * or a synthetic subject-group row (`permissionId: "group-<subject>"`, no
 * `auditMetaData`) whose `children` are the real permissions in that group.
 */
export interface PermissionTableRow {
    permissionId?: number | string;
    slug: string;
    permissionName: string;
    description?: string;
    auditMetaData?: AuditMetaData;
    children?: Permission[];
}

const FolderCell = ({
    text,
    childrenCount,
    isMobileResponsive,
}: {
    text: string;
    childrenCount: number;
    isMobileResponsive?: boolean;
}) => {
    const { token } = theme.useToken();
    return (
        <Space size="small" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <FolderOpenOutlined style={{ color: token.colorPrimary, fontSize: '16px', flexShrink: 0 }} />
            <span
                style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: token.colorText,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    maxWidth: isMobileResponsive ? '120px' : 'none',
                }}
            >
                {text}
            </span>
            <Badge
                count={childrenCount}
                style={{
                    backgroundColor: token.colorInfoBg,
                    color: token.colorInfo,
                    boxShadow: 'none',
                    border: `1px solid ${token.colorInfoBorder}`,
                    flexShrink: 0,
                }}
            />
        </Space>
    );
};

export type PermissionTableColumnProps = {
    onEdit?: (permission: Permission) => void;
    onDelete?: (permission: Permission) => void;
    t: (key: string) => string;
    isMobileResponsive?: boolean;
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

export const getPermissionTableColumns = (
    props?: PermissionTableColumnProps
): ColumnsType<PermissionTableRow> => {
    const t = props?.t || ((key: string) => key);

    const columns: ColumnsType<PermissionTableRow> = [
        {
            title: t('permissionManagement.columns.name'),
            dataIndex: 'permissionName',
            key: 'permissionName',
            sorter: (a, b) => a.permissionName.localeCompare(b.permissionName),
            width: props?.isMobileResponsive ? '60%' : '25%',
            ellipsis: true,
            render: (text: string, record: PermissionTableRow) => {
                if (record.children) {
                    return (
                        <FolderCell
                            text={text}
                            childrenCount={record.children.length}
                            isMobileResponsive={props?.isMobileResponsive}
                        />
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
            render: (slug: string, record: PermissionTableRow) => {
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
        {
            title: t('permissionManagement.columns.actions'),
            key: 'actions',
            fixed: props?.isMobileResponsive ? undefined : 'right',
            width: props?.isMobileResponsive ? 100 : '13%',
            render: (_: unknown, record: PermissionTableRow) => {
                if (record.children) return null;
                // Group rows (with `children`) already returned above, so this is a real leaf Permission.
                const permission = record as Permission;
                return (
                    <Space size="small">
                        <Button
                            variant="link"
                            icon={<EditOutlined />}
                            onClick={() => props?.onEdit?.(permission)}
                            style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                        >
                            {!props?.isMobileResponsive && t('permissionManagement.actions.edit')}
                        </Button>
                        <Popconfirm
                            title={t('permissionManagement.actions.confirmDeleteTitle')}
                            description={t('permissionManagement.actions.confirmDeleteMessage')}
                            onConfirm={() => props?.onDelete?.(permission)}
                            okText={t('permissionManagement.actions.confirmYes')}
                            cancelText={t('permissionManagement.actions.confirmNo')}
                            okButtonProps={{ color: 'danger', variant: 'solid' }}
                        >
                            <Button
                                variant="link"
                                color="danger"
                                icon={<DeleteOutlined />}
                                style={{ padding: props?.isMobileResponsive ? '4px' : '4px 8px' }}
                            >
                                {!props?.isMobileResponsive && t('permissionManagement.actions.delete')}
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    return columns;
};
