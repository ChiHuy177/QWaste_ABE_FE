'use client';

import React from 'react';
import { FormInstance } from 'antd';
import { Space, theme } from 'antd';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { PlanTabTreeView } from '../Tabs/PlanTabTreeView';

const { useToken } = theme;

interface DrawingConfigStepProps {
    form: FormInstance;
    drawingTemplates: DrawingCodePickingResponse[];
    productionType: string;
    operators: any[];
    isLoadingOperators: boolean;
    onQuickCreate: (drawingIndex: number) => void;
    focusNodeKey?: string | null;
    onFocusNodeHandled?: () => void;
    validationVersion?: number;
    showTaskReviews?: boolean;
    rootError?: string | null;
}

export const DrawingConfigStep: React.FC<DrawingConfigStepProps> = ({
    form,
    drawingTemplates,
    productionType,
    operators,
    isLoadingOperators,
    onQuickCreate,
    focusNodeKey,
    onFocusNodeHandled,
    validationVersion,
    showTaskReviews = false,
    rootError,
}) => {
    const { token } = useToken();

    return (
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
            <div
                style={{
                    padding: '20px',
                    background: token.colorBgLayout,
                    borderRadius: 12,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    minHeight: 400,
                }}
            >
                <PlanTabTreeView
                    form={form}
                    drawingTemplates={drawingTemplates}
                    productionType={productionType}
                    onQuickCreate={onQuickCreate}
                    operators={operators}
                    isLoadingOperators={isLoadingOperators}
                    focusNodeKey={focusNodeKey}
                    onFocusNodeHandled={onFocusNodeHandled}
                    validationVersion={validationVersion}
                    showTaskReviews={showTaskReviews}
                    rootError={rootError}
                />
            </div>
        </Space>
    );
};
