import { WorkCalendarService, ShiftPatternService } from '@/services';
import {
    WorkCalendarMonthResponse,
    WorkCalendarDayResponse,
    WorkCalendarDayUpdationRequest,
    DayType,
} from '@/types/WorkCalendar';
import { ShiftPatternForPicking } from '@/types/ShiftPattern';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from './configureStore';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/apiError';
import dayjs from 'dayjs';

export interface IWorkCalendarStoreState {
    year: number;
    month: number;
    monthData: WorkCalendarMonthResponse | null;
    draftDays: Record<string, WorkCalendarDayResponse>;
    shiftPatterns: ShiftPatternForPicking[];
    selectedDates: string[];
    isEditMode: boolean;
    isEditModalOpen: boolean;
    isLoading: boolean;
    isLoadingPatterns: boolean;
    isSaving: boolean;
    isResetting: boolean;
    isConfirming: boolean;
    error: string | null;
}

const initialState: IWorkCalendarStoreState = {
    year: dayjs().year(),
    month: dayjs().month() + 1,
    monthData: null,
    draftDays: {},
    shiftPatterns: [],
    selectedDates: [],
    isEditMode: false,
    isEditModalOpen: false,
    isLoading: false,
    isLoadingPatterns: false,
    isSaving: false,
    isResetting: false,
    isConfirming: false,
    error: null,
};

