'use client';

import React, { useEffect, useState } from 'react';
import {
    Form,
    Input,
    Switch,
    Tooltip,
    Button,
    Divider,
    Typography,
    Select,
    Space,
    Card,
    Row,
    Col,
    message,
    theme,
} from 'antd';
import {
    DeleteOutlined,
    PlusOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { StandardStepService } from '@/services/StepService';
import { StepDTO } from '@/types/Step';
import { EntityFormModal } from '@/components/shared/FormModal';
import { getStepFormFields } from '../../step/_components/stepFormConfig';



const { Text } = Typography;

interface StepBuilderProps {
    t: (key: string, options?: any) => string;
}

export const StepBuilder = React.memo(({ t }: StepBuilderProps) => {
    const [standardSteps, setStandardSteps] = useState<StepDTO[]>([]);
    const [loadingSteps, setLoadingSteps] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const form = Form.useFormInstance();
    const currentSteps = form.getFieldValue('stepTemplates') || [];
    const { token } = theme.useToken();

    const triggerStepAddedFeedback = React.useCallback((stepName: string) => {
        setRecentlyAdded(stepName);
        setTimeout(() => setRecentlyAdded(null), 3000);

        setTimeout(() => {
            if (listRef.current) {
                listRef.current.scrollTo({
                    top: listRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 100);
    }, []);

    const formFields = React.useMemo(() => getStepFormFields(t), [t]);

    // Fetch standard steps
    const fetchSteps = async () => {
        try {
            setLoadingSteps(true);
            const steps = await StandardStepService.getAllSteps();
            setStandardSteps(steps);
        } catch (error) {
            console.error('Error fetching steps:', error);
            message.error(
                t('drawingCodeManagement.steps.fetchError', {
                    defaultValue: 'Failed to fetch standard steps',
                })
            );
        } finally {
            setLoadingSteps(false);
        }
    };

    useEffect(() => {
        fetchSteps();
    }, []);

    const handleCreateStep = async (data: any) => {
        try {
            const createdStep = await StandardStepService.createStep({
                stepName: data.stepName,
                description: data.description,
                requiresQc: data.requiresQc ?? false,
                defaultCompletionTimeSeconds: data.defaultCompletionTimeSeconds,
                materialName: data.materialName || null,
            });
            message.success(
                t('drawingCodeManagement.steps.createSuccess', {
                    defaultValue: 'Step created successfully',
                })
            );
            setIsCreateModalOpen(false);

            // Automatically add the created step to the form
            const currentStepTemplates = form.getFieldValue('stepTemplates') || [];
            form.setFieldValue('stepTemplates', [
                ...currentStepTemplates,
                {
                    stepOrder: currentStepTemplates.length + 1,
                    stepName: createdStep.stepName,
                    description: createdStep.description,
                    requiresQc: createdStep.requiresQc,
                    materialName: createdStep.materialName,
                    defaultCompletionTimeSeconds: createdStep.defaultCompletionTimeSeconds,
                },
            ]);

            // Refresh steps list
            await fetchSteps();

            // Visual feedback
            triggerStepAddedFeedback(createdStep.stepName);
        } catch (error) {
            console.error('Error creating step:', error);
            message.error(
                t('drawingCodeManagement.steps.createError', {
                    defaultValue: 'Failed to create step',
                })
            );
            throw error; // Propagate error to EntityFormModal
        }
    };

    return (
        <Form.List
            name='stepTemplates'
            rules={[
                {
                    validator: async (_, names) => {
                        if (!names || names.length < 1) {
                            return Promise.reject(
                                new Error(
                                    t('drawingCodeManagement.steps.validation.atLeastOneStep')
                                )
                            );
                        }
                        return Promise.resolve();
                    },
                },
            ]}
        >
            {
                (fields, { add, remove, move }, { errors }) => (
                    <div>
                        <Divider style={{ margin: '8px 0 12px' }} />
                        <div style={{ marginBottom: 16 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <Text strong style={{ fontSize: 14 }}>
                                    {t('drawingCodeManagement.steps.title')}{' '}
                                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                                        ({t('drawingCodeManagement.steps.minRequired')})
                                    </Text>
                                </Text>
                                {fields.length > 0 && (
                                    <Text
                                        style={{
                                            padding: '2px 8px',
                                            backgroundColor: token.colorPrimary,
                                            color: '#fff',
                                            borderRadius: 10,
                                            fontSize: 12,
                                        }}
                                    >
                                        {fields.length}
                                    </Text>
                                )}
                            </div>

                            {/* Step Picker */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <Select
                                    open={isDropdownOpen}
                                    onOpenChange={(open) => setIsDropdownOpen(open)}
                                    showSearch={{
                                        filterOption: (input, option) =>
                                            (option?.label ?? '')
                                                .toString()
                                                .toLowerCase()
                                                .includes(input.toLowerCase()),
                                    }}
                                    allowClear
                                    placeholder={
                                        fields.length === 0
                                            ? t('drawingCodeManagement.steps.placeholders.searchStep', {
                                                defaultValue: 'Search and add a standard step...',
                                            })
                                            : t(
                                                'drawingCodeManagement.steps.placeholders.searchAnotherStep',
                                                {
                                                    defaultValue: 'Search and add another step...',
                                                }
                                            )
                                    }
                                    loading={loadingSteps}
                                    style={{ width: '100%' }}
                                    options={standardSteps
                                        .filter(
                                            (step) =>
                                                !currentSteps.some(
                                                    (cs: any) => cs?.stepName === step.stepName
                                                )
                                        )
                                        .map((step) => ({
                                            label: step.stepName,
                                            value: step.standardStepId,
                                            stepData: step,
                                        }))}
                                    value={null}
                                    onChange={(value, option: any) => {
                                        if (value && option?.stepData) {
                                            const step = option.stepData as StepDTO;
                                            add({
                                                stepOrder: fields.length + 1,
                                                stepName: step.stepName,
                                                description: step.description,
                                                requiresQc: step.requiresQc,
                                                materialName: step.materialName,
                                                defaultCompletionTimeSeconds:
                                                    step.defaultCompletionTimeSeconds,
                                            });
                                            triggerStepAddedFeedback(step.stepName);
                                        }
                                    }}
                                    popupRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: '8px 0' }} />
                                            <Space style={{ padding: '0 8px 4px' }}>
                                                <Button
                                                    type="text"
                                                    icon={<PlusOutlined />}
                                                    onClick={() => setIsCreateModalOpen(true)}
                                                >
                                                    {t(
                                                        'drawingCodeManagement.steps.createNewStandardStep',
                                                        { defaultValue: 'Create new standard step' }
                                                    )}
                                                </Button>
                                            </Space>
                                        </>
                                    )}
                                />
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsDropdownOpen(true)}
                                    style={{ flexShrink: 0 }}
                                >
                                    {t('drawingCodeManagement.steps.addStep', {
                                        defaultValue: 'Add Step',
                                    })}
                                </Button>
                            </div>
                            {
                                recentlyAdded && (
                                    <Text
                                        type="success"
                                        style={{
                                            display: 'block',
                                            marginTop: 8,
                                            fontSize: 13,
                                            color: token.colorSuccess,
                                        }}
                                    >
                                        {t('drawingCodeManagement.steps.addedSuccess', {
                                            stepName: recentlyAdded,
                                        })}
                                    </Text>
                                )
                            }
                            {
                                fields.length > 0 && !recentlyAdded && (
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: 12,
                                            marginTop: 6,
                                            display: 'block',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        {t('drawingCodeManagement.steps.continueAddingHint')}
                                    </Text>
                                )
                            }
                        </div >

                        {/* Step Cards List */}
                        < div
                            ref={listRef}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                maxHeight: 400,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                paddingRight: 8,
                                paddingBottom: 8,
                            }
                            }
                        >
                            {
                                fields.map((field, index) => (
                                    <Card
                                        key={field.key}
                                        size="small"
                                        styles={{
                                            header: {
                                                backgroundColor: token.colorBgLayout,
                                                padding: '0 12px',
                                            },
                                            body: { padding: '12px' },
                                        }}
                                        title={
                                            <Space>
                                                <MenuOutlined
                                                    style={{
                                                        color: token.colorTextQuaternary,
                                                        cursor: 'grab',
                                                    }}
                                                />
                                                <Text strong style={{ color: token.colorPrimary }}>
                                                    {t('drawingCodeManagement.steps.stepLabel', {
                                                        number: index + 1,
                                                    })}
                                                </Text>
                                            </Space>
                                        }
                                        extra={
                                            <Space size="small">
                                                <Tooltip
                                                    title={t('common.moveUp', { defaultValue: 'Move Up' })}
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<ArrowUpOutlined />}
                                                        disabled={index === 0}
                                                        onClick={() => move(index, index - 1)}
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    title={t('common.moveDown', {
                                                        defaultValue: 'Move Down',
                                                    })}
                                                >
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<ArrowDownOutlined />}
                                                        disabled={index === fields.length - 1}
                                                        onClick={() => move(index, index + 1)}
                                                    />
                                                </Tooltip>
                                                <Tooltip title={t('common.delete')}>
                                                    <Button
                                                        danger
                                                        type="text"
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => remove(index)}
                                                    />
                                                </Tooltip>
                                            </Space>
                                        }
                                    >
                                        <Row gutter={[16, 8]}>
                                            {formFields.map((fieldConfigOriginal) => {
                                                const fieldConfig = { ...fieldConfigOriginal };
                                                if (fieldConfig.name === 'materialName') {
                                                    fieldConfig.type = 'text';
                                                }

                                                let InputComponent;
                                                if (fieldConfig.type === 'text') {
                                                    InputComponent = (
                                                        <Input
                                                            placeholder={fieldConfig.placeholder}
                                                            maxLength={fieldConfig.maxLength}
                                                        />
                                                    );
                                                } else if (fieldConfig.type === 'textarea') {
                                                    InputComponent = (
                                                        <Input.TextArea
                                                            placeholder={fieldConfig.placeholder}
                                                            maxLength={fieldConfig.maxLength}
                                                            rows={fieldConfig.rows || 2}
                                                        />
                                                    );
                                                } else if (fieldConfig.type === 'switch') {
                                                    InputComponent = <Switch />;
                                                } else if (
                                                    fieldConfig.type === 'custom' &&
                                                    fieldConfig.renderCustom
                                                ) {
                                                    InputComponent = fieldConfig.renderCustom(
                                                        fieldConfig.name
                                                    );
                                                } else {
                                                    InputComponent = <Input />;
                                                }

                                                let fieldSpan = {
                                                    xs: fieldConfig.span?.xs ?? 24,
                                                    sm: fieldConfig.span?.sm,
                                                    md: fieldConfig.span?.md,
                                                    lg: fieldConfig.span?.lg,
                                                };
                                                let fieldRules = fieldConfig.rules || [];

                                                if (
                                                    fieldConfig.name === 'stepName' ||
                                                    fieldConfig.name === 'materialName'
                                                ) {
                                                    fieldSpan = { ...fieldSpan, xs: 24, md: 12 };
                                                }

                                                if (fieldConfig.name === 'materialName') {
                                                    const hasRequired = fieldRules.some(
                                                        (r: any) => r.required
                                                    );
                                                    if (!hasRequired) {
                                                        fieldRules = [
                                                            {
                                                                required: true,
                                                                message: t(
                                                                    'drawingCodeManagement.steps.validation.materialRequired'
                                                                ),
                                                            },
                                                            ...fieldRules,
                                                        ];
                                                    }
                                                }

                                                return (
                                                    <Col
                                                        key={fieldConfig.name}
                                                        {...fieldSpan}
                                                        style={
                                                            fieldConfig.type === 'switch'
                                                                ? { display: 'flex', alignItems: 'center' }
                                                                : undefined
                                                        }
                                                    >
                                                        <Form.Item
                                                            {...field}
                                                            label={fieldConfig.label}
                                                            name={[field.name, fieldConfig.name]}
                                                            rules={fieldRules}
                                                            valuePropName={
                                                                fieldConfig.type === 'switch'
                                                                    ? 'checked'
                                                                    : 'value'
                                                            }
                                                            style={{
                                                                marginBottom:
                                                                    fieldConfig.type === 'switch' ? 0 : 8,
                                                            }}
                                                        >
                                                            {InputComponent}
                                                        </Form.Item>
                                                    </Col>
                                                );
                                            })}
                                        </Row>

                                        {/* Hidden field for stepOrder to ensure it's submitted if needed, though usually calculated on backend */}
                                        <Form.Item {...field} name={[field.name, 'stepOrder']} hidden>
                                            <Input />
                                        </Form.Item>
                                    </Card>
                                ))
                            }
                        </div >

                        {
                            fields.length === 0 && (
                                <div
                                    style={{
                                        padding: '24px 0',
                                        textAlign: 'center',
                                        color:
                                            errors.length > 0
                                                ? token.colorError
                                                : token.colorTextQuaternary,
                                    }}
                                >
                                    {t('drawingCodeManagement.steps.emptyHint')}
                                </div>
                            )
                        }

                        {fields.length > 0 && <Form.ErrorList errors={errors} />}

                        {/* Create Standard Step Modal */}
                        <EntityFormModal<any>
                            open={isCreateModalOpen}
                            onOpenChange={setIsCreateModalOpen}
                            onSubmit={handleCreateStep}
                            mode="create"
                            initialData={{ requiresQc: false }}
                            fields={formFields}
                            title={{
                                create: t('stepManagement.form.createTitle', {
                                    defaultValue: 'Create New Standard Step',
                                }),
                                edit: '',
                            }}
                            description={{
                                create: t('stepManagement.form.createDescription', {
                                    defaultValue: 'Add a new standard step to the library.',
                                }),
                                edit: '',
                            }}
                            buttonLabels={{
                                cancel: t('common.cancel', { defaultValue: 'Cancel' }),
                                create: t('common.create', { defaultValue: 'Create' }),
                                edit: '',
                                saving: t('common.saving', { defaultValue: 'Saving...' }),
                            }}
                            width={{ xs: '90%', sm: '80vh', md: '80vh' }}
                            t={t}
                        />
                    </div >
                )}
        </Form.List >
    );
});
