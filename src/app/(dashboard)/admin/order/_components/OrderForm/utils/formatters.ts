export const formatDuration = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
};

export const formatDurationMinutes = (totalSeconds: number): string => {
    return `${Math.round(totalSeconds / 60)}`;
};

export const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

export const formatCurrency = (value: number | string | undefined): string => {
    if (!value) return '0';
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseCurrency = (value: string | undefined): string => {
    if (!value) return '';
    return value.replace(/\$\s?|(,*)/g, '');
};
