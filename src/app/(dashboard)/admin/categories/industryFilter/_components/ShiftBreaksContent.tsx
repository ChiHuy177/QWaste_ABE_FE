'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Table,
    Tag,
    Tooltip,
    Grid,
    TimePicker,
    Typography,
} from 'antd';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import { toast } from 'sonner';
import { ColumnsType } from 'antd/es/table';

import { ShiftBreakPeriodService } from '@/services/ShiftBreakPeriodService';
import { DemoShiftBreakPeriodService, USE_MOCK_FACTORY_OVERVIEW } from '@/mockData/admin/factory';
import { ShiftBreakPeriod } from '@/types/ShiftBreakPeriod';
import { IndustryFilter } from '@/types/IndustryFilter';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import i18n from '../../../../../../../i18n';
import dayjs from 'dayjs';

const VALIDATION_CONFIG = Object.freeze({
    BREAK_NAME_EN: { min: 2, max: 100, required: true },
    BREAK_NAME_VI: { min: 2, max: 100, required: true },
    BREAK_TIME: { required: true },
});

const { useBreakpoint } = Grid;
const { Text } = Typography;
const activeShiftBreakPeriodService = USE_MOCK_FACTORY_OVERVIEW
    ? DemoShiftBreakPeriodService
    : ShiftBreakPeriodService;

type Props = {
    filter: IndustryFilter;
    t: any;
    readOnly?: boolean;
};

