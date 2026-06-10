'use client';
import { MachineOperatorHistory } from '@/types/MachineOperatorHistory';
import { Button, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type machineOperatorHistoryTableColumnProps = {
    onView?: (machine: MachineOperatorHistory) => void;
    onEdit?: (machine: MachineOperatorHistory) => void;
    onDelete?: (machine: MachineOperatorHistory) => void;
    isMobile?: boolean;
    t: (key: string) => string;
    ability?: AppAbility;
};

export const getMachineListTableColumns = (
    props?: machineOperatorHistoryTableColumnProps
): ColumnsType<MachineOperatorHistory> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;
    const canView = true;
    const canUpdate = ability?.can('update', 'staffing') ?? false;
    const hasAnyAction = canUpdate || canView;

    const columns: ColumnsType<MachineOperatorHistory> = [
        {
            title: () => t('machineStaffing.table.headers.machineCode'),
            dataIndex: 'machineCode',
            key: 'machineCode',
            sorter: (a, b) => a.machineCode.localeCompare(b.machineCode),
            width: 100,
            align: 'center',
            // fixed: 'left',
            render: (text: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    #{text}
                </Text>
            ),
        },
        {
            title: () => t('machineStaffing.table.headers.machineName'),
            dataIndex: 'machineName',
            key: 'machineName',
            sorter: (a, b) => a.machineName.localeCompare(b.machineName),
            width: 200,
            // fixed: 'left',
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
            title: () => t('machineStaffing.table.headers.operatorCount'),
            dataIndex: 'operatorCount',
            key: 'operatorCount',
            width: 150,
            align: 'center',
            sorter: (a, b) => (a.operatorCount || 0) - (b.operatorCount || 0),
            render: (operatorCount: number) => (
                <Tag color="blue" style={{ fontSize: 13 }}>
                    {operatorCount || 0} {t('machineStaffing.table.units.operators')}
                </Tag>
            ),
        },
        {
            title: () => t('machineStaffing.table.headers.notes'),
            dataIndex: 'notes',
            key: 'notes',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text type="secondary">{text}</Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('machineStaffing.table.headers.createdAt'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            align: 'center',
            sorter: (a, b) => {
                const dateA = a.createdAt || '';
                const dateB = b.createdAt || '';
                return String(dateA).localeCompare(String(dateB));
            },
            render: (date: Date | string) => {
                if (!date) return <Text type="secondary">{t('common.notAvailable')}</Text>;
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
            title: '',
            key: 'actions',
            width: 100,
            align: 'center' as const,
            ...(props?.isMobile ? {} : { fixed: 'right' }),
            render: (_: any, record: MachineOperatorHistory) => {
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
                            <Tooltip title={t('machineStaffing.actions.edit')}>
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
                    </Space>
                );
            },
        });
    }

    return columns;
};
