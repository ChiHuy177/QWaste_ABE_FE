import { FormFieldConfig } from '@/components/shared/FormModal/types';
import { SelectOption } from '@/types/Common';
import { OperationType } from '@/types/OperationType';

const VALIDATION_CONFIG = Object.freeze({
    MACHINE_NAME: { required: true, minLength: 2, maxLength: 50 },
    MACHINE_CODE: { required: true, maxLength: 50 },
    POWER: { required: true, min: 0.1, maxLength: 10 },
    DESCRIPTION: { required: true, maxLength: 255 },
    TOPIC: { required: true, maxLength: 255 },
    LINE_ID: { required: true },
    MACHINE_TYPE_ID: { required: true },
    OPERATION_TYPE: { required: true },
    MACHINE_IMAGE: { required: true },
});

export const getMachineListFormFields = (
    t: any,
    mode: 'create' | 'edit',
    operationTypeOptions: SelectOption[] = [],
    isLoadingOperationTypes: boolean = false
): FormFieldConfig[] => {
    return [
        // Machine Name
        {
            name: 'machineName',
            label: t('machineListManagement.form.fields.machineName'),
            type: 'text',
            placeholder: t('machineListManagement.form.placeholders.machineName'),
            required: VALIDATION_CONFIG.MACHINE_NAME.required,
            maxLength: VALIDATION_CONFIG.MACHINE_NAME.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.MACHINE_NAME.required,
                    message: t('machineListManagement.form.validation.required'),
                },
                {
                    min: VALIDATION_CONFIG.MACHINE_NAME.minLength,
                    message: t('machineListManagement.form.validation.minLength', {
                        min: VALIDATION_CONFIG.MACHINE_NAME.minLength,
                    }),
                },
                {
                    max: VALIDATION_CONFIG.MACHINE_NAME.maxLength,
                    message: t('machineListManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.MACHINE_NAME.maxLength,
                    }),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        {
            name: 'machineCode',
            label: t('machineListManagement.form.fields.machineCode'),
            type: 'text',
            placeholder: t('machineListManagement.form.placeholders.machineCode'),
            required: VALIDATION_CONFIG.MACHINE_CODE.required,
            maxLength: VALIDATION_CONFIG.MACHINE_CODE.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.MACHINE_CODE.required,
                    message: t('machineListManagement.form.validation.required'),
                },
                {
                    max: VALIDATION_CONFIG.MACHINE_CODE.maxLength,
                    message: t('machineListManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.MACHINE_CODE.maxLength,
                    }),
                },
            ],
            span: { xs: 24, md: 8 },
        },
        {
            name: 'power',
            label: t('machineListManagement.form.fields.power'),
            type: 'number',
            allowDecimal: true,
            decimalPlaces: 1,
            placeholder: t('machineListManagement.form.placeholders.power'),
            required: VALIDATION_CONFIG.POWER.required,
            maxLength: VALIDATION_CONFIG.POWER.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.POWER.required,
                    message: t('machineListManagement.form.validation.required'),
                },
                {
                    type: 'number',
                    min: 0.1,
                    message: t('machineListManagement.form.validation.minValue', { min: 0.1 }),
                },
            ],
            span: { xs: 24, md: 8 },
        },
        {
            name: 'topic',
            label: t('machineListManagement.form.fields.topic'),
            type: 'text' as const,
            placeholder: t('machineListManagement.form.placeholders.topic'),
            required: VALIDATION_CONFIG.TOPIC.required,
            disabled: mode === 'edit',
            maxLength: VALIDATION_CONFIG.TOPIC.maxLength,
            rules: [
                {
                    required: VALIDATION_CONFIG.TOPIC.required,
                    message: t('machineListManagement.form.validation.required'),
                },
                {
                    max: VALIDATION_CONFIG.TOPIC.maxLength,
                    message: t('machineListManagement.form.validation.maxLength', {
                        max: VALIDATION_CONFIG.TOPIC.maxLength,
                    }),
                },
            ],
            span: { xs: 24, md: 8 },
        },

        {
            name: 'operationTypeId',
            label: t('machineListManagement.form.fields.operationType'),
            type: 'select',
            placeholder: t('machineListManagement.form.placeholders.operationType'),
            required: VALIDATION_CONFIG.OPERATION_TYPE.required,
            options: operationTypeOptions,
            loading: isLoadingOperationTypes,
            disabled: isLoadingOperationTypes,
            rules: [
                {
                    required: VALIDATION_CONFIG.OPERATION_TYPE.required,
                    message: t('machineListManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        // Line
        {
            name: 'spaceId',
            label: t('machineListManagement.form.fields.space'),
            type: 'space-tree-select',
            placeholder: t('machineListManagement.form.placeholders.space'),
            required: true,
            rules: [
                {
                    required: true,
                    message: t('machineListManagement.form.validation.required'),
                },
            ],
            span: { xs: 24, md: 12 },
        },
        // Description
        {
            name: 'description',
            label: t('machineListManagement.form.fields.description'),
            type: 'textarea',
            placeholder: t('machineListManagement.form.placeholders.description'),
            required: VALIDATION_CONFIG.DESCRIPTION.required,
            maxLength: VALIDATION_CONFIG.DESCRIPTION.maxLength,
            rows: 4,
            rules: [
                {
                    required: VALIDATION_CONFIG.DESCRIPTION.required,
                    message: t('machineListManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
        // Machine Image
        {
            name: 'machineImage',
            label: t('machineListManagement.form.fields.machineImage'),
            type: 'image',
            placeholder: t('machineListManagement.form.placeholders.machineImage'),
            required: VALIDATION_CONFIG.MACHINE_IMAGE.required,
            rules: [
                {
                    required: VALIDATION_CONFIG.MACHINE_IMAGE.required,
                    message: t('machineListManagement.form.validation.required'),
                },
            ],
            span: { xs: 24 },
        },
    ];
};

export const toOperationTypeOptions = (operationTypes: OperationType[]): SelectOption[] =>
    operationTypes.map((operationType) => ({
        value: operationType.operationTypeId,
        label: `${operationType.operationTypeCode} — ${operationType.operationTypeName}`,
    }));
