'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Grid } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
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

/**
 * Helper to construct Map<string, WorkCalendarDayResponse> from array
 */
const createDaysMap = (days: WorkCalendarDayResponse[]): Map<string, WorkCalendarDayResponse> => {
    const map = new Map<string, WorkCalendarDayResponse>();
    days.forEach((day) => map.set(day.date, { ...day }));
    return map;
};

/**
 * Helper to extract clean error message
 */
const getErrorMessage = (err: any, fallbackMessage: string): string => {
    return err?.response?.data?.message || err?.message || fallbackMessage;
};

export default function WorkCalendarPage() {
    const { t } = useTranslation('common');
    const searchParams = useSearchParams();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const now = useMemo(() => dayjs(), []);
    const initialYear = searchParams.get('year') ? Number(searchParams.get('year')) : now.year();
    const initialMonth = searchParams.get('month')
        ? Number(searchParams.get('month'))
        : now.month() + 1;

    const [year, setYear] = useState<number>(initialYear);
    const [month, setMonth] = useState<number>(initialMonth);

    const [loading, setLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isResetting, setIsResetting] = useState<boolean>(false);
    const [isConfirming, setIsConfirming] = useState<boolean>(false);
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
                setDraftDaysMap(createDaysMap(data.days));
            } catch (err: any) {
                toast.error(getErrorMessage(err, t('workCalendar.notifications.fetchError')));
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
        if (!monthData) return new Map<string, WorkCalendarDayResponse>();
        return createDaysMap(monthData.days);
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

    // Check confirmation status from API response
    const isConfirmed = useMemo(() => {
        if (!monthData) return false;
        const res = monthData as any;
        const sum = monthData.summary as any;
        return Boolean(
            res.isConfirmed ||
            res.confirmed ||
            res.isLocked ||
            res.locked ||
            res.status === 'CONFIRMED' ||
            res.status === 'LOCKED' ||
            sum?.isConfirmed ||
            sum?.confirmed ||
            sum?.isLocked ||
            sum?.locked ||
            sum?.status === 'CONFIRMED' ||
            sum?.status === 'LOCKED'
        );
    }, [monthData]);

    // Handlers
    const handleMonthChange = useCallback((newYear: number, newMonth: number) => {
        setIsEditMode(false);
        setSelectedDates([]);
        setYear(newYear);
        setMonth(newMonth);
    }, []);

    const handleEnterEditMode = useCallback(() => {
        setIsEditMode(true);
    }, []);

    const handleCancelEditMode = useCallback(() => {
        setIsEditMode(false);
        setSelectedDates([]);
        if (monthData) {
            setDraftDaysMap(createDaysMap(monthData.days));
        }
    }, [monthData]);

    const handleEditModalSave = useCallback(
        (dates: string[], dayType: DayType, isWorkingDay: boolean) => {
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
            toast.success(
                t('workCalendar.notifications.bulkUpdateSuccess', { count: dates.length })
            );
        },
        [t]
    );

    const handleSaveChanges = useCallback(async () => {
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
            setDraftDaysMap(createDaysMap(updated.days));

            setIsEditMode(false);
            setSelectedDates([]);
            toast.success(t('workCalendar.notifications.saveSuccess'));
        } catch (err: any) {
            toast.error(getErrorMessage(err, t('workCalendar.notifications.saveError')));
        } finally {
            setIsSaving(false);
        }
    }, [monthData, year, month, draftDaysMap, t]);

    const handleResetToDefault = useCallback(async () => {
        setIsResetting(true);
        try {
            const resetData = await WorkCalendarService.resetMonthCalendar(year, month);
            setMonthData(resetData);
            setDraftDaysMap(createDaysMap(resetData.days));

            setIsEditMode(false);
            setSelectedDates([]);
            toast.success(t('workCalendar.notifications.resetSuccess'));
        } catch (err: any) {
            toast.error(getErrorMessage(err, t('workCalendar.notifications.resetError')));
        } finally {
            setIsResetting(false);
        }
    }, [year, month, t]);

    const handleConfirmMonth = useCallback(async () => {
        setIsConfirming(true);
        try {
            const confirmedData = await WorkCalendarService.confirmMonth(year, month);
            if (confirmedData && confirmedData.days && confirmedData.days.length > 0) {
                setMonthData(confirmedData);
            } else {
                setMonthData((prev) =>
                    prev
                        ? {
                              ...prev,
                              isConfirmed: true,
                              confirmed: true,
                              summary: { ...prev.summary, isConfirmed: true, confirmed: true },
                          }
                        : confirmedData
                );
            }
            toast.success(t('workCalendar.notifications.confirmMonthSuccess', { month, year }));
        } catch (err: any) {
            toast.error(getErrorMessage(err, t('workCalendar.notifications.confirmMonthError')));
        } finally {
            setIsConfirming(false);
        }
    }, [year, month, t]);

    const handleSelectDates = useCallback((dates: string[]) => {
        setSelectedDates(dates);
    }, []);

    const handleOpenEditModal = useCallback(() => {
        setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedDates([]);
    }, []);

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
                isConfirmed={isConfirmed}
                isEditMode={isEditMode}
                isSaving={isSaving}
                isResetting={isResetting}
                isConfirming={isConfirming}
                hasDraftChanges={hasDraftChanges}
                onMonthChange={handleMonthChange}
                onEnterEditMode={handleEnterEditMode}
                onCancelEditMode={handleCancelEditMode}
                onSaveChanges={handleSaveChanges}
                onResetToDefault={handleResetToDefault}
                onConfirmMonth={handleConfirmMonth}
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
                onSelectDates={handleSelectDates}
                onOpenEditModal={handleOpenEditModal}
                onClearSelection={handleClearSelection}
            />

            {/* Single Unified Edit Modal */}
            <EditDayModal
                open={isEditModalOpen}
                selectedDates={selectedDates}
                daysMap={draftDaysMap}
                onClose={handleCloseEditModal}
                onSave={handleEditModalSave}
            />
        </div>
    );
}
