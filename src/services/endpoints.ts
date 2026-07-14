type PathParam = string | number;

const WITH_PARAM = (base: string, param: PathParam): string => `${base}/${param}`;

// Versions
const V1 = 'v1';
const V2 = 'v2';

// Base paths
const API = '/api';

const BASE_PATHS = {
    AUTH: `${API}/authentication/${V1}`,
    USERS: `${API}/users/${V1}`,
    USER_SETTINGS: `${API}/users/userSettings/${V1}`,
    SPACES: `${API}/spaces/${V1}`,
    SPACES_MONITORING: `${API}/spaces/monitoring/${V1}`,
    SPACE_LEVELS: `${API}/spaceLevels/${V1}`,
    STANDARD_STEPS: `${API}/standardSteps/${V1}`,
    GROUPS: `${API}/groups/${V1}`,
    MACHINES: `${API}/machines/${V1}`,
    MACHINES_V2: `${API}/machines/${V2}`,
    MACHINES_MONITORING: `${API}/machines/monitoring/${V1}`,
    MACHINES_OP_HISTORY: `${API}/machines/operatorHistory/${V1}`,
    ENERGY: `${API}/energy/${V1}`,
    FLOOR_MAP: `${API}/floorMap/${V1}`,
    MACHINE_TYPES: `${API}/machineTypes/${V1}`,
    NOTIFICATIONS: `${API}/notifications/${V1}`,
    PERMISSIONS: `${API}/permissions/${V1}`,
    ROLES: `${API}/roles/${V1}`,
    INDUSTRY_FILTERS: `${API}/industryFilters/${V1}`,
    SHIFT_BREAK_PERIODS: `${API}/shiftBreakPeriods/${V1}`,
    UTILS: `${API}/utils/${V1}`,
    EXCEL_EXPORT: `${API}/excelExport/${V1}`,
    MOLDS: `${API}/molds/${V1}`,
    OPERATION_TYPES: `${API}/operationTypes/${V1}`,
    PRODUCTION_PLANS: `${API}/productionPlans/${V1}`,
} as const;

