'use client';

import React from 'react';
import { Button, DatePicker, Popconfirm, Space, Tag, Alert, Tooltip, theme, Grid } from 'antd';
import {
    LeftOutlined,
    RightOutlined,
    EditOutlined,
    SaveOutlined,
    UndoOutlined,
    ReloadOutlined,
    WarningFilled,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import ResponsivePageHeader from '@/components/shared/header/ResponsivePageHeader';
import { useAbility } from '@/contexts/AbilityContext';

interface WorkCalendarHeaderProps {
    year: number;
    month: number;
    isConfirmed?: boolean;
    isEditMode: boolean;
    isSaving: boolean;
    isResetting: boolean;
    isConfirming?: boolean;
    hasDraftChanges: boolean;
    onMonthChange: (year: number, month: number) => void;
    onEnterEditMode: () => void;
    onCancelEditMode: () => void;
    onSaveChanges: () => void;
    onResetToDefault: () => void;
    onConfirmMonth?: () => void;
}

export const WorkCalendarHeader: React.FC<WorkCalendarHeaderProps> = React.memo(
    ({
        year,
        month,
        isConfirmed = false,
        isEditMode,
        isSaving,
        isResetting,
        isConfirming = false,
        hasDraftChanges,
        onMonthChange,
        onEnterEditMode,
        onCancelEditMode,
        onSaveChanges,
        onResetToDefault,
        onConfirmMonth,
    }) => {
        const { t, i18n } = useTranslation('common');
        const { token } = theme.useToken();
        const screens = Grid.useBreakpoint();
        const isMobile = !screens.md;
        const ability = useAbility();
        const canUpdate = ability.can('update', 'work_calendar');
        const canReset = ability.can('reset', 'work_calendar');

        const currentDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
        const datePickerFormat = i18n.language === 'en' ? 'MMMM, YYYY' : '[Tháng] MM, YYYY';

        // Check if the current month being viewed is in the past
        const isPastMonth = currentDate.isBefore(dayjs().startOf('month'));

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

        const titleContent = (
            <Space align="center" size="middle">
                <span>{t('workCalendar.header.title')}</span>
                {isConfirmed ? (
                    <Tag
                        color="success"
                        icon={<CheckCircleOutlined />}
                        style={{
                            fontSize: 13,
                            padding: '2px 10px',
                            borderRadius: token.borderRadiusLG,
                        }}
                    >
                        {t('workCalendar.header.confirmedBadge')}
                    </Tag>
                ) : (
                    <Tag
                        color="warning"
                        icon={<ClockCircleOutlined />}
                        style={{
                            fontSize: 13,
                            padding: '2px 10px',
                            borderRadius: token.borderRadiusLG,
                        }}
                    >
                        {t('workCalendar.header.unconfirmedBadge')}
                    </Tag>
                )}
            </Space>
        );

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

                {/* Confirm Month Button (Disabled when month is already confirmed OR in past) */}
                {!isEditMode &&
                    canUpdate &&
                    onConfirmMonth &&
                    (isConfirmed ? (
                        <Tooltip
                            title={t('workCalendar.header.alreadyConfirmedTooltip', {
                                month,
                                year,
                            })}
                        >
                            <span style={{ display: 'inline-block' }}>
                                <Button
                                    icon={
                                        <CheckCircleOutlined
                                            style={{ color: token.colorSuccess }}
                                        />
                                    }
                                    disabled
                                    style={{
                                        height: 38,
                                        borderRadius: token.borderRadius,
                                    }}
                                >
                                    {t('workCalendar.header.btnAlreadyConfirmed')}
                                </Button>
                            </span>
                        </Tooltip>
                    ) : isPastMonth ? (
                        <Tooltip title={t('workCalendar.header.pastMonthEditDisabled')}>
                            <span style={{ display: 'inline-block' }}>
                                <Button
                                    icon={<CheckCircleOutlined />}
                                    disabled
                                    style={{
                                        height: 38,
                                        borderRadius: token.borderRadius,
                                    }}
                                >
                                    {t('workCalendar.header.btnConfirmMonth')}
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Popconfirm
                            title={t('workCalendar.header.confirmMonthTitle')}
                            description={t('workCalendar.header.confirmMonthContent', {
                                month,
                                year,
                            })}
                            onConfirm={onConfirmMonth}
                            okText={t('workCalendar.header.btnConfirmMonth')}
                            cancelText={t('common.cancel')}
                            okButtonProps={{
                                loading: isConfirming,
                                style: {
                                    background: token.colorSuccess,
                                    borderColor: token.colorSuccess,
                                },
                            }}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={isConfirming}
                                style={{
                                    height: 38,
                                    borderRadius: token.borderRadius,
                                    background: token.colorSuccess,
                                    borderColor: token.colorSuccess,
                                    boxShadow: token.boxShadowSecondary,
                                }}
                            >
                                {t('workCalendar.header.btnConfirmMonth')}
                            </Button>
                        </Popconfirm>
                    ))}

                {/* Actions */}
                {!isEditMode ? (
                    <>
                        {canUpdate && (
                            <Tooltip
                                title={
                                    isPastMonth
                                        ? t('workCalendar.header.pastMonthEditDisabled')
                                        : undefined
                                }
                            >
                                <span style={{ display: 'inline-block' }}>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={onEnterEditMode}
                                        disabled={isPastMonth}
                                        style={{ height: 38, borderRadius: token.borderRadius }}
                                    >
                                        {t('workCalendar.header.btnEdit')}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                        {canReset && (
                            <Tooltip
                                title={
                                    isPastMonth
                                        ? t('workCalendar.header.pastMonthEditDisabled')
                                        : undefined
                                }
                            >
                                <span style={{ display: 'inline-block' }}>
                                    <Popconfirm
                                        title={t('workCalendar.header.confirmResetTitle')}
                                        description={t('workCalendar.header.confirmResetContent')}
                                        onConfirm={onResetToDefault}
                                        okText={t('common.reset')}
                                        cancelText={t('common.cancel')}
                                        okButtonProps={{ danger: true, loading: isResetting }}
                                        disabled={isPastMonth}
                                    >
                                        <Button
                                            icon={<ReloadOutlined />}
                                            loading={isResetting}
                                            disabled={isPastMonth}
                                            style={{ height: 38, borderRadius: token.borderRadius }}
                                        >
                                            {t('workCalendar.header.btnReset')}
                                        </Button>
                                    </Popconfirm>
                                </span>
                            </Tooltip>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            icon={<UndoOutlined />}
                            onClick={onCancelEditMode}
                            disabled={isSaving}
                            style={{ height: 38, borderRadius: token.borderRadius }}
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
                                borderRadius: token.borderRadius,
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
                <ResponsivePageHeader title={titleContent} rightContent={rightContent} />

                {/* Edit Mode Alert Banner */}
                {isEditMode && (
                    <Alert
                        title={
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? 13 : 14,
                                    color: token.colorWarningText,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {t('workCalendar.header.editModeNotice')}
                            </div>
                        }
                        description={
                            <div
                                style={{
                                    fontSize: isMobile ? 11.5 : 12.5,
                                    color: token.colorTextSecondary,
                                    lineHeight: 1.35,
                                    marginTop: 2,
                                }}
                            >
                                {isMobile
                                    ? t('workCalendar.header.editModeDescMobile')
                                    : t('workCalendar.header.editModeDesc')}
                            </div>
                        }
                        type="warning"
                        showIcon
                        icon={<WarningFilled style={{ fontSize: isMobile ? 16 : 18 }} />}
                        style={{
                            borderRadius: token.borderRadiusLG,
                            marginBottom: 12,
                            padding: isMobile ? '8px 12px' : '10px 16px',
                        }}
                    />
                )}
            </>
        );
    }
);

WorkCalendarHeader.displayName = 'WorkCalendarHeader';
