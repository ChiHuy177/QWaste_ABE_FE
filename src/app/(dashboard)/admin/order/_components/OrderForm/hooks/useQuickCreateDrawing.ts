'use client';

import { useState } from 'react';
import { DrawingCodePickingResponse } from '@/types/DrawingCode';
import { FormInstance } from 'antd';

interface QuickCreateState {
    open: boolean;
    targetDrawingIndex: number;
}

export const useQuickCreateDrawing = (form: FormInstance) => {
    const [quickCreateState, setQuickCreateState] = useState<QuickCreateState>({
        open: false,
        targetDrawingIndex: 0,
    });

    const handleQuickCreateOpen = (drawingIndex: number) => {
        setQuickCreateState({ open: true, targetDrawingIndex: drawingIndex });
    };

    const handleQuickCreateClose = () => {
        setQuickCreateState((prev) => ({ ...prev, open: false }));
    };

    const handleQuickCreated = (newDrawingCode: DrawingCodePickingResponse) => {
        // Auto-select the new drawing code in the target drawing item
        const currentDrawings = form.getFieldValue('orderDrawings') || [];
        const updatedDrawings = currentDrawings.map((drawing: any, idx: number) =>
            idx === quickCreateState.targetDrawingIndex
                ? { ...drawing, drawingCodeId: newDrawingCode.drawingCodeId }
                : drawing
        );
        form.setFieldValue('orderDrawings', updatedDrawings);
    };

    return {
        quickCreateState,
        handleQuickCreateOpen,
        handleQuickCreateClose,
        handleQuickCreated,
    };
};
