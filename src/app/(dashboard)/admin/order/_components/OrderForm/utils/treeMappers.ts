import React from 'react';
import { FormInstance } from 'antd';
import type { TreeDataNode } from 'antd';
import { FileTextOutlined, NodeIndexOutlined, CarryOutOutlined } from '@ant-design/icons';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import {
    getDrawingStepQuantityBalanceSummary,
    getStepTaskRequestedQuantityTotal,
} from './validators';

export type NodeType = 'drawing' | 'step' | 'task';

export interface ParsedNodeKey {
    type: NodeType;
    indices: number[];
}

export interface SelectedNode {
    key: string;
    type: NodeType;
}

/**
 * Get drawing title from drawing data
 */
const getDrawingTitle = (drawing: any, templates: DrawingCodePickingResponse[], t: any): string => {
    if (!drawing?.drawingCodeId) {
        return t('orderManagement.form.plan.unnamedDrawing');
    }

    const template = templates.find((t) => t.drawingCodeId === drawing.drawingCodeId);
    return template?.drawingCode || drawing?._metadata?.drawingCode || drawing.drawingCodeId;
};

/**
 * Convert orderDrawings form data to tree structure
 */
export const formToTreeData = (
    orderDrawings: any[],
    templates: DrawingCodePickingResponse[] = [],
    t: any
): TreeDataNode[] => {
    return (orderDrawings || []).map((drawing, dIdx) => {
        const safeDrawing = drawing || {};

        return {
            key: `drawing-${dIdx}`,
            title: `${dIdx + 1}.0: ${getDrawingTitle(safeDrawing, templates, t)}`,
            icon: React.createElement(FileTextOutlined, { style: { color: '#1890ff' } }),
            children: (safeDrawing.orderSteps || []).map((step: any, sIdx: number) => {
                const safeStep = step || {};

                return {
                    key: `step-${dIdx}-${sIdx}`,
                    title: `${dIdx + 1}.${sIdx + 1}: ${
                        safeStep.stepName || t('orderManagement.form.plan.unnamedStep')
                    }`,
                    icon: React.createElement(NodeIndexOutlined, { style: { color: '#722ed1' } }),
                    children: (safeStep.tasks || []).map((task: any, tIdx: number) => {
                        const safeTask = task || {};

                        return {
                            key: `task-${dIdx}-${sIdx}-${tIdx}`,
                            title: `${dIdx + 1}.${sIdx + 1}.${tIdx + 1}: ${
                                safeTask.taskName || t('orderManagement.form.plan.unnamedTask')
                            }`,
                            icon: React.createElement(CarryOutOutlined, {
                                style: { color: '#52c41a' },
                            }),
                        };
                    }),
                };
            }),
        };
    });
};

/**
 * Parse node key to extract type and indices
 * @example parseNodeKey('step-2-1') => { type: 'step', indices: [2, 1] }
 */
export const parseNodeKey = (key: string): ParsedNodeKey => {
    const parts = key.split('-');
    const type = parts[0] as NodeType;
    const indices = parts.slice(1).map(Number);
    return { type, indices };
};

/**
 * Get form field path from node key
 * @example nodeKeyToFieldPath('task-0-1-2') => ['orderDrawings', 0, 'orderSteps', 1, 'tasks', 2]
 */
export const nodeKeyToFieldPath = (key: string): (string | number)[] => {
    const { type, indices } = parseNodeKey(key);

    if (type === 'drawing') {
        return ['orderDrawings', indices[0]];
    } else if (type === 'step') {
        return ['orderDrawings', indices[0], 'orderSteps', indices[1]];
    } else {
        return ['orderDrawings', indices[0], 'orderSteps', indices[1], 'tasks', indices[2]];
    }
};

/**
 * Convert a form field path back to the owning tree node key.
 * This is used after validation fails so the detail panel for that field is mounted.
 */
export const fieldPathToNodeKey = (name: (string | number)[]): string | null => {
    if (!name || name[0] !== 'orderDrawings' || typeof name[1] !== 'number') {
        return null;
    }

    const drawingIndex = name[1];
    const stepIndex = name[3];
    const taskIndex = name[5];

    if (name[2] === 'orderSteps' && typeof stepIndex === 'number') {
        if (name[4] === 'tasks' && typeof taskIndex === 'number') {
            return `task-${drawingIndex}-${stepIndex}-${taskIndex}`;
        }

        return `step-${drawingIndex}-${stepIndex}`;
    }

    return `drawing-${drawingIndex}`;
};

const hasTouchedField = (form: FormInstance, paths: (string | number)[][]): boolean => {
    return paths.some((path) => form.isFieldTouched(path));
};

/**
 * Get validation status for a node
 */
