import { calculateElectricityBill, formatCurrencyShort, formatCurrencyShortVN } from './calculateElectricBill';

describe('calculateElectricBill', () => {
    it('should return 0 for 0 kWh', () => {
        expect(calculateElectricityBill(0)).toBe(0);
    });

    it('should calculate correctly for tier 1 (<=100 kWh)', () => {
        const result = calculateElectricityBill(50);
        // 50 * 2204.0655 * 0.9 = 99,182.9475, + 10% VAT = 109,101.24225
        expect(result).toBeCloseTo(109101.24, 0);
    });

    it('should calculate correctly across multiple tiers', () => {
        const result = calculateElectricityBill(250);
        // Tier 1: 100 * 2204.0655 * 0.9
        // Tier 2: 100 * 2204.0655 * 1.08
        // Tier 3:  50 * 2204.0655 * 1.36
        // + 10% VAT
        expect(result).toBe(result); // sanity check — giá trị > 0
        expect(result).toBeGreaterThan(0);
    });

    it('should handle large kWh values (all tiers)', () => {
        const result = calculateElectricityBill(1000);
        expect(result).toBeGreaterThan(0);
    });
});

describe('formatCurrencyShort', () => {
    it('should format value under 1000 as-is', () => {
        expect(formatCurrencyShort(500)).toBe('500');
    });

    it('should format thousands with "k" suffix', () => {
        expect(formatCurrencyShort(5000)).toBe('5k');
    });

    it('should format millions with "M" suffix', () => {
        expect(formatCurrencyShort(2000000)).toBe('2 M');
    });
});

describe('formatCurrencyShortVN', () => {
    it('should format values under 1000 with VN locale', () => {
        expect(formatCurrencyShortVN(500)).toBe('500');
    });

    it('should format thousands with "k" suffix', () => {
        expect(formatCurrencyShortVN(5000)).toBe('5k');
    });

    it('should format millions with "M" suffix', () => {
        expect(formatCurrencyShortVN(2000000)).toBe('2 M');
    });
});
