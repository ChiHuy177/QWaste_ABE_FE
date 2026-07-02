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
