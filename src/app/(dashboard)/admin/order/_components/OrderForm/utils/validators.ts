import { Rule } from 'antd/es/form';

export interface PlanTreeValidationError {
    name: (string | number)[];
    message: string;
    nodeKey: string;
}

const translate = (t: any | undefined, key: string, options: Record<string, any> = {}) =>
    t ? t(key, options) : key;

export const getDrawingTaskRequestedQuantityTotal = (drawing: any): number => {
    return (drawing?.orderSteps || []).reduce((drawingTotal: number, step: any) => {
        const stepTotal = (step?.tasks || []).reduce(
            (taskTotal: number, task: any) =>
                taskTotal + (Number(task?.taskRequestedQuantity) || 0),
            0
        );

        return drawingTotal + stepTotal;
    }, 0);
};

export const getStepTaskRequestedQuantityTotal = (step: any): number => {
    return (step?.tasks || []).reduce(
        (taskTotal: number, task: any) => taskTotal + (Number(task?.taskRequestedQuantity) || 0),
        0
    );
};

export const getDrawingStepQuantityBalanceSummary = (drawing: any) => {
    const totalRequestedQuantity = Number(drawing?.totalRequestedQuantity) || 0;
    const steps = drawing?.orderSteps || [];
    const isSinglePiece = drawing?.productionType === 'SINGLE_PIECE';
    const balancedSteps = steps.filter((step: any) => {
        if (totalRequestedQuantity <= 0) return false;

        if (isSinglePiece) {
            return (step?.tasks || []).length === totalRequestedQuantity;
        }

        return getStepTaskRequestedQuantityTotal(step) === totalRequestedQuantity;
    }).length;

    return {
        totalRequestedQuantity,
        totalSteps: steps.length,
        balancedSteps,
        unbalancedSteps: steps.length - balancedSteps,
    };
};

