'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, Space, Button, Typography, Skeleton, Grid, Calendar, theme } from 'antd';
import {
    EditOutlined,
    ClearOutlined,
    CheckSquareOutlined,
    BorderOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { WorkCalendarDayResponse } from '@/types/WorkCalendar';
import { WorkCalendarDayCell } from './WorkCalendarDayCell';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface WorkCalendarGridProps {
    year: number;
    month: number;
    daysMap: Map<string, WorkCalendarDayResponse>;
    originalDaysMap: Map<string, WorkCalendarDayResponse>;
    isEditMode: boolean;
    loading?: boolean;
    selectedDates: string[];
    onSelectDates: (dateStrings: string[]) => void;
    onOpenEditModal: () => void;
    onClearSelection: () => void;
}

export const WorkCalendarGrid: React.FC<WorkCalendarGridProps> = React.memo(
    ({
        year,
        month,
        daysMap,
        originalDaysMap,
        isEditMode,
        loading = false,
        selectedDates,
        onSelectDates,
        onOpenEditModal,
        onClearSelection,
    }) => {
        const { t } = useTranslation('common');
        const { token } = theme.useToken();
        const screens = useBreakpoint();
        const isMobile = !screens.md;

        // Drag-select & Shift-select state
        const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
        const [dragStartDayIndex, setDragStartDayIndex] = useState<number | null>(null);
        const [dragMode, setDragMode] = useState<'ADD' | 'REMOVE'>('ADD');
        const [selectionBeforeDrag, setSelectionBeforeDrag] = useState<string[]>([]);
        const [lastSelectedDayIndex, setLastSelectedDayIndex] = useState<number | null>(null);

        // Keep state ref updated to allow 100% stable mouse callbacks
        const stateRef = useRef({
            isEditMode,
            isMouseDown,
            dragStartDayIndex,
            dragMode,
            selectionBeforeDrag,
            lastSelectedDayIndex,
            year,
            month,
            selectedDates,
            onSelectDates,
        });

        useEffect(() => {
            stateRef.current = {
                isEditMode,
                isMouseDown,
                dragStartDayIndex,
                dragMode,
                selectionBeforeDrag,
                lastSelectedDayIndex,
                year,
                month,
                selectedDates,
                onSelectDates,
            };
        });

        // Global mouseup listener so drag selection ends cleanly anywhere on window
        useEffect(() => {
            const handleMouseUp = () => {
                setIsMouseDown(false);
                setDragStartDayIndex(null);
            };
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }, []);

        // Current Month Value for Antd Calendar
        const calendarValue = useMemo(() => {
            return dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
        }, [year, month]);

        // Fast O(1) Set lookup for selection
        const selectedDatesSet = useMemo(() => new Set(selectedDates), [selectedDates]);

        // Editable dates in current month
        const editableMonthDates = useMemo(() => {
            const daysInMonth = calendarValue.daysInMonth();
            const dates: string[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
                dates.push(
                    `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                );
            }
            return dates;
        }, [year, month, calendarValue]);

        // 100% Stable Drag / Click handlers for Date Cells
        const handleCellMouseDown = useCallback(
            (dateStr: string, dayIndex: number, e: React.MouseEvent) => {
                const {
                    isEditMode: editMode,
                    lastSelectedDayIndex: lastIndex,
                    year: curYear,
                    month: curMonth,
                    selectedDates: curSelected,
                    onSelectDates: triggerSelect,
                } = stateRef.current;

                if (!editMode) return;
                if (e.button !== 0) return;

                setIsMouseDown(true);
                setDragStartDayIndex(dayIndex);

                if (e.shiftKey && lastIndex !== null) {
                    const start = Math.min(lastIndex, dayIndex);
                    const end = Math.max(lastIndex, dayIndex);

                    const rangeDates: string[] = [];
                    for (let i = start; i <= end; i++) {
                        const dNum = i + 1;
                        rangeDates.push(
                            `${curYear}-${String(curMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`
                        );
                    }
                    const combined = Array.from(new Set([...curSelected, ...rangeDates]));
                    triggerSelect(combined);
                    setSelectionBeforeDrag(combined);
                } else {
                    const isAlreadySelected = curSelected.includes(dateStr);
                    const mode = isAlreadySelected ? 'REMOVE' : 'ADD';
                    setDragMode(mode);
                    setSelectionBeforeDrag(curSelected);

                    let nextSelected: string[];
                    if (mode === 'ADD') {
                        nextSelected = Array.from(new Set([...curSelected, dateStr]));
                    } else {
                        nextSelected = curSelected.filter((d) => d !== dateStr);
                    }
                    triggerSelect(nextSelected);
                    setLastSelectedDayIndex(dayIndex);
                }
            },
            []
        );

        const handleCellMouseEnter = useCallback((dateStr: string, dayIndex: number) => {
            const {
                isEditMode: editMode,
                isMouseDown: mouseDown,
                dragStartDayIndex: dragStart,
                dragMode: mode,
                selectionBeforeDrag: snapshot,
                year: curYear,
                month: curMonth,
                onSelectDates: triggerSelect,
            } = stateRef.current;

            if (!editMode || !mouseDown || dragStart === null) return;

            const start = Math.min(dragStart, dayIndex);
            const end = Math.max(dragStart, dayIndex);

            const dragRangeSet = new Set<string>();
            for (let i = start; i <= end; i++) {
                const dNum = i + 1;
                dragRangeSet.add(
                    `${curYear}-${String(curMonth).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`
                );
            }

            if (mode === 'ADD') {
                const result = Array.from(new Set([...snapshot, ...dragRangeSet]));
                triggerSelect(result);
            } else {
                const result = snapshot.filter((date) => !dragRangeSet.has(date));
                triggerSelect(result);
            }
        }, []);

        const handleSelectAll = useCallback(() => {
            onSelectDates(editableMonthDates);
        }, [editableMonthDates, onSelectDates]);

        const isAllSelected =
            selectedDates.length === editableMonthDates.length && editableMonthDates.length > 0;

        // Full Cell Render for Antd Calendar Component
        const fullCellRender = useCallback(
            (current: Dayjs, info: { type: string }) => {
                if (info.type !== 'date') return null;

                const dateStr = current.format('YYYY-MM-DD');
                const isCurrentMonth = current.month() === month - 1 && current.year() === year;

                const dayData = isCurrentMonth ? daysMap.get(dateStr) : undefined;
                const orig = isCurrentMonth ? originalDaysMap.get(dateStr) : undefined;

                const isModified = Boolean(
                    dayData &&
                    orig &&
                    (dayData.dayType !== orig.dayType || dayData.isWorkingDay !== orig.isWorkingDay)
                );
                const isSelected = selectedDatesSet.has(dateStr);
                const dayIndex = current.date() - 1;

                return (
                    <WorkCalendarDayCell
                        dateString={dateStr}
                        dayNumber={current.date()}
                        dayIndex={dayIndex}
                        isCurrentMonth={isCurrentMonth}
                        isEditMode={isEditMode}
                        isModified={isModified}
                        isSelected={isSelected}
                        dayType={dayData?.dayType}
                        isWorkingDay={dayData?.isWorkingDay}
                        isOverride={dayData?.isOverride}
                        plannedTime={dayData?.plannedTime}
                        isMobile={isMobile}
                        onCellMouseDown={handleCellMouseDown}
                        onCellMouseEnter={handleCellMouseEnter}
                    />
                );
            },
            [
                month,
                year,
                daysMap,
                originalDaysMap,
                selectedDatesSet,
                isEditMode,
                isMobile,
                handleCellMouseDown,
                handleCellMouseEnter,
            ]
        );

        if (loading) {
            return (
                <Card
                    variant="borderless"
                    style={{
                        borderRadius: token.borderRadiusLG,
                        boxShadow: token.boxShadow,
                    }}
                    styles={{ body: { padding: isMobile ? '8px 4px' : 20 } }}
                >
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
            );
        }

        return (
            <Card
                variant="borderless"
                style={{
                    borderRadius: token.borderRadiusLG,
                    boxShadow: token.boxShadow,
                }}
                styles={{ body: { padding: isMobile ? '8px 4px' : 20 } }}
            >
                {/* Edit mode selection toolbar */}
                {isEditMode && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 12,
                            padding: isMobile ? '8px 10px' : '10px 16px',
                            background: token.colorBgLayout,
                            borderRadius: token.borderRadius,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        <div>
                            <Text
                                strong
                                style={{ color: token.colorPrimary, fontSize: isMobile ? 12 : 14 }}
                            >
                                {selectedDates.length > 0
                                    ? t('workCalendar.grid.selectedCount', {
                                          count: selectedDates.length,
                                      })
                                    : t('workCalendar.grid.selectTip')}
                            </Text>
                        </div>

                        <Space size="small" wrap>
                            {isAllSelected ? (
                                <Button
                                    size="small"
                                    icon={<BorderOutlined />}
                                    onClick={onClearSelection}
                                >
                                    {t('workCalendar.grid.btnClearSelection')}
                                </Button>
                            ) : (
                                <Button
                                    size="small"
                                    icon={<CheckSquareOutlined />}
                                    onClick={handleSelectAll}
                                    disabled={editableMonthDates.length === 0}
                                >
                                    {t('workCalendar.grid.btnSelectAll', {
                                        count: editableMonthDates.length,
                                    })}
                                </Button>
                            )}

                            {selectedDates.length > 0 && (
                                <>
                                    <Button
                                        size="small"
                                        icon={<ClearOutlined />}
                                        onClick={onClearSelection}
                                    >
                                        {t('workCalendar.grid.btnClearSelection')}
                                    </Button>

                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={onOpenEditModal}
                                    >
                                        {t('workCalendar.grid.btnBulkEdit', {
                                            count: selectedDates.length,
                                        })}
                                    </Button>
                                </>
                            )}
                        </Space>
                    </div>
                )}

                {/* Ant Design Built-in Calendar Component */}
                <div className="qwaste-work-calendar-wrapper">
                    <style jsx global>{`
                        .qwaste-work-calendar-wrapper .ant-picker-calendar-date {
                            margin: 0 !important;
                            padding: 2px !important;
                            height: 100% !important;
                        }
                        .qwaste-work-calendar-wrapper .ant-picker-cell-inner {
                            min-height: 94px !important;
                        }
                        .qwaste-work-calendar-wrapper .ant-picker-calendar-date-content {
                            height: 100% !important;
                        }
                        .qwaste-work-calendar-wrapper .ant-picker-cell {
                            padding: 3px !important;
                        }
                        @media (max-width: 767px) {
                            .qwaste-work-calendar-wrapper .ant-picker-cell-inner {
                                min-height: 54px !important;
                            }
                            .qwaste-work-calendar-wrapper .ant-picker-cell {
                                padding: 1px !important;
                            }
                            .qwaste-work-calendar-wrapper .ant-picker-calendar-date {
                                padding: 0 !important;
                            }
                            .qwaste-work-calendar-wrapper .ant-picker-content th {
                                padding: 4px 0 !important;
                                font-size: 11px !important;
                            }
                        }
                    `}</style>
                    <Calendar
                        value={calendarValue}
                        headerRender={() => null}
                        fullCellRender={fullCellRender}
                    />
                </div>
            </Card>
        );
    }
);

WorkCalendarGrid.displayName = 'WorkCalendarGrid';
