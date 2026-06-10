import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    DRAWING_CODE: { min: 2, max: 50, required: true },
    DRAWING_CODE_NAME: { min: 2, max: 100, required: true },
    OF_CUSTOMER: { max: 100, required: false },
    DESCRIPTION: { max: 2000, required: false },
});
export const getDrawingCodeFormFields = (
    t: (key: string, options?: Record<string, any>) => string,
    _mode: 'create' | 'edit'
): FormFieldConfig[] => {
    return [
        {
            name: 'drawingCode',
            label: t('drawingCodeManagement.form.fields.drawingCode'),
            type: 'text',
            maxLength: VALIDATION_CONFIG.DRAWING_CODE.max,
            placeholder: t('drawingCodeManagement.form.placeholders.drawingCode'),
            required: VALIDATION_CONFIG.DRAWING_CODE.required,
            textTransform: 'uppercase',
            rules: [
                {
                    required: VALIDATION_CONFIG.DRAWING_CODE.required,
                    message: t('drawingCodeManagement.form.validation.drawingCodeRequired'),
                },
                {
                    max: VALIDATION_CONFIG.DRAWING_CODE.max,
                    message: t('drawingCodeManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.DRAWING_CODE.max,
                    }),
                },
                {
                    whitespace: VALIDATION_CONFIG.DRAWING_CODE.required,
                    message: t('drawingCodeManagement.form.validation.noWhitespaceOnly'),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        {
            name: 'drawingCodeName',
            label: t('drawingCodeManagement.form.fields.drawingCodeName'),
            type: 'text',
            maxLength: VALIDATION_CONFIG.DRAWING_CODE_NAME.max,
            placeholder: t('drawingCodeManagement.form.placeholders.drawingCodeName'),
            required: VALIDATION_CONFIG.DRAWING_CODE_NAME.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DRAWING_CODE_NAME.required,
                    message: t('drawingCodeManagement.form.validation.nameRequired'),
                },
                {
                    max: VALIDATION_CONFIG.DRAWING_CODE_NAME.max,
                    message: t('drawingCodeManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.DRAWING_CODE_NAME.max,
                    }),
                },
                {
                    whitespace: VALIDATION_CONFIG.DRAWING_CODE_NAME.required,
                    message: t('drawingCodeManagement.form.validation.noWhitespaceOnly'),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        {
            name: 'ofCustomer',
            label: t('drawingCodeManagement.form.fields.ofCustomer'),
            type: 'text',
            placeholder: t('drawingCodeManagement.form.placeholders.ofCustomer'),
            required: VALIDATION_CONFIG.OF_CUSTOMER.required,
            maxLength: VALIDATION_CONFIG.OF_CUSTOMER.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.OF_CUSTOMER.required,
                    message: t('drawingCodeManagement.form.validation.customerRequired'),
                },
                {
                    max: VALIDATION_CONFIG.OF_CUSTOMER.max,
                    message: t('drawingCodeManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.OF_CUSTOMER.max,
                    }),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        {
            name: 'description',
            label: t('drawingCodeManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('drawingCodeManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            rows: 4,
            maxLength: VALIDATION_CONFIG.DESCRIPTION.max,
            showCount: true,
            allowClear: true,
            rules: [
                {
                    max: VALIDATION_CONFIG.DESCRIPTION.max,
                    message: t('drawingCodeManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.DESCRIPTION.max,
                    }),
                },
            ],
            span: { xs: 24 },
        },
        {
            name: 'pdfLink',
            label: t('drawingCodeManagement.form.fields.pdfLink'),
            type: 'pdf-upload',
            required: true,
            span: { xs: 24 },
            rules: [
                {
                    required: true,
                    message: t('drawingCodeManagement.form.validation.pdfRequired'),
                },
            ],
        },
    ];
};
