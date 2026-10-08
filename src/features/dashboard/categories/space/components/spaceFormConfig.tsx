import { TFunction } from 'i18next';
import { FormFieldConfig } from '@/components/shared/FormModal/types';

const VALIDATION_CONFIG = Object.freeze({
    SPACE_CODE: { min: 2, max: 10, pattern: '^[a-zA-Z0-9_-]+$', required: true },
    SPACE_NAME: { min: 5, max: 50, required: true },
    DISPLAY_ORDER: { min: 1, required: true, maxLength: 9 },
    FLOOR_PLAN_IMAGE_URL: { required: false },
    DESCRIPTION: { max: 2000, required: false },
});

export const getSpaceFormFields = (t: TFunction, _mode: 'create' | 'edit'): FormFieldConfig[] => {
    return [
        {
            name: 'spaceCode',
            label: t('spaceManagement.form.fields.code'),
            type: 'text',
            textTransform: 'uppercase',
            placeholder: t('spaceManagement.form.placeholders.code'),
            required: VALIDATION_CONFIG.SPACE_CODE.required,
            maxLength: VALIDATION_CONFIG.SPACE_CODE.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.SPACE_CODE.required,
                    message: t('spaceManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.SPACE_CODE.min,
                    message: t('spaceManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.SPACE_CODE.min,
                    }),
                },
                {
                    pattern: new RegExp(VALIDATION_CONFIG.SPACE_CODE.pattern),
                    message: t('spaceManagement.form.validation.codePattern'),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'spaceName',
            label: t('spaceManagement.form.fields.name'),
            type: 'text',
            placeholder: t('spaceManagement.form.placeholders.name', {
                defaultValue: 'Enter name...',
            }),
            required: VALIDATION_CONFIG.SPACE_NAME.required,
            maxLength: VALIDATION_CONFIG.SPACE_NAME.max,
            rules: [
                {
                    required: VALIDATION_CONFIG.SPACE_NAME.required,
                    message: t('spaceManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.SPACE_NAME.min,
                    message: t('spaceManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.SPACE_NAME.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'displayOrder',
            label: t('spaceManagement.form.fields.order'),
            type: 'number',
            placeholder: '0',
            maxLength: VALIDATION_CONFIG.DISPLAY_ORDER.maxLength,
            required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.DISPLAY_ORDER.required,
                    message: t('spaceManagement.form.validation.required', {
                        defaultValue: 'This field is required',
                    }),
                },
                {
                    type: 'number',
                    min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    message: t('spaceManagement.form.validation.minValue', {
                        min: VALIDATION_CONFIG.DISPLAY_ORDER.min,
                    }),
                },
            ],
            span: { xs: 24, sm: 12 },
        },
        {
            name: 'floorPlanImageUrl',
            label: t('spaceManagement.form.fields.floorPlanImageUrl'),
            type: 'image',
            placeholder: t('spaceManagement.form.placeholders.floorPlanImageUrl'),
            required: VALIDATION_CONFIG.FLOOR_PLAN_IMAGE_URL.required,
            extra: t('spaceManagement.form.help.floorPlanImageUrl'),
            imageUpload: {
                preserveOriginal: true,
                accept: 'image/*,.svg',
                maxFileSizeMB: 4,
                svgMaxFileSizeMB: 10,
                previewAlt: t('spaceManagement.form.fields.floorPlanImageUrl'),
                supportText: t('spaceManagement.form.upload.floorPlanImageUrlSupportText'),
            },
            span: { xs: 24 },
        },
        {
            name: 'description',
            label: t('spaceManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('spaceManagement.form.placeholders.description', {
                defaultValue: 'Optional description...',
            }),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            maxLength: VALIDATION_CONFIG.DESCRIPTION.max,
            span: { xs: 24 },
        },
    ];
};