const ShiftBreaksContent = ({ filter, t, readOnly = false }: Props) => {
    const [items, setItems] = useState<ShiftBreakPeriod[]>([]);
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();

    const [formOpen, setFormOpen] = useState(false);

    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    const [editing, setEditing] = useState<ShiftBreakPeriod | null>(null);

    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { handleError } = useApiErrorHandler();

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);

            const response = await activeShiftBreakPeriodService.getAllShiftBreakPeriods(
                filter.filterId
            );

            setItems(response || []);
        } catch (error) {
            handleError(error, { fallbackKey: 'industryFilterManagement.fetchError' });
        } finally {
            setLoading(false);
        }
    }, [filter.filterId, handleError]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleOpenCreate = () => {
        setFormMode('create');
        setEditing(null);

        form.resetFields();

        setFormOpen(true);
    };

    const handleOpenEdit = useCallback(
        (record: ShiftBreakPeriod) => {
            setFormMode('edit');

            setEditing(record);

            form.setFieldsValue({
                ...record,
                breakStartTime: record.breakStartTime ? dayjs(record.breakStartTime, 'HH:mm') : null,
                breakEndTime: record.breakEndTime ? dayjs(record.breakEndTime, 'HH:mm') : null,
            });

            setFormOpen(true);
        },
        [form]
    );

    const handleDelete = useCallback(async (id: number) => {
        try {
            setLoading(true);

            await activeShiftBreakPeriodService.deleteShiftBreakPeriod(id);

            toast.success(t('industryFilterManagement.shiftBreaks.deleteSuccess'));

            await fetchItems();
        } catch (error) {
            handleError(error, {
                fallbackKey: 'industryFilterManagement.shiftBreaks.deleteError',
            });
        } finally {
            setLoading(false);
        }
    }, [fetchItems, handleError, t]);

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);

            const payload = {
                ...values,
                breakStartTime: values.breakStartTime?.format('HH:mm'),
                breakEndTime: values.breakEndTime?.format('HH:mm'),
            };

            const shiftStart = dayjs(filter.startTime, 'HH:mm');
            let shiftEnd = dayjs(filter.endTime, 'HH:mm');

            let breakStart = dayjs(payload.breakStartTime, 'HH:mm');
            let breakEnd = dayjs(payload.breakEndTime, 'HH:mm');

            if (filter.crossesMidnight) {
                if (shiftEnd.isBefore(shiftStart)) {
                    shiftEnd = shiftEnd.add(1, 'day');
                }

                if (breakStart.isBefore(shiftStart)) {
                    breakStart = breakStart.add(1, 'day');
                }

                if (breakEnd.isBefore(shiftStart)) {
                    breakEnd = breakEnd.add(1, 'day');
                }
            }

            if (breakEnd.isBefore(breakStart)) {
                breakEnd = breakEnd.add(1, 'day');
            }

            if (breakStart.isBefore(shiftStart) || breakEnd.isAfter(shiftEnd)) {
                toast.error(t('industryFilterManagement.shiftBreaks.validation.outsideShiftTime'));
                return;
            }

            if (formMode === 'create') {
                await activeShiftBreakPeriodService.createShiftBreakPeriod({
                    filterId: filter.filterId,
                    ...payload,
                });

                toast.success(t('industryFilterManagement.shiftBreaks.createSuccess'));
            } else if (editing) {
                await activeShiftBreakPeriodService.updateShiftBreakPeriods([
                    {
                        breakPeriodId: editing.breakPeriodId,
                        ...payload,
                    },
                ]);

                toast.success(t('industryFilterManagement.shiftBreaks.updateSuccess'));
            }

            setFormOpen(false);
            await fetchItems();
        } catch (error) {
            handleError(error, { fallbackKey: 'common.error' });
        } finally {
            setLoading(false);
        }
    };

    const columns: ColumnsType<ShiftBreakPeriod> = useMemo(() => {
        const baseColumns: ColumnsType<ShiftBreakPeriod> = [
            {
                title: () => t('industryFilterManagement.shiftBreaks.table.name'),
                key: 'breakName',
                render: (_, record) =>
                    i18n.language === 'en' ? record.breakNameEn : record.breakNameVi,
            },
            {
                title: () => t('industryFilterManagement.shiftBreaks.table.start'),
                dataIndex: 'breakStartTime',
                key: 'breakStartTime',
                align: 'center',
                render: (text: string) => <Tag color="blue">{text?.slice(0, 5)}</Tag>,
            },
            {
                title: () => t('industryFilterManagement.shiftBreaks.table.end'),
                dataIndex: 'breakEndTime',
                key: 'breakEndTime',
                align: 'center',
                render: (text: string) => <Tag color="orange">{text?.slice(0, 5)}</Tag>,
            },
            {
                title: () => t('industryFilterManagement.shiftBreaks.table.order'),
                dataIndex: 'sortOrder',
                key: 'sortOrder',
                align: 'center',
            },
        ];

        if (!readOnly) {
            baseColumns.push({
                title: () => t('industryFilterManagement.shiftBreaks.table.actions'),
                key: 'actions',
                align: 'center',
                render: (_, record) => (
                    <Space>
                        <Tooltip title={t('common.edit')}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEdit(record)}
                            />
                        </Tooltip>

                        <Popconfirm
                            title={t('industryFilterManagement.shiftBreaks.deleteConfirm')}
                            onConfirm={() => handleDelete(record.breakPeriodId)}
                        >
                            <Button danger type="primary" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                ),
            });
        }

        return baseColumns;
    }, [t, readOnly, handleDelete, handleOpenEdit]);

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 15,
                }}
            >
                {!readOnly && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                        {t('industryFilterManagement.shiftBreaks.createTitle')}
                    </Button>
                )}
                <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                        {t('industryFilterManagement.shiftBreaks.shiftTime')}
                    </Text>

                    <Text strong>
                        {filter.startTime} - {filter.endTime}
                    </Text>

                    {filter.crossesMidnight && (
                        <Tag color="orange" style={{ fontSize: 11 }}>
                            {t('industryFilterManagement.table.crossesMidnight')}
                        </Tag>
                    )}
                </Space>
            </div>

            <Table
                rowKey={(record) => record.breakPeriodId}
                columns={columns}
                dataSource={items}
                loading={loading}
                pagination={false}
                rowHoverable={!readOnly}
                scroll={{
                    x: 'max-content',
                    y: 32 * 5,
                }}
            />

            <Modal
                open={formOpen}
                title={
                    formMode === 'create'
                        ? t('industryFilterManagement.shiftBreaks.createTitle')
                        : t('industryFilterManagement.shiftBreaks.editTitle')
                }
                onCancel={() => setFormOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={loading}
                width={isMobile ? '95%' : 520}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="breakNameEn"
                        label={t('industryFilterManagement.shiftBreaks.fields.nameEn')}
                        rules={[
                            {
                                required: VALIDATION_CONFIG.BREAK_NAME_EN.required,
                                whitespace: true,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.nameEnRequired'
                                ),
                            },
                            {
                                min: VALIDATION_CONFIG.BREAK_NAME_EN.min,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.minLength',
                                    {
                                        min: VALIDATION_CONFIG.BREAK_NAME_EN.min,
                                    }
                                ),
                            },
                            {
                                max: VALIDATION_CONFIG.BREAK_NAME_EN.max,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.maxLength',
                                    {
                                        max: VALIDATION_CONFIG.BREAK_NAME_EN.max,
                                    }
                                ),
                            },
                        ]}
                    >
                        <Input maxLength={VALIDATION_CONFIG.BREAK_NAME_EN.max} showCount />
                    </Form.Item>

                    <Form.Item
                        name="breakNameVi"
                        label={t('industryFilterManagement.shiftBreaks.fields.nameVi')}
                        rules={[
                            {
                                required: VALIDATION_CONFIG.BREAK_NAME_VI.required,
                                whitespace: true,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.nameViRequired'
                                ),
                            },
                            {
                                min: VALIDATION_CONFIG.BREAK_NAME_VI.min,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.minLength',
                                    {
                                        min: VALIDATION_CONFIG.BREAK_NAME_VI.min,
                                    }
                                ),
                            },
                            {
                                max: VALIDATION_CONFIG.BREAK_NAME_VI.max,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.maxLength',
                                    {
                                        max: VALIDATION_CONFIG.BREAK_NAME_VI.max,
                                    }
                                ),
                            },
                        ]}
                    >
                        <Input maxLength={VALIDATION_CONFIG.BREAK_NAME_VI.max} showCount />
                    </Form.Item>

                    <Form.Item
                        name="breakStartTime"
                        label={t('industryFilterManagement.shiftBreaks.fields.start')}
                        dependencies={['breakEndTime']}
                        rules={[
                            {
                                required: VALIDATION_CONFIG.BREAK_TIME.required,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.startTimeRequired'
                                ),
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const breakEnd = getFieldValue('breakEndTime');

                                    if (!value || !breakEnd) {
                                        return Promise.resolve();
                                    }

                                    if (value.isSame(breakEnd, 'minute')) {
                                        return Promise.reject(
                                            new Error(
                                                t(
                                                    'industryFilterManagement.shiftBreaks.validation.invalidBreakTime'
                                                )
                                            )
                                        );
                                    }

                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <TimePicker format="HH:mm A" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="breakEndTime"
                        label={t('industryFilterManagement.shiftBreaks.fields.end')}
                        dependencies={['breakStartTime']}
                        rules={[
                            {
                                required: VALIDATION_CONFIG.BREAK_TIME.required,
                                message: t(
                                    'industryFilterManagement.shiftBreaks.validation.endTimeRequired'
                                ),
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    const breakStart = getFieldValue('breakStartTime');

                                    if (!breakStart || !value) {
                                        return Promise.resolve();
                                    }

                                    if (value.isSame(breakStart, 'minute')) {
                                        return Promise.reject(
                                            new Error(
                                                t(
                                                    'industryFilterManagement.shiftBreaks.validation.invalidBreakTime'
                                                )
                                            )
                                        );
                                    }

                                    return Promise.resolve();
                                },
                            }),
                        ]}
                    >
                        <TimePicker format="HH:mm A" style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ShiftBreaksContent;
