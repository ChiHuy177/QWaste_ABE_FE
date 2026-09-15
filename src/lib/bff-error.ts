type UnknownRecord = Record<string, unknown>;

/**
 * Lỗi do chính BFF proxy phát sinh (không phải backend trả về) — vd. config sai,
 * backend unreachable. Throw class này trong route.ts, catch tập trung 1 chỗ để
 * gắn source: 'bff', thay vì phải tự return NextResponse.json rải rác từng nơi.
 */
export abstract class BffError extends Error {
    abstract readonly httpStatus: number;
    abstract readonly code: string;
}

export class BffConfigError extends BffError {
    readonly httpStatus = 500;
    readonly code = 'BFF_CONFIG_INVALID';
}

export class BffNetworkError extends BffError {
    readonly httpStatus = 502;
    readonly code = 'BFF_BACKEND_UNREACHABLE';
}

export class BffUnexpectedError extends BffError {
    readonly httpStatus = 500;
    readonly code = 'BFF_UNEXPECTED';
}

export function toBffErrorBody(error: BffError): UnknownRecord {
    return {
        code: error.code,
        message: error.message,
        isSuccess: false,
        source: 'bff',
    };
}

const toMessage = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '';
};

const messageFromItem = (item: unknown): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
        const record = item as UnknownRecord;
        return (
            toMessage(record.message) || toMessage(record.error) || toMessage(record.defaultMessage)
        );
    }
    return '';
};

const toJoinedMessage = (value: unknown): string => {
    if (!Array.isArray(value)) return '';
    return value.map(messageFromItem).filter(Boolean).join('\n');
};

const toStringArray = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    const strings = value.map(messageFromItem).filter(Boolean);
    return strings.length > 0 ? strings : undefined;
};

/**
 * Backend trả lỗi ở nhiều shape khác nhau tuỳ endpoint (message, errors[], error,
 * result.message, result.errors[]). Gom về 1 shape cố định ngay tại BFF để FE chỉ
 * cần đọc data.message / data.errors, không phải tự đoán nhiều đường fallback.
 */
export function normalizeErrorBody(raw: unknown, httpStatus: number): UnknownRecord {
    const data = raw && typeof raw === 'object' ? (raw as UnknownRecord) : {};
    const result =
        data.result && typeof data.result === 'object' ? (data.result as UnknownRecord) : undefined;

    const message =
        toMessage(data.message) ||
        toMessage(data.error) ||
        toMessage(result?.message) ||
        toJoinedMessage(data.errors) ||
        toJoinedMessage(result?.errors);

    const errors = toStringArray(data.errors) ?? toStringArray(result?.errors);

    return {
        code: typeof data.code === 'number' ? data.code : httpStatus,
        message,
        ...(errors ? { errors } : {}),
        isSuccess: false,
        source: 'upstream',
    };
}
