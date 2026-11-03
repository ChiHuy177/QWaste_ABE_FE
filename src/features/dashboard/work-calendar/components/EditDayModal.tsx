'use client';

import React, { useEffect, useMemo } from 'react';
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
import { getShiftPatternColor } from '@/utils';
import { useTheme } from '@/hooks/useTheme';
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
        patternCode?: string | null,
        patternName?: string | null,
        plannedTime?: number
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
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const sc = isDark ? statusColors.dark : statusColors.light;
    const [form] = Form.useForm();
    const isWorkingDayWatch = Form.useWatch('isWorkingDay', form);
    const shiftPatternIdWatch = Form.useWatch('shiftPatternId', form);

    const isSingle = selectedDates.length === 1;
    const singleDayData = isSingle ? daysMap.get(selectedDates[0]) : null;
    const formattedSingleDate = isSingle ? dayjs(selectedDates[0]).format('DD/MM/YYYY') : '';

    const defaultPattern = shiftPatterns.find((p) => p.default) || shiftPatterns[0];

    // Build pattern hours map from current daysMap
    const patternHoursMap = useMemo(() => {
        const map = new Map<number, number>();
        daysMap.forEach((day) => {
            if (
                day.shiftPatternId &&
                day.isWorkingDay &&
                day.plannedTime > 0 &&
                !map.has(day.shiftPatternId)
            ) {
                map.set(day.shiftPatternId, day.plannedTime);
            }
        });
        return map;
    }, [daysMap]);

    // Calculate current planned hours preview
    const currentPlannedHours = useMemo(() => {
        if (!isWorkingDayWatch) return 0;
        const targetPatternId = shiftPatternIdWatch || defaultPattern?.patternId;
        if (targetPatternId && patternHoursMap.has(targetPatternId)) {
            const h = patternHoursMap.get(targetPatternId)!;
            return Number.isInteger(h) ? h : Number(h.toFixed(2));
        }
        if (isSingle && singleDayData?.plannedTime && singleDayData.plannedTime > 0) {
            const h = singleDayData.plannedTime;
            return Number.isInteger(h) ? h : Number(h.toFixed(2));
        }
        return 8;
    }, [
        isWorkingDayWatch,
        shiftPatternIdWatch,
        defaultPattern,
        patternHoursMap,
        isSingle,
        singleDayData,
    ]);

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
                if (form.getFieldValue('dayType') !== 'WORKING') {
                    form.setFieldValue('dayType', 'WORKING');
                }
            }
        }
        if ('dayType' in changedValues) {
            const dt = changedValues.dayType;
            if (dt === 'WORKING') {
                form.setFieldValue('isWorkingDay', true);
                if (!form.getFieldValue('shiftPatternId')) {
                    form.setFieldValue('shiftPatternId', defaultPattern?.patternId);
                }
            } else {
                form.setFieldValue('isWorkingDay', false);
                form.setFieldValue('shiftPatternId', undefined);
            }
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const selectedPattern = shiftPatterns.find(
                (p) => p.patternId === values.shiftPatternId
            );
            const plannedTime = values.isWorkingDay
                ? values.shiftPatternId && patternHoursMap.has(values.shiftPatternId)
                    ? patternHoursMap.get(values.shiftPatternId)!
                    : isSingle && singleDayData?.plannedTime && singleDayData.plannedTime > 0
                      ? singleDayData.plannedTime
                      : 8.0
                : 0;

            onSave(
                selectedDates,
                values.dayType,
                values.isWorkingDay,
                values.isWorkingDay ? values.shiftPatternId : null,
                values.isWorkingDay ? selectedPattern?.patternCode : null,
                values.isWorkingDay ? selectedPattern?.patternName : null,
                plannedTime
            );
            onClose();
        } catch {
            // Form validation feedback handled by Ant Design Form UI
        }
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
                            options={shiftPatterns.map((p, idx) => {
                                const pColor = getShiftPatternColor(p.patternId, idx, isDark);
                                const hours = patternHoursMap.get(p.patternId);
                                return {
                                    value: p.patternId,
                                    label: (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                            }}
                                        >
                                            <Space align="center" size={6}>
                                                <Tag
                                                    color={pColor.tagColor}
                                                    style={{
                                                        margin: 0,
                                                        borderRadius: token.borderRadiusXS,
                                                    }}
                                                >
                                                    {p.patternCode}
                                                </Tag>
                                                <span>{p.patternName}</span>
                                                {p.default && (
                                                    <Tag style={{ margin: 0, fontSize: 10 }}>
                                                        {t(
                                                            'workCalendar.modal.defaultPatternTag',
                                                            'Mặc định'
                                                        )}
                                                    </Tag>
                                                )}
                                            </Space>
                                            {typeof hours === 'number' && (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {Number.isInteger(hours)
                                                        ? hours
                                                        : hours.toFixed(2)}
                                                    h
                                                </Text>
                                            )}
                                        </div>
                                    ),
                                };
                            })}
                        />
                    </Form.Item>
                )}

                {/* Hours preview card */}
                <div
                    style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        background: token.colorFillAlter,
                        borderRadius: token.borderRadiusSM,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text type="secondary">
                        {t('workCalendar.modal.hoursPreviewLabel', {
                            defaultValue: 'Giờ làm việc dự kiến:',
                        })}
                    </Text>
                    <Text
                        strong
                        style={{
                            color: isWorkingDayWatch ? sc.runtime.base : token.colorTextSecondary,
                            fontSize: 14,
                        }}
                    >
                        {isWorkingDayWatch
                            ? t('workCalendar.modal.hoursUnitPerDay', {
                                  hours: currentPlannedHours,
                                  defaultValue: `${currentPlannedHours}h / ngày`,
                              })
                            : t('workCalendar.modal.hoursZeroOff', { defaultValue: '0h (Nghỉ)' })}
                    </Text>
                </div>
            </Form>
        </Modal>
    );
};
