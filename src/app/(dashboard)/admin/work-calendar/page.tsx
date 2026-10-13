'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { workCalendarActions } from '@/stores';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
    WorkCalendarHeader,
    WorkCalendarSummary,
    WorkCalendarGrid,
    EditDayModal,
} from '@/features/dashboard/work-calendar';
import { DayType, WorkCalendarDayResponse } from '@/types/WorkCalendar';

export default function WorkCalendarPage() {
    const { t } = useTranslation('common');
    usePageTitle(t('pageTitle.workCalendar', t('workCalendar.header.title')));
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const {
        year,
        month,
        monthData,
        draftDays,
        shiftPatterns,
        selectedDates,
        isEditMode,
        isEditModalOpen,
        isLoading,
        isSaving,
        isResetting,
        isConfirming,
    } = useAppSelector((state) => state.workCalendar);

    // Sync URL params on initial mount
    useEffect(() => {
        const paramYear = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
        const paramMonth = searchParams.get('month')
            ? Number(searchParams.get('month'))
            : undefined;
        if (paramYear || paramMonth) {
            dispatch(
                workCalendarActions.setYearMonth({
                    year: paramYear || dayjs().year(),
                    month: paramMonth || dayjs().month() + 1,
                })
            );
        }
    }, [searchParams, dispatch]);

    // Fetch shift patterns once
    useEffect(() => {
        dispatch(workCalendarActions.fetchShiftPatterns());
    }, [dispatch]);

    // Fetch month calendar data whenever year/month changes
    useEffect(() => {
        dispatch(
            workCalendarActions.fetchMonthCalendar(
                year,
                month,
                t('workCalendar.notifications.fetchError')
            )
        );
    }, [year, month, dispatch, t]);

    // Construct Map for Grid and Modal lookups
    const draftDaysMap = useMemo(() => {
        const map = new Map<string, WorkCalendarDayResponse>();
        Object.values(draftDays).forEach((day) => map.set(day.date, day));
        return map;
    }, [draftDays]);

    const originalDaysMap = useMemo(() => {
        const map = new Map<string, WorkCalendarDayResponse>();
        if (monthData?.days) {
            monthData.days.forEach((day) => map.set(day.date, day));
        }
        return map;
    }, [monthData]);

    // Check if user made any draft changes
    const hasDraftChanges = useMemo(() => {
        if (!isEditMode || !monthData) return false;
        for (const orig of monthData.days) {
            const draft = draftDays[orig.date];
            if (
                draft &&
                (draft.dayType !== orig.dayType ||
                    draft.isWorkingDay !== orig.isWorkingDay ||
                    draft.shiftPatternId !== orig.shiftPatternId)
            ) {
                return true;
            }
        }
        return false;
    }, [isEditMode, monthData, draftDays]);

    const isConfirmed = useMemo(() => Boolean(monthData?.isConfirmed), [monthData]);

    // Handlers
    const handleMonthChange = useCallback(
        (newYear: number, newMonth: number) => {
            dispatch(workCalendarActions.setYearMonth({ year: newYear, month: newMonth }));
        },
        [dispatch]
    );

    const handleEnterEditMode = useCallback(() => {
        dispatch(workCalendarActions.setIsEditMode(true));
    }, [dispatch]);

    const handleCancelEditMode = useCallback(() => {
        dispatch(workCalendarActions.cancelDraftChanges());
    }, [dispatch]);

    const handleEditModalSave = useCallback(
        (
            dates: string[],
            dayType: DayType,
            isWorkingDay: boolean,
            shiftPatternId?: number | null,
            patternCode?: string | null,
            patternName?: string | null
        ) => {
            dispatch(
                workCalendarActions.updateDraftDays({
                    dates,
                    dayType,
                    isWorkingDay,
                    shiftPatternId,
                    patternCode,
                    patternName,
                })
            );
        },
        [dispatch]
    );

    const handleSaveChanges = useCallback(() => {
        dispatch(
            workCalendarActions.saveChanges({
                missingDay: (date) => t('workCalendar.notifications.missingDataError', { date }),
                patternRequired: (date) =>
                    t('workCalendar.errors.patternRequiredDate', {
                        date,
                        defaultValue: `Vui lòng chọn mẫu ca cho ngày làm việc (${date})`,
                    }),
                success: t('workCalendar.notifications.saveSuccess'),
                fallbackError: t('workCalendar.notifications.saveError'),
            })
        );
    }, [dispatch, t]);

    const handleResetToDefault = useCallback(() => {
        dispatch(
            workCalendarActions.resetToDefault({
                success: t('workCalendar.notifications.resetSuccess'),
                fallbackError: t('workCalendar.notifications.resetError'),
            })
        );
    }, [dispatch, t]);

    const handleConfirmMonth = useCallback(() => {
        dispatch(
            workCalendarActions.confirmMonthSchedule({
                success: t('workCalendar.notifications.confirmMonthSuccess', { month, year }),
                fallbackError: t('workCalendar.notifications.confirmMonthError'),
            })
        );
    }, [dispatch, month, year, t]);

    const handleSelectDates = useCallback(
        (dates: string[]) => {
            dispatch(workCalendarActions.setSelectedDates(dates));
        },
        [dispatch]
    );

    const handleOpenEditModal = useCallback(() => {
        dispatch(workCalendarActions.setIsEditModalOpen(true));
    }, [dispatch]);

    const handleCloseEditModal = useCallback(() => {
        dispatch(workCalendarActions.setIsEditModalOpen(false));
    }, [dispatch]);

    const handleClearSelection = useCallback(() => {
        dispatch(workCalendarActions.setSelectedDates([]));
    }, [dispatch]);

    return (
        <div
            style={{
                minHeight: '100%',
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
                onEnterEditMode={handleEnterEditMode}
                onCancelEditMode={handleCancelEditMode}
                onSaveChanges={handleSaveChanges}
                onResetToDefault={handleResetToDefault}
                onConfirmMonth={handleConfirmMonth}
            />

            <WorkCalendarSummary summary={monthData?.summary} loading={isLoading} />

            <WorkCalendarGrid
                year={year}
                month={month}
                daysMap={draftDaysMap}
                originalDaysMap={originalDaysMap}
                isEditMode={isEditMode}
                loading={isLoading}
                selectedDates={selectedDates}
                onMonthChange={handleMonthChange}
                onSelectDates={handleSelectDates}
                onOpenEditModal={handleOpenEditModal}
                onClearSelection={handleClearSelection}
            />

            <EditDayModal
                open={isEditModalOpen}
                selectedDates={selectedDates}
                daysMap={draftDaysMap}
                shiftPatterns={shiftPatterns}
                onClose={handleCloseEditModal}
                onSave={handleEditModalSave}
            />
        </div>
    );
}
