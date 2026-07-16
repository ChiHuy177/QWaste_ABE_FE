import { MOCK_MACHINE_ERROR_DETAILS } from './factoryOverview';

export interface MachinePlanMeta {
    zone: string;
    plan: number;
}

/** Production plan per machineId — aligned with factoryOverview zones */
export const MOCK_MACHINE_PLAN: Record<string, MachinePlanMeta> = {
    'machine-demo-cnc-01':   { zone: 'Zone A1 · CNC',     plan: 200 },
    'machine-demo-cnc-02':   { zone: 'Zone A1 · CNC',     plan: 150 },
    'machine-demo-lathe-01': { zone: 'Zone A1 · CNC',     plan: 100 },
    'machine-demo-cut-01':   { zone: 'Zone A2 · Cutting', plan: 250 },
    'machine-demo-heat-01':  { zone: 'Zone A2 · Cutting', plan: 100 },
};

/** Flat plan number per machineId — for table use */
export const MOCK_MACHINE_PLAN_NUMBER: Record<string, number> = Object.fromEntries(
    Object.entries(MOCK_MACHINE_PLAN).map(([id, { plan }]) => [id, plan])
);

/** First error cause per machineId — derived from factoryOverview error details */
export const MOCK_ERROR_CAUSES: Record<string, string> = Object.fromEntries(
    Object.entries(MOCK_MACHINE_ERROR_DETAILS)
        .filter(([, detail]) => detail.errors.length > 0)
        .map(([machineId, detail]) => [machineId, detail.errors[0].errorName])
);

/** Time of first error per machineId (HH:mm) — derived from factoryOverview */
export const MOCK_ERROR_TIMES: Record<string, string> = Object.fromEntries(
    Object.entries(MOCK_MACHINE_ERROR_DETAILS)
        .filter(([, detail]) => detail.errors.length > 0)
        .map(([machineId, detail]) => {
            const startTime = detail.errors[0].startTime;
            const date = new Date(startTime);
            const hh = String(date.getUTCHours()).padStart(2, '0');
            const mm = String(date.getUTCMinutes()).padStart(2, '0');
            return [machineId, `${hh}:${mm}`];
        })
);
