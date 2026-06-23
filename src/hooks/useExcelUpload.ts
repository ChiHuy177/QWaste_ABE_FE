import { useState, useCallback } from 'react';

interface UseExcelUploadOptions<T> {
    uploadFn: (file: File) => Promise<T>;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
}

interface UseExcelUploadReturn<T> {
    file: File | null;
    loading: boolean;
    result: T | null;
    error: unknown;
    setFile: (file: File | null) => void;
    submit: () => Promise<void>;
    reset: () => void;
}

export function useExcelUpload<T>({
    uploadFn,
    onSuccess,
    onError,
}: UseExcelUploadOptions<T>): UseExcelUploadReturn<T> {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<T | null>(null);
    const [error, setError] = useState<unknown>(null);

    const submit = useCallback(async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const data = await uploadFn(file);
            setResult(data);
            onSuccess?.(data);
        } catch (err) {
            setError(err);
            onError?.(err);
        } finally {
            setLoading(false);
        }
    }, [file, uploadFn, onSuccess, onError]);

    const reset = useCallback(() => {
        setFile(null);
        setResult(null);
        setError(null);
        setLoading(false);
    }, []);

    return { file, loading, result, error, setFile, submit, reset };
}
