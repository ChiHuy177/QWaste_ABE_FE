'use client';

import React, { useEffect } from 'react';
import {
    Modal,
    Form,
    Switch,
    Radio,
    Space,
    Typography,
    Tag,
    Alert,
    Divider,
    Select,
    theme,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { WorkCalendarDayResponse, DayType } from '@/types/WorkCalendar';
import { ShiftPatternForPicking } from '@/types/ShiftPattern';
import { statusColors } from '@/configs/antdTheme';
import dayjs from 'dayjs';

const { Text } = Typography;

interface EditDayModalProps {
    open: boolean;
    selectedDates: string[];
    daysMap: Map<string, WorkCalendarDayResponse>;
    shiftPatterns?: ShiftPatternForPicking[];
    onClose: () => void;
    onSave: (
        selectedDates: string[],
        dayType: DayType,
        isWorkingDay: boolean,
        shiftPatternId?: number | null,
        patternCode?: string | null
    ) => void;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({
    open,
    selectedDates,
    daysMap,
    shiftPatterns = [],
    onClose,
    onSave,
}) => {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const isDark = token.colorBgContainer !== '#ffffff';
    const sc = isDark ? statusColors.dark : statusColors.light;
    const [form] = Form.useForm();
    const isWorkingDayWatch = Form.useWatch('isWorkingDay', form);

    const isSingle = selectedDates.length === 1;
    const singleDayData = isSingle ? daysMap.get(selectedDates[0]) : null;
    const formattedSingleDate = isSingle ? dayjs(selectedDates[0]).format('DD/MM/YYYY') : '';

    const defaultPattern = shiftPatterns.find((p) => p.default) || shiftPatterns[0];

    useEffect(() => {
        if (open) {
            if (isSingle && singleDayData) {
                form.setFieldsValue({
                    isWorkingDay: singleDayData.isWorkingDay,
                    dayType: singleDayData.dayType,
                    shiftPatternId: singleDayData.isWorkingDay
                        ? singleDayData.shiftPatternId || defaultPattern?.patternId
                        : undefined,
                });
            } else {
                form.setFieldsValue({
                    isWorkingDay: true,
                    dayType: 'WORKING',
                    shiftPatternId: defaultPattern?.patternId,
                });
            }
        }
    }, [open, isSingle, singleDayData, form, defaultPattern]);

    if (!open || selectedDates.length === 0) return null;

    const handleValuesChange = (
        changedValues: Partial<{ isWorkingDay: boolean; dayType: DayType; shiftPatternId: number }>
    ) => {
        if ('isWorkingDay' in changedValues) {
            const isWorking = changedValues.isWorkingDay;
            if (!isWorking) {
                form.setFieldValue('shiftPatternId', undefined);
                if (form.getFieldValue('dayType') === 'WORKING') {
                    form.setFieldValue('dayType', 'WEEKEND_OFF');
                }
            } else {
                form.setFieldValue('shiftPatternId', defaultPattern?.patternId);
                if (form.getFieldValue('dayType') === 'WEEKEND_OFF') {
                    form.setFieldValue('dayType', 'WORKING');
                }
            }
        }
    };

    const handleOk = () => {
        form.validateFields().then((values) => {
            const selectedPattern = shiftPatterns.find(
                (p) => p.patternId === values.shiftPatternId
            );
            onSave(
                selectedDates,
                values.dayType,
                values.isWorkingDay,
                values.isWorkingDay ? values.shiftPatternId : null,
                values.isWorkingDay ? selectedPattern?.patternCode : null
            );
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

                {isWorkingDayWatch && (
                    <Form.Item
                        name="shiftPatternId"
                        label={t('workCalendar.modal.shiftPatternLabel', 'Mẫu ca')}
                        rules={[
                            {
                                required: true,
                                message: t(
                                    'workCalendar.errors.patternRequired',
                                    'Vui lòng chọn mẫu ca cho ngày làm việc'
                                ),
                            },
                        ]}
                    >
                        <Select
                            placeholder={t(
                                'workCalendar.modal.selectPatternPlaceholder',
                                'Chọn mẫu ca'
                            )}
                            options={shiftPatterns.map((p) => ({
                                value: p.patternId,
                                label: `${p.patternName} (${p.patternCode})${p.default ? ` - ${t('workCalendar.modal.defaultPatternTag', 'Mặc định')}` : ''}`,
                            }))}
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};
