import { getMoldFormFields } from './moldFormConfig';
import type { MoldType } from '@/types/Mold';

describe('moldFormConfig — getMoldFormFields', () => {
    const mockT = jest.fn((key: string) => key);
    const mockOptions = [{ value: 1, label: 'Ép' }];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('tạo cấu hình form với loại khuôn mặc định PRODUCTS_PER_SHOT', () => {
        const fields = getMoldFormFields(
            mockT as any,
            'create',
            mockOptions,
            false,
            'PRODUCTS_PER_SHOT'
        );

        const moldTypeField = fields.find((f) => f.name === 'moldType');
        expect(moldTypeField).toBeDefined();
        expect(moldTypeField?.type).toBe('select');
        expect(moldTypeField?.options).toEqual([
            { value: 'PRODUCTS_PER_SHOT', label: 'moldManagement.moldTypes.productsPerShot' },
            { value: 'SHOTS_PER_PRODUCT', label: 'moldManagement.moldTypes.shotsPerProduct' },
        ]);

        const factorField = fields.find((f) => f.name === 'conversionFactor');
        expect(factorField).toBeDefined();
        expect(factorField?.type).toBe('number');
        expect(factorField?.label).toBe(
            'moldManagement.form.fields.conversionFactor_PRODUCTS_PER_SHOT'
        );
        expect(factorField?.placeholder).toBe(
            'moldManagement.form.placeholders.conversionFactor_PRODUCTS_PER_SHOT'
        );
        expect(factorField?.extra).toBe(
            'moldManagement.form.helpers.conversionFactor_PRODUCTS_PER_SHOT'
        );
        expect(factorField?.min).toBe(1);
    });

    it('chuyển đổi label và placeholder tương ứng khi loại khuôn là SHOTS_PER_PRODUCT', () => {
        const fields = getMoldFormFields(
            mockT as any,
            'create',
            mockOptions,
            false,
            'SHOTS_PER_PRODUCT'
        );

        const factorField = fields.find((f) => f.name === 'conversionFactor');
        expect(factorField).toBeDefined();
        expect(factorField?.label).toBe(
            'moldManagement.form.fields.conversionFactor_SHOTS_PER_PRODUCT'
        );
        expect(factorField?.placeholder).toBe(
            'moldManagement.form.placeholders.conversionFactor_SHOTS_PER_PRODUCT'
        );
        expect(factorField?.extra).toBe(
            'moldManagement.form.helpers.conversionFactor_SHOTS_PER_PRODUCT'
        );
    });

    it('gọi callback onMoldTypeChange khi giá trị moldType thay đổi', () => {
        const mockChange = jest.fn();
        const fields = getMoldFormFields(
            mockT as any,
            'create',
            mockOptions,
            false,
            'PRODUCTS_PER_SHOT',
            mockChange
        );

        const moldTypeField = fields.find((f) => f.name === 'moldType');
        moldTypeField?.onChange?.('SHOTS_PER_PRODUCT' as MoldType);

        expect(mockChange).toHaveBeenCalledWith('SHOTS_PER_PRODUCT');
    });

    it('vô hiệu hóa trường moldCode ở chế độ edit', () => {
        const createFields = getMoldFormFields(mockT as any, 'create', mockOptions);
        const editFields = getMoldFormFields(mockT as any, 'edit', mockOptions);

        const createMoldCode = createFields.find((f) => f.name === 'moldCode');
        const editMoldCode = editFields.find((f) => f.name === 'moldCode');

        expect(createMoldCode?.disabled).toBe(false);
        expect(editMoldCode?.disabled).toBe(true);
    });
});