export const getNodeValidationStatus = (
    nodeKey: string,
    form: FormInstance
): 'complete' | 'incomplete' | 'new' => {
    const { type, indices } = parseNodeKey(nodeKey);

    if (type === 'drawing') {
        const [dIdx] = indices;
        const path = ['orderDrawings', dIdx];

        // Check drawing-level errors
        const hasDrawingError =
            form.getFieldError([...path, 'drawingCodeId']).length > 0 ||
            form.getFieldError([...path, 'totalRequestedQuantity']).length > 0 ||
            form.getFieldError([...path, 'productionType']).length > 0;

        // Check nested step errors
        const steps = form.getFieldValue([...path, 'orderSteps']) || [];
        const hasNestedErrors = steps.some(
            (_: any, sIdx: number) =>
                getNodeValidationStatus(`step-${dIdx}-${sIdx}`, form) === 'incomplete'
        );

        if (hasDrawingError || hasNestedErrors) return 'incomplete';

        // Check if required fields filled
        const drawing = form.getFieldValue(path);
        const missingRequiredFields = [
            !drawing?.drawingCodeId && [...path, 'drawingCodeId'],
            !drawing?.totalRequestedQuantity && [...path, 'totalRequestedQuantity'],
        ].filter(Boolean) as (string | number)[][];

        if (missingRequiredFields.length > 0) {
            return hasTouchedField(form, missingRequiredFields) ? 'incomplete' : 'new';
        }

        const stepBalance = getDrawingStepQuantityBalanceSummary(drawing);
        if (stepBalance.unbalancedSteps > 0) {
            return 'incomplete';
        }

        return 'complete';
    } else if (type === 'step') {
        const [dIdx, sIdx] = indices;
        const path = ['orderDrawings', dIdx, 'orderSteps', sIdx];

        // Check step-level errors
        const hasStepError =
            form.getFieldError([...path, 'stepName']).length > 0 ||
            form.getFieldError([...path, 'description']).length > 0 ||
            form.getFieldError([...path, 'materialName']).length > 0 ||
            form.getFieldError([...path, 'defaultCompletionTimeSeconds']).length > 0 ||
            form.getFieldError([...path, 'tasks']).length > 0;

        // Check nested task errors
        const tasks = form.getFieldValue([...path, 'tasks']) || [];
        const hasTaskErrors = tasks.some(
            (_: any, tIdx: number) =>
                getNodeValidationStatus(`task-${dIdx}-${sIdx}-${tIdx}`, form) === 'incomplete'
        );

        if (hasStepError || hasTaskErrors) return 'incomplete';
        if (tasks.length === 0) return 'incomplete';

        // Check if required fields filled
        const step = form.getFieldValue(path);
        const missingRequiredFields = [
            !step?.stepName && [...path, 'stepName'],
            !step?.description && [...path, 'description'],
            !step?.materialName && [...path, 'materialName'],
            !step?.defaultCompletionTimeSeconds && [...path, 'defaultCompletionTimeSeconds'],
        ].filter(Boolean) as (string | number)[][];

        if (missingRequiredFields.length > 0) {
            return hasTouchedField(form, missingRequiredFields) ? 'incomplete' : 'new';
        }

        const drawing = form.getFieldValue(['orderDrawings', dIdx]);
        const drawingTotalRequestedQuantity = Number(drawing?.totalRequestedQuantity);
        if (
            drawing?.productionType !== 'SINGLE_PIECE' &&
            drawingTotalRequestedQuantity > 0 &&
            tasks.length > 0 &&
            getStepTaskRequestedQuantityTotal(step) !== drawingTotalRequestedQuantity
        ) {
            return 'incomplete';
        }

        if (
            drawing?.productionType === 'SINGLE_PIECE' &&
            drawingTotalRequestedQuantity > 0 &&
            tasks.length !== drawingTotalRequestedQuantity
        ) {
            return 'incomplete';
        }

        return 'complete';
    } else {
        // task
        const [dIdx, sIdx, tIdx] = indices;
        const path = ['orderDrawings', dIdx, 'orderSteps', sIdx, 'tasks', tIdx];

        // Check task-level errors
        const hasTaskError =
            form.getFieldError([...path, 'taskName']).length > 0 ||
            form.getFieldError([...path, 'taskRequestedQuantity']).length > 0 ||
            form.getFieldError([...path, 'taskPlannedQuantity']).length > 0 ||
            form.getFieldError([...path, 'operatorIds']).length > 0;

        if (hasTaskError) return 'incomplete';

        // Check if required fields filled
        const task = form.getFieldValue(path);
        const missingRequiredFields = [
            !task?.taskName && [...path, 'taskName'],
            !task?.taskRequestedQuantity && [...path, 'taskRequestedQuantity'],
            !task?.taskPlannedQuantity && [...path, 'taskPlannedQuantity'],
        ].filter(Boolean) as (string | number)[][];

        if (missingRequiredFields.length > 0) {
            return hasTouchedField(form, missingRequiredFields) ? 'incomplete' : 'new';
        }

        return 'complete';
    }
};

/**
 * Get all parent keys for a given node key (for auto-expand)
 * @example getPathToNode('task-0-1-2') => ['drawing-0', 'step-0-1', 'task-0-1-2']
 */
export const getPathToNode = (key: string): string[] => {
    const { indices } = parseNodeKey(key);

    const path: string[] = [];

    if (indices.length >= 1) {
        path.push(`drawing-${indices[0]}`);
    }
    if (indices.length >= 2) {
        path.push(`step-${indices[0]}-${indices[1]}`);
    }
    if (indices.length >= 3) {
        path.push(`task-${indices[0]}-${indices[1]}-${indices[2]}`);
    }

    return path;
};