const slice = createSlice({
    name: 'workCalendar',
    initialState,
    reducers: {
        setYearMonth: (state, action: PayloadAction<{ year: number; month: number }>) => {
            if (
                state.year === action.payload.year &&
                state.month === action.payload.month &&
                state.monthData !== null
            ) {
                return;
            }
            state.year = action.payload.year;
            state.month = action.payload.month;
            state.monthData = null;
            state.draftDays = {};
            state.isEditMode = false;
            state.selectedDates = [];
        },

        setMonthData: (state, action: PayloadAction<WorkCalendarMonthResponse | null>) => {
            state.monthData = action.payload;
            state.draftDays = {};
            if (action.payload?.days) {
                action.payload.days.forEach((day) => {
                    state.draftDays[day.date] = { ...day };
                });
            }
        },

        setShiftPatterns: (state, action: PayloadAction<ShiftPatternForPicking[]>) => {
            state.shiftPatterns = action.payload;
        },

        setSelectedDates: (state, action: PayloadAction<string[]>) => {
            state.selectedDates = action.payload;
        },

        setIsEditMode: (state, action: PayloadAction<boolean>) => {
            state.isEditMode = action.payload;
            if (!action.payload) {
                state.selectedDates = [];
            }
        },

        setIsEditModalOpen: (state, action: PayloadAction<boolean>) => {
            state.isEditModalOpen = action.payload;
        },

        updateDraftDays: (
            state,
            action: PayloadAction<{
                dates: string[];
                dayType: DayType;
                isWorkingDay: boolean;
                shiftPatternId?: number | null;
                patternCode?: string | null;
                patternName?: string | null;
                plannedTime?: number;
            }>
        ) => {
            const {
                dates,
                dayType,
                isWorkingDay,
                shiftPatternId,
                patternCode,
                patternName,
                plannedTime: explicitPlannedTime,
            } = action.payload;

            // Pattern hours lookup from current monthData
            const patternHoursMap = new Map<number, number>();
            if (state.monthData?.days) {
                state.monthData.days.forEach((d) => {
                    if (
                        d.shiftPatternId &&
                        d.isWorkingDay &&
                        d.plannedTime > 0 &&
                        !patternHoursMap.has(d.shiftPatternId)
                    ) {
                        patternHoursMap.set(d.shiftPatternId, d.plannedTime);
                    }
                });
            }

            dates.forEach((date) => {
                const current = state.draftDays[date];
                if (current) {
                    let calculatedPlannedTime = 0;
                    if (isWorkingDay) {
                        if (explicitPlannedTime !== undefined) {
                            calculatedPlannedTime = explicitPlannedTime;
                        } else if (shiftPatternId && patternHoursMap.has(shiftPatternId)) {
                            calculatedPlannedTime = patternHoursMap.get(shiftPatternId)!;
                        } else if (
                            current.shiftPatternId === shiftPatternId &&
                            current.plannedTime > 0
                        ) {
                            calculatedPlannedTime = current.plannedTime;
                        } else {
                            calculatedPlannedTime = 8.0;
                        }
                    }

                    state.draftDays[date] = {
                        ...current,
                        dayType,
                        isWorkingDay,
                        shiftPatternId: isWorkingDay ? shiftPatternId : null,
                        patternCode: isWorkingDay ? patternCode : null,
                        patternName: isWorkingDay ? patternName : null,
                        plannedTime: calculatedPlannedTime,
                    };
                }
            });
            state.selectedDates = [];
        },

        cancelDraftChanges: (state) => {
            state.isEditMode = false;
            state.selectedDates = [];
            if (state.monthData?.days) {
                state.draftDays = {};
                state.monthData.days.forEach((day) => {
                    state.draftDays[day.date] = { ...day };
                });
            }
        },

        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        setIsLoadingPatterns: (state, action: PayloadAction<boolean>) => {
            state.isLoadingPatterns = action.payload;
        },

        setIsSaving: (state, action: PayloadAction<boolean>) => {
            state.isSaving = action.payload;
        },

        setIsResetting: (state, action: PayloadAction<boolean>) => {
            state.isResetting = action.payload;
        },

        setIsConfirming: (state, action: PayloadAction<boolean>) => {
            state.isConfirming = action.payload;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        resetWorkCalendar: () => initialState,
    },
});

export const { reducer } = slice;

export const workCalendarActions = {
    /**
     * Fetch month calendar data from backend
     */
    fetchMonthCalendar:
        (
            year: number,
            month: number,
            fallbackErrorMessage = 'Không thể tải dữ liệu lịch làm việc.'
        ) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            dispatch(slice.actions.setIsLoading(true));
            dispatch(slice.actions.setError(null));

            try {
                const data = await WorkCalendarService.getMonthCalendar(
                    year,
                    month,
                    'fetch_work_calendar'
                );
                const currentState = getState().workCalendar;
                if (currentState.year === year && currentState.month === month) {
                    dispatch(slice.actions.setMonthData(data));
                }
                return { success: true, data };
            } catch (err: unknown) {
                const isCanceled =
                    (err as { name?: string; code?: string })?.name === 'CanceledError' ||
                    (err as { code?: string })?.code === 'ERR_CANCELED';
                if (isCanceled) {
                    return { success: false, error: 'canceled' };
                }
                const message = getApiErrorMessage(err, fallbackErrorMessage);
                dispatch(slice.actions.setError(message));
                toast.error(message);
                return { success: false, error: message };
            } finally {
                const currentState = getState().workCalendar;
                if (currentState.year === year && currentState.month === month) {
                    dispatch(slice.actions.setIsLoading(false));
                }
            }
        },

    /**
     * Fetch shift patterns for picking dropdown
     */
    fetchShiftPatterns: () => async (dispatch: AppDispatch) => {
        dispatch(slice.actions.setIsLoadingPatterns(true));
        try {
            const patterns = await ShiftPatternService.getShiftPatternsForPicking();
            dispatch(slice.actions.setShiftPatterns(patterns));
            return { success: true, data: patterns };
        } catch {
            return { success: false };
        } finally {
            dispatch(slice.actions.setIsLoadingPatterns(false));
        }
    },

    /**
     * Save draft calendar modifications with validation
     */
    saveChanges:
        (messages?: {
            missingDay?: (date: string) => string;
            patternRequired?: (date: string) => string;
            success?: string;
            fallbackError?: string;
        }) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            const { year, month, monthData, draftDays } = getState().workCalendar;
            if (!monthData) return { success: false, error: 'No month data' };

            const daysInMonthCount = dayjs(
                `${year}-${String(month).padStart(2, '0')}-01`
            ).daysInMonth();
            const payload: WorkCalendarDayUpdationRequest[] = [];

            for (let d = 1; d <= daysInMonthCount; d++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayDraft = draftDays[dateStr];

                if (!dayDraft) {
                    const errorMsg = messages?.missingDay
                        ? messages.missingDay(dateStr)
                        : `Dữ liệu thiếu ngày ${dateStr}. Vui lòng kiểm tra lại.`;
                    toast.error(errorMsg);
                    return { success: false, error: errorMsg };
                }

                // Client validation 1806: shiftPatternId required when isWorkingDay === true
                if (dayDraft.isWorkingDay && !dayDraft.shiftPatternId) {
                    const errorMsg = messages?.patternRequired
                        ? messages.patternRequired(dateStr)
                        : `Vui lòng chọn mẫu ca cho ngày làm việc (${dateStr})`;
                    toast.error(errorMsg);
                    return { success: false, error: errorMsg };
                }

                payload.push({
                    date: dayDraft.date,
                    dayType: dayDraft.dayType,
                    isWorkingDay: dayDraft.isWorkingDay,
                    shiftPatternId: dayDraft.isWorkingDay ? dayDraft.shiftPatternId : undefined,
                });
            }

            dispatch(slice.actions.setIsSaving(true));
            try {
                await WorkCalendarService.batchUpdateCalendar(payload);
                // Re-fetch fresh calendar data from backend after save to ensure full sync
                const freshData = await WorkCalendarService.getMonthCalendar(year, month);
                dispatch(slice.actions.setMonthData(freshData));
                dispatch(slice.actions.setIsEditMode(false));
                dispatch(slice.actions.setSelectedDates([]));
                toast.success(messages?.success || 'Lưu thay đổi lịch làm việc thành công!');
                return { success: true, data: freshData };
            } catch (err: unknown) {
                const errorMsg = getApiErrorMessage(
                    err,
                    messages?.fallbackError || 'Có lỗi xảy ra khi lưu lịch làm việc.'
                );
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            } finally {
                dispatch(slice.actions.setIsSaving(false));
            }
        },

    /**
     * Reset calendar to default values for the current month
     */
    resetToDefault:
        (messages?: { success?: string; fallbackError?: string }) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            const { year, month } = getState().workCalendar;
            dispatch(slice.actions.setIsResetting(true));

            try {
                const resetData = await WorkCalendarService.resetMonthCalendar(year, month);
                dispatch(slice.actions.setMonthData(resetData));
                dispatch(slice.actions.setIsEditMode(false));
                dispatch(slice.actions.setSelectedDates([]));
                toast.success(messages?.success || 'Khôi phục lịch mặc định thành công!');
                return { success: true, data: resetData };
            } catch (err: unknown) {
                const errorMsg = getApiErrorMessage(
                    err,
                    messages?.fallbackError || 'Không thể khôi phục lịch mặc định.'
                );
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            } finally {
                dispatch(slice.actions.setIsResetting(false));
            }
        },

    /**
     * Confirm schedule for the current month
     */
    confirmMonthSchedule:
        (messages?: { success?: string; fallbackError?: string }) =>
        async (dispatch: AppDispatch, getState: () => RootState) => {
            const { year, month } = getState().workCalendar;
            dispatch(slice.actions.setIsConfirming(true));

            try {
                await WorkCalendarService.confirmMonth(year, month);
                // Refresh calendar after confirmation
                const updated = await WorkCalendarService.getMonthCalendar(year, month);
                dispatch(slice.actions.setMonthData(updated));
                toast.success(
                    messages?.success || `Chốt lịch làm việc Tháng ${month}/${year} thành công!`
                );
                return { success: true, data: updated };
            } catch (err: unknown) {
                const errorMsg = getApiErrorMessage(
                    err,
                    messages?.fallbackError || 'Không thể chốt lịch làm việc. Vui lòng thử lại.'
                );
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            } finally {
                dispatch(slice.actions.setIsConfirming(false));
            }
        },

    // Synchronous action exports
    setYearMonth: slice.actions.setYearMonth,
    setSelectedDates: slice.actions.setSelectedDates,
    setIsEditMode: slice.actions.setIsEditMode,
    setIsEditModalOpen: slice.actions.setIsEditModalOpen,
    updateDraftDays: slice.actions.updateDraftDays,
    cancelDraftChanges: slice.actions.cancelDraftChanges,
    resetWorkCalendar: slice.actions.resetWorkCalendar,
};
