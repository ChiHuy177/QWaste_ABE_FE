export function calculateElectricityBill(kWh: number): number {
    const baseRate = 2204.0655;

    const tiers: [number, number][] = [
        [100, 0.9],
        [100, 1.08],
        [200, 1.36],
        [300, 1.62],
        [Infinity, 1.8],
    ];

    let total = 0;
    let remaining = kWh;

    for (const [tierLimit, multiplier] of tiers) {
        if (remaining <= 0) break;

        const consumedInTier = Math.min(remaining, tierLimit);
        const pricePerkWh = baseRate * multiplier;
        total += consumedInTier * pricePerkWh;
        remaining -= consumedInTier;
    }

    const vat = total * 0.1;
    return total + vat;
}

export function formatCurrencyShort(amount: number): string {
    const rounded = Math.round(amount);

    if (rounded >= 1000000) {
        return `${(rounded / 1000000).toLocaleString('en-US')} M`;
    }
    if (rounded >= 1000) {
        return `${(rounded / 1000).toLocaleString('en-US')}k`;
    }
    return rounded.toLocaleString('en-US');
}
export function formatCurrencyShortVN(amount: number): string {
    const rounded = Math.round(amount);

    if (rounded >= 1000000) {
        return `${(rounded / 1000000).toLocaleString('vi-VN')} M`;
    }
    if (rounded >= 1000) {
        return `${(rounded / 1000).toLocaleString('vi-VN')}k`;
    }
    return rounded.toLocaleString('vi-VN');
}
