import type {
    IndustryFilter,
    IndustryFilterFormData,
    IndustryFilterUpdateData,
} from '@/types/IndustryFilter';
import { MOCK_FACTORY_INDUSTRY_FILTERS } from './factoryOverview';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const auditMetaData = {
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-27T10:30:00.000Z',
    createdBy: 'Demo Admin',
    updatedBy: 'Demo Admin',
};

const demoIndustryFilters: IndustryFilter[] = MOCK_FACTORY_INDUSTRY_FILTERS.map((filter) => ({
    ...filter,
    startTime: filter.startTime.slice(0, 5),
    endTime: filter.endTime.slice(0, 5),
    auditMetaData,
}));

const getNextFilterId = () =>
    Math.max(...demoIndustryFilters.map((filter) => filter.filterId), 0) + 1;

const findFilter = (filterId: number) => {
    const filter = demoIndustryFilters.find((item) => item.filterId === filterId);
    if (!filter) {
        throw new Error('Demo industry filter was not found');
    }

    return filter;
};

const isCrossMidnight = (startTime: string, endTime: string) => endTime < startTime;

const createPeriodCode = (filterData: IndustryFilterFormData, filterId: number) =>
    filterData.shortNameEn?.trim()
        ? filterData.shortNameEn.trim().toUpperCase().replace(/\s+/g, '_')
        : `CUSTOM_${filterId}`;

const touchFilter = (filter: IndustryFilter) => {
    filter.auditMetaData = {
        ...(filter.auditMetaData ?? auditMetaData),
        updatedAt: new Date().toISOString(),
        updatedBy: 'Demo Admin',
    };
};

export class DemoIndustryFilterService {
    static async getAllIndustryFilters(): Promise<IndustryFilter[]> {
        return clone(
            [...demoIndustryFilters].sort((left, right) => left.sortOrder - right.sortOrder)
        );
    }

    static async getIndustryFilterById(filterId: number): Promise<IndustryFilter> {
        return clone(findFilter(filterId));
    }

    static async getPrimaryIndustryFilters(): Promise<IndustryFilter[]> {
        return clone(
            demoIndustryFilters
                .filter((filter) => filter.isPrimary)
                .sort((left, right) => left.sortOrder - right.sortOrder)
        );
    }

    static async getShiftFilters(): Promise<IndustryFilter[]> {
        return clone(
            demoIndustryFilters
                .filter((filter) => filter.category === 'SHIFT')
                .sort((left, right) => left.sortOrder - right.sortOrder)
        );
    }

    static async createIndustryFilter(filterData: IndustryFilterFormData): Promise<IndustryFilter> {
        const filterId = getNextFilterId();
        const filter: IndustryFilter = {
            filterId,
            category: 'PERIOD',
            periodCode: createPeriodCode(filterData, filterId),
            shiftNumber: null,
            startTime: filterData.startTime,
            endTime: filterData.endTime,
            crossesMidnight: isCrossMidnight(filterData.startTime, filterData.endTime),
            displayNameEn: filterData.displayNameEn,
            displayNameVi: filterData.displayNameVi,
            shortNameEn: filterData.shortNameEn ?? null,
            isPrimary: false,
            sortOrder: filterData.sortOrder ?? demoIndustryFilters.length + 1,
            auditMetaData: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'Demo Admin',
                updatedBy: 'Demo Admin',
            },
        };

        demoIndustryFilters.push(filter);

        return clone(filter);
    }

    static async updateIndustryFilter(filterData: IndustryFilterUpdateData): Promise<string> {
        const filter = findFilter(filterData.filterId);

        filter.displayNameEn = filterData.displayNameEn;
        filter.displayNameVi = filterData.displayNameVi;
        filter.shortNameEn = filterData.shortNameEn ?? null;
        filter.startTime = filterData.startTime;
        filter.endTime = filterData.endTime;
        filter.crossesMidnight = isCrossMidnight(filterData.startTime, filterData.endTime);
        filter.sortOrder = filterData.sortOrder ?? filter.sortOrder;
        touchFilter(filter);

        return 'Demo industry filter updated';
    }

    static async deleteIndustryFilter(filterId: number): Promise<void> {
        const targetIndex = demoIndustryFilters.findIndex((filter) => filter.filterId === filterId);
        if (targetIndex === -1) {
            throw new Error('Demo industry filter was not found');
        }

        demoIndustryFilters.splice(targetIndex, 1);
    }
}
