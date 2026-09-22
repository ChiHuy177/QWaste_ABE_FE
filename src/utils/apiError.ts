import axios from 'axios';

const toMessage = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) {
        return value;
    }

    return '';
};

const toMessages = (value: unknown): string => {
    if (!Array.isArray(value)) {
        return '';
    }

    return value
        .map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>;
                return (
                    toMessage(record.message) ||
                    toMessage(record.error) ||
                    toMessage(record.defaultMessage)
                );
            }

            return '';
        })
        .filter(Boolean)
        .join('\n');
};

export const getApiErrorMessage = (error: unknown, fallback = ''): string => {
    const errorObject = error as any;
    const errorData = errorObject?.response?.data;

    const apiMessage =
        toMessage(errorData?.message) ||
        toMessages(errorData?.errors) ||
        toMessage(errorData?.error) ||
        toMessage(errorData?.result?.message) ||
        toMessages(errorData?.result?.errors);

    return apiMessage || fallback || toMessage(errorObject?.message);
};

export const getApiErrorCode = (error: unknown): number | undefined => {
    const errorObject = error as any;
    const errorData = errorObject?.response?.data as Record<string, unknown> | undefined;
    if (typeof errorData?.code === 'number') {
        return errorData.code;
    }
    return undefined;
};

export const DOMAIN_ERROR_MESSAGES: Record<number, { vi: string; en: string }> = {
    913: {
        vi: 'Mẫu ca không tồn tại.',
        en: 'Shift pattern not found.',
    },
    914: {
        vi: 'Mã mẫu ca đã tồn tại.',
        en: 'Shift pattern code already exists.',
    },
    915: {
        vi: 'Chỉ hỗ trợ lọc theo ca cụ thể khi xem trong một ngày duy nhất.',
        en: 'Shift filtering is only supported when viewing a single specific day.',
    },
    916: {
        vi: 'Ca được chọn không thuộc mẫu ca của ngày đang xem.',
        en: "The selected shift does not belong to this day's shift pattern.",
    },
    917: {
        vi: 'Hiện tại không có ca nào đang hoạt động.',
        en: 'No shift is actively running right now.',
    },
    1806: {
        vi: 'Vui lòng chọn mẫu ca cho ngày làm việc.',
        en: 'Shift pattern is required for a working day.',
    },
    1807: {
        vi: 'Không được gán mẫu ca cho ngày nghỉ.',
        en: 'Shift pattern is not allowed for a non-working day.',
    },
};

export const getErrorStatus = (error: unknown): number | undefined => {
    return (error as any)?.response?.status;
};

export const shouldUseServerMessage = (status?: number): boolean => {
    return status === 409;
};

export const isRequestCancelled = (error: unknown): boolean => {
    return axios.isCancel(error);
};
