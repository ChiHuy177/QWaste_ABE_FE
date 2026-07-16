import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { OperationType } from '@/types/OperationType';

const VALIDATION = Object.freeze({
    MOLD_CODE: { max: 50 },
    MOLD_NAME: { max: 100 },
    DESCRIPTION: { max: 2000 },
    OUTPUT_PER_SHOT: { min: 1 },
});

export const getMoldFormFields = (
    t: (key: string, options?: any) => string,
    mode: 'create' | 'edit',
    operationTypeOptions: { value: number; label: string }[] = [],
    isLoadingOperationTypes: boolean = false
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
        name: 'outputPerShot',
        label: t('moldManagement.form.fields.outputPerShot'),
        type: 'number',
        placeholder: t('moldManagement.form.placeholders.outputPerShot'),
        required: true,
        min: VALIDATION.OUTPUT_PER_SHOT.min,
        rules: [
            { required: true, message: t('moldManagement.form.validation.required') },
            {
                type: 'number',
                min: VALIDATION.OUTPUT_PER_SHOT.min,
                message: t('moldManagement.form.validation.minOutputPerShot', {
                    min: VALIDATION.OUTPUT_PER_SHOT.min,
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

export const toOperationTypeOptions = (operationTypes: OperationType[]) =>
    operationTypes.map((operationType) => ({
        value: operationType.operationTypeId,
        label: `${operationType.operationTypeCode} — ${operationType.operationTypeName}`,
    }));
