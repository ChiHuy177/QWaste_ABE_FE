import type { IncidentReason } from '@/types/ProductionPlan';

export const INCIDENT_REASONS: IncidentReason[] = [
    'WAITING_MATERIALS',
    'TOOL_ADJUSTMENT',
    'SENSOR_CALIBRATION',
    'MOLD_DAMAGE',
    'MACHINE_BREAKDOWN',
    'QUALITY_ISSUE',
    'ORDER_CANCELLED',
    'PRODUCTION_DISCONTINUED',
    'OTHER',
];

export const getIncidentReasonOptions = (t: (key: string) => string) =>
    INCIDENT_REASONS.map((reason) => ({
        value: reason,
        label: t(`productionPlan.incidentReason.${reason}`),
    }));

/** BE bắt buộc note/reason chi tiết khi chọn OTHER. */
export const isIncidentNoteRequired = (reason?: IncidentReason): boolean => reason === 'OTHER';