export const validateOrderDrawingsTree = (
    orderDrawings: any[],
    t?: any
): PlanTreeValidationError[] => {
    const errors: PlanTreeValidationError[] = [];

    if (!orderDrawings || orderDrawings.length === 0) {
        errors.push({
            name: ['orderDrawings'],
            message: translate(t, 'orderManagement.form.planValidation.addDrawing'),
            nodeKey: '',
        });
        return errors;
    }

    orderDrawings.forEach((drawing: any, drawingIndex: number) => {
        const drawingPath = ['orderDrawings', drawingIndex];
        const drawingNodeKey = `drawing-${drawingIndex}`;
        const totalRequestedQuantity = Number(drawing?.totalRequestedQuantity);

        if (!drawing?.drawingCodeId) {
            errors.push({
                name: [...drawingPath, 'drawingCodeId'],
                message: translate(t, 'orderManagement.form.planValidation.selectDrawingCode'),
                nodeKey: drawingNodeKey,
            });
        }

        if (!totalRequestedQuantity || totalRequestedQuantity <= 0) {
            errors.push({
                name: [...drawingPath, 'totalRequestedQuantity'],
                message: translate(
                    t,
                    'orderManagement.form.planValidation.totalRequestedQuantityRequired'
                ),
                nodeKey: drawingNodeKey,
            });
        }

        if (!drawing?.productionType) {
            errors.push({
                name: [...drawingPath, 'productionType'],
                message: translate(t, 'orderManagement.form.planValidation.productionTypeRequired'),
                nodeKey: drawingNodeKey,
            });
        }

        const orderSteps = drawing?.orderSteps || [];
        if (orderSteps.length === 0) {
            errors.push({
                name: [...drawingPath, 'orderSteps'],
                message: translate(t, 'orderManagement.form.planValidation.addStep'),
                nodeKey: drawingNodeKey,
            });
        }

        orderSteps.forEach((step: any, stepIndex: number) => {
            const stepPath = [...drawingPath, 'orderSteps', stepIndex];
            const stepNodeKey = `step-${drawingIndex}-${stepIndex}`;

            if (!step?.stepName) {
                errors.push({
                    name: [...stepPath, 'stepName'],
                    message: translate(t, 'orderManagement.form.planValidation.stepNameRequired'),
                    nodeKey: stepNodeKey,
                });
            }

            if (!step?.description) {
                errors.push({
                    name: [...stepPath, 'description'],
                    message: translate(
                        t,
                        'orderManagement.form.planValidation.stepDescriptionRequired'
                    ),
                    nodeKey: stepNodeKey,
                });
            }

            if (!step?.materialName) {
                errors.push({
                    name: [...stepPath, 'materialName'],
                    message: translate(t, 'orderManagement.form.planValidation.materialRequired'),
                    nodeKey: stepNodeKey,
                });
            }

            if (
                step?.defaultCompletionTimeSeconds === undefined ||
                step?.defaultCompletionTimeSeconds === null ||
                Number(step?.defaultCompletionTimeSeconds) <= 0
            ) {
                errors.push({
                    name: [...stepPath, 'defaultCompletionTimeSeconds'],
                    message: translate(
                        t,
                        'orderManagement.form.planValidation.estimatedTimeRequired'
                    ),
                    nodeKey: stepNodeKey,
                });
            }

            const tasks = step?.tasks || [];
            if (tasks.length === 0) {
                errors.push({
                    name: [...stepPath, 'tasks'],
                    message: translate(t, 'orderManagement.form.planValidation.addTask'),
                    nodeKey: stepNodeKey,
                });
            }

            const stepRequestedQuantityTotal = getStepTaskRequestedQuantityTotal(step);
            if (
                drawing?.productionType !== 'SINGLE_PIECE' &&
                totalRequestedQuantity > 0 &&
                tasks.length > 0 &&
                stepRequestedQuantityTotal !== totalRequestedQuantity
            ) {
                errors.push({
                    name: [...stepPath, 'tasks'],
                    message: translate(
                        t,
                        'orderManagement.form.planValidation.stepQuantityMismatch',
                        {
                            stepTotal: stepRequestedQuantityTotal,
                            drawingTotal: totalRequestedQuantity,
                        }
                    ),
                    nodeKey: stepNodeKey,
                });
            }

            if (
                drawing?.productionType === 'SINGLE_PIECE' &&
                totalRequestedQuantity > 0 &&
                tasks.length !== totalRequestedQuantity
            ) {
                errors.push({
                    name: [...stepPath, 'tasks'],
                    message: translate(
                        t,
                        'orderManagement.form.planValidation.singlePieceTaskCountMismatch',
                        {
                            taskCount: tasks.length,
                            drawingTotal: totalRequestedQuantity,
                        }
                    ),
                    nodeKey: stepNodeKey,
                });
            }

            tasks.forEach((task: any, taskIndex: number) => {
                const taskPath = [...stepPath, 'tasks', taskIndex];
                const taskNodeKey = `task-${drawingIndex}-${stepIndex}-${taskIndex}`;
                const taskRequestedQuantity = Number(task?.taskRequestedQuantity);
                const taskPlannedQuantity = Number(task?.taskPlannedQuantity);

                if (!task?.taskName) {
                    errors.push({
                        name: [...taskPath, 'taskName'],
                        message: translate(
                            t,
                            'orderManagement.form.planValidation.taskNameRequired'
                        ),
                        nodeKey: taskNodeKey,
                    });
                }

                if (!taskRequestedQuantity || taskRequestedQuantity <= 0) {
                    errors.push({
                        name: [...taskPath, 'taskRequestedQuantity'],
                        message: translate(
                            t,
                            'orderManagement.form.planValidation.requestedQuantityRequired'
                        ),
                        nodeKey: taskNodeKey,
                    });
                } else if (
                    drawing?.productionType === 'SINGLE_PIECE' &&
                    taskRequestedQuantity !== 1
                ) {
                    errors.push({
                        name: [...taskPath, 'taskRequestedQuantity'],
                        message: translate(
                            t,
                            'orderManagement.form.planValidation.singlePieceRequestedQuantity'
                        ),
                        nodeKey: taskNodeKey,
                    });
                }

                if (!taskPlannedQuantity || taskPlannedQuantity <= 0) {
                    errors.push({
                        name: [...taskPath, 'taskPlannedQuantity'],
                        message: translate(
                            t,
                            'orderManagement.form.planValidation.plannedQuantityRequired'
                        ),
                        nodeKey: taskNodeKey,
                    });
                } else if (taskRequestedQuantity && taskPlannedQuantity < taskRequestedQuantity) {
                    errors.push({
                        name: [...taskPath, 'taskPlannedQuantity'],
                        message: translate(
                            t,
                            'orderManagement.form.planValidation.plannedQuantityMinRequested'
                        ),
                        nodeKey: taskNodeKey,
                    });
                }
            });
        });
    });

    return errors;
};

export const findRequestedQuantityMismatch = (orderDrawings: any[]) => {
    const drawingIndex = (orderDrawings || []).findIndex((drawing: any) => {
        const totalRequestedQuantity = Number(drawing?.totalRequestedQuantity);

        return (
            !totalRequestedQuantity ||
            totalRequestedQuantity <= 0 ||
            (drawing?.orderSteps || []).some((step: any) =>
                drawing?.productionType === 'SINGLE_PIECE'
                    ? (step?.tasks || []).length !== totalRequestedQuantity
                    : getStepTaskRequestedQuantityTotal(step) !== totalRequestedQuantity
            )
        );
    });

    if (drawingIndex === -1) {
        return null;
    }

    const drawing = orderDrawings[drawingIndex];

    return {
        drawing,
        drawingIndex,
        totalRequestedQuantity: Number(drawing?.totalRequestedQuantity) || 0,
        taskRequestedQuantityTotal: getDrawingTaskRequestedQuantityTotal(drawing),
    };
};

