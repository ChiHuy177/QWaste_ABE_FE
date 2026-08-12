'use client';

import React from 'react';
import { Button, DatePicker, Popconfirm, Space, Tag, Alert, theme } from 'antd';
import {
    LeftOutlined,
    RightOutlined,
    EditOutlined,
    SaveOutlined,
    UndoOutlined,
    ReloadOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { useAbility } from '@/contexts/AbilityContext';

interface WorkCalendarHeaderProps {
    year: number;
    month: number;
    isEditMode: boolean;
    isSaving: boolean;
    isResetting: boolean;
    hasDraftChanges: boolean;
    onMonthChange: (year: number, month: number) => void;
    onEnterEditMode: () => void;
    onCancelEditMode: () => void;
    onSaveChanges: () => void;
    onResetToDefault: () => void;
}

export const WorkCalendarHeader = React.memo<WorkCalendarHeaderProps>(
    ({
        year,
        month,
        isEditMode,
        isSaving,
        isResetting,
        hasDraftChanges,
        onMonthChange,
        onEnterEditMode,
        onCancelEditMode,
        onSaveChanges,
        onResetToDefault,
    }) => {
        const { t, i18n } = useTranslation('common');
        const { token } = theme.useToken();
        const ability = useAbility();
        const canUpdate = ability.can('update', 'work_calendar');
        const canReset = ability.can('reset', 'work_calendar');

        const currentDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
        const datePickerFormat = i18n.language === 'en' ? 'MMMM, YYYY' : '[Tháng] MM, YYYY';

        const handlePrevMonth = () => {
            const prev = currentDate.subtract(1, 'month');
            onMonthChange(prev.year(), prev.month() + 1);
        };

        const handleNextMonth = () => {
            const next = currentDate.add(1, 'month');
            onMonthChange(next.year(), next.month() + 1);
        };

        const handleDatePickerChange = (date: Dayjs | null) => {
            if (date) {
                onMonthChange(date.year(), date.month() + 1);
            }
        };

        const rightContent = (
            <Space size="small" wrap style={{ width: '100%' }}>
                {/* Month Picker Group */}
                <Space size="small">
                    <Button
                        icon={<LeftOutlined />}
                        onClick={handlePrevMonth}
                        disabled={isEditMode}
                        style={{ height: 38 }}
                    />
                    <DatePicker.MonthPicker
                        value={currentDate}
                        onChange={handleDatePickerChange}
                        format={datePickerFormat}
                        allowClear={false}
                        disabled={isEditMode}
                        style={{ width: 160, height: 38 }}
                    />
                    <Button
                        icon={<RightOutlined />}
                        onClick={handleNextMonth}
                        disabled={isEditMode}
                        style={{ height: 38 }}
                    />
                </Space>

                {/* Actions */}
                {!isEditMode ? (
                    <>
                        {canUpdate && (
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={onEnterEditMode}
                                style={{ height: 38, borderRadius: 8 }}
                            >
                                {t('workCalendar.header.btnEdit')}
                            </Button>
                        )}
                        {canReset && (
                            <Popconfirm
                                title={t('workCalendar.header.confirmResetTitle')}
                                description={t('workCalendar.header.confirmResetContent')}
                                onConfirm={onResetToDefault}
                                okText={t('common.reset')}
                                cancelText={t('common.cancel')}
                                okButtonProps={{ danger: true, loading: isResetting }}
                            >
                                <Button
                                    icon={<ReloadOutlined />}
                                    loading={isResetting}
                                    style={{ height: 38, borderRadius: 8 }}
                                >
                                    {t('workCalendar.header.btnReset')}
                                </Button>
                            </Popconfirm>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            icon={<UndoOutlined />}
                            onClick={onCancelEditMode}
                            disabled={isSaving}
                            style={{ height: 38, borderRadius: 8 }}
                        >
                            {t('workCalendar.header.btnCancel')}
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={isSaving}
                            onClick={onSaveChanges}
                            style={{
                                height: 38,
                                borderRadius: 8,
                                boxShadow: token.boxShadowSecondary,
                            }}
                        >
                            {t('workCalendar.header.btnSave')}{' '}
                            {hasDraftChanges && (
                                <Tag color="gold" style={{ marginLeft: 4 }}>
                                    {t('workCalendar.header.hasChanges')}
                                </Tag>
                            )}
                        </Button>
                    </>
                )}
            </Space>
        );

        return (
            <>
                <ResponsivePageHeader
                    title={t('workCalendar.header.title')}
                    rightContent={rightContent}
                />

                {/* Edit Mode Alert Banner */}
                {isEditMode && (
                    <Alert
                        title={t('workCalendar.header.editModeNotice')}
                        description={t('workCalendar.header.editModeDesc')}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        style={{ borderRadius: 8, marginBottom: 16 }}
                    />
                )}
            </>
        );
    }
);
WorkCalendarHeader.displayName = 'WorkCalendarHeader';
