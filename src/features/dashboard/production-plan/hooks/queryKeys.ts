export const productionPlanQueryKeys = {
    all: ['productionPlan'] as const,
    daily: (dateIso: string) => [...productionPlanQueryKeys.all, 'daily', dateIso] as const,
    weekly: (weekStartIso: string) =>
        [...productionPlanQueryKeys.all, 'weekly', weekStartIso] as const,
    detail: (id: string) => [...productionPlanQueryKeys.all, 'detail', id] as const,
    statusLogs: (id: string) => [...productionPlanQueryKeys.all, 'statusLogs', id] as const,
    // Key riêng cho monitor — mapDailyGroups ở đây luôn dùng dayIndex=0 (khác todayIndex thật
    // của trang chính), nên KHÔNG được share cache với productionPlanQueryKeys.daily().
    monitorDaily: (dateIso: string) =>
        [...productionPlanQueryKeys.all, 'monitor', 'daily', dateIso] as const,
};

// Bare key ['machines','list'] — nằm trong prefix invalidation của categories/machineList
// (machineQueryKeys.lists), nên CRUD máy ở trang đó cũng invalidate cache picker này.
export const machineQueryKeys = {
    all: ['machines', 'list'] as const,
};

// Cache riêng cho picker khuôn (GET /molds/v1/picking) — DTO rút gọn nên không share cache
// entry với danh sách phân trang của categories/mold/page.tsx, nhưng vẫn nằm dưới prefix
// ['molds','list'] (moldQueryKeys.lists ở trang đó) để CRUD khuôn invalidate luôn picker này.
export const moldQueryKeys = {
    picking: ['molds', 'list', 'picking'] as const,
};
