'use client';

import { Button, Popconfirm, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { IndustryFilter } from '@/types/IndustryFilter';
import { AppAbility } from '@/configs/permissions/caslAbility';
const { Text } = Typography;

export type IndustryFilterTableColumnProps = {
    onView?: (filter: IndustryFilter) => void;
    onEdit?: (filter: IndustryFilter) => void;
    onDelete?: (filter: IndustryFilter) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;

};

export const getIndustryFilterTableColumns = (
    props?: IndustryFilterTableColumnProps
): ColumnsType<IndustryFilter> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'industry_filter') ?? false;
    const canDelete = ability?.can('delete', 'industry_filter') ?? false;
    const hasAnyAction = canUpdate || canDelete || canView;

    const columns: ColumnsType<IndustryFilter> = [
        {
            title: () => t('industryFilterManagement.table.headers.category'),
            dataIndex: 'category',
            key: 'category',
            width: 120,
            align: 'center',
            sorter: (a, b) => a.category.localeCompare(b.category),
            render: (category: string) => (
                <Tag color={category === 'PERIOD' ? 'blue' : 'green'} style={{ fontSize: 13 }}>
                    {category}
                </Tag>
            ),
        },
        {
            title: () => t('industryFilterManagement.table.headers.displayNameEn'),
            dataIndex: 'displayNameEn',
            key: 'displayNameEn',
            width: 200,
            sorter: (a, b) => a.displayNameEn.localeCompare(b.displayNameEn),
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
            title: () => t('industryFilterManagement.table.headers.displayNameVi'),
            dataIndex: 'displayNameVi',
            key: 'displayNameVi',
            width: 200,
            sorter: (a, b) => a.displayNameVi.localeCompare(b.displayNameVi),
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text style={{ fontSize: 14 }}>{text}</Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('industryFilterManagement.table.headers.shortNameEn'),
            dataIndex: 'shortNameEn',
            key: 'shortNameEn',
            width: 150,
            align: 'center',
            render: (text: string) => <Text style={{ fontSize: 14 }}>{text || '-'}</Text>,
        },
        {
            title: () => t('industryFilterManagement.table.headers.periodCode'),
            dataIndex: 'periodCode',
            key: 'periodCode',
            width: 150,
            align: 'center',
            render: (text: string) => <Text style={{ fontSize: 14 }}>{text || '-'}</Text>,
        },
        {
            title: () => t('industryFilterManagement.table.headers.shiftNumber'),
            dataIndex: 'shiftNumber',
            key: 'shiftNumber',
            width: 120,
            align: 'center',
            render: (num: number | null) => (
                <Text style={{ fontSize: 14 }}>{num !== null ? num : '-'}</Text>
            ),
        },
        {
            title: () => t('industryFilterManagement.table.headers.timeRange'),
            key: 'timeRange',
            width: 180,
            align: 'center',
            render: (_, record: IndustryFilter) => (
                <Space orientation="vertical" size={0}>
                    <Text style={{ fontSize: 14 }}>
                        {record.startTime} - {record.endTime}
                    </Text>
                    {record.crossesMidnight && (
                        <Tag color="orange" style={{ fontSize: 11 }}>
                            {t('industryFilterManagement.table.crossesMidnight')}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: () => t('industryFilterManagement.table.headers.isPrimary'),
            dataIndex: 'isPrimary',
            key: 'isPrimary',
            width: 120,
            align: 'center',
            sorter: (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
            render: (isPrimary: boolean) =>
                isPrimary ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: () => t('industryFilterManagement.table.headers.sortOrder'),
            dataIndex: 'sortOrder',
            key: 'sortOrder',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.sortOrder - b.sortOrder,
            render: (order: number) => (
                <Tag color="gray" style={{ fontSize: 13 }}>
                    {order}
                </Tag>
            ),
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('industryFilterManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_, record: IndustryFilter) => {
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
                            <Tooltip title={t('industryFilterManagement.actions.edit')}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                        props?.onEdit?.(record);
                                    }}
                                    aria-label={t('industryFilterManagement.actions.edit')}
                                />
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Popconfirm
                                title={t(
                                    'industryFilterManagement.dialogs.deleteConfirmation.title'
                                )}
                                description={t(
                                    'industryFilterManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                                placement="topRight"
                            >
                                <Tooltip title={t('industryFilterManagement.actions.delete')}>
                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        aria-label={t('industryFilterManagement.actions.delete')}
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
