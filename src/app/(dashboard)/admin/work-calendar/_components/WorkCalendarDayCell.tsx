'use client';

import React from 'react';
import { Tag, Tooltip, Checkbox, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { DayType } from '@/types/WorkCalendar';
import { statusColors } from '@/configs/antdTheme';

export interface WorkCalendarDayCellProps {
    dateString: string;
    dayNumber: number;
    dayIndex: number;
    isCurrentMonth: boolean;
    isEditMode: boolean;
    isModified: boolean;
    isSelected: boolean;
    dayType?: DayType;
    isWorkingDay?: boolean;
    isOverride?: boolean;
    plannedTime?: number;
    isMobile?: boolean;
    onCellMouseDown?: (dateString: string, dayIndex: number, e: React.MouseEvent) => void;
    onCellMouseEnter?: (dateString: string, dayIndex: number, e: React.MouseEvent) => void;
}

export const WorkCalendarDayCell = React.memo<WorkCalendarDayCellProps>(
    ({
        dateString,
        dayNumber,
        dayIndex,
        isCurrentMonth,
        isEditMode,
        isModified,
        isSelected,
        dayType = 'WORKING',
        isWorkingDay = true,
        isOverride = false,
        plannedTime = 0,
        isMobile = false,
        onCellMouseDown,
        onCellMouseEnter,
    }) => {
        const { t } = useTranslation('common');
        const { token } = theme.useToken();

        const isDark = token.colorBgContainer !== '#ffffff';
        const sc = isDark ? statusColors.dark : statusColors.light;

        const handleMouseDown = (e: React.MouseEvent) => {
            if (isEditMode && onCellMouseDown) {
                onCellMouseDown(dateString, dayIndex, e);
            }
        };

        const handleMouseEnter = (e: React.MouseEvent) => {
            if (isEditMode && onCellMouseEnter) {
                onCellMouseEnter(dateString, dayIndex, e);
            }
        };

        if (!isCurrentMonth) {
            return (
                <div
                    style={{
                        height: '100%',
                        minHeight: isMobile ? (isEditMode ? 64 : 76) : 84,
                        padding: isMobile ? '4px 3px' : '8px 10px',
                        opacity: 0.35,
                        background: token.colorBgLayout,
                        borderRadius: token.borderRadiusSM,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                    }}
                >
                    <span
                        style={{
                            color: token.colorTextQuaternary,
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: 600,
                        }}
                    >
                        {dayNumber}
                    </span>
                </div>
            );
        }

        let cellBg = sc.runtime.bg;
        let cellBorder = sc.runtime.border;
        let typeLabel = t('workCalendar.dayType.working');
        let typeShortLabel = t('workCalendar.dayType.workingShort');
        let typeColor = sc.runtime.base;

        if (dayType === 'WEEKEND_OFF' || (!isWorkingDay && dayType !== 'HOLIDAY')) {
            cellBg = sc.offline.bg;
            cellBorder = sc.offline.border;
            typeLabel = t('workCalendar.dayType.weekendOff');
            typeShortLabel = t('workCalendar.dayType.weekendOffShort');
            typeColor = sc.offline.base;
        } else if (dayType === 'HOLIDAY') {
            cellBg = sc.error.bg;
            cellBorder = sc.error.border;
            typeLabel = t('workCalendar.dayType.holiday');
            typeShortLabel = t('workCalendar.dayType.holidayShort');
            typeColor = sc.error.base;
        }

        let borderStyle = `1px solid ${cellBorder}`;
        if (isSelected) {
            borderStyle = `2px solid ${token.colorPrimary}`;
        } else if (isModified) {
            borderStyle = `2px dashed ${token.colorPrimary}`;
        }

        const cellContent = (
            <div
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                style={{
                    position: 'relative',
                    height: '100%',
                    flex: 1,
                    minHeight: isMobile ? (isEditMode ? 64 : 72) : 84,
                    padding: isMobile ? '4px 3px' : '8px 10px',
                    background: isSelected ? token.colorPrimaryBg : cellBg,
                    border: borderStyle,
                    borderRadius: token.borderRadiusSM,
                    cursor: isEditMode ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? token.boxShadowSecondary : undefined,
                    overflow: 'hidden',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                {isMobile ? (
                    /* Mobile View: Taller, spacious 3-row layout filling frame */
                    <>
                        {/* Top row: Checkbox, Day Number & Dots */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                lineHeight: 1.1,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                {isEditMode && (
                                    <Checkbox
                                        checked={isSelected}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            pointerEvents: 'none',
                                            transform: 'scale(0.75)',
                                            marginInlineEnd: 0,
                                        }}
                                    />
                                )}
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: isWorkingDay
                                            ? token.colorText
                                            : token.colorTextSecondary,
                                    }}
                                >
                                    {dayNumber}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Draft Modified Indicator Dot */}
                                {isModified && (
                                    <span
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: '50%',
                                            backgroundColor: token.colorPrimary,
                                            display: 'inline-block',
                                        }}
                                    />
                                )}

                                {/* Override Green Dot */}
                                {isOverride && (
                                    <span
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: '50%',
                                            backgroundColor: sc.runtime.base,
                                            display: 'inline-block',
                                            boxShadow: `0 0 3px ${sc.runtime.base}`,
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Middle row: Status label */}
                        <div style={{ textAlign: 'center', margin: '2px 0' }}>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: typeColor,
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2,
                                }}
                            >
                                {typeShortLabel}
                            </span>
                        </div>

                        {/* Bottom row: Planned hours */}
                        <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: isWorkingDay ? typeColor : token.colorTextTertiary,
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2,
                                }}
                            >
                                {isWorkingDay ? `${plannedTime}h` : '—'}
                            </span>
                        </div>
                    </>
                ) : (
                    /* Desktop View: Full detailed cards */
                    <>
                        {/* Top row: Checkbox, Solar Day & Badges */}
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
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: isWorkingDay
                                            ? token.colorText
                                            : token.colorTextSecondary,
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
                                            borderRadius: token.borderRadiusXS,
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
                        <div
                            style={{
                                fontSize: 11,
                                color: token.colorTextTertiary,
                            }}
                        >
                            {isWorkingDay
                                ? t('workCalendar.grid.plannedHoursLabel', { hours: plannedTime })
                                : t('workCalendar.grid.plannedOffLabel')}
                        </div>
                    </>
                )}
            </div>
        );

        if (!isEditMode) {
            const tooltipTitle = `${dateString} (${typeLabel}): ${
                isWorkingDay
                    ? t('workCalendar.grid.plannedHoursLabel', { hours: plannedTime })
                    : t('workCalendar.grid.plannedOffLabel')
            }${isOverride ? ` - ${t('workCalendar.grid.overrideTooltip')}` : ''}`;

            return (
                <Tooltip title={tooltipTitle} mouseEnterDelay={0.5}>
                    {cellContent}
                </Tooltip>
            );
        }

        return cellContent;
    },
    (prevProps, nextProps) => {
        return (
            prevProps.dateString === nextProps.dateString &&
            prevProps.dayNumber === nextProps.dayNumber &&
            prevProps.dayIndex === nextProps.dayIndex &&
            prevProps.isCurrentMonth === nextProps.isCurrentMonth &&
            prevProps.isEditMode === nextProps.isEditMode &&
            prevProps.isModified === nextProps.isModified &&
            prevProps.isSelected === nextProps.isSelected &&
            prevProps.dayType === nextProps.dayType &&
            prevProps.isWorkingDay === nextProps.isWorkingDay &&
            prevProps.isOverride === nextProps.isOverride &&
            prevProps.plannedTime === nextProps.plannedTime &&
            prevProps.isMobile === nextProps.isMobile
        );
    }
);

WorkCalendarDayCell.displayName = 'WorkCalendarDayCell';
