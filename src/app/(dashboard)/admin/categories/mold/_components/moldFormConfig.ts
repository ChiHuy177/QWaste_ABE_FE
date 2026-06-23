import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION = Object.freeze({
    MOLD_CODE: { max: 50 },
    MOLD_NAME: { max: 255 },
    DESCRIPTION: { max: 2000 },
    QUANTITY: { min: 1 },
});

export const getMoldFormFields = (
    t: (key: string, options?: any) => string,
    mode: 'create' | 'edit'
): FormFieldConfig[] => [
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
        name: 'quantity',
        label: t('moldManagement.form.fields.quantity'),
        type: 'number',
        placeholder: t('moldManagement.form.placeholders.quantity'),
        required: true,
        min: VALIDATION.QUANTITY.min,
        rules: [
            { required: true, message: t('moldManagement.form.validation.required') },
            {
                type: 'number',
                min: VALIDATION.QUANTITY.min,
                message: t('moldManagement.form.validation.minQuantity', {
                    min: VALIDATION.QUANTITY.min,
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
        options: [
            { value: 'PRESS', label: t('moldManagement.moldType.PRESS') },
            { value: 'COMPRESS', label: t('moldManagement.moldType.COMPRESS') },
        ],
        rules: [{ required: true, message: t('moldManagement.form.validation.required') }],
        span: { xs: 24, sm: 12 },
    },
    {
        name: 'status',
        label: t('moldManagement.form.fields.status'),
        type: 'select',
        placeholder: t('moldManagement.form.placeholders.status'),
        required: true,
        options: [
            { value: 'ACTIVE', label: t('moldManagement.status.ACTIVE') },
            { value: 'MAINTENANCE', label: t('moldManagement.status.MAINTENANCE') },
            { value: 'RETIRED', label: t('moldManagement.status.RETIRED') },
        ],
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
