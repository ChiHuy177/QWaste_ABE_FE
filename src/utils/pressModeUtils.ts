import { PressMode } from '@/types/Machine';

const PRESS_MODE_LABEL_KEYS: Record<PressMode, string> = {
    SINGLE: 'pressMode.single',
    AUTOMATIC: 'pressMode.automatic',
};

export const getVisiblePressModeLabelKey = (
    mode: PressMode | null | undefined,
    currentStatus: string | null | undefined
): string | null => {
    if (mode == null || currentStatus === 'OFFLINE') return null;
    return PRESS_MODE_LABEL_KEYS[mode] ?? null;
};
