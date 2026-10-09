import { toast } from 'sonner';

const REORDER_MULTI_ERROR_CODE = 80026;

export interface ReorderErrorEntry {
    code?: number;
    message: string;
    machineId?: string;
    plannedDate?: string;
}

interface ReorderErrorContext {
    t: (key: string) => string;
    /** machineId -> machineCode, để hiển thị context lỗi dễ đọc hơn thay vì raw UUID. */
    machineCodeById?: Map<string, string>;
    fallbackKey?: string;
}

/**
 * Parse + hiển thị lỗi 400 riêng cho PUT /productionPlans/v1/reorder.
 * BE trả 2 dạng cho endpoint này: lỗi đơn cổ điển {code, message}, hoặc wrapper
 * multi-error 80026 {code:80026, message, errors:[{code, message, context:{entityId, plannedDate}}]}
 * khi từ 2 nhóm (ngày, máy) trở lên vi phạm cùng lúc. Chỉ dùng cho reorder — các
 * API CRUD khác của production-plan vẫn dùng useApiErrorHandler ở page như cũ.
 */
export class ReorderErrorHandler {
    static parse(error: unknown): ReorderErrorEntry[] {
        const data = (error as { response?: { data?: unknown } })?.response?.data as
            | { code?: number; message?: string; errors?: unknown[] }
            | undefined;
        if (!data) return [];

        if (data.code === REORDER_MULTI_ERROR_CODE && Array.isArray(data.errors)) {
            return data.errors
                .map((entry): ReorderErrorEntry | null => {
                    if (!entry || typeof entry !== 'object') return null;
                    const record = entry as {
                        code?: number;
                        message?: string;
                        context?: { entityId?: string; plannedDate?: string };
                    };
                    if (!record.message) return null;
                    return {
                        code: record.code,
                        message: record.message,
                        machineId: record.context?.entityId,
                        plannedDate: record.context?.plannedDate,
                    };
                })
                .filter((entry): entry is ReorderErrorEntry => entry != null);
        }

        if (typeof data.message === 'string' && data.message.trim()) {
            return [{ code: data.code, message: data.message }];
        }

        return [];
    }

    static notify(error: unknown, { t, machineCodeById, fallbackKey }: ReorderErrorContext): void {
        const entries = ReorderErrorHandler.parse(error);

        if (entries.length === 0) {
            toast.error(fallbackKey ? t(fallbackKey) : t('common.server.badRequest'));
            return;
        }

        entries.forEach((entry) => {
            const machineCode = entry.machineId ? machineCodeById?.get(entry.machineId) : undefined;
            const contextParts = [machineCode, entry.plannedDate].filter(Boolean);
            const prefix = contextParts.length > 0 ? `[${contextParts.join(' · ')}] ` : '';
            toast.error(`${prefix}${entry.message}`);
        });
    }
}
