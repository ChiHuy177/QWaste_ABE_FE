import { shiftPatternPalettes, ShiftPatternColorConfig } from '@/configs/antdTheme';

export function getShiftPatternColor(
    patternId?: number | null,
    patternIndex?: number,
    isDark = false
): ShiftPatternColorConfig {
    const paletteList = isDark ? shiftPatternPalettes.dark : shiftPatternPalettes.light;
    const len = paletteList.length;

    if (typeof patternIndex === 'number' && patternIndex >= 0) {
        return paletteList[patternIndex % len];
    }

    if (typeof patternId === 'number' && patternId > 0) {
        return paletteList[(patternId - 1) % len];
    }

    return paletteList[0];
}
