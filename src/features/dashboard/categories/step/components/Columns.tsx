'use client';

import { Button, Popconfirm, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { StepDTO } from '@/types/Step';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type StepTableColumnProps = {
    onView?: (step: StepDTO) => void;
    onEdit?: (step: StepDTO) => void;
    onDelete?: (step: StepDTO) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getStepTableColumns = (props?: StepTableColumnProps): ColumnsType<StepDTO> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'step') ?? false;
    const canDelete = ability?.can('delete', 'step') ?? false;
    const hasAnyAction = canUpdate || canDelete || canView;

    const formatDuration = (seconds?: number | null) => {
        if (!seconds) return '-';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || h > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);

        return parts.join(' ');
    };

    const columns: ColumnsType<StepDTO> = [
        {
            title: () => t('stepManagement.table.headers.stepName'),
            dataIndex: 'stepName',
            key: 'stepName',
            sorter: (a, b) => a.stepName.localeCompare(b.stepName),
            width: 250,
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: () => t('stepManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (text: string) => <Text type="secondary">{text || '-'}</Text>,
        },
        {
            title: () => t('stepManagement.table.headers.materialName'),
            dataIndex: 'materialName',
            key: 'materialName',
            width: 200,
            render: (text: string) => <Text type="secondary">{text || '-'}</Text>,
        },
        {
            title: () => t('stepManagement.table.headers.requiresQc'),
            dataIndex: 'requiresQc',
            key: 'requiresQc',
            width: 120,
            align: 'center',
            render: (checked: boolean) => (
                <Tag
                    color={checked ? 'blue' : 'default'} variant="filled"
                    style={{ minWidth: 60, textAlign: 'center' }}
                >
                    {(checked ? t('common.yes') : t('common.no')).toUpperCase()}
                </Tag>
            ),
        },
        {
            title: () => t('stepManagement.table.headers.defaultTime'),
            dataIndex: 'defaultCompletionTimeSeconds',
            key: 'defaultCompletionTimeSeconds',
            width: 150,
            align: 'right',
            render: (seconds: number | null) => (
                <Text>
                    <ClockCircleOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                    {formatDuration(seconds)}
                </Text>
            ),
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('stepManagement.table.headers.actions'),
            key: 'actions',
            width: 120,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_, record: StepDTO) => {
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
                                title={t('stepManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'stepManagement.dialogs.deleteConfirmation.description'
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
