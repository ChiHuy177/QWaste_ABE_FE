'use client';

import { useState } from 'react';
import { FormInstance } from 'antd';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseOrderFormStepsProps {
    form: FormInstance;
    totalSteps: number;
    validateDrawingStep?: () => Promise<void> | void;
}

export const useOrderFormSteps = ({ form, totalSteps, validateDrawingStep }: UseOrderFormStepsProps) => {
    const { t } = useTranslation();

    // Local UI state - không cần Redux
    const [currentStep, setCurrentStep] = useState(0);
    const [allowSubmit, setAllowSubmit] = useState(false);
    const [stepErrorIndex, setStepErrorIndex] = useState<number | null>(null);

    const validateStep = async (stepIndex: number) => {
        if (stepIndex === 0) {
            await form.validateFields([
                'orderCode',
                'orderName',
                'orderPriority',
                'customerName',
                'customerPhone',
                'customerNote',
            ]);
        } else if (stepIndex === 1) {
            if (validateDrawingStep) {
                await validateDrawingStep();
            } else {
                await form.validateFields();
            }
        }
    };

    const getErrorStepIndex = (errorFields: any[]) => {
        const firstErrorName = errorFields[0]?.name || [];
        return firstErrorName[0] === 'orderDrawings' ? 1 : 0;
    };

    const handleValidationError = (error: any) => {
        const errorFields = error?.errorFields || [];
        if (errorFields.length > 0) {
            setStepErrorIndex(getErrorStepIndex(errorFields));
            const firstErrorField = errorFields[0].name;
            const firstErrorMessage = errorFields[0]?.errors?.[0];
            form.scrollToField(firstErrorField, {
                behavior: 'smooth',
                block: 'center',
            });
            toast.error(
                firstErrorMessage ||
                    t('orderManagement.form.validation.formErrors', {
                        count: errorFields.length,
                    })
            );
        } else {
            setStepErrorIndex(currentStep);
            toast.error(t('orderManagement.form.validation.requiredFields'));
        }
    };

    const handleNext = async () => {
        try {
            await validateStep(currentStep);
            setStepErrorIndex(null);
            setCurrentStep(currentStep + 1);
        } catch (error: any) {
            handleValidationError(error);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepChange = async (targetStep: number) => {
        if (targetStep === currentStep || targetStep < 0 || targetStep >= totalSteps) {
            return;
        }

        if (targetStep < currentStep) {
            setCurrentStep(targetStep);
            return;
        }

        try {
            for (let stepIndex = currentStep; stepIndex < targetStep; stepIndex += 1) {
                await validateStep(stepIndex);
            }
            setStepErrorIndex(null);
            setCurrentStep(targetStep);
        } catch (error: any) {
            handleValidationError(error);
        }
    };

    const resetStep = () => {
        setCurrentStep(0);
        setAllowSubmit(false);
        setStepErrorIndex(null);
    };

    return {
        currentStep,
        setCurrentStep,
        allowSubmit,
        setAllowSubmit,
        stepErrorIndex,
        setStepErrorIndex,
        handleNext,
        handleBack,
        handleStepChange,
        resetStep,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === totalSteps - 1,
    };
};
