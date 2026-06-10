'use client';
import { DrawingCode } from '@/types/DrawingCode';
import { Button, Popconfirm, Space, Tooltip, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import {
    EditOutlined,
    DeleteOutlined,
    FilePdfOutlined,
    UndoOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { AppAbility } from '@/configs/permissions/caslAbility';

const { Text } = Typography;

export type DrawingCodeTableColumnProps = {
    onEdit?: (drawingCode: DrawingCode) => void;
    onDelete?: (drawingCode: DrawingCode) => void;
    onView?: (drawingCode: DrawingCode) => void;
    onPreview?: (drawingCode: DrawingCode) => void;
    onRestore?: (drawingCode: DrawingCode) => void;
    t: (key: string, options?: any) => string;
    ability?: AppAbility;
};

export const getDrawingCodeTableColumns = (
    props?: DrawingCodeTableColumnProps
): ColumnsType<DrawingCode> => {
    const t = props?.t || ((key: string) => key);
    const ability = props?.ability;

    const canView = true;
    const canUpdate = ability?.can('update', 'drawing_code') ?? false;
    const canDelete = ability?.can('delete', 'drawing_code') ?? false;
    const canRestore = ability?.can('restore', 'drawing_code') ?? false;
    const hasAnyAction = canUpdate || canDelete || canRestore || canView;

    const columns: ColumnsType<DrawingCode> = [
        {
            title: () => t('drawingCodeManagement.table.headers.drawingCode'),
            dataIndex: 'drawingCode',
            key: 'drawingCode',
            sorter: (a, b) => a.drawingCode.localeCompare(b.drawingCode),
            width: 120,
            render: (text: string) => (
                <Tag color="geekblue" style={{ fontSize: 13 }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: () => t('drawingCodeManagement.table.headers.drawingCodeName'),
            dataIndex: 'drawingCodeName',
            key: 'drawingCodeName',
            sorter: (a, b) => a.drawingCodeName.localeCompare(b.drawingCodeName),
            width: 240,
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text strong style={{ fontSize: 14 }}>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: () => t('drawingCodeManagement.table.headers.description'),
            dataIndex: 'description',
            key: 'description',
            width: 280,
            render: (text: string | null) =>
                text ? (
                    <Tooltip placement="topLeft" title={text}>
                        <Text type="secondary">{text}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">-</Text>
                ),
        },
        {
            title: () => t('drawingCodeManagement.table.headers.pdfLink'),
            dataIndex: 'pdfLink',
            key: 'pdfLink',
            width: 140,
            align: 'center',
            render: (text: string | null, record: DrawingCode) => {
                if (!text) return <Text type="secondary">-</Text>;
                return (
                    <Tooltip title={t('drawingCodeManagement.table.actions.viewPdf')}>
                        <Button
                            type="link"
                            size="small"
                            icon={<FilePdfOutlined />}
                            onClick={() => props?.onPreview?.(record)}
                        >
                            PDF
                        </Button>
                    </Tooltip>
                );
            },
        },
        {
            title: () => t('drawingCodeManagement.table.headers.ofCustomer'),
            dataIndex: 'ofCustomer',
            key: 'ofCustomer',
            width: 140,
            align: 'center',
            render: (text: string | null) => text || <Text type="secondary">-</Text>,
        },
        {
            title: () => t('drawingCodeManagement.table.headers.stepsCount'),
            dataIndex: 'stepTemplates',
            key: 'stepsCount',
            width: 110,
            align: 'center',
            sorter: (a, b) => (a.stepTemplates?.length || 0) - (b.stepTemplates?.length || 0),
            render: (steps: DrawingCode['stepTemplates']) => (
                <Tag color="blue">
                    {steps?.length || 0} {t('drawingCodeManagement.table.steps')}
                </Tag>
            ),
        },
        {
            title: () => t('drawingCodeManagement.table.headers.status'),
            dataIndex: ['softDeleteMetaData', 'isDeleted'],
            key: 'isDeleted',
            width: 100,
            align: 'center',
            render: (isDeleted: boolean) => {
                return isDeleted ? (
                    <Tag color="red">{t('drawingCodeManagement.table.deleted')}</Tag>
                ) : (
                    <Tag color="green">{t('drawingCodeManagement.table.active')}</Tag>
                );
            },
        },
    ];

    if (hasAnyAction) {
        columns.push({
            title: () => t('drawingCodeManagement.table.headers.actions'),
            key: 'actions',
            width: 160,
            align: 'center',
            fixed: 'right',
            render: (_, record: DrawingCode) => {
                const isDeleted = record.softDeleteMetaData?.isDeleted;

                if (isDeleted) {
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
                            {canRestore && (
                                <Tooltip title={t('drawingCodeManagement.form.buttons.restore')}>
                                    <Button
                                        type="primary"
                                        icon={<UndoOutlined />}
                                        onClick={() => props?.onRestore?.(record)}
                                        style={{
                                            backgroundColor: '#52c41a',
                                            borderColor: '#52c41a',
                                        }}
                                        aria-label={t('drawingCodeManagement.form.buttons.restore')}
                                    />
                                </Tooltip>
                            )}
                        </Space>
                    );
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
                            <Tooltip title={t('drawingCodeManagement.form.buttons.edit')}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => props?.onEdit?.(record)}
                                    aria-label={t('drawingCodeManagement.form.buttons.edit')}
                                />
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Popconfirm
                                title={t('drawingCodeManagement.dialogs.deleteConfirmation.title')}
                                description={t(
                                    'drawingCodeManagement.dialogs.deleteConfirmation.description'
                                )}
                                onConfirm={() => props?.onDelete?.(record)}
                                okText={t('common.yes')}
                                cancelText={t('common.no')}
                                okButtonProps={{ danger: true }}
                                placement="topRight"
                            >
                                <Tooltip title={t('drawingCodeManagement.form.buttons.delete')}>
                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        aria-label={t('drawingCodeManagement.form.buttons.delete')}
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
