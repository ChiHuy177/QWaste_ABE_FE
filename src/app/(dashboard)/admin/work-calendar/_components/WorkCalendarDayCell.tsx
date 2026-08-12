'use client';

import React from 'react';
import { Tag, Tooltip, Checkbox, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { WorkCalendarDayResponse } from '@/types/WorkCalendar';
import { statusColors } from '@/configs/antdTheme';

interface WorkCalendarDayCellProps {
    dayData?: WorkCalendarDayResponse;
    dateString: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isEditMode: boolean;
    isModified: boolean;
    isSelected: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
}

export const WorkCalendarDayCell: React.FC<WorkCalendarDayCellProps> = ({
    dayData,
    dayNumber,
    isCurrentMonth,
    isEditMode,
    isModified,
    isSelected,
    onClick,
    onMouseDown,
    onMouseEnter,
}) => {
    const { t } = useTranslation('common');
    const { token } = theme.useToken();
    const isDark = token.colorBgContainer !== '#ffffff';
    const sc = isDark ? statusColors.dark : statusColors.light;

    if (!isCurrentMonth) {
        return (
            <div
                style={{
                    height: '100%',
                    minHeight: 95,
                    padding: 8,
                    opacity: 0.4,
                    background: token.colorBgLayout,
                    borderRadius: 8,
                    cursor: 'not-allowed',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    userSelect: 'none',
                }}
            >
                <div style={{ color: token.colorTextQuaternary, fontSize: 13, fontWeight: 500 }}>
                    {dayNumber}
                </div>
            </div>
        );
    }

    const dayType = dayData?.dayType || 'WORKING';
    const isWorkingDay = dayData?.isWorkingDay ?? true;
    const isOverride = dayData?.isOverride ?? false;
    const plannedTime = dayData?.plannedTime ?? 0;

    let cellBg = sc.runtime.bg;
    let cellBorder = sc.runtime.border;
    let typeLabel = t('workCalendar.dayType.working');
    let typeColor = sc.runtime.base;

    if (dayType === 'WEEKEND_OFF' || (!isWorkingDay && dayType !== 'HOLIDAY')) {
        cellBg = sc.offline.bg;
        cellBorder = sc.offline.border;
        typeLabel = t('workCalendar.dayType.weekendOff');
        typeColor = sc.offline.base;
    } else if (dayType === 'HOLIDAY') {
        cellBg = sc.error.bg;
        cellBorder = sc.error.border;
        typeLabel = t('workCalendar.dayType.holiday');
        typeColor = sc.error.base;
    }

    let borderStyle = `1px solid ${cellBorder}`;
    if (isSelected) {
        borderStyle = `2px solid ${token.colorPrimary}`;
    } else if (isModified) {
        borderStyle = `2px dashed ${token.colorPrimary}`;
    }

    return (
        <div
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            style={{
                position: 'relative',
                height: '100%',
                minHeight: 95,
                padding: '8px 10px',
                background: isSelected ? token.colorPrimaryBg : cellBg,
                border: borderStyle,
                borderRadius: 8,
                cursor: isEditMode ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 0 0 2px ${token.colorPrimary}` : undefined,
                overflow: 'hidden',
                userSelect: 'none',
            }}
        >
            {/* Top row: Checkbox/Day Number & Badges */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isEditMode && (
                        <Checkbox
                            checked={isSelected}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: isWorkingDay ? token.colorText : token.colorTextSecondary,
                        }}
                    >
                        {dayNumber}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Draft Modified Badge */}
                    {isModified && (
                        <Tag
                            color="blue"
                            style={{
                                margin: 0,
                                fontSize: 10,
                                lineHeight: '16px',
                                padding: '0 4px',
                                borderRadius: 4,
                            }}
                        >
                            {t('workCalendar.grid.editedBadge')}
                        </Tag>
                    )}

                    {/* Override Green Dot */}
                    {isOverride && (
                        <Tooltip title={t('workCalendar.grid.overrideTooltip')}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: sc.runtime.base,
                                    display: 'inline-block',
                                    boxShadow: `0 0 4px ${sc.runtime.base}`,
                                }}
                            />
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Middle: Day Type Badge */}
            <div style={{ marginBottom: 4 }}>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: typeColor,
                    }}
                >
                    {typeLabel}
                </span>
            </div>

            {/* Bottom: Planned Time */}
            <div style={{ fontSize: 11, color: token.colorTextTertiary }}>
                {isWorkingDay
                    ? t('workCalendar.grid.plannedHoursLabel', { hours: plannedTime })
                    : t('workCalendar.grid.plannedOffLabel')}
            </div>
        </div>
    );
};
