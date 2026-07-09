import { ProductionLine, ProductionProduct } from '@/types/ProductionPlan';

export function getEffectiveMachine(product: ProductionProduct, dayIndex: number): string {
    return product.machineOverrides?.[dayIndex] ?? product.machine;
}

export function getAllMachineNames(lines: ProductionLine[]): string[] {
    const set = new Set<string>();
    for (const line of lines) {
        for (const product of line.products) {
            set.add(product.machine);
            product.machineOverrides?.forEach((m) => m && set.add(m));
        }
    }
    return Array.from(set).sort();
}

export function getSortedProductsForDay(line: ProductionLine, dayIndex: number): ProductionProduct[] {
    const order = line.dayProductOrders?.[dayIndex];
    if (!order || order.length === 0) {
        return line.products;
    }

    return [...line.products].sort((a, b) => {
        const indexA = order.indexOf(a.code);
        const indexB = order.indexOf(b.code);

        const posA = indexA !== -1 ? indexA : Infinity;
        const posB = indexB !== -1 ? indexB : Infinity;

        if (posA !== posB) {
            return posA - posB;
        }

        return line.products.indexOf(a) - line.products.indexOf(b);
    });
}
