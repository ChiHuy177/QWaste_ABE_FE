import { TFunction } from 'i18next';
import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { OperationType } from '@/types/OperationType';
import { MoldType } from '@/types/Mold';

const VALIDATION = Object.freeze({
    MOLD_CODE: { max: 50 },
    MOLD_NAME: { max: 100 },
    DESCRIPTION: { max: 2000 },
    CONVERSION_FACTOR: { min: 1 },
});

export const getMoldFormFields = (
    t: TFunction,
    mode: 'create' | 'edit',
    operationTypeOptions: { value: number; label: string }[] = [],
    isLoadingOperationTypes: boolean = false,
    selectedMoldType: MoldType = 'PRODUCTS_PER_SHOT',
    onMoldTypeChange?: (moldType: MoldType) => void
): FormFieldConfig[] => {
    const isShotsPerProduct = selectedMoldType === 'SHOTS_PER_PRODUCT';
    const factorLabel = isShotsPerProduct
        ? t('moldManagement.form.fields.conversionFactor_SHOTS_PER_PRODUCT')
        : t('moldManagement.form.fields.conversionFactor_PRODUCTS_PER_SHOT');
    const factorPlaceholder = isShotsPerProduct
        ? t('moldManagement.form.placeholders.conversionFactor_SHOTS_PER_PRODUCT')
        : t('moldManagement.form.placeholders.conversionFactor_PRODUCTS_PER_SHOT');
    const factorExtra = isShotsPerProduct
        ? t('moldManagement.form.helpers.conversionFactor_SHOTS_PER_PRODUCT')
        : t('moldManagement.form.helpers.conversionFactor_PRODUCTS_PER_SHOT');

    return [
        {
            name: 'moldCode',
            label: t('moldManagement.form.fields.moldCode'),
            type: 'text',
            placeholder: t('moldManagement.form.placeholders.moldCode'),
            required: true,
            maxLength: VALIDATION.MOLD_CODE.max,
            textTransform: 'uppercase',
            disabled: mode === 'edit',
            rules: [
                { required: true, message: t('moldManagement.form.validation.required') },
                {
                    max: VALIDATION.MOLD_CODE.max,
                    message: t('moldManagement.form.validation.maxLength', {
                        max: VALIDATION.MOLD_CODE.max,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'moldName',
            label: t('moldManagement.form.fields.moldName'),
            type: 'text',
            placeholder: t('moldManagement.form.placeholders.moldName'),
            required: true,
            maxLength: VALIDATION.MOLD_NAME.max,
            rules: [
                { required: true, message: t('moldManagement.form.validation.required') },
                {
                    max: VALIDATION.MOLD_NAME.max,
                    message: t('moldManagement.form.validation.maxLength', {
                        max: VALIDATION.MOLD_NAME.max,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'moldType',
            label: t('moldManagement.form.fields.moldType'),
            type: 'select',
            placeholder: t('moldManagement.form.placeholders.moldType'),
            required: true,
            defaultValue: 'PRODUCTS_PER_SHOT',
            options: [
                {
                    value: 'PRODUCTS_PER_SHOT',
                    label: t('moldManagement.moldTypes.productsPerShot'),
                },
                {
                    value: 'SHOTS_PER_PRODUCT',
                    label: t('moldManagement.moldTypes.shotsPerProduct'),
                },
            ],
            onChange: (value: MoldType) => {
                onMoldTypeChange?.(value);
            },
            rules: [{ required: true, message: t('moldManagement.form.validation.required') }],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'conversionFactor',
            label: factorLabel,
            type: 'number',
            placeholder: factorPlaceholder,
            extra: factorExtra,
            required: true,
            min: VALIDATION.CONVERSION_FACTOR.min,
            rules: [
                { required: true, message: t('moldManagement.form.validation.required') },
                {
                    type: 'number',
                    min: VALIDATION.CONVERSION_FACTOR.min,
                    message: t('moldManagement.form.validation.minConversionFactor', {
                        min: VALIDATION.CONVERSION_FACTOR.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'operationTypeId',
            label: t('moldManagement.form.fields.operationType'),
            type: 'select',
            placeholder: t('moldManagement.form.placeholders.operationType'),
            required: true,
            loading: isLoadingOperationTypes,
            options: operationTypeOptions,
            rules: [{ required: true, message: t('moldManagement.form.validation.required') }],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'description',
            label: t('moldManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('moldManagement.form.placeholders.description'),
            required: false,
            maxLength: VALIDATION.DESCRIPTION.max,
            showCount: true,
            rows: 4,
            rules: [
                {
                    max: VALIDATION.DESCRIPTION.max,
                    message: t('moldManagement.form.validation.maxLength', {
                        max: VALIDATION.DESCRIPTION.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },
    ];
};

export const toOperationTypeOptions = (operationTypes: OperationType[]) =>
    operationTypes.map((operationType) => ({
        value: operationType.operationTypeId,
        label: `${operationType.operationTypeCode} — ${operationType.operationTypeName}`,
    }));
