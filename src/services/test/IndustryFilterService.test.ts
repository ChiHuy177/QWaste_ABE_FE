const mockRequestJson = jest.fn();

jest.mock('../NetworkService', () => ({
    NetworkService: { requestJson: (...args: unknown[]) => mockRequestJson(...args) },
}));

import { IndustryFilterService } from '../IndustryFilterService';

describe('IndustryFilterService picking', () => {
    beforeEach(() => mockRequestJson.mockReset());

    it('dropdown dùng picking và sắp xếp kỳ mặc định theo sortOrder, giữ nguyên dữ liệu nguồn', async () => {
        const later = { filterId: 2, displayNameVi: 'Ca 2', displayNameEn: 'Shift 2', sortOrder: 20 };
        const first = { filterId: 1, displayNameVi: 'Hôm nay', displayNameEn: 'Today', sortOrder: 10 };
        const rows = [later, first];
        mockRequestJson.mockResolvedValue({ result: rows });

        const result = await IndustryFilterService.getIndustryFiltersForPicking();

        expect(mockRequestJson).toHaveBeenCalledWith({
            method: 'GET',
            url: '/api/industryFilters/v1/picking',
        });
        expect(result).toEqual([first, later]);
        expect(rows).toEqual([later, first]);
    });

    it('danh sách rỗng không tự chọn kỳ thời gian', async () => {
        mockRequestJson.mockResolvedValue({ result: [] });

        await expect(IndustryFilterService.getIndustryFiltersForPicking()).resolves.toEqual([]);
    });

    it('lỗi backend được trả về caller để kết thúc loading và báo lỗi', async () => {
        const error = new Error('Unavailable');
        mockRequestJson.mockRejectedValue(error);

        await expect(IndustryFilterService.getIndustryFiltersForPicking()).rejects.toBe(error);
    });
});
