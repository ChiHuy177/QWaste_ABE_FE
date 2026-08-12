'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Grid } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    WorkCalendarMonthResponse,
    WorkCalendarDayResponse,
    WorkCalendarDayUpdationRequest,
    DayType,
} from '@/types/WorkCalendar';
import { WorkCalendarService } from '@/services/WorkCalendarService';
import { WorkCalendarHeader } from './_components/WorkCalendarHeader';
import { WorkCalendarSummary } from './_components/WorkCalendarSummary';
import { WorkCalendarGrid } from './_components/WorkCalendarGrid';
import { EditDayModal } from './_components/EditDayModal';

const { useBreakpoint } = Grid;

export default function WorkCalendarPage() {
    const { t } = useTranslation('common');
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const now = useMemo(() => dayjs(), []);
    const [year, setYear] = useState<number>(now.year());
    const [month, setMonth] = useState<number>(now.month() + 1);

    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isResetting, setIsResetting] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    const [monthData, setMonthData] = useState<WorkCalendarMonthResponse | null>(null);
    const [draftDaysMap, setDraftDaysMap] = useState<Map<string, WorkCalendarDayResponse>>(
        new Map()
    );

    // Bulk selection state & Modal state
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

    // Fetch month calendar data
    const fetchCalendar = useCallback(
        async (targetYear: number, targetMonth: number) => {
            setLoading(true);
            try {
                const data = await WorkCalendarService.getMonthCalendar(targetYear, targetMonth);
                setMonthData(data);

                // Initialize draft days map
                const newMap = new Map<string, WorkCalendarDayResponse>();
                data.days.forEach((day) => {
                    newMap.set(day.date, { ...day });
                });
                setDraftDaysMap(newMap);
            } catch (err: any) {
                const errMsg =
                    err?.response?.data?.message ||
                    err?.message ||
                    t('workCalendar.notifications.fetchError');
                toast.error(errMsg);
            } finally {
                setLoading(false);
            }
        },
        [t]
    );

    useEffect(() => {
        fetchCalendar(year, month);
    }, [year, month, fetchCalendar]);

    // Original days map for diffing
    const originalDaysMap = useMemo(() => {
        const map = new Map<string, WorkCalendarDayResponse>();
        if (monthData) {
            monthData.days.forEach((day) => map.set(day.date, day));
        }
        return map;
    }, [monthData]);

    // Check if user made any draft changes
    const hasDraftChanges = useMemo(() => {
        if (!isEditMode || !monthData) return false;
        for (const orig of monthData.days) {
            const draft = draftDaysMap.get(orig.date);
            if (
                draft &&
                (draft.dayType !== orig.dayType || draft.isWorkingDay !== orig.isWorkingDay)
            ) {
                return true;
            }
        }
        return false;
    }, [isEditMode, monthData, draftDaysMap]);

    // Handlers
    const handleMonthChange = (newYear: number, newMonth: number) => {
        setIsEditMode(false);
        setSelectedDates([]);
        setYear(newYear);
        setMonth(newMonth);
    };

    const handleEnterEditMode = () => {
        setIsEditMode(true);
    };

    const handleCancelEditMode = () => {
        setIsEditMode(false);
        setSelectedDates([]);

        // Reset draft map to original
        if (monthData) {
            const resetMap = new Map<string, WorkCalendarDayResponse>();
            monthData.days.forEach((d) => resetMap.set(d.date, { ...d }));
            setDraftDaysMap(resetMap);
        }
    };

    const handleEditModalSave = (
        dates: string[],
        dayType: DayType,
        isWorkingDay: boolean
    ) => {
        setDraftDaysMap((prev) => {
            const next = new Map(prev);
            dates.forEach((date) => {
                const current = next.get(date);
                if (current) {
                    next.set(date, {
                        ...current,
                        dayType,
                        isWorkingDay,
                        plannedTime: isWorkingDay ? current.plannedTime || 22.5 : 0.0,
                    });
                }
            });
            return next;
        });
        setSelectedDates([]);
        toast.success(t('workCalendar.notifications.bulkUpdateSuccess', { count: dates.length }));
    };

    const handleSaveChanges = async () => {
        if (!monthData) return;

        // Client-side validation: Ensure payload has ALL 28-31 days of the month
        const payload: WorkCalendarDayUpdationRequest[] = [];
        const daysInMonthCount = dayjs(
            `${year}-${String(month).padStart(2, '0')}-01`
        ).daysInMonth();

        for (let d = 1; d <= daysInMonthCount; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayDraft = draftDaysMap.get(dateStr);
            if (!dayDraft) {
                toast.error(t('workCalendar.notifications.missingDataError', { date: dateStr }));
                return;
            }
            payload.push({
                date: dayDraft.date,
                dayType: dayDraft.dayType,
                isWorkingDay: dayDraft.isWorkingDay,
            });
        }

        setIsSaving(true);
        try {
            const updated = await WorkCalendarService.batchUpdateCalendar(payload);
            setMonthData(updated);

            const newMap = new Map<string, WorkCalendarDayResponse>();
            updated.days.forEach((day) => newMap.set(day.date, { ...day }));
            setDraftDaysMap(newMap);

            setIsEditMode(false);
            setSelectedDates([]);
            toast.success(t('workCalendar.notifications.saveSuccess'));
        } catch (err: any) {
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                t('workCalendar.notifications.saveError');
            toast.error(errMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetToDefault = async () => {
        setIsResetting(true);
        try {
            const resetData = await WorkCalendarService.resetMonthCalendar(year, month);
            setMonthData(resetData);

            const newMap = new Map<string, WorkCalendarDayResponse>();
            resetData.days.forEach((day) => newMap.set(day.date, { ...day }));
            setDraftDaysMap(newMap);

            setIsEditMode(false);
            setSelectedDates([]);
            toast.success(t('workCalendar.notifications.resetSuccess'));
        } catch (err: any) {
            const errMsg =
                err?.response?.data?.message ||
                err?.message ||
                t('workCalendar.notifications.resetError');
            toast.error(errMsg);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div
            style={{
                height: isMobile ? 'auto' : '100%',
                minHeight: 0,
                overflow: isMobile ? 'visible' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                padding: 0,
            }}
        >
            <WorkCalendarHeader
                year={year}
                month={month}
                isEditMode={isEditMode}
                isSaving={isSaving}
                isResetting={isResetting}
                hasDraftChanges={hasDraftChanges}
                onMonthChange={handleMonthChange}
                onEnterEditMode={handleEnterEditMode}
                onCancelEditMode={handleCancelEditMode}
                onSaveChanges={handleSaveChanges}
                onResetToDefault={handleResetToDefault}
            />

            <WorkCalendarSummary summary={monthData?.summary} loading={loading} />

            <WorkCalendarGrid
                year={year}
                month={month}
                daysMap={draftDaysMap}
                originalDaysMap={originalDaysMap}
                isEditMode={isEditMode}
                loading={loading}
                selectedDates={selectedDates}
                onSelectDates={(dates) => setSelectedDates(dates)}
                onOpenEditModal={() => setIsEditModalOpen(true)}
                onClearSelection={() => setSelectedDates([])}
            />

            {/* Single Unified Edit Modal */}
            <EditDayModal
                open={isEditModalOpen}
                selectedDates={selectedDates}
                daysMap={draftDaysMap}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditModalSave}
            />
        </div>
    );
}