export const ENDPOINTS = {
    AUTH: {
        LOGIN: `${BASE_PATHS.AUTH}/login`,
        REFRESH: `${BASE_PATHS.AUTH}/refresh`,
        LOGOUT: `${BASE_PATHS.AUTH}/logout`,
        REGISTER: `${BASE_PATHS.USERS}/register/initiate`,
        REGISTER_VERIFY: `${BASE_PATHS.USERS}/register/verify`,
    },
    SPACES: {
        BASE: BASE_PATHS.SPACES,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.SPACES, id),
        ALL: BASE_PATHS.SPACES,
        WITH_CHILDREN_BY_LEVEL: (level: PathParam) =>
            `${BASE_PATHS.SPACES}/level/${level}/withChildren`,
        BY_LEVEL: (level: PathParam) => `${BASE_PATHS.SPACES}/level/${level}`,
        PICKING_REGISTRATION: `${BASE_PATHS.SPACES}/picking/registration`,
        PICKING_BY_LEVEL: (level: PathParam) => `${BASE_PATHS.SPACES}/level/${level}`,
        PICKING_BY_LEVEL_WITH_CHILDREN: (level: PathParam) =>
            `${BASE_PATHS.SPACES}/level/${level}/withChildren`,
        PICKING_FROM_LEVEL_TO_LEVEL: (fromLevel: PathParam, toLevel: PathParam) =>
            `${BASE_PATHS.SPACES}/level/${fromLevel}/to/${toLevel}`,
        MONITORING: {
            OVERVIEW_BY_FILTER: `${BASE_PATHS.SPACES_MONITORING}/overview/byFilter`,
            OVERVIEW_BY_DATE_RANGE: `${BASE_PATHS.SPACES_MONITORING}/overview/byDateRange`,
            ERROR_DETAIL_BY_FILTER: `${BASE_PATHS.MACHINES_MONITORING}/errorDetail/byFilter`,
            ERROR_DETAIL_BY_DATE_RANGE: `${BASE_PATHS.MACHINES_MONITORING}/errorDetail/byDateRange`,
            ERROR_COUNT_BY_FILTER: `${BASE_PATHS.SPACES_MONITORING}/machineErrorChart/byFilter`,
            ERROR_COUNT_BY_DATE_RANGE: `${BASE_PATHS.SPACES_MONITORING}/machineErrorChart/byDateRange`,
            MTBF_BY_FILTER: `${BASE_PATHS.SPACES_MONITORING}/mtbfChart/byFilter`,
            MTBF_BY_DATE_RANGE: `${BASE_PATHS.SPACES_MONITORING}/mtbfChart/byDateRange`,
            MTTR_BY_FILTER: `${BASE_PATHS.SPACES_MONITORING}/mttrChart/byFilter`,
            MTTR_BY_DATE_RANGE: `${BASE_PATHS.SPACES_MONITORING}/mttrChart/byDateRange`,
            MACHINE_STATUS_SUMMARY_BY_FILTER: `${BASE_PATHS.SPACES_MONITORING}/machineStatusSummary/byFilter`,
            MACHINE_STATUS_SUMMARY_BY_DATE_RANGE: `${BASE_PATHS.SPACES_MONITORING}/machineStatusSummary/byDateRange`,
            MACHINE_STATUS_LOG_CHART_BY_FILTER: `${BASE_PATHS.SPACES_MONITORING}/machineStatusLogChart/byFilter`,
            MACHINE_STATUS_LOG_CHART_BY_DATE_RANGE: `${BASE_PATHS.SPACES_MONITORING}/machineStatusLogChart/byDateRange`,
        },
    },
    SPACE_LEVELS: {
        BASE: BASE_PATHS.SPACE_LEVELS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.SPACE_LEVELS, id),
        PAGINATION: `${BASE_PATHS.SPACE_LEVELS}/all`,
    },
    STANDARD_STEPS: {
        BASE: BASE_PATHS.STANDARD_STEPS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.STANDARD_STEPS, id),
    },
    GROUPS: {
        BASE: BASE_PATHS.GROUPS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.GROUPS, id),
        PICKING: `${BASE_PATHS.GROUPS}/picking`,
    },
    MACHINE: {
        BASE: BASE_PATHS.MACHINES,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.MACHINES, id),
        WITH_LOGS: `${BASE_PATHS.MACHINES_MONITORING}/overview/byFilter`,
        OVERVIEW_BY_CURRENT_SHIFT: (machineId: PathParam) =>
            `${BASE_PATHS.MACHINES_MONITORING}/overview/byCurrentShift/${machineId}`,
        RESTORE: (id: PathParam) => `${BASE_PATHS.MACHINES}/${id}/restoring`,
        MACHINE_LIST: `${BASE_PATHS.MACHINES_V2}/machineList`,
        PAGINATION: `${BASE_PATHS.MACHINES}/all`,
        MACHINE_OPERATOR_HISTORY: {
            BASE: BASE_PATHS.MACHINES_OP_HISTORY,
            DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.MACHINES_OP_HISTORY, id),
            BY_SPACE: (spaceId: PathParam) => `${BASE_PATHS.MACHINES_OP_HISTORY}/space/${spaceId}`,
        },
    },
    USERS: {
        BASE: BASE_PATHS.USERS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.USERS, id),
        ME: `${BASE_PATHS.USERS}/me`,
        RESTORE: (id: PathParam) => `${BASE_PATHS.USERS}/${id}/restoring`,
        CHANGE_PASSWORD_VERIFY: `${BASE_PATHS.USERS}/changePasswordVerification`,
        CHANGE_PASSWORD_CODE: `${BASE_PATHS.USERS}/changePasswordCode`,
        ROLES_PERMISSIONS_SUMMARY: (userId: PathParam) =>
            `${BASE_PATHS.USERS}/${userId}/rolesAndPermissionsSummary`,
        UPDATE_ROLES_PERMISSIONS: `${BASE_PATHS.USERS}/rolesAndPermissions`,
    },
    ENERGY: {
        OVERVIEW_BY_FILTER: `${BASE_PATHS.ENERGY}/overview/byFilter`,
        OVERVIEW_BY_DATE_RANGE: `${BASE_PATHS.ENERGY}/overview/byDateRange`,
    },
    USER_SETTING: {
        BASE: BASE_PATHS.USER_SETTINGS,
    },
    FLOOR_MAP: {
        DETAIL: (spaceId: PathParam) => WITH_PARAM(BASE_PATHS.FLOOR_MAP, spaceId),
        MACHINE_POSITION: (spaceId: PathParam, machineId: PathParam) =>
            `${BASE_PATHS.FLOOR_MAP}/${spaceId}/machines/${machineId}`,
    },
    MACHINE_TYPES: {
        BASE: BASE_PATHS.MACHINE_TYPES,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.MACHINE_TYPES, id),
        PICKING: `${BASE_PATHS.MACHINE_TYPES}/picking`,
    },
    NOTIFICATIONS: {
        BASE: BASE_PATHS.NOTIFICATIONS,
        READ: `${BASE_PATHS.NOTIFICATIONS}/read`,
        UNREAD: `${BASE_PATHS.NOTIFICATIONS}/unreadCount`,
    },
    PERMISSION: {
        BASE: BASE_PATHS.PERMISSIONS,
        GET: BASE_PATHS.PERMISSIONS,
        GET_BY_ID: (id: PathParam) => WITH_PARAM(BASE_PATHS.PERMISSIONS, id),
        UPDATE: BASE_PATHS.PERMISSIONS,
        DELETE: (id: PathParam) => WITH_PARAM(BASE_PATHS.PERMISSIONS, id),
    },
    ROLE: {
        BASE: BASE_PATHS.ROLES,
        GET: BASE_PATHS.ROLES,
        GET_BY_ID: (id: PathParam) => WITH_PARAM(BASE_PATHS.ROLES, id),
        UPDATE: BASE_PATHS.ROLES,
        DELETE: (id: PathParam) => WITH_PARAM(BASE_PATHS.ROLES, id),
    },
    INDUSTRY_FILTER: {
        BASE: BASE_PATHS.INDUSTRY_FILTERS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.INDUSTRY_FILTERS, id),
        PICKING: `${BASE_PATHS.INDUSTRY_FILTERS}/picking`,
        PRIMARY: `${BASE_PATHS.INDUSTRY_FILTERS}/primary`,
        SHIFTS: `${BASE_PATHS.INDUSTRY_FILTERS}/shifts`,
    },
    SHIFT_BREAK_PERIOD: {
        BASE: BASE_PATHS.SHIFT_BREAK_PERIODS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.SHIFT_BREAK_PERIODS, id),
        FORSHIFT: (id: PathParam) => `${BASE_PATHS.SHIFT_BREAK_PERIODS}/forShift/${id}`,
    },
    UTILS: {
        SPACE_LEVELS: {
            HIGHEST: `${BASE_PATHS.UTILS}/spaceLevels/highest`,
        },
    },
    EXCEL_EXPORT: {
        MACHINE_STATUS_LOG_REPORT_BY_FILTER: `${BASE_PATHS.EXCEL_EXPORT}/machineStatusLogReport/byFilter`,
        MACHINE_STATUS_LOG_REPORT_BY_DATE_RANGE: `${BASE_PATHS.EXCEL_EXPORT}/machineStatusLogReport/byDateRange`,
    },
    MOLDS: {
        BASE: BASE_PATHS.MOLDS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.MOLDS, id),
        RESTORE: (id: PathParam) => `${BASE_PATHS.MOLDS}/${id}/restoring`,
    },
    OPERATION_TYPES: {
        BASE: BASE_PATHS.OPERATION_TYPES,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.OPERATION_TYPES, id),
    },
    PRODUCTION_PLANS: {
        BASE: BASE_PATHS.PRODUCTION_PLANS,
        DETAIL: (id: PathParam) => WITH_PARAM(BASE_PATHS.PRODUCTION_PLANS, id),
        STATUS_LOGS: (id: PathParam) => `${BASE_PATHS.PRODUCTION_PLANS}/${id}/statusLogs`,
        DAILY: `${BASE_PATHS.PRODUCTION_PLANS}/daily`,
        WEEKLY: `${BASE_PATHS.PRODUCTION_PLANS}/weekly`,
        REORDER: `${BASE_PATHS.PRODUCTION_PLANS}/reorder`,
        MOVE: (id: PathParam) => `${BASE_PATHS.PRODUCTION_PLANS}/${id}/move`,
        RESTORE: (id: PathParam) => `${BASE_PATHS.PRODUCTION_PLANS}/${id}/restoring`,
        INCIDENT_TERMINATE: (id: PathParam) =>
            `${BASE_PATHS.PRODUCTION_PLANS}/${id}/incident/terminate`,
        INCIDENT_DEFER: (id: PathParam) => `${BASE_PATHS.PRODUCTION_PLANS}/${id}/incident/defer`,
        INCIDENT_PAUSE: (id: PathParam) => `${BASE_PATHS.PRODUCTION_PLANS}/${id}/incident/pause`,
        IMPORT: `${BASE_PATHS.PRODUCTION_PLANS}/import`,
        IMPORT_CONFIRM: `${BASE_PATHS.PRODUCTION_PLANS}/import/confirm`,
    },
} as const;

export type EndpointConfig = typeof ENDPOINTS;