export const createOrderCodeRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.orderCodeRequired'),
    },
    {
        min: 3,
        message: t('orderManagement.form.validation.orderCodeMin'),
    },
    {
        max: 50,
        message: t('orderManagement.form.validation.orderCodeMax'),
    },
];

export const createOrderNameRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.orderNameRequired'),
    },
    {
        min: 3,
        message: t('orderManagement.form.validation.orderNameMin'),
    },
    {
        max: 200,
        message: t('orderManagement.form.validation.orderNameMax'),
    },
];

export const createCustomerNameRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.customerNameRequired'),
    },
    {
        min: 2,
        message: t('orderManagement.form.validation.customerNameMin'),
    },
    {
        max: 200,
        message: t('orderManagement.form.validation.customerNameMax'),
    },
];

export const createCustomerPhoneRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.customerPhoneRequired'),
    },
    {
        pattern: /^[0-9]*$/,
        message: t('orderManagement.form.validation.phonePattern'),
    },
    {
        max: 20,
        message: t('orderManagement.form.validation.phoneMaxLength'),
    },
];

export const createCustomerNoteRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.customerNoteRequired'),
    },
    {
        max: 2000,
        message: t('orderManagement.form.validation.customerNoteMax'),
    },
];

export const createExpectedEndDateRules = (t: any): Rule[] => [
    ({ getFieldValue }) => ({
        validator(_, value) {
            const startDate = getFieldValue('expectedStartDate');
            if (!value || !startDate) {
                return Promise.resolve();
            }
            if (value.isBefore(startDate)) {
                return Promise.reject(
                    new Error(t('orderManagement.form.validation.endDateBeforeStart'))
                );
            }
            return Promise.resolve();
        },
    }),
];

export const createOrderQuantityRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.task.qtyRequired'),
    },
];

export const createOrderPriorityRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.orderPriorityRequired'),
    },
];

export const createOrderDrawingsRules = (t: any): Rule[] => [
    {
        validator: (_, value) => {
            if (!value || value.length === 0) {
                return Promise.reject(
                    new Error(t('orderManagement.form.validation.orderDrawingsRequired'))
                );
            }
            return Promise.resolve();
        },
    },
];

// Step validators
export const createStepNameRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.stepNameRequired'),
    },
    {
        max: 100,
        message: t('orderManagement.form.validation.stepNameMax'),
    },
];

export const createStepDescriptionRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.stepDescriptionRequired'),
    },
    {
        max: 2000,
        message: t('orderManagement.form.validation.stepDescriptionMax'),
    },
];

export const createRequiresQcRules = (_t: any): Rule[] => [];

export const createDefaultCompletionTimeRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.defaultCompletionTimeRequired'),
    },
    {
        validator: (_, value) => {
            if (value && value <= 0) {
                return Promise.reject(
                    new Error(t('orderManagement.form.validation.defaultCompletionTimePositive'))
                );
            }
            return Promise.resolve();
        },
    },
];

export const createMaterialNameRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.materialNameRequired'),
    },
    {
        max: 2000,
        message: t('orderManagement.form.validation.materialNameMax'),
    },
];

export const createStepTasksRules = (t: any): Rule[] => [
    {
        validator: (_, value) => {
            if (!value || value.length === 0) {
                return Promise.reject(
                    new Error(t('orderManagement.form.validation.stepTasksRequired'))
                );
            }
            return Promise.resolve();
        },
    },
];

// Task validators
export const createTaskNameRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.taskNameRequired'),
    },
    {
        max: 100,
        message: t('orderManagement.form.validation.taskNameMax'),
    },
];

export const createTaskRequestedQuantityRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.taskRequestedQuantityRequired'),
    },
    {
        validator: (_, value) => {
            if (value && value <= 0) {
                return Promise.reject(
                    new Error(t('orderManagement.form.validation.taskRequestedQuantityPositive'))
                );
            }
            return Promise.resolve();
        },
    },
];

export const createTaskPlannedQuantityRules = (t: any): Rule[] => [
    {
        required: true,
        message: t('orderManagement.form.validation.taskPlannedQuantityRequired'),
    },
    {
        validator: (_, value) => {
            if (value && value <= 0) {
                return Promise.reject(
                    new Error(t('orderManagement.form.validation.taskPlannedQuantityPositive'))
                );
            }
            return Promise.resolve();
        },
    },
];
