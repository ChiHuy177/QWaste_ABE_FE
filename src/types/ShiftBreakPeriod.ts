export interface ShiftBreakPeriod {
    breakPeriodId: number;
    filterId: number;
    breakStartTime: string;
    breakEndTime: string;
    breakNameEn?: string;
    breakNameVi?: string;
    sortOrder: number;
}

export interface ShiftBreakPeriodCreationRequest {
    filterId: number;
    breakStartTime: string;
    breakEndTime: string;
    breakNameEn?: string;
    breakNameVi?: string;
    sortOrder: number;
}

export interface ShiftBreakPeriodUpdationRequest {
    breakPeriodId: number;
    breakStartTime?: string;
    breakEndTime?: string;
    breakNameEn?: string;
    breakNameVi?: string;
    sortOrder: number;
}
