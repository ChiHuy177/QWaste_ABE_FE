const mockRequestJson = jest.fn();

jest.mock('../NetworkService', () => ({
    NetworkService: { requestJson: (...args: unknown[]) => mockRequestJson(...args) },
}));

import { OperationTypeService } from '../OperationTypeService';

describe('OperationTypeService picking', () => {
    beforeEach(() => mockRequestJson.mockReset());

    it('dropdown gọi picking dành cho người đăng nhập thay vì danh sách Super Admin', async () => {
        const rows = [{ operationTypeId: 7, operationTypeCode: 'PRESS', operationTypeName: 'Ép' }];
        mockRequestJson.mockResolvedValue({ result: rows });

        await expect(OperationTypeService.getOperationTypesForPicking()).resolves.toEqual(rows);
        expect(mockRequestJson).toHaveBeenCalledWith({
            method: 'GET',
            url: '/api/operationTypes/v1/picking',
        });
    });

    it('lỗi quyền từ backend được trả về caller để xử lý', async () => {
        const error = new Error('Forbidden');
        mockRequestJson.mockRejectedValue(error);

        await expect(OperationTypeService.getOperationTypesForPicking()).rejects.toBe(error);
    });
});
