import {
    MOCK_FACTORY_INDUSTRY_FILTERS,
    MOCK_FACTORY_MTBF_DATA,
    MOCK_FACTORY_MTTR_DATA,
    MOCK_FACTORY_OVERVIEW,
    MOCK_FACTORY_SPACES,
    MOCK_MACHINE_ERROR_DETAILS,
    MOCK_MACHINE_STATUS_SUMMARY,
} from './factoryOverview';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export class DemoFactoryOverviewService {
    static async getSpaces() {
        return clone(MOCK_FACTORY_SPACES);
    }

    static async getIndustryFilters() {
        return clone(MOCK_FACTORY_INDUSTRY_FILTERS);
    }

    static async getSpaceOverview() {
        return clone(MOCK_FACTORY_OVERVIEW);
    }

    static async getSpaceOverviewByDateRange() {
        return clone(MOCK_FACTORY_OVERVIEW);
    }

    static async getMtbf() {
        return clone(MOCK_FACTORY_MTBF_DATA);
    }

    static async getMttr() {
        return clone(MOCK_FACTORY_MTTR_DATA);
    }

    static async getMachineStatusSummary() {
        return clone(MOCK_MACHINE_STATUS_SUMMARY);
    }

    static async getErrorDetail(machineId: string) {
        return clone(MOCK_MACHINE_ERROR_DETAILS[machineId] ?? { totalErrorHours: 0, errors: [] });
    }
}
