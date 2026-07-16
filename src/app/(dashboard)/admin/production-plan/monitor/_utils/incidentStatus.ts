import type { MonitorRowVM } from '../../_components/types';

/**
 * PAUSE do MQTT (máy tự báo lỗi/mất kết nối) có trigger MQTT_* và incidentReason null.
 * PAUSE do staff xác nhận (tạm dừng chờ sửa chữa) có trigger MANUAL + incidentReason — BE
 * chỉ set incidentReason qua flow xác nhận sự cố thủ công (xem IncidentConfirmModal). Các
 * field này chỉ có trong phiên đang mở (từ WS) — F5 lại sẽ mất, coi như "cần xử lý".
 */
export const isIncidentConfirmed = (row: Pick<MonitorRowVM, 'trigger' | 'incidentReason'>) =>
    row.trigger === 'MANUAL' && !!row.incidentReason;

/** Phút trôi qua kể từ lần đổi status gần nhất trong phiên (null nếu chưa rõ). */
export const getElapsedMinutes = (updatedAt: Date | null | undefined): number | null => {
    if (!updatedAt) return null;
    return Math.max(0, Math.round((Date.now() - updatedAt.getTime()) / 60000));
};
