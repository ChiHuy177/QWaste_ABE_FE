import type { FactoryPickingSimple } from '@/types/Factory';
import { DEMO_ACCESSIBLE_FACTORIES } from '@/mockData/admin/users';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class DemoFactoryService {
    static async getFactoriesSimple(): Promise<FactoryPickingSimple[]> {
        return clone(
            DEMO_ACCESSIBLE_FACTORIES.map((factory) => ({
                factoryId: factory.factoryId,
                factoryCode: factory.factoryCode,
                factoryName: factory.factoryName,
            }))
        );
    }
}
