type PathParam = string | number;

const WITH_PARAM = (base: string, param: PathParam): string => `${base}/${param}`;

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/authentication/v1/login',
        REFRESH: '/api/authentication/v1/refresh',
        LOGOUT: '/api/authentication/v1/logout',
        REGISTER: '/api/users/v1/register/initiate',
        REGISTER_VERIFY: '/api/users/v1/register/verify',
    },
    DRAWING_CODES: {
        BASE: '/api/drawingCodes/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/drawingCodes/v1', id),
        RESTORE: (id: PathParam) => `/api/drawingCodes/v1/${id}/restoring`,
        PICKING: '/api/drawingCodes/v1/picking',
    },
    SPACES: {
        BASE: '/api/spaces/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/spaces/v1', id),
        ALL: '/api/spaces/v1',
        WITH_CHILDREN_BY_LEVEL: (level: PathParam) => `/api/spaces/v1/level/${level}/withChildren`,
        BY_LEVEL: (level: PathParam) => `/api/spaces/v1/level/${level}`,
        PICKING_REGISTRATION: '/api/spaces/v1/picking/registration',
        PICKING_BY_LEVEL: (level: PathParam) => `/api/spaces/v1/level/${level}`,
        PICKING_BY_LEVEL_WITH_CHILDREN: (level: PathParam) =>
            `/api/spaces/v1/level/${level}/withChildren`,
        MONITORING: {
            OVERVIEW_BY_FILTER: '/api/spaces/monitoring/v1/overview/byFilter',
            OVERVIEW_BY_DATE_RANGE: '/api/spaces/monitoring/v1/overview/byDateRange',
            ERROR_COUNT_BY_FILTER: '/api/spaces/monitoring/v1/machineErrorChart/byFilter',
            ERROR_COUNT_BY_DATE_RANGE: '/api/spaces/monitoring/v1/machineErrorChart/byDateRange',
            MTBF_BY_FILTER: '/api/spaces/monitoring/v1/mtbfChart/byFilter',
            MTBF_BY_DATE_RANGE: '/api/spaces/monitoring/v1/mtbfChart/byDateRange',
            MTTR_BY_FILTER: '/api/spaces/monitoring/v1/mttrChart/byFilter',
            MTTR_BY_DATE_RANGE: '/api/spaces/monitoring/v1/mttrChart/byDateRange',
            MACHINE_STATUS_SUMMARY_BY_FILTER:
                '/api/spaces/monitoring/v1/machineStatusSummary/byFilter',
            MACHINE_STATUS_SUMMARY_BY_DATE_RANGE:
                '/api/spaces/monitoring/v1/machineStatusSummary/byDateRange',
            ERROR_DETAIL_BY_FILTER: '/api/machines/monitoring/v1/errorDetail/byFilter',
            ERROR_DETAIL_BY_DATE_RANGE: '/api/machines/monitoring/v1/errorDetail/byDateRange',
            MACHINE_STATUS_LOG_CHART_BY_FILTER:
                '/api/spaces/monitoring/v1/machineStatusLogChart/byFilter',
            MACHINE_STATUS_LOG_CHART_BY_DATE_RANGE:
                '/api/spaces/monitoring/v1/machineStatusLogChart/byDateRange',
        },
    },
    SPACE_LEVELS: {
        BASE: '/api/spaceLevels/v1',
        HIGHEST: '/api/utils/v1/spaceLevels/highest',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/spaceLevels/v1', id),
        PAGINATION: '/api/spaceLevels/v1/all',
    },
    STEPS: {
        BASE: '/api/standardSteps/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/standardSteps/v1', id),
    },
    GROUPS: {
        BASE: '/api/groups/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/groups/v1', id),
        PICKING: '/api/groups/v1/picking',
    },
    MACHINE: {
        BASE: '/api/machines/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/machines/v1', id),
        WITH_LOGS: '/api/machines/monitoring/v1/overview/byFilter',
        RESTORE: (id: PathParam) => `/api/machines/v1/${id}/restoring`,
        MACHINE_LIST: '/api/machines/v2/machineList',
        PAGINATION: '/api/machines/v1/all',
    },
    USERS: {
        BASE: '/api/users/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/users/v1', id),
        ME: '/api/users/v1/me',
        RESTORE: (id: PathParam) => `/api/users/v1/${id}/restoring`,
        CHANGE_PASSWORD_VERIFY: '/api/users/v1/changePasswordVerification',
        CHANGE_PASSWORD_CODE: '/api/users/v1/changePasswordCode',
        ROLES_PERMISSIONS_SUMMARY: (userId: PathParam) =>
            `/api/users/v1/${userId}/rolesAndPermissionsSummary`,
        UPDATE_ROLES_PERMISSIONS: '/api/users/v1/rolesAndPermissions',
    },
    ZONES: {
        BASE: '/api/zones/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/zones/v1', id),
        PICKING: '/api/zones/v1/picking',
        BY_FACTORY: (factoryId: PathParam) => `/api/zones/v1/factories/${factoryId}`,
    },
    LINES: {
        BASE: '/api/lines/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/lines/v1', id),
        PICKING: '/api/lines/v1/picking',
        BY_ZONE: (zoneId: PathParam) => `/api/lines/v1/lineList?zoneId=${zoneId}`,
    },
    ENERGY: {
        OVERVIEW_BY_FILTER: '/api/energy/v1/overview/byFilter',
        OVERVIEW_BY_DATE_RANGE: '/api/energy/v1/overview/byDateRange',
    },
    USER_SETTING: {
        BASE: '/api/users/userSettings/v1',
    },
    FACTORY: {
        BASE: '/api/factories/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/factories/v1', id),
        PICKING: '/api/factories/v1/picking',
        PICKING_FOR_REGISTER: '/api/factories/v1/pickingForRegistration',
        PICKING_WITH_ZONES: '/api/factories/v1/picking/zones',
        PICKING_WITH_ZONES_AND_LINES: '/api/factories/v1/picking/zonesAndLines',
        OVERVIEW_BY_FILTER: '/api/factories/v1/overview/byFilter',
        OVERVIEW_BY_DATE_RANGE: '/api/factories/v1/overview/byDateRange',
    },
    MACHINE_TYPES: {
        BASE: '/api/machineTypes/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/machineTypes/v1', id),
        PICKING: '/api/machineTypes/v1/picking',
    },
    MACHINE_OPERATOR_HISTORY: {
        BASE: '/api/machineOperatorHistory/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/machineOperatorHistory/v1', id),
        BY_ZONE: (zoneId: PathParam) => `/api/machineOperatorHistory/v1/zone/${zoneId}`,
    },
    NOTIFICATIONS: {
        BASE: '/api/notifications/v1',
        READ: '/api/notifications/v1/read',
        UNREAD: '/api/notifications/v1/unreadCount',
    },
    PERMISSION: {
        BASE: '/api/permissions/v1',
        GET: '/api/permissions/v1',
        GET_BY_ID: (id: PathParam) => WITH_PARAM('/api/permissions/v1', id),
        UPDATE: '/api/permissions/v1',
        DELETE: (id: PathParam) => WITH_PARAM('/api/permissions/v1', id),
    },
    ROLE: {
        BASE: '/api/roles/v1',
        GET: '/api/roles/v1',
        GET_BY_ID: (id: PathParam) => WITH_PARAM('/api/roles/v1', id),
        UPDATE: '/api/roles/v1',
        DELETE: (id: PathParam) => WITH_PARAM('/api/roles/v1', id),
    },
    INDUSTRY_FILTER: {
        BASE: '/api/industryFilters/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/industryFilters/v1', id),
        PRIMARY: '/api/industryFilters/v1/primary',
        SHIFTS: '/api/industryFilters/v1/shifts',
    },
    ORDERS: {
        BASE: '/api/orders/v1',
        DETAIL: (id: string) => `/api/orders/v1/${id}`,
        CONFIRM: (id: string) => `/api/orders/v1/${id}/confirm`,
        DRAWINGS: (orderId: string) => `/api/orders/v1/${orderId}/drawings`,
        DRAWING_DETAIL: (orderId: string, drawingId: string) =>
            `/api/orders/v1/${orderId}/drawings/${drawingId}`,
        PLAN_FOR_EDIT: (orderId: string) => `/api/orders/v1/${orderId}/planForEdit`,
        MY_REVIEWING_ORDERS: '/api/orders/v1/myReviewingOrders',
        MANAGER_REVIEW: (orderId: string) => `/api/orders/v1/${orderId}/managerReview`,
        OPERATOR_REVIEW: (orderId: string) => `/api/orders/v1/${orderId}/operatorReview`,
        CANCEL: (orderId: string) => `/api/orders/v1/${orderId}/cancel`,
        RESTORE: (orderId: string) => `/api/orders/v1/${orderId}/restore`,
        EXPORT: (orderId: string) => `/api/orders/v1/${orderId}/export`,
        UPDATE_INFO: '/api/orders/v1/info',
        UPDATE_PLAN: '/api/orders/v1/plan',
    },
    SHIFT_BREAK_PERIOD: {
        BASE: '/api/shiftBreakPeriods/v1',
        DETAIL: (id: PathParam) => WITH_PARAM('/api/shiftBreakPeriods/v1', id),
        FORSHIFT: (id: PathParam) => `/api/shiftBreakPeriods/v1/forShift/${id}`,
    },
    TASKS: {
        BY_ORDER: (id: string) => `/api/tasks/v1/by-order/${id}`,
    },

    TASK_REVIEWS: {
        CONFIRM: (id: PathParam) => `/api/taskReviews/v1/${id}/confirm`,
        DECLINE: (id: PathParam) => `/api/taskReviews/v1/${id}/decline`,
    },
    UTILS: {
        ENUMS: {
            TASK_DECLINE_REASONS: '/api/utils/v1/enums/taskDeclineReasons',
        },
    },
} as const;

export type EndpointConfig = typeof ENDPOINTS;
