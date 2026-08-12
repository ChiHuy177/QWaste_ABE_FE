'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Space, Button, Typography, Skeleton, Grid, theme } from 'antd';
import {
    EditOutlined,
    ClearOutlined,
    CheckSquareOutlined,
    BorderOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { WorkCalendarDayResponse } from '@/types/WorkCalendar';
import { WorkCalendarDayCell } from './WorkCalendarDayCell';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface GridCellData {
    dateString: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isPast: boolean;
    dayData?: WorkCalendarDayResponse;
    gridIndex: number;
}

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

export const WorkCalendarGrid: React.FC<WorkCalendarGridProps> = ({
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
    const { t, i18n } = useTranslation('common');
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    // Drag-select & Shift-select state
    const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
    const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
    const [lastSelectedGridIndex, setLastSelectedGridIndex] = useState<number | null>(null);

    const todayStart = useMemo(() => dayjs().startOf('day'), []);

    const weekdays = useMemo(() => {
        return i18n.language === 'en'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    }, [i18n.language]);

    // Generate grid items for the full calendar view (including padding days)
    const gridCells = useMemo(() => {
        const firstDayOfMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
        const daysInMonth = firstDayOfMonth.daysInMonth();

        const startDayOfWeek = (firstDayOfMonth.day() + 6) % 7;

        const cells: GridCellData[] = [];
        let indexCounter = 0;

        // 1. Previous month padding days
        const prevMonth = firstDayOfMonth.subtract(1, 'month');
        const prevMonthDays = prevMonth.daysInMonth();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const dateStr = prevMonth.date(dayNum).format('YYYY-MM-DD');
            cells.push({
                dateString: dateStr,
                dayNumber: dayNum,
                isCurrentMonth: false,
                isPast: dayjs(dateStr).isBefore(todayStart),
                gridIndex: indexCounter++,
            });
        }

        // 2. Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                dateString: dateStr,
                dayNumber: d,
                isCurrentMonth: true,
                isPast: dayjs(dateStr).isBefore(todayStart),
                dayData: daysMap.get(dateStr),
                gridIndex: indexCounter++,
            });
        }

        // 3. Next month padding days to complete full rows (multiples of 7)
        const totalCellsSoFar = cells.length;
        const remainder = totalCellsSoFar % 7;
        if (remainder !== 0) {
            const paddingNeeded = 7 - remainder;
            const nextMonth = firstDayOfMonth.add(1, 'month');
            for (let d = 1; d <= paddingNeeded; d++) {
                const dateStr = nextMonth.date(d).format('YYYY-MM-DD');
                cells.push({
                    dateString: dateStr,
                    dayNumber: d,
                    isCurrentMonth: false,
                    isPast: dayjs(dateStr).isBefore(todayStart),
                    gridIndex: indexCounter++,
                });
            }
        }

        return cells;
    }, [year, month, daysMap, todayStart]);

    // All current month date strings that are NOT in the past (editable dates)
    const editableMonthDates = useMemo(() => {
        return gridCells.filter((c) => c.isCurrentMonth && !c.isPast).map((c) => c.dateString);
    }, [gridCells]);

    // Global mouse up listener for drag-select finish
    useEffect(() => {
        const handleMouseUp = () => {
            setIsMouseDown(false);
            setDragStartIndex(null);
        };

        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Selection handlers: Ignore past days!
    const handleCellMouseDown = (cell: GridCellData, e: React.MouseEvent) => {
        if (!isEditMode || !cell.isCurrentMonth || cell.isPast) return;
        if (e.button !== 0) return;

        setIsMouseDown(true);
        setDragStartIndex(cell.gridIndex);

        if (e.shiftKey && lastSelectedGridIndex !== null) {
            const start = Math.min(lastSelectedGridIndex, cell.gridIndex);
            const end = Math.max(lastSelectedGridIndex, cell.gridIndex);

            const rangeDates = gridCells
                .slice(start, end + 1)
                .filter((c) => c.isCurrentMonth && !c.isPast)
                .map((c) => c.dateString);

            onSelectDates(Array.from(new Set([...selectedDates, ...rangeDates])));
        } else {
            const isAlreadySelected = selectedDates.includes(cell.dateString);
            if (isAlreadySelected) {
                onSelectDates(selectedDates.filter((d) => d !== cell.dateString));
            } else {
                onSelectDates([...selectedDates, cell.dateString]);
            }
            setLastSelectedGridIndex(cell.gridIndex);
        }
    };

    const handleCellMouseEnter = (cell: GridCellData) => {
        if (!isEditMode || !isMouseDown || dragStartIndex === null || !cell.isCurrentMonth || cell.isPast) return;

        const start = Math.min(dragStartIndex, cell.gridIndex);
        const end = Math.max(dragStartIndex, cell.gridIndex);

        const rangeDates = gridCells
            .slice(start, end + 1)
            .filter((c) => c.isCurrentMonth && !c.isPast)
            .map((c) => c.dateString);

        onSelectDates(Array.from(new Set([...selectedDates, ...rangeDates])));
    };

    const handleSelectAll = () => {
        onSelectDates(editableMonthDates);
    };

    const isAllSelected =
        selectedDates.length === editableMonthDates.length && editableMonthDates.length > 0;

    // Render Skeleton Grid when loading
    if (loading) {
        return (
            <Card
                variant="borderless"
                style={{
                    borderRadius: 12,
                    boxShadow: token.boxShadow,
                }}
                styles={{ body: { padding: isMobile ? 12 : 20 } }}
            >
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ minWidth: 680 }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 8,
                                marginBottom: 12,
                                textAlign: 'center',
                            }}
                        >
                            {weekdays.map((day, idx) => (
                                <div
                                    key={day}
                                    style={{
                                        padding: '8px 0',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color:
                                            idx === 6 ? token.colorError : token.colorTextSecondary,
                                        background: token.colorBgLayout,
                                        borderRadius: 6,
                                    }}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 8,
                            }}
                        >
                            {Array.from({ length: 35 }).map((_, idx) => (
                                <Skeleton.Button
                                    key={idx}
                                    active
                                    style={{
                                        width: '100%',
                                        height: 95,
                                        borderRadius: 8,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 12,
                boxShadow: token.boxShadow,
            }}
            styles={{ body: { padding: isMobile ? 12 : 20 } }}
        >
            {/* Edit mode selection toolbar */}
            {isEditMode && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        marginBottom: 16,
                        padding: '10px 16px',
                        background: token.colorBgLayout,
                        borderRadius: 8,
                        border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    <div>
                        <Text strong style={{ color: token.colorPrimary }}>
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

            {/* Scrollable Container for Mobile responsiveness */}
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: 680 }}>
                    {/* Calendar Grid Header (Weekdays) */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 8,
                            marginBottom: 12,
                            textAlign: 'center',
                        }}
                    >
                        {weekdays.map((day, idx) => (
                            <div
                                key={day}
                                style={{
                                    padding: '8px 0',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color:
                                        idx === 6 ? token.colorError : token.colorTextSecondary,
                                    background: token.colorBgLayout,
                                    borderRadius: 6,
                                }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 8,
                        }}
                    >
                        {gridCells.map((cell) => {
                            const orig = originalDaysMap.get(cell.dateString);
                            const curr = cell.dayData;

                            const isModified = Boolean(
                                curr &&
                                orig &&
                                (curr.dayType !== orig.dayType ||
                                    curr.isWorkingDay !== orig.isWorkingDay)
                            );

                            const isSelected = selectedDates.includes(cell.dateString);

                            return (
                                <div key={cell.dateString}>
                                    <WorkCalendarDayCell
                                        dayData={cell.dayData}
                                        dateString={cell.dateString}
                                        dayNumber={cell.dayNumber}
                                        isCurrentMonth={cell.isCurrentMonth}
                                        isEditMode={isEditMode}
                                        isModified={isModified}
                                        isSelected={isSelected}
                                        onMouseDown={(e) => handleCellMouseDown(cell, e)}
                                        onMouseEnter={() => handleCellMouseEnter(cell)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};
