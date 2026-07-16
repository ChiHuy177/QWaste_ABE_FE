import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION = Object.freeze({
    OPERATION_TYPE_CODE: { max: 50 },
    OPERATION_TYPE_NAME: { max: 100 },
    DESCRIPTION: { max: 2000 },
});

export const getOperationTypeFormFields = (
    t: (key: string, options?: any) => string,
    mode: 'create' | 'edit'
): FormFieldConfig[] => [
    {
        name: 'operationTypeCode',
        label: t('operationTypeManagement.form.fields.operationTypeCode'),
        type: 'text',
        placeholder: t('operationTypeManagement.form.placeholders.operationTypeCode'),
        required: true,
        maxLength: VALIDATION.OPERATION_TYPE_CODE.max,
        textTransform: 'uppercase',
        disabled: mode === 'edit',
        rules: [
            { required: true, message: t('operationTypeManagement.form.validation.required') },
            {
                max: VALIDATION.OPERATION_TYPE_CODE.max,
                message: t('operationTypeManagement.form.validation.maxLength', {
                    max: VALIDATION.OPERATION_TYPE_CODE.max,
                }),
            },
        ],
        span: { xs: 24, sm: 12 },
    },
    {
        name: 'operationTypeName',
        label: t('operationTypeManagement.form.fields.operationTypeName'),
        type: 'text',
        placeholder: t('operationTypeManagement.form.placeholders.operationTypeName'),
        required: true,
        maxLength: VALIDATION.OPERATION_TYPE_NAME.max,
        rules: [
            { required: true, message: t('operationTypeManagement.form.validation.required') },
            {
                max: VALIDATION.OPERATION_TYPE_NAME.max,
                message: t('operationTypeManagement.form.validation.maxLength', {
                    max: VALIDATION.OPERATION_TYPE_NAME.max,
                }),
            },
        ],
        span: { xs: 24, sm: 12 },
    },
    {
        name: 'description',
        label: t('operationTypeManagement.form.fields.description'),
        type: 'textarea',
        placeholder: t('operationTypeManagement.form.placeholders.description'),
        required: false,
        maxLength: VALIDATION.DESCRIPTION.max,
        showCount: true,
        rows: 4,
        rules: [
            {
                max: VALIDATION.DESCRIPTION.max,
                message: t('operationTypeManagement.form.validation.maxLength', {
                    max: VALIDATION.DESCRIPTION.max,
                }),
            },
        ],
        span: { xs: 24 },
    },
];
