'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormInstance, Card, Typography } from 'antd';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { type SelectedNode, parseNodeKey } from '../../utils/treeMappers';
import { DrawingDetailForm } from './DrawingDetailForm';
import { StepDetailForm } from './StepDetailForm';
import { TaskDetailForm } from './TaskDetailForm';

const { Text } = Typography;

interface DetailPanelRouterProps {
    selectedNode: SelectedNode | null;
    form: FormInstance;
    drawingTemplates: DrawingCodePickingResponse[];
    operators: any[];
    isLoadingOperators: boolean;
    onQuickCreate: (drawingIndex: number) => void;
    setSelectedNode: (node: SelectedNode) => void;
    setExpandedKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
    showTaskReviews?: boolean;
}

const DetailPanelRouterComponent: React.FC<DetailPanelRouterProps> = ({
    selectedNode,
    form,
    drawingTemplates,
    operators,
    isLoadingOperators,
    onQuickCreate,
    setSelectedNode,
    setExpandedKeys,
    showTaskReviews = true,
}) => {
    const { t } = useTranslation();

    if (!selectedNode) {
        return (
            <Card bordered={false}>
                <Text type="secondary">{t('orderManagement.form.plan.selectNodeHint')}</Text>
            </Card>
        );
    }

    const { type, indices } = parseNodeKey(selectedNode.key);

    if (type === 'drawing') {
        const [drawingIndex] = indices;
        return (
            <DrawingDetailForm
                drawingIndex={drawingIndex}
                form={form}
                drawingTemplates={drawingTemplates}
                onQuickCreate={onQuickCreate}
                setSelectedNode={setSelectedNode}
                setExpandedKeys={setExpandedKeys}
            />
        );
    }

    if (type === 'step') {
        const [drawingIndex, stepIndex] = indices;
        return (
            <StepDetailForm
                drawingIndex={drawingIndex}
                stepIndex={stepIndex}
                form={form}
                setSelectedNode={setSelectedNode}
                setExpandedKeys={setExpandedKeys}
            />
        );
    }

    // type === 'task'
    const [drawingIndex, stepIndex, taskIndex] = indices;
    return (
        <TaskDetailForm
            drawingIndex={drawingIndex}
            stepIndex={stepIndex}
            taskIndex={taskIndex}
            form={form}
            operators={operators}
            isLoadingOperators={isLoadingOperators}
            showReviews={showTaskReviews}
        />
    );
};

export const DetailPanelRouter = React.memo(
    DetailPanelRouterComponent,
    (prev, next) =>
        prev.selectedNode?.key === next.selectedNode?.key &&
        prev.form === next.form &&
        prev.drawingTemplates === next.drawingTemplates &&
        prev.operators === next.operators &&
        prev.isLoadingOperators === next.isLoadingOperators &&
        prev.onQuickCreate === next.onQuickCreate &&
        prev.setSelectedNode === next.setSelectedNode &&
        prev.setExpandedKeys === next.setExpandedKeys &&
        prev.showTaskReviews === next.showTaskReviews
);
