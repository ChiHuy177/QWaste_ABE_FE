'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Switch, Radio, Space, Typography, Tag, Alert, Divider, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { WorkCalendarDayResponse, DayType } from '@/types/WorkCalendar';
import { statusColors } from '@/configs/antdTheme';
import dayjs from 'dayjs';

const { Text } = Typography;

interface EditDayModalProps {
    open: boolean;
    selectedDates: string[];
    daysMap: Map<string, WorkCalendarDayResponse>;
    onClose: () => void;
    onSave: (selectedDates: string[], dayType: DayType, isWorkingDay: boolean) => void;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({
    open,
    selectedDates,
    daysMap,
    onClose,
    onSave,
}) => {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const isDark = token.colorBgContainer !== '#ffffff';
    const sc = isDark ? statusColors.dark : statusColors.light;
    const [form] = Form.useForm();

    const isSingle = selectedDates.length === 1;
    const singleDayData = isSingle ? daysMap.get(selectedDates[0]) : null;
    const formattedSingleDate = isSingle ? dayjs(selectedDates[0]).format('DD/MM/YYYY') : '';

    useEffect(() => {
        if (open) {
            if (isSingle && singleDayData) {
                form.setFieldsValue({
                    isWorkingDay: singleDayData.isWorkingDay,
                    dayType: singleDayData.dayType,
                });
            } else {
                form.setFieldsValue({
                    isWorkingDay: true,
                    dayType: 'WORKING',
                });
            }
        }
    }, [open, isSingle, singleDayData, form]);

    if (!open || selectedDates.length === 0) return null;

    const handleValuesChange = (changedValues: Partial<{ isWorkingDay: boolean; dayType: DayType }>) => {
        if ('isWorkingDay' in changedValues) {
            const isWorking = changedValues.isWorkingDay;
            if (!isWorking && form.getFieldValue('dayType') === 'WORKING') {
                form.setFieldValue('dayType', 'WEEKEND_OFF');
            } else if (isWorking && form.getFieldValue('dayType') === 'WEEKEND_OFF') {
                form.setFieldValue('dayType', 'WORKING');
            }
        }
    };

    const handleOk = () => {
        form.validateFields().then((values) => {
            onSave(selectedDates, values.dayType, values.isWorkingDay);
            onClose();
        });
    };

    const modalTitle = isSingle ? (
        <Space align="center">
            <span>{t('workCalendar.modal.editDayTitle', { date: formattedSingleDate })}</span>
            {singleDayData?.isOverride && (
                <Tag color="green">{t('workCalendar.grid.overrideBadge')}</Tag>
            )}
        </Space>
    ) : (
        <span>{t('workCalendar.drawer.bulkEditTitle', { count: selectedDates.length })}</span>
    );

    return (
        <Modal
            title={modalTitle}
            open={open}
            onOk={handleOk}
            onCancel={onClose}
            okText={t('workCalendar.modal.btnApply')}
            cancelText={t('common.cancel')}
            destroyOnHidden
            centered
            width={480}
        >
            <Divider style={{ margin: '12px 0 20px 0' }} />

            {/* Information Header */}
            {isSingle ? (
                <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Text type="secondary">{t('workCalendar.modal.selectedDateLabel')}</Text>
                    <Text strong>{formattedSingleDate}</Text>
                </div>
            ) : (
                <Alert
                    title={t('workCalendar.drawer.bulkEditNotice')}
                    description={t('workCalendar.drawer.bulkEditDesc', {
                        count: selectedDates.length,
                    })}
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                initialValues={
                    isSingle && singleDayData
                        ? {
                              isWorkingDay: singleDayData.isWorkingDay,
                              dayType: singleDayData.dayType,
                          }
                        : { isWorkingDay: true, dayType: 'WORKING' }
                }
            >
                <Form.Item
                    name="isWorkingDay"
                    label={t('workCalendar.modal.workingStatusLabel')}
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren={t('workCalendar.modal.statusWorking')}
                        unCheckedChildren={t('workCalendar.modal.statusOff')}
                    />
                </Form.Item>

                <Form.Item
                    name="dayType"
                    label={t('workCalendar.modal.dayTypeLabel')}
                    rules={[{ required: true, message: t('workCalendar.modal.dayTypeLabel') }]}
                >
                    <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <Radio value="WORKING">
                                <span style={{ fontWeight: 500, color: sc.runtime.base }}>
                                    {t('workCalendar.dayType.workingDesc')}
                                </span>
                            </Radio>
                            <Radio value="WEEKEND_OFF">
                                <span style={{ fontWeight: 500, color: sc.offline.base }}>
                                    {t('workCalendar.dayType.weekendOffDesc')}
                                </span>
                            </Radio>
                            <Radio value="HOLIDAY">
                                <span style={{ fontWeight: 500, color: sc.error.base }}>
                                    {t('workCalendar.dayType.holidayDesc')}
                                </span>
                            </Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>
            </Form>
        </Modal>
    );
};
