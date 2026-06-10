'use client';

import { Button, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ProductionPlan } from '@/types/ProductionPlan';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type ProductionPlanTableColumnProps = {
    onView?: (item: ProductionPlan) => void;
    onEdit?: (item: ProductionPlan) => void;
    onDelete?: (item: ProductionPlan) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getProductionPlanTableColumns = (
    props?: ProductionPlanTableColumnProps
): ColumnsType<ProductionPlan> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'production_plan') ?? false;
    const canDelete = ability?.can('delete', 'production_plan') ?? false;
    const hasAnyAction = canView || canUpdate || canDelete;

    const columns: ColumnsType<ProductionPlan> = [
        {
            title: () => t('productionPlanManagement.table.headers.id'),
            dataIndex: 'planId',
            key: 'planId',
            sorter: (a, b) => a.planId - b.planId,
            width: 100,
            align: 'center',
            render: (val: number) => <Text strong>{val}</Text>,
        },
        {
            title: () => t('productionPlanManagement.table.headers.filterId'),
            dataIndex: 'filterId',
            key: 'filterId',
            width: 120,
            align: 'center',
            render: (val: string) => (
                <Tag color={val === 'DAY' ? 'blue' : 'purple'}>{val}</Tag>
            ),
        },
        {
            title: () => 'Date / Week',
            key: 'dateRange',
            width: 200,
            align: 'center',
            render: (_: any, record: ProductionPlan) => {
                if (record.filterId === 'DAY' && record.planDate) {
                    return <Text>{dayjs(record.planDate).format('DD/MM/YYYY')}</Text>;
                }
                if (record.filterId === 'WEEK' && record.planWeekStart && record.planWeekEnd) {
                    return (
                        <Text>
                            {dayjs(record.planWeekStart).format('DD/MM/YYYY')}
                            {' – '}
                            {dayjs(record.planWeekEnd).format('DD/MM/YYYY')}
                        </Text>
                    );
                }
                return <Text type="secondary">—</Text>;
            },
        },
        {
            title: () => t('productionPlanManagement.table.headers.machineId'),
            dataIndex: 'machineId',
            key: 'machineId',
            sorter: (a, b) => a.machineId - b.machineId,
            width: 130,
            align: 'center',
            render: (val: number) => <Text>{val}</Text>,
        },
        {
            title: () => t('productionPlanManagement.table.headers.plannedQuantity'),
            dataIndex: 'plannedQuantity',
            key: 'plannedQuantity',
            sorter: (a, b) => a.plannedQuantity - b.plannedQuantity,
            width: 160,
            align: 'center',
            render: (val: number) => <Text>{val.toLocaleString()}</Text>,
        },
        {
            title: () => t('productionPlanManagement.table.headers.status'),
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status: string) => (
                <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
            ),
        },
        {
            title: () => t('productionPlanManagement.table.headers.createdAt'),
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
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('productionPlanManagement.table.headers.actions'),
            key: 'actions',
            width: 150,
            align: 'center',
            ...(props?.isMobile ? {} : { fixed: 'right' as const }),
            render: (_, record: ProductionPlan) => (
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
                        <Tooltip title={t('productionPlanManagement.actions.edit')}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => props?.onEdit?.(record)}
                                aria-label={t('productionPlanManagement.actions.edit')}
                            />
                        </Tooltip>
                    )}
                    {canDelete && (
                        <Tooltip title={t('productionPlanManagement.actions.delete')}>
                            <Button
                                danger
                                type="primary"
                                icon={<DeleteOutlined />}
                                onClick={() => props?.onDelete?.(record)}
                                aria-label={t('productionPlanManagement.actions.delete')}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        });
    }

    return columns;
};
